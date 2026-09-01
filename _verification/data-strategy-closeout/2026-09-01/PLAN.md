# BWM website data-strategy closeout plan

State: AGREED — SOL + FABLE 5 R2  
Scope: private-development website and internal data-path implementation only  
Website source anchor: `5e40c4dd4dbbe755009bb6ccf445e490e52318b6`  
Accepted `/book` SHA-256: `ef7532d4baeb21d3d39f26b69c71ccae59326f766b5ddff7a87a7c022040893d`  
Existing private E2E receipt SHA-256: `aceb63aefabb018616d28ec4618195a83bd3ffac350837333d790db220d1d8a4`

Agreement receipt: Fable 5 R2, score 96, zero blockers, session `6e85c4c3-2a01-46c3-ab61-9083c7bec1f7`; Sol accepts the same exact revised plan.

## Decision

Complete the missing measurement loop without changing the accepted page or turning the contact form into a qualifier. The raw submission remains a contact request. Human review is the authority that can turn it into a qualified or disqualified business outcome. Analytics, advertising feedback, and reporting must all join through the same stable `submission_id` and `contact_id`.

## Frozen event contract

| Stage | Canonical fact | Authority | Identity | Provider behavior |
|---|---|---|---|---|
| Form success | `fit_note_submitted` | Durable endpoint success | `submission_id` | Browser GA4 event after capture + email receipt |
| GA4 compatibility | `generate_lead` | Same durable endpoint success | same `submission_id` | Remains the GA4 key event; not a second business lead |
| Human review | `good_fit`, `not_fit`, `working_it`, `quoted`, or `booked` | Access-authenticated CRM user | `contact_id` + source status-event ID | No provider call by itself |
| Qualified | `lead.qualified.unbooked` or `lead.qualified.booked` | First verified qualifying disposition | `submission_id`, `contact_id`, deterministic source event | Creates one authoritative lifecycle event |
| Disqualified | `lead.disqualified` | Verified `not_fit` disposition | same identity chain | Creates one authoritative lifecycle event; no ad conversion |
| Opportunity/revenue | deal stage and value | CRM/deal readback only | `deal_id` linked to `contact_id` | Unknown stays unknown; no automatic deal or revenue claim |

`form_submit_lead` is not added to `/book`; `paid_lead_submit` stays exclusive to the separate paid landing-page contract. This prevents three names from counting one action as three leads.

## Execution phases

### 1. Freeze and repair the contracts

1. Add a versioned `/book` data contract that names:
   - the one raw-submission event;
   - the compatibility GA4 event;
   - the stable identity fields;
   - first-touch and last-touch attribution behavior;
   - synthetic/internal exclusions;
   - the human qualification authority;
   - prohibited double-counting.
2. Refresh the growth integration manifest and SEO account contract to the current exact source hashes and the already-verified private-development state.
3. Keep every production/provider state false unless a matching live readback exists.

Acceptance:
- Deterministic contract test fails on a renamed conversion, missing stable ID, raw-submit qualification, stale source hash, or accidental production claim.

### 2. Prove the GA4-to-CRM identity join

1. Verify that `submission_id` is registered as a GA4 custom dimension and is queryable through the Data API before launching a new canary. Registration is not retroactive; if it is missing, register it only within the already-authorized BWM GA4 property and record the provider receipt before the canary.
2. Add a read-only reconciliation script that accepts a `submission_id` and produces one receipt from:
   - GA4 Data API event rows for `fit_note_submitted` and `generate_lead`;
   - `lead_submissions`;
   - `contacts`;
   - `comms_log`;
   - any lifecycle event, ad receipt, and deal.
3. Report each source as `observed`, `pending`, `absent`, or `not_applicable`; never coerce pending GA4 processing to observed.
4. Verify that synthetic/internal traffic is labeled and excluded from business lead counts.
5. Run a fresh private canary through the real page and reconcile it after GA4 makes the row available. A realtime hit is transport evidence only, not the final Data API join.

Acceptance:
- One exact receipt shows the same `submission_id` on the page event and durable CRM submission, and the same linked `contact_id` on downstream records.
- The verifier fails for a mismatched ID, duplicate durable capture, duplicate email receipt, or a synthetic row counted as a business lead.

### 3. Make human qualification usable in Bob's CRM

1. Reuse the existing generic CRM disposition RPC and append-only status ledger; do not add a second CRM.
2. Add an Access-authenticated internal disposition endpoint for a selected client slug.
3. Add plain-language Lead Monitor actions for BWM: `Good fit`, `Not a fit`, `Still reviewing`, `Quoted`, and `Booked`.
4. Keep intake `qualification_status=review` immutable as the intake classifier's fact. The later human decision lives in `client_disposition` and its append-only status event.
5. Define `Good fit` in the UI and disposition contract as the Brain qualified-lead rule: a contactable human with a stated need, received through a BWM channel, whose submission was durably delivered. The click asserts those facts, not reviewer intuition.
6. Fail closed if Access identity is missing; a command key or opaque token cannot self-assert a human reviewer.
7. Permit clearly flagged synthetic canaries to traverse disposition and lifecycle projection so the path is testable. Preserve the synthetic flag, exclude them from business totals, and hard-block them at every advertising egress. Reject synthetic rows only when they arrive unflagged or would enter business counts.

