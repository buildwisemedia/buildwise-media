import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Runs scripts/brand-closure-qa.mjs against a tiny fixture build, so each
// surface rule is shown to pass its own case AND to fail the case it guards.
const script = new URL('../scripts/brand-closure-qa.mjs', import.meta.url).pathname;
const BOB_ROUTES = ['/', '/contact', '/speaking', '/luncheon', '/privacy', '/terms'];
const BOB_SHEET = '<link rel="stylesheet" href="/bob/site.css">';
const BOB_HEADER = '<header class="site-header"><nav><a class="header-cta" href="/#work">See Bob at Work</a></nav></header><section id="work"></section>';
const NOINDEX = '<meta name="robots" content="noindex,nofollow">';
const page = ({ head = '', body = '', title = 'T', description = 'D' } = {}) =>
  `<!doctype html><html lang="en"><head><title>${title}</title><meta name="description" content="${description}">${head}</head><body><h1>H</h1>${body}</body></html>`;
const demo = (extra = {}) => page({ head: NOINDEX, title: 'Sample demo', ...extra });

function qa(files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-qa-'));
  const write = (rel, text) => {
    const file = path.join(root, 'dist', rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  };
  write('llms.txt', `# Buildwise Media\n> AI systems\n## About\n${'x'.repeat(500)}\n## Services\n## Contact\n`);
  write('robots.txt', ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'ChatGPT-User', 'anthropic-ai'].map((bot) => `User-agent: ${bot}\nAllow: /\n`).join('\n'));
  write('_redirects', [
    '/problem/reactive-mode /problem/reactive-growth 301',
    '/problem/owner-trap /problem/owner-bottleneck 301',
    '/problem/manual-mayhem /problem/leaky-revenue 301',
    '/problem/lead-drought /problem/invisible-market 301',
  ].join('\n'));
  write('bob/site.css', 'body{}');
  for (const route of BOB_ROUTES) write(route === '/' ? 'index.html' : `${route.slice(1)}/index.html`, page({ head: BOB_SHEET, body: BOB_HEADER }));
  write('bob/proof/hope-demo-r4.html', demo());
  write('bob/proof/service-demo-r43.html', demo());
  for (const [rel, text] of Object.entries(files)) {
    if (text === null) fs.rmSync(path.join(root, 'dist', rel));
    else write(rel, text);
  }
  const run = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
  const report = JSON.parse(fs.readFileSync(path.join(root, '_verification', 'brand-closure-qa.json'), 'utf8'));
  fs.rmSync(root, { recursive: true, force: true });
  return { status: run.status, failures: report.failures.map((f) => `${f.gate} ${f.file}`) };
}

test('Bob pages pass on the header action without the legacy fit CTA', () => {
  assert.deepEqual(qa(), { status: 0, failures: [] });
});

test('the header action must be visible and inside the site header', () => {
  const at = (body) => qa({ 'contact/index.html': page({ head: BOB_SHEET, body }) }).failures;
  const fail = ['locked-cta-present dist/contact/index.html'];
  assert.deepEqual(at(''), fail);
  assert.deepEqual(at('<main><a class="header-cta" href="/#work">See Bob at Work</a></main>'), fail);
  assert.deepEqual(at(BOB_HEADER.replace('class="header-cta"', 'class="header-cta" hidden')), fail);
  assert.deepEqual(at(BOB_HEADER.replace('class="header-cta"', 'class="header-cta sr-only"')), fail);
  assert.deepEqual(at(BOB_HEADER.replace('class="site-header"', 'class="site-header" style="display:none"')), fail);
  assert.deepEqual(at(BOB_HEADER.replace('<nav>', '<nav hidden>')), fail);
  assert.deepEqual(at(BOB_HEADER.replace('See Bob at Work', '<span hidden>See Bob at Work</span>')), fail);
  assert.deepEqual(at(BOB_HEADER.replace(' href="/#work"', '')), fail);
  assert.deepEqual(at(BOB_HEADER.replace('href="/#work"', 'href="#"')), fail);
  assert.deepEqual(at(BOB_HEADER.replace('href="/#work"', 'href="/wrok"')), fail);
  assert.deepEqual(at(BOB_HEADER.replace('href="/#work"', 'href="/#wrok"')), fail);
  // /speaking.html is not built (the page lives at /speaking/), so the link also fails the file check.
  assert.deepEqual(at(BOB_HEADER.replace('href="/#work"', 'href="/speaking.html"')), ['static-asset-link dist/contact/index.html', ...fail]);
  assert.deepEqual(at(BOB_HEADER.replace('class="header-cta"', 'class="header-cta" style="opacity: 0"')), fail);
  assert.deepEqual(at(BOB_HEADER.replace('class="header-cta"', 'class="header-cta" style="opacity:0!important"')), fail);
  assert.deepEqual(at(BOB_HEADER.replace('class="site-header"', 'class="site-header" style="display:none !important"')), fail);
  assert.deepEqual(at(BOB_HEADER.replace('class="header-cta"', 'class="header-cta" style="visibility: hidden!important"')), fail);
  // /#work targets the homepage: only an id or a named <a> there counts, not a form field's name.
  const homeAnchor = (anchor) => qa({ 'index.html': page({ head: BOB_SHEET, body: BOB_HEADER.replace('<section id="work"></section>', anchor) }) }).failures;
  // Every Bob page's action points at /#work, so all six fail together.
  assert.deepEqual(homeAnchor('<input name="work">').sort(), ['contact/', '', 'luncheon/', 'privacy/', 'speaking/', 'terms/']
    .map((r) => `locked-cta-present dist/${r}index.html`).sort());
  assert.deepEqual(homeAnchor('<a name="work"></a>'), []);
  assert.deepEqual(at(BOB_HEADER.replace('class="header-cta" href="/#work"', 'class=header-cta href=/#work')), []);
  assert.deepEqual(at(BOB_HEADER.replace('href="/#work"', 'href="/speaking"')), []);
  assert.deepEqual(at(BOB_HEADER.replace('See Bob at Work', '<span>See Bob</span> at Work')), []);
});

