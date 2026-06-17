# NEXT-SESSION PROMPT — 4-Model Company Email (paste this to resume)

> Paste the block below into a fresh session. It points at the plan file so we stay on track.

---

We're resuming the **4-model company email campaign** ("Why building now matters"). Context ran out mid-build last session.

**READ FIRST, IN THIS ORDER (do not skip — the plan is the contract):**
1. The PLAN: `~/.claude/plans/we-need-to-do-expressive-teapot.md`
2. The living sync doc: `/Users/robertechevarria/bwm-email-campaign/_handoffs/HANDOFF-4model-email-campaign-2026-06-17.md` (frontmatter `status` + NEXT-ACTION banner + landmines)
3. The build contract (FINAL copy): `/Users/robertechevarria/bwm-email-campaign/_campaign/spec/campaign-spec.md`
4. Brain project: `projects/Project-Company-Email-4Model-Campaign-2026-06.md`

**Working location:** worktree `/Users/robertechevarria/bwm-email-campaign` on branch `feat/company-email-4model-2026-06-17` (off origin/main; do NOT build in the dirty main checkout). `git status` + re-check HEAD before committing; stage only your own files.

**What's DONE:** P0 setup · P1 four blind takes (sealed) · P2 synthesis → build contract · the general email HTML is authored at `/Users/robertechevarria/email-campaign-render/email-base.html` (Robert-approved `.bwm-preflight-passed` marker is in that dir, so .html writes there are unblocked).

**DO NOT repeat these dead ends:**
- `bwm-codex` (the `--ephemeral` wrapper) silently discards file writes — it self-certifies "PASS" but writes 0 files. If you must use Codex to build files, call `codex exec --dangerously-bypass-approvals-and-sandbox -C <dir>` WITHOUT `--ephemeral`, and verify files exist after. Otherwise hand-build (per the choreography's 3rd-failure clause — Claude already did for email-base.html).
- The bwm-website-builder Pre-Flight gate blocks ALL `.html` Write/Edit. Only the render dir `/Users/robertechevarria/email-campaign-render/` has the override marker — write email `.html` THERE, not in the repo.

**REMAINING WORK (resume at P3-finish):**
1. **P3 finish** — render the 5 per-client block fragments from `campaign-spec.md` §4 into `/Users/robertechevarria/email-campaign-render/blocks/block-{asap,d2s,townsend,008,rm}.html` (Yellow Alert styling, seam line, single reply CTA; 008/RM carry the price-anchor paragraph verbatim). Then run `bash /Users/robertechevarria/bwm-email-campaign/_campaign/assemble-previews.sh` to produce the 6 standalone previews in `…/email-campaign-render/preview/`.
2. **P4 QA** — render desktop+mobile, light+dark (Playwright/preview tools), screenshot each. Verify against `campaign-spec.md` §6: FK 5-7, one soft reply CTA with proof above it, price ONLY in 008/RM with the cost-of-assembly anchor, no client's own price, no "Ascend Lite", no vendor names except Monday.com (ASAP only), tier-voice (no FOMO for 008/RM/ASAP), timeline-honesty caption present, references = the 3 verified links. Run the Pre-Ship Grep Gate + Creative Copy Gate over the copy.
3. **P5 HITL** — send Robert the rendered screenshots (desktop+mobile) + the recipient roster (`_campaign/spec/recipients-dryrun.md`) for sign-off. Nothing sends before this. Get from Robert: physical mailing address; prospects/other prune decision; Ursula general-vs-personalized; D2S co-owner Joseph Sisson block decision.
4. **P6 build send system** — implement `send-system-spec.md` in `/Users/robertechevarria/bwm-email-worker` (.ts files, gate-free): recipient resolver (BWM-self + 5 client slugs ONLY — never the 208 client leads), `email_suppression` migration (RLS-on-create + file-first binding; YOU apply it, not Codex), unsubscribe HMAC routes, idempotent batched Resend send, smoke routes. Run pre-send 5 gates + seed sends to BWM-owned Gmail/Apple/Outlook.
5. **P7 send** — after HITL: batched live send (10/batch, 1s/send, 30s/batch), then post-send delivery+analytics smoke (T+5/T+30: 100% provider_id, ≥95% delivered, bounces ≤2%, complaints 0, GA4 /g/collect fires with the email UTM). Emit `narrative kind=broadcast-verified` with the scorecard.

**DEFINITION OF DONE:** design HITL-approved → hardcore smoke test (delivery + analytics) GREEN → sent. Not done until P7 verified.

**Goal:** lead generation + client retention. Strategic context + per-client asks (ASAP Monday.com, D2S/Townsend pilots, 008/RM upgrade trigger) are all in the plan + `campaign-spec.md` §4.
