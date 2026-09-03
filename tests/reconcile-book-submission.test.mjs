import test from 'node:test';
import assert from 'node:assert/strict';

import { assertSubmissionId, evaluateReceipt, ga4StartDate } from '../scripts/reconcile-book-submission.mjs';

const submissionId = '11111111-1111-4111-8111-111111111111';

test('requires one canonical UUID submission identity', () => {
  assert.equal(assertSubmissionId(submissionId), submissionId);
  assert.throws(() => assertSubmissionId('not-an-id'), /must be a UUID/);
});

test('verifies one CRM lead even though GA4 carries two event names', () => {
  const receipt = evaluateReceipt({
    submissionId,
    ga4Rows: [
      { submission_id: submissionId, event_name: 'fit_note_submitted' },
      { submission_id: submissionId, event_name: 'generate_lead' },
    ],
    submissionRows: [{ id: submissionId, contact_id: 'contact-1', is_synthetic: false }],
    commsRows: [{ id: 'receipt-1', contact_id: 'contact-1', status: 'delivered' }],
    outcomeRows: [{ submission_id: submissionId, contact_id: 'contact-1', lead_state: 'review' }],
  });
  assert.equal(receipt.state, 'JOIN_VERIFIED');
  assert.equal(receipt.contact_id, 'contact-1');
  assert.deepEqual(receipt.ga4_events, ['fit_note_submitted', 'generate_lead']);
});

test('fails closed while GA4 processing is incomplete and excludes canaries', () => {
  const receipt = evaluateReceipt({
    submissionId,
    ga4Rows: [{ submission_id: submissionId, event_name: 'fit_note_submitted' }],
    submissionRows: [{ id: submissionId, contact_id: 'contact-1', is_synthetic: true }],
    commsRows: [{ id: 'receipt-1', contact_id: 'contact-1', status: 'opened' }],
    outcomeRows: [{ submission_id: submissionId, contact_id: 'contact-1', is_synthetic: true, lead_state: 'excluded_synthetic', business_lead_identity: null, advertising_feedback: null }],
  });
  assert.equal(receipt.state, 'GA4_PENDING');
  assert.equal(receipt.synthetic_excluded, true);
  assert.equal(receipt.per_source.ga4, 'pending');
  assert.equal(receipt.per_source.advertising_provider, 'not_applicable');
});

test('duplicate durable email receipts fail closed', () => {
  const receipt = evaluateReceipt({
    submissionId,
    ga4Rows: [
      { submission_id: submissionId, event_name: 'fit_note_submitted' },
      { submission_id: submissionId, event_name: 'generate_lead' },
    ],
    submissionRows: [{ id: submissionId, contact_id: 'contact-1', is_synthetic: false }],
    commsRows: [
      { id: 'receipt-1', contact_id: 'contact-1', status: 'sent' },
      { id: 'receipt-2', contact_id: 'contact-1', status: 'delivered' },
    ],
    outcomeRows: [{ submission_id: submissionId, contact_id: 'contact-1', lead_state: 'review' }],
  });
  assert.equal(receipt.state, 'DUPLICATE_EMAIL_RECEIPTS');
  assert.equal(receipt.email_receipt_count, 2);
});

test('rejects an outcome joined to a different contact', () => {
  const receipt = evaluateReceipt({
    submissionId,
    ga4Rows: [
      { submission_id: submissionId, event_name: 'fit_note_submitted' },
      { submission_id: submissionId, event_name: 'generate_lead' },
    ],
    submissionRows: [{ id: submissionId, contact_id: 'contact-1', is_synthetic: false }],
    commsRows: [{ id: 'receipt-1', contact_id: 'contact-1', status: 'delivered' }],
    outcomeRows: [{ submission_id: submissionId, contact_id: 'contact-2', lead_state: 'review' }],
  });
  assert.equal(receipt.state, 'OUTCOME_IDENTITY_MISMATCH');
  assert.equal(receipt.outcome_identity_verified, false);
});

test('rejects a synthetic row that enters business or advertising state', () => {
  const receipt = evaluateReceipt({
    submissionId,
    ga4Rows: [
      { submission_id: submissionId, event_name: 'fit_note_submitted' },
      { submission_id: submissionId, event_name: 'generate_lead' },
    ],
    submissionRows: [{ id: submissionId, contact_id: 'contact-1', is_synthetic: true }],
    commsRows: [{ id: 'receipt-1', contact_id: 'contact-1', status: 'opened' }],
    outcomeRows: [{
      submission_id: submissionId,
      contact_id: 'contact-1',
      is_synthetic: true,
      lead_state: 'qualified',
      business_lead_identity: `${submissionId}:contact-1`,
      advertising_feedback: { google_ads: { state: 'eligible' } },
    }],
  });
  assert.equal(receipt.state, 'SYNTHETIC_POLICY_VIOLATION');
  assert.equal(receipt.synthetic_excluded, false);
});

