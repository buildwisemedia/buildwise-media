#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PROPERTY_ID = '422160329';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Only provider-confirmed delivery counts as a durable receipt. Pre-delivery
// statuses stay pending; anything else (bounced, failed, complained, unknown)
// fails closed.
const DELIVERED_EMAIL_STATUSES = new Set(['delivered', 'opened', 'clicked']);
const PENDING_EMAIL_STATUSES = new Set(['queued', 'accepted', 'sent']);

export function assertSubmissionId(value) {
  const submissionId = String(value || '').trim();
  if (!UUID_RE.test(submissionId)) throw new Error('submission_id must be a UUID');
  return submissionId;
}

export function ga4StartDate(submittedAt, now = new Date()) {
  const submitted = new Date(submittedAt);
  if (Number.isNaN(submitted.getTime())) return '90daysAgo';
  const latestAllowed = Math.min(submitted.getTime(), now.getTime());
  return new Date(latestAllowed - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function advertisingStates(value, states = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => advertisingStates(entry, states));
  } else if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      if (key === 'state' && typeof entry === 'string') states.push(entry);
      else advertisingStates(entry, states);
    }
  }
  return states;
}

export function evaluateReceipt({
  submissionId,
  ga4Rows,
  submissionRows,
  commsRows,
  outcomeRows,
  outcomeSourceAvailable = true,
}) {
  const ga4Events = new Set(
    ga4Rows
      .filter((row) => row.submission_id === submissionId)
      .map((row) => row.event_name),
  );
  const submission = submissionRows.find((row) => row.id === submissionId) || null;
  const outcome = outcomeRows.find((row) => row.submission_id === submissionId) || null;
  const matchingComms = commsRows.filter((row) => row.contact_id === submission?.contact_id);
  const emailStatus = (row) => String(row.status || '').trim().toLowerCase();
  const deliveredComms = matchingComms.filter((row) => DELIVERED_EMAIL_STATUSES.has(emailStatus(row)));
  const pendingComms = matchingComms.filter((row) => PENDING_EMAIL_STATUSES.has(emailStatus(row)));
  const outcomeIdentityMatches = !outcome || outcome.contact_id === submission?.contact_id;
  const syntheticAdvertisingStates = advertisingStates(outcome?.advertising_feedback);
  const isSynthetic = submission?.is_synthetic === true || outcome?.is_synthetic === true;
  const syntheticPolicyVerified = !isSynthetic || Boolean(
    outcome
      && outcome.is_synthetic === true
      && outcome.lead_state === 'excluded_synthetic'
      && outcome.business_lead_identity == null
      && (outcome.advertising_feedback == null
        || (syntheticAdvertisingStates.length > 0
          && syntheticAdvertisingStates.every((state) => state === 'canary_blocked'))),
  );
  const ga4Complete = ga4Events.has('fit_note_submitted') && ga4Events.has('generate_lead');
  const state = !submission
    ? 'CRM_MISSING'
    : matchingComms.length === 0
      ? 'EMAIL_RECEIPT_MISSING'
      : matchingComms.length > 1
        ? 'DUPLICATE_EMAIL_RECEIPTS'
        : deliveredComms.length === 0 && pendingComms.length === 0
          ? 'EMAIL_RECEIPT_UNSUCCESSFUL'
          : deliveredComms.length === 0
            ? 'EMAIL_RECEIPT_PENDING'
            : !outcomeSourceAvailable
              ? 'OUTCOME_SOURCE_UNAVAILABLE'
              : !outcome
                ? 'OUTCOME_PENDING'
                : !outcomeIdentityMatches
                  ? 'OUTCOME_IDENTITY_MISMATCH'
                  : !syntheticPolicyVerified
                    ? 'SYNTHETIC_POLICY_VIOLATION'
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
    successful_email_receipt_count: deliveredComms.length,
    pending_email_receipt_count: pendingComms.length,
    outcome_source_available: outcomeSourceAvailable,
    source_to_outcome_found: Boolean(outcome),
    outcome_identity_verified: Boolean(outcome) && outcomeIdentityMatches,
    synthetic_excluded: isSynthetic && syntheticPolicyVerified,
    synthetic_policy_verified: syntheticPolicyVerified,
    per_source: {
      ga4: ga4Complete ? 'observed' : 'pending',
      crm_submission: submission ? 'observed' : 'absent',
      email_receipt: deliveredComms.length > 0
        ? 'observed'
        : pendingComms.length > 0
          ? 'pending'
          : matchingComms.length > 0
            ? 'invalid'
            : 'absent',
      source_to_outcome: !outcomeSourceAvailable
        ? 'unavailable'
        : outcomeIdentityMatches && outcome
          ? 'observed'
          : outcome
            ? 'invalid'
            : 'pending',
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

function ga4RowsFor(submissionId, submittedAt) {
  const body = JSON.stringify({
    dateRanges: [{ startDate: ga4StartDate(submittedAt), endDate: 'today' }],
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
  // A missing optional source is reported as unavailable, never as an empty
  // (pending) result, so the caller cannot mistake a dropped view for no outcome.
  if (optional && response.status === 404) return null;
  if (!response.ok) throw new Error(`Supabase read failed (${response.status}) for ${path.split('?')[0]}`);
  return response.json();
}

export async function reconcile(submissionId) {
  const id = assertSubmissionId(submissionId);
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_KEY', ['SUPABASE_SERVICE_ROLE_KEY']);
  const encoded = encodeURIComponent(id);
  const [submissionRows, commsRows, outcomeSource] = await Promise.all([
    supabaseRows(`lead_submissions?id=eq.${encoded}&select=id,contact_id,status,is_synthetic,submitted_at,form_id,form_version`, supabaseUrl, serviceKey),
    supabaseRows(`comms_log?metadata->>submission_id=eq.${encoded}&select=id,contact_id,status,created_at`, supabaseUrl, serviceKey),
    supabaseRows(`v_bwm_book_source_to_outcome?submission_id=eq.${encoded}&select=*`, supabaseUrl, serviceKey, { optional: true }),
  ]);
  const outcomeSourceAvailable = outcomeSource !== null;
  const outcomeRows = outcomeSource || [];
  const ga4Rows = submissionRows[0]
    ? ga4RowsFor(id, submissionRows[0].submitted_at)
    : [];
  return {
    generated_at: new Date().toISOString(),
    property_id: PROPERTY_ID,
    ...evaluateReceipt({
      submissionId: id,
      ga4Rows,
      submissionRows,
      commsRows,
      outcomeRows,
      outcomeSourceAvailable,
    }),
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