Acceptance:
- Tests prove tenant scoping, Access-derived actor identity, valid transitions, idempotent confirmation, rejection of cross-client writes, preservation of flagged synthetic canaries, and rejection of unflagged synthetic/business-count contamination.
- UI tests prove one click produces one ledger transition and visibly reloads the new state.

### 4. Project one authoritative business outcome

1. Add a new BWM-tenant-scoped projection function and the smallest file-first database migration needed to project verified BWM disposition events into `operational_events`. Do not modify or reuse the D2S-tenant-locked projection as BWM authority:
   - qualifying first transition -> `lead.qualified.unbooked` or `lead.qualified.booked`;
   - verified `not_fit` -> `lead.disqualified`;
   - `working_it` and repeated confirmations -> no new qualification event.
2. Treat `Booked` after `Good fit` as a progression: the later verified status event may emit `lead.qualified.booked` with its own deterministic source-event identity, but reporting still counts one distinct lead identity rather than two leads.
3. Use a deterministic event ID derived from the source status-event ID so replay is a no-op.
4. Include `contact_id`, `submission_id`, attribution fields, qualification authority, and synthetic flag; include no unnecessary PII.
5. Do not overwrite the intake classification and do not create a deal automatically.

Acceptance:
- Negative controls fail an unverified actor, wrong tenant, raw submit, repeat transition, synthetic conversion, or missing identity join.
- Exactly one lifecycle event exists per logical verified transition.

### 5. Prepare—but do not falsely activate—advertising feedback

1. Treat only the authoritative qualified lifecycle event as eligible feedback. A raw form success is never a qualified ad conversion.
2. Produce a deterministic, PII-minimized feedback projection containing the stable event ID and available click IDs (`gclid`, `gbraid`, `wbraid`, `fbc`, `fbp`).
3. Persist an explicit state per destination: `eligible`, `blocked_no_click_id`, `held_no_destination_authority`, `canary_blocked`, `provider_accepted`, or `provider_failed`.
4. Do not send to Google or Meta unless the exact BWM destination, conversion action, consent basis, and provider authority are verified. This task does not authorize spend or campaign activation.

Acceptance:
- A qualified canary cannot leave the system.
- An unqualified contact cannot become eligible.
- A missing click ID remains a visible hold, not a silent drop.
- Provider acceptance can only be claimed from the provider receipt.

### 6. Close the reporting loop

1. Add one read-only BWM `/book` source-to-outcome view or report using existing records wherever possible:
   - submission received;
   - email receipt recorded;
   - human disposition;
   - qualified/disqualified lifecycle event;
   - ad-feedback state;
   - deal stage;
   - won/lost state;
   - known revenue.
2. Keep raw inquiries, qualified leads, opportunities, won deals, and revenue as separate metrics.
3. Count qualified leads by distinct joined lead identity (`contact_id` plus its canonical `submission_id`), never by lifecycle-event row, so booked progression cannot double-count a lead.
4. Keep missing facts null/unknown and exclude synthetic/internal rows from business totals.

Acceptance:
- A synthetic canary renders as excluded.
- A real lead with no deal shows unknown outcome and revenue, not zero or lost.
- Counts reconcile to the underlying ledgers for the same bounded window.

### 7. Independent closeout

1. Run website QA and the existing form-handler suite.
2. Run migration static tests, RLS/advisor checks if DDL was necessary, Command API tests, Command UI tests, and private page conversion tests.
3. Run `codex review` on every non-trivial internal-code diff and fix verified findings.
4. Run Fable 5 on the final exact diffs and receipts. Reopen implementation if Fable finds a material mismatch with this agreed plan.
5. Commit and push each repository independently. Keep the website private-development only and report production as unauthorized/not performed.

## Explicit non-goals

- No homepage, `/book`, or offer rewrite.
- No quiz, calendar, pricing, automated prospect follow-up, or automatic qualification.
- No public website deployment.
- No paid campaign activation or spend.
- No automatic deal creation or revenue attribution.
- No Brain supersession from this task.

## Definition of done

The closeout is complete only when one private canary can be traced from the accepted page to its durable CRM identity, its email receipt, a human-reviewed outcome path, and an honest source-to-outcome report; all duplicate, cross-tenant, synthetic, unverified-actor, and false-revenue negative controls fail; Codex review is clean; Fable 5 agrees the implementation matches the plan; and the receipts name exact commits/hashes while keeping production false.
