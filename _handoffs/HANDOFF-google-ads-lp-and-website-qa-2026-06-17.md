---
title: "HANDOFF — Google Ads LP final + Website QA-process hardening + fleet standards sweep"
status: active
owner: Robert Echevarria
date: 2026-06-17
branch: feat/google-ads-dogfood-lps
pr: "#19 (unmerged)"
---

# HANDOFF — Google Ads LP + Website QA Hardening + Fleet Sweep (2026-06-17)

**Why this exists:** the previous session ran low on context. This is the single
execute-top-to-bottom plan for the next session. Robert's standing directive: *"I just
don't want this to keep coming up"* — so the deliverable is not just fixing the page, it's
**hardening the QA process so this class of miss can't recur**, then **sweeping the rest of
the BWM site** to the same standard. Client-page application is FUTURE (build the gates
page-type-agnostic now; wire into the client SOP later — focus is BWM for now).

Reading order before executing: this doc → the Google Ads plan docs in Part 1 → Appendix A
(hero principles) → Appendix B (the QA gap analysis).

---

## PART 1 — Google Ads dogfood: USE THE ORIGINAL PLAN

The campaign is BUILT (paused draft in Google Ads `979-378-9968`, campaign "BWM Core -
High-Intent Search", campaignId `281498923073736`, draftId `10199945874`). Nothing is
serving or spending. **The plan to execute is already written — do not re-plan:**

- **Brain `Google-Ads-Build-State-And-Final-QA-Handoff-2026-06-16.md`** — START HERE. Build
  state, campaign config, remaining build, blockers. (Local copy: `/tmp/bwm-gads-build-state.md`.)
- **Brain `Google-Ads-Campaign-Staging-Pack-v3-leadgen.md`** (sha `145147ee`) — the v3 plan.
  (Local: `/tmp/bwm-staging-pack-v3.md`.)
- **Brain `Google-Ads-Campaign-v3.1-Codex-Corrections.md`** (sha `cfb6985`) — v3.1 corrections:
  campaign = budget unit; hold by-trade; do NOT add `reviews`/`residential` as broad negatives;
  add lead-marketplace-displacement cluster; launch on **Manual/Enhanced CPC** (NOT Maximize
  Conversions — too little volume to learn); presence-only geo; fix inert-form before traffic
  (DONE). (Local: `/tmp/bwm-gads-v31-corrections.md`.)
- Cross-refs: `Google-Ads-Next-Session-Handoff-2026-06-16.md`, `Google-Ads-Dogfood-Audit-Outcome-2026-06-16.md`.

**Remaining build (after Robert's LP signoff → PR #19 merge):**
1. Publish Campaign A **PAUSED** (publish-then-pause; ad 404 clears when PR #19 merges so the final URL resolves).
2. Ad groups 2-4: Done-For-You · Competitor-Alternative · Lead-Marketplace (keywords + RSA each).
3. Add more AG1 headlines (lift ad strength Poor → Good).
4. Campaign-level negatives (v3.1 list; NOT `reviews`/`residential`).
5. Campaign B "By-Trade Anchor": HELD until trade landing pages exist.
6. **`generate_lead` conversion action** — the account has NONE (only a ⚠️-flagged "Book
   appointments"). Create it + set PRIMARY + enable the offline import
   (`bwm-ops-events/scripts/google_conversion_import` config, currently `enabled=false`).

**Conversion-tracking soundness (verified last session):** client-side `generate_lead` fires
once on FIT **and** MAYBE (not NO), carrying UTMs + top-level `gclid` that matches the
importer's read path (`google_conversion_import.py:198`). RISK: until the `generate_lead`
conversion action exists in Google Ads, the page fires the event but Google records no
conversion — so **launch on Manual CPC** (per v3.1) and do NOT switch to conversion-based
Smart Bidding until the action exists + has fired. Asymmetry to note: client-side counts MAYBE,
the offline importer (FIT-only) does not — fine while offline import is off.

**Blockers (Robert):** LP visual signoff → PR #19 merge; in-platform campaign review; "Confirm
it's you" identity verification (Skipped, valid until 2026-06-30).

---

## PART 2 — Landing page (PR #19, branch `feat/google-ads-dogfood-lps`)

Preview: https://feat-google-ads-dogfood-lps.buildwise-media.pages.dev/go/agency-alternative/
Files: `src/pages/go/agency-alternative.astro` + `src/components/FitDiagnostic.astro` +
`src/components/campaign/MoChainSection.astro` (the last two are SHARED by all `/mo-*` and `/go/*` pages).

**DONE this session (commits on the branch; latest `32b9fee`):**
- `ec54539`/PR#20 `aa307dc`: diagnostic was **blank on load** (no `data-screen` init) — now renders
  welcome; `goTo()` scrolls the diagnostic into view (was teleporting to page hero); removed a
  dead duplicate `<script>` block.
- `7eea22f`: removed the **double header** (hid the redundant diagnostic doc-header), killed
  ~310px **dead space** (global `section{padding-block}` was stacking on the diagnostic's own
  paddings), **synced** the top Growth Index to the server verdict score.
- `c11f37e`: unclipped proof-icon labels; dropped an unverifiable "7 times" claim.
- `6c12c73`: QA-sweep batch — **Q6 funnel-blocker** fixed (capacity-gaps now optional); MAYBE
  3×-duplicate bullets → diverse pool; **a11y** (slider `<div>`→`<button>` keyboard, aria-pressed,
  aria-labels, aria-live, focus-visible, comparison `role="row"`); **Y1 green #B8FF3A → Y2
  #F0FF00** on the spend SVG; projection chart mobile aspect-ratio; slider edge-label clip; bg-deep token.
- `32b9fee`: rendered-pixel + copy fixes from Robert's review — REPLACE centered; "It is"→"It's";
  Path-B "learn" uncovered; "LEAK FOUND" centered; card-3 curve lifted off "JOB". Verified by rendering.
- `b6bf73d`: Robert's merge of `main` (carried the blank-diagnostic hotfix back via PR #20).

**Diagnostic is functionally solid + verified** (welcome→7 questions→reveal; FIT/MAYBE/NO/
anonymous/email-capture/API-fail paths; desktop@1440 + mobile@390; build green; 0 real console
errors — only a localhost-only CSP block on the Cal embed, fine on prod).

**STILL OPEN on the LP — see Parts 4 (design) + the flagged judgment calls.**

---

## PART 3 — QA-PROCESS HARDENING (the "don't let this recur" deliverable) — DO THIS

**ROOT CAUSE (why a "robust" QA missed everything Robert caught):** our QA has a source/text
tier (`scripts/brand-closure-qa.mjs`) and a **rendered CDP visual tier**
(`scripts/brand-closure-visual-qa.mjs`). The visual tier runs on a **hardcoded route allowlist**
(`/`, `/book`, `/system`, `/pricing`, `/services/ascend`, `/results`) — **`/go/agency-alternative`
is not on it, so the page was never visually swept at all.** Compounding: the CTA-above-fold
check hardcodes "See If We're a Fit" (this LP uses a different CTA); there's no SVG text-collision
check; and the "quality" gates (R020, Show-Don't-Tell, FK) are **compliance/existence/complexity
checks, not conversion judgment** — an unreadable line-art SVG with a correct `@r020` comment passes.

**THE FIX — 9 concrete upgrades (full detail + code in Appendix B). Priority order:**

1. **[SHIP FIRST] Route inclusion + meta-gate** — `brand-closure-visual-qa.mjs`: auto-discover and
   include every `src/pages/go/*.astro` (and other paid-LP dirs) in the CDP sweep; add a meta-gate
   that FAILS if any `/go/*` page is missing from the sweep. Converts the allowlist from opt-in to
   opt-out. *(Catches: everything — the page is now actually swept.)*
2. **[SHIP SECOND] SVG text-collision check** — in `pageAudit()`, for every `<svg>`, compare each
   `<text>` getBoundingClientRect against sibling `circle/polygon/polyline/path/rect` (≤4px clearance)
   → STRICT fail. *(Catches: "learn" covered, "leak"/"job" touching, "REPLACE" off-center.)*
3. **[SHIP SECOND] CTA-above-fold, selector-agnostic** — any `<a class="cta">`/`[data-cta-source]`
   top edge must be ≤ (viewportH − 80) at 1440×900 → STRICT fail. *(Catches: CTA below fold.)*
4. **[SHIP THIRD] Hero word-count gate** — `<h1>` on `/go/*` > 12 words → fail (source-level, fast).
5. **[SHIP THIRD] Section prose-density / scannability** — `<section>` with >120 words of prose
   before its first visual and no `<strong>`/pull-quote/visual break → warn.
6. **[SHIP THIRD] Data-viz conclusion-annotation** — `@r020:F2` SVG must carry a number/%/before-after
   in `aria-label`/`<text>`/`<figcaption>` or fail. *(Catches: charts that make the viewer do the math.)*
7. **[SHIP FOURTH] Hero 5-second persuasion rubric ([S]-tier screenshot critique on `/go/*`)** —
   H1 is largest type; H1 ≤12 words; CTA above fold; ≥1 above-fold element telegraphs value without
   reading; ≥7:1 H1 contrast. ≥2 fails = block. *(Catches: hero verbosity, value-not-obvious.)*
8. **[SHIP FOURTH] Comparison-table visual-hierarchy check** — winner column must have per-row color
   treatment (not just a colored header) + ≤60 words/row. *(Catches: "table is just text".)*
9. Independent-scorer wiring for the [S]-tier rubric per PROJ-DESIGN-INTEL-001 P2 (author ≠ scorer).

**These are INTERNAL tooling (no client-facing HITL) — implement, test against
`/go/agency-alternative` to confirm each would have caught its target finding, commit.** A second
independent diagnosis from Codex is at `/tmp/codex-qa-research.md` (was still running at handoff —
read it and fold in any additional checks before finalizing).

---

## PART 4 — Remaining LP design items (research-backed; build + Robert HITL)

These are Robert's review items that need DESIGN work, now supported by the hero research (Appendix A):
- **Hero rework** — too many words (16 → ≤12), value/pain obvious in 5s, **primary CTA above the
  fold at 1440** (the oversized `clamp(...,130px)` headline pushes it down), and **a real photograph**
  (burned-by-agency buyers trust real proof imagery far more than abstract line-art).
- **Comparison table (SS1)** — make it guide the eye: stronger winner-column treatment, scan layer
  (icons/checkmarks/bold), not a wall of text.
- **MoChain "THE COST" (SS2)** — copy too dense to scan: add a skim layer; the before/after week
  charts must **show the delta** (annotate hours/%/"before 70% → after 35%"), not make the viewer compute it.
- **Two-paths / mechanism (SS3)** — tell the story with real graphics/photos; the "THE MECHANISM"
  section is text-only (Show-Don't-Tell gap — needs a real data-viz/scene, not 3 text cards).
- **Positioning-copy cascade (task `task_2426e21e`)** — shared components still say "marketing
  department" + "AI growth system" instead of the locked **"custom AI system"**; reword across
  FitDiagnostic + MoChainSection in one pass (affects `/mo-*` pages too).
- **Flagged judgment calls (Robert to decide):** welcome "15-min call" vs FIT "30-minute call" —
  unify to the real Cal slot; `--ink-faint #62626A` fails WCAG contrast site-wide (global token —
  whole-site call); comparison section is unnumbered before "01 · THE COST"; FIT-verdict CTA still
  reads "See If We're a Fit" post-verdict (vs "Book The Call").

---

## PART 5 — Fleet standards sweep (Robert's new ask: check the rest of our site)

After Part 3 lands (so the sweep can actually see every page):
1. **Run the upgraded visual QA across ALL BWM pages** (now opt-out, so every route is covered) —
   homepage, /system, /pricing, /services/*, /results, /book, all `/mo-*`, all `/go/*`, /playbook, etc.
2. Produce a **scorecard** of pages that don't meet the new standards (pixel collisions, CTA-below-fold,
   hero verbosity, unscannable sections, decorative-not-selling visuals).
3. Remediate the failures (internal pages = fix + verify; client-facing = HITL signoff before live).
   This is harness-shaped — consider a Workflow that fans out the visual critique per page + adversarial verify.
4. **Future client-page application (NOT now — focus BWM):** the gates in Part 3 must be built
   **page-type-agnostic** so client `/go/*` and campaign pages are auto-covered. Wire the upgraded
   visual QA + persuasion rubric into the client website-build SOP (Brain `sops/SOP-Website-Delivery`
   / `bwm-website-qa.sh`) as a follow-up so every client ship runs it. Flag the SOP edit to Robert.

---

## PART 6 — Durable lessons (surface to Robert as contract/SOP candidates)

1. **Visual QA must be opt-OUT, not an allowlist.** Every page/route auto-enters the rendered sweep;
   a meta-gate fails if a page type is missing. (The single highest-leverage change.)
2. **QA must include a RENDERED persuasion + 5-second-clarity pass**, not only source/compliance/FK
   checks. Compliance ("@r020 annotation present") ≠ quality ("does this visual actually sell").
3. **Hero standard:** H1 ≤ ~12 words; value/pain obvious in 5s; primary CTA above the fold @1440;
   real photography for trust-gap personas (line-art alone fails for burned-by-agency buyers).
4. **SVG/data-viz standard:** automated text-vs-graphic collision check; charts must state their
   conclusion (numbers/delta), not imply it.
→ Candidates for the QA SOP + CLAUDE.md design-QA locks. Robert-grant before locking.

---

## PART 7 — Open background work + tasks

- **Codex independent QA diagnosis:** `/tmp/codex-qa-research.md` (read + fold into Part 3 before finalizing).
- **task `task_2426e21e`** — positioning-copy cascade (Part 4).
- **task `task_3ded9dad`** — blank-diagnostic hotfix: DONE (landed on main via PR #20); can dismiss.
- Repo working tree may carry pre-existing untracked noise (`_verification/*`, root images) — not ours; leave it.
- Branch is shared (Robert/Bob may push) — re-check HEAD before committing; integrate via isolated
  worktree if push is rejected (pattern used repeatedly this session).

---

## Appendix A — Hero best-practice principles (evidence-backed; apply to the rework)

P1 H1 ≤ ~10 words total (Unbounce 34k-page benchmark; shorter headlines ~3.4× median conversion).
P2 5-second clarity test — value + pain obvious from H1 + one visual without reading (NN/g first-impressions ~3.2s).
P3 Primary CTA above the fold at 1440×900 (Baymard: 57% never scroll without an above-fold hook).
P4 One primary action; suppress nav on paid LPs (attention ratio → 1:1).
P5 Real photography > line-art for credibility/trust-gap buyers (VWO ~+35% for pro services; Baymard credibility).
P6 Deliberate visual hierarchy (Z/F) to the CTA; comparison tables need a visual winner column + scan layer.
P7 Data-viz shows the conclusion (annotated delta), never asks the viewer to compute it.
P8 Sections scannable in ≤8s — short H2/H3 + a carrying visual + ≤60-word body, or a bold skim layer.

## Appendix B — Full QA gap analysis

The complete root-cause analysis (with exact script behaviors and per-fix code) is the
"Paid-LP QA Post-Mortem" produced 2026-06-17. Key script facts confirmed by reading source:
- `scripts/brand-closure-visual-qa.mjs` — CDP sweep, **hardcoded `routes` array** (the allowlist);
  `pageAudit()` checks hardcoded flagship selectors + CTA text "See If We're a Fit" only; checks
  `<img>` naturalWidth (our hero is SVG, invisible to it); no SVG geometry check.
- `scripts/brand-closure-qa.mjs` — operates on built HTML **as text** (regex/counts); never opens a browser.
- R020 hook / `sdt_density_gate.py` / Creative Copy Gate (FK) — compliance/existence/complexity, not conversion.
- `/go/*` is absent from the visual route list AND the `heroImageFloors` map → paid LPs escape both.
Map each Part-3 fix to the finding it catches; ship in the stated priority. (If `/tmp/codex-qa-research.md`
exists, reconcile its checks with this list — keep the union.)
