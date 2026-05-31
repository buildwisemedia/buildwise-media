# BWM Visual Storytelling Scorecard

Generated: 2026-05-23
Surface: dev-staged homepage/pricing recovery
Status: dev QA passed; awaiting Robert acceptance before Book/Brain lock updates

## Gates Run

- `npm run build` - pass
- `tools/Pre-Ship-Grep-Gate.sh` - pass
- `BWM_FULL_SURFACE_CLOSURE=1 BWM_VISUAL_QA_OUT=_verification/brand-closure-visual-storytelling-2026-05-23 tools/bwm-website-qa.sh http://127.0.0.1:4322` - pass
- Adapted Book section-visual-audit check - pass: all six flagged sections expose intentional visual primitives; sovereignty SVG circles/paths are explicit `fill="none"`.

Screenshots captured by the visual QA runner:
- `home/desktop-1440x900/full-page.png`
- `home/desktop-1280x800/full-page.png`
- `home/tablet-768x1024/full-page.png`
- `home/mobile-390x844/full-page.png`
- `pricing/desktop-1440x900/full-page.png`
- `pricing/desktop-1280x800/full-page.png`
- `pricing/tablet-768x1024/full-page.png`
- `pricing/mobile-390x844/full-page.png`

## Website Quality Scorecard

| Score | Before | After | Acceptance note |
| --- | ---: | ---: | --- |
| SG-03 Conversion | 72 | 88 | Visuals now answer buyer objections in sequence: proof of ownership, tier choice, system confidence, install momentum, pre-call diagnosis, contract risk reversal. |
| SG-04 Visual Design | 68 | 90 | Replaced repeated card grids and text walls with native asset maps, meters, score bars, route maps, and agreement clauses. |

## Three-Layer Score

| Layer | After | Evidence |
| --- | ---: | --- |
| Layer 1 Human-Centric | 92 | Anxiety reducers are visible: owned assets, human signoff, ROI floor, no lock-in, clean exit. |
| Layer 2 AI-for-Human | 90 | Eight-layer system and 30-day panel show how AI-assisted operations support weekly human decisions. |
| Layer 3 AI-for-AI | 86 | Pricing and system sections retain capability inheritance / routing cues without turning the page into abstract AI language. |

## Section Show-Don't-Tell

| Section | Before issue | After visual function | Density | Function | Narrative |
| --- | --- | --- | ---: | ---: | ---: |
| Sovereignty | Receipt grid read as no-image/static proof. | Client-owned environment map connected to code, data, ad accounts, and customer list. | 8 | 10 | 9 |
| Product tiers | Ascend and Pro felt visually equivalent. | Pilot = 45-day dossier meter; Ascend = 8-layer weekly OS; Pro = territory/multi-location map. | 8 | 10 | 9 |
| Eight layers | Uniform cards blended together. | Connected operating-system map with distinct mini-visual per layer. | 8 | 9 | 9 |
| 30-day install | Big typographic wall. | Shorter emotional headline plus Day 0/7/30 instrument panel and progress meters. | 9 | 9 | 9 |
| Market Dominance Dossier | Text plus generic 2x2 board. | Tangible dossier preview with scores, bars, leakage categories, and first-move callout. | 9 | 10 | 9 |
| Contract proof | Six-card feature grid. | Agreement page grouped by buyer anxiety with clause labels and risk-reversal stamp. | 8 | 10 | 9 |

## Visual Design Gate

- No text-wall failures observed in the six target sections after shortening the install headline and replacing repeated card grids.
- No identical adjacent section structures across the recovery sequence.
- No horizontal overflow, broken visible images, clipped controls, or crop-safety failures in CDP visual QA.
- Product pricing no longer depends on generic bitmap cards; `scripts/brand-closure-qa.mjs` now counts intentional native visual primitives toward body visual floor.

## Book + Brain Alignment Notes

- Do not update Book or Brain locks until Robert accepts the dev direction.
- Pending canonical mismatch to record during the acceptance pass: the live Book homepage currently says the 2026-05-20 brand-story card supersedes the older 2026-05-17 line, while `bwm-strategic-roadmap/data/canonical.json` and some Brain docs still contain the older "You run the business..." / "most-chosen name" phrasing.
- Reusable standard to lock after acceptance: each major section must declare a visual function first, then choose native CSS/SVG/data-viz/imagery according to that function. Decorative equivalence does not pass R020.
