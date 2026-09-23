import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

// 2026-09-23 (Robert): the $15K Ascend Pilot is the only public price. /pricing is
// retired (301 to /#pilot), and Ascend, Pro and add-on fees are set in the written
// agreement. These checks read the source Astro publishes, so they run before a build.

const root = path.resolve(new URL("..", import.meta.url).pathname);
const canonical = JSON.parse(fs.readFileSync(path.join(root, "src/data/canonical.json"), "utf8"));
const pilotPrice = canonical.products.pilot.price.oneshot;

// Every price in The Book outside the Pilot, tagged monthly or one-time.
function nonPilotPrices(node, keyPath = "", out = []) {
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) nonPilotPrices(value, `${keyPath}.${key}`, out);
  } else if (typeof node === "number" && node >= 100 && /price|premium|monthly/i.test(keyPath) && !keyPath.startsWith(".pilot.")) {
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

const prices = nonPilotPrices(canonical.products);
const forbidden = [];
for (const { amount, monthly } of prices) {
  const forms = moneyForms(amount);
  if (monthly) {
    forbidden.push(new RegExp(`${NOT_A_RANGE}\\$\\s?(?:${forms})${PER_MONTH}`, "i"));
  } else if (amount === pilotPrice) {
    // Same number as the Pilot fee: only an install use is a non-Pilot price.
    forbidden.push(new RegExp(`\\$\\s?(?:${forms})\\s+install|\\+\\s*\\$\\s?(?:${forms})\\b`, "i"));
  } else {
    forbidden.push(new RegExp(`${NOT_A_RANGE}\\$\\s?(?:${forms})(?!\\d|,\\d|\\s*[–—-]|${PER_MONTH})`, "i"));
  }
}
// Reading a non-Pilot price out of canonical in page code publishes it too.
forbidden.push(/\b(?:ascend|pro|ascend_pro)\.price\b|products\.(?:ascend|ascend_pro)\.price|recurring_display|price\.recurring\b|territory_lock_add_on/);

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

test("the only public price is the Pilot", () => {
  assert.ok(prices.some((p) => p.monthly) && prices.some((p) => !p.monthly), "expected monthly and one-time non-Pilot prices in canonical");
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
