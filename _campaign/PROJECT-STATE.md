---
title: "Project: Company Email — 4-Model Build (Why building now matters)"
status: active
owner: robert
spec_kind: legacy
created: 2026-06-17
tags: ["campaign", "email", "crm", "multi-ai", "newsletter"]
---

# Project: Company Email — 4-Model Build ("Why building now matters")

Company-wide email to the BWM CRM. General "Friends of BWM" essay (Robert-personal / Yellow Alert voice) + per-client personalized variants (team voice) for 5 clients. Built collaboratively by 4 frontier models (Claude/Opus, Codex GPT-5.5 x-high, Gemini, Grok), synthesized by Claude, QA'd by Claude, HITL by Robert, then hardcore delivery+analytics smoke test, then send. Goal: lead generation + client retention.

## Canonical artifacts (worktree `/Users/robertechevarria/bwm-email-campaign`, branch `feat/company-email-4model-2026-06-17`)
- **Plan (source of truth):** `~/.claude/plans/we-need-to-do-expressive-teapot.md`
- **Living sync doc:** `_handoffs/HANDOFF-4model-email-campaign-2026-06-17.md`
- **Build contract (FINAL copy + layout):** `_campaign/spec/campaign-spec.md`
- **Synthesis matrix + scores:** `_campaign/spec/synthesis-matrix.md`
- **Recipient roster (dry-run):** `_campaign/spec/recipients-dryrun.md`
- **Verified references:** `_campaign/spec/verified-references.md`
- **Send-system build spec:** `_campaign/spec/send-system-spec.md`
- **4 blind takes + seal hashes:** `_campaign/takes/{TAKE-claude,TAKE-codex,TAKE-gemini,TAKE-grok}.md` + `SEALS.txt`
- **Rendered email (authored by Claude):** `/Users/robertechevarria/email-campaign-render/email-base.html` (NOT in repo — website .html gate; Robert-approved marker `.bwm-preflight-passed` present)
- **Preview-assembly script:** `_campaign/assemble-previews.sh` (paths target the render dir)

## Status (2026-06-17, end of session 1)
✅ P0 setup · ✅ P1 four blind takes (Claude 4.57 / Gemini 4.05 / Codex 3.86 / Grok 3.55) · ✅ P2 synthesis → build contract · ◐ P3 build (email-base.html authored by Claude; 5 per-client block fragments NOT yet rendered) · ◻ P4 QA · ◻ P5 HITL (Robert) · ◻ P6 smoke · ◻ P7 send.

## Key decisions (locked this session)
- Voice: general essay = Robert-personal (Yellow Alert #050505/#FFEB00, Playfair/DM Sans); per-client blocks = "we/team".
- Upgrade trigger (008/RM): full Ascend rate ($7K/mo + $15K install) applies per-client only once system is live + producing attributable results; proof-first; never print discounted rate. Anchored with cost-of-assembly ($25-50k/mo, 6-7 vendors).
- Tier-voice: 008/RM/ASAP = "proven, reliable" (NO FOMO); D2S/Townsend (Pro) = early-mover OK.
- ASAP Monday.com = one-time courtesy + upgrade seed (entry-tier scope policy).
- Timeline-honesty: "came faster" fenced to automation/build lane ONLY (Apr-29 autonomous build early); growth predictions MISSED (Meta test killed Jun-4, zero qualified leads) — stated plainly; strengthens Google-Ads pivot.
- References verified real: Dario "Machines of Loving Grace"; OpenAI "Built to benefit everyone" (Jun-8-2026); Anthropic Fable 5 (Jun-9-2026).

## Landmines (verified)
- The "246 CRM prospects" = 208 CLIENT-owned leads + synthetic; only **9** real BWM prospects. Recipient resolver hard-scoped to `client_id=BWM-self` + the 5 named client slugs — client leads CANNOT receive this. Real mailable audience ≈ 22 core (8 friends/partners + 6 client owners personalized + 8 client team general); prospects(9)/other(16) held for Robert.
- Never print a client's own discounted price.
- "Ascend Lite" is a dead tier name.

## Open for Robert
1. Physical mailing address (CAN-SPAM footer — required before send).
2. Recipient prune: include the 9 cold prospects + 16 "other"?
3. Ursula & Associates — general or personalized? ($99/mo until $2M ROI).
4. D2S co-owner Joseph Sisson — personalized block or general?

## Known tooling issues (follow-up, not blockers)
- `bwm-codex --ephemeral` discards apply_patch file writes (self-certifies "PASS", writes 0 files). Both P3 Codex attempts failed → Claude hand-built. Fix: bwm-codex must not use --ephemeral for persist-builds, or verify file existence post-run.
- bwm-website-builder Pre-Flight gate fires on ALL `.html` Write/Edit globally; override-marker write is classifier-denied. Email .html lives in a non-repo render dir w/ Robert-approved marker. Consider scoping the gate to website source, or an email exemption.

## Remaining (next session)
P3 finish (5 blocks from spec §4 → assemble 6 previews) → P4 QA → P5 Robert HITL on rendered screenshots + recipient list → P6 build send system (send-system-spec.md, bwm-email-worker .ts) + pre-send 5 gates + seed sends → P7 batched send + post-send delivery/analytics smoke + `narrative kind=broadcast-verified`.
