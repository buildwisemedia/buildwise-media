# BWM Client Punch List — Master Log
**Compiled:** 2026-08-08 · **Source window:** 2026-07-13 → 2026-08-07
**Status:** DRAFT FOR ROBERT'S REVIEW — build sessions gated on sign-off

---

## 1. Source coverage & provenance

### 1.1 The 11 highlighted files

| # | File | Type | Parsed? | What I got |
|---|---|---|---|---|
| 1 | Leadership Call — 08/07 08:58 — Notes by Gemini | Doc | ✅ FULL | Notes + **full verbatim transcript** (43:30) |
| 2 | Leadership Call — 08/07 08:58 — Recording | 674 MB video | ⚠️ VIA TRANSCRIPT | Covered by #1 |
| 3 | D2S CRM Plan — 08/06 14:59 — Recording | 363 MB video | ❌ **NO TRANSCRIPT** | **GAP — see §1.3** |
| 4 | Leads Review BWM/D2S — 08/06 11:00 — Notes | Doc | ✅ FULL | Notes + full transcript |
| 5 | Leads Review BWM/D2S — 08/06 11:00 — Recording | 414 MB video | ⚠️ VIA TRANSCRIPT | Covered by #4 |
| 6 | TRG Wrap-up — 08/05 08:59 — Recording | 2.42 GB video | ❌ **NO TRANSCRIPT** | **GAP — see §1.3** |
| 7 | TRG: Strategic Planning — 08/05 12:51 — Notes | Doc | ✅ FULL | Notes + full transcript |
| 8 | TRG: Strategic Planning — 08/05 12:51 — Recording | 772 MB video | ⚠️ VIA TRANSCRIPT | Covered by #7 |
| 9 | BWM/RFM New Lead System — 08/04 09:01 — Notes | Doc | ✅ FULL | Notes + full transcript |
| 10 | BWM/RFM New Lead System — 08/04 09:01 — Recording | 726 MB video | ⚠️ VIA TRANSCRIPT | Covered by #9 |
| 11 | Marketing Meeting — 07/31 11:01 — Recording | 1.04 GB video | ❌ **NO TRANSCRIPT** | Partial substitute — see §1.3 |

**Net: 8 of 11 fully recovered. 3 recordings have no text record at all.**

### 1.2 Key discovery — the audio *is* in the docs
Every "Notes by Gemini" doc contains a **`📖 Transcript` section with the full timestamped, speaker-attributed transcript**, not just a summary. That's why the docs are 300 KB–1 MB. Four of the seven recordings are therefore fully readable as text. The audio was parsed at word level, not summary level.

### 1.3 The gap — three recordings I cannot process
No ASR is available in this environment (no ffmpeg, no Whisper/faster-whisper, no torch/transformers), and the Drive connector returns file bytes into the conversation rather than to disk, so ~3.8 GB of video cannot be moved or transcribed here. For these three, **Google generated no transcript and no Gemini notes**:

| Recording | Size | Substitute used | Residual risk |
|---|---|---|---|
| **D2S CRM Plan** — 08/06 14:59 | 363 MB | Leads Review 08/06 11:00 (same day, 4 hrs earlier) — Robert + Rodel agreed to meet at 3 PM to finalize phone↔CRM integration; this recording *is* that 3 PM session | **HIGH** — the actual CRM architecture decisions are only in this video |
| **TRG Wrap-up** — 08/05 08:59 | 2.42 GB | TRG Strategic Planning 08/05 12:51 (same day, later) + Save Tom 07/30 | **MEDIUM** — the 12:51 session appears to supersede it |
| **Marketing Meeting** — 07/31 11:01 | 1.04 GB | ✅ **"BWM Marketing Plan — The 18-Month Window (v1.0, 2026-07-31)"** — explicitly "snapshot 2026-07-31 after the marketing session" | **LOW** — the plan doc is that meeting's ratified output |

> The Gemini notes doc for this meeting ("Notes - Marketing Meeting") is an **empty template** — `Notes: *` / `Action items: *`, nothing else.

**To close the gap:** open each in Drive → "Ask Gemini" → request a full transcript, or re-run through a transcription tool and drop the text in. Recommend doing this for **D2S CRM Plan** at minimum.

