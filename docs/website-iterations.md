# Buildwise Media Website Iterations

This ledger tracks meaningful website direction changes so future design, copy, and QA sessions can recover the current intent without guessing from the git history alone.

## OC-2026-05-21 - Operating Console

- **Name:** Operating Console
- **Status:** Breakthrough-offer copy pass implemented
- **Branch:** `homepage-redesign-2026-05-21`
- **Review tag:** `v51-review-operating-console-2026-05-21`
- **Primary conversion route:** `/book`
- **Core scope:** `/`, `/book`, `/system`, `/pricing`, `/services/ascend`, `/results`
- **Direction:** Premium AI operating-system website for Buildwise Media. Dark Triangulation base, acid yellow authority signal, cyan visibility cues, green proof/healthy states, orange risk/urgency states, and red leak/failure states.
- **Performance constraints:** CSS/SVG-native visuals, no heavy video, no external font loading, delayed analytics, lazy booking embed, and mobile Lighthouse target of 95+.
- **QA evidence:** `npm run build` passed; desktop and mobile screenshot QA completed for all core routes; `/book` passed five-step interaction QA with final submit only on step 5; stale-copy gate passed on rendered site surfaces; internal link crawl passed; schema presence and JSON-LD parse checks passed; Lighthouse passed on home and `/book`.
- **Lighthouse snapshot:** Home scored Performance 100, Accessibility 96, Best Practices 100, SEO 100. `/book` scored Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- **Screenshot evidence:** Stored locally in `/Users/robertechevarria/Documents/Codex/2026-05-21/we-are-working-on-the-buildwise/qa-cdp`.
- **Copy pass:** 2026-05-21 implementation moved the site from "system explainer" toward the newer Book breakthrough offer. Homepage is now the primary long-form sales page with value equation, Market Dominance Dossier, contract proof, Pilot scope protection, attribution honesty, public pricing, and stronger owner/operator language.
- **Gate updates:** Brain SOPs updated for current BWM-self locks: public pricing, "See If We're a Fit", current Poor Four names, Breakthrough Offer value equation, Show-Don't-Tell, and BWM route-specific reading-level gates.
- **Latest QA evidence:** `npm run build` passed after the copy pass. Rendered stale-copy gate passed on `/`, `/book`, `/system`, `/pricing`, `/services/ascend`, `/results`. Approximate rendered FK scores: `/` 6.8, `/pricing` 7.3, `/system` 7.5, `/services/ascend` 7.5, `/results` 7.6. `/book` scores high in automated FK because form labels/options are counted as prose.

### Notes For Future Iterations

- Keep the operating-console metaphor if the page is still presenting Ascend as a technical growth system rather than a generic agency service.
- Preserve one primary yellow forward CTA on each `/book` step, with a quiet Back button and final submit only on step 5.
- Treat pricing as direct and visible. Do not return to hidden or private pricing framing.
- Preserve plain SEO/AEO answers: what it is, who it is for, how it works, what it costs, what changes in 30 days, and what the client owns.
- Preserve Team Voice on the public site unless a newer lock promotes founder voice.
- Treat the Market Dominance Dossier as the primary next-step framing on `/book`.

## IA-2026-05-22 - Installed Advantage Copy Pass

- **Name:** Installed Advantage
- **Status:** Strategy/copy direction implemented; visual QA not accepted yet.
- **Preview target:** `http://127.0.0.1:4322/`
- **Primary conversion route:** `/book`
- **Core scope:** `/`, `/book`, `/system`, `/pricing`, `/services/ascend`, `/results`
- **Direction:** The site should sell Ascend as an installed, owned, Buildwise-operated AI growth system for owner-led service businesses. The buyer should believe Buildwise installs frontier-AI capability on their domain, wires it to their data/workflows, operates it every week, and keeps it improving as the technology improves.
- **Current homepage hero:** `Own the AI growth system your competitors wish they had.`
- **CTA lock:** Use `See If We're a Fit` unless a newer approved CTA replaces it.
- **Dossier role:** The Market Dominance Dossier is the diagnostic/aiming mechanism, not the core product story.
- **Known issue:** The latest pass improved strategic clarity and mobile CTA availability, but the rendered site still has visible design/polish errors. It needs a fresh visual QA and conversion-design repair session before it should be considered review-ready.
- **Recent verification:** `npm run build` passed after the Installed Advantage patch. Rendered CTA checks passed on mobile for the core routes, but that does not mean visual quality passed.
- **Fresh-session prompt:** `docs/prompts/visual-qa-installed-advantage.md`
- **Recovery note 2026-05-22:** Browser screenshots caught visual failures that the automated gates missed: the "AI is moving faster..." heading crossed the center ledger line, long headings lacked meaningful emphasis, capability-curve dots read as accidental points on the line, the `24/7` display card cropped important content, and ROI sliders did not visibly announce that they could be adjusted. Root cause: QA treated generic rendered metrics as sufficient and did not require manual visual acceptance against component-specific composition checks.

