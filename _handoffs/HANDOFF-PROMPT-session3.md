# NEXT-SESSION PROMPT — Company Email "Why building now matters" (paste to resume)

> Paste the block below into a fresh session. Read the Brain doc first; it's the source of truth.

---

We're continuing the **BWM company email "Why building now matters."** Read these first, in order:
1. **Brain (canonical state):** `projects/Project-Company-Email-4Model-Campaign-2026-06.md` (full state, locked decisions, mailing list, remaining phases).
2. **Robert's voice:** `voice/Robert-Echevarria-Content-Voice-Spec.md` (his actual register — direct, 1:1, candor-forward).
3. **Robert's draft (copy source):** `bwm-email-campaign/_campaign/source/robert-draft-2026-06-17.md`.

**Working location:** branch `feat/company-email-4model-2026-06-17` in `/Users/robertechevarria/bwm-email-campaign` (HEAD `47f6f1c`). Live files in `/Users/robertechevarria/email-campaign-render/` (has the `.bwm-preflight-passed` marker so .html writes pass).

**The live draft is `essay-wow.html`** — BWM Triangulation brand, full motion build (hero dot-graph + scanline, self-drawing weeks-by-2027 chart, danger→relief closing-aperture, $300K→$10M+ count-up, monthly-leads bars, advertising signal-board, brand-mark bullets, launch-rail timeline, closing orbit, 3 differentiated offer CTAs with one-click mailto). `essay-review.html` = plain twin. Edit `essay-wow.html` via **Bash/python** (the R020/SDT Edit-tool gates false-block on its many functional SVGs). Render via headless Chrome (Playwright MCP blocks file://; serve on localhost:8137) — see Brain doc "Known tooling issues."

**What's locked:** BWM brand · Robert's voice · weeks-by-2027 chart (Anthropic) · 8× = Anthropic's number · $10M+ approved · 008 leads = "~150 since launch" (real monthly Feb16/Mar81/Apr35/May17) · per-segment footer ({{relationship}} = client/friend) · mailing address **3724 Marlborough Dr, Tucker, GA 30084** · mailing list v3 = **40 people**.

**Open for Robert:** (1) his copy pass on the 3 offer cards; (2) sign-off line wording; (3) name confirms — "Adie" McCalmon first name + "Rich Mather vs Matherne"; (4) which wow beats to dial up/down.

**REMAINING PHASES (in order):**
- **A — finish the essay.** Fold in Robert's copy pass + tweaks on `essay-wow.html`; lock the copy.
- **B — build the outbound email.** (1) Convert the approved essay to **email-client-safe HTML** (table-based, inline CSS; the wow animation is browser-only → email links to a "view in browser" rich version, or ship a tasteful static email). Build friend + client variants (per-segment footer/preview/offers). (2) Build the guarded send system per `_campaign/spec/send-system-spec.md` in `bwm-email-worker`: recipient resolver hard-scoped to BWM-self + the 5 client slugs (→ the 40-person list, 219 client-leads + synthetic walled off), `email_suppression` migration (RLS-on-create + file-first), HMAC unsubscribe, idempotent batched Resend send, `client_comms.sent` events. Pre-send 5 gates + seed sends to BWM-owned inboxes.
- **C — analytics + CRM wiring.** UTM on every link (except unsubscribe); GA4 `/g/collect` beacon fires on landing (per `specs/Spec-Analytics-Smoke-Contract.md`); per-recipient `client_comms.sent` with `contact_id` + `campaign_tag`; opens/clicks/replies + the mailto actions (operations/weekly/referral → `replies@`) attributed back to the CRM contact. Post-send delivery+analytics smoke (T+5/T+30) → `narrative kind=broadcast-verified`.

**Definition of done:** Robert approves the rendered essay + recipient list → email-safe variants built → guarded send system + 5 pre-send gates green + seed inboxes confirmed → batched live send → post-send delivery + analytics smoke GREEN (data tied to CRM). Nothing sends before Robert's final go.
