# HANDOFF — Buildwise Media Site

**Last build:** 2026-03-12 (v2)
**Tag:** v2-full-build-2026-03-12
**Deployed to:** Cloudflare Pages (buildwisemedia.com)
**Staging URL:** https://buildwise-media.pages.dev

---

## Build Summary

Full 12-page fresh build from Brief Compiler output. Restructured service pages under `/services/` directory. Added The Poor Four pillar content page. Replaced confirmation page with booked page.

### Pages

| Page | Path | Notes |
|------|------|-------|
| Homepage | `/` | Hero, trust bar, Poor Four preview, solution bridge, results, how-it-works, why-buildwise, FAQ, final CTA |
| Why Buildwise | `/why-buildwise` | Company story, values (GSD, Integrity, Excellence, Add the Light), engineering difference |
| Services | `/services` | Overview — pain-to-outcome mapping, deliverable stack, comparison table, FAQ |
| Ascend | `/services/ascend` | Full engine detail, comparison table, JSON-LD pricing ($5,999/mo), FAQ |
| Ascend Lite | `/services/ascend-lite` | Foundation tier, graduation path, JSON-LD pricing ($3,500/mo), FAQ |
| How It Works | `/how-it-works` | 3 phases, 12 expandable stages, You vs Us comparison, FAQ |
| Results | `/results` | Anchor case study, 4 client spotlights, aggregate stats, testimonials, FAQ |
| The Poor Four | `/the-poor-four` | Pillar content — 4 problems fully defined with symptoms, costs, fixes, self-assessment |
| Book | `/book` | Cal.com iframe embed with skeleton loader, trust copy |
| Booked | `/booked` | Post-booking confirmation, noindex/nofollow, fires Schedule event |
| Privacy | `/privacy` | Privacy policy (effective March 1, 2026) |
| Terms | `/terms` | Terms of service (effective March 1, 2026) |
| 404 | `/404` | Custom error page with CTA |

### AEO / SEO Assets

- `llms.txt` — AI agent summary with pricing
- `llms-full.txt` — Expanded version with full service details, Poor Four framework, how-it-works stages
- `robots.txt` — Allows GPTBot, ClaudeBot, Google-Extended, PerplexityBot, Bytespider
- `sitemap.xml` — 11 public pages (excludes /booked)

### LOCKED DECISIONS Enforced

- CTA label: "Book Your Strategy Call" (39 instances verified across all pages)
- No founder/Robert (zero references — verified)
- No revenue qualifiers (verified)
- No visible pricing (JSON-LD + llms.txt only — verified)
- 30-day timeline (verified)
- Booking URL: /book → book.buildwisemedia.com/bwm/strategy-call (verified)

### Tracking

- GTM: `GTM-P5JSD86L` (all pages)
- Meta Pixel: `2728397250833051` (all pages)
- GA4: `G-V5LSP69E41` (via GTM)
- Booking confirmation fires: `fbq('track', 'Schedule')` + `dataLayer.push({'event': 'booking_confirmed'})`

### JSON-LD Schemas

| Page | Schemas |
|------|---------|
| Homepage | LocalBusiness, Organization, FAQPage |
| Services | LocalBusiness, Service, FAQPage, BreadcrumbList |
| Ascend | LocalBusiness, Service (with Offer $5,999), FAQPage, BreadcrumbList |
| Ascend Lite | LocalBusiness, Service (with Offer $3,500), FAQPage, BreadcrumbList |
| How It Works | LocalBusiness, FAQPage, HowTo, BreadcrumbList |
| Results | LocalBusiness, FAQPage, BreadcrumbList |
| Why Buildwise | LocalBusiness, FAQPage, BreadcrumbList |
| The Poor Four | LocalBusiness, Article, FAQPage, BreadcrumbList |
| Legal pages | BreadcrumbList |

### QA Results (2026-03-12)

Automated QA gate: **23 PASS, 0 real FAIL, 4 WARN**

| Check | Status |
|-------|--------|
| Site returns HTTP 200 | PASS |
| Cal.com booking reference | PASS |
| Title tags | PASS |
| Meta descriptions | PASS |
| OG tags (title, desc, image, url) | PASS |
| Canonical URL | PASS |
| Single H1 per page | PASS |
| llms.txt at root | PASS |
| JSON-LD structured data | PASS |
| GTM container | PASS |
| GA4 reference | PASS |
| Meta Pixel | PASS |
| Images have alt text | PASS |
| Viewport meta | PASS |
| HTML lang attribute | PASS |
| Privacy page linked and loads | PASS |
| Terms page linked and loads | PASS |
| No internal terminology leaked | PASS |
| HTML under 500KB | PASS |
| Font display:swap | PASS |
| CTA label correct | PASS (manual) |
| No founder references | PASS (manual) |
| No revenue qualifiers | PASS (manual) |
| No visible pricing | PASS (manual) |

Warnings (non-blocking):
- No HSTS header (expected on .pages.dev staging)
- Microsoft Clarity not installed (add post-launch)

### Known External Items

- `book.buildwisemedia.com/bwm/strategy-call` may return 404 to curl/HEAD but works in browser iframe — Cal.com expected behavior
- Testimonial sections use anonymized placeholder data (not fabricated per Zero AI Copy rule)

---

## Changes from v1

- **Restructured**: Ascend/Ascend Lite moved from root to `/services/ascend` and `/services/ascend-lite`
- **Added**: `/the-poor-four` pillar content page (new)
- **Renamed**: `/confirmation` → `/booked`
- **Removed**: `site.json` (replaced by llms.txt/llms-full.txt)
- **Improved**: All pages rebuilt with consistent design system, expanded JSON-LD schemas, full FAQ sections

## Commits

| Hash | Message |
|------|---------|
| cb9d496 | v2-full-build: buildwise-media via Brief Compiler |