### Visual QA Priorities

- Do not restart the site or revert unrelated dirty work.
- Audit the rendered routes before coding, with screenshots at mobile and desktop widths.
- Preserve the Installed Advantage strategy unless the user explicitly redirects it.
- Reduce the feeling of a dark document: make visuals, hierarchy, spacing, and first-screen composition carry more persuasion.
- Fix text overlap, awkward cropping, excessive vertical sprawl, inconsistent rhythm, mobile layout problems, and any UI that feels mechanically generated instead of premium.
- Treat heading readability, semantic highlights, chart marker clarity, slider affordance, and display-numeral crop safety as blocking visual QA checks.
- Do not claim review-ready or full surface closure until the visual QA bundle includes a `manual-visual-review.md` file with `Status: accepted`.
- Keep the page credible for owner/operators of service businesses: high-value, concrete, operational, and no vague AI hype.

## BC-2026-05-24 - Public-Tier Business Card Design Iterations

- **Name:** Public-Tier Business Card (Regular Card)
- **Status:** Vector templates implemented; design iterations uploaded to Cloudflare R2 bucket (`bwm-assets`).
- **Branch:** `homepage-redesign-2026-05-21`
- **Dieline SVG Paths:**
  - [public_front.svg](file:///Users/robertechevarria/buildwisemedia.com/public/assets/print/business-card/public_front.svg) — Front layout matching Lockup B + Stripe-leaning composition. Includes a simulated Y1 neon-green outline (`#B8FF3A` edge paint).
  - [public_back.svg](file:///Users/robertechevarria/buildwisemedia.com/public/assets/print/business-card/public_back.svg) — Back layout matching the spec-grid, with direct email/book/NFC links (no `www.`) and a small flat-fill top-left mark.
- **R2 Storage Locations (binaries):**
  - R2 Bucket: `bwm-assets`
  - Public CDN Root: `https://pub-85c635a2536e438b9927af5e6723b0f7.r2.dev/`
  - Mockups & Iterations:
    - [variant_a_minimal.png](https://pub-85c635a2536e438b9927af5e6723b0f7.r2.dev/print/business-card/iterations/variant_a_minimal.png)
    - [variant_b_technical.png](https://pub-85c635a2536e438b9927af5e6723b0f7.r2.dev/print/business-card/iterations/variant_b_technical.png)
    - [variant_c_holo.png](https://pub-85c635a2536e438b9927af5e6723b0f7.r2.dev/print/business-card/iterations/variant_c_holo.png)
    - [variant_d_physical.png](https://pub-85c635a2536e438b9927af5e6723b0f7.r2.dev/print/business-card/iterations/variant_d_physical.png)
    - [public_concave_front.png](https://pub-85c635a2536e438b9927af5e6723b0f7.r2.dev/print/business-card/iterations/public_concave_front.png)
    - [public_concave_angle.png](https://pub-85c635a2536e438b9927af5e6723b0f7.r2.dev/print/business-card/iterations/public_concave_angle.png)
    - [public_real_front.png](https://pub-85c635a2536e438b9927af5e6723b0f7.r2.dev/print/business-card/iterations/public_real_front.png) (Final photorealistic card mockup: vertical 55x85mm, 38pt premium matte black uncoated cardstock, foil-stamped Y2 logo mark, opaque white/Y2 printed wordmarks, thin green painted edges on sharp 90° corners, correct name "Robert Echevarria").
    - [public_real_back.png](https://pub-85c635a2536e438b9927af5e6723b0f7.r2.dev/print/business-card/iterations/public_real_back.png) (Final photorealistic card back: direct email/book/NFC links, no `www.`).
- **QA evidence:** `npm run qa:brand` passed with 0 warnings. Binary assets successfully uploaded to remote R2 bucket. Git tracking cleaned.
