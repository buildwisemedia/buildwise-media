# Fresh Session Prompt: Installed Advantage Visual QA

```text
We are continuing the Buildwise Media website in:

/Users/robertechevarria/buildwisemedia.com

Preview target:
http://127.0.0.1:4322/

Current state:
The site is in the "Installed Advantage" pass. The copy/strategy now points at the right core belief, but the rendered site still has visible design and polish errors. This session is visual QA and conversion-design repair, not a restart.

Do not restart from scratch.
Do not revert unrelated changes.
Read the repo before proposing edits.
Audit rendered pages before proposing design changes.
Preserve the Installed Advantage strategy unless I explicitly approve a strategy change.

Core routes:
- /
- /book
- /system
- /pricing
- /services/ascend
- /results

Primary buyer:
Owner/operator of a service business.

Primary belief to create:
Buildwise installs and operates Ascend, a rapidly improving AI growth system on the client's domain. The client owns the domain, data, accounts, workflows, code, and built assets. Buildwise runs the system weekly. As frontier AI improves, the system can inherit useful new capability without the owner needing to learn, rebuild, or re-platform.

Current homepage hero direction:
"Own the AI growth system your competitors wish they had."

Current CTA language:
Use "See If We're a Fit" unless we explicitly approve something better.

Important positioning:
- The Dossier is the fit/aiming mechanism, not the core product story.
- The core story is what Buildwise installs, owns, operates, and improves for the client.
- The AI urgency should be concrete: the system starts learning now, compounds monthly, and inherits better capability as AI improves.
- The page must make the value felt, not merely explained.

Avoid stale phrases:
- "free AI Marketing Audit"
- "Revenue Engine"
- "Build-Right Guarantee"
- "Outcomes Commitment Card"
- old Poor Four names like Lead Drought, Manual Mayhem, Owner Trap, Reactive Mode
- hidden/private pricing framing
- six-layer Ascend language

Your job:
Run a fresh visual/conversion QA pass and repair the site so it feels premium, persuasive, readable, and intentionally designed across desktop and mobile.

Before editing:
1. Run `git status --short` and note existing dirty files without reverting them.
2. Read `docs/website-iterations.md` and this prompt.
3. Audit the rendered site at `http://127.0.0.1:4322/`.
4. Capture screenshots for each core route at mobile and desktop widths.
5. Identify concrete visual errors with route, viewport, and screenshot evidence.
6. Inspect relevant source files after the rendered audit.
7. Give me a concise visual repair plan and wait for approval if the repairs are broad.

Visual QA rubric:
- First-screen clarity: buyer immediately understands the pain solved and value offered.
- CTA visibility: primary CTA visible early on mobile, preferably within the first 580px.
- Visual hierarchy: headlines, subheads, proof, visuals, and CTAs have clear priority.
- Scanability: no dense walls of text; sections can be understood by skimming.
- Heading composition: long strategic headings must be broken into readable lines; emphasis should highlight meaning-bearing words, not decorative filler.
- Decorative-line safety: headings and display numerals must not cross center rules, card borders, chart rules, or divider lines unless the collision is intentionally designed and obviously legible.
- Visual persuasion: diagrams/panels should make the installed system, ownership, weekly operation, and AI upgrading feel real.
- Chart clarity: milestone dots, callouts, and labels must read as intentional data marks; no marker should look accidentally placed on a line.
- Crop safety: oversized numerals, hero panels, and proof modules must remain fully readable inside their containers at desktop, tablet, and mobile crops.
- Control affordance: sliders, toggles, calculators, and other adjustable controls must announce their interactivity visibly before hover or focus.
- Mobile polish: no clipped text, awkward cropping, cramped cards, broken grids, oversized type, or hidden actions.
- Desktop polish: first viewport should feel composed, not like a giant document or half-cropped dashboard.
- Rhythm: reduce excessive vertical sprawl and repeated same-looking panels.
- Trust: proof, ownership, risk reversal, and pricing should be legible without overexplaining.
- Brand fit: dark console aesthetic is allowed, but it must feel premium and intentional, not monotonous or mechanically generated.

Implementation rules:
- Keep edits scoped to visual/conversion repair unless a copy line is causing the visual problem.
- Prefer the existing Astro/CSS structure and design tokens.
- Do not add heavy video, external fonts, large unoptimized assets, or a new framework.
- Do not introduce a new landing page.
- Do not bury the current CTA.
- Do not make the site more text-heavy.
- Use visuals to carry more of the explanation.

Acceptance criteria before final response:
- `npm run build` passes.
- Rendered screenshots reviewed for all six core routes on mobile and desktop.
- No obvious text overlap, broken button text, clipped important content, or incoherent first-screen composition.
- No heading/center-line collisions, accidental chart marker placement, cropped display numerals, or hidden slider affordances on the homepage.
- Mobile primary CTA is reachable early on `/`, `/book`, `/system`, `/pricing`, `/services/ascend`, and `/results`.
- Banned/stale phrase scan passes.
- `_verification/.../manual-visual-review.md` records `Status: accepted` before any full-surface-closure claim.
- Final answer includes what changed, what was verified, and any remaining visual risks.
```
