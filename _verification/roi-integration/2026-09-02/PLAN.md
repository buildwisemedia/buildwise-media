# BWM website ROI execution plan

**Frozen:** September 2, 2026, 6:54 AM Eastern
**Owner:** Robert Echevarria
**Executor:** Sol in the existing BWM website task
**State:** accepted by Fable 5 at 96/100 with zero blockers
**Production authority:** none

## Goal

Finish the internal work that connects the new BWM website to the reusable
Organic Growth systems and to BWM's revenue follow-through. The website is one
consumer of the shared AEO, SEO, Social, and Video systems. It is not the shared
harness and must not fork or replace those systems.

This plan does not authorize a production website or Worker deployment, a CRM
write, an email or prospect send, a sales-system activation, paid media, a
provider change, or public publishing.

## Controlling evidence

1. Canonical Brain project
   `projects/Project-BWM-90-Day-Revenue-Execution.md`, read at SHA
   `732600aa244c24721ffc663aa2ab891fc4279e1f`.
2. Robert's website decision receipt: one visible action, **See If We're a Fit**
   to `/book`; no public pricing; 90 days is the engagement term, not a public
   promise that every problem will be finished in 90 days.
3. Current website worktree
   `codex/bwm-book-contact-20260831` at
   `d5a9f39ccb513104fbfe4481e76ab78cd3399679`, clean and equal to its remote
   branch at freeze time.
4. Current private deployment
   `https://bwm-new-website-review.pages.dev/`, Access-gated. The deployment
   receipt binds deployment `fe5ea4e7-8084-487b-b8b3-49d2ce9899e4` to source
   commit `550191b0427d9b3c3812463021644d67952d74c2`.
5. Website integration manifest in
   `growth-integration/contracts/integration-manifest.json`, which pins shared
   schema `540baee5...`, AEO `ba9be3a4...`, SEO `b906da71...`, and Social/Video
   `ae304ebb...`.
6. Private `/book` conversion-loop receipt
   `_verification/data-strategy-closeout/2026-09-01/live-private-data-loop-receipt.json`.
7. Live CRM read-only snapshots taken September 2, 2026. They show six open deal
   rows, all last updated more than 14 days ago, plus nine pending rows in the
   generic `lead_followups` table.
8. Canonical Brain project
   `projects/Project-BWM-One-Session-Client-Close-Packet.md`, SHA
   `d904c07758a894fec4d7a90ded508ea98835f7c1`.
9. Active-task reconciliation: the Universal SEO OS and Universal Social +
   Video OS tasks are both currently running. Their worktrees are owned by
   those tasks and are read-only to this plan.

The March 2026 `BWM-Website-Build-Data-Flow-Plan.md` remains a draft and is not
current authority. Its Cal.com flow, visible-hidden pricing scheme, retired
offer language, Meta/ads activation, and old page plan do not override the
August/September owner decisions or the current accepted website.

## Exact current state

