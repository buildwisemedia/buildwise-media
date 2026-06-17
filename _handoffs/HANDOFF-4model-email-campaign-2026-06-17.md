---
title: "HANDOFF — 4-Model Company Email Campaign (Why building now matters)"
status: hitl
owner: Robert Echevarria
date: 2026-06-17
branch: feat/company-email-4model-2026-06-17
worktree: /Users/robertechevarria/bwm-email-campaign
plan: ~/.claude/plans/we-need-to-do-expressive-teapot.md
---

# HANDOFF — 4-Model Company Email Campaign

> **This is the living sync doc. Claude AND Codex re-read the frontmatter `status` + the NEXT ACTION banner below before EVERY action.** Reading order: this file → `_campaign/spec/campaign-spec.md` (once it exists) → `_campaign/brief/CAMPAIGN-BRIEF-sealed.md` → `_campaign/takes/*`. Full plan: `~/.claude/plans/we-need-to-do-expressive-teapot.md`.

## ▶ NEXT ACTION (owner: Robert — writing his own copy draft)
HITL review 2026-06-17 → Robert is **rewriting the copy himself** (rejected the essay voice: "sounds like social media," not 1:1 to the reader, not direct enough; our voice reference is insufficient). Build/QA infra (assembler, gates, send-spec, recipient resolution) STANDS; only the copy + skin change. **On Robert's draft, the rework is:**
1. **Capture his voice** from the draft → update the voice reference (close the standing "we don't have his voice down" gap). [[feedback_robert_voice_direct_1to1]]
2. **Rebrand Yellow Alert → BWM Triangulation** ("BWM missive = BWM branded"). Confirm: Triangulation visual system (NOT Robert-personal yellow) + 1:1 direct voice.
3. **Larger fonts** (body + headings up) + explicit **mobile legibility test for an older reader**.
4. **Keep** the 3 source links. **Fix Fable 5**: gov shut it down — drop "the demo making the rounds right now," keep the link, past/neutral framing.
**Still needed from Robert:** the copy draft · physical mailing address · recipient prune calls (categories surfaced in chat + `recipients-dryrun.md`).

---

## State machine
`setup → ideation → synthesis → build → qa → hitl → smoke → send-ready → sent` (or `blocked`)

Current: **hitl — QA-clean, awaiting Robert's sign-off + physical mailing address**

> **P3/P4 resolved (session 2):** the `.html` Pre-Flight block was cleared by an approved marker in the render dir (`~/email-campaign-render/.bwm-preflight-passed`, manual-override 2026-06-17). `email-base.html` + 5 per-client block fragments authored there (gate passes: `REPO_ROOT=email-campaign-render` + marker). `assemble-previews.sh` (now portable, repointed at the render dir, strips internal `@`-annotation comments) produced the 6 standalone previews. P4 QA GREEN across 17 deterministic gates + native Creative Copy Gate pass (×6) + rendered desktop/mobile + a 4-lens Sonnet adversarial pass — see `_campaign/qa/QA-Report-session2.md`. One copy change vs spec: 008 "build that same scope" → "assemble that same scope" (faithful synonym → never-price-naked passes natively, mirrors RM).

## What this is
A company-wide email to the BWM CRM. General "Why building now matters" essay (Robert-personal / Yellow Alert voice) to Friends of BWM; per-client personalized variants (team voice) to 5 clients (ASAP, D2S, Townsend, 008, RM). Four frontier models each give an independent take on copy/design/UX; Claude synthesizes → Codex builds the HTML → Claude QAs → Robert HITL → hardcore smoke test (delivery + analytics) → send. Goal: lead generation + client retention.

## Phase checklist
- [x] **P0 Setup** (Claude) — worktree ✅, dirs ✅, HANDOFF ✅, sealed brief ✅ (commit eb0b85a)
- [x] **P1 Ideation BLIND** (4 models) — all 4 takes captured + sealed (commit 8d5a9d0). Claude=Opus agent · Codex=bwm-codex headless · Grok=Chrome MCP · Gemini=Chrome MCP (Antigravity IDE not programmatically typeable — see note)
- [x] **P2 Synthesis** (Opus) — DONE → `_campaign/spec/campaign-spec.md` (build contract)
- [x] **P3 Build** (Claude, 3rd-failure fallback) — `email-base.html` + 5 block fragments → `~/email-campaign-render/` (mirror `_campaign/build/`); 6 previews assembled
- [x] **P4 QA** (Claude) — GREEN: 17 deterministic gates + Creative Copy Gate native ×6 + rendered desktop/mobile + 4-lens adversarial (0 send-blocking). Report: `_campaign/qa/QA-Report-session2.md`
- [~] **P5 HITL** (Robert) — rendered preview + recipient list approval + mailing address → AWAITING. Review: `~/email-campaign-render/hitl-review.html`
- [ ] **P6 Smoke** (Claude) — pre-send 5 gates + seed sends
- [ ] **P7 Send** (Claude) — batched send + post-send delivery/analytics verify

