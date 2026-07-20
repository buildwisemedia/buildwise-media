# Three-Way Blind Design Bake-off — Protocol (2026-07-19)

Robert-directed: Claude Fable 5 vs GPT-5.6 Sol vs Kimi K3, blind.

## Authors and lanes
| Lane | Model | Mechanism |
|---|---|---|
| fable | Claude Fable 5 | Fresh subagent per brief; receives ONLY the dispatch brief + write path. No bake-off context, no competitor knowledge. |
| sol | GPT-5.6 Sol (xhigh) | `bwm-codex` per brief, worktree = entries dir, same verbatim brief. |
| kimi | Kimi K3 | OpenAI-compatible API (kimi_lane.sh), same verbatim brief. Fires when key lands. |

## Fairness contract
- Identical dispatch brief text per client (briefs/asap.md, briefs/d2s.md), direction-anchored per Design-Sameness-Gate (3 anchors + anti-trope block + device registers).
- Single-shot: one pass, no render/fix loops for any lane. Only deterministic mechanical repair allowed post-hoc (strip markdown fences / pre-doctype chatter); identical rule for all lanes; all repairs logged here.
- Same output contract: single self-contained HTML, Google Fonts only, art-directed placeholders (no fabricated assets/claims/reviews).
- Time-staggered authoring is acceptable; no lane sees another lane's output.

## Gates (before anyone scores)
- `design_sameness_check.py` per output (with `--client <slug>`). Known context: ASAP's locked brand orange #E87A2E sits inside the coral/red trope hue band — a coral_red_accent WARN on ASAP entries is expected and reads as brand-correct, not trope.
- Malformed-HTML mechanical repair only; a lane that returns unusable output after repair scores a forfeit for that brief (logged, not silently dropped).

## Blinding
- After all 6 outputs exist: labels A/B/C assigned per client via `shuf`, files copied to blind/<client>-<LABEL>.html with comments/meta stripped of any model tells.
- origin-map.json (label ↔ model) written to seal/, SHA256 published in the session BEFORE any scoring output. Map revealed only after Robert's verdict.

## Scoring
- Rubric, 1–10 per axis: (1) anchor/brief adherence · (2) hierarchy & layout craft · (3) typographic craft · (4) color discipline · (5) distinctiveness / anti-trope · (6) conversion clarity for the stated visitor states.
- Each entry is scored by the TWO non-author model families (author ≠ scorer; same-family scores are diagnostic only and excluded from the tally). Scorers receive blinded files only.
- Deterministic layer: sameness-check results + a QA render check (page loads, responsive at 375/768/1440, no console errors).
- FINAL JUDGE: Robert, on a blind A/B/C gallery (preview deploy, no CF Access needed) — his pick per client + notes. Model scores are advisory context, revealed to him only after he picks.

## Honesty notes
- The orchestrator (Fable, this session) also fields the fable lane via a context-isolated subagent. Orchestrator does not open any entry file until the scoring phase, and scores only sol/kimi entries (cross-family rule). Robert's blind verdict is the decision-grade signal.
- This is a test artifact: outputs are never client-facing, never deployed to client surfaces, and carry no client PII (briefs are approved-NDB content only, scrubbed).

## Decision rule (per design-route lock 2026-07-15)
No default-route change from one bake-off. If Kimi K3 wins or shows real direction-diversity: propose it as a SECOND authoring lane (surface-specific, Robert HIL) and re-run confirmation on a live low-stakes surface. If it loses: log fingerprints to the design corpus and re-check after open-weights release (~2026-07-27).
