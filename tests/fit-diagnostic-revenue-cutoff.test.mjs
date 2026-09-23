import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

// 2026-09-23 (Robert): the fit quiz never shows a visitor a revenue bar. The ICP bands are
// internal ("No revenue qualifiers on human-visible pages"). The quiz used to tell smaller
// shops "Get to $25K/mo first." and "Get to consistent $15-25K/mo", and its 12-month chart
// turned the stage a visitor picked into a made-up "$5K/mo". These checks read the
// component source and run its script against a stand-in page, so they run before a build.
// A visitor's own 12-month target may be echoed back; no other monthly dollar figure may be.

const root = path.resolve(new URL("..", import.meta.url).pathname);
const COMPONENT = "src/components/FitDiagnostic.astro";
const source = fs.readFileSync(path.join(root, COMPONENT), "utf8");

const MONEY = String.raw`\$\s?\d[\d,]*(?:\.\d+)?\s*[KkMm]?\b`;
const RANGE_END = String.raw`\s*(?:-|–|—|to)\s*\$?\s?\d[\d,]*(?:\.\d+)?\s*[KkMm]?\b`;
const PER_MONTH = String.raw`\s*(?:\/\s*mo(?:nth)?\b|per\s+month\b|a\s+month\b|monthly\b|MRR\b)`;
const PER_YEAR = String.raw`\+?\s*(?:\/\s*y(?:ea)?r\b|per\s+year\b|a\s+year\b|annually\b|ARR\b)`;

// "$25K/mo", "$15-25K/mo", "$25,000 a month".
const PER_MONTH_MONEY = new RegExp(`${MONEY}(?:${RANGE_END})?${PER_MONTH}`, "gi");
// Revenue bars in words, symbols or bands. No visitor answer is ever echoed in these shapes.
const CUTOFFS = [
  new RegExp(String.raw`\b(?:get|gets|getting|grow|grows|growing|reach|reaches|reaching|hit|hits|hitting|pass|passes|passing|cross|crosses|crossing|clear|clears|clearing|scale|scaling)\s+(?:(?:to|past|above|beyond|over)\s+)?(?:(?:a\s+)?(?:consistent|steady|stable)\s+)?${MONEY}`, "gi"),
  new RegExp(String.raw`\b(?:below|under|over|above|beyond|past|at\s+least|more\s+than|less\s+than|minimum(?:\s+of)?|upwards\s+of)\s+${MONEY}`, "gi"),
  new RegExp(String.raw`(?:<|>|≤|≥|&lt;|&gt;)=?\s*${MONEY}`, "gi"),
  new RegExp(`${MONEY}${RANGE_END}`, "gi"),
  new RegExp(String.raw`${MONEY}\+?\s+(?:in\s+|of\s+)?(?:(?:annual|yearly|monthly|gross)\s+)?(?:revenue|sales)\b`, "gi"),
  new RegExp(`${MONEY}${PER_YEAR}`, "gi"),
  new RegExp(String.raw`\b(?:revenue|sales|doing|making|billing|grossing)\s+(?:(?:of|over|above|below|under|around|about|at\s+least)\s+)?${MONEY}`, "gi"),
];
// '$' + (n / 1000).toFixed(0) + 'K/mo': a monthly figure the page computes on its own.
const GLUED_PER_MONTH = /['"`]\s*[KkMm]\s*\/\s*mo(?:nth)?\b/g;

function toDollars(text) {
  const m = /(\d[\d,]*(?:\.\d+)?)\s*([KkMm]?)/.exec(text);
  return m ? parseFloat(m[1].replace(/,/g, "")) * ({ k: 1e3, m: 1e6 }[m[2].toLowerCase()] || 1) : NaN;
}

// The visitor's 12-month target, read the way the page reads it ("$50K", "50000", "1.5m").
function visitorAmount(raw) {
  const m = String(raw || "").toLowerCase().replace(/[, $]/g, "").match(/(\d+(?:\.\d+)?)(k|m)?/);
  return m ? parseFloat(m[1]) * ({ k: 1e3, m: 1e6 }[m[2]] || 1) : 0;
}

// The page rounds an echoed target to the nearest $1K, so allow a small gap.
const isVisitorsOwn = (amount, target) => target > 0 && Math.abs(amount - target) <= target * 0.05;

function revenueBars(text, target = 0) {
  const found = [];
  for (const [match] of text.matchAll(PER_MONTH_MONEY)) {
    const isRange = (match.match(/\d[\d,.]*/g) || []).length > 1;
    if (!isRange && isVisitorsOwn(toDollars(match), target)) continue;
    found.push(match.trim());
  }
  for (const pattern of CUTOFFS) for (const [match] of text.matchAll(pattern)) found.push(match.trim());
  return found;
}

// ---- a stand-in page: just enough DOM for the quiz script to render its result ----

const stripTags = (html) => String(html).replace(/<[^>]*>/g, " ");

class FakeElement {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.childNodes = [];
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.ownText = "";
    this.html = "";
    const classes = new Set();
    this.classList = {
      add: (...names) => names.forEach((n) => classes.add(n)),
      remove: (...names) => names.forEach((n) => classes.delete(n)),
      contains: (name) => classes.has(name),
      toggle: (name, force) => ((force ?? !classes.has(name)) ? (classes.add(name), true) : (classes.delete(name), false)),
    };
  }
  get firstChild() { return this.childNodes[0] || null; }
  appendChild(node) { this.childNodes.push(node); return node; }
  removeChild(node) { this.childNodes = this.childNodes.filter((n) => n !== node); return node; }
  get textContent() { return this.ownText + stripTags(this.html) + this.childNodes.map((n) => n.textContent).join(""); }
  set textContent(value) { this.childNodes = []; this.html = ""; this.ownText = String(value); }
  get innerHTML() { return this.html; }
  set innerHTML(value) { this.childNodes = []; this.ownText = ""; this.html = String(value); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return name in this.attributes ? this.attributes[name] : null; }
  hasAttribute(name) { return name in this.attributes; }
  removeAttribute(name) { delete this.attributes[name]; }
  addEventListener() {}
  querySelector() { return null; }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; }
  focus() {}
}

