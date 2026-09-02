# BWM production website launch

Verified: September 2, 2026 at 8:34 AM Eastern

## Verdict

The new Buildwise Media website is live at https://buildwisemedia.com/. The public `/book` form is live, writes to Bob's CRM, sends the Buildwise team one email, and keeps synthetic launch checks out of business and advertising totals.

## Production proof

- Active Cloudflare Pages deployment: `3b3748a3-c645-4a55-83bf-80f983985434`.
- Production source: `72ab59f282dc4855640dbb7da1e186b9f26463fe` on `main`.
- The production tree is byte-identical to the approved candidate tree.
- Homepage, `/book`, Privacy, Terms, robots, and sitemap all return 200.
- The sitemap contains 82 URLs.
- Public browser readback found the approved homepage and `/book` headlines, correct CTA, canonical/indexing state, GA4 and GTM loaders, no horizontal overflow, and no console errors.
- Public visual QA passed 4/4 across homepage and `/book` at desktop and mobile sizes with zero failures and zero advisories.

## Conversion proof

- Production canary: `b222e064-70da-40fb-a49a-bbcbb43e77be`.
- The public endpoint returned 200 with `captured=true`, `emailed=true`, and `receipt_recorded=true`.
- Bob's CRM shows the submission as processed.
- Exactly one email receipt exists and is delivered.
- The source-to-outcome join matches the same contact and submission.
- The canary is marked synthetic, excluded from the business-lead ledger, and absent from advertising feedback.

## Repair made during launch

The first public canary correctly failed closed because the production Pages project did not have the intake credential. No row or email was created. The existing credential was rotated across the production Pages project and the form-handler Worker, then the same approved source tree was redeployed. A validation negative control and the successful canary both passed afterward.

## Rollback and retirement

- Previous production deployment `2216c629-d981-4f93-b4b8-9c4b460b31d9` remains the rollback point.
- The obsolete `bwm-new-website-review` Pages project was deleted after the public site passed, as requested.
- No DNS change, paid-media activation, social publishing, or spend occurred.
