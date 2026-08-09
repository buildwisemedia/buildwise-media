# CLAUDE.md

## What BuildWise Media is — and is not

BuildWise Media builds and operates AI-powered growth systems that local service
businesses (plumbers, roofers, contractors, trades) own outright. BWM installs and
runs the system — site, service/search pages, lead paths, follow-up, tracking,
reporting — and the client keeps the asset: their domain, accounts, data, and code.

**Never describe BuildWise Media as an agency** — not a marketing agency, SEO
agency, PPC agency, or lead vendor. The entire market positioning is "the agency
alternative" (see `src/pages/playbook/*-alternative.astro`). This applies to all
copy, summaries, commit messages, and PR descriptions.

## Sources of truth — verify, don't infer

- **Products, pricing, tiers, territory model:** `src/data/canonical.json` (synced
  from The Book in the `bwm-strategic-roadmap` sibling repo via `npm run
  sync-canonical`; the committed copy is what builds deploy against). Never quote a
  price or product detail from memory — read this file.
- **Positioning and voice:** the `/playbook` pages and Brand QA (`qa/`,
  `npm run qa:brand`).
- **Process and SOPs:** the BWM Brain (via the bwm-brain-router skill).

State nothing about the business you haven't verified against these. If you must
estimate, label it as a guess.

## This repo

The buildwisemedia.com site: Astro 5 + `@astrojs/cloudflare`, deployed on
Cloudflare Pages. Routes live in `src/pages/` (marketing pages plus the
`/playbook` content library). `npm run dev` / `build` / `preview`; brand QA via
`npm run qa:brand` (requires a build).

## Working rules

- Never fake progress: stubs, skipped tests, hardcoded values, and disabled checks
  get flagged in your summary, never reported as done. "Done" means verified — you
  ran it, tested it, or read it back.
- Ask before anything hard to undo: sending email or messages, spending money or
  invoicing, publishing, deploying, merging, force-pushing, deleting data,
  DNS/hosting/billing changes. Unsure whether it's reversible? Treat it as
  irreversible.
- If two real attempts at an approach fail, stop and report what you tried and
  what you'd try next — thrashing is not persistence.
- End substantial work by listing the judgment calls you made, one line each.