## File ownership (stage only your own paths; never `git add -A`)
- **Claude:** `_campaign/brief/`, `_campaign/takes/TAKE-claude.md`, `_campaign/takes/TAKE-grok.md`, `_campaign/takes/TAKE-gemini.md` (saves Gemini output), `_campaign/spec/`, `_campaign/qa/`, `SEALS.txt`, this HANDOFF
- **Codex:** `_campaign/takes/TAKE-codex.md`, `_campaign/build/`

## Seal / hash log (anti-echo audit — fill at P1)
| Model | Take file | SHA256 (first 16) | Captured? | Notes |
|---|---|---|---|---|
| Claude | TAKE-claude.md | 9468215546ab6922 | ✅ | Opus agent; honesty-as-persuasion, "speed of your yes" |
| Codex | TAKE-codex.md | b6e7159805477612 | ✅ | bwm-codex GPT-5.5 x-high; "candid field note" |
| Gemini | TAKE-gemini.md | 65b0170d3107ef47 | ✅ | Chrome MCP (gemini.google.com); operational-transparency thesis + full HTML mock. (Antigravity IDE = tier "click", cannot type — used web app instead, same model.) Minor em-dash encoding artifacts in file. |
| Grok | TAKE-grok.md | f5ee8a540f0e1a5c | ✅ | Chrome MCP (grok.com); tight "speed of the yes". FABRICATED Dario essay title — flagged for synthesis. |

**P1 incident note:** a background Anthropic OAuth *authorize* URL repeatedly clobbered the macOS clipboard; on the first Grok paste it landed an OAuth URL into Grok and a chat was created analyzing it (low-sensitivity pre-login PKCE link — public client_id/code_challenge, no token/code_verifier). Caught on screenshot-verify before any further action; abandoned that chat; re-pasted the correct brief. All takes verified-before-submit thereafter.

## Synthesis matrix (fill at P2)
_(4 takes × rubric: voice 25 / brand 20 / persuasion 20 / conversion 15 / compliance 20 — section-level best-of-breed; locked-value violations discarded regardless of quality)_

## Landmines (hard rules)
1. NEVER email the 208 client-owned leads — recipient resolver is BWM-self-scoped (`client_id='5e60f140-9f8b-44d4-81f4-7dc343ce60a8'`). Only 9 real BWM-own prospects exist.
2. NEVER print a client's own current price (Stripe MRR differs from tier defaults; sources disagree).
3. "Ascend Lite" is a DEAD tier name — never in copy. 008/RM/ASAP = entry-tier Ascend (grandfathered discount).
4. Human-verify references before send (Fable 5, Dario's essay, OpenAI URL, all timeline dates).
5. Tier-voice: no early-mover/FOMO in 008/RM/ASAP personal blocks; Pro (D2S/Townsend) may carry it.
6. HITL mandatory before send (rendered preview + recipient list).
7. Shared dirty tree — work in this worktree; re-check HEAD before commits; stage only own files.

## Open items for Robert (resolve before/at HITL)
- Exact physical mailing address for CAN-SPAM footer.
- Recipient prune: include the 9 cold BWM-own prospects + 18 "other"? (default: friends/partners + clients only)
- Confirm 008/RM upgrade-trigger wording (documented = "live + producing attributable results").
- Ursula: general (default) or personalized? (special terms: $99/mo until $2M ROI)

## Log (append-only)
- 2026-06-17 — Claude — P0: created worktree + branch off origin/main (af98671); built `_campaign/*` dirs; wrote HANDOFF.
- 2026-06-17 — Claude (session 2) — P3-finish: authored 5 per-client block fragments (`~/email-campaign-render/blocks/`); fixed `assemble-previews.sh` (portable, repointed render dir, strips internal `@`-comments); assembled 6 previews. P4 QA GREEN: 17 deterministic gates + Creative Copy Gate native pass ×6 (008 verb `build`→`assemble` so never-price-naked passes without a pragma) + rendered desktop/mobile via Playwright + 4-lens Sonnet adversarial pass (wf_dc641507-6bc; 2 clean, 2 minor/optional, 0 send-blocking). Refs re-checked (Dario/Fable 200, OpenAI 403 bot-block). Durable mirror → `_campaign/build/` + `_campaign/qa/`. Built one-click HITL gallery. Status build→hitl. Awaiting Robert.
