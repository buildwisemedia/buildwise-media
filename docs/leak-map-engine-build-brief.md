# Codex Build Brief — Real Diagnostic Engine for the Live Revenue Leak Map prototype
<!-- @internal-architecture -->
(Authored by Opus after a 16-persona adversarial value red-team hardened the engine. Build exactly this.)

## YOUR JOB
Edit ONE file only: `src/pages/go/leak-map-prototype.astro` (the standalone prototype).
DO NOT touch `src/components/FitDiagnostic.astro` or any live funnel file. This phase proves the
reveal delivers VALUE (not echo). The welcome/Q5/Q7/reveal LOOK is already CEO-approved — keep it.

## THE PROBLEM YOU ARE FIXING
The reveal currently just echoes the bottleneck the owner picked in Q5 ("you said Demand → your leak
is Demand"). Zero value. The CEO killed it. The "what we'd install first" cards use internal jargon
(Fit gate / Value proof / Demand floor / Dispatch rules) — meaningless to a tired HVAC owner.
The prototype also only COLLECTS 2 real inputs (Q5 pick + Q7 targets); the rail's other 4 stages are
faked "done." A real diagnostic needs real inputs to reason over.

## WHAT TO BUILD

### 1. Add the 5 missing input steps (functional, in the EXISTING cockpit design language)
Add real capture for the inputs the engine reasons over, BEFORE the existing Q5 leak step. Reuse the
design atoms already in the file (`.leak-option` card pattern, `.dial-card`/`.preset-row` pattern,
micro-insight line, live-map node lighting). FUNCTIONAL + on-brand — do NOT build new bespoke
"instruments" (trade tiles / donut / gauges); that polish is a later phase. Each step lights its node
on the live map + shows a micro-insight, like Q5 does today.

Steps + EXACT state keys/values (MUST match verbatim — they feed the eventual port):
- **Q1 Service** → `state.service` (single). Values: `hvac, roofing, plumbing, pest, realtor, concrete, cleaning, other`. Chips. Lights `service` node. Labels: HVAC / Roofing / Plumbing / Pest Control / Real Estate / Concrete / Cleaning / Other.
- **Q2 Channels** → `state.leadSources` (MULTI array). Values: `referrals, google-organic, paid-ads, social, cold-outreach, unsure`. Lights `demand` node. Labels: Referrals / Local Search / Paid Ads / Social / Cold Outreach / "Not sure / word of mouth".
- **Q3 Stage** → `state.revenue` (1-7 int) + `state.revenueLabel` (string). Snap buttons. Labels by value: 1 Just starting · 2 Early-stage · 3 Growing local team · 4 Established service team · 5 Scaling up · 6 Expansion mode · 7 Market leader. Lights `stage` rail.
- **Q4 Owner-Time** → `state.opsRatio` (int % on ops). Buttons 90/80/70/60/50/40, labeled "90% / 10%" … "40% / 60%". Prompt: "What share of YOUR week goes to running the day-to-day vs growing the business?" Lights `owner-time` rail.
- **Q6 Capacity gaps** → `state.capacityGaps` (MULTI array, OPTIONAL — Next always enabled). Values: `sales-closing, ops-dispatch, quality, hiring, tech, cash`. Prompt: "If we sent you 10x leads tomorrow, what would break first?" Labels: Sales / closing · Ops / dispatch · Delivery quality · Hiring / training · Tech / systems · Cash flow. Feeds the engine; lights no new node.

Flow order: welcome → Q1 → Q2 → Q3 → Q4 → Q5 (existing leak) → Q6 → Q7 (existing targets) → reveal.
Keep all existing nav/a11y patterns (disabled-Next until answered; Q6 Next always enabled; back buttons;
rail active/done states reflect the REAL current step — no more faked "done"; `aria-hidden`/`inert`,
focus management, live-announcer). Keep the welcome teaser map + the live map updating across steps.

### 2. Replace the reveal logic with the REAL engine (provided below — paste VERBATIM)
Delete the static `copyByNode` + `installByNode` maps and the body of `renderReveal()`. Paste the
`diagnose(state)` engine block from the bottom of this file into the inline `<script>` (inside the IIFE).
DO NOT "improve" its logic or rewrite its copy — every line is CEO-tuned and passed a 16-persona value
red-team. Then in `renderReveal()`:
- `const ins = diagnose(state);`
- `ins.headline` → the reveal H2 / diagnosis title (replaces "Your biggest leak: X").
- `ins.why_it_matters` → the diagnosis body paragraph.
- `ins.install_outcomes` (3 strings) → the three "What we'd install first" cards. The OUTCOME string is
  the card title (replaces the jargon list). Keep the numbered chip; drop or genericize any sub-line.
- `ins.derived_tag` → the "BIGGEST LEAK" tag text (plain words, NOT the raw pick).
- Light the completed-map leak node for the derived first move via this map:
  `ownerCapacity→capacity · capacity→capacity · visibility→service · demand→demand · fit→fit · speed→speed · close→close · followup→close`.
- Keep the score, today→target gap panel, email capture, and CTA exactly as they are.

### 3. Wire the VALUE-QA self-check (so QA can verify — per the RCA gates)
In `renderReveal()`, after `diagnose()`:
- `console.log('[LEAKQA]', JSON.stringify({selected_pain:ins.selected_pain, derived_constraint:ins.derived_constraint, is_reframe:ins.is_reframe, input_refs:ins.input_refs, headline:ins.headline}));`
- `console.warn` if `ins.input_refs.length < 2` (echo gate).
- `console.warn` if the reveal's visible text contains any of: "fit gate","value proof","follow-up path","demand floor","capacity signal","dispatch rules","opsratio","ops ratio","growth index","bottleneck","module"," utm "," crm ","attribution","qualifier" (jargon gate).
- Expose `window.__leakDiagnose = diagnose;` so QA can call it headless with arbitrary states.

## HARD CONSTRAINTS (brand/copy locks — do not violate)
- Triangulation System A ONLY: `#050507`, `#F0FF00`, neutral greys. Inter + JetBrains Mono. NO third color.
- Primary CTA text EXACTLY "See If We're a Fit" → href `/book`. Keep it.
- Timeline = 30 days. NEVER 90. (The "In 30 days you'll know…" engine line is correct — keep it.)
- Flesch-Kincaid ≤ 7 on owner-facing copy. The engine copy already meets this — do not rewrite it.
- No vendor names anywhere. Keep `noindex`. Keep reduced-motion handling + mobile responsive (new steps
  fit one viewport desktop; collapse cleanly on mobile, matching existing steps + the sticky mini-readout).

## VERIFY BEFORE YOU RETURN (report each)
1. `npm run build` green.
2. All 8 steps + reveal render; new steps light their map nodes; nav + a11y work; one viewport each.
3. Reveal text is the engine output (not the old echo); the 3 install cards are owner outcomes.
4. `[LEAKQA]` logs on finish with `input_refs.length>=2`; zero jargon-gate warnings.
5. Grep the file: zero remaining `copyByNode`/`installByNode`; zero "Fit gate"/"Value proof"/"Demand floor"/"Dispatch rules" strings.
6. `window.__leakDiagnose({service:'hvac',leadSources:['referrals'],revenue:4,opsRatio:90,bottleneck:'leads',capacityGaps:['ops-dispatch'],target:{revenue:'$250K',team:'25',hours:'10'}})` returns a reframe headline about protecting the calendar (not "your leak is demand").

---

## THE ENGINE — paste this block verbatim into the inline `<script>` (inside the IIFE)

```js
// diagnose.mjs — Live Revenue Leak Map diagnostic engine (pure, client-side-ready).
// Consumes the SAME state keys as FitDiagnostic.astro (data contract preserved):
//   { service, leadSources[], revenue(1-7), revenueLabel, opsRatio(40-90),
//     bottleneck, capacityGaps[], target:{revenue,team,hours} }
// Returns an insight-contract object. NO jargon. Plain owner language. FK <= 7.
//
// DESIGN (RCA 2026-06-20 + value red-team wf_3782e437):
//  1. Do NOT echo the picked bottleneck. Read the OTHER answers, cite >=2 of them.
//  2. Do NOT tell the owner their pick was WRONG (overreach => offends a well-run shop).
//     VALIDATE the pick, then surface the hidden constraint as the thing to SEQUENCE first,
//     framed as a CONDITIONAL fork the owner self-selects ("if that's already tight... / if
//     you've got headroom..."). The owner knows their shop; we name the fork, not the verdict.
//  3. Treat capacityGaps (the "what breaks at 10x leads?" answer) as a forward-looking
//     STRESS-TEST, never as a confession that ops is broken today.
//  4. Treat high ops% as ambiguous: "you doing it" vs "you overseeing a team by choice".

const LEAK_REV_MID = [0, 5000, 17500, 37500, 75000, 175000, 375000, 750000];

const LEAK_PICK = {
  leads:      { short: 'not enough leads',       feel: 'you need more leads' },
  quality:    { short: 'too many bad-fit leads', feel: 'your leads are low quality' },
  capacity:   { short: 'not enough capacity',    feel: 'you cannot deliver more' },
  speed:      { short: 'slow response',          feel: 'you reach leads too slowly' },
  conversion: { short: 'a low close rate',       feel: 'you do not close enough' },
};

const LEAK_SOURCE_LABEL = {
  referrals: 'referrals', 'google-organic': 'local search', 'paid-ads': 'paid ads',
  social: 'social', 'cold-outreach': 'cold outreach', unsure: 'word of mouth',
};

// Owner-outcome install moves, keyed to the DERIVED first move (never raw pick, never
// internal module names). Each is a win the owner's life gains. No spend assumptions.
const LEAK_OUTCOMES = {
  visibility: [
    'Know which referral or ad actually sends you work',
    'Tie every lost deal back to where it came from',
    'Find the one source worth doubling down on',
  ],
  ownerCapacity: [
    'Get the day-to-day running without you in every job',
    'Free up your week so you can work on growth, not in it',
    'Hand off the routine without dropping the ball',
  ],
  capacity: [
    'Win more work without the schedule slipping',
    'Assign tomorrow\'s jobs without you making three calls tonight',
    'Stop turning away good work you just cannot fit in',
  ],
  demand: [
    'Turn referrals on when you need them, not just when they show up',
    'Keep the calendar full without chasing it',
    'Add one channel you control, so a slow month is a choice',
  ],
  fit: [
    'Stop quoting jobs you never wanted',
    'Spend your day on buyers who can actually pay',
    'Screen out price-shoppers before they reach your calendar',
  ],
  speed: [
    'Catch every lead the second it comes in',
    'Never lose a job to a missed call again',
    'Book the next step on autopilot, free or not',
  ],
  close: [
    'Bring serious buyers back without anyone chasing them',
    'Cover the days-2-to-7 window where deals quietly die',
    'Give good buyers an easy yes',
  ],
  followup: [
    'Follow up on every estimate before it goes cold',
    'Close the gap between "interested" and "booked"',
    'Win more of the leads you already get — no new spend',
  ],
};

// short plain label for the "biggest leak" tag (derived first move, not the raw pick)
const LEAK_DERIVED_TAG = {
  ownerCapacity: 'Your time', capacity: 'Delivery', visibility: 'Tracking',
  demand: 'Demand', fit: 'Lead fit', speed: 'Speed', close: 'Follow-up', followup: 'Follow-up',
};

// ---- formatting helpers ----
function leakParseMoney(v) {
  if (!v) return 0;
  const s = String(v).toLowerCase().replace(/[, $]/g, '');
  const m = s.match(/([0-9]+(?:\.[0-9]+)?)\s*(k|m)?/);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  if (m[2] === 'k') n *= 1000;
  if (m[2] === 'm') n *= 1000000;
  return Math.round(n);
}
function leakFmtMoney(v) {
  const n = leakParseMoney(v);
  if (!n) return '';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(n % 1000000 ? 1 : 0) + 'M';
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'K';
  return '$' + n;
}
function leakParseHours(v) {
  if (!v) return 0;
  const m = String(v).match(/[0-9]+/);
  return m ? parseInt(m[0], 10) : 0;
}

// ---- the engine ----
function diagnose(state) {
  const s = state || {};
  const pick = s.bottleneck && LEAK_PICK[s.bottleneck] ? s.bottleneck : 'leads';
  const pickShort = LEAK_PICK[pick].short;

  const ops = Number(s.opsRatio) || 0;            // % of owner week on day-to-day
  const buried = ops >= 80;
  const hasOps = ops > 0;

  const src = Array.isArray(s.leadSources) ? s.leadSources : [];
  const untracked = src.indexOf('unsure') >= 0;
  const realSrc = src.filter(x => x !== 'unsure');
  const referralLean = src.indexOf('referrals') >= 0 && realSrc.length <= 1;
  const broadTop = src.indexOf('paid-ads') >= 0 || src.indexOf('social') >= 0;
  const namedSrc = realSrc.map(x => LEAK_SOURCE_LABEL[x]).filter(Boolean);
  const channelCount = realSrc.length;

  const gaps = Array.isArray(s.capacityGaps) ? s.capacityGaps : [];
  const capFlag = ['ops-dispatch', 'hiring', 'quality'].some(g => gaps.indexOf(g) >= 0);
  const salesFlag = gaps.indexOf('sales-closing') >= 0;

  const targetRev = leakParseMoney(s.target && s.target.revenue);
  const targetHours = leakParseHours(s.target && s.target.hours);

  // plain phrase builders
  const opsPhrase = hasOps ? ops + '% of your week on the day-to-day' : 'most of your week on the day-to-day';
  const targetPhrase = targetRev ? leakFmtMoney(s.target.revenue) + '/mo' : '';
  const hoursPhrase = targetHours ? targetHours + ' hours a week' : '';
  const gapNames = gaps.map(g => ({
    'sales-closing': 'closing', 'ops-dispatch': 'scheduling', quality: 'delivery quality',
    hiring: 'hiring', tech: 'your systems', cash: 'cash flow',
  })[g]).filter(Boolean);
  const gapPhrase = gapNames.slice(0, 2).join(' and ');
  const srcPhrase = namedSrc.length ? namedSrc.join(' and ') : 'referrals and word of mouth';

  let derived, headline, why, refs, reframe;

  // ===================== LEAK_PICK = LEADS =====================
  if (pick === 'leads') {
    if (buried && capFlag) {
      derived = 'ownerCapacity'; reframe = true;
      headline = 'More leads is the right instinct — lock one thing first so they don\'t slip away.';
      why = 'You\'re spending ' + opsPhrase + ', and you flagged ' + gapPhrase + ' as what would buckle if leads doubled. ' +
            'Here\'s the fork: if that\'s already tight, more leads turn into slow callbacks and jobs that slip — and a missed callback costs you the next referral. ' +
            'If you\'ve got real headroom, go get them. If you\'re not sure, the first move is getting the work to run without you in the middle of every job — so every new lead becomes booked work, not one more thing to chase.';
      refs = ['opsRatio', 'capacityGaps'];
    } else if (capFlag) {
      derived = 'capacity'; reframe = true;
      headline = 'More leads is the right call — just build the catch first.';
      why = 'You told us ' + gapPhrase + ' is what would buckle if we sent you 10x leads tomorrow. That\'s an honest read — most owners haven\'t pressure-tested it. ' +
            'So before you floor the gas: if that part has headroom today, go. If it\'s already tight, a week of extra leads becomes slow callbacks and slipping jobs. ' +
            'The first move is making sure the work can absorb the volume — then more leads fill a calendar that can actually hold them.';
      refs = ['capacityGaps', 'bottleneck'];
    } else if (untracked && referralLean) {
      derived = 'visibility'; reframe = true;
      headline = 'Before more leads — can you name which source sends you the good jobs?';
      why = 'Your leads come mostly from ' + srcPhrase + '. If you can already name the one or two people who send you your best work, great — you know exactly where to push, and more leads is the right call. ' +
            'If you can\'t tie each job back to a source yet, that\'s the gap to close first: a simple "how did you hear about us?" on every call. ' +
            'In 30 days you\'ll know whether word of mouth is one person or ten — and which source is worth doubling.';
      refs = ['leadSources', 'bottleneck'];
    } else if (buried) {
      derived = 'ownerCapacity'; reframe = true;
      headline = 'At ' + ops + '% in the work, more leads have nowhere to land.';
      why = 'You\'re spending ' + opsPhrase + '. More leads sounds like the goal — but at that load they pile onto a week with no room, and become slow callbacks instead of booked jobs. ' +
            'The first move that actually unlocks growth is getting a few hours back: take the routine work off your plate first, then every new lead turns into work, not stress. ' +
            'If you\'ve already got people running the day-to-day, skip ahead — adding one channel you control is your move.';
      refs = ['opsRatio', 'bottleneck'];
    } else if (referralLean) {
      derived = 'demand'; reframe = true;
      headline = 'More leads is fair — the real question is whether you can turn them on when you need them.';
      why = 'You lean on referrals' + (targetPhrase ? ', and you\'re aiming for ' + targetPhrase : '') + '. When they\'re flowing, life is good. ' +
            'The gut-check: on a slow month, can you make them show up? If your pipeline feels feast-or-famine, the first move isn\'t working harder for referrals — it\'s adding one channel you control, so a quiet week is a choice, not a surprise. ' +
            'If referrals already pour in faster than you can quote them, ignore the channel talk — your real ceiling is throughput, and that\'s the fix.';
      refs = ['leadSources', targetPhrase ? 'target' : 'bottleneck'];
    } else {
      derived = 'followup'; reframe = false;
      headline = 'You\'ve got the channels — the gap most owners miss is the 48 hours after a lead comes in.';
      why = 'You\'re running ' + (channelCount || 'a few') + ' channels' + (targetPhrase ? ' toward ' + targetPhrase : '') + ', so this isn\'t about adding more sources. ' +
            'The leak that hides at your size is the window: an estimate request that goes cold before anyone follows up. ' +
            'The one move that compounds on the traffic you already have is an automatic follow-up that closes that window — no new spend, no chasing.';
      refs = ['leadSources', targetPhrase ? 'target' : 'opsRatio'];
    }
  }

  // ===================== LEAK_PICK = QUALITY (fit) =====================
  else if (pick === 'quality') {
    if (salesFlag || buried) {
      derived = 'fit'; reframe = false;
      headline = 'Your read is right — it\'s a fit problem, not a volume one. The fix buys back time too.';
      why = 'Bad-fit leads don\'t just lower quality — they eat the hours of whoever does your quoting. ' +
            (salesFlag ? 'You flagged closing as a soft spot, which is the tell: when volume picks up, the wrong leads will drag your close rate down with it. ' : '') +
            'The first move before more leads is a simple step that screens out non-buyers before they ever get a quote — so the leads that reach you are already half-sold.';
      refs = [salesFlag ? 'capacityGaps' : 'opsRatio', 'bottleneck'];
    } else if (broadTop) {
      derived = 'fit'; reframe = false;
      headline = 'Your read is right — it\'s a fit problem. Here\'s where it starts.';
      why = 'You\'re running ' + namedSrc.slice(0, 2).join(' and ') + ', which reaches a wide crowd. If there\'s already a step that screens people before your team quotes them, the leak is more likely your offer or who the ads target. ' +
            'If there isn\'t, that\'s the first fix: a front-door filter that sorts serious buyers from price-shoppers before they eat your quoting time. Either way, more leads on top just brings more of the wrong ones — the win is upstream of the quote.';
      refs = ['leadSources', 'bottleneck'];
    } else {
      derived = 'fit'; reframe = false;
      headline = 'Your read is right — it\'s quality, not volume. The fix is upstream of the quote.';
      why = 'Plenty of leads reach you; the wrong ones eat the calendar' + (targetPhrase ? ' while you push toward ' + targetPhrase : '') + '. ' +
            'Bad-fit usually clusters in one segment — a job type or customer that bleeds quote time. The first move is filtering by fit before the call, so the quotes you give go to people ready to buy.';
      refs = ['bottleneck', targetPhrase ? 'target' : 'leadSources'];
    }
  }

  // ===================== LEAK_PICK = CAPACITY =====================
  else if (pick === 'capacity') {
    derived = buried ? 'ownerCapacity' : 'capacity'; reframe = false;
    if (targetPhrase || hoursPhrase) {
      headline = 'You picked capacity — and your goal makes the case for you.';
      why = 'You want ' + (targetPhrase || 'to grow') + (hoursPhrase ? ' while dropping to ' + hoursPhrase : '') +
            ', and you\'re at ' + opsPhrase + (gapPhrase ? ' with ' + gapPhrase + ' under strain' : '') + '. ' +
            'Here\'s the fork that sets your first move: if that time is you personally doing the work, more hours isn\'t an option — the path is the work running without you. ' +
            'If it\'s you overseeing a team by choice, the ceiling is crew or equipment — and the move is adding that, not stepping back. Either way, capacity comes before volume — leads added first just turn wins into losses.';
      refs = ['target', 'opsRatio'];
    } else {
      headline = 'You picked capacity. The first lever depends on one thing.';
      why = 'You\'re at ' + opsPhrase + (gapPhrase ? ', and ' + gapPhrase + ' is the pressure point' : '') + '. ' +
            'The question that sets your first move: is the ceiling your hours, your crew, or your equipment? ' +
            'If it\'s you in every job, the lever is a system that assigns tomorrow\'s work without you making three calls tonight. If you\'ve got a foreman, it\'s more crew or another truck — not delegation. Either way, that\'s the thing to lock before adding a single new job.';
      refs = ['opsRatio', gapPhrase ? 'capacityGaps' : 'bottleneck'];
    }
  }

  // ===================== LEAK_PICK = SPEED =====================
  else if (pick === 'speed') {
    if (capFlag) {
      derived = 'capacity'; reframe = true;
      headline = 'Speed wins the booking — just make sure the booking can hold.';
      why = 'You flagged ' + gapPhrase + ' as what would buckle under more volume. If your ops are solid today, faster response is exactly the right lever — go. ' +
            'If that part\'s already tight, answering faster just books work the team can\'t deliver on time. The move is to build the catch first, so speed fills a calendar that can actually hold it.';
      refs = ['capacityGaps', 'bottleneck'];
    } else if (buried) {
      derived = 'speed'; reframe = false;
      headline = 'Speed is the right lever — the gap is the first five minutes.';
      why = 'You\'re at ' + opsPhrase + '. If you\'re mostly solo, a lead that calls while you\'re on a job waits till tonight — or never. ' +
            'If you\'ve got a team, the first five minutes after a call may still slip before someone picks it up. Either way it\'s not a "you\'re slow" problem — it\'s that nothing catches the lead the second it comes in. The first move is an instant first reply that books the next step on its own.';
      refs = ['opsRatio', 'bottleneck'];
    } else {
      derived = 'speed'; reframe = false;
      headline = 'Response speed is the cheapest win you\'ve got.';
      why = 'Leads come in and cool off before the first callback' + (targetPhrase ? ', and you\'re pushing toward ' + targetPhrase : '') + '. ' +
            'Speed is the highest-leverage fix in your funnel — but only if the fast reply routes to a real next step, not just a faster you. The first move is an instant first-touch that books the call on its own.';
      refs = ['bottleneck', targetPhrase ? 'target' : 'opsRatio'];
    }
  }

  // ===================== LEAK_PICK = CONVERSION (close) =====================
  else {
    if (untracked) {
      derived = 'visibility'; reframe = true;
      headline = 'Your pick might be right — here\'s the one data point that confirms it.';
      why = 'Your leads come mostly from ' + srcPhrase + '. If you can tie each lost deal back to who sent it, you\'ll probably see "low close rate" is really one or two sources sending weak-fit buyers. ' +
            'If you can\'t see close rate by source yet, that\'s the first thing to set — then you fix the real leak, not the whole thing.';
      refs = ['leadSources', 'bottleneck'];
    } else {
      derived = 'close'; reframe = false;
      headline = 'Most deals don\'t die on the call — they die in the days after.';
      why = (salesFlag ? 'You flagged closing as a soft spot. ' : '') +
            'You picked close rate' + (targetPhrase ? ', and you\'re aiming for ' + targetPhrase : '') +
            ' — but the lift usually hides in days 2 through 7, where a "no for now" gets treated like a "no forever." ' +
            'If you\'ve already got steady follow-up after every call, then it really is the call itself to work on. If it\'s manual or thin, that silent week is where the money leaks — and the fastest gain is a system that brings serious buyers back without anyone chasing.';
      refs = [salesFlag ? 'capacityGaps' : 'bottleneck', targetPhrase ? 'target' : 'opsRatio'];
    }
  }

  // de-dup refs, guarantee >= 2 distinct
  refs = Array.from(new Set(refs)).filter(Boolean);
  if (refs.length < 2) refs.push('bottleneck');
  refs = Array.from(new Set(refs));

  return {
    selected_pain: pick,
    selected_pain_label: pickShort,
    derived_constraint: derived,
    derived_tag: LEAK_DERIVED_TAG[derived],
    is_reframe: reframe,        // true = first move differs from the pick (sequenced, NOT "you're wrong")
    headline,
    why_it_matters: why,
    first_owner_outcome: LEAK_OUTCOMES[derived][0],
    install_outcomes: LEAK_OUTCOMES[derived],
    input_refs: refs,
  };
}
window.__leakDiagnose = diagnose;
```
