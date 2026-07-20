# Design Dispatch Brief — ROUND 2: BWM "Cost per Task" Executive Dashboard

One-pass build. There is no follow-up round. This is a design competition entry.

## Output contract
- ONE complete, self-contained HTML file. All CSS inline; vanilla JS inline; charts must be hand-built inline SVG/CSS/JS (no chart libraries, no CDNs). Google Fonts `<link>` allowed, nothing else external.
- Use ONLY the dataset embedded below. Do not invent numbers, prices, or seat counts that are not in the dataset. Every displayed number must trace to a dataset field. Where the dataset gives no dollar figure, do not manufacture one.
- Fully responsive; must read beautifully at 1440px desktop AND on a phone. Light or dark, any identity register.

## The round
An internal dashboard for the owner of an AI-native agency: "where does the machine work go, and what does each task actually cost?" The reader is a busy CEO — plain-English labels, insight-first, zero jargon. Judged blind against two rival builds on: clarity of the story, chart craft, hierarchy, distinctiveness, and whether a CEO could act on it in 60 seconds.

## The story the data tells (your layout is free; the insight must land)
1. One AI worker (GPT-5.6 "Sol", flat-rate plan) did 719 logged tasks in 19 days — flat plans make marginal task cost ~$0.
2. Task classes differ wildly in weight: code work dominates count; design builds dominate time-per-task.
3. Metered API pricing (the Kimi K3 experiment) shows what per-task costs look like when every token bills: ~$0.50/page authored, $1.19 total for a 2-page + 2-scorecard experiment.
4. The punchline the CEO cares about: flat-rate capacity is prepaid — utilization is the lever; metered capacity is elastic — quality per dollar is the lever.

## DATASET (embed verbatim in a <script> tag; render from it)
```json
{
  "provenance": {
    "sol_telemetry": "bwm codex-usage log 2026-07.jsonl — 719 logged GPT-5.6 Sol runs, Jul 1–20 2026, BWM production work",
    "kimi_meter": "OpenRouter credits API, queried 2026-07-20",
    "flat_plan_note": "Flat-rate AI plan seats have $0 marginal cost per task; only metered API tasks bill per token."
  },
  "sol_task_classes_jul": [
    {"task_class": "code-multi-file", "runs": 619, "median_minutes": 2.2, "total_tokens": 41979649},
    {"task_class": "review-legal", "runs": 16, "median_minutes": 5.3, "total_tokens": 1878662},
    {"task_class": "image-gen", "runs": 12, "median_minutes": 3.2, "total_tokens": 865493},
    {"task_class": "content-gen", "runs": 7, "median_minutes": 6.0, "total_tokens": 933841},
    {"task_class": "research", "runs": 7, "median_minutes": 5.4, "total_tokens": 1175376},
    {"task_class": "analysis", "runs": 5, "median_minutes": 4.1, "total_tokens": 650634},
    {"task_class": "computer-use", "runs": 5, "median_minutes": 1.4, "total_tokens": 602815},
    {"task_class": "design-build", "runs": 5, "median_minutes": 24.7, "total_tokens": 2865333},
    {"task_class": "design-client-surface", "runs": 5, "median_minutes": 12.9, "total_tokens": 1372606},
    {"task_class": "design-page-authoring", "runs": 5, "median_minutes": 7.7, "total_tokens": 978675},
    {"task_class": "other (9 classes)", "runs": 33, "median_minutes": 3.1, "total_tokens": 1706000}
  ],
  "kimi_k3_metered": {
    "credits_funded_usd": 25.0,
    "spent_usd": 1.19,
    "pages_authored": 2,
    "scorecards": 2,
    "approx_cost_per_page_usd": 0.5
  },
  "bakeoff_case_study": {
    "date": "2026-07-19/20",
    "what": "3-model blind design bake-off: 6 pages + 6 blind scorecards",
    "metered_spend_usd": 1.19,
    "flat_plan_marginal_usd": 0
  }
}
```

## Hard bans
1. Rounded/geometric display sans ≥800 as display voice · 2. default coral/red accent · 3. arc clutter · 4. rotated stamps · 5. ghost numerals · 6. number-in-circle step cards · 7. chart junk: 3D, gratuitous gradients-as-data, pie charts with >5 slices · 8. stat counters as a substitute for actual charts.

## Craft bar
Real charts (axes, scales, labeled), honest proportions, provenance footnotes visible, plain-English insight headers. A dashboard the CEO would pin.