| Workstream | Built | Independently reviewed | Deployed | Live | Missing or held |
|---|---|---|---|---|---|
| New homepage and `/book` | Yes | Yes; local/private website receipts exist | Yes, private Access-gated deployment only | Yes, private review only | Public production deployment and production URL readback require Robert's direct authorization |
| BWM AEO/SEO website integration | Yes, pinned to exact shared-engine commits | Yes for the pinned website candidate; the shared engine tasks may produce newer candidates | Yes, private only | Private only | Reconcile any newly accepted shared-engine hashes; production crawler, CDN, rendered-page, canonical, sitemap, GSC, and rollback readbacks |
| Website-to-Social/Video source contract | Yes; approved site claims, proof, page jobs, action, rights, and prohibited expansion are hash-bound | Yes as part of the private site integration | The source contract is present in the private site | No Social/Video publishing runtime is live from this website task | The shared Social/Video task is still hardening; accepted replacement hash, channel-account authority, human approval, runtime registration, and publishing authority are absent |
| `/book` form and stable submission identity | Yes; one contact form, stable `submission_id`, first/last-touch capture, and human-only qualification | Yes; Fable plan and implementation reviews scored 96 | Yes, private | Yes, private | Production Worker/site deployment and production canary |
| CRM and email delivery from `/book` | Yes for private route | Yes; browser canary reached CRM and one email receipt was recorded/opened | Yes, private route | Yes, private canary | Production route and production lead readback |
| GA4 conversion measurement | Browser dispatch of `fit_note_submitted` and `generate_lead` is verified with the same `submission_id` | Yes for dispatch contract | Present on private site | Dispatch live on private canary | The internal synthetic canary produced zero Data API rows; a real production conversion join is not proven |
| Real BWM deal list | CRM table exists; six open rows observed | No current reconciled ledger | CRM itself is live | Six rows are live but stale | Terminal classification, identity repair recommendations, owner, current blocker, next decision, source packet, two-refresh parity, and zero-silent-drop proof |
| Sales follow-up state | Generic `lead_followups` table exists with nine pending rows | Not reviewed as a BWM deal-close system | Database table is live | Rows exist | Determine which rows, if any, belong to the six BWM deals; do not equate generic follow-ups with authorized prospect contact |
| One-session client close packet | Yes in `/Users/robertechevarria/bwm-esign` | Yes; protected Fable PASS, 121 Python tests, 25 Worker tests, and browser evidence | No | No | The candidate is still uncommitted. Gates 4 and 5—canonical legal/policy release and exact provider/activation authority—remain held |
| 50-prospect acquisition compiler | Old workflow files exist | No accepted current implementation | No | No | Current offer cleanup, durable persistence, source provenance, owner/contactability verification, client/prospect/suppression dedupe, first real 50-row batch, top dossiers, drafts, and fail-closed dry run |

## Important data corrections

- The August 29 opening hypothesis of seven open deals is stale. The live count
  is six.
- All six current rows are stale by the more-than-14-day rule.
- At least two open rows are obviously not new sales opportunities: Robert/BWM
  is BWM's own client record and Mauricio/Cronos is a current client.
- The `M77 Phase 0 Gate` row is labeled in its contact notes as test evidence,
  but its synthetic flag is false. It must be treated as a data-quality defect,
  not counted as a real lead.
- Cabdi has a separate active client record, while the deal contact is linked
  to the BWM client ID. That identity collision must be resolved from source
  evidence before classification or any follow-up.
- HopeSky and Giovanni require current-interaction evidence before they can be
  called active opportunities. A stale CRM stage is not enough.

## Execution sequence

### 1. Accept this exact plan

- Hash this file.
- Send these exact bytes unchanged through `bwm-fable-review`.
- Fable must check scope, current-state truth, authority boundaries, ordering,
  data safety, and binary completion criteria.
- Sol repairs only valid findings, creates a new hash, and resubmits the entire
  unchanged new version. Repeat until Fable returns `ACCEPT`, `AGREE`, or
  equivalent zero-blocker acceptance, or until a real external blocker is
  proven.

### 2. Freeze shared-engine inputs without colliding with active tasks

- Read the final state of the active Universal SEO and Universal Social + Video
  tasks after they stop changing.
- If their accepted hashes equal the site's pinned hashes, record parity.
- If a task produces a new accepted hash, do not copy it into the site until
  its exact receipt proves deterministic QA and independent acceptance.
- A new shared hash invalidates only the affected integration evidence. Re-run
  the smallest exact website integration and regression panel for that hash.
- Do not edit shared engine worktrees from this task.

### 3. Build the read-only six-deal truth package

- Capture two read-only CRM snapshots with observation time, query hash, row
  count, and source identity.
- Keep raw provider IDs and emails in a local private evidence map. The tracked
  review ledger uses opaque stable deal keys and source hashes, not email
  addresses or secrets.
- Give every open row exactly one terminal state:
  `REAL_OPPORTUNITY`, `CURRENT_CLIENT`, `DUPLICATE_OR_TEST`, or
  `UNKNOWN_REVIEW_REQUIRED`.
- Human intent and identity may not be inferred from regex or fuzzy-name
  matching. Classification requires direct CRM facts plus source evidence.
- For each real opportunity, create a source-backed internal packet with last
  verified interaction, current blocker, accountable owner, next decision,
  contactability status, offer compatibility, exact evidence references, and
  explicit unknowns.
- Prove six-of-six coverage, zero silent drops, zero clients/tests counted as
  prospects, stable repeat output, and explicit source drift when snapshots
  differ.
