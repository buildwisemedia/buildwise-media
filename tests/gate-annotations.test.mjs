import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@astrojs/compiler';
import { bwmGateAnnotations, checkDir, runSelftest, stripAstroSource, stripDir } from '../scripts/bwm-gate-annotations.mjs';

const TOOL = fileURLToPath(new URL('../scripts/bwm-gate-annotations.mjs', import.meta.url));
const cli = (...args) => spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8' });

const made = [];
after(() => Promise.all(made.map((d) => rm(d, { recursive: true, force: true }))));

async function scratch() {
  const dir = await mkdtemp(join(tmpdir(), 'bwm-gate-'));
  made.push(dir);
  return dir;
}

async function bundle(files) {
  const dir = await scratch();
  for (const [rel, body] of Object.entries(files)) {
    const path = join(dir, rel);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }
  return dir;
}

test('every self-test case passes', () => {
  const lines = [];
  assert.equal(runSelftest((line) => lines.push(line)), 0, lines.join('\n'));
});

test('check fails on a leaking bundle; strip fixes it; check then passes', async () => {
  const dir = await bundle({
    'index.html': '<!doctype html>\n<!-- @r020:F1 emotion: hero -->\n<img src="a.jpg" alt="">\n<!-- keep -->\n',
    'about/index.html': '<p>x</p><!-- @build-author-exempt: QA patch into Sol V3 page -->',
    'assets/site.css': '/* @creative-exempt: sandbox */\n.a{}\n',
    'favicon.svg': '<svg><!-- @r020:identity: mark --></svg>',
  });
  assert.equal((await checkDir(dir)).findings.length, 4);
  const report = await stripDir(dir);
  assert.deepEqual(report.errors, []);
  assert.equal(report.removed_total, 4);
  assert.equal(report.files_changed, 4);
  const result = await checkDir(dir);
  assert.ok(result.ok, JSON.stringify(result.findings));
  assert.equal(await readFile(join(dir, 'index.html'), 'utf8'), '<!doctype html>\n\n<img src="a.jpg" alt="">\n<!-- keep -->\n');
});

test('a folder with no pages never passes', async () => {
  const dir = await bundle({ 'robots.txt': 'User-agent: *\n' });
  const result = await checkDir(dir);
  assert.equal(result.ok, false);
  assert.equal(result.html_files, 0);
  assert.equal(cli('check', dir).status, 1);
  assert.equal(cli('strip', dir).status, 1);
});

test('check finds a gate tag in shipped server code or a source map', async () => {
  const dir = await bundle({
    'index.html': '<p>x</p>',
    '_worker.js/chunk.mjs': 'const t = `<!-- @r020:F2 proof: chart -->`;',
    'app.js.map': '{"sourcesContent":["<!-- @sdt-exempt: table -->"]}',
  });
  const files = (await checkDir(dir)).findings.map((f) => f.file).sort();
  assert.deepEqual(files, ['_worker.js/chunk.mjs', 'app.js.map']);
});

test('a page that is not UTF-8 fails both strip and check, and is left alone', async () => {
  const dir = await bundle({ 'index.html': '<p>x</p>' });
  const latin1 = Buffer.concat([Buffer.from('<p>caf'), Buffer.from([0xe9]), Buffer.from('</p>')]);
  await writeFile(join(dir, 'latin1.html'), latin1);
  const report = await stripDir(dir);
  assert.equal(report.ok, false);
  assert.match(report.errors[0], /not UTF-8 text/);
  assert.deepEqual(await readFile(join(dir, 'latin1.html')), latin1);
  assert.deepEqual((await checkDir(dir)).findings.map((f) => f.kind), ['unreadable-encoding']);
});

test('a UTF-16 page is decoded for the check, and its gate comment is found', async () => {
  const dir = await bundle({ 'index.html': '<p>x</p>' });
  const utf16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('<!-- @r020:F1 internal --><p>y</p>', 'utf16le')]);
  await writeFile(join(dir, 'utf16.html'), utf16);
  assert.deepEqual((await checkDir(dir)).findings.map((f) => `${f.file} ${f.tag}`), ['utf16.html @r020']);
  assert.equal((await stripDir(dir)).ok, false);
});

test('published text with an unlisted extension is still checked; binaries are skipped', async () => {
  const dir = await bundle({ 'index.html': '<p>x</p>', 'leak.csv': 'a,b\n"<!-- @r020:F1 internal -->",1\n' });
  await writeFile(join(dir, 'photo.jpg'), Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x40, 0x72, 0x30, 0x32, 0x30]));
  const result = await checkDir(dir);
  assert.deepEqual(result.findings.map((f) => `${f.file} ${f.tag}`), ['leak.csv @r020']);
});

