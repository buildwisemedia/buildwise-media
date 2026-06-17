import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const verificationDir = path.join(root, '_verification');
const reportJson = path.join(verificationDir, 'brand-closure-qa.json');
const reportMd = path.join(verificationDir, 'brand-closure-qa.md');

const failures = [];
const warnings = [];
const passes = [];

const fail = (gate, file, detail) => failures.push({ gate, file, detail });
const warn = (gate, file, detail) => warnings.push({ gate, file, detail });
const pass = (gate, detail) => passes.push({ gate, detail });

const exists = (p) => fs.existsSync(p);
const rel = (p) => path.relative(root, p);

function walk(dir, predicate = () => true, out = []) {
  if (!exists(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full.includes(`${path.sep}_worker.js`)) continue;
      walk(full, predicate, out);
    } else if (predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function routeFromHtmlFile(file) {
  const sub = path.relative(dist, file).replaceAll(path.sep, '/');
  if (sub === 'index.html') return '/';
  return `/${sub.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`;
}

function isLegalHtml(file) {
  const route = routeFromHtmlFile(file);
  return route === '/privacy' || route === '/terms';
}

function countBodyImages(html) {
  const tags = html.match(/<img\b[^>]*>/gi) ?? [];
  return tags.filter((tag) => {
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ?? '';
    const width = tag.match(/\bwidth=["']?([0-9]+)/i)?.[1] ?? '';
    const style = tag.match(/\bstyle=["']([^"']+)["']/i)?.[1] ?? '';
    if (src.startsWith('/brand/')) return false;
    if (src.includes('facebook.com/tr')) return false;
    if (width === '1') return false;
    if (/display\s*:\s*none/i.test(style)) return false;
    return true;
  }).length;
}

function countClassedElements(html, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<[^>]+class=["'][^"']*\\b${escaped}\\b`, 'gi');
  return (html.match(pattern) ?? []).length;
}

function countBodyVisuals(html) {
  const functionalVisualClasses = [
    'pc-card-visual',
    'sovereignty__map-panel',
    'els-mini',
    'install-console',
    'dossier-preview',
    'contract-proof-board',
    'bd-proof-tile',
  ];
  return countBodyImages(html) + functionalVisualClasses
    .map((className) => countClassedElements(html, className))
    .reduce((sum, count) => sum + count, 0);
}

function htmlTitle(html) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
}

function collectJsonLd(html) {
  const blocks = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) blocks.push(match[1].trim());
  return blocks;
}

function hrefsFrom(html) {
  return [...html.matchAll(/\bhref=["']([^"']+)["']/gi)].map((m) => m[1]);
}

if (!exists(dist)) {
  fail('dist-present', 'dist', 'dist/ is missing. Run npm run build first.');
} else {
  pass('dist-present', 'dist/ exists');
}

const htmlFiles = walk(dist, (file) => file.endsWith('.html'));
const assetFiles = walk(path.join(dist, 'assets'), (file) => /\.(js|css)$/i.test(file));
const textFiles = walk(dist, (file) => /\.(txt|xml)$/i.test(file));
const renderedFiles = [...htmlFiles, ...assetFiles, ...textFiles, path.join(dist, '_redirects')].filter(exists);

const vendorPattern = /\b(GoHighLevel|GHL|Cloudflare|Supabase|Resend|Cal\.com)\b/gi;
const bannedTokenPattern = /\b(d4a955|07070c|B47EFF|b47eff|7e4ec4|6b7eff|Instrument Serif|Inter Tight|See If I Qualify)\b/g;
const staleCopyPattern = /\b(free AI Marketing Audit|Revenue Engine|Build-Right Guarantee|Outcomes Commitment Card|Lead Drought|Manual Mayhem|Owner Trap|Reactive Mode|hidden pricing|private pricing|six-layer Ascend)\b/gi;

for (const file of renderedFiles) {
  const body = read(file);
  const allowedLegal = file.endsWith('.html') && isLegalHtml(file);
  const vendorHits = [...body.matchAll(vendorPattern)].map((m) => m[0]);
  if (vendorHits.length && !allowedLegal) {
    fail('rendered-vendor-leak', rel(file), [...new Set(vendorHits)].join(', '));
  }

  const tokenHits = [...body.matchAll(bannedTokenPattern)].map((m) => m[0]);
  if (tokenHits.length) {
    fail('rendered-brand-token-lock', rel(file), [...new Set(tokenHits)].join(', '));
  }

  const staleHits = [...body.matchAll(staleCopyPattern)].map((m) => m[0]);
  if (staleHits.length) {
    fail('rendered-stale-copy', rel(file), [...new Set(staleHits)].join(', '));
  }
}

if (!failures.some((f) => f.gate.startsWith('rendered-'))) {
  pass('rendered-lock-scans', `${renderedFiles.length} rendered files scanned`);
}

const redirects = exists(path.join(dist, '_redirects')) ? read(path.join(dist, '_redirects')) : '';
const expectedRedirects = [
  ['/problem/reactive-mode', '/problem/reactive-growth'],
  ['/problem/owner-trap', '/problem/owner-bottleneck'],
  ['/problem/manual-mayhem', '/problem/leaky-revenue'],
  ['/problem/lead-drought', '/problem/invisible-market'],
];
for (const [from, to] of expectedRedirects) {
  const line = new RegExp(`^${from}\\s+${to}\\s+301$`, 'm');
  if (!line.test(redirects)) fail('legacy-problem-redirects', 'dist/_redirects', `${from} must 301 to ${to}`);
}
if (!failures.some((f) => f.gate === 'legacy-problem-redirects')) {
  pass('legacy-problem-redirects', 'legacy Poor Four routes are explicit 301 redirects');
}

const heroImageFloors = new Map([
  ['/about', 3],
  ['/audit', 3],
  ['/book', 3],
  ['/pricing', 3],
  ['/results', 3],
  ['/services/ascend', 3],
  ['/system', 3],
]);
for (const file of htmlFiles) {
  const route = routeFromHtmlFile(file);
  if (!heroImageFloors.has(route)) continue;
  const count = countBodyVisuals(read(file));
  const floor = heroImageFloors.get(route);
  if (count < floor) {
    fail('body-imagery-floor', rel(file), `${count} body visuals; needs >= ${floor}`);
  }
}
if (!failures.some((f) => f.gate === 'body-imagery-floor')) {
  pass('body-imagery-floor', 'core static routes meet body visual minimums');
}

for (const file of htmlFiles) {
  const html = read(file);
  const route = routeFromHtmlFile(file);
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  if (h1Count !== 1 && route !== '/404') fail('single-h1', rel(file), `found ${h1Count} h1 tags`);

  // Paid-LP hero word-count (post-mortem 2026-06-17): a /go/* H1 over 12 words
  // fails the 5-second clarity test (Unbounce 34k-page benchmark — shorter
  // headlines convert materially better). Source-level so it runs fast in CI.
  if (/^\/go\//.test(route)) {
    const h1Inner = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '';
    const h1Text = stripHtml(h1Inner);
    const wordCount = h1Text.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;
    if (wordCount > 12) {
      fail('paid-lp-hero-wordcount', rel(file), `H1 has ${wordCount} words (max 12 on /go/*): "${h1Text.slice(0, 96)}"`);
    }
  }

  if (!/<meta[^>]+name=["']description["']/i.test(html)) fail('meta-description', rel(file), 'missing meta description');
  if (!htmlTitle(html)) fail('title', rel(file), 'missing title');

  const ctaCount = (html.match(/See If We['’]re a Fit/g) ?? []).length;
  const pathNeedsCta = !['/privacy', '/terms', '/404', '/confirmation', '/thank-you-resource'].includes(route);
  if (pathNeedsCta && ctaCount === 0) fail('locked-cta-present', rel(file), 'missing exact CTA: See If We\'re a Fit');

  for (const block of collectJsonLd(html)) {
    try {
      JSON.parse(block);
    } catch (error) {
      fail('jsonld-parse', rel(file), error.message);
    }
  }
}
if (!failures.some((f) => ['single-h1', 'meta-description', 'title', 'locked-cta-present', 'jsonld-parse'].includes(f.gate))) {
  pass('html-basics', `${htmlFiles.length} HTML files checked`);
}
if (!failures.some((f) => f.gate === 'paid-lp-hero-wordcount')) {
  pass('paid-lp-hero-wordcount', 'paid /go/* heroes are within the 12-word clarity limit');
}

const routeSet = new Set(htmlFiles.map(routeFromHtmlFile));
routeSet.add('/');
routeSet.add('/book');
for (const file of htmlFiles) {
  const route = routeFromHtmlFile(file);
  for (const href of hrefsFrom(read(file))) {
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    if (href.startsWith('/_') || href.startsWith('/assets/') || href.startsWith('/brand/') || href.startsWith('/images/')) continue;
    const clean = href.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
    if (/\.(png|jpe?g|webp|svg|ico|txt|xml|pdf|woff2?|ttf|otf|eot)$/i.test(clean)) {
      const assetFile = path.join(dist, clean.replace(/^\//, ''));
      if (!exists(assetFile)) fail('static-asset-link', rel(file), `${route} links to missing asset ${href}`);
      continue;
    }
    if (routeSet.has(clean)) continue;
    if (expectedRedirects.some(([from]) => from === clean)) continue;
    warn('static-internal-link-unverified', rel(file), `${route} links to ${href}`);
  }
}

const llms = exists(path.join(dist, 'llms.txt')) ? read(path.join(dist, 'llms.txt')) : '';
if (llms.length < 500) fail('llms-size', 'dist/llms.txt', `${llms.length} bytes; needs >= 500`);
for (const heading of ['# ', '> ', '## About', '## Services', '## Contact']) {
  if (!llms.includes(heading)) fail('llms-schema', 'dist/llms.txt', `missing ${heading}`);
}
const robots = exists(path.join(dist, 'robots.txt')) ? read(path.join(dist, 'robots.txt')) : '';
for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'ChatGPT-User', 'anthropic-ai']) {
  if (!new RegExp(`^User-agent:\\s*${bot}$`, 'm').test(robots)) fail('robots-ai-bot', 'dist/robots.txt', `missing ${bot}`);
}
if (!failures.some((f) => f.gate.startsWith('llms') || f.gate.startsWith('robots'))) {
  pass('canonical-site-files', 'robots.txt and llms.txt meet the local contract');
}

const report = {
  generated_at: new Date().toISOString(),
  branch: process.env.GITHUB_REF_NAME ?? null,
  dist: rel(dist),
  pass_count: passes.length,
  warning_count: warnings.length,
  failure_count: failures.length,
  passes,
  warnings,
  failures,
};

fs.mkdirSync(verificationDir, { recursive: true });
fs.writeFileSync(reportJson, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(
  reportMd,
  [
    '# Brand Closure QA',
    '',
    `Generated: ${report.generated_at}`,
    '',
    `PASS: ${passes.length} | WARN: ${warnings.length} | FAIL: ${failures.length}`,
    '',
    '## Failures',
    failures.length ? failures.map((f) => `- ${f.gate} · ${f.file}: ${f.detail}`).join('\n') : '- None',
    '',
    '## Warnings',
    warnings.length ? warnings.map((w) => `- ${w.gate} · ${w.file}: ${w.detail}`).join('\n') : '- None',
    '',
    '## Passes',
    passes.map((p) => `- ${p.gate}: ${p.detail}`).join('\n'),
    '',
  ].join('\n'),
);

if (failures.length) {
  console.error(`Brand closure QA failed: ${failures.length} failure(s). See ${rel(reportMd)}`);
  process.exit(1);
}

console.log(`Brand closure QA passed with ${warnings.length} warning(s). See ${rel(reportMd)}`);
