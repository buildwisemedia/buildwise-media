---
title: "Google Ads Dogfood — Turnaround Plan (CANONICAL execution copy, 2026-06-18)"
status: active
owner: Robert Echevarria
date: 2026-06-18
canonical: true
note: "SINGLE SOURCE OF TRUTH for the Google Ads turnaround. Both Claude and Codex re-read THIS file in full before every step (Plan-adherence protocol). Re-plan only by editing this doc."
---

# Google Ads Dogfood — Turnaround Plan (research + independent plans + fix)

## Context (why)

BWM is running its own Google Ads campaign ("dogfooding" — using our own product on
ourselves) to get qualified leads cheaply, on a shoestring budget. Goal: land **one sale** to
justify scaling spend. The campaign **structure** exists (account `979-378-9968`, ocid
`1593184988`) but it's built wrong for **performance**: every live keyword is a long, clever
"pain phrase" (e.g. `home service marketing not working`, `contractor marketing not delivering`)
that almost nobody actually types — so Google flags each one **"Not eligible — Low search
volume"** and refuses to serve it. That's what the screenshot shows. No real keyword research
(with actual search-volume data) was ever done.

Robert's ask: (1) **first**, work with Codex to turn this loose brief into an expert-level
kickoff prompt; (2) Claude and Codex each **independently** research the latest high-performing
Google Ads tactics (copywriting + setup) and produce a full plan; (3) synthesize; (4) **fix the
campaign**. Everything stays **paused** — Robert unpauses (spend/billing is his call).

---

## Diagnosis (verified from Brain + research — confirmed live in Phase 3)

