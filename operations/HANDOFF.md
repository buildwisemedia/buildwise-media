# HANDOFF — Buildwise Media Site

**Last build:** 2026-03-21 (v2 Homepage Redesign)
**Tag:** v2-homepage-redesign-2026-03-21
**Deployed to:** Cloudflare Pages (buildwise-media.pages.dev → buildwisemedia.com)

## 2026-03-21 — Homepage Redesign (15-Section 4-Act Build)

### Done
- **Full homepage rebuild** with 15 pre-designed, pre-approved sections assembled in 4-act narrative order
- **Act 1 — Recognition:** Hero, Trust Bar, Poor Four, Solution Bridge, Results Preview
- **Act 2 — Urgency:** Acceleration Curve (energy dot animation, stain word effect), Dot Grid (2,500-dot cascade)
- **Act 3 — Relief:** Three Phases (connector energy fill), Compounding Slider (interactive drag, auto-advance), Engine Runs (live dashboard with particle streams), Why Buildwise Preview, Industries (hero row + compact grid)
- **Act 4 — Close:** Objection Handler (doubt→proof layout), FAQ (5 accordions), Final CTA
- **Nav:** Sticky, hamburger on mobile, dropdowns for Services + Industries (9 niches), dark/light toggle, "See If I Qualify" CTA
- **Footer:** 4-column, social links, Atlanta GA, copyright
- **Dark/light mode:** Cookie-based, prefers-color-scheme detection, default dark
- **Film grain:** 0.035 opacity, CSS-only, full-page
- **Sticky mobile CTA:** Appears after scrolling past hero
- **Booking page** (/book): Cal.com inline embed (bwm/discovery-call), Forged Earth styled
- **Confirmation page** (/booked): noindex, simple confirmation
- **Placeholder pages** for: /why-buildwise, /how-it-works, /results, /services/ascend, /the-poor-four, 9x /industries/[slug], /404
- **JSON-LD:** LocalBusiness + Organization + FAQPage on homepage
- **AEO files:** llms.txt + llms-full.txt (pricing in Layer 3 only)
- **SEO files:** robots.txt + sitemap.xml (16 URLs)
- **Tracking:** GTM (GTM-P5JSD86L), GA4 via GTM, Meta Pixel (2728397250833051)

### Components Source
All 15 from Brain: `clients/buildwise-media/components/` (NOT root `components/`)

### Locked Decisions Verified
- CTA = "See If I Qualify" → /book
- No Robert on site
- Phone in JSON-LD only (+14049993258)
- Personal cell (+17653377805) banned
- Atlanta, GA only (no Tucker, no street address)
- Month-to-month, no long-term lock-in (never "no contracts")
- Discovery Call only (Strategy Call is private)
- Revenue qualifier ($1M-$5M) in Layer 3 only
- Cookie-based dark/light mode (not localStorage)

### File Inventory
- index.html (homepage, ~2,849 lines, 15 sections)
- book.html, booked.html
- why-buildwise.html, how-it-works.html, results.html, the-poor-four.html
- services/ascend.html
- industries/{9 slugs}/index.html
- 404.html
- robots.txt, sitemap.xml, llms.txt, llms-full.txt
- operations/HANDOFF.md
- wrangler.toml

### Next
- [ ] Phase 5 re-review on staging (mobile + desktop)
- [ ] Phase 6 go live — CNAME flip, ads back on
- [ ] Build out inner pages (replace placeholders with full content)
- [ ] Add Microsoft Clarity (project ID pending)