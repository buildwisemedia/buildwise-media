# Bob private-beta onboarding QA — 2026-08-04

Artifact state: local candidate. Production claim: false. Client notification state: unsent.

## Browser evidence

- Desktop viewport: 1280 x 900. `scrollWidth=1280`, `clientWidth=1280`; no horizontal overflow.
- Mobile viewport: 390 x 844. `scrollWidth=390`, `clientWidth=390`; no horizontal overflow.
- Valid opaque invitation state after the review repair: consent form `display:flex`; only the details step is rendered. Verify and success steps are `display:none` with zero height.
- Missing invitation state after the review repair: warning visible; form has the HTML `hidden` attribute and computed `display:none`.
- Privacy-sensitive layout: `meta[name=referrer]` is `no-referrer`; `window.gtag` is undefined; no `dataLayer` is created.
- Search boundary: generated page emits `noindex,nofollow`.
- Visual inspection confirmed the locked Buildwise identity, clear private-beta hierarchy, legible consent copy, and responsive mobile recomposition.

## Build and privacy evidence

- `npm run build`: passed after the final consent-page and layout changes.
- `npm run qa:guard`: passed.
- CI builds the page and asserts default-hidden markup, the `[hidden]` CSS contract, both worker endpoints, feedback copy, and the tracking denylist.
- Generated `/sms-consent/` artifact contains no Google Tag Manager, GA4 loader, Clarity, Meta Pixel loader, booking preconnect, Resend, or BWM lead-form endpoint.
- The page POSTs only to the dedicated Bob onboarding start and verify routes.

## Interaction and security evidence

- The invitation token is read from the private `?i=` URL, captured in memory, and then removed from the browser address bar with `history.replaceState`; it is never written into visible page copy.
- The missing-token state cannot submit.
- Details, OTP, success, decline, held-for-review, expiration, and resend states have explicit plain-language feedback. Resend validates only the name/email/phone fields, so the enabled empty OTP field cannot block it.
- The consent statement includes recurring customer-care/project-status scope, frequency, carrier rates, STOP, START, HELP, and non-condition-of-purchase language. The public form and worker are bound to the same SHA-256 consent-copy contract.
- Client invitations remain unsent pending database migration, worker deployment, independent code review, and Robert-only live canary.

## Independent-review disposition

- Opus 5 (Robert-directed substitute for capped Fable 5) initially blocked the page on hidden-state CSS, deployment ordering, resend validation, and stale evidence.
- The candidate now starts hidden in HTML, has an explicit `[hidden]` CSS rule, reveals only a valid-token form, validates resend independently of the OTP field, uses stable data hooks, emits generic public errors, and removes the unrelated package-lock update.
- The final clean-room review returned `SHIP-SAFE WITH SENDS DISABLED`. A delta review then caught a CI-only mismatch caused by Astro's scoped CSS; the guard now tests both the scoped selectors and their `display:none` declarations against the built artifact. The exact CI privacy step passes locally.
- Cross-repository proof at this gate: 82 worker tests, TypeScript, Wrangler dry-run, zero known npm vulnerabilities, 20 focused migration checks, 1,942 full database-repository tests, site build, and privacy guard all pass.
- The worker must still deploy before this page. This artifact does not claim those live endpoints are active yet.