test('a symlink in the bundle fails both strip and check', async () => {
  const dir = await bundle({ 'index.html': '<p>x</p>' });
  const outside = await bundle({ 'secret.html': '<!-- @r020:F1 outside -->' });
  await symlink(join(outside, 'secret.html'), join(dir, 'linked.html'));
  assert.deepEqual((await checkDir(dir)).findings.map((f) => f.kind), ['symlink']);
  assert.match((await stripDir(dir)).errors[0], /symlink/);
});

test('CLI: receipt goes outside the bundle; exit codes hold', async () => {
  const dir = await bundle({ 'index.html': '<!-- @r020:F1 x -->\n<p>x</p>' });
  assert.equal(cli('strip', dir, '--receipt', join(dir, 'receipt.json')).status, 2);
  const receipt = join(await scratch(), 'receipt.json');
  assert.equal(cli('check', dir).status, 1);
  assert.equal(cli('strip', dir, '--receipt', receipt).status, 0);
  const saved = JSON.parse(await readFile(receipt, 'utf8'));
  assert.equal(saved.removed_total, 1);
  assert.match(saved.tool_sha256, /^[0-9a-f]{64}$/);
  assert.equal(cli('check', dir).status, 0);
  assert.equal(cli('bogus').status, 2);
});

test('Astro integration: an annotated build cannot run on Cloudflare', () => {
  assert.throws(
    () => bwmGateAnnotations({ env: { CF_PAGES: '1', BWM_KEEP_GATE_ANNOTATIONS: '1' } }),
    /never publish/,
  );
  const keep = bwmGateAnnotations({ env: { BWM_KEEP_GATE_ANNOTATIONS: '1' } });
  assert.equal(keep.hooks['astro:config:setup'], undefined);
  const publish = bwmGateAnnotations({ env: {} });
  assert.equal(typeof publish.hooks['astro:config:setup'], 'function');
});

// Frontmatter, attribute values, {expressions}, inline CSS and scripts are
// not template comments; the em dash before the real comments proves the
// parser's byte offsets are mapped back to string positions.
const ASTRO_SOURCE = [
  '---',
  "const a = '<!-- @r020:F1 frontmatter -->';",
  '---',
  '<h1>Héllo — wörld 🎉</h1>',
  '<!-- @r020:F2 proof — chart -->',
  '<p title="<!-- @proof: attribute -->">{"<!-- @proof: expression -->"}</p>',
  '{a && <div><!-- @r020:F3 inside an expression --></div>}',
  "<script>const s = '<!-- @r020:F4 script -->';</script>",
  '',
].join('\n');

test('Astro source strip removes only real template comments', async () => {
  const { text, removed } = await stripAstroSource(ASTRO_SOURCE, parse);
  assert.deepEqual(removed, ['r020', 'r020']);
  assert.equal(text, ASTRO_SOURCE
    .replace('<!-- @r020:F2 proof — chart -->', '')
    .replace('<!-- @r020:F3 inside an expression -->', ''));
});

test('Astro source plugin runs the parser path, and skips sub-requests', async () => {
  let plugins = [];
  bwmGateAnnotations({ env: {} }).hooks['astro:config:setup']({
    updateConfig: (config) => {
      plugins = config.vite.plugins;
    },
  });
  const dir = await bundle({ 'Card.astro': ASTRO_SOURCE, 'Plain.astro': '<p>no tags</p>\n' });
  const file = join(dir, 'Card.astro');
  assert.equal(await plugins[0].load(file), (await stripAstroSource(ASTRO_SOURCE, parse)).text);
  assert.equal(await plugins[0].load(join(dir, 'Plain.astro')), null);
  assert.equal(await plugins[0].load(`${file}?astro&type=style&index=0`), null);
});

test('Astro short-form comments are left alone and do not break the strip', async () => {
  for (const lead of ['<!-->', '<!--->']) {
    const { text, removed } = await stripAstroSource(`${lead}<!-- @r020:F1 hero --><p>x</p>\n`, parse);
    assert.deepEqual(removed, ['r020']);
    assert.equal(text, `${lead}<p>x</p>\n`);
  }
});

test('Astro source strip removes a comment with no space after the opener', async () => {
  const { text, removed } = await stripAstroSource('<!--@creative-exempt: Sol review--><p>Hi</p>\n', parse);
  assert.deepEqual(removed, ['creative-exempt']);
  assert.equal(text, '<p>Hi</p>\n');
});

test('Astro source strip handles extra dashes next to the delimiters', async () => {
  for (const [src, tag] of [['<!---@proof---><p>x</p>\n', 'proof'], ['<!---@r020:F1 x---><p>x</p>\n', 'r020']]) {
    const { text, removed } = await stripAstroSource(src, parse);
    assert.deepEqual(removed, [tag]);
    assert.equal(text, '<p>x</p>\n');
  }
  assert.deepEqual((await stripAstroSource('<!---@new-gate---><p>x</p>\n', parse)).unknown, ['@new-gate']);
});