1. **Dead keywords.** The active ad group ("Agency-Displacement Pain") is 7 long-tail pain
   phrases, all "Low search volume." Google's own definition: 5–6-word exact/phrase keywords are
   routinely flagged because the odds of someone searching that exact string are tiny. Fix is not
   bid/quality (those don't affect this status) — it's **replace with real-volume terms**.
2. **The volume was deliberately deferred.** The prior plan (v3.1) parked every keyword that
   *has* volume (by-trade head terms: `hvac marketing`, `contractor leads`) in a "held" Campaign
   B, "until trade landing pages exist." Correct instinct (those terms are pricey + mixed-intent),
   but the result is a live campaign with **nothing serveable**. The fix is the missing **middle
   tier**: mid-tail *commercial-intent* terms that have real volume but stay tightly qualified.
3. **What's already right (keep):** Search-only (Display + Search Partners OFF), US Presence-only
   geo, AI Max OFF, `$35/day` budget, **`generate_lead` conversion action exists** (id
   `7652559771`, PRIMARY), and **5 landing pages are live** (`/go/agency-alternative`, `/money`,
   `/volume`, `/pain-relief`, `/status`) firing `generate_lead` on a FIT verdict with gclid+UTMs.
4. **Research consensus (2026, sources below):** Search > Performance Max for low-budget lead gen
   (avoid PMax under ~$1k/mo); single tight campaign; exact+phrase only (no broad on a shoestring);
   aggressive negatives reviewed ~daily; **Maximize Clicks + CPC cap** (or manual/eCPC) until
   ~15–30 conversions, then graduate to Smart Bidding; ≥2 RSAs/ad group at "Good/Excellent" ad
   strength (Poor→Excellent ≈ +15% clicks/conversions); minimal pinning (over-pinning tanks ad
   strength); Offline Conversion Import (OCI) to teach the algorithm lead *quality*, not just form-fills.

---

## Approach (Robert's requested flow)

```
Phase 0  Expert kickoff prompt  ── Claude drafts → Codex x-high critiques + improves → merge
Phase 1  Independent research + plans (parallel)
            ├─ Claude arm  (Workflow: multi-modal 2026 web sweep + BWM context → full plan)
            └─ Codex arm   (codex exec x-high, same prompt, independent → full plan)
Phase 2  Synthesize → one unified, build-ready plan (keep best of each + v3.1 lessons; adversarial check)
Phase 3  Diagnose the LIVE campaign (Chrome MCP) — exact keywords/structure/bids/state
Phase 4  Fix the campaign (Chrome MCP) — leave PAUSED; HITL on ad copy
Phase 5  Verify (eligibility, ad strength, conversion link, render + event fire) → Robert reviews + unpauses
```

This is harness-shaped (independent generation + adversarial synthesis), and ultracode is on, so
**Phase 1–2 run as a Workflow** (Claude research/plan agents in parallel with the Codex arm, then
a synthesis + adversarial-verify stage). Phase 0's prompt is the shared brief both arms execute.

---

## Plan-adherence protocol (both AIs re-ground at every step — non-negotiable)

This plan is the **single source of truth** (canonical path: this file —
`_handoffs/Google-Ads-Turnaround-Plan-2026-06-18.md`; Brain parity copy at
`clients/buildwise-media/Google-Ads-Turnaround-Plan-2026-06-18.md`). Every "re-read the plan"
below means *this* file.

**Before each phase/step, both Claude and Codex must:**
1. **Re-read this plan in full** (and the Phase 0 kickoff prompt) — no working from memory.
2. Restate the current step's **scope + done-criteria** in one line.
3. Check it against the locked **Decisions + Guardrails** — flag any drift; never silently deviate.
4. Only then act.

**After each step:** tick its box in the Progress ledger with a one-line **proof**, and confirm the
next step is still the right next step per the plan. **Re-plan only by editing this doc** — never
drift ad hoc. If a step reveals the plan is wrong, stop and amend the doc first, then continue.

**Every `codex exec` invocation carries this preamble:** *"Re-read `<canonical plan path>` in full
before doing anything. Map your output 1:1 to the plan's deliverable; add no scope. End by listing
which plan items you covered and any you intentionally skipped, with why."* The Phase 2 synthesis
stage **rejects anything that doesn't trace back to a plan deliverable.**

## Progress ledger (update at every step — the on-track checklist)

- [x] **Phase 0** — Expert prompt finalized with Codex (critique `/tmp/codex-gads-p0-critique.md` folded in: schema + banned-invented-volume + payback math + funnel + non-binding seed + trademark/bidding/phased-launch + 2026 tactics) · plan promoted to canonical repo path `_handoffs/Google-Ads-Turnaround-Plan-2026-06-18.md`
- [x] **Phase 1** — Claude plan `/tmp/claude-gads-plan.md` (376 ln) · Codex plan `/tmp/codex-gads-plan.md` (403 ln); both to the 14-section schema, all volume `PENDING LIVE VALIDATION`. 6 Claude research files in `/tmp/claude-gads-research-*.md`.
- [x] **Phase 2** — Unified build-ready plan synthesized below (§ "UNIFIED BUILD-READY PLAN"); two independent models cross-checked, divergences resolved with rationale (adversarial-by-construction).
- [x] **Phase 3** — Live campaign diagnosed + Keyword Planner volume validation done (see "PHASE 3 — LIVE DIAGNOSIS" section). Repair-in-place confirmed (campaign renders fine, 4 ad groups exist). Two decision-relevant findings: keyword priority flips to head terms; 4-metro geo yields only 10–100/mo per term → GEO DECISION surfaced to Robert before Phase 4 build.
- [~] **Phase 4 (IN PROGRESS)** — Core keyword fix DONE + verified in-platform (campaign `23951740211`, all PAUSED):
  - **Done-For-You Outcome** ← 9 validated head terms added (`"lead generation for contractors"`, `"marketing for contractors"`, `"marketing agency for contractors"`, `"contractor lead generation companies"`, `"home service marketing agency"`, `"done for you lead generation"`, `"lead generation for home services"` + `[lead generation for contractors]` `[marketing agency for contractors]`) — all status **"Under review"** (eligible, NOT low-volume). VERIFIED.
  - **Lead-Marketplace Displacement** ← 6 validated keywords added (`"thumbtack alternative"`, `"exclusive leads for contractors"`, `"exclusive contractor leads"`, `"angi leads alternative"`, `"homeadvisor alternative"`, `[thumbtack alternative]`) — created. VERIFIED.
  - **ALSO DONE + verified:** Done-For-You got the 3 missing exacts (`[marketing for contractors]`, `[contractor lead generation companies]`, `[home service marketing agency]`) per QA → 12 kws total, eligible. Campaign **negatives confirmed live** (full v3.1 list) + 3 AG-1 negatives added (`"sell leads"`, `"lead broker"`, `"data provider"`). Bidding/budget confirmed: Maximize Clicks, $35/day, US/Presence-only, Search-only.
  - **ADS DONE + verified (2026-06-18):** Both launch RSAs edited + saved. Done-For-You final URL fixed `/go/agency-alternative`→`/go/volume`; Lead-Marketplace URL already correct `/go/agency-alternative`. Both ads had 3 headlines over-pinned to position 1 (the cause of "Poor") — **unpinned all 3 on each → ad strength Poor→Average**. Existing on-brand v3.1 copy retained (compliant: no vendor names, no naked price, free-Revenue-Leak-Map CTA); both have sitelinks (How It Works / Industries Served / Pricing / About / Ascend Services).
  - Note: repeated live-UI pixel mis-clicks in a long session (fullscreen toggle, a "new ad group" form — all caught + DISCARDED, still 4 ad groups, nothing stray persisted). Deliberately paused the click-by-click build to protect the live account; continuation should verify each step in a fresh context.
  - **SESSION 6 UPDATE (2026-06-18, Chrome MCP, all left PAUSED):**
    - **GEO — RESOLVED:** task prompt's "narrow to beachhead metros" CONFLICTED with the canonical FINAL BUILD SPEC ("NATIONAL US"). Surfaced to Robert; **he reconfirmed NATIONAL US this session.** Campaign Locations verified = **"United States (country)"** — no change made. ✓
    - **Minor cleanup DONE + verified:** max-CPC cap **$12 → $14** (campaign Settings → Bidding, saved + re-read $14.00). ✓ · 2 dead ad groups **Competitor-Alternative + Agency-Displacement Pain confirmed PAUSED** (own-status, idempotent re-pause; verified via status menu + Change History). ✓ · Also re-confirmed: Search-only (Google Search Network), Maximize Clicks, $35/day, AI Max OFF, broad-match OFF, auto-tagging **ON**, Languages English, Lead-form-ads terms not accepted.
    - **CONVERSION FIX — groundwork verified, IMPORT BLOCKED ON DATA (cannot complete this session):** GA4↔Ads link **confirmed** (linked GA4 property **422160329** = `G-V5LSP69E41`, shown in conversion setup + Product links). `generate_lead` **is a GA4 key event** (verified in GA4 Admin → Events → Key events) carrying `currency:'USD'`+`value` (site fires `value:0` per `QualifierForm.astro:531` — override to **$75** in Ads = `lead.qualified.unbooked` for buildwise-media per `bwm-ops-events/scripts/google_conversion_import.config.json`). Site carries **only the GA4/GTM tag — NO `AW-` Ads conversion tag** (`BaseLayout.astro:40-41`), so **GA4-import is the only no-code path** (as planned). **BLOCKER:** `generate_lead` has **0 recorded GA4 occurrences in 28d** (no qualified diagnostic submit) → it is **absent from the Ads GA4-import picker** ("Create multiple conversion actions from a linked account" → empty), and GA4→Ads processing latency (~24–48h) means it can't be wired even if seeded now. The existing action **7652559771 stays Primary-but-Inactive** (offline "import from clicks", records nothing without MCC). → **Complete the import once the event has data:** first real qualified lead post-unpause (analytics records it w/ gclid via auto-tagging; ~24–48h later it appears in the picker), OR a deliberate seed/test submit. Then it's a ~3-min task: import `generate_lead` → set fixed value **$75 USD**, Count One, click-window 90d, Category Lead → set **PRIMARY** → demote 7652559771 to Secondary. **Test gclid round-trip still requires a live click (post-serving), per plan.**
    - **GO-LIVE FINDING (Robert's action):** **ALL 4 ad groups are paused at the ad-group level**, including the two LAUNCH groups (**Done-For-You Outcome** + **Lead-Marketplace Displacement** — both confirmed own-Paused via status menu / Change History "1 ad group paused" Jun 17). So unpausing the campaign **alone serves nothing.** Go-live = **enable the 2 launch ad groups + unpause the campaign** (kept paused deliberately — HITL).
- [~] **Phase 5 (PARTIAL)** — Verified now: keywords **Eligible** (prior session) · campaign settings correct (Search-only / Maximize Clicks $14 cap / $35-day / national / AI Max off / auto-tagging on) · dead ad groups paused · GA4↔Ads link + `generate_lead` key-event w/ value+currency. **Gated (needs serving):** `generate_lead` import created + PRIMARY + a **test gclid records** (blocked on event-data, see Session-6 update) · ad strength ≥ Good (currently Average — acceptable; raise via 2nd RSA post-traffic).
- [ ] Robert review → **enable 2 launch ad groups + unpause** (Robert's action — spend/billing); then finish the `generate_lead` import once it surfaces.

---

## Phase 0 — Expert kickoff prompt (FINAL — Codex-hardened 2026-06-18)

Both independent arms (Claude + Codex) produce a plan to the **exact OUTPUT SCHEMA** below so the
two are directly comparable + synthesizable. Codex's critique (`/tmp/codex-gads-p0-critique.md`)
is folded in: standardized schema, banned invented volume, click/payback math, funnel definition,
non-binding seed, trademark policy, precise bidding, phased launch, and the 2026 tactics list.

> **Mission.** Produce a complete, **build-ready, falsifiable** Google Ads plan for Buildwise
> Media's *own* lead-gen ("dogfood") Search campaign at **~$35/day**. Do **not** produce a generic
> plan — produce one where **every keyword and ad group survives volume, CPC, intent, and payback
> scrutiny**. Success = qualified discovery calls at a CPL where **one $15K Pilot pays for itself**,
> so spend can scale.
>
> **What BWM sells.** Custom AI systems that run growth for US service businesses (not an agency,
> not "marketing"). Tiers: Ascend Pilot $15K one-time · Ascend $7K/mo + $15K install · Ascend Pro
> $15K/mo + $25K install. ICP (internal only — never in public copy): $3M–$8M owner-led US service
> business, AI-receptive, burned by agencies. Persona: the overworked owner who is the bottleneck.
>
> **Copy / policy locks (hard).** Primary CTA "Get My Free Revenue Leak Map"; secondary "See If
> We're a Fit." **Competitor/vendor trademarks: keywords ONLY — never in headlines, descriptions,
> display paths, or implied on the LP; cite policy risk where relevant.** Never price naked (anchor
> to the cost of the stack it replaces). No revenue qualifiers in public copy. Flesch-Kincaid ≤ 8.
> Author voice = "we"/"the Buildwise team."
>
> **Current state (do NOT confuse with the proposed build).** Account `979-378-9968`; one Search
> campaign, **all PAUSED**, $35/day, Search-only (Display + Partners OFF), AI Max OFF, currently
> **US Presence-only**, one ad group of long-tail "pain phrase" keywords all flagged **"Low search
> volume."** `generate_lead` conversion action exists (id 7652559771, PRIMARY, currently sourced as
> offline "import from clicks"). GA4 `G-V5LSP69E41` + GTM `GTM-P5JSD86L` live; client-side
> `generate_lead` fires on a FIT verdict carrying gclid+UTMs; leads also reach BWM via the form
> handler + a real-time speed-to-lead Telegram alert.
>
> **Proposed build (your job).** Restructured Search campaign, **Presence-only**, geo = **beachhead
> metros, Atlanta-led** (Atlanta + ~4–5 Sunbelt metros; Atlanta runs ~2–4× CPC, so model its budget
> share). LPs live now: `https://buildwisemedia.com/go/agency-alternative`, `/go/money`,
> `/go/volume`, `/go/pain-relief`, `/go/status`.
>
> **Seed direction is NON-BINDING — challenge it.** The "Seed strategic direction" section is a
> hypothesis. If Keyword-Planner/forecast data or intent analysis contradicts it, replace it.
>
> **Bidding (be precise — pick ONE primary + ONE fallback).** Primary = **Maximize Clicks with a
> max-CPC cap** (the new UI's controllable equivalent of manual); fallback = **manual CPC/eCPC**.
> No conversion-based Smart Bidding until ≥15–30 conversions accrue. State the cap.
>
> **Define the funnel separately:** click → FIT verdict / `generate_lead` → booked call → qualified
> opportunity → Pilot sale. Mark each action **Primary vs Secondary**; specify offline stages/values
> fed back; use **Enhanced Conversions for Leads** as the offline-match path (Data Manager OCI is
> MCC-gated, deferred). Handle **conversion lag**: 7/14/30/90-day readouts, which early proxies to
> trust, when NOT to overreact.
>
> **Required 2026 tactics (address each):** single-intent ad groups with a max keyword count per
> theme (no broad buckets); audience layers in **Observation mode only**; an ad-group→LP
> **message-match** (keyword language ↔ hero promise ↔ CTA ↔ proof ↔ form path, not just a URL); a
> **search-term sculpting cadence** with negative match types + scope; an **asset strategy**
> (sitelinks, callouts, structured snippets, call-asset decision — and explicitly **reject lead-form
> assets** that bypass FIT qualification); a **phased launch** recommendation (1–2 strongest themes
> first vs 4 ad groups at once — defend it on tiny spend).
>
> **OUTPUT SCHEMA (use exactly):**
> 1. Assumptions (+ what is `PENDING LIVE VALIDATION`)
> 2. Campaign settings (type · networks · geo + presence behavior · language · budget · bidding + cap · AI Max)
> 3. Geo forecast (metros · relative CPC · budget share · the Atlanta cost call)
> 4. Ad-group table (name · single-intent theme · mapped LP · launch priority)
> 5. **Keyword table** — every keyword: term · match type · target geo · **avg monthly searches OR
>    forecasted impressions/clicks (Keyword Planner)** · top-of-page bid range · intent score ·
>    expected CPC · mapped LP · keep/cut rationale. **No live Keyword Planner access → mark volume
>    `PENDING LIVE VALIDATION`; never invent numbers.**
> 6. Negative-keyword table (term · match type · scope: campaign/ad-group)
> 7. RSA table per ad group — **15 headlines + 4 descriptions**, char counts, pinning guidance
>    (pin sparingly; target ad strength ≥ Good), each mapped to the ad group's intent
> 8. Asset plan (sitelinks/callouts/structured snippets/call; lead-form-asset decision)
> 9. Landing-page message-match table
> 10. Conversion / Enhanced-Conversions-for-Leads / OCI plan (Primary vs Secondary; offline stages/values; lag handling)
> 11. **Economics / click-math at $35/day:** clicks/day · leads/mo at conservative/base/aggressive
>     CVR · qualified-call rate · expected time to first qualified call · max tolerable CPL vs Pilot payback
> 12. 14-day & 30-day optimization runbook
> 13. Kill / scale thresholds
> 14. Open items / risks (incl. trademark + low-volume-after-geo-narrowing risk)
>
> **Guardrails:** leave everything PAUSED (Robert unpauses — spend/billing is his call); all ad
> copy is HITL before live.

---

## Seed strategic direction (NON-BINDING hypothesis — both arms must challenge it; replace if data contradicts)

**Structure (one Search campaign = the budget unit, ~$35/day):**
- **AG-A · Lead-Marketplace Displacement** (cheapest, highest-intent, best shoestring fit):
  `exclusive leads for contractors`, `Angi leads alternative`, `HomeAdvisor alternative for
  contractors`, `Thumbtack alternative for contractors`, `pay per lead alternative`, `shared
  leads alternative`. → `/go/agency-alternative`.
- **AG-B · Done-For-You Lead Gen** (real volume, commercial intent): `lead generation for
  contractors`, `marketing for contractors`, `home service marketing`, `lead generation for home
  services`, `marketing agency for contractors`, `done for you lead generation`. → `/go/volume`.
- **AG-C · Competitor-Alternative** (cheap, very qualified; names = keywords only): `Scorpion
  alternative`, `Hibu alternative`, `Service Direct alternative`, `Townsquare Interactive
  alternative`. → `/go/agency-alternative`.
- **AG-D · Agency-Displacement Pain** (keep only what survives volume validation; broaden the
  rest to phrase/broad or cut). → `/go/pain-relief`.
- The high-CPC by-trade head terms (`hvac marketing`, `roofing leads`) stay **held** for trade
  landing pages (a fast-follow), per v3.1 — they're the cash-burn risk on $35/day.

**Match types:** exact + phrase only (no broad). **Bidding:** Maximize Clicks + ~$12–15 max-CPC
cap (new UI hides Manual CPC); switch to Maximize Conversions → tCPA only after ≥15–30
conversions. **Negatives:** the v3.1 campaign-level list (jobs/careers, DIY/tutorial, SaaS/CRM
names, consumer "near me"/repair intent, franchise/enterprise) — NOT `reviews`/`residential`;
review search terms ~daily. **RSAs:** 2 per ad group, 15 headlines / 4 descriptions, benefit +
proof + CTA + emotion mix, pin sparingly (≤2 identity headlines), target ad strength ≥ Good.
**Conversion:** `generate_lead` stays PRIMARY; validate one test gclid round-trips, then enable
OCI (`bwm-ops-events/scripts/google_conversion_import` → `enabled=true`).

**Keyword research is a real step, not a guess:** in Phase 3/4 pull Keyword Planner volumes for
every candidate; keep only terms with non-trivial volume + commercial intent; document the volume
beside each kept keyword (the discipline that was skipped).

---

## Phase 3 — Diagnose the live campaign (Chrome MCP, read-only)

Drive the open `ads.google.com` tab to capture exact ground truth: which campaign is live
(`23951740211` in the tab vs the v3.1 draft `281498923073736`), its ad groups, **all** keywords +
statuses, current RSAs + ad strength, bidding, budget, geo, networks, negative lists, and the
conversion-goal link. Decide **repair-in-place vs discard-and-rebuild-fresh** based on what's
there (Session-5 noted a corrupted *builder draft* — a fresh campaign avoids that bug).

## Phase 4 — Fix the campaign (Chrome MCP; leave PAUSED)

Apply the synthesized plan: new/validated keywords + match types, restructured ad groups,
campaign negatives, RSAs (≥ Good ad strength), bidding (Maximize Clicks + CPC cap), Presence-only
geo on the beachhead metros (Atlanta-led), conversion goal = `generate_lead`. **Ad copy = HITL: render it for
Robert before anything goes live.** Do **not** unpause or touch billing (handoff HARD RULE).

## Phase 5 — Verify (proof, not self-report)

- Keywords show **"Eligible"** (no "Low search volume") — the core fix, proven in-platform.
- Each ad group has ≥1 RSA at **ad strength ≥ Good**.
- `generate_lead` is PRIMARY and linked to the campaign's conversion goal.
- Each mapped LP renders and fires `generate_lead` on a FIT verdict (test submit; check gclid
  reaches the form handler). Confirm the duplicate-Meta-Pixel double-count is contained (GTM check).
- Post-unpause leading indicators (Robert's call to unpause): impressions > 0, CTR, search-term
  relevance, cost/click vs the cap, and first conversions.

---

## Guardrails & locks honored

Leave everything **paused** (Robert unpauses). Ad copy is **HITL** before live. Never name
vendors/competitors in copy (keywords only). Never price naked. No revenue qualifiers in public
copy. FK ≤ 8 + Creative Copy Gate on all RSA copy. Honor v3.1: campaign = budget unit; Maximize
Clicks/eCPC until volume; Presence-only geo; the specific negative list. Reuse the existing Chrome
window (don't spawn new windows/tabs).

## Decisions (locked by Robert)

- **Geo = NATIONAL US, Atlanta-led (REVISED 2026-06-18; supersedes the earlier beachhead-metros call; reconfirmed by Robert Session 6).**
  Presence-only, **United States (country)** — verified live, no geo change needed. Phase 3 Keyword-Planner
  validation found that narrowing to a handful of beachhead metros collapses every keyword to 10–100/mo
  (near-dead) → "one sale" would take months; national keeps the head terms at 100–1K volume. Atlanta/Sunbelt
  emphasis is via monitoring + the LPs (manual location bid adjustments have limited effect under Maximize
  Clicks). *(Historical, now superseded: the original seed/Decision was "beachhead metros, Atlanta-led —
  Atlanta + ~4–5 Sunbelt: Atlanta, Dallas–Fort Worth, Houston, Phoenix, Charlotte, Tampa".)*
- **Fix in the browser now; API later.** Execute the fix via Chrome MCP on the live Google Ads UI
  immediately (no waiting on token approval). Stand up Google Ads **API** access as a follow-up
  (Robert generates a developer token / MCC) for durable headless management — this also dogfoods
  the exact capability we'd run for client accounts. Tracked as a recommended next step, not a blocker.

## Sources (research)
- groas — Google Ads lead gen 2026 (lower CPL): https://www.groas.com/post/google-ads-lead-generation-strategy-2026-complete-guide-reduce-cpl
- groas — PMax vs Search 2026: https://www.groas.com/post/performance-max-vs-search-campaigns-2026-which-should-you-use
- verdemedia — match types, negatives, search terms 2026: https://verdemedia.com/blog/google-ads-keyword-strategy-2026
- Google Ads Help — Low search volume: https://support.google.com/google-ads/answer/2616014?hl=en
- Optmyzr — low search volume keywords: https://www.optmyzr.com/blog/low-search-volume-keywords/
- growthmindedmarketing — RSAs 2026: https://growthmindedmarketing.com/blog/responsive-search-ads/
- Google Ads Help — Ad Strength for RSAs: https://support.google.com/google-ads/answer/9921843?hl=en
- NAV43 — Search vs PMax for lead gen, scale guide 2026: https://nav43.com/blog/search-vs-performance-max-for-lead-gen-scale-guide-2026/

---

# UNIFIED BUILD-READY PLAN (Phase 2 synthesis — the Phase-4 build spec)

Synthesized from the two independent arms (`/tmp/claude-gads-plan.md`, `/tmp/codex-gads-plan.md`),
which converged strongly. This section is what gets BUILT in Phase 4 (all PAUSED; copy HITL).

## Resolved divergences (the only places the two arms differed)
1. **Ad groups at launch = 2** (both agreed): AG-1 Lead-Marketplace Displacement + AG-2 Done-For-You
   Lead Gen. Everything else is a **phase-2 queue**, added ONE at a time only after P1 shows traffic
   AND Keyword Planner proves volume.
2. **Competitor/marketplace "alternative" terms = keyword-only inside AG-1**, gated on Keyword-Planner
   volume — NOT their own group (low-volume trap + trademark exposure). Never in copy/LP/display path.
3. **Bidding fallback = Manual CPC.** eCPC is deprecated (removed Mar 2025) — do not propose it.
4. **1 strong RSA per ad group at launch → add a 2nd distinct-angle (proof-led) RSA at ~1k
   impressions/wk.** Deliberate deviation from Google's "≥2" default, justified by ~3 clicks/day
   (a 2nd near-duplicate splits micro-volume). We still reach ≥2 by phase 2.
5. **Atlanta throttle = a negative location bid adjustment (start −20%) + Locations-report
   monitoring**; reallocate if Atlanta takes >~40% spend with no FIT leads by day 14. (Note:
   automated Maximize Clicks may limit how hard a manual location adjustment bites — monitor + correct.)

## Campaign settings (build exactly)
- Type **Search**; Display OFF, Search Partners OFF; **AI Max OFF**; ad rotation Optimize.
- Geo **Presence only**, beachhead metros: **Atlanta, Charlotte, Tampa, Dallas–Fort Worth** (4, not 6;
  Phoenix/Houston deferred). Language English.
- **$35/day**, ONE campaign = the budget unit. Per-metro reads come from the **Locations report**, not separate budgets.
- Bidding **Maximize Clicks + max-CPC cap ≈ $14** (tune to Keyword Planner top-of-page-high after pull); Manual CPC fallback. No Smart Bidding until ≥15–30 conversions.
- Match types **exact + phrase only** (no broad). Audiences **Observation mode only** (site visitors, in-market business services / advertising-marketing, home-services owner segments).
- Conversion goal points at **`generate_lead` (id 7652559771) PRIMARY** — and see the conversion-recording fix below.
- Ad schedule: **all days/hours at launch** to maximize scarce data; add a Mon–Fri business-hours schedule only after ~4 weeks of hour-of-day data (research caution: no schedule bid mods until 4+ wks).
- **Repair vs rebuild:** Phase 3 decides; **default = rebuild fresh** if the live campaign (`23951740211`) carries the Session-5 builder corruption or wrong structure (cheap at this scale).

## Ad groups + launch keyword candidates (all volume `PENDING LIVE VALIDATION` — pull Keyword Planner in Phase 3; drop any "Low search volume")
**AG-1 · Lead-Marketplace Displacement → `/go/agency-alternative`** (highest intent + lowest CPC; launch #1)
- exact: `exclusive leads for contractors`, `exclusive contractor leads`
- phrase: `stop paying for shared leads`, `own your leads contractor`, `pay per lead alternative`, `shared leads alternative`
- keyword-only (gated on volume; category language in copy): `angi leads alternative`, `homeadvisor alternative contractors`, `thumbtack alternative contractors`

**AG-2 · Done-For-You Lead Gen → `/go/volume`** (the missing real-volume middle tier; launch #2)
- exact: `lead generation for contractors`, `lead generation for home services`, `contractor lead generation company`
- phrase: `marketing for contractors`, `done for you lead generation`, `marketing agency for contractors`, `home service marketing agency`

**Phase-2 queue (add one at a time, post-traffic + volume-validated):** AG-3 Marketing-Agency-Alternative → `/go/pain-relief`; AG-4 AI-Growth-System (`ai lead generation for contractors`, `automated lead generation contractors`) → `/go/money`. **Held (no group):** by-trade head terms (`hvac marketing`, `roofing leads`) — burn budget; need trade LPs + more budget.

## Negative keywords (campaign-scope at launch; review Search Terms DAILY weeks 1–2; NOT `reviews`/`residential`)
Employment: `jobs, careers, hiring, salary, resume, internship`. DIY/research: `how to, tutorial, course, learn, training, certification, template, examples, pdf`. SaaS/CRM (exact, critical for the AI/automation terms): `[salesforce] [hubspot] [gohighlevel] [ghl] [zoho] [pipedrive] [monday] [clickup] [zapier] [airtable]` + `software, crm software, saas, free trial`. Agency-operator: `white label, reseller, start an agency, start a business, affiliate, make money`. Consumer/repair: `near me, residential* , homeowner, repair, fix, broken, emergency, parts` (*residential held — add only if search terms prove leakage). Franchise/enterprise: `franchise, corporate, enterprise, fortune 500`. Price-shopper (PHRASE, never single-word broad, to protect our own "free Revenue Leak Map"/"free fit check" intent): `cheap, cheapest, discount, low cost`. Per-ad-group: AG-1 `sell leads, lead broker, data provider`.

## RSAs — launch drafts (HITL before live · ≤30 char H / ≤90 char D · FK ≤ 8 · CTA locks · no vendor names · value-stack anchor not naked price · pin sparingly, target ad strength ≥ Good)
**AG-1 headlines:** Own Your Leads, Not Rentals · Stop Buying Shared Leads · Exclusive Leads, Run For You · Get My Free Revenue Leak Map · A Lead System You Own · Built By The Buildwise Team · No More Shared Lead Lists · Leads That Pick Up The Phone · We Build The System For You · See If We're A Fit · Live In About 30 Days · One Owner Per Market · Find Where Leads Slip Away · Stop Paying For Noise · Qualified Calls, Not Clicks
**AG-1 descriptions:** "We build a custom AI system that brings you leads you actually own. No shared lists." · "See where leads slip away with a free Revenue Leak Map. Then we build the fix for you." · "Most owners pay for leads three rivals also get. We build a pipeline that's only yours." · "Want it run for you? See if we're a fit. Live in about 30 days, built by our team."
**AG-2 headlines:** Lead Generation, Run For You · We Run Growth For You · Done-For-You Lead Systems · Get My Free Revenue Leak Map · More Booked Jobs, Less Chasing · Built By The Buildwise Team · A System That Works For You · See If We're A Fit · Stop Doing Marketing Yourself · Fill Your Pipeline, Hands Off · We Build It, You Run The Jobs · Live In About 30 Days · One System, Not Ten Tools · See Your Biggest Leak First · Turn Search Into Booked Jobs
**AG-2 descriptions:** "We build and run a custom AI growth system so you can get back to the work." · "One system replaces the pile of tools and contractors you juggle now. Built for you." · "Start with a free Revenue Leak Map. See where jobs slip away before you spend a cent." · "Want it run for you? See if we're a fit. Most systems are live in about 30 days."
**Pinning:** pin the set {H1,H2,H3} to Position 1 (3 share P1 → Google still tests within it); leave P2/P3 open; descriptions unpinned. Re-run the Creative Copy Gate on final copy.

## Assets
Sitelinks (≥4, vary intent): "See If We're A Fit"→/book · "How It Works"→/#how · "See The System"→/#system · "Our Results"→proof · "Free Revenue Leak Map"→/go/money. Callouts (8–10, no price/vendors): Built For You · Live In ~30 Days · One System, Not Ten Tools · Owner-Led Service Businesses · No Long Contracts After 90 Days · US-Based Team · AI That Runs Growth · Speed-To-Lead Built In. Structured snippets (Services): Lead Systems, AI Automation, Speed-To-Lead, Pipeline Build, Growth Reporting. **Call asset OFF** (bypasses FIT qualification). **Price asset OFF** (never price naked). **Lead-form asset REJECTED** (bypasses the FIT quiz; floods raw leads; breaks attribution) — all traffic to the `/go/*` LPs.

## Conversion recording (the no-MCC path + two must-fix gotchas)
- **Path:** GA4 (`G-V5LSP69E41`) → Google Ads **conversion import** records the client-side `generate_lead` as a Google Ads conversion. Data Manager OCI is MCC-gated → deferred. Enhanced Conversions for Leads = the offline-quality match layer, later.
- **GOTCHA 1 (likely silent failure):** `generate_lead` must carry **`currency:'USD'` + `value`** (April-2026 GA4 change) or it will NOT appear in the Google Ads import picker. **Verify first in Phase 5.**
- **GOTCHA 2 (source reconciliation):** action 7652559771 is currently sourced as **offline "import from clicks"** — which records nothing without the MCC-gated importer. For a no-MCC launch we need a **GA4-imported** (or website-tag) `generate_lead` conversion. Reconcile in Phase 4/5 so a conversion can actually record.
- Settings: Category Lead · Count One · click-window 90 days · view-through 1 day · PRIMARY · auto-tagging ON (gclid). Funnel + values: click → `generate_lead` $150 (PRIMARY) → booked call $500 (secondary→primary at ≥15/mo) → qualified opp $2,000 → Pilot $15,000 (offline/manual CSV later). Verify one **test gclid round-trips** to the form handler. Check **GTM/GA4 duplicate-counting** (known duplicate Meta Pixel) before unpause.

## Economics (why this is worth it) + read cadence
~$11 blended CPC (est.) at the $14 cap → **~3 clicks/day ≈ ~90/mo**. Leads/mo: ~4 (conservative 4% CVR) / ~6 (base 6%) / ~9 (aggressive 9%) — all PENDING. Qualified-call rate est. ~30% (FIT quiz pre-screens). First qualified call ~2–4 wks (base). **Break-even CPL on a single $15K Pilot ≈ $680–$790; modeled CPL ≈ $180** → unit economics work with large margin; **the real constraint is volume/time-to-data, not economics.** Read at **7 / 14 / 30 / 90 days**; early-trust = eligibility, CTR (>3% exact/phrase), CPL, search-term relevance; do NOT trust impression-share/QS vanity or call no-sale failure before ~90 days. No bid-strategy change inside a 7–14 day learning window.

## Kill / scale
KILL: keyword still "Low search volume" after 14d → delete+replace (no manual fix); ad group CTR <1.5% after 1k impressions → fix message-match; mapped-LP bounce >75% (GA4) → fix before more spend; ~$150 spend / zero FIT leads with clean search terms → pause. SCALE (Robert's call): stable CPL inside ~$680 break-even + healthy CTR → raise budget on that segment; ≥15–30 conversions/30d → graduate to Maximize Conversions; first Pilot closes → expand metros (Phoenix/Houston) + trade groups w/ LPs.

## Top risks
(1) **Low-volume-after-geo-narrowing** (highest) — re-check eligibility AFTER metros are set, lean on phrase match, widen one metro if a group goes ineligible. (2) **Empty conversion import** (the value/currency + source gotchas above). (3) **CVR unmeasured on paid traffic** — the payback case rests on ~6%; month 1 establishes it. (4) **Trademark** — competitor/marketplace names keyword-only, category descriptors in all copy/LP.

---

# PHASE 4 QA (Codex 5.5 x-high, 2026-06-18) — findings + actions

Verdict: **needs-fixes**. #1 watch-item: prove the **GA4-imported `generate_lead` records (value+currency+gclid)** before Robert unpauses — else the campaign serves but records ZERO Ads conversions (existing action 7652559771 is offline "import from clicks").
- **Keyword exacts to add to Done-For-You** (match-type completion): `[marketing for contractors]`, `[contractor lead generation companies]`, `[home service marketing agency]`. Leakage-watch (keep w/ negatives + daily search-term review): `"done for you lead generation"`, `"homeadvisor alternative"`.
- **AG-1 (Lead-Marketplace) negatives to add:** `sell leads`, `lead broker`, `data provider`.
- **RSA copy lock-fixes (apply when building ads):** use `See If We're a Fit` (lowercase "a" — verbatim lock); **DROP** `One Owner Per Market` (implies exclusivity promise = paid Territory-Lock only) and `Leads That Pick Up The Phone` (overpromises); **soften** the description `"Most owners pay for leads three rivals also get…"` (unsubstantiated specific claim). Char counts pass (≤30 H / ≤90 D).
- **Negatives already live** (verified in-platform — full v3.1 list at campaign level). ✓
- **Launch blockers (pre-unpause):** dead ad groups paused · RSAs ≥Good w/ correct final URLs (Done-For-You→/go/volume, Lead-Marketplace→/go/agency-alternative) · HITL copy approval · $14 cap · **conversion recording proven**.
- Plan-adherence adds (not spend-safety blockers): ad assets (sitelinks/callouts/snippets), audience Observation layers, Atlanta/Sunbelt location emphasis.
- Reality: $35/day is low velocity — expect a 30–90 day test, not a 1-week read.

---

# PHASE 3 — LIVE DIAGNOSIS + KEYWORD PLANNER VALIDATION (2026-06-18, in-platform)

## Live campaign state (confirmed via Chrome MCP)
- Campaign **"BWM Core - High-Intent Search"** (id `23951740211`) in account `979-378-9968` — the real, clean campaign (renders fine; NOT the corrupted draft `281498923073736`). **All PAUSED**, zero impressions ever. Banner: "None of your ads are running."
- **4 ad groups already built** (full v3.1 structure): Competitor-Alternative · Lead-Marketplace Displacement · Agency-Displacement Pain · Done-For-You Outcome. → **Repair-in-place** (no rebuild needed).
- Agency-Displacement Pain keywords (the screenshot): all 7 PHRASE, all "Not eligible" — 5 "Low search volume", 2 "paused only". Confirmed dead.

## Keyword Planner validation (the discipline that was skipped) — REAL volumes
Pulled "Get search volume and forecasts" for the candidate set, US-national then narrowed to the 4 beachhead metros (Atlanta GA DMA + Charlotte NC DMA + Tampa DMA + Dallas city; ~55M reach ≈ 17% of US).

**US-national avg monthly searches:**
- **100–1K (the only real-volume tier):** `marketing agency for contractors` ($9.70–$25.41, **Low comp**), `marketing for contractors` ($10.21–$30, Med), `lead generation for contractors` ($11.38–$47.68, Med), `contractor lead generation companies` ($12.83–$45.57, Low), `home service marketing agency` ($10.20–$25, Med), `hvac marketing` ($14.83–$65.45, Med), `thumbtack alternative` ($5.05–$14.66, Med — cheapest + decent volume).
- **10–100 (thin):** `exclusive leads for contractors`, `exclusive contractor leads`, `angi leads alternative` (High comp), `homeadvisor alternative`, `home services lead generation`, `lead generation for home services`, `done for you lead generation`.
- **DEAD (—, no volume):** `ai lead generation for contractors`, `automated lead generation for contractors`, `pay per lead alternative`, `shared leads alternative`, `switch marketing companies`, `home service marketing not working` (← confirms the live keywords are genuinely zero-volume).

**At the 4 beachhead metros: EVERYTHING drops to 10–100/mo or dead.** No term exceeds ~100 searches/mo across all 4 metros. Metro top-of-page bids climb (e.g. `lead generation for contractors` $20–$70.89; `hvac marketing` $18.69–$65.49) — the $14 cap won't reach top-of-page on the priciest.

## Two decision-relevant findings
1. **Keyword priority FLIPS (correcting both independent plans + the seed).** Lead-Marketplace Displacement (ranked #1 by both arms) is mostly thin/dead; the AI/automation cluster is dead. **The real volume is the head terms** — `marketing for contractors`, `marketing agency for contractors`, `lead generation for contractors`, `contractor lead generation companies`, `home service marketing agency`, plus `thumbtack alternative` (cheap). Final launch keywords = these; keep only `exclusive leads for contractors`/`exclusive contractor leads`/`angi`/`thumbtack alternative` as thin keyword-only adds.
2. **Geo (4 metros) collides with volume → surfaced to Robert.** Head terms ARE eligible (they'll serve once the dead keywords are swapped — "Low search volume" status is global, not geo-driven), but at 4 metros volume is ~10–100/mo per term → realistically **~15–40 clicks/month**, so "one sale" could take months. National keeps the same terms eligible at 100–1K and would materially speed data + lead chances. **GEO DECISION PENDING (see questions) — gates the Phase 4 build.**

---

# FINAL BUILD SPEC (post-validation + Robert's geo decision) — what Phase 4 builds

**Robert's geo decision (2026-06-18): NATIONAL US, Atlanta-led.** Campaign is already US/Presence-only (no geo change needed); add Atlanta + Sunbelt positive location bid adjustments for emphasis (limited effect on Maximize Clicks — emphasis mainly via monitoring + the LPs). Head terms serve at full 100–1K volume.

**Repair-in-place on campaign `23951740211`. Launch = 2 ad groups; pause the other 2. Everything stays PAUSED for Robert's review + unpause.**

- **Done-For-You Outcome → `/go/volume` (LAUNCH PRIMARY — the real volume).** Replace its existing long-tail keywords with validated head terms:
  - Exact: `[lead generation for contractors]`, `[marketing for contractors]`, `[marketing agency for contractors]`, `[contractor lead generation companies]`, `[home service marketing agency]`
  - Phrase: `"marketing for contractors"`, `"done for you lead generation"`, `"lead generation for home services"`
  - (Cheaper-bid winners to lean on: marketing agency for contractors / marketing for contractors / home service marketing agency.)
- **Lead-Marketplace Displacement → `/go/agency-alternative` (LAUNCH SECONDARY — thinner, on-angle).** Keywords: `"thumbtack alternative"` (cheapest, 100–1K), `"exclusive leads for contractors"`, `"exclusive contractor leads"`, `angi leads alternative` (keyword-only), `homeadvisor alternative` (keyword-only). Drop dead terms (`pay per lead alternative`, `shared leads alternative`).
- **PAUSE (don't launch):** Agency-Displacement Pain (all dead keywords) + Competitor-Alternative (low-volume; thumbtack/angi folded into Lead-Marketplace).
- **Bidding:** Maximize Clicks; bump max-CPC cap $12 → **$14**.
- **Negatives (campaign-level):** the synthesis list (jobs/careers, DIY/course, SaaS/CRM names, consumer near-me/repair, franchise/enterprise, agency-operator). NOT `reviews`/`residential`.
- **RSAs (HITL — Robert signoff before unpause):** the AG-1/AG-2 copy in the UNIFIED BUILD-READY PLAN above — map the Done-For-You copy → Done-For-You Outcome, Lead-Marketplace copy → Lead-Marketplace Displacement. Target ad strength ≥ Good.
- **Conversion (Phase 5):** `generate_lead` PRIMARY but currently offline-import-sourced → set up GA4-import recording (no-MCC path) + verify it carries `value`+`currency` (else it won't import). This is GTM/GA4 work, not just the Ads UI.
