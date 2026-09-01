import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../public/book/index.html", import.meta.url), "utf8");
const fitDiagnostic = fs.readFileSync(new URL("../src/components/FitDiagnostic.astro", import.meta.url), "utf8");
const memberCard = fs.readFileSync(new URL("../src/pages/m/[card].astro", import.meta.url), "utf8");
const ppcAlternative = fs.readFileSync(new URL("../src/pages/playbook/ppc-agency-alternative.astro", import.meta.url), "utf8");

function count(pattern) {
  return [...source.matchAll(pattern)].length;
}

test("keeps one direct contact job", () => {
  assert.equal(count(/<form\b/gi), 1);
  assert.equal(count(/<button\b[^>]*type="submit"/gi), 1);
  assert.match(source, /<button[^>]*id="submit-button"[^>]*>Send to Buildwise<\/button>/);
  assert.doesNotMatch(source, /progress bar|cal\.com|book\.buildwisemedia\.com|scheduler|calendar embed/i);
  assert.doesNotMatch(source, /<output[^>]*(?:score|result)|id="(?:score|quiz-result)"|name="quiz"/i);
});

test("keeps existing routes honest about the new direct-contact job", () => {
  assert.doesNotMatch(fitDiagnostic, /href="\/book"[^>]*>[^<]*(?:15-min|call)/i);
  assert.doesNotMatch(fitDiagnostic, /Book a 30-minute strategy call|Book Your Strategy Call|Direct link to the team's calendar|inline booking calendar/i);
  assert.doesNotMatch(fitDiagnostic, /install for you in 30 days/i);
  assert.match(fitDiagnostic, /What we'd build with you/i);
  assert.doesNotMatch(memberCard, /Priority Booking|Direct-Line Discovery Call|book a 1:1 strategy session/i);
  assert.doesNotMatch(memberCard, /href="\/book\?priority=true"/i);
  assert.doesNotMatch(ppcAlternative, /href="\/book"[^>]*>Revenue Leak Map/i);
  assert.match(ppcAlternative, /href="\/revenue-leak-map"[^>]*>Revenue Leak Map/i);
});

test("uses the approved field contract", () => {
  for (const name of ["contact_name", "work_email", "company", "bottleneck", "contact_permission"]) {
    assert.match(source, new RegExp('name="' + name + '"'));
  }
  assert.match(source, /id="contact_permission"[^>]*required/);
  assert.doesNotMatch(source, /name="(?:revenue|budget|phone|decision_role|readiness)"/i);
});

test("preserves the approved public copy and identity", () => {
  assert.match(source, /What’s getting in the way of\s*<em>growth\?<\/em>/);
  assert.match(source, /Tell us where it shows up and what it is stopping/);
  assert.match(source, /src="\/assets\/mark\.svg"/);
  assert.match(source, /--yellow:\s*#f0ff00/i);
  assert.match(source, /font-family:\s*"Inter"/);
  assert.doesNotMatch(source, /JetBrains Mono|Revenue Leak Map|45[ -]day|eight[ -]layer|marketing agency|lead generation/i);
});

test("keeps machine and discovery boundaries honest", () => {
  assert.match(source, /<meta name="robots" content="index,follow">/);
  assert.match(source, /<link rel="canonical" href="https:\/\/buildwisemedia\.com\/book\/">/);
  assert.match(source, /application\/ld\+json/);
  assert.match(source, /"ContactPage"/);
  assert.doesNotMatch(source, /LocalBusiness|ProfessionalService|FAQPage|Speakable|AggregateRating|priceRange/);
  assert.doesNotMatch(source, /Local review · no form submissions leave this preview/);
});

test("preserves persisted first- and last-touch attribution", () => {
  assert.match(source, /localStorage\.getItem\("_bwm_attribution"\)/);
  assert.match(source, /stored\.first_touch/);
  assert.match(source, /stored\.last_touch/);
  assert.match(source, /sessionValue\("bwm_landing_page"\)/);
  assert.match(source, /sessionValue\("bwm_referrer"\)/);
  assert.match(source, /try \{ return sessionStorage\.getItem\(key\) \|\| ""; \} catch \{ return ""; \}/);
  assert.match(source, /page_url:\s*cap\(window\.location\.href\)/);
  assert.match(source, /landing_page:\s*cap\(/);
  assert.match(source, /referrer:\s*cap\(/);
  assert.match(source, /cookie\("_fbc"\)/);
  assert.match(source, /cookie\("_fbp"\)/);
  assert.match(source, /_bwm_exp_host/);
  assert.match(source, /attribution\.experiment_id = experiment\.experiment_id/);
  assert.match(source, /attribution\.experiment_variant_id = experiment\.experiment_variant_id/);
});

test("fails local previews closed and requires the full production receipt", () => {
  assert.match(source, /"bwm-new-website-review\.pages\.dev"/);
  assert.doesNotMatch(source, /endsWith\([^)]*pages\.dev/);
  assert.match(source, /if \(!productionHost\) \{\s*showCompletion\(false\);\s*return;/);
  assert.match(source, /result\.ok === true\s*&&\s*result\.captured === true\s*&&\s*result\.emailed === true\s*&&\s*result\.receipt_recorded === true/);
  assert.match(source, /lastFailedRequest && currentPayloadFingerprint !== lastFailedRequest\.fingerprint/);
  assert.match(source, /lastFailedRequest\?\.fingerprint === currentPayloadFingerprint\s*\? lastFailedRequest\.payload/);
  assert.match(source, /lastFailedRequest = \{ fingerprint: currentPayloadFingerprint, payload: outboundPayload \}/);
  assert.match(source, /We couldn’t send your note\. Nothing is lost—please try again\./);
  assert.match(source, /Your note was emailed to us, but its delivery receipt wasn’t finalized\./);
  assert.match(source, /We saved your note, but couldn’t email it yet\./);
});

test("records the authorized conversion only after confirmed delivery", () => {
  const confirmation = source.indexOf("result.receipt_recorded === true");
  const event = source.indexOf('track("fit_note_submitted"');
  const compatibilityEvent = source.indexOf('track("generate_lead"');
  const completion = source.indexOf("showCompletion(true)");
  assert.ok(confirmation >= 0);
  assert.ok(event > confirmation);
  assert.ok(compatibilityEvent > event);
  assert.ok(completion > event);
  assert.match(source, /form_id:\s*"fit_contact"/);
  assert.match(source, /GTM-P5JSD86L/);
  assert.match(source, /gtag\("config", "G-V5LSP69E41"/);
  assert.match(source, /gtag\("event", name/);
  assert.match(source, /\.\.\.experimentContext\(\)/);
});

test("keeps no-JavaScript submissions inert", () => {
  assert.match(source, /<button[^>]*id="submit-button"[^>]*disabled/);
  assert.match(source, /This form needs JavaScript to send safely\. Nothing has been sent\./);
  assert.match(source, /submitButton\.disabled = false/);
});