test('Astro source strip reaches is:raw markup and <style> text', async () => {
  const src = '---\nexport const prerender = false;\n---\n<h1>é — x</h1>\n<div is:raw><!-- @proof: Sol internal receipt --><b>{x}</b></div>\n<style is:inline>/* @proof: css note */ .a{}</style>\n<script is:inline>const s = "<!-- @proof: script text -->";</script>\n';
  const { text, removed } = await stripAstroSource(src, parse);
  assert.deepEqual(removed, ['proof', 'proof']);
  assert.equal(text, src.replace('<!-- @proof: Sol internal receipt -->', '').replace('/* @proof: css note */', '/**/'));
});

test('Astro source strip never edits is:raw script or textarea text', async () => {
  const src = '<script is:raw>const marker = "<!-- @bwm-exp-slot: hero-headline -->";</script>\n<textarea is:raw><!-- @proof: typed --></textarea>\n';
  const { text, removed } = await stripAstroSource(src, parse);
  assert.deepEqual(removed, []);
  assert.equal(text, src);
});

test('Astro source strip cuts a nested-opener comment at its real start', async () => {
  const { text, removed } = await stripAstroSource('<!--<!-- @r020:F1 hero --><h1>Welcome</h1>\n', parse);
  assert.deepEqual(removed, ['r020']);
  assert.equal(text, '<h1>Welcome</h1>\n');
});

test('unknown @name template comments fail the Astro build unless allowed', async () => {
  const src = '<!-- @r021:F1 internal --><p>x</p>\n';
  assert.deepEqual((await stripAstroSource(src, parse)).unknown, ['@r021']);
  assert.deepEqual((await stripAstroSource(src, parse, { allowTags: ['r021'] })).unknown, []);
  const dir = await bundle({ 'Page.astro': src });
  const pluginFor = (options) => {
    let plugins = [];
    bwmGateAnnotations({ env: {}, ...options }).hooks['astro:config:setup']({
      updateConfig: (config) => {
        plugins = config.vite.plugins;
      },
    });
    return plugins[0];
  };
  await assert.rejects(pluginFor({}).load(join(dir, 'Page.astro')), /unknown tags \(@r021\)/);
  assert.equal(await pluginFor({ allowTags: ['r021'] }).load(join(dir, 'Page.astro')), null);
});

test('Astro source plugin strips raw HTML imports before they reach server code', async () => {
  let plugins = [];
  bwmGateAnnotations({ env: {} }).hooks['astro:config:setup']({
    updateConfig: (config) => {
      plugins = config.vite.plugins;
    },
  });
  const dir = await bundle({ 'page.html': '<main>\n<!--\n@r020:F1 internal Sol review\n-->\n<p>x</p>\n</main>\n', 'plain.html': '<p>x</p>' });
  assert.equal(await plugins[0].load(`${join(dir, 'page.html')}?raw`), `export default ${JSON.stringify('<main>\n\n<p>x</p>\n</main>\n')}`);
  assert.equal(await plugins[0].load(`${join(dir, 'plain.html')}?raw`), null);
  assert.equal(await plugins[0].load(`${join(dir, 'page.html')}?url`), null);
});

test('check treats _worker.js as server code: slot markers there fail, in browser assets they pass', async () => {
  const marker = "const hero = '<!-- @bwm-exp-slot: hero-headline -->';";
  const dir = await bundle({ 'index.html': '<p>x</p>', '_worker.js/chunk.mjs': marker, 'assets/app.js': marker });
  assert.deepEqual((await checkDir(dir)).findings.map((f) => `${f.file} ${f.tag}`), ['_worker.js/chunk.mjs @bwm-exp-slot']);
});

test('check finds an unknown @name comment left in server code', async () => {
  const dir = await bundle({ 'index.html': '<p>x</p>', '_worker.js/chunk.mjs': 'const t = `<!-- @r021:F1 internal --><p>x</p>`;' });
  assert.deepEqual((await checkDir(dir)).findings.map((f) => `${f.file} ${f.tag} ${f.kind}`), ['_worker.js/chunk.mjs @r021 unknown-pragma']);
});

test('Astro source strip refuses a comment position it cannot verify', async () => {
  const fakeParse = async () => ({
    ast: { type: 'root', children: [{ type: 'comment', value: ' @r020:F1 x ', position: { start: { offset: 3 }, end: { offset: 9 } } }] },
  });
  await assert.rejects(stripAstroSource('<p>hi</p><!-- @r020:F1 x -->', fakeParse), /could not place an Astro comment/);
});
