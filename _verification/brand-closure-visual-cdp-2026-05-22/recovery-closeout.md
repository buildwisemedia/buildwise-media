# PROJ-BRAND-001 Visual QA Recovery Closeout

Date: 2026-05-22
Base URL: http://127.0.0.1:4322

## Root Cause

The previous process validated build health, rendered copy/token scans, route availability, and generic layout metrics, but it did not make human visual acceptance or component-specific composition checks blocking. The known `visual QA not accepted yet` warning in `docs/website-iterations.md` was documented but not enforced as a closure gate.

## Fixes Verified

- Reframed the homepage "Why now" heading so it no longer crosses the center ledger rule.
- Shortened the reframe card headings and applied emphasis only to meaning-bearing words.
- Constrained the reframe proof cards to the right column on desktop so the sticky heading cannot cover them.
- Changed capability-curve milestone dots into callout pins with stems.
- Rebounded the `24/7` display card so the numeral and text remain readable in desktop, tablet, and mobile captures.
- Made ROI calculator sliders visibly adjustable with instruction copy, default-visible value chips, and min/max cues.
- Added visual QA script checks for heading composition, divider/proof-card collision, crop safety, slider affordance, and curve marker callouts.
- Added a manual visual review acceptance requirement for closure-mode QA.

## Commands

- `npm run build` — PASS
- `tools/Pre-Ship-Grep-Gate.sh` — PASS
- `tools/bwm-website-qa.sh http://127.0.0.1:4322` — PASS
- `BWM_FULL_SURFACE_CLOSURE=1 tools/bwm-website-qa.sh http://127.0.0.1:4322` — PASS

## Evidence

- Visual QA summary: `_verification/brand-closure-visual-cdp-2026-05-22/visual-qa-summary.md`
- Manual visual review: `_verification/brand-closure-visual-cdp-2026-05-22/manual-visual-review.md`
- Desktop home capture: `_verification/brand-closure-visual-cdp-2026-05-22/home/desktop-1440x900/full-page.png`
- Compact desktop home capture: `_verification/brand-closure-visual-cdp-2026-05-22/home/desktop-1280x800/full-page.png`
- Tablet home capture: `_verification/brand-closure-visual-cdp-2026-05-22/home/tablet-768x1024/full-page.png`
- Mobile home capture: `_verification/brand-closure-visual-cdp-2026-05-22/home/mobile-375x812/full-page.png`

## Remaining Findings

- P0: none.
- P1: none.
- P2: Brain project-doc writeback still needs a Brain write key before this local process note can be mirrored into `projects/Project-Brand-Identity-Lock.md`.
