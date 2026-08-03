# Bob SMS compliance page verification

Date: 2026-08-03
State: local review
Surface: `/privacy/`, `/terms/`, `/sms-consent/`
Process: locked-direction implementation under preflight v4

## Scope

- Added the required mobile-number and SMS-consent non-sharing disclosure.
- Added the Buildwise Media Client Support program terms, HELP/STOP/START
  mechanics, variable-frequency and carrier-rate disclosures, support contact,
  carrier-liability disclaimer, and Privacy Policy link.
- Reframed the consent page around invited existing clients, verified mobile
  numbers, customer care, project questions, status updates, and review or
  completion links.
- Preserved the existing page shell, typography system, form transport, and
  optional unchecked consent control.

## Deterministic evidence

- `bwm-design-gate preflight`: PASS, v4, four hash-verified bindings.
- `npm ci`: PASS.
- `npm run build`: PASS; all three routes prerendered.
- Focused compiled-route compliance assertions: PASS for Privacy, Terms, and
  SMS Consent; stale `appointment reminders` / `lead follow-ups` language is
  absent from the consent route.
- Opus 5 max-effort compliance review: three actionable HOLD findings were
  remediated — broadened mobile-consent non-sharing language, moved Privacy
  and Terms links outside the checkbox label, and completed the program-name,
  START, and carrier-liability disclosures. A nonexistent route and a proposed
  deletion of the verified campaign were rejected during owner-side review.
- Full-site `npm run qa:brand`: BASELINE FAIL on unrelated
  `dist/go/hvac-marketing/index.html: cloudflare`; the three changed routes did
  not produce a brand-closure failure.

## Pixel and responsive evidence

- 1280x800 and 390x844 browser inspection completed.
- No horizontal overflow at either width.
- Mobile headings, disclosure copy, links, fields, optional checkbox, and form
  container remain readable and inside the viewport.
- Privacy and Terms expose their new SMS sections in the rendered DOM.
- The consent checkbox remains unchecked by default and its Privacy and Terms
  links sit outside the interactive label.

## Release boundary

This artifact proves a local review build only. Production deployment, live
URL readback, and Twilio campaign submission remain separate states.