### 1.4 Also parsed (beyond the 11, for the all-client sweep)
Leadership Meeting 08/03 · Save Tom 07/30 · Strategy: Robert–Bronkar 07/13 · ASAP/BWM 08/06 (**empty** — "Look, nothing happened", 6:50, no summary produced) · BWM Marketing Plan 18-Month Window · Brain project files: `two_ursula_disambiguation`, `greta_jaeger_restore`, `ursula_ua_platform`, `008_concrete_offboarded`, `prospect_cronos_contractors`, `patti_moynihan_site`, `adie_mccalmon_site`, `bronkar_site` (index).

### 1.5 Verification passes run
1. **Pass 1** — Drive folder enumeration (100+ files), mapped all 11 highlighted rows to file IDs by name + byte size.
2. **Pass 2** — full-text extraction of every available notes doc, decoded to disk, transcript sections confirmed present and complete ("Transcription ended after HH:MM:SS").
3. **Pass 3** — targeted re-search for transcripts/notes belonging to the 3 orphan recordings. Confirmed none exist.
4. **Pass 4** — entity sweep: regex count of 45 client/person/vertical names across all 7 transcripts to catch anyone the summaries dropped. No client surfaced that isn't in this list.
5. **Pass 5** — cross-check of live meeting content against Brain project-state files for paused/dormant accounts.

---

## 2. ACTIVE — work in flight

### 2.1 Design2Sell (D2S) — Barbara, Emiliya, Rodel
**Health:** 🟢 Strong · **Stage:** Active delivery + CRM build
Leads: 30 raw → **18 qualified** (July, after fit-filtering). Stretch goal 40. GBP views 555→787 (+42%); 60 site visits, 10 calls, 57 direction requests. Paid search $32.89/day, killed $43.89 of job-seeker waste.

