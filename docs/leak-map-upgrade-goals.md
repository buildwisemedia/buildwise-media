# Live Revenue Leak Map — Upgrade Goals + Build Loop (Opus owns goals; Codex builds; loop to 100%)
<!-- @internal-architecture -->
Source: 3-way conversion audit (Brain-research-vs-our-own-playbook + Opus 6-lens workflow + Codex 5.5 audit), 2026-06-20.
SCOPE: edit ONLY `src/pages/go/leak-map-prototype.astro`. Do NOT touch FitDiagnostic.astro,
RevenueLeakMapFlow.astro, BookDiagnostic.astro, or any /book / /revenue-leak-map file (concurrent rlm work).
The prototype is the proving ground; the eventual port target is FitDiagnostic (/go/money) AFTER Robert's signoff.
KEEP every existing lock: Triangulation System A only (#050507 / #F0FF00 / greys), CTA "See If We're a Fit" → /book,
30 days never 90, no vendor names, FK ≤7 owner copy, noindex, reduced-motion, a11y, build green. The diagnose()
engine COPY + LOGIC are frozen — do not alter them; only how/where their output is presented.

## DONE-CRITERIA (binary; the loop stops only when ALL are green + verified by Opus)

### Batch A — Feel smart from step 1 (engagement / perceived intelligence)
- **G1 score-from-Q1:** the SCORE animates upward on EVERY answered step Q1–Q7 (not frozen at 00 until Q5).
  Q5 still produces the largest single jump (preserve the reveal payoff). Verify: drive Q1→Q4, score>0 and rises each step.
- **G2 real insights:** each step's micro-insight INTERPRETS, never transcribes. Kill "Service mapped: HVAC" /
  "Demand source added: referrals". Replace with one true implication per answer (e.g. referrals-only → "Referrals are
  gold — but you can't turn them up on a slow month."). Plain, FK≤7. Verify: insight text is an inference, not a restatement.
- **G3 segmented pipe:** the active map pipe lights SEGMENT BY SEGMENT as nodes unlock — not the full path animated
  on/off. Verify: at Q2 only Service→Demand is lit, not the whole route.
- **G4 mobile map:** the live map (or a genuinely equivalent live, building visual — not just the score pill) is VISIBLE
  and updating on mobile (≤959px). The pipeline schematic is the differentiator; do not hide it on phones. Verify: 390px viewport shows it building.

### Batch B — Trust + the booking moment (conversion)
- **G5 proof-before-CTA:** a matched PROOF element renders immediately before the reveal's primary CTA, using ONLY the
  approved de-identified wins — "$300K → $10M+" (custom-builder owner) or "~150 leads since launch" (concrete contractor) —
  pick the one that best matches the derived leak; NEVER name the client. Carry `<!-- @cta-proof: <win> -->`. Honors the
  LOCKED proof-before-CTA placement rule. Verify: a real win sits adjacent-to/above the CTA.
- **G6 why-BWM bridge:** one sentence before the CTA connects the named leak → the kind of run-for-you system only BWM
  installs (not "a report"). Passes voice + FK. Verify: bridge copy present.
- **G7 reveal above the fold:** the highest-value reveal content (diagnosis headline + the 3 owner-outcome moves + the
  proof) is visible WITHOUT scrolling on desktop AND mobile; CTA tight to the aha. Move the completed map secondary. Verify: render check both viewports.
- **G8 hunch not "found":** Q5 + cockpit stop declaring the final leak before the reveal. Q5 = "your hunch"; mid-flow copy
  = "Hunch locked — we'll test it against your time, your channels, and your target." Save "first fix" for the reveal. Verify: no "X leak found" pre-reveal.
- **G9 Q7 goal labels:** target dials clearly read as 12-month GOALS — "The revenue you want" / "The crew you want" /
  "Your time-back goal (hours/week you want on the day-to-day — lower is better)" + a line "These are goals, not where you
  are today." Verify: labels updated.

### Batch C — Capture + measurement (so AI can actually optimize it)
- **G10 working capture:** the email field actually captures + transmits (capture-first), framed as "email me the full map"
  — a real secondary path for non-bookers, with business-email validation. Verify: submit fires a real POST/beacon (form-handler-style endpoint or a clearly-stubbed one), not a dead input.
- **G11 state handoff:** on reveal, the full answer + result state (service, leadSources, revenue, opsRatio, bottleneck,
  capacityGaps, target, derived leak, score) is transmitted AND carried into the /book CTA (query param or persisted). Verify: beacon/param carries state.
- **G12 step telemetry:** events fire per BWM's contract — `diagnostic_start`, `diagnostic_step_complete`
  (with diagnostic_step + total_steps), `form_step_abandon`, `scroll_depth`, `cta_click`, `generate_lead`. (dataLayer/gtag-style;
  a stub sink is fine in the prototype but the calls + payloads must be real.) Verify: console/network shows them on the right actions.
- **G13 experiment-ready:** `<!-- @bwm-exp-slot: … -->` + `data-bwm-exp-slot` on hero-headline / hero-cta / proof-module,
  and `data-cta-source` on every conversion CTA (kebab `{surface}-{module}`). Verify: grep finds slots + cta-source.

### Always-green QA gates (checked every batch)
- **G14 locks:** Triangulation only; CTA "See If We're a Fit"→/book; 30 days; no vendor names; FK≤7; noindex; reduced-motion; a11y; `npm run build` green; Pre-Ship Grep Gate clean on this file.
- **G15 no regressions:** the full flow still drives end-to-end to the reveal; diagnose() output unchanged + byte-identical engine; 0 console errors; `[LEAKQA]` still clean.

## BUILD LOOP
Codex builds one batch at a time (A → B → C). After each: Opus runs build + Playwright render QA + brand/value gates +
the batch's Done-Criteria + G14/G15. Failures go back to Codex with the specific gap. Advance only when the batch is green.
After C: full-funnel QA across desktop + mobile, then bring the upgraded prototype to Robert for visual/value signoff (HITL).
