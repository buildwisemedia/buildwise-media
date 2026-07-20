# Design Dispatch Brief — Project Hub: "The Rebrand Gauntlet" (3-round blind design bake-off)

One-pass build of a single self-contained HTML page. You are designing the hub the judge uses to navigate a blind design competition. Make it a pleasure to use — you have creative freedom, but navigation clarity beats spectacle here.

## Output contract
- ONE self-contained HTML file. CSS/JS inline; Google Fonts `<link>` allowed; nothing else external. Responsive. Light or dark.
- The literal placeholder tokens below MUST appear in the file exactly as written — they get replaced mechanically later: `{{SEAL_SHAS}}` and `{{COST_LEDGER}}`.
- Do not invent competition results, scores, or model names — the hub is neutral: entries are only A, B, C.

## Page content (all of it, in your arrangement)
1. Title: "The Rebrand Gauntlet" — subtitle: "Three rounds. Three anonymous builders. One judge."
2. Short how-it-works block for the judge: open all three entries in each round, pick the one you'd ship, judge like a paying client. Placeholder photo areas are intentional (no photography existed; same handicap for every builder).
3. A sealed-integrity line rendering the token `{{SEAL_SHAS}}` in monospace (it will hold verification fingerprints).
4. Three round cards, each with its task one-liner and three big entry links (A / B / C):
   - Round 1 — "ACME Heating & Air": fictional premium HVAC homepage, wow-factor round. Links: `../blind/r1-A.html`, `../blind/r1-B.html`, `../blind/r1-C.html`
   - Round 2 — "Cost per Task": executive dashboard of real AI-work telemetry. Links: `../blind/r2-A.html`, `../blind/r2-B.html`, `../blind/r2-C.html`
   - Round 3 — "The Rebrand": Buildwise Media homepage reborn as a sales page (yellow + logo survive, nothing else). Links: `../blind/r3-A.html`, `../blind/r3-B.html`, `../blind/r3-C.html`
5. A "verdict" block telling the judge how to answer: reply with picks per round, e.g. "R1: B · R2: A · R3: C", plus what they loved/hated.
6. A cost section rendering the token `{{COST_LEDGER}}` (it will hold the per-builder cost table after the reveal).

## Hard bans
Rounded/geometric display sans ≥800 as display voice · default coral/red accent · decorative arc clutter · rotated stamps · ghost numerals · number-in-circle step cards · autoplay/popups.
