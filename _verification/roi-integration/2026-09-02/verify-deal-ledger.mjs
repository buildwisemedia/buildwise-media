import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const path = new URL('./deal-ledger.json', import.meta.url);
const ledger = JSON.parse(readFileSync(path, 'utf8'));
const allowed = new Set([
  'REAL_OPPORTUNITY',
  'CURRENT_CLIENT',
  'DUPLICATE_OR_TEST',
  'UNKNOWN_REVIEW_REQUIRED',
]);

function validate(candidate) {
  assert.equal(candidate.state, 'READ_ONLY_REVIEW');
  assert.equal(candidate.live_denominator, 6);
  assert.equal(candidate.rows.length, candidate.live_denominator);
  assert.equal(new Set(candidate.rows.map((row) => row.deal_key)).size, candidate.rows.length);
  assert.equal(new Set(candidate.rows.map((row) => row.provider_id_sha256)).size, candidate.rows.length);
  assert.ok(candidate.rows.every((row) => /^[a-f0-9]{64}$/.test(row.provider_id_sha256)));
  assert.ok(candidate.rows.every((row) => allowed.has(row.classification)));
  assert.ok(candidate.rows.every((row) => row.owner && row.current_blocker && row.next_decision));
  assert.ok(candidate.rows.every((row) => Array.isArray(row.evidence) && row.evidence.length > 0));
  assert.ok(candidate.rows.every((row) => Array.isArray(row.explicit_unknowns)));
  assert.equal(Object.values(candidate.classifications).reduce((sum, value) => sum + value, 0), 6);
  for (const classification of allowed) {
    assert.equal(
      candidate.rows.filter((row) => row.classification === classification).length,
      candidate.classifications[classification],
    );
  }
  assert.equal(candidate.two_snapshot_parity, true);
  assert.deepEqual(candidate.followup_reconciliation, {
    pending_total: 9,
    pending_matching_open_deal_contacts: 0,
    pending_for_bwm_client_id: 0,
    pending_owner: 'Rodel',
    pending_client: 'Design2Sell',
    conclusion: 'The nine generic pending follow-ups are unrelated to the six BWM open deals and are not a BWM sales-follow-up system.',
  });
  assert.deepEqual(candidate.authority_boundary, {
    crm_write: false,
    followup_write: false,
    external_send: false,
    sales_activation: false,
  });

  const currentClients = candidate.rows.filter((row) => row.classification === 'CURRENT_CLIENT');
  assert.ok(currentClients.every((row) => !row.contactability.startsWith('CRM_EMAIL_PRESENT')));
  const tests = candidate.rows.filter((row) => row.classification === 'DUPLICATE_OR_TEST');
  assert.ok(tests.every((row) => row.contactability === 'DO_NOT_CONTACT_TEST_RECORD'));
  const real = candidate.rows.filter((row) => row.classification === 'REAL_OPPORTUNITY');
  assert.ok(real.every((row) => row.offer_compatibility.includes('90-day Pilot')));
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const expectReject = (name, mutate) => {
  const candidate = clone(ledger);
  mutate(candidate);
  assert.throws(() => validate(candidate), undefined, name);
};

validate(ledger);
expectReject('silent row drop', (candidate) => candidate.rows.pop());
expectReject('duplicate deal key', (candidate) => { candidate.rows[1].deal_key = candidate.rows[0].deal_key; });
expectReject('duplicate provider identity', (candidate) => { candidate.rows[1].provider_id_sha256 = candidate.rows[0].provider_id_sha256; });
expectReject('missing owner', (candidate) => { candidate.rows[3].owner = ''; });
expectReject('stale offer', (candidate) => { candidate.rows[3].offer_compatibility = '30-day build with hidden 45-day promise'; });
expectReject('client exposed to prospect contact', (candidate) => { candidate.rows[2].contactability = 'CRM_EMAIL_PRESENT_READY_TO_SEND'; });
expectReject('test exposed to contact', (candidate) => { candidate.rows[0].contactability = 'CRM_EMAIL_PRESENT_READY_TO_SEND'; });
expectReject('follow-up conflation', (candidate) => { candidate.followup_reconciliation.pending_matching_open_deal_contacts = 9; });
expectReject('write authority enabled', (candidate) => { candidate.authority_boundary.crm_write = true; });
expectReject('snapshot drift hidden', (candidate) => { candidate.two_snapshot_parity = false; });

console.log('deal-ledger: PASS');
console.log('coverage: 6/6');
console.log('snapshot-parity: PASS');
console.log('terminal-classifications: PASS');
console.log('client-test-suppression: PASS');
console.log('followup-separation: PASS');
console.log('authority-boundary: PASS');
console.log('negative-controls: 10/10 PASS');