test('honors outcome-level synthetic classification when the submission flag is stale', () => {
  const receipt = evaluateReceipt({
    submissionId,
    ga4Rows: [
      { submission_id: submissionId, event_name: 'fit_note_submitted' },
      { submission_id: submissionId, event_name: 'generate_lead' },
    ],
    submissionRows: [{ id: submissionId, contact_id: 'contact-1', is_synthetic: false }],
    commsRows: [{ id: 'receipt-1', contact_id: 'contact-1', status: 'opened' }],
    outcomeRows: [{ submission_id: submissionId, contact_id: 'contact-1', is_synthetic: true, lead_state: 'excluded_synthetic', business_lead_identity: null, advertising_feedback: null }],
  });
  assert.equal(receipt.state, 'JOIN_VERIFIED');
  assert.equal(receipt.synthetic_excluded, true);
  assert.equal(receipt.synthetic_policy_verified, true);
});

test('rejects a non-success email receipt status', () => {
  const receipt = evaluateReceipt({
    submissionId,
    ga4Rows: [
      { submission_id: submissionId, event_name: 'fit_note_submitted' },
      { submission_id: submissionId, event_name: 'generate_lead' },
    ],
    submissionRows: [{ id: submissionId, contact_id: 'contact-1', is_synthetic: false }],
    commsRows: [{ id: 'receipt-1', contact_id: 'contact-1', status: 'bounced' }],
    outcomeRows: [{ submission_id: submissionId, contact_id: 'contact-1', lead_state: 'review' }],
  });
  assert.equal(receipt.state, 'EMAIL_RECEIPT_UNSUCCESSFUL');
  assert.equal(receipt.successful_email_receipt_count, 0);
});

test('a provider-accepted but undelivered receipt stays pending, not verified', () => {
  for (const status of ['sent', 'accepted', 'queued', ' Sent ']) {
    const receipt = evaluateReceipt({
      submissionId,
      ga4Rows: [
        { submission_id: submissionId, event_name: 'fit_note_submitted' },
        { submission_id: submissionId, event_name: 'generate_lead' },
      ],
      submissionRows: [{ id: submissionId, contact_id: 'contact-1', is_synthetic: false }],
      commsRows: [{ id: 'receipt-1', contact_id: 'contact-1', status }],
      outcomeRows: [{ submission_id: submissionId, contact_id: 'contact-1', lead_state: 'review' }],
    });
    assert.equal(receipt.state, 'EMAIL_RECEIPT_PENDING', status);
    assert.equal(receipt.successful_email_receipt_count, 0);
    assert.equal(receipt.pending_email_receipt_count, 1);
    assert.equal(receipt.per_source.email_receipt, 'pending');
  }
});

test('an unknown email receipt status fails closed', () => {
  const receipt = evaluateReceipt({
    submissionId,
    ga4Rows: [
      { submission_id: submissionId, event_name: 'fit_note_submitted' },
      { submission_id: submissionId, event_name: 'generate_lead' },
    ],
    submissionRows: [{ id: submissionId, contact_id: 'contact-1', is_synthetic: false }],
    commsRows: [{ id: 'receipt-1', contact_id: 'contact-1', status: 'completed' }],
    outcomeRows: [{ submission_id: submissionId, contact_id: 'contact-1', lead_state: 'review' }],
  });
  assert.equal(receipt.state, 'EMAIL_RECEIPT_UNSUCCESSFUL');
  assert.equal(receipt.pending_email_receipt_count, 0);
  assert.equal(receipt.per_source.email_receipt, 'invalid');
});

test('a missing outcome source reads as unavailable, never as pending', () => {
  const receipt = evaluateReceipt({
    submissionId,
    ga4Rows: [
      { submission_id: submissionId, event_name: 'fit_note_submitted' },
      { submission_id: submissionId, event_name: 'generate_lead' },
    ],
    submissionRows: [{ id: submissionId, contact_id: 'contact-1', is_synthetic: false }],
    commsRows: [{ id: 'receipt-1', contact_id: 'contact-1', status: 'delivered' }],
    outcomeRows: [],
    outcomeSourceAvailable: false,
  });
  assert.equal(receipt.state, 'OUTCOME_SOURCE_UNAVAILABLE');
  assert.equal(receipt.outcome_source_available, false);
  assert.equal(receipt.per_source.source_to_outcome, 'unavailable');
});

test('an available outcome source with no row is still pending', () => {
  const receipt = evaluateReceipt({
    submissionId,
    ga4Rows: [],
    submissionRows: [{ id: submissionId, contact_id: 'contact-1', is_synthetic: false }],
    commsRows: [{ id: 'receipt-1', contact_id: 'contact-1', status: 'delivered' }],
    outcomeRows: [],
  });
  assert.equal(receipt.state, 'OUTCOME_PENDING');
  assert.equal(receipt.outcome_source_available, true);
  assert.equal(receipt.per_source.source_to_outcome, 'pending');
});

test('derives the GA4 lookback from the submission date', () => {
  assert.equal(
    ga4StartDate('2025-12-15T12:00:00Z', new Date('2026-09-02T12:00:00Z')),
    '2025-12-14',
  );
  assert.equal(ga4StartDate('invalid'), '90daysAgo');
});
