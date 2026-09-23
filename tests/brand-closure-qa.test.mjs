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
const BOB_ACTION = '<a class="header-cta" href="/#work">See Bob at Work</a>';
const NOINDEX = '<meta name="robots" content="noindex,nofollow">';
const page = ({ head = '', body = '' } = {}) =>
  `<!doctype html><html lang="en"><head><title>T</title><meta name="description" content="D">${head}</head><body><h1>H</h1>${body}</body></html>`;

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
  for (const route of BOB_ROUTES) write(route === '/' ? 'index.html' : `${route.slice(1)}/index.html`, page({ head: BOB_SHEET, body: BOB_ACTION }));
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

test('a Bob page without "See Bob at Work" fails', () => {
  assert.deepEqual(qa({ 'contact/index.html': page({ head: BOB_SHEET }) }).failures, ['locked-cta-present dist/contact/index.html']);
});

test('legacy pages still need the fit CTA', () => {
  assert.deepEqual(qa({ 'playbook/x/index.html': page() }).failures, ['locked-cta-present dist/playbook/x/index.html']);
  assert.deepEqual(qa({ 'playbook/x/index.html': page({ body: '<a href="/contact">See If We’re a Fit</a>' }) }).failures, []);
});

test('an unlisted page cannot switch to the Bob rules by loading the Bob stylesheet', () => {
  assert.deepEqual(qa({ 'industries/x/index.html': page({ head: BOB_SHEET, body: BOB_ACTION }) }).failures, [
    'bob-surface-registry dist/industries/x/index.html',
    'locked-cta-present dist/industries/x/index.html',
  ]);
});

test('a listed Bob route must load the Bob stylesheet and must exist', () => {
  assert.deepEqual(qa({ 'terms/index.html': page({ body: BOB_ACTION }) }).failures, ['bob-surface-registry dist/terms/index.html']);
  assert.deepEqual(qa({ 'luncheon/index.html': null }).failures, ['bob-surface-registry dist']);
});

test('sample demos need noindex and a visible sample label instead of a CTA', () => {
  assert.deepEqual(qa({
    'bob/proof/a.html': page({ head: NOINDEX, body: '<p>Sample data</p>' }),
    'bob/proof/b.html': page({ head: '<meta content="noindex" name="robots">', body: '<p>Example case · Sample data</p>' }),
  }).failures, []);
  assert.deepEqual(qa({ 'bob/proof/c.html': page({ body: '<noscript><p>Sample data</p></noscript>' }) }).failures, [
    'bob-proof-noindex dist/bob/proof/c.html',
    'bob-proof-sample-label dist/bob/proof/c.html',
  ]);
});

test('sample demos still need one H1 and a meta description', () => {
  const noDescription = page({ head: NOINDEX, body: '<p>Sample data</p>' }).replace('<meta name="description" content="D">', '');
  assert.deepEqual(qa({ 'bob/proof/d.html': noDescription.replace('<h1>H</h1>', '<h1>A</h1><h1>B</h1>') }).failures, [
    'single-h1 dist/bob/proof/d.html',
    'meta-description dist/bob/proof/d.html',
  ]);
});

test('linked and embedded files must exist in the build', () => {
  const html = page({ head: `${BOB_SHEET}<link rel="stylesheet" href="/bob/missing.css">`, body: `${BOB_ACTION}<iframe data-src="/bob/proof/gone.html"></iframe><img src="/img/none.webp" alt="">` });
  assert.deepEqual(qa({ 'index.html': html }).failures, Array(3).fill('static-asset-link dist/index.html'));
});

test('Bob scripts and styles outside dist/assets are scanned', () => {
  assert.deepEqual(qa({ 'bob/site.js': '// served by Cloudflare' }).failures, ['rendered-vendor-leak dist/bob/site.js']);
});
