# Design rationale — "Heartwood"

## Concept

A tree does not replace its trunk every season. It adds rings, and the oldest rings become
the strongest part of the structure. That is the Buildwise relationship: the Pilot is the
heartwood — the first, permanent center — and every later cycle of work becomes another
ring in the same trunk. The whole page is built around that one idea, told three ways at
three scales:

1. **A line that keeps going** (transformation section): the three steps sit on one line
   that dissolves off the right edge instead of ending — the sequence has no step four
   because it never stops.
2. **A short segment on a long line** (Pilot bridge): the 90 days are drawn as the first
   small brass segment of a much longer timeline with more systems marked further out.
   The Pilot literally cannot be read as the end of anything.
3. **Growth rings** (long-term section): the functional diagram. Center = the Pilot, one
   problem. Each ring outward = improve what works, build the next system, across the
   business. An outer dashed ring is always forming. Remove this diagram and the
   compounding, long-term shape of the engagement has no picture — that is its job.

## Palette

Evergreen ink `#1B2A23`, warm oat paper `#F5EFE2` and parchment `#EFE6D2`, pine `#2C6E4F`
for line work on light surfaces, sage `#7FB894` on dark, and brass `#D9A050` as the single
action color (buttons, the Pilot segment, the heartwood center). The locked mark's neon
yellow is deliberately the only yellow on the page — it sits as one jewel on the evergreen
nav and footer, uncopied and uncompeted-with. All text pairs were checked against WCAG:
ink/paper ≈ 10:1, pine on paper ≈ 5.3:1, brass on ink ≈ 5:1, ink on brass ≈ 5:1.

## Typography

Display and body in a local old-style serif stack (Iowan Old Style → Palatino → Georgia)
for an editorial, established-business register — this reads like a firm you'd trust with
your operations, not a SaaS launch page. UI (kickers, buttons, nav) in the system sans;
diagram labels in the system mono, which supplies the quiet "engineering" note. Body is
19px on desktop and 17.4px at 390px; hero support runs 21px.

## Composition and visual path

Five full-bleed bands alternate evergreen and paper: hero (ink) → transformation (oat) →
Pilot bridge (ink) → long run (parchment) → close (ink). Each light section overlaps the
previous dark one with a large rounded top — a ring edge — so the page itself accretes in
layers as you scroll. Inside each band there is exactly one place to look next: kicker →
headline → support → one diagram → one action. Brass appears only where a decision or the
Pilot lives, so the eye tracks it as "the thing happening." The closing band bookends the
hero headline over the final CTA.

## Visual-story logic

The three diagrams are one system — the same stroke language at three zoom levels (a
segment of a line, the whole line, the line wrapped into rings). Every visual answers the
removal test: the step-path proves the sequence continues; the timeline proves 90 days is
an entry, not an engagement; the rings show the relationship compounding across the
business. There is no other imagery. Motion is optional and restrained: reveals, the
Pilot segment growing once, the rings drawing once — all gated behind
`prefers-reduced-motion` and fully visible with JavaScript off.

## Mobile behavior (390px)

The step path rotates vertical with nodes on a left rail; the timeline stays horizontal
(time reads left-to-right) and drops its second mid-label; the ring diagram scales full
width below its legend; nav anchors collapse, keeping mark + name + CTA on one line. No
horizontal overflow; skip link, focus rings, and semantic landmarks throughout.

## Why this is not a standard AI-company site

No dark-purple gradient, no glassmorphism, no circuit lines, no product screenshots, no
card grid, no invented numbers. Warm organic materials (wood, paper, evergreen) argue the
positioning by temperature: AI here is not a gadget bolted on, it is something that grows
into the structure of an established business. The one metaphor — rings — is doing the
strategic work the brief asked for: it makes "the Pilot is the way in, not the whole
relationship" visible without a single extra claim.