test('a listed Bob route must load the Bob stylesheet as a stylesheet, and must exist', () => {
  assert.deepEqual(qa({ 'terms/index.html': page({ body: BOB_HEADER }) }).failures, ['bob-surface-registry dist/terms/index.html']);
  for (const head of ['<link rel="preload" as="style" href="/bob/site.css">', `<noscript>${BOB_SHEET}</noscript>`, '<link rel="stylesheet" media="print" href="/bob/site.css">', '<link rel="stylesheet" media="not screen" href="/bob/site.css">']) {
    assert.deepEqual(qa({ 'terms/index.html': page({ head, body: BOB_HEADER }) }).failures, ['bob-surface-registry dist/terms/index.html'], head);
  }
  assert.deepEqual(qa({ 'luncheon/index.html': null }).failures, ['bob-surface-registry dist']);
});

test('legacy pages still need the fit CTA', () => {
  assert.deepEqual(qa({ 'playbook/x/index.html': page() }).failures, ['locked-cta-present dist/playbook/x/index.html']);
  assert.deepEqual(qa({ 'playbook/x/index.html': page({ body: '<a href="/contact">See If We’re a Fit</a>' }) }).failures, []);
});

test('the Bob stylesheet is recognized with a query string, on listed and unlisted pages', () => {
  const sheet = '<link rel="stylesheet" href="/bob/site.css?v=2">';
  assert.deepEqual(qa({ 'terms/index.html': page({ head: sheet, body: BOB_HEADER }) }).failures, []);
  assert.deepEqual(qa({ 'industries/y/index.html': page({ head: sheet, body: '<a href="/contact">See If We’re a Fit</a>' }) }).failures, ['bob-surface-registry dist/industries/y/index.html']);
});

test('every way of loading the Bob stylesheet counts on a legacy page', () => {
  const fit = '<a href="/contact">See If We’re a Fit</a>';
  for (const head of ['<link rel=stylesheet href=/bob/site.css>', '<link rel="stylesheet" media="(min-width:1px)" href="/bob/site.css">',
    '<link rel="stylesheet" href="https://buildwisemedia.com/bob/site.css">', "<link rel='stylesheet' href='/bob/site.css'>",
    '<link rel="stylesheet" media="" href="/bob/site.css">', '<link rel="stylesheet" href="/legacy.css">']) {
    const files = { 'industries/z/index.html': page({ head, body: fit }), 'legacy.css': '@import "/bob/site.css";' };
    assert.deepEqual(qa(files).failures, ['bob-surface-registry dist/industries/z/index.html'], head);
  }
});

test('an unlisted page cannot switch to the Bob rules by loading the Bob stylesheet', () => {
  assert.deepEqual(qa({ 'industries/x/index.html': page({ head: BOB_SHEET, body: BOB_HEADER }) }).failures, [
    'bob-surface-registry dist/industries/x/index.html',
    'locked-cta-present dist/industries/x/index.html',
  ]);
});

test('only approved sample demos skip the CTA, and each approved demo must exist', () => {
  assert.deepEqual(qa({ 'bob/proof/new-demo.html': demo() }).failures, [
    'bob-surface-registry dist/bob/proof/new-demo.html',
    'locked-cta-present dist/bob/proof/new-demo.html',
  ]);
  assert.deepEqual(qa({ 'bob/proof/service-demo-r43.html': null }).failures, ['bob-surface-registry dist']);
});

test('approved demos need noindex and a sample title or description', () => {
  assert.deepEqual(qa({ 'bob/proof/hope-demo-r4.html': demo({ head: '<meta content="noindex" name="robots">', title: 'Service case', description: 'A sample case' }) }).failures, []);
  assert.deepEqual(qa({ 'bob/proof/hope-demo-r4.html': page({ title: 'Inquiry workflow', body: '<p>Sample data</p>' }) }).failures, [
    'bob-proof-noindex dist/bob/proof/hope-demo-r4.html',
    'bob-proof-sample-label dist/bob/proof/hope-demo-r4.html',
  ]);
});

