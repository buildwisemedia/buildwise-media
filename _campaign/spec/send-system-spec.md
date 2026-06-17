# Send-System Build Spec — guarded CRM broadcast (for P6/P7)

> Build target repo: **`/Users/robertechevarria/bwm-email-worker`** (has RESEND_API_KEY, SUPABASE_SERVICE_KEY, WORKER_AUTH_KEY, the `/webhook/resend` receiver, the digest renderer, and the `client_comms.sent` emit). Build on a branch; **Codex writes CODE + TESTS only — NEVER applies the migration, NEVER deploys, NEVER pushes to main.** Claude reviews → runs tests → applies migration (supervised) → deploys → smoke. This sends real email; over-engineer safety.

## Files to create in `bwm-email-worker/src/`
- `broadcast.ts` — recipient resolver + suppression + per-recipient render + idempotent batched send + `client_comms.sent` emit.
- `unsubscribe.ts` — HMAC token verify + one-click `POST /u/:token` + hosted `GET /u/:token` page.
- `smoke.ts` — pre-send gates + post-send delivery/analytics verify.
- `templates/broadcast-base.ts` — loads the approved HTML (from the campaign build) + token substitution.
- `broadcast.test.ts` — vitest: token-leak guard, suppression layers, idempotency, recipient-scoping (asserts NO client-owned leads), HMAC round-trip.
- `migrations/NNN_email_suppression.sql` — table + RLS + REVOKE (file only; Claude applies).

## Routes in `src/index.ts` (Bearer WORKER_AUTH_KEY except the 2 public unsubscribe routes)
- `POST /broadcast/render?dry_run=1` → resolve+suppress+render, return recipient table + rendered HTML/text, **send nothing**.
- `POST /broadcast/send` (body: `{campaign_tag, mode:"seed"|"live", confirm}`) → batched send; `live` requires a one-time `confirm` token.
- `POST /broadcast/smoke` → post-send delivery+analytics scorecard.
- `GET /u/:token` (public) → hosted unsubscribe confirmation page (Yellow Alert styled).
- `POST /u/:token` (public) → List-Unsubscribe-Post one-click → insert suppression → 200.

## Recipient resolver (SAFETY-CRITICAL — mirrors `_campaign/spec/recipients-dryrun.md`)
- **General/friends/prospect/other:** `client_id = '5e60f140-9f8b-44d4-81f4-7dc343ce60a8'` ONLY, `contact_type IN (referral_partner, mastermind_peer, personal_friend[, prospect, other per HITL flags])`, real (`NOT is_synthetic_contact`), has email.
- **Personalized (owners):** the 5 named clients' `client_owner` (and team→general per HITL). Join via `clients` slug → id; restrict to the 5 slugs. **The BWM-self scope + slug restriction structurally excludes the 208 client-owned leads.**
- Dedupe by lowercased email; personalized variant wins. Test MUST assert zero rows with `client_id NOT IN (BWM-self, the 5 client ids)`.

## Suppression (before send, in order): is_synthetic → email_suppression table → prior bounce/complaint (`john@ivyapp.com`) → missing contact_id → dedupe. Dry-run report lists each bucket.

## Render tokens: `{{PREVIEW_TEXT}}` (per segment, spec §1), `<!--PER_CLIENT_BLOCK-->` (inject owner's block; general = none), `{{unsubscribe_url}}` (`/u/<hmac-token>`), physical-address (Robert's value once supplied). **Residual `{{`/`}}` or unresolved `[HUMAN-VERIFY]` = hard render error.** Wire the 2 verified reference links (verified-references.md) before send; physical address still required.

## Send: one Resend call/recipient (no list leak); headers List-Unsubscribe + List-Unsubscribe-Post:One-Click + X-Entity-Ref-ID=idempotency_key; reply_to replies@replies.buildwisemedia.com. UTM on every href except unsubscribe: `?utm_source=email&utm_medium=broadcast&utm_campaign=<tag>&utm_content=<slot>`. Idempotency_key = sha256(campaign_tag:lower(email)); skip if already in operational_events/comms_log → resumable, never double-sends. Rate: 10/batch, 1s/send, 30s/batch; kill-switch row checked each batch; auto-pause if batch-1 bounce >5%. Emit `client_comms.sent` per recipient (channel/direction/provider/contact_id/campaign_tag/provider_id) → trigger fans to comms_log.

## Migration `email_suppression` (RLS-on-create + file-first binding)
```sql
CREATE TABLE public.email_suppression (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_lower text GENERATED ALWAYS AS (lower(email)) STORED,
  reason text NOT NULL CHECK (reason IN ('unsubscribe','bounce','complaint','manual')),
  source text, contact_id uuid REFERENCES public.contacts(id),
  created_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX email_suppression_email_lower_uniq ON public.email_suppression(email_lower);
ALTER TABLE public.email_suppression ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_suppression FROM anon, authenticated;
```
Extend `/webhook/resend`: on `email.bounced`/`email.complained` → INSERT suppression (reason, source='webhook') ON CONFLICT DO NOTHING.

## Unsubscribe token: `base64url(contact_id).hmac_sha256(SUPPRESS_HMAC_KEY, contact_id:email)` (new wrangler secret). Verify HMAC before any write (no enumeration).

## Smoke gates (the DONE gate)
- **Pre-send (all green):** (1) token-leak over full list; (2) every href has UTM + 200; (3) Playwright render light+dark @600/680px → 4 PNGs; (4) seed sends to BWM-owned Gmail/Apple/Outlook inboxes + visual confirm + provider Unsubscribe link present; (5) spam-content + Creative Copy Gate + Pre-Ship Grep Gate.
- **Post-send (T+5/T+30):** 100% have provider_id; ≥95% delivered ≤30min; bounces ≤2%; complaints=0; client_comms.sent rows present w/ campaign_tag; each landing URL fires `/g/collect` with the email UTM ≤8s (gtag truthiness ≠ proof). GREEN/RED/YELLOW per plan. Emit `narrative kind=broadcast-verified` with the scorecard; on RED `incident.opened`.

## Deliverability: send from established `hello@buildwisemedia.com` (SPF+DKIM aligned; send.buildwisemedia.com return-path). No warmup (~22-47 warm recipients). DMARC p=none acceptable for this send (flag p=quarantine hardening separately).

## Reconciliation: do NOT use the `outreach-sequence` harness (it suppresses all clients — built for cold prospects). Adopt its safety philosophy only.
