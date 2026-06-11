# buildwisemedia.com — implementation notes

Build decision journal (LOCKED 2026-05-25). Newest entries first.

## 2026-06-11 — SEO/AEO/copy audit patch (organic-capture pass)

**Context:** Robert asked for a homepage copywriting + SEO + AEO audit with fixes, verifying organic capture is wired correctly while Google Ads gets figured out.

**Decisions:**
- **Reverted the unsigned 2026-06-04 "Best AI Marketing Agency … in the United States" hero/title** (commits `baf6a37` + `e73271c`, Codex sweep marked "pending signoff" that never got signoff). Self-superlative violated voice/persona locks and drifted off the locked Q7 head terms. New hero leads with the locked head term **"AI marketing department"** + 30-day install + run-for-you; `<title>` keeps the commercial query "AI marketing agency for home services."
- **Killed experiment `WEB-bwm-hero-001`** before editing hero copy (the 06-04 sweep had already silently rewritten its control arm; 0 leads on ~2,680 bot-inflated exposures; audit event `01KTVCW14JTQMRT6WEM6RXB0M8`). Relaunch as `WEB-bwm-hero-002` on the new baseline.
- **De-drifted 06-04 keyword-sweep titles** that misrepresented pages or violated locks: pricing ("Commercial … Multi-Location" → Ascend/home-services framing), /system (one-layer "Speed-to-Lead" title on the 8-layer page → restored system-level framing, kept the speed-to-lead body section), leaky-revenue ("Attribution **Software**" → we don't sell software), ascend-pilot (naked $15,000 in title/meta → removed per never-price-naked; JSON-LD `Offer.price` still carries the figure as structured data).
- **AEO freshness:** llms.txt rewritten (normalized format, all 14 playbook pages, anchored pricing line); llms-full.txt Important Pages extended; playbook hub now lists revenue-operating-system + hvac-lead-generation (hvac-lead-generation was a zero-inbound-link orphan; also linked from /industries/hvac).
- **Selector contract:** `#home-hero-title` and `p.hero-sub` are MVT patch selectors — keep stable across hero edits.
- **Gate note:** sdt-per-section-density reads `.sdt-baseline.json` (grandfathered text-walls owned by PROJ-DESIGN-INTEL-001 P2). A parallel session regenerating the baseline mid-gate-run produces phantom FAILs — re-run before chasing.

**Data wiring verified (organic capture):** form → bwm-form-handler → `contacts.metadata` durably stores referrer/landing_page/UTMs for every submission (organic = UTM-less + referrer). GSC+GA4 weekly digest live. Fixed silent top-5 cap in bwm-self-digest `organic_sessions` (commit `42a811c` there).
