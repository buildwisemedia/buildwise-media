# Buildwise Media Website Iterations

This ledger tracks meaningful website direction changes so future design, copy, and QA sessions can recover the current intent without guessing from the git history alone.

## OC-2026-05-21 - Operating Console

- **Name:** Operating Console
- **Status:** Dev snapshot
- **Branch:** `homepage-redesign-2026-05-21`
- **Review tag:** `v51-review-operating-console-2026-05-21`
- **Primary conversion route:** `/book`
- **Core scope:** `/`, `/book`, `/system`, `/pricing`, `/services/ascend`, `/results`
- **Direction:** Premium AI operating-system website for Buildwise Media. Dark Triangulation base, acid yellow authority signal, cyan visibility cues, green proof/healthy states, orange risk/urgency states, and red leak/failure states.
- **Performance constraints:** CSS/SVG-native visuals, no heavy video, no external font loading, delayed analytics, lazy booking embed, and mobile Lighthouse target of 95+.
- **QA evidence:** `npm run build` passed; desktop and mobile screenshot QA completed for all core routes; `/book` passed five-step interaction QA with final submit only on step 5; stale-copy gate passed on rendered site surfaces; internal link crawl passed; schema presence and JSON-LD parse checks passed; Lighthouse passed on home and `/book`.
- **Lighthouse snapshot:** Home scored Performance 100, Accessibility 96, Best Practices 100, SEO 100. `/book` scored Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- **Screenshot evidence:** Stored locally in `/Users/robertechevarria/Documents/Codex/2026-05-21/we-are-working-on-the-buildwise/qa-cdp`.
- **Next copy workflow:** Use `docs/prompts/copywriting-operating-console.md`. The next copywriting session must ask for owner input before editing copy.

### Notes For Future Iterations

- Keep the operating-console metaphor if the page is still presenting Ascend as a technical growth system rather than a generic agency service.
- Preserve one primary yellow forward CTA on each `/book` step, with a quiet Back button and final submit only on step 5.
- Treat pricing as direct and visible. Do not return to hidden or private pricing framing.
- Preserve plain SEO/AEO answers: what it is, who it is for, how it works, what it costs, what changes in 30 days, and what the client owns.
