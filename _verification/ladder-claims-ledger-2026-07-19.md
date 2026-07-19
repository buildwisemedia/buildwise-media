# Claim ledger — /playbook/4-steps-business-runs-without-you (shipped 2026-07-19)

All public figures on the page, verified 2026-07-18 against Supabase `lscifhwmmkjiobnthlak`.
First-class = the 7 Building-Event-Taxonomy types (build.shipped, client_comms.sent,
client_state.transition, task.queued, task.resolved, incident.opened, narrative);
daemon.heartbeat and telemetry excluded from every count.

| Public claim | Source query | Value |
|---|---|---|
| "1,303 follow-ups and updates, last 30 days" | operational_events event_type=client_comms.sent created_at>=2026-06-18 | 1303 |
| "550 pieces of work, midnight-7am" (night of Jul 17-18) | operational_events first-class, 2026-07-18T04:00-11:00Z | 550 |
| hourly bars 12A-6A ET | same window, per-hour | 64/68/59/46/107/101/105 |
| "16 good leads this month, every one worth calling back" | v_qualified_leads_by_client asap-pest-wildlife | qualified_this_month=16, qualification_rate=1.00 |
| "about 3,000 pieces of work a day" | operational_events first-class 2026-07-11..07-18 | 20971 / 7 = 2996 |

Measurement: GA4 G-V5LSP69E41 (BWM-self 422160329), production-hostname-gated.
Events: ladder_step_view{step} · selftest_answer{answer} · cta_click{cta}.
Follow-up: mark cta_click as key event via Admin API (SA editor on 422160329).

Re-verify on any republish — relative-time claims ("this month") were frozen to absolute dates
on-page; numbers must be re-pulled if the piece is materially updated.
