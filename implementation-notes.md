# buildwisemedia.com — Implementation Notes (build decision journal)

Decisions made outside the approved brief, deviations, and tradeoffs with rationale.
Per the Build Decision Journal lock (2026-05-25). Newest first.

## 2026-05-31 — Axis-1 homepage reorder + CTA lock cascade (dev: `feat/value-stack-cost-anchor`)

Approved Axis-1 reorder (3-model panel, memory `bwm-homepage-revenue-leak-map-cta`). Staged on dev; **production promote is gated on Robert's signoff** (client-facing HITL).

**Homepage section order (`src/pages/index.astro`):**
- **Cut** L1.5 "Why now" (Operating reframe + AI-velocity SVG) and L1.6 Capability Curve (`<AIStorySection />`) — too much "why AI / why now" abstraction before the owner's own pain. Removed the now-unused `AIStorySection` import.
- **Moved** L2 Poor Four (owner-pain) above the Earn-Back Calculator so the page leads with the reader's week, then quantifies the leak.
- New top flow: **Hero → Poor Four → Earn-Back Calculator → Value Equation → 8-Layer → …**
- Transform done via an asserted Python script (the cut section was a 115-line SVG; scripting was safer than hand-reproducing it). Validated by running the real `~/.claude/hooks/r020-visual-gate.py` against the result (exit 0).

**Tradeoff / known dead code:** the `.operating-reframe` / `.velocity-*` scoped CSS in the `<style>` block is now unused (markup removed). Left in place — harmless dead bytes, no render/gate impact; a CSS-prune pass can remove it later. The internal layer-number comments (`L2` now precedes `L1.7`) were left as-is rather than renumber the whole page — labels, not a sequence contract.

**Verification:** R020 visual gate exit 0 · `npm run build` Complete · Pre-Ship Grep Gate 21/21 OK (incl. `banned-cta-copy` — the new primary CTA "Get My Free Revenue Leak Map" passes; the gate is a denylist, it never required "See If We're a Fit").

**CTA lock cascade (so promote is a one-word go):**
- `~/.claude/CLAUDE.md` CTA lock updated with the buildwisemedia.com-own-site exception: primary = "Get My Free Revenue Leak Map"; "See If We're a Fit" retained as secondary; no-paraphrase rule still governs all **client** sites.
- Pre-Ship-Grep-Gate `banned-cta-copy` needed **no change** — verified it already passes the new CTA (denylist, not allowlist).
