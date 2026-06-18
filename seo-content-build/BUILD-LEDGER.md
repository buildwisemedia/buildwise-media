# SEO Content Cluster — BUILD LEDGER (single source of truth)

> **Both AIs check off here. Do not deviate from a spec without updating this file.**
> Approved plan: `~/bwm-seo-content-plan.html` (Robert approved 2026-06-18).
> Branch: `feat/seo-content-cluster-2026-06-18` (worktree /tmp/bwm-seo-build).
> Author = Codex (GPT-5.5 x-high). QA = Claude (Opus). Loop: author → QA → fix → PASS.

## Status legend
`[ ] TODO` · `[~] DRAFTED` (Codex wrote it) · `[!] QA-FAIL` (see notes) · `[x] QA-PASS` (Claude verified) · `[S] STAGED` (compiles + on preview)

## Page checklist
| # | Page | File | Type | Status |
|---|---|---|---|---|
| 1 | Custom AI system (PILLAR) | `src/pages/playbook/custom-ai-solutions.astro` | NEW | [x] QA-PASS (Codex authored, Claude QA: title OK, 3 schemas, 9 imgs R020-annotated, proof-copy + contractions fixed, compiles) |
| 2 | AI-agency alternative | `src/pages/playbook/agency-alternative.astro` | ENHANCE | [ ] |
| 3 | AI for business operations | `src/pages/playbook/ai-for-business-operations.astro` | NEW | [ ] |
| 4 | After-hours call capture | `src/pages/playbook/ai-answering-service-service-business.astro` | NEW | [ ] |
| 5 | How AI runs your marketing | `src/pages/playbook/ai-marketing-department-small-business.astro` | ENHANCE | [ ] |
| 6 | The AI website that sells | `src/pages/playbook/ai-website-for-business.astro` | NEW | [ ] |
| 7 | Get found when buyers ask AI | `src/pages/playbook/show-up-in-ai-recommendations.astro` | NEW | [ ] |
| 8 | Build your own AI vs installed | `src/pages/playbook/build-your-own-ai.astro` | NEW | [ ] |
| 9 | The AI system for revenue | `src/pages/playbook/revenue-operating-system.astro` | ENHANCE | [ ] |
| — | Register new pages in hub | `src/pages/playbook/index.astro` | EDIT | [ ] |

Tier 1 (ship first): #1, #2, #3 · Tier 2: #4, #5, #6 · Tier 3: #7, #8, #9.
Page #10 (ai-tools-vs-system) HELD per plan — not in this build.

---

## REFERENCE PAGE TO MATCH (structure, schema, styling)
`src/pages/playbook/revenue-operating-system.astro` — copy its exact pattern:
- `import BaseLayout from '../../layouts/BaseLayout.astro';` + `import canonical from '../../data/canonical.json';`
- `const title` / `const description` consts.
- JSON-LD objects: **DefinedTerm** (with `#term` @id), **BreadcrumbList**, **FAQPage** — passed via `<BaseLayout title={title} description={description} jsonLd={[definedTerm, breadcrumb, faqSchema]}>`.
- Sections: eyebrow + `h-hero` H1 + lede + R020-annotated hero `<img>` (or inline SVG diagram), then 6–9 `<section>` blocks each with an H2, then an FAQ section.
- Reuse existing CSS classes/patterns from that file; keep page-scoped `<style>` consistent with sibling pages.
- Pull locked values (pricing/tiers/ICP) from `canonical.json` — never hardcode.

---

## CROSS-CUTTING BUILD RULES (every page; these are the QA checklist)
1. **Short answer up top** — plain answer in first 2–3 paragraphs.
2. **Proof before any in-flow CTA** — same/preceding section. APPROVED PROOF ONLY:
   - `$300K → $10M+` (de-identified specialty/custom builder; already on /results + homepage)
   - `~150 leads since launch` (de-identified concrete contractor)
   - NO other stats. No invented percentages/metrics.
