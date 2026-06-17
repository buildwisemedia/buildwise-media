---
title: "Fleet Standards Scorecard — BWM site (upgraded visual QA, all 51 routes)"
status: active
owner: Robert Echevarria
date: 2026-06-17
source: scripts/brand-closure-visual-qa.mjs (commits d3a49f8 + bb06ccd)
bundle: _verification/fleet-sweep-2026-06-17/
---

# Fleet Standards Scorecard — 2026-06-17 (Part 5)

First sweep of **every** BWM route under the upgraded, opt-OUT visual QA. 51 routes ×
2 viewports (desktop-1440x900 + mobile-390x844) = 102 captures. **Meta-gate PASSES** —
all 10 paid LPs (`/go/*` + `/mo-*`) were swept (the root-cause fix). Every finding below
was produced by the calibrated gates after 4 false-positive classes were removed by
viewing the rendered pixels.

## Headline (the systemic patterns)

1. **CTA below the fold is a paid-LP-wide defect, not a one-off.** The exact issue Robert
   caught on `/go/agency-alternative` reproduces on **9 of 10 paid LPs** + `/audit` — the
   oversized `clamp(...,130px)` hero headline pushes the primary CTA past the 900px fold at
   1440. One hero-rework pattern fixes all of them. (`/go/status` is the only paid LP whose
   CTA clears the fold.)
2. **The core marketing funnel is clean.** Home, `/book`, `/pricing`, `/system`,
   `/services/ascend`, `/services/ascend-pilot`, `/results` have **no new-gate failures** —
   above-fold CTAs, no collisions, scannable. The conversion spine is in good shape.
3. **Two separate a11y tracks (pre-existing gates, surfaced fleet-wide for the first time):**
   - **Tap targets <24px on 27 routes** — concentrated in `/industries/*` (9) and
     `/playbook/*` (14). Shared templates → a single component fix clears the set.
   - **Faint micro-label contrast (advisory, 60 captures)** — the site-wide `--ink-faint
     #62626A` token failing WCAG on small mono labels (already on Robert's Part-4 list).

## Paid LPs — strict conversion contract (HITL before any live change)

| Route | Desktop CTA | Mobile CTA | Chart | Notes |
|-------|-------------|------------|-------|-------|
| /go/agency-alternative | ❗ below fold | ❗ >580px | ~aria-only | + long-heading (pre-existing) |
| /go/money | ❗ below fold | ❗ >580px | ❗ **no number** (revenue chart) + ~aria-only | the one strict chart finding |
| /go/pain-relief | ❗ below fold | ❗ >580px | ~aria-only | + prose density |
| /go/status | ✓ above fold | ❗ >580px | ~aria-only | + prose density |
| /go/volume | ❗ below fold | ❗ >580px | ~aria-only | + long-heading (pre-existing) |
| /mo-calm · /mo-freedom · /mo-life · /mo-peace · /mo-time | ❗ below fold | ✓ | ~aria-only | identical hero pattern across all 5 |

❗ = strict fail · ~ = advisory. "aria-only" = the MoChain before/after week charts carry
their % in `aria-label` but not as a visible number (Part-4 "show the delta" item).

## Core funnel

| Route | Result |
|-------|--------|
| / · /book · /pricing · /system · /services/ascend · /services/ascend-pilot · /results | ✓ clean (no new-gate fails) |
| /audit | ❗ CTA below fold (desktop) + ❗ mobile CTA >580px — real finding on a conversion page |

## Editorial / SEO pages (advisory — softer standard)

Below-fold CTA reported as **advisory** (these legitimately lead with content): `/about`,
`/services`, `/playbook`, `/playbook/*` (6), `/industries/foundation`. No action required
unless a given page is repurposed as a conversion destination.

## Pre-existing a11y backlog (separate remediation track, not a QA regression)

- **Tap targets <24px — 27 routes:** all of `/industries/*` and most `/playbook/*`. Shared
  template/component — fix once. (WCAG 2.5.8.)
- **Faint micro-label contrast — advisory, 60 captures fleet-wide:** the `--ink-faint`
  token (Part-4 whole-site call). Burn-in advisory until the micro-label register is resolved.
- **Heading composition — 3 routes:** `/about`, `/go/agency-alternative`, `/go/volume`
  (long unbroken H2s; consistent with the Part-4 hero/scannability rework).

## [S]-tier multimodal advisory layer (independent codex/GPT scorer, items 7+9)

Ran the wired [S]-tier critique on `go-agency-alternative` + `go-money` with the new hero
rubric and an **independent GPT scorer** (author≠scorer lock satisfied). ADVISORY — pre-screens
the human gate. Highlights:

- **Hero rubric:** both LPs PASS 5-second clarity + H1-dominant; **both FAIL `paid-lp-hero-
  trust-imagery`** — "abstract graphics, no real photograph / named result / tangible proof."
  An independent model **independently reproduced Robert's Part-4 "real photography" finding.**
- **`go-money` nav-overlap claim — REFUTED on inspection.** Codex reported the sticky nav
  cutting across the hero H1; cropping the rendered hero top shows a clean eyebrow + headline
  with **no nav overlap** at initial load (the LP suppresses nav, as paid LPs should). A model
  artifact from the 10,000px downscaled capture — do not action. (Example of why every
  multimodal finding is verified before it counts.)
- **CONFIRMED in the same crop:** the `go-money` eyebrow reads **"AI MARKETING RUN FOR YOU"** —
  the stale positioning copy the cascade (`task_2426e21e`) must fix to "custom AI system."
- **Unattributed claims on `go-money`** — `$1M+`, `78%`, `11→38 leads` shown without a visible
  source/result. Brushes the never-price-naked / no-unverified-claims rules — review.
- **Single-word mobile orphan lines** on both heroes; **social proof missing near the hero**
  (agency-alternative); nav logo very small.
- **Reconciliation note:** codex *eyeballed* the CTA as above-fold, but the deterministic gate
  *measured* it below (top 1085px > 820px). On a 10,000px downscaled capture a model can't
  resolve 820 vs 1085 — **trust the deterministic measurement for precise position; trust the
  multimodal layer for qualitative judgment (imagery, attribution, scannability).** The layers
  are complementary by design. Full run available: `node scripts/visual-critique.mjs --bundle
  _verification/fleet-sweep-2026-06-17 --scorer codex` (all paid LPs).

## Recommended remediation order (highest leverage first)

1. **Paid-LP hero rework** (one pattern → 10 LPs + `/audit`): shorten the headline so the
   primary CTA clears the fold at 1440 and within 580px on mobile. This is the bulk of the
   Part-4 hero work and the single biggest conversion lever. **HITL — client-facing design.**
2. **`/go/money` revenue chart:** add a visible conclusion number (the only strict chart fail).
3. **MoChain charts (all paid LPs):** surface the % delta visibly, not only in `aria-label`
   (Part-4 "show the delta").
4. **`/industries/*` + `/playbook/*` tap targets:** one shared-component fix clears 27 routes.
5. **`--ink-faint` contrast token:** site-wide a11y call (Part-4).

Internal-page fixes = fix + verify; **client-facing design/copy = HITL signoff before live**
(all paid LPs and marketing pages qualify).