// Text a visitor can see or hear: text, markup set as HTML, placeholders and labels.
function visibleText(node) {
  if (!(node instanceof FakeElement)) return String(node.textContent ?? "");
  const parts = [node.ownText, stripTags(node.html)];
  for (const name of ["aria-label", "title", "alt", "placeholder"]) if (node.attributes[name]) parts.push(node.attributes[name]);
  if (typeof node.placeholder === "string") parts.push(node.placeholder);
  for (const child of node.childNodes) parts.push(visibleText(child));
  return parts.join(" ");
}

let compiled;
function quizScript() {
  if (!compiled) {
    const blocks = [...source.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)];
    assert.equal(blocks.length, 1, `expected one inline script in ${COMPONENT}`);
    // Hand the tests the pieces they drive. The page itself never reads this.
    compiled = new vm.Script(`${blocks[0][1]}\n;globalThis.__fitTest = { state, computeAndReveal };`, { filename: COMPONENT });
  }
  return compiled;
}

// fetch never settles by default, so the result shows only what the quiz renders itself.
function openPage(fetchImpl = () => new Promise(() => {})) {
  const byId = new Map();
  const make = (tag) => new FakeElement(tag);
  const document = {
    body: make("body"),
    cookie: "",
    referrer: "",
    visibilityState: "visible",
    getElementById(id) {
      if (!byId.has(id)) byId.set(id, make("div"));
      return byId.get(id);
    },
    querySelector: () => make("div"),
    querySelectorAll: () => [],
    createElement: make,
    createElementNS: (_ns, tag) => make(tag),
    createTextNode: (text) => ({ textContent: String(text) }),
    addEventListener() {},
  };
  const page = {
    document,
    fetch: fetchImpl,
    dataLayer: [],
    scrollY: 0,
    console: { log() {}, info() {}, warn() {}, error() {} },
    location: { pathname: "/go/wave", href: "https://buildwisemedia.com/go/wave" },
    sessionStorage: { getItem: () => null, setItem() {} },
    requestAnimationFrame: () => 0,
    setTimeout: () => 0,
    scrollTo() {},
    addEventListener() {},
  };
  page.window = page;
  vm.createContext(page);
  quizScript().runInContext(page);
  return { quiz: page.__fitTest, byId };
}

