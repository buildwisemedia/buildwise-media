# Iteration Brief — Cost-per-Task Dashboard v2 (the judge's merge)

This is an ITERATION of an approved direction, not a redesign. The judge (owner) picked entry A and said: "Combination of A and B. More detailed data on both. Like the saturation of chart on A better, but B has a better layout."

## Sources (read both first)
- BASE (keep its chart color saturation, palette register, and data honesty): /private/tmp/claude-501/-Users-robertechevarria/7d9bc185-4bfb-43fb-99a6-55fe8ffb50e5/scratchpad/bakeoff-r2/entries/fable-r2.html
- LAYOUT DONOR (adopt its page structure / grid / section organization): /private/tmp/claude-501/-Users-robertechevarria/7d9bc185-4bfb-43fb-99a6-55fe8ffb50e5/scratchpad/bakeoff-r2/entries/kimi-r2.html

## The merge contract
1. B's layout skeleton carrying A's chart voice (saturation, palette, axis discipline).
2. "More detailed data on both" — the dataset below is ENRICHED (daily trend, effort mix, client split, p50/p90 + tokens-per-run). Use it all; every number traces to a field; invent nothing.
3. Same output contract as before: ONE self-contained HTML file, inline CSS/JS, hand-built inline-SVG charts only, Google Fonts only external, responsive, plain-English CEO-readable labels, provenance footnotes visible.
4. Same hard bans: no chart junk/3D/pie>5, no stat-counters-as-charts, no coral default, no ultra-round ≥800 display sans, no circle-number steps, no ghost numerals, no arc clutter, no rotated stamps.

## ENRICHED DATASET (embed verbatim in a <script> tag; render from it)
```json
{
  "provenance": {
    "sol_telemetry": "bwm codex-usage log 2026-07.jsonl — 736 logged GPT-5.6 Sol runs, logging began Jul 11 2026; window Jul 11–20",
    "kimi_meter": "OpenRouter credits API, queried 2026-07-20",
    "flat_plan_note": "Flat-rate AI plan seats have $0 marginal cost per task; only metered API tasks bill per token."
  },
  "daily_runs": [
    {"date":"07-11","runs":172},{"date":"07-12","runs":268},{"date":"07-13","runs":72},
    {"date":"07-14","runs":20},{"date":"07-15","runs":11},{"date":"07-16","runs":64},
    {"date":"07-17","runs":58},{"date":"07-18","runs":20},{"date":"07-19","runs":26},{"date":"07-20","runs":27}
  ],
  "effort_mix": {"xhigh":714,"high":19,"medium":4,"ultra":1},
  "work_split": {"internal_system_work":670,"client_facing_runs":66,"top_client_runs":[{"client":"design2sell","runs":15},{"client":"asap-pest-wildlife","runs":15},{"client":"hope-sky-llc","runs":14},{"client":"townsend-realty-group","runs":6},{"client":"bronkar-lee","runs":6},{"client":"other","runs":10}]},
  "task_classes": [
    {"task_class":"code-multi-file","runs":636,"p50_min":2.3,"p90_min":4.8,"median_tokens_per_run":50099},
    {"task_class":"review-legal","runs":17,"p50_min":5.0,"p90_min":12.7,"median_tokens_per_run":109474},
    {"task_class":"image-gen","runs":12,"p50_min":3.2,"p90_min":4.3,"median_tokens_per_run":71025},
    {"task_class":"content-gen","runs":7,"p50_min":6.0,"p90_min":16.1,"median_tokens_per_run":66047},
    {"task_class":"research","runs":7,"p50_min":5.4,"p90_min":12.7,"median_tokens_per_run":168240},
    {"task_class":"analysis","runs":5,"p50_min":4.1,"p90_min":10.2,"median_tokens_per_run":125432},
    {"task_class":"computer-use","runs":5,"p50_min":1.4,"p90_min":18.1,"median_tokens_per_run":43521},
    {"task_class":"design-build","runs":5,"p50_min":24.7,"p90_min":41.5,"median_tokens_per_run":363572},
    {"task_class":"design-client-surface","runs":5,"p50_min":12.9,"p90_min":17.8,"median_tokens_per_run":222773},
    {"task_class":"design-page-authoring","runs":5,"p50_min":7.7,"p90_min":12.7,"median_tokens_per_run":212866}
  ],
  "kimi_k3_metered": {"credits_funded_usd":25.0,"spent_usd":3.17,"remaining_usd":21.83,"pages_authored":6,"scorecards_and_predictions":3,"approx_cost_per_page_usd":0.66},
  "bakeoff_case_studies":[
    {"name":"Bake-off #1 (client-brand briefs)","date":"07-19/20","metered_spend_usd":1.19,"outcome":"Kimi last in all comparisons"},
    {"name":"Rebrand Gauntlet (open briefs)","date":"07-20","metered_spend_usd":1.99,"outcome":"Kimi won the wow round"}
  ]
}
```

## Craft bar
The judge should recognize BOTH parents instantly — A's color voice inside B's structure — and find strictly more insight per screen. Insight-first headers; a CEO acts on it in 60 seconds.
