# P4 QA Report — 4-Model Company Email (session 2)

**Date:** 2026-06-17 · **Branch:** feat/company-email-4model-2026-06-17 · **Phase:** qa → hitl
**Artifacts under test:** 6 assembled previews in `~/email-campaign-render/preview/` (durable mirror: `_campaign/build/preview/`), built from `email-base.html` + `blocks/block-{asap,d2s,townsend,008,rm}.html`.

**VERDICT: GREEN — QA-clean, ready for P5 HITL. Zero send-blocking issues. Nothing sends without Robert's sign-off + physical mailing address.**

---

## 1. Deterministic content gates (all GREEN)

| # | Check | Result |
|---|---|---|
| 1 | Price `$7,000`/`$15,000` appears ONLY in 008 + RM | ✅ only 008, rm |
| 2 | Cost-of-assembly anchor `$25,000`–`$50,000` ONLY in 008 + RM | ✅ only 008, rm |
| 3 | Price-anchor ADJACENCY (price + anchor same paragraph) in 008 + RM | ✅ same paragraph both |
| 4 | "Ascend Lite" (dead tier name) anywhere | ✅ 0 occurrences |
| 5 | Client's own discounted price ($622/$240/$99) | ✅ 0 occurrences |
| 6 | Monday.com appears ONLY in ASAP | ✅ asap only |
| 7 | Banned vendor names (GHL/Cloudflare/Supabase/Resend/Cal.com/Twilio/Vercel/Netlify/Mailgun/SendGrid) | ✅ 0 occurrences |
| 8 | 3 verified reference URLs present in ALL 6 (Dario / OpenAI / Fable 5) | ✅ 1 each, all 6 |
| 9 | Timeline-honesty caption ("Growth is a separate story…") in ALL 6 | ✅ all 6 |
| 10 | `[HUMAN-VERIFY — PHYSICAL MAILING ADDRESS]` flag still present (NOT auto-filled) in ALL 6 | ✅ all 6 |
| 11 | Per-segment hidden preview text correct | ✅ all 6 match campaign-spec §1 |
| 12 | CTA count (border-left #FFEB00): general=1, client=2 (essay + block, by design) | ✅ 1 / 2,2,2,2,2 |
| 13 | Seam line present per client, absent in general | ✅ general=0, clients=1 each |
| 14 | Banned CTAs ("Book a Call" / `/book` / "See If We're a Fit") | ✅ 0 occurrences |
| 15 | Residual `{{`/`}}` render tokens after assembly | ✅ none |
| 16 | Internal `@`-annotation comments leaked into shipped HTML | ✅ stripped (clean); MSO conditionals preserved |
| 17 | Banned hex / gradients (#d4a955 / #07070c / #B47EFF / #000 / blue/purple/green/red / gradients) | ✅ 0 occurrences |

## 2. Creative Copy Gate (`creative_copy_gate.py`) — native PASS, all 6
Ran the live hook against every preview: **PASS (exit 0) ×6** — never-price-naked + vendor + Flesch-Kincaid all satisfied with NO `@creative-exempt` escape hatch.
- 008's price paragraph originally lacked a gate-recognized anchor keyword ("build that same scope"); changed verb → **"assemble that same scope"** (faithful synonym, mirrors RM, preserves locked price + full vendor/$25–50k/"fraction of that" anchor). Now passes natively. Both `@creative-exempt` pragmas removed (they were also leaking internal vocabulary into shipped HTML).
- **Flesch-Kincaid grade (gate's own grader):** 008=4.6 · asap=4.4 · d2s=4.4 · general=4.4 · rm=4.6 · townsend=4.5. Gate ceiling = 8.0 ✅. NOTE: below the 5–7 spec target = *more* readable than aimed (short sentences); appropriate for the overworked-SMB-owner persona. Not a blocker.

## 3. Reference resolution (landmine #4)
- Dario "Machines of Loving Grace" → **HTTP 200** ✅
- OpenAI "Built to benefit everyone: our plan" → **HTTP 403** (documented bot-block; the exact URL Robert provided; browser eyeball at HITL closes it)
- Anthropic "Claude Fable 5" → **HTTP 200** ✅
References are named as look-them-up anchors (not summarized/fabricated).

## 4. Rendered verification (Playwright — desktop + mobile)
Computed-style + visual checks against live render (screenshots in `_campaign/qa/screenshots/`):
- Canvas `#050505` ✅ · body `#FAFAFA`/white ✅ · **0 `<img>`, 0 `<svg>`** (email-safe) ✅ · container 600px ✅
- H1 Playfair Display (font loaded) ✅ · `.em-y` accent `#FFEB00` ✅ · `.em-g` body-em `#FFD700` ✅ · single CTA left-border `#FFEB00` 2px ✅
- Timeline = 5-row HTML table ✅; **mobile reflows to stacked cards** with yellow date headers ✅
- General has **no** per-client block ✅; each client variant carries exactly its own block (seam line, 4 paragraphs, bordered reply CTA) ✅
- Per-client tier-voice confirmed at render: 008/asap/rm **0 FOMO/early-mover words**; d2s "ahead of most of your market" + townsend "You're early on this" (Pro early register, allowed) ✅
- 008 + RM price paragraphs render with full anchor (price + 6–7 vendors + $25–50k/mo + "fraction of that") on desktop and mobile ✅

## 5. Independent adversarial pass (4 Sonnet lenses, author≠scorer)
Workflow `email-copy-adversarial-qa` (wf_dc641507-6bc). 2 lenses CLEAN (tier-voice, compliance-landmines). 2 raised findings — **adjudicated as voice authority (Opus); none send-blocking:**

| Finding | Severity (raised) | Adjudication |
|---|---|---|
| "Fable 5 ," stray space | nit ×2 | **DISMISSED** — extraction artifact of the plaintext dump; real email renders "Fable 5," correctly (verified by stripping only `<a>` tags). |
| 008 "we ship the same day" = urgency | minor | **DISMISSED** — responsiveness (our speed for them), not scarcity/FOMO; tier-voice lens (the FOMO authority) cleared all blocks; spec-verbatim. |
| Essay "Here's what I'm seeing…" / "Here's the part that…" pivots | blocking | **DOWNGRADED → optional style note for Robert.** Literal banned strings ("Here's the thing/what matters") absent; one phrasing is natural Robert-voice, one borderline. It's his first-person register → HITL owns it; not silently rewritten. |
| Dual-CTA in client variants (essay CTA + block CTA) | minor | **NOTED, recommend keep.** campaign-spec §6 explicitly designed this ("per-client blocks each have their own single reply ask — by design, separate emails-within-the-email"). Surfaced to Robert. |
| RM win "that's working for you right now" lacks a number | nit | **Optional for Robert.** Locked copy; adding a figure needs verified data (no fabrication). Deliverable claim is concrete; recommend keep or supply a real RM number. |

## 6. What remains (P5 → P7)
- **P5 HITL (Robert):** approve rendered previews + recipient roster; supply **physical mailing address**; decide the open items (prospects/other prune · client team · D2S co-owner Joseph Sisson · Ursula). Optional voice tweaks above.
- **P6 send system:** build `bwm-email-worker` broadcast routes + `email_suppression` migration (RLS-on-create + file-first) per `send-system-spec.md`. NOT started — gated on HITL.
- **P7 send:** batched live send + post-send delivery/analytics smoke → `narrative kind=broadcast-verified`.