3. **Never "agency"** in a self-descriptive sentence. Category = "verifiable custom AI system for service businesses." Lead-gen/marketing = evidence, not identity.
4. **No vendor names** — no software brands AND no AI-tool brands (chatbot names, maps brands, model names). Say "an AI assistant," "your booking page," "your online presence."
5. **No revenue figures describing the ICP on-page** (the band is internal). Describe the situation, not the number. (Client win proofs in rule 2 are allowed.)
6. **Never price naked** — price only next to the stack it replaces; most pages don't price.
7. **Plain English, Flesch-Kincaid grade 5–7.** Short declarative sentences. Conclusion first. End sections with a question. No marketing verbs (leverage/empower/unlock/transform/synergy). **Use natural contractions** (don't / isn't / you're / it's / we're) — formal "do not / is not / you are" reads stiff and off-voice. NEVER write internal/meta language in client copy ("approved proof points," "de-identified," "ICP," "per the spec").
8. **Persona:** overworked owner who is the bottleneck. Frame the week before results. "Run-for-you," never "powerful platform." Never blame their team.
9. **Schema:** DefinedTerm + BreadcrumbList + FAQPage on every page.
10. **Show-Don't-Tell:** ≥1 qualifying visual per major section (data-viz / photo / scene illo / interactive proof widget). Each image needs an `@r020:F1|F2|F3|F4` annotation within 5 lines above it. Reuse existing /images assets where they fit; else an inline SVG diagram.
11. **Real internal links only** — correct paths. Note: problem pages are `/problem/<x>` NOT `/playbook/<x>`. New spokes link to the pillar (#1) and back; pillar links to all spokes.
12. **CTAs:** primary "Get My Free Revenue Leak Map" → `/audit`. Secondary "See If We're a Fit" → `/book`, "See the System" → `/system`.
13. **Gates before STAGED:** `astro build` compiles · Pre-Ship Grep Gate green · Creative Copy Gate green · no homepage title collision.

---

## PER-PAGE SPECS

### #1 — Custom AI system (PILLAR) · NEW · `custom-ai-solutions.astro`
- **Title:** `What Is a Custom AI System for Service Businesses | Buildwise Media` (MUST differ from homepage title "Custom AI Solutions for Service Businesses | Buildwise Media").
- **Meta:** A custom AI system is built on your domain, run for you, and owned by you. Here's what that means for a service business — and what it isn't.
- **H1:** A custom AI system does the growth work, so you don't have to
- **DefinedTerm name:** "Custom AI System"
- **Intent:** commercial-investigation.
- **Primary KW:** custom ai solutions · custom ai for service business. **Secondary:** custom ai, business ai solutions, ai system for service business.
- **Outline (H2s):** (1) The plain answer — what it is / is not. (2) Why owners start looking (week full by 9am; tools don't talk; reports don't say what to do). (3) What the system runs for you — SHORT callout + link to /system for the 8 layers (DO NOT rebuild the 8-layer list/diagram here). (4) Custom system vs off-the-shelf tools. (5) What you own — ONE line + link to /playbook/agency-alternative (do not deep-dive). (6) Proof ($300K→$10M+), then CTA. (7) Who it's for / not for (no revenue numbers). (8) FAQ (5 Qs).
- **Hub role:** link to every spoke (#2–#9) + /system, /services/ascend, /services/ascend-pilot, /results, /problem/owner-bottleneck, /problem/leaky-revenue, /audit.
- **Sample opening copy:** see plan HTML page 01 (use as the voice target).
- **QA notes:** title collision (fixed via differentiated title) · no 8-layer rebuild · no ownership deep-dive · no 30-day timeline rebuild (link /how-it-works).

### #2 — AI-agency alternative · ENHANCE · `agency-alternative.astro`
- Extend existing page; DO NOT create a new file. Read current file first; preserve what works.
- **Title:** The AI-Agency Alternative for Service Businesses | Buildwise Media
- **Meta:** Most AI vendors build inside their accounts — not yours. We install a custom AI system on your domain, run it for you, and leave the asset in your hands.
- **H1:** You don't own what an AI agency builds for you
- **Primary KW:** ai agency alternative · ai marketing system for small business. **Head anchor (secondary, woven only):** ai agency, ai agencies.
- **Adds:** top section "If you searched for an AI agency, start here" leading with the category claim BEFORE the critique · own-vs-rent (code/data/accounts) · honest disqualifier = owners who want to approve every tactic / want a one-off (NOT "owners who want hands-off" — that's us).
- **QA notes:** lead with category claim not critique · drop internal product name from meta · "ai agency" stays a woven term, never a self-label.

### #3 — AI for business operations · NEW · `ai-for-business-operations.astro`
- **Title:** AI for Business Operations: An Owner's Guide | Buildwise Media
- **Meta:** AI for business operations should clear the owner's week — connect lead flow, tighten follow-up, and make the next move obvious. Here's where it belongs.
- **H1:** AI for business operations should clear the owner's week
- **DefinedTerm name:** "AI for Business Operations"
- **Primary KW:** ai scheduling for service businesses · ai dispatch for contractors · ai quote follow-up. **Head anchor:** ai for business operations, ai operations.
- **Outline (H2s):** (1) Start with the owner's week (5:30am; lost to ops by 9am). (2) Where AI belongs — intake, follow-up, scheduling handoffs, review requests, reporting. (3) Where AI does not belong — replacing judgment, hiding weak ops, another inbox. (4) The operating loop — capture → route → follow up → measure → decide. (5) Proof callout + CTA. (6) FAQ.
- **QA notes:** NO "ai for it ops" / "ai for growth" · link `/problem/owner-bottleneck` (correct path) · proof next to CTA, not in FAQ.

### #4 — After-hours call capture · NEW · `ai-answering-service-service-business.astro`
- **Title:** After-Hours Call Capture for Service Businesses | Buildwise Media
- **Meta:** An answering service catches the call. Growth needs the whole path: answer, qualify, route, follow up, and prove the source. Here's the difference.
- **H1:** An AI answering service is only the first handoff
- **DefinedTerm name:** "After-Hours Call Capture"
- **Primary KW:** ai phone answering for contractors · after-hours call capture · missed-call text-back. **Head anchor (body only):** ai answering service.
- **Positioning:** ONE layer of the system, not a phone-bot product. Keyword woven contextually ("what most people call an AI answering service is one layer of the system").
- **Outline:** real problem isn't just missed calls (missed calls / weak qualification / no source tracking / no next-step owner) → what answering does well → what it can't fix alone → the intake path (answer/qualify/route/follow-up/prove source) → when a simple tool is enough vs full system → FAQ.
- **QA notes:** keyword never standalone in title · no "78% of buyers" or any invented stat · realistic priority.

### #5 — How AI runs your marketing · ENHANCE · `ai-marketing-department-small-business.astro`
- Extend existing; read first. Demote marketing from identity to PROOF of the system.
- **Title:** AI Marketing for Small-Business Owners | Buildwise Media
- **H1:** AI marketing for small business should come off the owner's plate
- **Primary KW:** ai marketing for contractors · ai marketing for hvac companies · ai marketing system for service business. **Head anchor:** marketing ai, ai in marketing.
- **Net-new angle (the differentiator):** the **Monday-to-Friday runtime loop** — what the system does in sequence each week: trigger → build → publish → inbound → follow-up → report → repeat. Make this the spine.
- **QA notes:** NO revenue figure in copy ("$4M owner" was removed) · trades-specific long-tail primaries.

### #6 — The AI website that sells · NEW · `ai-website-for-business.astro`
- **Title:** What an AI Website Should Actually Do | Buildwise Media
- **Meta:** An AI website should qualify leads, prove trust, route action, and feed a system you don't manage — not just look current. Here's the test.
- **H1:** An AI website should be a working lead path, not just a new look
- **DefinedTerm name:** "AI Website" (for a service business)
- **Primary KW:** ai website for service business · ai website for contractors. **Head anchor:** ai website, ai for web.
- **Outline:** plain answer (a site should do work) → the five jobs (show trust fast / match the problem / route the next action / capture clean source data / feed follow-up) → what most AI websites get wrong → the owner test (phone ring? shows what happened? reduces work?) → how it connects to the system → FAQ.

### #7 — Get found when buyers ask AI · NEW · `show-up-in-ai-recommendations.astro`
- **Title:** How to Show Up When Buyers Ask AI Who to Hire | Buildwise Media
- **Meta:** When buyers ask AI who to hire, the clearest proof wins. Here's what an owner needs to be the answer — without tricks.
- **H1:** When a buyer asks AI who to hire, does your name come up?
- **DefinedTerm name:** "AI Search Visibility" (plain-language definition; no "AEO" jargon on page)
- **Primary KW:** how to show up in AI search results · get recommended by AI · AI recommendations local business. **Head anchor:** ai search, ai answers.
- **Outline:** how AI changes the shortlist → what AI needs to understand (who/where/what problems/what proof) → why thin content loses → the approach (build the proof base / connect the pages / keep data consistent / measure the path) → what to do before chasing it → FAQ.
- **QA notes (HARD):** NO AI-tool brand names anywhere (chatbots, maps, results-page features) — vendor rule applies · NO "digital footprint"/"schema markup"/"AEO" jargon · owner-facing long-tail primary.

### #8 — Build your own AI vs installed · NEW · `build-your-own-ai.astro`
- **Title:** Build Your Own AI System? Count the Owner Time First | Buildwise Media
- **Meta:** Building your own AI system costs more than the tools — it costs your nights and weekends. Here's the real build-vs-buy math for an owner.
- **H1:** Building your own AI system costs more than the tools — here's the real math
- **DefinedTerm name:** "Build vs Buy AI"
- **Primary KW:** buy vs build AI for small business · DIY AI for business · ai system for contractors. **Head anchor:** build your own ai, make your own ai.
- **Outline:** the plain answer (you can build parts; the system is harder than the demo) → what a service-business AI system must include → the hidden cost is owner time → when DIY is right → when run-for-you is right → how we handle ownership without you building it → FAQ.
- **QA notes:** NO model/vendor brand names in copy · H1 is a statement not a question · drop dev/hobbyist secondaries · correct `/problem/owner-bottleneck` link.

### #9 — The AI system for revenue · ENHANCE · `revenue-operating-system.astro`
- Extend existing (this is also the REFERENCE page). Capture "ai system / operating system" demand HERE; do not build a second system page.
- **Title:** The AI System That Runs Revenue Work | Buildwise Media
- **H1:** An AI system ties your revenue work into one loop
- **Primary KW:** ai system for small business · ai system for service business. **Head anchor:** ai operating system, ai system (SMB-modified; never the bare enterprise-tech terms).
- **Adds:** a short "AI system vs an AI tool" diagnostic up top + SMB-modified keyword targeting.
- **QA notes:** no invented "4h vs 4min" metric — approved win or structural before/after only · keep "operating system" framing, never bare tech-infra terms.

---

## LOOP PROTOCOL
1. Codex authors the file from this spec + the reference page. Marks `[~] DRAFTED` (writes status note below).
2. Claude QA: read file → check ALL 13 cross-cutting rules + per-page QA notes → `astro build` compiles → grep gates. PASS → `[x]`. FAIL → `[!]` with numbered findings.
3. Codex fixes the numbered findings only. Re-QA. Repeat until `[x]`.
4. When all 9 are `[x]`: register new pages in `index.astro`, `astro build`, run Pre-Ship Grep Gate, deploy preview → `[S] STAGED`.
5. Robert visual signoff (HITL) → merge to main → production deploy → tag `vN-seo-content-cluster-2026-06-18`.

## LOG (append-only)
- 2026-06-18 — Ledger created. Worktree + lease up. Starting Tier 1.
