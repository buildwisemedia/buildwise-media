# Funnel "Live Revenue Leak Map" — Root-Cause Analysis + Fix Direction (2026-06-20)

Dual independent RCA (Opus + Codex 5.5 x-high), synthesized. Triggered by CEO review of the
prototype reveal: *"We're not telling them where they're leaking, so there's no value. We just
pissed someone off."*

## Core flaw — why the funnel was weak
**Self-report dressed up as diagnosis.** The owner *selects* their bottleneck in step 5; the reveal
then announces "Your biggest leak: [that selection]." It echoes their own input back — a "prettier
radio-button summary," not a diagnosis. We promised analysis they couldn't do themselves and
delivered a mirror. Making it slick ("it's reading my business") *widened* the promise→delivery gap,
which is why it reads as a bait-and-switch.

Deepest cause: the funnel was a **lead-capture form in a diagnostic costume**. The "scoring/data
contract" we carefully *preserved* encoded the bad premise ("ask what hurts → map to our internal
module names"). The redesign changed presentation, not epistemic value. Both old and new share the
flaw because both treated the diagnostic as *UI + scoring*, never as an *expert reasoning layer*.

"What we'd install first" (Fit gate / Value proof / Follow-up path) = **builder jargon**, not owner
outcomes. Zero value to a tired HVAC owner.

## Why QA missed it
Build / render / brand / a11y / data-contract / scoring QA **cannot tell whether a conclusion is
earned.** Every check was "does it work / look right / stay on brand" — never "is this valuable to a
real owner." The missed class = **semantic product-value failure** (no insight, jargon, unearned
diagnosis, no useful next step). Compounders:
- The two audits "converging" was **shared blindness**, not validation — both optimized polish, both
  accepted the broken scoring model. No red-team asked "what's the strongest reason this STILL won't
  convert?" (answer: it gives nothing).
- **"Preserve the data contract" became the blinder** — it protected the exact mechanism that needed
  replacing.
- Prototyping welcome+Q5+Q7 first QA'd the impressive input-collection while deferring the reveal —
  the only place value is actually delivered. The failure surfaced late.

## Fix direction (both analyses agree)
1. **Build a real diagnostic layer** (client-side reasoning from their answers → a NON-OBVIOUS
   insight, ideally a leak they did NOT pick). Bar (Codex example):
   *"You picked demand, but your team and owner-time answers say capacity breaks first. More leads
   will just create slow callbacks and schedule pressure. The first move isn't more volume — it's
   protecting your calendar."* Must synthesize ≥2 inputs beyond the selected pain: selected pain +
   target ambition + operational constraint → hidden constraint / contradiction / order-of-operations
   / cost-of-inaction, in plain owner words.
2. **Rewrite install moves as owner outcomes**, e.g.:
   - Fit gate → "Stop quoting jobs you never wanted"
   - Value proof → "Show why you're not the cheap option before the call"
   - Follow-up path → "Bring serious buyers back without you chasing"
   - Dispatch rules → "Send the right jobs to the right crew"
3. **Add VALUE QA gates** (run BEFORE pixel/brand QA counts):
   - **Echo detector** — fail if the reveal conclusion is just the selected option + "leak" with no
     causal explanation from ≥2 other inputs.
   - **Insight contract** — each scenario's reveal must include: selected_pain, derived_constraint,
     why_it_matters, first_owner_outcome, input_refs (≥2).
   - **Jargon denylist** — fail owner-facing copy containing internal labels (Fit gate, Value proof,
     Follow-up path, Demand floor, Capacity signal, …).
   - **Skeptical-owner eval** (LLM or human): "Did this tell me something I did NOT already say?" and
     "Do I know what changes Monday?" — must pass before visual QA matters.
   - **Claim trace** — every dynamic reveal claim cites an inference rule, not a lookup table.

## Process lesson (contract-worthy)
QA for client-facing conversion surfaces MUST include an outside-in **value/meaning gate** (role-play
the actual buyer: "was this worth my time / do I feel understood or used?"), not just inside-out
correctness (build/render/brand/a11y). Cross-model "agreement" is not validation — add an adversarial
red-team on the *concept*, not just the execution.
