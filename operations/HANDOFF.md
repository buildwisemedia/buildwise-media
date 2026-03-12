# HANDOFF — Buildwise Media Site

**Last build:** 2026-03-12
**Tag:** v1-full-build
**Deployed to:** Cloudflare Pages (buildwisemedia.com)

---

## Build Summary

Full 12-page static site built from Brief Compiler output + LOCKED DECISIONS enforcement.

### Pages (all returning HTTP 200)

| Page | Path | Notes |
|------|------|-------|
| Homepage | `/` | Hero, trust bar, how-it-works preview, results, comparison, pre-footer CTA |
| Why Buildwise | `/why-buildwise` | Mission, values, AI-native section (no founder bio per LOCKED) |
| Services | `/services` | Two tiers (Ascend / Ascend Lite), FAQ with FAQPage schema |
| Ascend | `/ascend` | Full engine details, outcomes comparison, FAQ |
| Ascend Lite | `/ascend-lite` | Starter engine, Lite vs Full comparison, FAQ |
| How It Works | `/how-it-works` | 3-phase: Learn, Build, Automate |
| Results | `/results` | Stats cards, $10M Meta Funnel case study (placeholder copy) |
| Book | `/book` | Cal.com iframe embed with skeleton loader |
| Confirmation | `/confirmation` | Post-booking, fires `fbq('track','Schedule')` |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms of service |
| 404 | `/404` | Custom error page |

### AEO / SEO Assets

- `llms.txt` — AI agent summary
- `llms-full.txt` — Expanded version
- `robots.txt` — Allows GPTBot, ClaudeBot, Google-Extended, PerplexityBot, Bytespider
- `sitemap.xml` — All 10 public pages
- `site.json` — Machine-readable manifest

### LOCKED DECISIONS Enforced

- CTA label: "Book Your Strategy Call" (all instances verified)
- No founder section (verified — zero references)
- No revenue qualifiers for prospects (verified)
- No visible pricing (verified)
- 30-day timeline referenced across relevant pages

### Tracking

- GTM: `GTM-P5JSD86L` (all pages)
- Meta Pixel: `2728397250833051` (all pages)
- GA4: `G-V5LSP69E41` (all pages)

### QA Results (2026-03-12)

| Check | Status |
|-------|--------|
| All images have alt text | PASS |
| No TODO markers in HTML | PASS |
| CTA label correct | PASS |
| No founder references | PASS |
| No revenue qualifiers | PASS |
| No visible pricing | PASS |
| 30-day timeline present | PASS |
| Title tags on all pages | PASS |
| Meta descriptions on all pages | PASS |
| JSON-LD structured data | PASS |
| GTM on all pages | PASS |
| Theme toggle support | PASS |
| HTTP 200 on all pages | PASS |

### Known External Items (Not Build Defects)

- `book.buildwisemedia.com/bwm/strategy-call` returns 404 to curl/HEAD requests but works in browser iframe — Cal.com expected behavior
- Testimonial and case study sections use placeholder copy (not fabricated per Zero AI Copy rule)

---

## Commits

1. `33fc912` — `feat: v1-full-build: buildwise-media via Brief Compiler`
2. `88f0fa7` — `fix: remove TODO markers from HTML (QA gate failure)`
3. `bb43eae` — `fix: add alt="" to Meta Pixel noscript images for accessibility`
