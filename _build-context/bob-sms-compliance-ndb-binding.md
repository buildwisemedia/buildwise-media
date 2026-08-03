---
schema_version: ndb-2.0
client: buildwise-media
identity_class: bwm
composition_mode: single
surface: bob-sms-compliance-copy
primary_module: website_landing
process_tier: locked-direction-implementation
state: local-binding
---

# Bob SMS compliance NDB binding

Preserve the existing Buildwise Media legal-page and SMS-consent visual system,
navigation, typography, spacing, responsive behavior, form mechanics, and
footer. This is a compliance-only copy correction for the private Bob client
beta. It does not authorize a new visual direction, marketing claim, offer,
pricing promise, performance promise, or conversion claim.

The authorized source scope is limited to:

- `src/pages/privacy.astro`
- `src/pages/terms.astro`
- `src/pages/sms-consent.astro`

Required truth conditions:

- describe individually invited, authenticated existing-client project support;
- state that message frequency varies and carrier message/data rates may apply;
- provide clear HELP, STOP, and START mechanics;
- state that consent is optional and not a condition of purchase;
- state that mobile numbers, SMS opt-in records, and consent are not sold or
  shared with third parties or affiliates for marketing or promotional use;
- link the public Privacy Policy and Terms of Use;
- avoid describing the program as marketing, lead nurture, or a public signup;
- preserve the prohibition on high-risk data; and
- make no claim that conversational replies are already enabled or A2P-approved.

Copy-evidence status is N/A because the language is a carrier-compliance and
data-practice disclosure, not conversion copy. Production release still
requires deterministic build/route checks, responsive inspection, and live
readback. Robert remains the HIL owner for the campaign spend and client beta.