test('approved demos still need one H1 and a meta description', () => {
  const bad = demo().replace('<meta name="description" content="D">', '').replace('<h1>H</h1>', '<h1>A</h1><h1>B</h1>');
  assert.deepEqual(qa({ 'bob/proof/hope-demo-r4.html': bad }).failures, [
    'single-h1 dist/bob/proof/hope-demo-r4.html',
    'meta-description dist/bob/proof/hope-demo-r4.html',
  ]);
});

test('a Bob page must label each embedded demo as a sample beside the frame', () => {
  const frame = '<iframe data-src="/bob/proof/hope-demo-r4.html" title="Demo"></iframe>';
  const home = (body) => qa({ 'index.html': page({ head: BOB_SHEET, body: BOB_HEADER + body }) }).failures;
  assert.deepEqual(home(`<p>Sample data · Nothing is sent</p>${frame}`), []);
  assert.deepEqual(home(`<!-- the sample demo -->${frame}`), ['bob-proof-sample-label dist/index.html']);
  assert.deepEqual(home(`<noscript><p>Sample data</p></noscript>${frame}`), ['bob-proof-sample-label dist/index.html']);
  assert.deepEqual(home(`<span hidden>Sample</span>${frame}`), ['bob-proof-sample-label dist/index.html']);
  assert.deepEqual(home('<iframe src="https://buildwisemedia.com/bob/proof/hope-demo-r4.html"></iframe>'), ['bob-proof-sample-label dist/index.html']);
});

test('relative and dot-dot references are resolved like a browser, inside dist only', () => {
  const at = (body, extra = {}) => qa({ ...extra, 'contact/index.html': page({ head: BOB_SHEET, body: BOB_HEADER + body }) }).failures;
  assert.deepEqual(at('<script src="present.js"></script><link rel="stylesheet" href="present.css">', { 'contact/present.js': '', 'contact/present.css': '' }), []);
  assert.deepEqual(at('<script src="missing.js"></script>'), ['static-asset-link dist/contact/index.html']);
  assert.deepEqual(at('<script src="/../package.json"></script>'), ['static-asset-link dist/contact/index.html']);
});

test('scripts and images need files; only pages and frames may point at a page route', () => {
  const at = (body) => qa({ 'contact/index.html': page({ head: BOB_SHEET, body: BOB_HEADER + body }) }).failures;
  assert.deepEqual(at('<script src="/speaking/"></script>'), ['static-asset-link dist/contact/index.html']);
  assert.deepEqual(at('<img src="/speaking/" alt="">'), ['static-asset-link dist/contact/index.html']);
  assert.deepEqual(at('<p>Sample</p><iframe src="/speaking/"></iframe>'), []);
  assert.deepEqual(at('<link rel="stylesheet" href="/speaking/">'), ['static-asset-link dist/contact/index.html']);
  assert.deepEqual(at('<link rel="stylesheet" href="/assets/missing.css">'), ['static-asset-link dist/contact/index.html']);
});

test('every src, data-src and srcset candidate is checked', () => {
  const at = (body) => qa({ 'contact/index.html': page({ head: BOB_SHEET, body: BOB_HEADER + body }), 'img/a.webp': '' }).failures;
  assert.deepEqual(at('<img src="/img/a.webp" srcset="/img/a.webp 320w, /img/b.webp 640w" alt="">'), ['static-asset-link dist/contact/index.html']);
  assert.deepEqual(at('<p>Sample</p><iframe src="about:blank" data-src="/bob/proof/missing.html"></iframe>'), ['static-asset-link dist/contact/index.html']);
  assert.deepEqual(at('<img src="/img/a.webp" srcset="/img/a.webp 1x" alt="">'), []);
  assert.deepEqual(at('<video src="/img/a.webp" poster="/img/gone.webp"><track kind="captions" src="/captions/gone.vtt"></video><object data="/doc/gone.pdf"></object>'),
    Array(3).fill('static-asset-link dist/contact/index.html'));
});

test('linked and embedded files must exist as files in the build', () => {
  const html = page({
    head: `${BOB_SHEET}<link rel="stylesheet" href="/bob/missing.css">`,
    body: `${BOB_HEADER}<p>Sample</p><iframe data-src="/bob/proof/gone.html"></iframe><img src="/img/none.webp" alt=""><script src="/bob/"></script>`,
  });
  assert.deepEqual(qa({ 'index.html': html }).failures, Array(4).fill('static-asset-link dist/index.html'));
});

test('Bob scripts and styles outside dist/assets are scanned', () => {
  assert.deepEqual(qa({ 'bob/site.js': '// served by Cloudflare' }).failures, ['rendered-vendor-leak dist/bob/site.js']);
});
