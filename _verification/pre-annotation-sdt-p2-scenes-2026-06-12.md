# Synthetic Pre-Annotation — SDT P2 scene diagrams (🚦 handoff, PEER-DIVERGENT)

First production round of the synthetic pre-annotation protocol
(`reference/Triangulate-Imagery-Prompt-And-Propagation-Spec.md` § Synthetic
Pre-Annotation, PROJ-DESIGN-INTEL-001 P5). Attached to the pending 🚦 SIGNOFF
item: P2 SDT scene diagrams on /how-it-works, /audit, /industries/hvac (×2).

**HITL note: these matrices are decision support. Nothing here approves or
rejects anything — Robert's eye remains the only gate.**

- Claude matrix sealed pre-Codex · SHA256 `81eda63b5e5d9920a0dbc8781acc4aaaa84db1ef844d735ef07dac5c028c78fe`
- Codex matrix (blind, staged worktree, never saw Claude's verdicts) · SHA256 `db8b7ad4e0d6c721309489c5121b12432bd5291e8120e91933285b74d8433fc4`

## Divergence verdict — ESCALATE (4 P-rules > threshold of 2)

| Rule | Claude | Codex (aggregated over 4 diagrams) | Divergent |
|---|---|---|---|
| P-02 modernity | pass | fail on the hvac FAQ routing diagram ("generic box-flow"), pass elsewhere | YES |
| P-03 tensions | pass | fail on the FAQ routing diagram ("generic-AI-startup diagramming"), pass elsewhere | YES |
| P-05 dual-register | pass — page-level read: diagrams ARE the whisper register; Y2 verdict node is the one shout | fail ×4 — within-figure read: hierarchy rides on accent color alone, no scale/weight contrast inside the SVG | YES |
| P-06 numerals | n-a — body proof figures, not hero surfaces | fail on the timeline — DAY 30 / THIRTY DAYS never becomes an authority numeral | YES |
| V-011 urgency-before-copy | pass | fail ×3 — figures arrive after the prose has already explained the claim | yes (V-rule) |
| V-017 metrics-beat-paragraphs | n-a | fail on the timeline | yes (V-rule) |
| V-018 graphic-explains-heading | pass (read broadly: figure↔section claim) | n-a (read narrowly: tile graphics only) | scope read |

## Root causes (the dimensions the locks don't settle)

1. **P-05 register scope on body figures** — does dual-register apply WITHIN a
   scene diagram (internal scale/weight contrast) or at PAGE level (the figure
   as the page's whisper)? Queued as a triangulation round.
2. **V-011 placement convention** — must the proof figure precede the prose it
   proves, or is same-section sufficient? (Today's Show-Don't-Tell density gate
   counts same-section.)
3. **Substantive critique to weigh at signoff:** the hvac FAQ routing diagram
   (QUESTION → SYSTEM → VERIFIED ANSWER) is the weakest of the four — both
   scoring lenses agree it carries the least proof; Codex calls it generic.

## Matrices (verbatim)

### Claude (author-family: true)

| Rule | Verdict | Rationale |
|---|---|---|
| P-02 modernity | pass | Schematic command-console figures built from R014b construction grammar (hairlines, hollow/filled vertices, dot ellipses); reads as instrumentation, zero vintage/heritage/soft coding. |
| P-03 tensions | pass | Quiet+loud held precisely: near-silent hairline gray scenes with exactly one Y2 verdict moment each (OPERATIONAL / FIRST BREAK / BOOKED JOB); serious+modern throughout; no warm/casual register. |
| P-05 dual-register | pass | The diagrams are the whisper register done right — 9–10px tracked uppercase JetBrains Mono labels in ink-dim/ink-faint, with the single Y2 fx-label-y2 shout reserved for the verdict node. Register separation is legible inside each figure. |
| P-06 numerals-as-hero | n-a | Body proof figures, not hero compositions — P-06 governs hero surfaces. (DAY 0/5/30 ticks are axis labels, not authority numerals.) |
| V-018 graphic-explains-heading | pass | Each figure encodes exactly the claim of its section: timeline → the 30-day operational claim; leak map → the deliverable itself with FIRST BREAK flagged; chain → dollar→booked-job traceability; routing → question→verified answer. Removal would degrade the section's proof. |
| V-011 visual-urgency-before-copy | pass | audit leak map: the flagged FIRST BREAK carries the urgency before the prose explains it; how-it-works timeline makes the 30-day pace visible above the phase list. |
| V-012 / V-017 | n-a | No centered stat moment / no metric proof modules among these four figures. |
| P-04 / P-08 / P-09 | n-a | Session-dynamics rules — not artifact-scorable. |

Verdict count: 5 pass · 0 fail · 4 n-a

### Codex (author-family: false, blind)

| Artifact | Earns place? | Rule | Verdict | Rationale |
|---|---|---|---|---|
| how-it-works.astro: Day 0/5/30 install timeline | yes | P-02 | pass | The hairline track, mono labels, and Y2 `OPERATIONAL` vertex read modern and precise, not vintage or soft. |
| how-it-works.astro: Day 0/5/30 install timeline | yes | P-03 | pass | The diagram holds serious+modern with concrete `DAY 0`, `DAY 5`, `DAY 30`, and `OPERATIONAL` claims tied to the phase list. |
| how-it-works.astro: Day 0/5/30 install timeline | yes | P-05 | fail | The SVG is almost entirely one micro register: `fx-label`, `fx-label-y2`, and `fx-caption` are 9-10px mono with color doing the hierarchy. |
| how-it-works.astro: Day 0/5/30 install timeline | yes | P-06 | fail | It uses `01`, `02`, `03`, `DAY 30`, and `THIRTY DAYS`, but none are oversized condensed numerals carrying the authority claim. |
| how-it-works.astro: Day 0/5/30 install timeline | yes | V-017 | fail | The 30-day proof is buried in small labels and a caption instead of a large readable metric plus one support line. |
| how-it-works.astro: Day 0/5/30 install timeline | yes | V-018 | n-a | This is a timeline scene, not a tile graphic. |
| how-it-works.astro: Day 0/5/30 install timeline | yes | V-011 | pass | It appears before the phase rows and visually flags the Day 30 operational moment with the filled Y2 vertex. |
| how-it-works.astro: Day 0/5/30 install timeline | yes | V-012 | n-a | No large stat moment or bolted-on stat block is present. |
| audit-index.astro: Revenue Leak Map first-break path | yes | P-02 | pass | The lead-to-booked path with a Y2 `FIRST BREAK` callout reads as a modern diagnostic schematic. |
| audit-index.astro: Revenue Leak Map first-break path | yes | P-03 | pass | The visual is precise and weighty: `LEAD`, `SOURCE`, `SPEED`, `PROOF`, `FOLLOW-UP`, `ROUTING`, and `BOOKED` avoid soft or casual register. |
| audit-index.astro: Revenue Leak Map first-break path | yes | P-05 | fail | The break label, station labels, and caption all sit in the same tiny mono family, so the register depends on accent color rather than scale or weight. |
| audit-index.astro: Revenue Leak Map first-break path | yes | P-06 | n-a | The diagram does not make a numeric authority claim in visible text. |
| audit-index.astro: Revenue Leak Map first-break path | yes | V-017 | n-a | It is a path diagnostic, not a metric-led proof module. |
| audit-index.astro: Revenue Leak Map first-break path | yes | V-018 | n-a | No tile graphic is present. |
| audit-index.astro: Revenue Leak Map first-break path | yes | V-011 | fail | The visual urgency is real, but it comes after the heading and three prose paragraphs have already explained the first gap. |
| audit-index.astro: Revenue Leak Map first-break path | yes | V-012 | n-a | There is no large stat moment to judge. |
| hvac.astro: Attribution chain | yes | P-02 | pass | The dollar-to-booked-job chain is a clean modern operating-system diagram using restrained lines and a Y2 terminal node. |
| hvac.astro: Attribution chain | yes | P-03 | pass | `DOLLAR`, `SOURCE`, `PAGE`, `CALL`, `QUOTE`, and `BOOKED JOB` make the HVAC attribution idea concrete instead of generic-AI-startup vague. |
| hvac.astro: Attribution chain | yes | P-05 | fail | All hierarchy is micro-label based; even `BOOKED JOB` only changes to `fx-label-y2` with no meaningful scale or weight shift. |
| hvac.astro: Attribution chain | yes | P-06 | n-a | No visible numeral is used as a proof gesture or authority claim. |
| hvac.astro: Attribution chain | yes | V-017 | n-a | The artifact explains traceability, not a numeric metric. |
| hvac.astro: Attribution chain | yes | V-018 | n-a | It is a linear attribution scene, not a tile graphic. |
| hvac.astro: Attribution chain | yes | V-011 | fail | The SVG arrives after two prose paragraphs and shows a clean chain, not an urgent leak or failure state. |
| hvac.astro: Attribution chain | yes | V-012 | n-a | No large stat moment or stat block appears. |
| hvac.astro: FAQ question-system-answer route | no | P-02 | fail | `QUESTION -> SYSTEM -> VERIFIED ANSWER` is a plain box-flow that does not read ahead of market despite using the scene classes. |
| hvac.astro: FAQ question-system-answer route | no | P-03 | fail | The generic `SYSTEM` block with three dots feels like generic AI-startup diagramming rather than BWM-specific proof. |
| hvac.astro: FAQ question-system-answer route | no | P-05 | fail | The diagram is single-register micro type throughout, with no scale/weight contrast and only tiny dots for emphasis. |
| hvac.astro: FAQ question-system-answer route | no | P-06 | n-a | The diagram contains no numeric authority claim. |
| hvac.astro: FAQ question-system-answer route | no | V-017 | n-a | The FAQ scene is not metric-led proof. |
| hvac.astro: FAQ question-system-answer route | no | V-018 | n-a | It is not a tile graphic. |
| hvac.astro: FAQ question-system-answer route | no | V-011 | fail | It does not create urgency; it only asserts that a question becomes a verified answer. |
| hvac.astro: FAQ question-system-answer route | no | V-012 | n-a | There is no large stat moment or stat block. |

Verdict count: pass 7 / fail 11 / n-a 14