// The stage slider's own answers, straight from the markup.
const STAGES = [...source.matchAll(/data-value="(\d)" data-label="([^"]+)"/g)].map(([, value, label]) => ({ value: Number(value), label }));

function answer(quiz, a) {
  Object.assign(quiz.state, {
    service: "hvac",
    leadSources: [...a.sources],
    revenue: a.stage.value,
    revenueLabel: a.stage.label,
    opsRatio: a.ops,
    bottleneck: a.bottleneck || "leads",
    capacityGaps: [...(a.gaps || [])],
    target: { revenue: a.target || "", team: "6", hours: "20" },
  });
  quiz.computeAndReveal();
}

const resultText = (byId) => [...byId.values()].map(visibleText).join("\n");

// The chart is drawn from a hidden stage-to-revenue table, so it may only print the
// visitor's own target, never a figure the page made up.
function chartMoney(byId, target) {
  const chart = byId.get("projection-svg");
  assert.ok(chart, "the 12-month chart was not drawn");
  return [...visibleText(chart).matchAll(new RegExp(MONEY, "g"))]
    .map(([m]) => m.trim())
    .filter((m) => !isVisitorsOwn(toDollars(m), target))
    .map((m) => `chart shows ${m}`);
}

// ---- tests ----

test("the quiz source has no monthly dollar bar or revenue cutoff", () => {
  const offenders = [];
  let inStyle = false;
  source.split("\n").forEach((line, i) => {
    if (/<style\b/.test(line)) inStyle = true;
    if (!inStyle) {
      for (const bar of revenueBars(line)) offenders.push(`${COMPONENT}:${i + 1}: ${bar}`);
      for (const [glued] of line.matchAll(GLUED_PER_MONTH)) offenders.push(`${COMPONENT}:${i + 1}: builds a monthly dollar figure (${glued})`);
    }
    if (/<\/style>/.test(line)) inStyle = false;
  });
  assert.deepEqual(offenders, []);
});

test("no result shows a revenue bar, for every stage and answer mix", () => {
  assert.equal(STAGES.length, 7, "expected the 7 operation stages on the slider");
  const { quiz, byId } = openPage();
  const offenders = new Map();
  const verdicts = new Set();
  let smallShopMaybe = 0;
  const SOURCES = [["referrals"], ["google-organic"], ["referrals", "google-organic"], ["paid-ads", "social"], ["unsure"], ["referrals", "unsure"], ["cold-outreach"]];
  for (const stage of STAGES) {
    for (const sources of SOURCES) {
      for (const ops of [90, 80, 60, 40]) {
        for (const bottleneck of ["leads", "quality", "capacity", "speed", "conversion"]) {
          for (const gaps of [[], ["ops-dispatch", "sales-closing"]]) {
            for (const target of ["", "$50K", "1.5m"]) {
              answer(quiz, { stage, sources, ops, bottleneck, gaps, target });
              const verdict = byId.get("verdict-card").dataset.verdict;
              verdicts.add(verdict);
              if (stage.value < 3 && verdict === "maybe") smallShopMaybe += 1;
              const own = visitorAmount(target);
              for (const bar of [...revenueBars(resultText(byId), own), ...chartMoney(byId, own)]) {
                if (!offenders.has(bar)) offenders.set(bar, `${stage.label} · ${verdict} · target "${target}"`);
              }
            }
          }
        }
      }
    }
  }
  // The grid has to reach every verdict, including the small-shop "maybe" list.
  assert.deepEqual([...verdicts].sort(), ["fit", "maybe", "not-yet"]);
  assert.ok(smallShopMaybe > 0, "no answer mix reached the small-shop 'maybe' result");
  assert.deepEqual([...offenders].map(([bar, where]) => `${bar}  (${where})`), []);
});