- Produce recommendations only. Do not mutate CRM rows, follow-up rows, stages,
  owners, tasks, notes, tags, or messages.

### 4. Separate follow-up truth from close-packet truth

- Reconcile the nine pending `lead_followups` rows against the six open deals by
  exact IDs. Report matched, unrelated, duplicate, overdue, and unknown counts.
- Treat the one-session close packet as the legal/signature/payment mechanism,
  not as proof that sales follow-up is active.
- Re-run its five canonical criteria read-only. Criteria 1–3 may be refreshed;
  criteria 4–5 stay `HELD` unless exact canonical release and provider/activation
  authority exist.
- Do not modify the dirty `bwm-esign` working tree or commit someone else's
  changes.

### 5. Build a review-only prospect compiler candidate

- Work in a clean isolated branch/worktree from the current `bwm-workflows`
  remote main. Never edit its dirty shared checkout.
- Reuse useful structure from `acquisition-pipeline.js`, `proposal-gen.js`, and
  `outreach-sequence.js`; do not reuse stale public pricing, 30-day promises,
  lead-generation-agency framing, or retired CTA language.
- The compiler consumes a frozen ICP/offer packet, public-source evidence, the
  current client/prospect list, and suppression inputs. It emits only a local
  versioned review ledger.
- Every prospect needs a stable ID, official-domain provenance, verified
  owner/decision-maker state, contactability state, revenue-fit evidence or
  explicit unknown, reason for fit, dedupe result, and source timestamps.
- Build deterministic negative controls for stale offer input, missing source,
  unverifiable owner, client collision, duplicate identity, suppression hit,
  unstable repeat output, and unauthorized publish/send mode.
- Compile 50 only when all 50 satisfy the frozen minimum evidence contract.
  Otherwise report the truthful smaller accepted count and continue research;
  never pad with low-confidence rows.
- Produce source-bound dossiers and unsent three-touch draft candidates for the
  highest-confidence 10–20 only after the ledger passes. Drafts are review
  artifacts, not authorization to create provider drafts or send.

### 6. Re-prove the website and data loop

- Run the website preflight, deterministic build/tests, brand/growth/pre-ship
  gates, accessibility, desktop/mobile pixels, conversion behavior, and
  no-console-error checks against the exact final site hash.
- Re-run `/book` negative controls: validation failure, CRM capture failure,
  email failure, replayed submission, synthetic exclusion, wrong CTA, wrong
  canonical, accidental noindex, broken analytics identity, and contradictory
  schema.
- Verify the private deployment still matches its receipt. Do not redeploy it
  unless a site-source change is required and the private-only deployment is
  separately within current authority.
- Seal one combined local receipt with every component labeled `BUILT`,
  `REVIEWED`, `PRIVATE_DEPLOYED`, `PRIVATE_LIVE`, `HELD`, or `MISSING`.

## Binary finish conditions

Internal work is complete only when all of these are true:

1. Fable accepts the exact final plan hash with zero blockers.
2. The shared-engine/site hash matrix is current and has no silent substitution.
3. The read-only deal package covers the exact live denominator twice, with one
   terminal classification per row and no identity/intent inference.
4. Every real opportunity has a source-backed decision packet; every unknown is
   named rather than guessed.
5. Follow-up rows are reconciled separately from the close packet.
6. The close packet's five criteria are truthfully labeled; held authority is
   not called a defect or a pass.
7. The prospect compiler's deterministic and negative-control tests pass, and
   its first batch is a truthful evidence-backed count rather than a padded
   target.
8. Website and `/book` regression gates pass on the final exact hash.
9. The combined receipt confirms zero production deploys, zero CRM/provider
   writes, zero external sends, zero sales activation, zero paid activation,
   and zero public pricing changes.

## Later authority gates

These are deliberately outside this execution:

- Robert's direct production website/Worker deployment authorization.
- Production DNS/CDN/crawler, rendered-page, sitemap, canonical, GA4, CRM,
  email, and rollback readbacks.
- Canonical legal/policy release and provider activation for the close packet.
- Exact recipients, copy, schedule, and channel approval for any sales contact.
- Social/Video channel authority, human content approval, and publishing.
- Paid-media activation or spend.
