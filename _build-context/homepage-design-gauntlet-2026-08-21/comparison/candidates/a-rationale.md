# Design rationale — Buildwise Media homepage direction

## Concept

**"The compounding loop."** The page tells one story in four movements: the promise (hero), the path (three steps), the door (the 90-day Pilot), and the horizon (the long-run relationship). The Pilot is explicitly framed as "where we begin," and the closing diagram shows it feeding a continuing loop of learning, improving, and building — never an endpoint.

## Palette

A deliberately warm, non-monochrome, non-"AI startup" system:

- Deep ink navy (`#101828`) — authority and structure; used for the transformation band.
- Warm cream paper (`#F7F3EA`) — editorial, human background.
- Terracotta (`#C14E21`) — primary action and emphasis color; warm and craft-like, not tech blue.
- Grounded moss green (`#3F6212`) — the "long run" color, signaling growth and continuity.
- Pale blue tint (`#DCE7F2`) — a quiet bridge surface for the Pilot section.

Contrast pairs (white on terracotta/moss/ink) meet strong contrast floors; focus states use a 3px terracotta outline.

## Typography

System serif display (Iowan Old Style / Palatino / Georgia fallback) paired with the platform system sans for body and UI. The serif gives an editorial, consultative voice for an experienced owner-executive audience — closer to a trusted advisory than a SaaS pitch. Body copy is 18px desktop / 17px mobile.

## Composition

Strong section differentiation via alternating full-bleed bands: cream hero → ink step rail → pale-blue Pilot bridge → cream long-run. The step rail is a numbered horizontal timeline (stacking vertically on mobile) with a terracotta top rule, giving a literal left-to-right reading path. The Pilot section is centered and quiet — a deliberate full-stop moment. One CTA, one locked phrase, repeated consistently.

## Visual-story logic

The single large visual is an explanatory diagram (`@r020:F2`): a dashed compounding loop with four nodes — Pilot (90 days) → Learn from work → Improve what works → Build the next — with two green branches to "new system" nodes. It answers: *if this disappeared, the long-term nature of the relationship would be much harder to grasp.* It contains no dashboards, circuits, or decoration. The locked mark (`@r020:identity`) appears unchanged at identity scale in the navigation, paired with the text "Buildwise Media."

## Mobile behavior

At 390px: single-column rail, stacked two-column long-run section, fluid `clamp()` headings, compact nav CTA, and no horizontal overflow (all widths fluid; SVG scales with `viewBox`).

## What makes this unlike a standard AI-company site

Warm paper-and-terracotta craft palette instead of dark neon or blue gradients; a serif editorial voice instead of geometric sans minimalism; one honest hand-drawn-feel loop diagram instead of fake product screenshots, glowing circuits, or invented metrics; and copy that treats the reader as a busy executive, with the Pilot framed as the beginning of an ongoing relationship.

## Motion

Restrained by design: only hover color transitions and smooth scrolling, both disabled under `prefers-reduced-motion`. The page is complete with motion removed.
