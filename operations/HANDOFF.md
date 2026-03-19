# HANDOFF — Buildwise Media Site

**Last build:** 2026-03-12 (v3)
**Tag:** v3-full-build-2026-03-12
**Deployed to:** Cloudflare Pages (buildwisemedia.com)
**Staging URL:** https://bwm-buildwise-media.pages.dev

---

## Build Summary

Full 12-page fresh build from Brief Compiler v2.0. Complete redesign with Forged Earth design system, dark/light mode toggle, interactive AI sections (Acceleration Curve, Compounding Slider, Dot Grid), animated counters, scroll reveal animations, film grain hero textures.

### Pages

| Page | Path | Notes |
|------|------|-------|
| Homepage | `/` | Hero, trust bar (LOCKED stats), Poor Four preview, solution bridge, AI Acceleration Curve, Compounding Slider, results preview, how-it-works, Dot Grid/AI Future, why-buildwise preview, FAQ, final CTA |
| Why Buildwise | `/why-buildwise` | Company story, values (GSD, Integrity, Excellence, Add the Light), engineering difference, FAQ |
| Services | `/services` | Overview — pain-to-outcome mapping, deliverable stack, comparison table, FAQ |
| Ascend | `/services/ascend` | Full engine detail, comparison table, JSON-LD pricing ($5,999/mo), FAQ |
| Ascend Lite | `/services/ascend-lite` | Foundation tier, graduation path, JSON-LD pricing ($3,500/mo), FAQ |
| How It Works | `/how-it-works` | 3 phases, 12 expandable stages, You vs Us comparison, FAQ |
| Results | `/results` | Anchor case study, 4 client spotlights, aggregate stats, testimonials, FAQ |
| The Poor Four | `/the-poor-four` | Pillar content — 4 problems fully defined with symptoms, costs, fixes, interactive self-assessment |
| Book | `/book` | Cal.com iframe embed with skeleton loader, trust copy |
| Booked | `/booked` | Post-booking confirmation, noindex/nofollow, fires Schedule event |
| Privacy | `/privacy` | Privacy policy (effective March 2026) |
| Terms | `/terms` | Terms of service (effective March 2026) |
| 404 | `/404` | Custom error page with CTA |

### AEO / SEO Assets

- `llms.txt` — AI agent summary with pricing
- `llms-full.txt` — Expanded version with full service details, Poor Four framework, how-it-works stages, FAQ
- `robots.txt` — Allows GPTBot, ClaudeBot, Google-Extended, PerplexityBot, Bytespider
- `sitemap.xml` — 11 public pages (excludes /booked)

### Design System

- **Palette:** Forged Earth — void (#0c0a08), elevated (#1C1714), card (#242019), primary (#BF9469), cta (#C75B2A), cream (#f5f0e8), muted (#a89a8a)
- **Fonts:** Plus Jakarta Sans (display/headings), DM Sans (body)
- **Dark/Light Mode:** Toggle with `prefers-color-scheme` detection, cookie override
- **Animations:** Scroll reveal (IntersectionObserver), hero fade-up stagger, animated counters, canvas acceleration curve, interactive compounding slider, dot grid automation visualization
- **Nav:** Sticky, transparent → solid on scroll, hamburger at 960px
- **Base spacing:** 8px system, section padding 80-128px vertical

### LOCKED DECISIONS Enforced

- CTA label: "See If I Qualify" — verbatim, all pages
- No founder/Robert — zero references
- No revenue qualifiers — verified, QA fix applied to the-poor-four.html
- No visible pricing — JSON-LD + llms.txt only
- No phone visible — JSON-LD only
- Trust bar: $20M+ Pipeline Generated, 3-5x Lead Increase, 18+ Hours Saved Weekly, 90 Days Time to ROI
- AI sections: Acceleration Curve, Compounding Slider, Dot Grid — all present on homepage
- Dark/light toggle: prefers-color-scheme detection + cookie override
- Contracts language: "Month-to-month contract. No long-term lock-in." — never "no contracts"
- Timeline: 30 days for build, 90 days only in ROI context
- Booking URL: /book → book.buildwisemedia.com/bwm/strategy-call

### Tracking

- GTM: `GTM-P5JSD86L` (all pages)
- Meta Pixel: `2728397250833051` (all pages)
- GA4: `G-V5LSP69E41` (via GTM)
- Booking confirmation fires: `fbq('track', 'Schedule')` + `dataLayer.push({'event': 'booking_confirmed'})`
- Microsoft Clarity: add post-launch

### JSON-LD Schemas

| Page | Schemas |
|------|---------|
| Homepage | LocalBusiness, FAQPage, BreadcrumbList, Speakable |
| Services | Service (with Offer $5,999), FAQPage, BreadcrumbList |
| Ascend | Service (with Offer $5,999), FAQPage, BreadcrumbList |
| Ascend Lite | Service (with Offer $3,500), FAQPage, BreadcrumbList |
| How It Works | FAQPage, HowTo, BreadcrumbList |
| Results | FAQPage, AggregateRating, Review, BreadcrumbList |
| Why Buildwise | Organization, FAQPage, BreadcrumbList |
| The Poor Four | Article, FAQPage, BreadcrumbList |
| Legal pages | BreadcrumbList |

### QA Results (2026-03-12)

**LOCKED Decisions Audit: 10/10 PASS** (after fix)

| Check | Status |
|-------|--------|
| CTA label correct | PASS |
| No founder references | PASS |
| No revenue qualifiers | PASS (fixed) |
| No phone visible | PASS |
| Contracts language correct | PASS |
| Timeline correct (30 days) | PASS |
| No visible pricing | PASS |
| Trust bar stats correct | PASS |
| Booking URL correct | PASS |
| No internal terminology | PASS |

**Automated QA (bwm-website-qa.sh):**
- 21 PASS, 2 false FAILs (macOS grep -P incompatibility), 6 WARN
- False fails: title tag detection + booking URL extraction (both verified manually as present and correct)

Warnings (non-blocking):
- No HSTS header (expected on .pages.dev staging)
- Microsoft Clarity not installed (add post-launch)
- No robots meta tag on homepage (not required, robots.txt handles)

### Known Items

- QA script uses GNU `grep -P` (PCRE) which fails on macOS. All "failures" verified manually as false positives.
- Testimonial sections use anonymized data per Zero AI Copy rule
- `book.buildwisemedia.com/bwm/strategy-call` may return 404 to curl/HEAD but works in browser iframe

---

## Changes from v2

- **Redesigned:** Complete visual overhaul with Forged Earth palette, Plus Jakarta Sans + DM Sans fonts
- **Added:** Dark/light mode toggle with prefers-color-scheme detection
- **Added:** Interactive AI sections on homepage (Acceleration Curve canvas, Compounding Slider, Dot Grid visualization)
- **Added:** Animated counters on trust bar and results page
- **Added:** Film grain texture on hero sections
- **Added:** Scroll reveal animations on all sections
- **Fixed:** Trust bar stats now match LOCKED decision (was $10M+/85%/30 Min, now $20M+/3-5x/18+ Hours/90 Days)
- **Fixed:** Contracts language standardized ("Month-to-month contract. No long-term lock-in.")
- **Fixed:** Revenue qualifier removed from the-poor-four.html

## Commits

| Hash | Message |
|------|---------|
| 3133907 | fix: remove revenue qualifier from the-poor-four.html |
| 167ac74 | v3-full-build: buildwise-media via Brief Compiler |
