#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PROPERTY_ID = '422160329';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertSubmissionId(value) {
  const submissionId = String(value || '').trim();
  if (!UUID_RE.test(submissionId)) throw new Error('submission_id must be a UUID');
  return submissionId;
}

export function evaluateReceipt({ submissionId, ga4Rows, submissionRows, commsRows, outcomeRows }) {
  const ga4Events = new Set(
    ga4Rows
      .filter((row) => row.submission_id === submissionId)
      .map((row) => row.event_name),
  );
  const submission = submissionRows.find((row) => row.id === submissionId) || null;
  const outcome = outcomeRows.find((row) => row.submission_id === submissionId) || null;
  const matchingComms = commsRows.filter((row) => row.contact_id === submission?.contact_id);
  const ga4Complete = ga4Events.has('fit_note_submitted') && ga4Events.has('generate_lead');
  const state = !submission
    ? 'CRM_MISSING'
    : matchingComms.length === 0
      ? 'EMAIL_RECEIPT_MISSING'
      : matchingComms.length > 1
        ? 'DUPLICATE_EMAIL_RECEIPTS'
        : !outcome
          ? 'OUTCOME_PENDING'
          : !ga4Complete
            ? 'GA4_PENDING'
            : 'JOIN_VERIFIED';
  return {
    state,
    submission_id: submissionId,
    contact_id: submission?.contact_id || null,
    ga4_events: [...ga4Events].sort(),
    ga4_complete: ga4Complete,
    crm_submission_found: Boolean(submission),
    email_receipt_count: matchingComms.length,
    source_to_outcome_found: Boolean(outcome),
    synthetic_excluded: outcome?.lead_state === 'excluded_synthetic' || submission?.is_synthetic === true,
    per_source: {
      ga4: ga4Complete ? 'observed' : 'pending',
      crm_submission: submission ? 'observed' : 'absent',
      email_receipt: matchingComms.length > 0 ? 'observed' : 'absent',
      source_to_outcome: outcome ? 'observed' : 'pending',
      advertising_provider: 'not_applicable',
    },
  };
}

function requireEnv(name, aliases = []) {
  for (const key of [name, ...aliases]) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  throw new Error(`${name} is required`);
}

function ga4RowsFor(submissionId) {
  const body = JSON.stringify({
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'eventName' }, { name: 'customEvent:submission_id' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'customEvent:submission_id',
        stringFilter: { matchType: 'EXACT', value: submissionId },
      },
    },
  });
  const result = JSON.parse(execFileSync('bwm-ga4', ['report', PROPERTY_ID, body], { encoding: 'utf8' }));
  if (result.error) throw new Error(`GA4 query failed: ${result.error.message || 'unknown error'}`);
  return (result.rows || []).map((row) => ({
    event_name: row.dimensionValues?.[0]?.value || '',
    submission_id: row.dimensionValues?.[1]?.value || '',
    event_count: Number(row.metricValues?.[0]?.value || 0),
  }));
}

async function supabaseRows(path, supabaseUrl, serviceKey, { optional = false } = {}) {
  const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/${path}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: 'application/json',
    },
  });
  if (optional && response.status === 404) return [];
  if (!response.ok) throw new Error(`Supabase read failed (${response.status}) for ${path.split('?')[0]}`);
  return response.json();
}

export async function reconcile(submissionId) {
  const id = assertSubmissionId(submissionId);
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_KEY', ['SUPABASE_SERVICE_ROLE_KEY']);
  const encoded = encodeURIComponent(id);
  const [ga4Rows, submissionRows, commsRows, outcomeRows] = await Promise.all([
    Promise.resolve().then(() => ga4RowsFor(id)),
    supabaseRows(`lead_submissions?id=eq.${encoded}&select=id,contact_id,status,is_synthetic,submitted_at,form_id,form_version`, supabaseUrl, serviceKey),
    supabaseRows(`comms_log?metadata->>submission_id=eq.${encoded}&select=id,contact_id,status,created_at`, supabaseUrl, serviceKey),
    supabaseRows(`v_bwm_book_source_to_outcome?submission_id=eq.${encoded}&select=*`, supabaseUrl, serviceKey, { optional: true }),
  ]);
  return {
    generated_at: new Date().toISOString(),
    property_id: PROPERTY_ID,
    ...evaluateReceipt({ submissionId: id, ga4Rows, submissionRows, commsRows, outcomeRows }),
    ga4: ga4Rows,
    crm_submission: submissionRows[0] || null,
    comms_receipts: commsRows,
    source_to_outcome: outcomeRows[0] || null,
  };
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const receipt = await reconcile(process.argv[2]);
    process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
    process.exitCode = receipt.state === 'JOIN_VERIFIED' ? 0 : 2;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
