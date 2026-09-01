import test from 'node:test';
import assert from 'node:assert/strict';

import { assertSubmissionId, evaluateReceipt } from '../scripts/reconcile-book-submission.mjs';

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
    commsRows: [{ id: 'receipt-1', contact_id: 'contact-1' }],
    outcomeRows: [{ submission_id: submissionId, lead_state: 'review' }],
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
    commsRows: [{ id: 'receipt-1', contact_id: 'contact-1' }],
    outcomeRows: [{ submission_id: submissionId, lead_state: 'excluded_synthetic' }],
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
      { id: 'receipt-1', contact_id: 'contact-1' },
      { id: 'receipt-2', contact_id: 'contact-1' },
    ],
    outcomeRows: [{ submission_id: submissionId, lead_state: 'review' }],
  });
  assert.equal(receipt.state, 'DUPLICATE_EMAIL_RECEIPTS');
  assert.equal(receipt.email_receipt_count, 2);
});
