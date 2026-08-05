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
  assert.match(source, /async function verifyCode\(\)[\s\S]*stopDeliveryPolling\(\);[\s\S]*setBusy\(true, 'verify'\)/);
  assert.match(source, /if \(deliveryPollInterval === null \|\| currentStep !== 'verify' \|\| !challengeId\) return;/);
});

test('keeps resend and help available after a terminal verification error', () => {
  assert.match(source, /response\.status === 410 \|\| result\.attempts_remaining === 0[\s\S]*removeAttribute\('data-disabled-before-busy'\)[\s\S]*sendAgain\.disabled = false/);
});