| # | Item | Owner | Source |
|---|---|---|---|
| D-1 | Build hidden HTML landing page from 80 MB interior-design PDF, mirroring PDF aesthetics, with download link, unindexed | Henry | 08/06 @00:00:20 |
| D-2 | Share finished landing page link with Emiliya | Henry | 08/06 |
| D-3 | Build the CRM + map project requirements | Robert + Rodel | 08/06 |
| D-4 | Send three-pronged interior-design approach email for approval | Robert | 08/06 |
| D-5 | Deliver full interior-design program map | Robert | 08/06 @00:28:17 |
| D-6 | **Deliver homebuilders program map — due Tuesday** | Robert | 08/06 |
| D-7 | Distribute updated SEO strategy — **due next day (was 08/07)** | Robert | 08/06 @00:25:21 |
| D-8 | Add comment field to lead monitor so Rodel can teach Bob why leads fail | Robert + Rodel | 08/06 @00:04:58 |
| D-9 | Audit July + August lead list — confirm all are in the automatic nurture sequence | Robert | 08/06 @00:10:48 |
| D-10 | Finalize phone system ↔ CRM integration (clicks rose 7→15 WoW) | Robert + Rodel | 08/06 @00:26:20 |
| D-11 | Build second ad-tracking layer to close the Google data loop | Robert | 08/06 |
| D-12 | Yelp review campaign (Amelia's ask — ChatGPT/Yelp connection) | Henry | 08/07 @00:38:31 |
| D-13 | PDF → website conversion with downloadable component | Henry | 08/07 @00:38:31 |
| D-14 | Ingest "rising star" realtor partnership strategy into Bob | Robert | 08/06 @00:31:46 |
| D-15 | Schedule cybersecurity posture meeting | Group | 08/06 @00:15:15 |
| D-16 | Email realtor contact name from July outreach to Robert | Rodel | 08/06 |

**Decisions logged:** hidden landing page over email attachment · lead-monitor comment enrichment.

---

### 2.2 Townsend Realty Group (TRG) — Tom Townsend
**Health:** 🔴 **AT RISK — retention play in progress** · **Stage:** 90-day proof period
$5,999/mo. Tom opened 08/05 by saying he was considering ending the partnership — no perceived ROI. Needs ~1.5 deals/mo (18 transactions/yr) to justify spend. **Agreed baseline: 3 qualified calls/month.** Robert reported on 08/03 that Tom was retained.

| # | Item | Owner | Source |
|---|---|---|---|
| T-1 | **Working session — Tuesday 08/11, 9:00 AM, 90 min** (ops, data connectivity, content) | Robert (invite) | 08/05 @00:52:43 |
| T-2 | Connect website phone system → CRM for attribution (52 calls tracked, origin unverifiable) | Robert + Henry | 08/05 @00:29:55 |
| T-3 | Integrate Bob ↔ KW Command CRM | Robert + Henry | 08/05 |
| T-4 | Stand up Command Center login for Tom (data, approvals, performance) | Robert | 08/05 @00:27:03 |
| T-5 | Segment + nurture the existing CRM database | Group | 08/05 |
| T-6 | Implement spam-call filtering to isolate real leads | Group | 08/05 |
| T-7 | Email the 90-day content document | Henry | 08/05 |
| T-8 | **Unarchive the Slack channel** (archived without Tom's intent; he sends listings there) | Robert | 08/05 @00:55:16 |
| T-9 | Record 30–45 min of video from supplied scripts | Tom | 08/05 @00:49:40 |
| T-10 | Ship content calendar 08/10 → 09/06, 50/50 AI + Tom's recordings | Henry | 08/07 @00:35:49 |
| T-11 | Weekend + Monday build block for Tom | Robert | 08/07 @00:36:11 |
| T-12 | Train Rox on graphic design (frees Henry for AI video) | Henry | 07/30 @00:58:35 |
| T-13 | Provide Hicksfield budget for AI video testing — gated on Henry guaranteeing 2 videos/wk | Robert | 07/30 @01:02:22 |
| T-14 | Redesign homepage + build local pages (Woodstock, Marietta impressions +73.5%, weak CTR) | Robert | 07/30 @00:39:56 |

**Decisions logged:** bi-weekly cadence (not weekly — prep was costing a full workday) · **keep KW Command, do not rebuild CRM** · 90-day evaluation with Tom free to terminate and keep all assets/code · reactivate Slack · pivot from transactional lead-gen to referral/sphere · lead with Tom's certified general appraiser credential.

---

### 2.3 RutherfordMade (RFM) — Scott Rutherford
**Health:** 🟢 Expanding · **Stage:** 60-day pilot, approved 08/04
Pricing: $15,000 initial + $7,000/mo. 18 inbound since June → **$2.43 M pipeline** after filtering. Bottlenecks: design time (2 hrs min/design) and municipal permitting (Atlanta, Fulton, Roswell, Milton).

| # | Item | Owner | Source |
|---|---|---|---|
| R-1 | **Build custom CRM — 3 design versions for Scott to mix and match** | Robert | 08/04 @00:42:54 |
| R-2 | Build Command Center — one-click access to reports + metrics | Robert | 08/04 @00:49:26 |
| R-3 | Move phone number onto Bob-managed system; fix "spam risk" flagging (Scott avoids unknown numbers → missed business) | Robert | 08/04 @00:24:01 |
| R-4 | Improve email notification naming so real inquiries stand out | Robert | 08/04 |
| R-5 | Review all historical leads together; verify qualification status | Group | 08/04 |
| R-6 | Website performance analysis — branded terms, local rank, CTR, conversion; report wins + failures | Robert | 08/04 |
| R-7 | SEO/AEO: backlinks, content refinement, GBP optimization for AI-agent visibility | Robert | 08/04 @00:47:01 |
| R-8 | Migrate Scott off GoHighLevel (done — "got him out of that") | Robert | 08/07 @00:07:15 |
| R-9 | "Triangulation" AI design assist — learn Scott's aesthetic, connect to Structure Studios | Robert | 08/04 @00:37:31 |
| R-10 | Intro Scott to Katherine Marshall → Buckhead Club | Robert | 08/04 @00:54:05 |
| R-11 | Find a permitting expediter | Scott | 08/04 @00:36:15 |
| R-12 | **Follow-up meeting — Tuesday 08/18** | Robert + Scott | 08/04 @00:57:47 |

**Decisions logged:** bi-weekly cadence · AI priority = design process first · start on legacy CRM process, iterate · 60-day timeline.

---

### 2.4 ASAP Pest & Wildlife — Nehemiah
**Health:** 🟢 Very happy · **Stage:** Active + expanding
Nehemiah complimented the build on 08/07. Business partner **James** (Georgia design school, "very picky") to be brought in — Robert accepted.

| # | Item | Owner | Source |
|---|---|---|---|
| A-1 | **Onsite meeting — Wednesday 9:00–11:00 AM** | Robert | 08/07 @00:30:55 |
| A-2 | Stop weekly Monday website report — replace with live CRM data | Allaine | 08/07 @00:11:56 |
| A-3 | Review-gate landing page live (≤4★ → comment form + notify; 5★ → Google) | Robert | 08/07 @00:09:47 |
| A-4 | Command center showing website performance without Google Analytics | Robert | 08/07 @00:10:59 |
| A-5 | Keep Slack (Nehemiah: "let's hold on to it just in case") | Robert | 08/07 @00:11:56 |
| A-6 | Onboard James for design review | Robert | 08/07 @00:10:59 |

> ⚠️ The **ASAP/BWM 08/06 09:00** meeting produced no content — Gemini: "A summary wasn't produced… there wasn't enough conversation in a supported language." Transcript is one line: *"Look, nothing happened."* Ended at 6:50. Nothing to extract.

---

### 2.5 Cronos Contractors — Mauricio Guzman
**Health:** 🟢 Closing · **Stage:** Invoice sent, build starting
~$8 M commercial concrete + masonry, Norcross GA. Intro'd by Daniel Perdomo (5 Points Electrical, GHCA VP). Target: Ascend Pilot $15K, 90-day engagement (internal target day 45 — **never quote 45 to the client**).

| # | Item | Owner | Source |
|---|---|---|---|
| C-1 | **Onsite working session — Wednesday, after ASAP** — sit and start building | Robert | 08/07 @00:30:55 |
| C-2 | Invoice sent — payment inbound; bonus for Henry + Allaine | Robert | 08/07 @00:04:37 |
| C-3 | Decide pricing model for masonry expansion, then multi-company scaling (flat? discount + monthly? per-deal?) | Robert | 08/07 @00:32:03 |
| C-4 | Capture the §7 discovery list from the vertical brief (mix, crew count, how work arrives, phone answering, estimate follow-up, review count, vendor spend, winter utilization) | Robert | Brain |
| C-5 | Add Mauricio as CRM contact (presence unverified as of 07/20) | Robert | Brain |

**Known gaps to exploit:** 0 reviews on every platform checked · NAP drift (3 addresses / 3 phones) · no case studies · no license/bond badges · 4 estimators but no visible bid-follow-up system · orphaned staging subdomain with TLS error · staff cell numbers exposed. Keep stealth — their IP, no public case study until their big push.

---

### 2.6 BWM Internal
**Health:** 🟢 · **Stage:** Heavy build

| # | Item | Owner | Source |
|---|---|---|---|
| B-1 | **Internal PM/CRM app — mid-build** (project stages, comms tracking, workflow visibility) | Robert | 08/07 @00:05:58 |
| B-2 | Model testing harness — route tasks to cheapest capable model (unsubsidized spend would be ~$90K/mo) | Robert | 08/07 @00:19:01 |
| B-3 | Provision Claude account for Henry + secure his machine to connect to Bob | Robert | 08/07 @00:37:17 |
| B-4 | Bob beta: dedicated phone number, per-number registration, agreement + login code. First tester onboarded | Robert | 08/07 @00:14:15 |
| B-5 | Legal automation live — MNDA / Pilot / Ascend Pro / Ascend agreements via API, branded, auto-ingested to client record | Robert | 08/07 @00:04:37 |
| B-6 | Scope the file Allaine sent (Slack #leadership) | Robert | 08/07 @00:01:57 |
| B-7 | Migrate all credentials out of 1Password into the internal vault | Robert | 08/03 @00:59:15 |
| B-8 | Re-harden home network + devices (Claude-driven) | Robert | 08/03 |
| B-9 | Trim SOPs — audit found 85–95% were project-specific | Robert | 08/03 @00:55:36 |
| B-10 | Refine non-technical description of "the harness" (memory, verification, orchestration, governance) | Robert | 08/03 |
| B-11 | Finish Social Publisher Engine (Henry approves → auto-publish GBP + Meta) | Bob/Henry | Marketing Plan |
| B-12 | Revenue Leak Map v2 — flip the work: they give 4 fields, we pull GBP/site/local-search/competitor deltas and return a real leak map + PDF | Claude + Robert | Marketing Plan |
| B-13 | Verify 008 Concrete (~44–48 leads) + D2S (130%+ MoM) numbers against the claim ledger before any public use | Claude + Bob | Marketing Plan |

**Decisions logged:** Slack restricted to legacy clients (Tom, Scott, Nehemiah); **email for all new clients** · Bob replaces Wes as primary AI OS; Sarah retained for email · marketing packages no longer a default offering — sold only on request · graphic design moves to Rox · paid ads stay **PAUSED** until LPs rebuilt + keywords re-cut + one real end-to-end submit proves the lead path.

---

## 3. PAUSED — waiting on the client

| Client | Why paused | Waiting on | Next trigger |
|---|---|---|---|
| **Ursula Lentine** (Healing With Ursula → *Dr. Ursula Lentine, Root Cause Leadership Advisor*) | Robert reached out re: her website; she's paused | Her | Site build exists in worktree `~/bwm-campaigns-ursula`, branch `feat/ursula-lentine-site`. Lisa McGuire's copy deck is **authoritative and repositions her** — navy/gold executive authority, explicitly **not** wellness/pastel/spiritual. Priority: home → about → media. **Free client.** Resume on her word. |
| **Greta Jaeger** (Break Through Now) | Domain migration to Cloudflare Registrar; waiting on her | Her SMS 2FA code | Site is **live and verified** (11 pages, 200s, mail proven). BWM is now Account Admin on NetSol acct 125493076 — **11 domains** visible. `gretajaeger.com` **unlocked, transfer-ready**. Need EPP code → paste into CF (~$11, zero downtime). Then retire RedWagon/FatCow hosting (~$30/mo she still pays) — **check Workspace isn't reseller-billed first.** |
| **Ursula & Associates** (Jason Wilson, U.A. Wilson Realty) | Jason communicated by text; waiting on him to set an appointment | Jason | $99/mo legacy friend rate. **Brand Proof delivered** — Brivity audit of **15,294 contacts**: 51% never touched, 8,583 of 13,468 active contacts dark ≥12 mo, 374/982 past clients dark. Found-money: **$210K / $1.05M / $2.5M** gross listing commission per year in the dark pool. Bob intro email sent to jason@ + erin@ 07/17 — asks "turn it on" or "show me". **Open blocker:** one public brand or two (U&A vs Inspire Realty Group)? Build can't lock scope until answered. Also: `bwm-ursula.pages.dev` needs a brand pass — Robert: "so off brand." |
| **Hope Sky** (Miriam, healthcare) | She's at a conference; Robert holding off to avoid seeming eager | Her | Follow up if no word by weekend. Website work already strengthened the relationship (her preferred palette). Stealth — no name, no sector detail until she approves. |
| **Adie McCalmon** | ✅ Light build **APPROVED 07/27** | Her GoDaddy delegate access or a screen-share | Canonical = branch `codex/adie-custom-site`, CF Pages alias `custom`. **Nothing else blocks cutover.** At cutover: drop `noindex` from `_headers` **and** per-page meta, attach domain, verify 4 Wix 301s, QA + Pre-Ship, GSC + sitemap, keep Wix parked 30 days, confirm barter in writing. |
| **Patti Moynihan** | Version C chosen 07/23, edits live 07/27 (v9) | Her: office address, LLR verify, ED-story variants | **Was due LIVE by 07/31 — now overdue.** Blockers are *not* copy: (1) contact form is a dead stub — `action="#"` + preventDefault, and there is **no phone, email, or booking link anywhere** on /contact/, so the site has zero ways to reach her; (2) every page still `noindex`; (3) no favicon; (4) SC LLR #8188 verify open; (5) office address unknown. Domain `pattimoynihan.com` registered at CF, zone active, **zero DNS records** (deliberate). Reply draft from 07/27 **not sent** — awaiting Robert's explicit "send"; 4 of her emails unanswered since 07/24. |

---

## 4. PROSPECTS / PIPELINE

| Prospect | Stage | Next action | Owner |
|---|---|---|---|
| **ToDo Robotics** (Marianela) | Proposal due | **Send the proposal** — flagged as "have to today" on 08/07. Design quote >$11K discussed 08/03. First non-local-service flavour test. | Robert |
| **Liger Builders LLC** (Lesly Viciere, ligerbuilders.com) | New lead, metro-Atlanta GC | #1 on the RLM v2 hand-run pilot roster | Robert |
| **Construction company** | Met 08/06 | **Not a fit right now** — no action | — |
| RLM v2 hand-run roster (locked) | Existing relationships first | Liger → ToDo Robotics → Cronos → Hope Sky → TRG → D2S → ASAP, then ~13 researched metro-Atlanta ICP targets (Buckhead Club, LinkedIn, mastermind, Cathryn's network) | Robert |

**Low-risk Bob beta cohort:** Katherine (Marshall), Bron Carr, Addie — long voice notes / photos / texts, want Bob to work on pages. Systematized so they aren't texting Robert directly. Barter = review + video.

---

## 5. CLOSED / OFFBOARDED

| Client | Status |
|---|---|
| **Cabdiladiff Cabdi** | ✅ **Done** (per Robert). Niche Design Brief + video upload folder complete. Same site-for-review barter as Bronkar/Greta/Ursula/Adie. |
| **008 Concrete** (Jake Bond) | ⛔ Churned 2026-06-24, fully offboarded 07/02. Dropped from `v_paying_clients`, excluded from connector audit, 11 leftover tasks cancelled. Stripe sub set `cancel_at_period_end` → cancelled ~07/12, last invoice paid, no renewal. **Do not re-flag.** Two loose ends pending Robert's go: immediate-cancel the sub (belt-and-suspenders) and void the stale $750 draft invoice `in_1S6VH3Gzao...`. Their ~44–48 lead win is still usable as a case study (pre-dates Ascend intake — verify via legacy comms_log/GHL export). |

---

## 6. Bronkar Lee — **answering your question directly**

> *"Are we doing the one-one build, or are we completely cloning Bronkar's existing website? Where's that at?"*

**Neither a clone nor a full build — it's an MVP rebuild, and it is stalled waiting on him.**

- **Scope:** MVP focused on **keynote speaking only**, targeting event planners. Book, coaching, and digital programs come in later phases.
- **The old Wix site is NOT being cloned.** It stays **parked and untouched as a backup**; the old site forwards to the new one to preserve SEO link juice.
- **Design:** keeps his existing colour palette (chosen for trust + energy), with updated design options layered on.
- **Infra:** moving to a dedicated Cloudflare instance — current site scores **664** on Google's speed tool vs the 95+ typical of BWM clients. AEO layer targeting 750+ data points.
- **Timeline:** ~3-day build for v1; work starts within 24 hrs of assets landing, 72-hour turnaround.
- **Goal:** 24 booked full-fee keynotes/yr, **12 sourced or qualified through the site**, ~50% conversion on qualified leads.
- **Lead routing:** keynote/program → his manager **Michelle**; coaching/consulting → Bronkar direct. Filter out juggling/lessons/instrument-sales enquiries.
- **Domain owned by his wife, Cindy.**

**🚧 BLOCKER — nothing has shipped because Bronkar owes us, from the 07/13 call (due "within the week", now ~4 weeks late):**
1. Website assets (single email)
2. Website login credentials
3. Brand/background documentation for AI training
4. Benchmarking examples from successful industry peers

**Recommended next action:** one chase email listing exactly those four items. Build starts 24 hrs after they land.

---

## 7. Cross-client themes (build these once, deploy many)

1. **Command Center** — committed to ASAP, TRG, RFM, D2S and described as "building that for all of the clients." **Build once, template it.**
2. **CRM** — three different shapes requested: RFM custom-built (3 versions), D2S built with Rodel, TRG explicitly **not** rebuilt (keep KW Command). Don't let these fork into three codebases.
3. **Phone → CRM attribution + spam filtering** — open on TRG, RFM and D2S simultaneously. Same problem three times.
4. **Bob phone-number channel** — alpha across D2S/RFM/TRG, gated on onboarding stability before beta.
5. **GBP optimization + backlinks** — the pattern that saved Tom (27 referring domains, 52 backlinks) is the same play queued for RFM and D2S.

---

## 8. Open questions for Robert

1. **D2S CRM Plan (08/06)** — do you want a transcript generated so I can extract it? It's the only record of that session and it's the CRM architecture call.
2. **TRG Wrap-up (08/05, 2.25 GB)** — did the 12:51 Strategic Planning session supersede it, or is there separate content?
3. **Patti Moynihan** — the 07/27 reply draft is still unsent and she has 4 unanswered emails since 07/24. Send it?
4. **Ursula & Associates** — has Jason replied to the Brand Proof email (07/17)? That answer unblocks the whole build.
5. **Greta** — move `gretajaeger.com` only, or consolidate all 11 domains? (Recommend: gretajaeger.com now, batch the rest after.)
6. **008 Concrete** — go/no-go on immediate-cancelling the Stripe sub and voiding the $750 draft invoice.