test("a smaller business still gets a practical step of its own", () => {
  const { quiz, byId } = openPage();
  const base = { sources: ["referrals", "google-organic"], ops: 60, bottleneck: "leads" };
  const steps = (stage) => {
    answer(quiz, { ...base, stage });
    assert.equal(byId.get("verdict-card").dataset.verdict, "maybe", `${stage.label} should land on "maybe"`);
    return byId.get("path-list").childNodes.map((item) => visibleText(item.childNodes.at(-1)).replace(/\s+/g, " ").trim());
  };
  const growing = steps(STAGES[2]);
  for (const stage of STAGES.slice(0, 2)) {
    const small = steps(stage);
    assert.equal(small.length, 3, `${stage.label} should get three steps`);
    const own = small.filter((step) => !growing.includes(step));
    assert.equal(own.length, 1, `${stage.label} should get one step a growing shop doesn't: ${JSON.stringify(small)}`);
    assert.deepEqual(revenueBars(own[0]), [], `${stage.label}: ${own[0]}`);
    assert.doesNotMatch(own[0], /\$\s?\d/, `${stage.label}: ${own[0]}`);
  }
});

test("the page stays clean after the server's verdict comes back", async () => {
  const reply = (body) => async () => ({ ok: true, json: async () => body });
  const cases = [
    ["FIT", reply({ verdict: "FIT", growth_index: 72 }), /FIT · 72/],
    ["MAYBE", reply({ verdict: "MAYBE", growth_index: 48 }), /MAYBE · 48/],
    ["NO", reply({ verdict: "NO", growth_index: 22 }), /NOT YET · 22/],
    ["offline", async () => { throw new Error("offline"); }, /snag/i],
  ];
  for (const [name, fetchImpl, status] of cases) {
    const { quiz, byId } = openPage(fetchImpl);
    answer(quiz, { stage: STAGES[0], sources: ["referrals", "google-organic"], ops: 60 });
    await new Promise((resolve) => setImmediate(resolve));
    assert.match(visibleText(byId.get("verdict-status")), status, `${name}: the server reply did not render`);
    assert.deepEqual([...revenueBars(resultText(byId)), ...chartMoney(byId, 0)], [], name);
  }
});

test("the guard catches the retired revenue bars", () => {
  const retired = [
    "Get to $25K/mo first. Below that, foundational distribution matters more than a system.",
    "Get to consistent $15-25K/mo via referrals + 1 channel.",
    "$5K/mo",
    "Revenue range < $10K",
    "&lt; $10K",
    "$10–25K",
    "Built for owners doing $3M-$8M in revenue.",
    "Come back once you clear $300K a year.",
  ];
  for (const line of retired) assert.notDeepEqual(revenueBars(line), [], `guard missed: ${line}`);
  const allowed = [
    "Owner-led custom builder we work with: $300K → $10M+ after the system took over the follow-through.",
    "In 12 months, I want to be doing $ ___ in monthly revenue",
    "Reclaim 8 hours/week for growth work.",
    "Above 65 = system-ready. Below 30 = foundations need work first.",
    "Most operators close these in 60-90 days.",
  ];
  for (const line of allowed) assert.deepEqual(revenueBars(line), [], `guard flagged: ${line}`);
  const echo = "You lean on referrals, and you're aiming for $50K/mo.";
  assert.deepEqual(revenueBars(echo, visitorAmount("$50K")), [], "the visitor's own target is theirs to see");
  assert.notDeepEqual(revenueBars(echo), [], "a monthly figure the visitor never typed is a bar");
  assert.notDeepEqual(revenueBars("$5K/mo", visitorAmount("$50K")), [], "only the visitor's own number is allowed");
  assert.equal([..."svg.appendChild(mkText(x, y, '$' + (end / 1000).toFixed(0) + 'K/mo'));".matchAll(GLUED_PER_MONTH)].length, 1);
});
