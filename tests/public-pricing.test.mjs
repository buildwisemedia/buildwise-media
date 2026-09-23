import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

// Public prices are a current iteration that Robert sets; which prices show
// changes over time. Iteration 2026-09-23: only the Ascend Pilot price shows.
// /pricing is retired (301 to /#pilot) because it no longer matched current
// pricing, and other fees are set in the written agreement. To change the
// iteration, edit SHOWN_PRODUCTS (keys of canonical.products) together with the
// pages and the terms line (memory: project_bwm_pricing_visible_supersedes_hidden_lock).
// These checks read the source Astro publishes, so they run before a build.
const SHOWN_PRODUCTS = ["pilot"];

const root = path.resolve(new URL("..", import.meta.url).pathname);
const canonical = JSON.parse(fs.readFileSync(path.join(root, "src/data/canonical.json"), "utf8"));
const hiddenKeys = Object.keys(canonical.products).filter((key) => !SHOWN_PRODUCTS.includes(key));
const shownAmounts = new Set(
  SHOWN_PRODUCTS.flatMap((key) => Object.values(canonical.products[key]?.price ?? {}).filter((v) => typeof v === "number")),
);

// Every price in The Book for a product this iteration doesn't show, tagged monthly or one-time.
function hiddenPrices(node, keyPath = "", out = []) {
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) hiddenPrices(value, `${keyPath}.${key}`, out);
  } else if (typeof node === "number" && node >= 100 && /price|premium|monthly/i.test(keyPath)) {
    out.push({ amount: node, monthly: /recurring|monthly|premium/i.test(keyPath), keyPath });
  }
  return out;
}

// 7000 -> "7,000|7000|7K"; 1500 -> "1,500|1500|1.5K".
function moneyForms(amount) {
  const k = amount / 1000;
  const forms = [amount.toLocaleString("en-US"), String(amount), `${Number.isInteger(k) ? k : k.toFixed(1)}K`];
  return forms.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
}

// Market-rate anchors ("~$15K/mo", "$5K–$15K/mo") are ranges or estimates, not our fee.
const NOT_A_RANGE = "(?<![~–—-]\\s?)";
const PER_MONTH = "(?:\\s*/\\s*mo\\b|\\s*/\\s*month|\\s+per month|\\s+a month|\\s+monthly)";

const prices = hiddenKeys.flatMap((key) => hiddenPrices(canonical.products[key], `.${key}`));
const forbidden = [];
for (const { amount, monthly } of prices) {
  const forms = moneyForms(amount);
  if (monthly) {
    forbidden.push(new RegExp(`${NOT_A_RANGE}\\$\\s?(?:${forms})${PER_MONTH}`, "i"));
  } else if (shownAmounts.has(amount)) {
    // Same number as a shown price (Ascend install = Pilot fee): only an install use is hidden.
    forbidden.push(new RegExp(`\\$\\s?(?:${forms})\\s+install|\\+\\s*\\$\\s?(?:${forms})\\b`, "i"));
  } else {
    forbidden.push(new RegExp(`${NOT_A_RANGE}\\$\\s?(?:${forms})(?!\\d|,\\d|\\s*[–—-]|${PER_MONTH})`, "i"));
  }
}
// Reading a hidden product's price out of canonical in page code publishes it too
// (pages alias products, e.g. `const pro = canonical.products.ascend_pro`).
if (hiddenKeys.length) {
  const aliases = [...new Set(hiddenKeys.flatMap((key) => [key, key.split("_").pop()]))].join("|");
  forbidden.push(new RegExp(`\\b(?:${aliases})\\.(?:price|territorial_exclusivity)\\b|products\\.(?:${hiddenKeys.join("|")})\\.(?:price|territorial_exclusivity)\\b`));
}

const SCAN = ["src/pages", "src/components", "src/layouts", "src/data", "public"];
const TEXT = new Set([".astro", ".html", ".md", ".mdx", ".txt", ".ts", ".js", ".mjs", ".json"]);

function sourceFiles() {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (TEXT.has(path.extname(entry.name)) && !full.endsWith(path.join("src", "data", "canonical.json"))) files.push(full);
    }
  };
  for (const dir of SCAN) walk(path.join(root, dir));
  return files;
}

test("the retired pricing page stays gone and redirects to the Pilot section", () => {
  assert.equal(fs.existsSync(path.join(root, "src/pages/pricing.astro")), false);
  const redirects = fs.readFileSync(path.join(root, "public/_redirects"), "utf8");
  assert.match(redirects, /^\/pricing \/#pilot 301$/m);
  assert.match(redirects, /^\/pricing\/ \/#pilot 301$/m);
});

test("no published page links to /pricing", () => {
  const offenders = sourceFiles().filter((file) => {
    const text = fs.readFileSync(file, "utf8");
    return /href=["'`](?:https:\/\/buildwisemedia\.com)?\/pricing\/?["'`#?]/.test(text) || /href:\s*["'`]\/pricing\/?["'`]/.test(text);
  });
  assert.deepEqual(offenders.map((f) => path.relative(root, f)), []);
});

test("the current pricing iteration names real products", () => {
  for (const key of SHOWN_PRODUCTS) assert.ok(canonical.products[key], `unknown product in SHOWN_PRODUCTS: ${key}`);
});

test("only the current iteration's prices are published", () => {
  assert.ok(prices.some((p) => p.monthly) && prices.some((p) => !p.monthly), "expected monthly and one-time hidden prices in canonical");
  const offenders = [];
  for (const file of sourceFiles()) {
    const text = fs.readFileSync(file, "utf8");
    for (const pattern of forbidden) {
      const match = text.match(pattern);
      if (match) offenders.push(`${path.relative(root, file)}: ${match[0]}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test("the guard catches the retired price lines", () => {
  const retired = [
    "Ascend is $7K/mo + $15K install to build the engine every week.",
    "Graduates enter Ascend at $7,000/mo.",
    "Pro is $15K/mo + $25K install to build the territory fortress.",
    "Ascend Pro $15,000/mo + $25,000 install",
    "Territory Lock adds $1,500/mo.",
  ];
  for (const line of retired) {
    assert.ok(forbidden.some((p) => p.test(line)), `guard missed: ${line}`);
  }
  const allowed = [
    "Pilot is $15K for a 90-day engagement that proves one problem.",
    "Ascend Pilot is a $15,000 one-time, 90-day Pilot.",
    "An AI-first lead-ops platform runs ~$15K/mo.",
    "A marketing-data retainer costs $5K–$15K/mo.",
    "Get to $25K/mo first.",
  ];
  for (const line of allowed) {
    assert.ok(!forbidden.some((p) => p.test(line)), `guard flagged an allowed line: ${line}`);
  }
});
