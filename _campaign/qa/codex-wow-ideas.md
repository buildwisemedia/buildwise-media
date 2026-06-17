Reading additional input from stdin...
OpenAI Codex v0.140.0
--------
workdir: /Users/robertechevarria/email-campaign-render
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: xhigh
reasoning summaries: none
session id: 019ed5b8-1b2a-7a91-b255-d4d334daad7b
--------
user
READ the file /Users/robertechevarria/email-campaign-render/essay-review.html first (it's a BWM thought-leadership essay on AI, dark "Triangulation" brand). Then PROPOSE a "wow" visual + motion design treatment for EACH major section so each section blows the reader away ON ITS OWN. Do NOT modify any file — output IDEAS ONLY as a markdown punch list.

Brief / constraints:
- Brand colors (use VARIETY, not just monochrome yellow): canvas #050507, marketing yellow #F0FF00, product green #B8FF3A, dark tiers #0E0E13/#15151c, muted #9A9AA4. Warning orange #C7400D exists but is brand-reserved for errors — if you use it for a "danger" beat, flag that.
- MOTION GRAPHICS welcome, but DESKTOP-FIRST: rich on desktop, lightweight/static on mobile (don't hurt mobile load). Respect prefers-reduced-motion.
- Pure CSS / inline SVG / vanilla JS only. NO heavy libraries (no GSAP/three.js/lottie). Scroll-triggered via IntersectionObserver is fine.
- Each section must wow standalone, but the set must feel cohesive.

Sections (in order): (1) Hero with the AI-adoption dot graph; (2) "The curve" — chatbots→agents→autonomous flow + the capability growth chart; (3) "Time is running out" — INCLUDING the line "But it won't last. The edge is open now and it's closing." which MUST feel DANGEROUS — an oh-shit moment, the window is closing — then resolve into RELIEF because the reader has Buildwise Media; (4) "The unvarnished truth" — monthly-leads bar chart + the $10M+ result; (5) "Where we're putting our weight" — advertising; (6) "What you get today" — receipts list (BWM brand-mark bullets) + build timeline; (7) Wrapping up + the closing pull-quote; (8) the client-only offer cards.

For EACH section give: the wow concept (1-2 sentences), the specific mechanic (what animates / what colors / what shape), and a build note (how to implement in CSS/SVG/JS). Keep it concrete and buildable. Put the "danger→relief" section (#3) front and center with your best idea.

Print the punch list to stdout. Do not write any files.
warning: Under-development features enabled: chronicle. Under-development features are incomplete and may behave unpredictably. To suppress this warning, set `suppress_unstable_features_warning = true` in /Users/robertechevarria/.codex/config.toml.
codex
I’ll use the BWM website-builder skill because this is BWM HTML/page work, then I’ll read the essay file and keep this to ideas only.
exec
/bin/zsh -lc "sed -n '1,240p' /Users/robertechevarria/.bwm-agents/skills/bwm-website-builder/SKILL.md && sed -n '1,260p' /Users/robertechevarria/email-campaign-render/essay-review.html" in /Users/robertechevarria/email-campaign-render
 succeeded in 0ms:
---
name: bwm-website-builder
description: BWM website build contract — preflight gate, canonical site files, brand two-system rule, ship gates.
metadata:
  short-description: The binding contract for any BWM website/page work
  project: PROJ-MULTI-AI-PARITY-001
---

# BWM Website Builder (port of the Claude Code skill)

## The preflight gate (HARD)

No scaffold / BaseLayout / canonical-file work happens before
`.bwm-preflight-passed` exists at the repo root. The marker is written by the
orchestrator's website-builder skill after brief validation. If you (Codex/
Gemini) are handed web-file work in a repo without the marker: STOP and return
the task to the orchestrator (PROJ-ECL-BUILD-001 burn — this rule exists
because routing scaffold work around the gate produced a brand-incoherent
build).

## Canonical site files (every BWM site)

- `robots.txt` allowing all 6 AI bots: GPTBot, ClaudeBot, PerplexityBot,
  Google-Extended, ChatGPT-User, anthropic-ai.
- `llms.txt`: text/plain, ≥500 bytes, `# {Business}` + `> {tagline}` +
  `## About/Services/Contact`.
- Legal pages via the legal-page-generator skill before deploy.
- `implementation-notes.md` at repo root (build decision journal).

## Brand rules

- Two-system rule: client visual identity dominates; BWM contributes structure.
  Never default-BWM colors (`#F0FF00`/`#B8FF3A`) on a client site; the NDB
  names the client's accent equivalent. BWM's own canvas is `#050507` — never
  `#000`/`#07070c`.
- R020: every image must drive action (emotion/proof/CTA-pull/curiosity);
  annotate image-bearing elements with `@r020:<category>` within 5 lines.
- Show-Don't-Tell: ≥1 functional creative per major section.
- CTA on client sites = "See If We're a Fit" (verbatim). Booking: `/book`.
- FK grade 5-7 on all copy. No vendor names outside privacy/terms.

## Ship gates (run, don't skip)

1. `bwm-website-qa.sh` against staging (67+ checks).
2. `bwm-preship-gate <dir>` (Pre-Ship Grep Gate) — exit 0 required; banned hex
   / vendor names / CTA paraphrase block the tag.
3. Conventional ship tag `v{N}-<kind>-<desc>-{date}`; Cloudflare Pages deploys
   from push.
4. Emit your ship event (`build-shipped-codex` is wrapper-automatic with
   `--task-id`; Gemini emits `build-shipped-gemini` manually).

## Division of labor

Codex: page assembly, multi-file edits, content fills INSIDE an existing
scaffold with the marker present. Orchestrator: briefs, scaffold, design
judgment, QA sign-off, deploy decisions.
<!DOCTYPE html>
<!-- @internal-architecture -->
<!-- @r020: F2 — the two inline SVGs are PROOF data-viz (real dated capability + build milestones); no decorative imagery. -->
<!-- @sdt-exempt: copy-review draft of a text-forward thought-leadership essay (Robert's voice). Two proof charts already inline; per-section "wow" visuals come in the FINAL pass (GPT-5.5/Codex) once Robert locks the copy. Not a ship. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Building now matters — Buildwise Media</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#050507; --surf:#0E0E13; --surf2:#15151c; --line:#22222c;
  --tx:#F4F4F6; --mut:#9A9AA4; --dim:#6A6A74;
  --acc:#F0FF00;            /* BWM Triangulation — System A marketing yellow */
  --acc-soft:rgba(240,255,0,.14);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--tx);
  font-family:Inter,system-ui,-apple-system,sans-serif;font-weight:300;
  font-size:19px;line-height:1.72;-webkit-font-smoothing:antialiased;}
.wrap{max-width:760px;margin:0 auto;padding:0 26px}
p{margin:0 0 22px}
strong{font-weight:600;color:#fff}
em{font-style:italic}
a{color:var(--acc);text-decoration:none;border-bottom:1px solid var(--acc-soft)}
sup a{border:0;font-weight:600;font-size:.62em;padding-left:1px}
.kic{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:3.5px;text-transform:uppercase;color:var(--mut)}

/* ---- hero ---- */
header.hero{padding:74px 0 46px;border-bottom:1px solid var(--line);
  background:radial-gradient(1100px 460px at 50% -8%, rgba(240,255,0,.06), transparent 70%)}
.brand{display:flex;align-items:center;gap:11px;margin-bottom:46px}
.brand .mk{width:13px;height:13px;background:var(--acc);clip-path:polygon(50% 0,100% 100%,0 100%)}
.brand b{font-weight:800;letter-spacing:-.01em;font-size:16px}
.brand span{color:var(--mut);font-size:13px;font-weight:400}
h1{font-weight:900;letter-spacing:-.035em;line-height:1.02;
  font-size:clamp(40px,7vw,72px);margin:0 0 22px}
h1 .y{color:var(--acc)}
.lede{font-size:clamp(20px,2.4vw,24px);color:var(--mut);font-weight:300;max-width:600px;line-height:1.5}
.meta{margin-top:30px;display:flex;gap:22px;align-items:center;color:var(--dim);font-size:13px;font-family:'JetBrains Mono',monospace;flex-wrap:wrap}
header.hero>.wrap{max-width:1100px}
.herogrid{display:grid;grid-template-columns:1.05fr 0.82fr;gap:48px;align-items:center;margin-top:18px}
.herofig{margin:0;min-width:0}
.herofig figcaption{margin-top:12px}

/* ---- sections ---- */
section{padding:50px 0;border-bottom:1px solid var(--line)}
h2{font-weight:800;letter-spacing:-.025em;line-height:1.06;
  font-size:clamp(27px,4vw,40px);margin:0 0 8px}
h2 .y{color:var(--acc)}
.eyebrow{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--acc);margin-bottom:16px}
.big{font-size:clamp(23px,3vw,30px);line-height:1.4;font-weight:300;color:#fff;letter-spacing:-.01em}
ul.clean{list-style:none;padding:0;margin:0 0 22px}
ul.clean li{padding:14px 0 14px 42px;border-bottom:1px solid var(--line);position:relative}
/* @r020:identity: BWM Triangulation mark as the list bullet — brand glyph at micro scale. */
ul.clean li:before{content:"";position:absolute;left:2px;top:13px;width:24px;height:24px;background:url(img/bwm-mark.svg) center/contain no-repeat}
.pull{font-size:clamp(24px,3.4vw,34px);font-weight:600;letter-spacing:-.02em;line-height:1.22;color:#fff;
  border-left:3px solid var(--acc);padding:6px 0 6px 24px;margin:30px 0}
.note{background:var(--surf);border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin:26px 0;font-size:16px;color:var(--mut)}
.note b{color:var(--acc)}
.flag{background:rgba(199,64,13,.10);border:1px dashed #C7400D;border-radius:12px;padding:16px 20px;margin:24px 0;font-size:15px;color:#e9b9a6}
.flag b{color:#ff6a3d}

/* left-to-right capability flow */
.flow{display:flex;align-items:stretch;margin:32px 0;flex-wrap:nowrap}
.flow .stage{flex:1;background:var(--surf);border:1px solid var(--line);border-radius:14px;padding:20px 18px;min-width:0}
.flow .stage .t{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--mut);margin-bottom:11px}
.flow .stage .b{font-size:16px;line-height:1.35;color:var(--tx);font-weight:300}
.flow .arrow{flex:0 0 44px;display:flex;align-items:center;justify-content:center;color:var(--acc);font-size:23px;font-weight:600;line-height:1}
.flow .s2 .t{color:#c9cf63}
.flow .s3{border-color:var(--acc);background:linear-gradient(155deg,rgba(240,255,0,.11),var(--surf) 62%);box-shadow:0 0 26px rgba(240,255,0,.10)}
.flow .s3 .t{color:var(--acc)}
.flow .s3 .b{color:#fff;font-weight:600}
.flow .live{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--acc);margin-left:8px;vertical-align:middle;animation:livepulse 1.8s ease-in-out infinite}
@keyframes livepulse{0%,100%{box-shadow:0 0 0 0 rgba(240,255,0,.6)}70%{box-shadow:0 0 0 10px rgba(240,255,0,0)}}

/* charts */
figure{margin:30px 0 8px}
figure svg{width:100%;height:auto;display:block;background:var(--surf);border:1px solid var(--line);border-radius:14px}
figcaption{font-size:13px;color:var(--dim);margin-top:10px;font-style:italic}

/* offers */
.offer{background:linear-gradient(180deg,var(--surf),#0b0b10);border:1px solid var(--line);border-radius:16px;padding:26px 26px 22px;margin:22px 0}
.offer h3{margin:0 0 6px;font-size:20px;font-weight:700}
.offer .tag{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--acc);margin-bottom:12px}
.cta{display:inline-block;margin-top:6px;font-weight:600;color:#050507;background:var(--acc);padding:11px 20px;border-radius:8px;border:0}

/* footnotes / footer */
.fn{font-size:13.5px;color:var(--mut);line-height:1.6}
.fn li{margin:0 0 9px}
footer{padding:40px 0 70px;color:var(--dim);font-size:13px;font-family:'JetBrains Mono',monospace;line-height:1.8}
footer a{color:var(--dim)}

/* scroll reveal + fancy desktop */
.rv{opacity:0;transform:translateY(20px);transition:opacity .7s ease,transform .7s ease}
.rv.in{opacity:1;transform:none}
@media (max-width:860px){
  header.hero>.wrap{max-width:760px}
  .herogrid{grid-template-columns:1fr;gap:28px;margin-top:6px}
  .herofig{max-width:460px}
}
@media (max-width:680px){
  body{font-size:18px}
  .flow{flex-direction:column}
  .flow .arrow{flex-basis:auto;height:30px;transform:rotate(90deg)}
  section{padding:38px 0}
  header.hero{padding:46px 0 34px}
}
@media (prefers-reduced-motion:reduce){.rv{opacity:1;transform:none;transition:none}}
</style>
</head>
<body>

<header class="hero">
  <div class="wrap">
    <div class="brand"><span class="mk"></span><b>BUILDWISE MEDIA</b><span>— a note from Robert</span></div>
    <div class="herogrid">
      <div class="herocopy">
        <h1>Building <span class="y">now</span> is the whole game.</h1>
        <p class="lede">A straight read on where AI actually is right now — what's real, what's hype, what broke, and why the next 18 months decide who wins.</p>
        <div class="meta"><span>JUN 2026</span><span>•</span><span>~7 MIN</span><span>•</span><span>ROBERT ECHEVARRIA</span></div>
      </div>
      <figure class="herofig">
        <!-- @r020:F2 proof: AI-adoption dot graph — shows how few people have really used AI yet; proves "the window is wide open, build now" right at the top. -->
        <img src="img/ai-adoption-dotgraph.svg" alt="Dot graph: each dot is ~3.2 million people, colored by their most advanced AI interaction; most have never used AI" style="width:100%;height:auto;display:block">
        <figcaption>Most of the world hasn't really used AI yet. That's not a warning — it's the open window.</figcaption>
      </figure>
    </div>
  </div>
</header>

<section class="rv">
  <div class="wrap">
    <p class="big">In the movie <em>Her</em> we get a possible future of artificial intelligence. We talk to our phone and there's an intelligence that gets us. It's smart. It's funny. And it doesn't just know how to solve our problems — it goes off and takes care of them while we sleep.</p>
    <figure>
      <!-- @r020:F1 emotion: the iconic Her still — the "AI that gets you" promise; pulls the reader straight into the essay's core question. -->
      <img src="img/her.jpg" alt="A still from the film Her: a man at his desk in conversation with his AI" style="width:100%;height:auto;display:block;border-radius:14px;border:1px solid var(--line)">
      <figcaption>The promise, the way <em>Her</em> imagined it. We're not there yet — but the gap is closing fast.</figcaption>
    </figure>
    <p>This is the promise of AI — but we're not there yet.</p>
    <p>Even though AI makes fewer mistakes than humans on a lot of things, it still makes enough to be frustrating. AI doesn't work out of the box. A person has to become an AI engineer (such a new role) to build the digital brain that makes it work the way you want. And even though it moves way faster than a whole team of people, it can still feel frustratingly slow.</p>
    <p>But the advancements are happening so fast that new AI models come out about once a month, with almost daily updates.</p>
  </div>
</section>

<section class="rv">
  <div class="wrap">
    <div class="eyebrow">The curve</div>
    <h2>From chatbots to <span class="y">autonomous</span> in three years.</h2>
    <div class="flow">
      <div class="stage s1"><div class="t">2023–2025</div><div class="b">We had chatbots.</div></div>
      <div class="arrow">&rarr;</div>
      <div class="stage s2"><div class="t">2025–2026</div><div class="b">We had AI agents.</div></div>
      <div class="arrow">&rarr;</div>
      <div class="stage s3"><div class="t">Now<span class="live"></span></div><div class="b">Those agents are autonomous.</div></div>
    </div>
    <p>As of June 2026, AI agents (think of them as digital employees) can work 3–4 hours on their own and get a task about 80% right on the first try.</p>
    <p>At Buildwise Media we spin up about <strong>1,000 agents a day</strong> — a thousand digital employees working on our clients' behalf, 24/7/365. But they're <strong>not</strong> perfect. That's the honest part, and it's why real humans on our team still matter.</p>
    <p>By around September of this year, OpenAI says it expects an intern-level research assistant<sup><a href="#fn6">6</a></sup> — and at a frontier AI lab, an "intern" is usually a mid-PhD computer scientist.</p>
    <p>The most powerful consumer model yet, Anthropic's Fable 5, was live for only a few days this month before a U.S. Commerce Department order suspended access<sup><a href="#fn7">7</a></sup>. We got to build with it while it was up, and its capabilities are genuinely inspiring — we upgraded the digital brain that builds for our clients in that short window, and we're looking forward to getting access again.</p>

    <figure>
      <!-- @r020:F2 proof: METR capability-growth curve with REAL numbers — proves AI capability is accelerating; drives the reader toward the "build now" decision. -->
      <svg viewBox="0 0 700 320" role="img" aria-label="AI task time-horizon growth, 2023 to 2027">
        <text x="26" y="34" fill="#F4F4F6" font-family="Inter" font-weight="800" font-size="17">How much work AI can do in one go</text>
        <text x="26" y="54" fill="#9A9AA4" font-family="JetBrains Mono" font-size="11">LENGTH OF TASK A TOP MODEL FINISHES ON ITS OWN · LOG SCALE</text>
        <!-- gridlines -->
        <g stroke="#22222c" stroke-width="1">
          <line x1="70" y1="90" x2="674" y2="90"/><line x1="70" y1="150" x2="674" y2="150"/>
          <line x1="70" y1="210" x2="674" y2="210"/><line x1="70" y1="262" x2="674" y2="262"/>
        </g>
        <g fill="#6A6A74" font-family="JetBrains Mono" font-size="10">
          <text x="12" y="94">weeks</text><text x="18" y="154">1 day</text><text x="14" y="214">40 min</text><text x="20" y="266">4 min</text>
        </g>
        <!-- measured 2023-2025 solid; 2025->2027 projected dashed to "weeks of work" -->
        <polyline points="110,262 300,210 490,178" fill="none" stroke="#F0FF00" stroke-width="3" stroke-linecap="round"/>
        <polyline points="490,178 640,92" fill="none" stroke="#F0FF00" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round" opacity="0.6"/>
        <g fill="#F0FF00"><circle cx="110" cy="262" r="5"/><circle cx="300" cy="210" r="5"/><circle cx="490" cy="178" r="5"/></g>
        <circle cx="640" cy="92" r="6" fill="#0E0E13" stroke="#F0FF00" stroke-width="2.5"/>
        <g fill="#9A9AA4" font-family="JetBrains Mono" font-size="11">
          <text x="92" y="285">2023</text><text x="282" y="285">2024</text><text x="472" y="285">2025</text><text x="600" y="285">2027 (est.)</text>
        </g>
        <text x="506" y="80" fill="#F0FF00" font-family="Inter" font-style="italic" font-size="12">~ weeks of work</text>
      </svg>
      <figcaption>Measured (METR): ~4 min in 2023 → ~40 min in 2024 → hours in 2025, doubling every ~4 months.<sup><a href="#fn1">1</a></sup> Anthropic projects tasks that take a person <em>weeks</em> by 2027.<sup><a href="#fn8">8</a></sup></figcaption>
    </figure>
  </div>
</section>

<section class="rv">
  <div class="wrap">
    <div class="eyebrow" style="color:#ff6a3d">The window</div>
    <h2>Time is <span class="y">running out</span>.</h2>
    <p>Because of this pace, Buildwise Media's clients are at a real advantage right now. For roughly the next 18 months, a business that builds with AI gets to operate at a level its competitors simply can't match yet. At Anthropic — one of the labs setting the pace — the typical engineer now merges <strong>eight times as much code per day</strong> as they did in 2024.<sup><a href="#fn2">2</a></sup> That's the shape of the edge: more built, more fixed, more shipped, in the same week.</p>
    <p>But it won't last. The edge is open now and it's closing.</p>
    <p>The signals are everywhere. Top engineers at the leading labs say AI now writes ~100% of their code, with Anthropic's company-wide figure between 70% and 90%.<sup><a href="#fn3">3</a></sup> AI forecasting is closing in on the best human predictors in the world.<sup><a href="#fn4">4</a></sup> And this spring an AI made real progress on a math problem that had stood unsolved for about 80 years.<sup><a href="#fn5">5</a></sup></p>
    <p>The labs at the very edge now say that some time around 2028, AI may be able to run much of its own research and improve itself.<sup><a href="#fn8">8</a></sup> When that happens, it starts taking over the revenue-generating parts of a business — and the companies still "getting started" will be too late.</p>
    <p class="pull">The companies that make AI native to how they run — not bolted on … — are the ones that thrive while others fold.</p>
    <p>How can I say that so plainly? Because AI is intelligence, it's become expert-level capable, and a business that can put thousands of digital employees to work will out-run the one still trying to figure out its website. <strong>This is the advantage we make sure our clients have.</strong></p>
  </div>
</section>

<section class="rv">
  <div class="wrap">
    <div class="eyebrow">No spin</div>
    <h2>The <span class="y">unvarnished</span> truth.</h2>
    <p>We're in the top fraction of a percent of what we do — and we're even rarer because we're focused only on revenue for service businesses. And things are still far from perfect. Here's the real state.</p>

    <p>Last year, people thought AI was a giant bubble. This year, AI companies are the most valuable on the planet. Now the job is to prove the ROI for the people <em>using</em> AI. In some ways it's exceeded our expectations.</p>

    <p>We took one client from just over <strong>$300,000 a year</strong> to break the <strong>$10,000,000+</strong> mark in a single year.</p>

    <p>And for a commercial client breaking into residential, our system has logged <strong>about 150 leads since launch</strong> — leads that simply weren't coming in before. Here's what each month actually looked like:</p>

    <figure>
      <!-- @r020:F2 proof: real per-month lead counts for the client — concrete receipts behind the "~150 leads" claim; drives belief in the system. -->
      <svg viewBox="0 0 700 240" role="img" aria-label="Monthly leads since launch: Feb 16, Mar 81, Apr 35, May 17">
        <text x="20" y="28" fill="#F4F4F6" font-family="Inter" font-weight="800" font-size="16">Leads per month since launch</text>
        <line x1="20" y1="200" x2="680" y2="200" stroke="#22222c" stroke-width="1"/>
        <g font-family="Inter" font-weight="800" font-size="16" fill="#F0FF00" text-anchor="middle">
          <rect x="70" y="172" width="92" height="28" rx="4" fill="#F0FF00" opacity="0.8"/><text x="116" y="162">16</text>
          <rect x="232" y="60" width="92" height="140" rx="4" fill="#F0FF00"/><text x="278" y="50">81</text>
          <rect x="394" y="140" width="92" height="60" rx="4" fill="#F0FF00" opacity="0.8"/><text x="440" y="130">35</text>
          <rect x="556" y="171" width="92" height="29" rx="4" fill="#F0FF00" opacity="0.8"/><text x="602" y="161">17</text>
        </g>
        <g font-family="JetBrains Mono" font-size="12" fill="#9A9AA4" text-anchor="middle">
          <text x="116" y="224">FEB</text><text x="278" y="224">MAR</text><text x="440" y="224">APR</text><text x="602" y="224">MAY</text>
        </g>
      </svg>
      <figcaption>Real counts from the live system — 149 in the first four months, with month two hitting its stride.</figcaption>
    </figure>
    <p>But AI is still evolving, and there are real challenges. We rebuilt an entire website for a well-established home-staging and interior-design firm with strong existing search rankings. When we moved their SEO to the new site we saw the expected dip in Google rankings, and our system couldn't fully erase it — though it's bouncing back faster than a normal rebuild would.</p>
    <p>Real-estate brokerages are the hardest thing our system does. Where we're strongest is the speed and quality of what we produce:</p>
    <ul class="clean">
      <li>Open-house assets</li>
      <li>Marketing for specific properties</li>
      <li>Professional websites with top-tier SEO and AEO (getting recommended by AI)</li>
    </ul>
    <p>Where we're still improving is pure lead generation. Real estate is human-to-human more than almost anything else — and as AI gets as capable as the best humans, we expect to turn that corner sooner than later.</p>
  </div>
</section>

<section class="rv">
  <div class="wrap">
    <div class="eyebrow">What's next</div>
    <h2>Where we're putting our <span class="y">weight</span>.</h2>
    <p>Both SEO (getting "free" leads from Google searches) and AEO (getting recommended by AI) take time and attention — and I've never met a business owner who didn't want more business <em>right now</em>, even when they're already drowning in it. So we're building out advertising, because it's the fastest way to bring in new, qualified leads.</p>
    <p>For Meta ads (Facebook & Instagram), our system can already build the campaign, make the creative, and run the platform end to end. We're testing it on ourselves first — once it delivers a 2× return for 90 days straight, we'll pilot it with a few clients.</p>
    <p>We're also building Google Ads, which is more straightforward because it runs on math — and math is exactly where AI shines: find the right keywords, build the campaigns, set the budget, execute. We expect the first Google Ads live by the end of this month for select clients.</p>
    <p>The difference, if it isn't obvious: instead of handing you an expert human, we train the AI to <em>be</em> the expert — native to your business. We believe that's the only way to protect your business's future.</p>
  </div>
</section>

<section class="rv">
  <div class="wrap">
    <div class="eyebrow">The receipts</div>
    <h2>What you get <span class="y">today</span> — and tomorrow.</h2>

codex
I’ve got the top half. The file is already a text-forward review draft with inline proof charts, so I’m reading the rest before proposing section-specific treatments that fit the existing structure.
exec
/bin/zsh -lc "sed -n '261,620p' /Users/robertechevarria/email-campaign-render/essay-review.html" in /Users/robertechevarria/email-campaign-render
 succeeded in 0ms:
    <p>Since the start of 2026 we've built custom AI we can deploy into a business within weeks:</p>
    <ul class="clean">
      <li>25+ page websites that cost large companies <strong>$500,000–$1,000,000</strong> and 6–18 months to build</li>
      <li>100% data coverage — 750+ data points across the customer journey, so the AI decides and responds with precision</li>
      <li>Live lead dashboards — every lead, every status, always current</li>
      <li>Instant lead alerts + end-to-end attribution (you know which ad and page earned the call)</li>
      <li>An always-on follow-up engine, so leads don't go cold while you're busy</li>
    </ul>
    <div class="note"><b>Fill before send:</b> a short "on deck" list from our tracker with direct client benefit (no trade secrets) — e.g. AI-run ad management, automated reporting, deeper CRM automation. Tell me which to feature.</div>

    <figure>
      <!-- @r020:F2 proof: dated BWM build milestones — proves we ship and beat our own estimates; builds trust right before the client offers. -->
      <svg viewBox="0 0 700 260" role="img" aria-label="Buildwise Media build timeline">
        <text x="26" y="32" fill="#F4F4F6" font-family="Inter" font-weight="800" font-size="17">What we've built — and what's coming</text>
        <line x1="40" y1="150" x2="660" y2="150" stroke="#22222c" stroke-width="2"/>
        <g font-family="JetBrains Mono" font-size="10" fill="#F0FF00">
          <text x="55" y="130">MAR 26</text><text x="200" y="130">APR 29</text><text x="360" y="130">JUN 4</text><text x="540" y="130">Q1 27</text>
        </g>
        <g><circle cx="70" cy="150" r="6" fill="#F0FF00"/><circle cx="215" cy="150" r="6" fill="#F0FF00"/><circle cx="375" cy="150" r="6" fill="#F0FF00"/>
          <circle cx="555" cy="150" r="6" fill="#0E0E13" stroke="#F0FF00" stroke-width="2.5"/></g>
        <g font-family="Inter" font-size="12" fill="#F4F4F6">
          <text x="46" y="178">Lead capture +</text><text x="46" y="194" fill="#9A9AA4">attribution live</text>
          <text x="190" y="178">Overnight build,</text><text x="190" y="194" fill="#9A9AA4">zero humans</text>
          <text x="350" y="178">Killed a paid test</text><text x="350" y="194" fill="#9A9AA4">that wasn't working</text>
          <text x="528" y="178">Near-auto delivery</text><text x="528" y="194" fill="#9A9AA4">(humans at gates)</text>
        </g>
        <text x="46" y="232" fill="#6A6A74" font-family="Inter" font-style="italic" font-size="11">Build milestones are real and dated. The last one is a conservative estimate — history says sooner.</text>
      </svg>
      <figcaption>The dates above are real. Every time we predicted one, it came faster than we guessed.</figcaption>
    </figure>
  </div>
</section>

<section class="rv">
  <div class="wrap">
    <div class="eyebrow">Wrapping up</div>
    <h2>Stay at the <span class="y">edge</span> — that's the deal.</h2>
    <p>The system that turns a business AI-native pulls from all the frontier labs at once. It does its own research, finds the best solution, and builds it right into the business. Every time a model improves, that improvement rolls into your business the same day — usually within minutes.</p>
    <p>I like to work with people I like, so most of us are pretty similar. We're ambitious, we care about our clients, and we want what we want — and we want it now. That's what I'm bringing you: keeping Buildwise Media, and therefore you, at the very edge of what AI can do at any given moment. It's not a perfect process. But as I've shown you, it's a very fast one.</p>
    <!-- @signoff-draft: in Robert's voice; he reviews next draft -->
    <p class="pull">The tools will keep moving on their own schedule. The one clock you control is how fast you decide to build. I'd start now.</p>
    <p style="font-weight:600;color:#fff;font-size:21px;margin-bottom:2px">— Robert</p>
    <p class="kic" style="margin:0">Founder, Buildwise Media</p>
    <div class="note" style="margin-top:24px"><b>Sign-off:</b> drafted in your voice above (the "one clock you control" line) — you said you'll read it in the next draft. Want it warmer, shorter, or harder?</div>
  </div>
</section>

<!-- ============ CLIENT-ONLY: OFFERS (friends version drops this whole block) ============ -->
<section class="rv" style="background:linear-gradient(180deg,transparent,rgba(240,255,0,.03))">
  <div class="wrap">
    <div class="eyebrow">For clients only</div>
    <h2>A couple of things, <span class="y">just for you</span>.</h2>
    <p class="kic" style="color:var(--dim);margin-bottom:18px">[ This section appears on the CLIENT version only — friends get the essay + the referral ask + sign-off. ]</p>

    <div class="offer">
      <div class="tag">Offer 1 · Operations</div>
      <h3>We'll find what AI can take off your plate.</h3>
      <p style="margin-bottom:10px">AI is great at revenue — it's also great at operations. Many businesses report <strong>30–40% efficiency gains</strong> in the first year by automating routine work.<sup><a href="#fn9">9</a></sup> Since you're a valued client, the team and I will work with you one-on-one to find what can be automated or tightened up — including cybersecurity, where AI is excellent — freeing you and your team for higher-value work (or more time off) and making your business safer.</p>
      <span class="cta">Reply to set up a call</span>
    </div>

    <div class="offer">
      <div class="tag">Offer 2 · Your weekly 30</div>
      <h3>A standing 30 minutes, every week.</h3>
      <p style="margin-bottom:10px">Time is the most valuable thing there is. Just for you, we'll set up a weekly 30-minute meeting to go over anything you need or want, so we keep tuning your system to exactly what you can imagine. The only ask: same time, same day each week.</p>
      <span class="cta">Reply "weekly" and we'll book it</span>
    </div>

    <div class="offer" style="border-color:var(--acc-soft)">
      <div class="tag">A personal ask</div>
      <h3>Know an owner who wants to thrive, not get disrupted?</h3>
      <p style="margin-bottom:6px">If you know a business owner who'd rather get ahead of AI than get run over by it, send them our way. When it becomes a client, we'll thank you well: <strong>$6,000 per closed-won referral.</strong></p>
    </div>
  </div>
</section>

<section class="rv">
  <div class="wrap">
    <div class="eyebrow">Sources</div>
    <ol class="fn" id="fns">
      <li id="fn1">METR — "Measuring AI Ability to Complete Long Tasks," <a href="https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/">metr.org</a> (Mar 2025; updated Jan 2026). Time-horizon doubling ≈ every 4–7 months.</li>
      <li id="fn2">Anthropic — "When AI builds itself," <a href="https://www.anthropic.com/institute/recursive-self-improvement">anthropic.com</a> (May 2026): "the typical engineer was merging 8× as much code per day as they were in 2024."</li>
      <li id="fn3">Fortune — top engineers at Anthropic &amp; OpenAI say AI now writes ~100% of their code; Anthropic company-wide 70–90% (Jan 29 2026).</li>
      <li id="fn4">Forecasting Research Institute — ForecastBench: AI closing the gap on superforecasters; parity projected later in 2026.</li>
      <li id="fn5">Scientific American — AI made a major advance on an ~80-year-old Erdős problem (May 2026).</li>
      <li id="fn6">TechCrunch — Sam Altman: OpenAI tracking to an "intern-level research assistant" by ~September 2026 (Oct 28 2025).</li>
      <li id="fn7">Anthropic — Fable 5 access notice; U.S. Commerce Department order suspended access (~Jun 12 2026).</li>
      <li id="fn8">Anthropic — "When AI builds itself": "In 2027, AI systems could be capable of tasks that take a person weeks." (recursive self-improvement, May 2026).</li>
      <li id="fn9">The Hackett Group — generative AI projected ~30–40% effort reduction in back-office (SG&A) functions (2023).</li>
    </ol>
    <div class="note" style="font-size:13px"><b>Note:</b> every number above is dialed to what the source actually says. The trend is real; the figures are defensible. Two items still need you: the dot graph and the $10M client result.</div>
  </div>
</section>

<footer>
  <div class="wrap">
    You're getting this because you're a client or a friend of Buildwise Media.<br>
    Buildwise Media · 3724 Marlborough Dr, Tucker, GA 30084 · <a href="{{unsubscribe_url}}">Unsubscribe</a>
  </div>
</footer>

<script>
const obs=new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');obs.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.rv').forEach(el=>obs.observe(el));
</script>
</body>
</html>

codex
- **3. Time Is Running Out: Closing Aperture, Then BWM Relief**
  - **Wow concept:** Make this the essay’s “oh shit” cinematic beat: the open AI advantage visibly narrows around the reader as the line lands, then Buildwise Media punches a stable path back open.
  - **Specific mechanic:** On “But it won’t last. The edge is open now and it’s closing,” a large SVG aperture/window contracts from both sides over the copy, gridlines tilt inward, yellow shifts toward a brief warning-orange edge glow, and the page feels compressed. Then the next paragraph/pull quote triggers a product-green triangular route line that cuts through the closing window and restores breathing room. Use `#C7400D` only here, flagged as danger/warning, not as a general accent.
  - **Build note:** Pure inline SVG overlay with CSS `clip-path`, `stroke-dashoffset`, and IntersectionObserver state classes. Mobile gets a static “closing window” divider and the green relief line; `prefers-reduced-motion` jumps directly to final states.

- **1. Hero With AI-Adoption Dot Graph**
  - **Wow concept:** Turn the dot graph into a dark intelligence map: most dots asleep, a small activated minority glowing, and BWM positioned as the triangular marker that sees the opening before the market does.
  - **Specific mechanic:** Dots load in muted gray first, then a scanline passes through and selectively activates yellow, green, and dim tiers. The BWM triangle sits at the edge of the open opportunity, with a subtle “window open” bracket around the inactive majority.
  - **Build note:** Convert or layer the graph as inline SVG so dots can animate via CSS delays. Use one vanilla JS observer to add `.in`; mobile renders the final activated graph only.

- **2. The Curve: Chatbots → Agents → Autonomous**
  - **Wow concept:** Make the section feel like AI crossing a threshold from tool to workforce.
  - **Specific mechanic:** The three flow cards become a moving pipeline: chatbot text particles enter left, consolidate into agent nodes, then fan out into many tiny autonomous worker triangles on the right. The capability chart line draws itself upward, then the projected dashed segment keeps pulsing faintly.
  - **Build note:** Inline SVG path animation using `stroke-dasharray`; CSS keyframes for node drift. On mobile, keep the stacked flow cards and draw only the chart line once.

- **4. The Unvarnished Truth**
  - **Wow concept:** Treat this as the proof room: less hype, more hard evidence.
  - **Specific mechanic:** The monthly-leads chart animates like a terminal audit becoming a boardroom result: bars rise in green/yellow, then the `$10M+` result appears as a giant quiet watermark behind the paragraph, not a loud badge. The March bar gets a precise glow because it is the breakout month.
  - **Build note:** SVG bars animate height from baseline with CSS transforms. Add a section pseudo-element or absolutely positioned text watermark using `mix-blend-mode:screen` at low opacity on desktop only.

- **5. Where We’re Putting Our Weight: Advertising**
  - **Wow concept:** Show ad systems as controlled force, not noisy marketing.
  - **Specific mechanic:** A split signal board shows Meta, Google, budget, creative, keyword, and lead nodes feeding into one clean “qualified lead” output line. Yellow represents acquisition energy; green represents validated return; muted gray represents testing.
  - **Build note:** Inline SVG network with animated pulse paths. Use CSS custom properties for path colors and IntersectionObserver to stagger the pulses; mobile gets a compact static schematic.

- **6. What You Get Today: Receipts + Build Timeline**
  - **Wow concept:** Make the receipts feel like a live deployment manifest.
  - **Specific mechanic:** Each BWM-mark bullet checks on like a shipped module, with the triangle mark filling from muted gray to product green. The timeline becomes a launch rail: milestones lock in with small yellow sparks, while the future Q1 27 node stays outlined and breathing.
  - **Build note:** Use existing list markup plus CSS masks/backgrounds for the BWM mark state. Animate timeline circles and labels with CSS delays; no new library needed.

- **7. Wrapping Up + Closing Pull Quote**
  - **Wow concept:** Resolve the essay into calm control after the intensity: the edge is moving, but the reader is on the rail.
  - **Specific mechanic:** A subtle triangular orbit system sits behind the closing quote: yellow/green lines converge on one stable BWM triangle, then stop moving when the quote finishes revealing. The quote should feel settled, not flashy.
  - **Build note:** CSS-only background using inline SVG data URI or actual inline SVG behind `.pull`; animate stroke draw and opacity on desktop. Static low-opacity version on mobile/reduced motion.

- **8. Client-Only Offer Cards**
  - **Wow concept:** Make the offers feel like private access cards, not generic CTAs.
  - **Specific mechanic:** Each card gets a different system identity: Operations = green efficiency grid, Weekly 30 = yellow calendar rail, Referral = muted dark card with a restrained yellow value marker. Hover reveals a thin triangular corner lock and a short light sweep.
  - **Build note:** CSS pseudo-elements for corner locks, borders, and hover sweeps. Keep cards lightweight with no JS required beyond existing reveal observer.
tokens used
33,925
- **3. Time Is Running Out: Closing Aperture, Then BWM Relief**
  - **Wow concept:** Make this the essay’s “oh shit” cinematic beat: the open AI advantage visibly narrows around the reader as the line lands, then Buildwise Media punches a stable path back open.
  - **Specific mechanic:** On “But it won’t last. The edge is open now and it’s closing,” a large SVG aperture/window contracts from both sides over the copy, gridlines tilt inward, yellow shifts toward a brief warning-orange edge glow, and the page feels compressed. Then the next paragraph/pull quote triggers a product-green triangular route line that cuts through the closing window and restores breathing room. Use `#C7400D` only here, flagged as danger/warning, not as a general accent.
  - **Build note:** Pure inline SVG overlay with CSS `clip-path`, `stroke-dashoffset`, and IntersectionObserver state classes. Mobile gets a static “closing window” divider and the green relief line; `prefers-reduced-motion` jumps directly to final states.

- **1. Hero With AI-Adoption Dot Graph**
  - **Wow concept:** Turn the dot graph into a dark intelligence map: most dots asleep, a small activated minority glowing, and BWM positioned as the triangular marker that sees the opening before the market does.
  - **Specific mechanic:** Dots load in muted gray first, then a scanline passes through and selectively activates yellow, green, and dim tiers. The BWM triangle sits at the edge of the open opportunity, with a subtle “window open” bracket around the inactive majority.
  - **Build note:** Convert or layer the graph as inline SVG so dots can animate via CSS delays. Use one vanilla JS observer to add `.in`; mobile renders the final activated graph only.

- **2. The Curve: Chatbots → Agents → Autonomous**
  - **Wow concept:** Make the section feel like AI crossing a threshold from tool to workforce.
  - **Specific mechanic:** The three flow cards become a moving pipeline: chatbot text particles enter left, consolidate into agent nodes, then fan out into many tiny autonomous worker triangles on the right. The capability chart line draws itself upward, then the projected dashed segment keeps pulsing faintly.
  - **Build note:** Inline SVG path animation using `stroke-dasharray`; CSS keyframes for node drift. On mobile, keep the stacked flow cards and draw only the chart line once.

- **4. The Unvarnished Truth**
  - **Wow concept:** Treat this as the proof room: less hype, more hard evidence.
  - **Specific mechanic:** The monthly-leads chart animates like a terminal audit becoming a boardroom result: bars rise in green/yellow, then the `$10M+` result appears as a giant quiet watermark behind the paragraph, not a loud badge. The March bar gets a precise glow because it is the breakout month.
  - **Build note:** SVG bars animate height from baseline with CSS transforms. Add a section pseudo-element or absolutely positioned text watermark using `mix-blend-mode:screen` at low opacity on desktop only.

- **5. Where We’re Putting Our Weight: Advertising**
  - **Wow concept:** Show ad systems as controlled force, not noisy marketing.
  - **Specific mechanic:** A split signal board shows Meta, Google, budget, creative, keyword, and lead nodes feeding into one clean “qualified lead” output line. Yellow represents acquisition energy; green represents validated return; muted gray represents testing.
  - **Build note:** Inline SVG network with animated pulse paths. Use CSS custom properties for path colors and IntersectionObserver to stagger the pulses; mobile gets a compact static schematic.

- **6. What You Get Today: Receipts + Build Timeline**
  - **Wow concept:** Make the receipts feel like a live deployment manifest.
  - **Specific mechanic:** Each BWM-mark bullet checks on like a shipped module, with the triangle mark filling from muted gray to product green. The timeline becomes a launch rail: milestones lock in with small yellow sparks, while the future Q1 27 node stays outlined and breathing.
  - **Build note:** Use existing list markup plus CSS masks/backgrounds for the BWM mark state. Animate timeline circles and labels with CSS delays; no new library needed.

- **7. Wrapping Up + Closing Pull Quote**
  - **Wow concept:** Resolve the essay into calm control after the intensity: the edge is moving, but the reader is on the rail.
  - **Specific mechanic:** A subtle triangular orbit system sits behind the closing quote: yellow/green lines converge on one stable BWM triangle, then stop moving when the quote finishes revealing. The quote should feel settled, not flashy.
  - **Build note:** CSS-only background using inline SVG data URI or actual inline SVG behind `.pull`; animate stroke draw and opacity on desktop. Static low-opacity version on mobile/reduced motion.

- **8. Client-Only Offer Cards**
  - **Wow concept:** Make the offers feel like private access cards, not generic CTAs.
  - **Specific mechanic:** Each card gets a different system identity: Operations = green efficiency grid, Weekly 30 = yellow calendar rail, Referral = muted dark card with a restrained yellow value marker. Hover reveals a thin triangular corner lock and a short light sweep.
  - **Build note:** CSS pseudo-elements for corner locks, borders, and hover sweeps. Keep cards lightweight with no JS required beyond existing reveal observer.
