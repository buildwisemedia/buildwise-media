import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/sms-consent.astro', import.meta.url), 'utf8');

test('restores a server-bound verification challenge after browser state is lost', () => {
  assert.match(source, /\/pilot\/onboarding\/resume/);
  assert.match(source, /body: JSON\.stringify\(\{ invite_token: inviteToken \}\)/);
  assert.match(source, /result\.status === 'verification_resume'/);
  assert.match(source, /challengeId = result\.challenge_id/);
  assert.match(source, /showStep\('verify', false\)/);
  assert.match(source, /resumeRegistration\(\);/);
  assert.doesNotMatch(source, /restoredLocally/);
});

test('does not erase same-invitation session state when the original link reloads', () => {
  assert.match(source, /String\(savedState\.invite_token \|\| ''\) !== inviteToken/);
  assert.doesNotMatch(source, /if \(queryInviteToken\) \{\s*savedState = \{ invite_token: inviteToken \};/);
});

test('states that delivery is not completed registration', () => {
  assert.match(source, /Registration isn't finished yet/);
  assert.match(source, /Registration is not complete yet/);
  assert.match(source, /Enter the six-digit code/);
  assert.match(source, /return through your personal invitation link/);
});

test('does not enable code entry until the carrier accepts the verification text', () => {
  assert.match(source, /result\.status === 'verification_pending_delivery'/);
  assert.match(source, /setVerificationReady\(result\.status === 'verification_resume'\)/);
  assert.match(source, /setVerificationReady\(false\)/);
  assert.match(source, /Waiting for the carrier to accept the verification text/);
});

test('keeps secrets out of durable browser storage', () => {
  assert.doesNotMatch(source, /localStorage/);
  assert.doesNotMatch(source, /savedState[^\n]*(?:code|otp)/i);
  assert.match(source, /window\.history\.replaceState/);
});

test('turns browser network failures into plain client-facing guidance', () => {
  assert.match(source, /function publicErrorMessage/);
  assert.match(source, /We could not reach Bob to check your registration/);
  assert.match(source, /Your registration was not changed/);
});

test('keeps a verification error visible instead of letting delivery polling overwrite it', () => {
  assert.match(source, /function stopDeliveryPolling/);
  assert.match(source, /async function verifyCode\(\)[\s\S]*if \(!\/\^\[0-9\]\{6\}\$\/\.test\(code\)\)[\s\S]*return;[\s\S]*stopDeliveryPolling\(\);[\s\S]*fetch\(VERIFY_URL/);
  assert.match(source, /statusLocked/);
  assert.match(source, /if \(statusLocked && type !== 'error' && !force\) return;/);
  assert.match(source, /if \(deliveryPollInterval === null \|\| currentStep !== 'verify' \|\| !challengeId\) return;/);
});

test('keeps resend and help available after a terminal verification error', () => {
  assert.match(source, /response\.status === 410 \|\| response\.status === 423 \|\| result\.attempts_remaining === 0[\s\S]*removeAttribute\('data-disabled-before-busy'\)[\s\S]*sendAgain\.disabled = false/);
});

test('normalizes common one-time-code paste formats and blocks double submit', () => {
  assert.match(source, /normalize\('NFKC'\)/);
  assert.match(source, /replace\(\/\[\\s\\u2010-\\u2015\\u2212-\]\/g, ''\)/);
  assert.match(source, /if \(verificationInFlight\) return;/);
  assert.match(source, /submission_id: submissionId/);
});

test('rebinds a stale tab to the newest server challenge without requesting another SMS', () => {
  assert.match(source, /result\.client_code === 'code_superseded'/);
  assert.match(source, /challengeId = result\.challenge_id/);
  assert.match(source, /saveState\(\{ challenge_id: challengeId \}\)/);
  assert.match(source, /Use the newest code/);
  assert.match(source, /result\.client_code === 'code_superseded'[\s\S]*startDeliveryPolling/);
});

test('restarts carrier-status polling when the newest code is not ready yet', () => {
  assert.match(source, /result\.client_code === 'delivery_pending'[\s\S]*startDeliveryPolling/);
});

test('surfaces repeated delivery-status outages instead of leaving stale success copy', () => {
  assert.match(source, /deliveryPollFailures \+= 1/);
  assert.match(source, /deliveryPollFailures >= 3/);
  assert.match(source, /We could not refresh the delivery update/);
});

test('does not assert a configured sender number when the worker did not observe one', () => {
  assert.match(source, /result\.sender_last4 \? "Bob's number ending "/);
  assert.match(source, /: "Bob's number"/);
});
