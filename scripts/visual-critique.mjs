#!/usr/bin/env node
// visual-critique — [S]-tier screenshot-critique judge (PROJ-DESIGN-INTEL-001 P2).
//
// Consumes an EXISTING brand-closure-visual-qa.mjs screenshot bundle (never
// re-runs the browser — determinism comes from scoring the pixels the sweep
// captured) and scores scripts/visual-critique-rubric.json against the
// desktop-1440x900 + mobile-390x844 captures of every route.
//
// Tier contract: Brain reference/QA-Visual-Design-Gate.md § [S]-tier protocol.
//   - ADVISORY burn-in: exit 0 regardless of verdicts unless --strict.
//   - Independent-scorer lock: flagship pages are Claude-authored, so the
//     default scorer is the GPT-family codex CLI. The Claude fallback is
//     permitted in advisory mode only and stamps independence: "violated".
//   - [S] pre-screens [J]; a clean report is input to HITL, not a substitute.
//
// Usage:
//   node scripts/visual-critique.mjs --bundle _verification/brand-closure-visual-cdp-YYYY-MM-DD
//        [--scorer codex|claude] [--routes home,pricing] [--strict]

import { execFile, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const DESKTOP_VIEWPORT = 'desktop-1440x900';
const MOBILE_VIEWPORT = 'mobile-390x844';
const MAX_IMAGE_DIM = 7600; // vision-API ceiling margin (pre-downscale playbook)

function parseArgs(argv) {
  const args = { scorer: null, routes: null, strict: false, bundle: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bundle') args.bundle = argv[++i];
    else if (a === '--scorer') args.scorer = argv[++i];
    else if (a === '--routes') args.routes = argv[++i].split(',').map((r) => r.trim());
    else if (a === '--strict') args.strict = true;
  }
  if (!args.bundle) {
    console.error('usage: visual-critique.mjs --bundle <bundle-dir> [--scorer codex|claude] [--routes a,b] [--strict]');
    process.exit(64);
  }
  return args;
}

async function which(bin) {
  try {
    await execFileAsync('which', [bin]);
    return true;
  } catch {
    return false;
  }
}

async function downscale(srcPath, destDir) {
  // Full-page captures routinely exceed vision-API pixel limits; pre-downscale
  // to MAX_IMAGE_DIM on the long axis (jpeg q80) before any scorer sees them.
  const { default: sharp } = await import('sharp');
  const meta = await sharp(srcPath).metadata();
  const dest = path.join(destDir, `${path.basename(path.dirname(path.dirname(srcPath)))}-${path.basename(path.dirname(srcPath))}.jpg`);
  let pipeline = sharp(srcPath);
  if (Math.max(meta.width || 0, meta.height || 0) > MAX_IMAGE_DIM) {
    pipeline = pipeline.resize({
      width: meta.width >= meta.height ? MAX_IMAGE_DIM : undefined,
      height: meta.height > meta.width ? MAX_IMAGE_DIM : undefined,
      fit: 'inside',
    });
  }
  await pipeline.flatten({ background: { r: 5, g: 5, b: 7 } }).jpeg({ quality: 80 }).toFile(dest);
  return dest;
}

// Some rubric items only apply to a page TYPE (e.g. paid landing pages under
// /go/*). An item with `applies_to: ["go"]` scores only routes whose slug is or
// starts with that prefix; items without `applies_to` score every route.
function itemApplies(item, route) {
  if (!item.applies_to || !item.applies_to.length) return true;
  return item.applies_to.some((prefix) => route === prefix || route.startsWith(`${prefix}-`) || route.startsWith(`${prefix}/`));
}

function buildPrompt(route, rubric, hasMobile) {
  const items = rubric.items.filter((item) => itemApplies(item, route));
  const imageKey = hasMobile
    ? 'Image 1 is the DESKTOP (1440x900 emulation) full-page screenshot; Image 2 is the MOBILE (390x844 emulation) full-page screenshot.'
    : 'Image 1 is the DESKTOP (1440x900 emulation) full-page screenshot. No mobile capture is available — score mobile-only items as "unsure".';
  return [
    `You are the [S]-tier visual-critique judge for a marketing website. You are scoring the route "${route}" of buildwisemedia.com from full-page screenshots.`,
    imageKey,
    'Score EVERY rubric item below. Each item names which viewport(s) it applies to — judge desktop items on the desktop screenshot and mobile items on the mobile screenshot.',
    'Verdict vocabulary: "pass" (the screenshot clearly satisfies the item), "fail" (the screenshot clearly violates it), "unsure" (the screenshot alone cannot decide — e.g. the item needs interaction, source documents, or the element is absent legitimately).',
    'Be specific in evidence: cite what you can SEE. Never invent content that is not visible.',
    'Reply with ONLY a JSON array (no prose, no code fence), one object per rubric item, exactly this shape:',
    '[{"item_id":"...","verdict":"pass|fail|unsure","evidence":"one sentence"}]',
    '',
    'RUBRIC:',
    JSON.stringify(items, null, 1),
  ].join('\n');
}

function extractJsonArray(text) {
  const start = text.indexOf('[');
  if (start === -1) return null;
  // walk to the matching closing bracket
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function scoreWithCodex(prompt, images, workDir) {
  const args = ['exec', '--skip-git-repo-check', '-C', workDir];
  for (const img of images) args.push('-i', img);
  // `--` ends flag parsing (the variadic -i swallows a bare positional
  // prompt), and stdin MUST be closed/ignored — with an open stdin pipe
  // codex waits on "additional input" instead of running.
  args.push('--', prompt);
  return new Promise((resolve, reject) => {
    const child = spawn('codex', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BRAIN_KEY: '', BRAIN_WRITE_KEY: '', ANTHROPIC_API_KEY: '' },
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), 240000);
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(`codex exit ${code}: ${stderr.slice(-300)}`));
    });
  });
}

async function anthropicKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const envFile = path.join(os.homedir(), '.bwm_secrets', 'anthropic.env');
  if (existsSync(envFile)) {
    const content = await fs.readFile(envFile, 'utf8');
    const line = content
      .split('\n')
      .map((l) => l.trim().replace(/^export\s+/, ''))
      .find((l) => l.startsWith('ANTHROPIC_API_KEY='));
    if (line) return line.slice('ANTHROPIC_API_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
  }
  throw new Error('ANTHROPIC_API_KEY not available for claude fallback scorer');
}

async function scoreWithClaude(prompt, images) {
  const key = await anthropicKey();
  const content = [];
  for (const img of images) {
    const data = await fs.readFile(img);
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: data.toString('base64') },
    });
  }
  content.push({ type: 'text', text: prompt });
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
    }),
  });
  if (!response.ok) throw new Error(`anthropic api ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const data = await response.json();
  return (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

async function main() {
  const args = parseArgs(process.argv);
  const bundle = path.resolve(args.bundle);
  const rubric = JSON.parse(await fs.readFile(path.resolve('scripts/visual-critique-rubric.json'), 'utf8'));

  const summaryPath = path.join(bundle, 'visual-qa-summary.json');
  if (!existsSync(summaryPath)) throw new Error(`no visual-qa-summary.json in ${bundle} — run brand-closure-visual-qa.mjs first`);
  const summary = JSON.parse(await fs.readFile(summaryPath, 'utf8'));
  let routes = summary.routes.map((r) => (r === '/' ? 'home' : r.replace(/^\//, '').replace(/\//g, '-')));
  if (args.routes) routes = routes.filter((r) => args.routes.includes(r));

  let scorer = args.scorer;
  if (!scorer) scorer = (await which('codex')) ? 'codex' : 'claude';
  const scorerFamily = scorer === 'codex' ? 'gpt' : 'claude';
  // Flagship pages are Claude-authored — Claude scoring violates the
  // independent-scorer lock and is only allowed while [S] is ADVISORY.
  const independence = scorerFamily === 'claude' ? 'violated' : 'independent';
  if (independence === 'violated') {
    console.warn('WARN: claude-family scorer on claude-authored pages — independence VIOLATED (advisory-only verdicts).');
    if (args.strict) throw new Error('--strict requires an independent (non-claude) scorer for claude-authored pages');
  }

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bwm-visual-critique-'));
  const routeReports = [];

  for (const route of routes) {
    const desktopShot = path.join(bundle, route, DESKTOP_VIEWPORT, 'full-page.png');
    const mobileShot = path.join(bundle, route, MOBILE_VIEWPORT, 'full-page.png');
    if (!existsSync(desktopShot)) {
      routeReports.push({ route, error: `missing ${desktopShot}`, verdicts: [] });
      continue;
    }
    const images = [await downscale(desktopShot, workDir)];
    const hasMobile = existsSync(mobileShot);
    if (hasMobile) images.push(await downscale(mobileShot, workDir));

    const prompt = buildPrompt(route, rubric, hasMobile);
    console.log(`[visual-critique] scoring ${route} (${images.length} images, scorer=${scorer})...`);
    let raw;
    try {
      raw = scorer === 'codex' ? await scoreWithCodex(prompt, images, workDir) : await scoreWithClaude(prompt, images);
    } catch (error) {
      routeReports.push({ route, error: `scorer failed: ${error.message.slice(0, 300)}`, verdicts: [] });
      continue;
    }
    const verdicts = extractJsonArray(raw);
    if (!verdicts) {
      routeReports.push({ route, error: 'unparseable scorer output', raw: raw.slice(0, 500), verdicts: [] });
      continue;
    }
    const validIds = new Set(rubric.items.map((item) => item.id));
    routeReports.push({
      route,
      verdicts: verdicts
        .filter((v) => validIds.has(v.item_id))
        .map((v) => ({
          item_id: v.item_id,
          verdict: ['pass', 'fail', 'unsure'].includes(v.verdict) ? v.verdict : 'unsure',
          evidence: `${v.evidence || ''}`.slice(0, 280),
        })),
    });
  }

  const allVerdicts = routeReports.flatMap((r) => r.verdicts);
  const counts = {
    pass: allVerdicts.filter((v) => v.verdict === 'pass').length,
    fail: allVerdicts.filter((v) => v.verdict === 'fail').length,
    unsure: allVerdicts.filter((v) => v.verdict === 'unsure').length,
  };
  const report = {
    schema_version: rubric.schema_version,
    generated_at: new Date().toISOString(),
    bundle,
    scorer,
    scorer_family: scorerFamily,
    independence,
    posture: 'advisory',
    counts,
    routes: routeReports,
  };
  await fs.writeFile(path.join(bundle, 'visual-critique-report.json'), JSON.stringify(report, null, 2));

  const md = [
    '# [S]-Tier Visual Critique Report',
    '',
    `Bundle: ${bundle}`,
    `Scorer: ${scorer} (family: ${scorerFamily}, independence: ${independence})`,
    `Posture: ADVISORY — verdicts pre-screen the [J] human gate, they do not close it.`,
    `Totals: ${counts.pass} pass · ${counts.fail} fail · ${counts.unsure} unsure`,
    '',
    ...routeReports.flatMap((r) => {
      if (r.error) return [`## ${r.route}`, '', `ERROR: ${r.error}`, ''];
      const fails = r.verdicts.filter((v) => v.verdict === 'fail');
      const unsure = r.verdicts.filter((v) => v.verdict === 'unsure');
      return [
        `## ${r.route}`,
        '',
        `${r.verdicts.length} items scored · ${fails.length} fail · ${unsure.length} unsure`,
        ...fails.map((v) => `- FAIL **${v.item_id}** — ${v.evidence}`),
        ...unsure.map((v) => `- unsure ${v.item_id} — ${v.evidence}`),
        '',
      ];
    }),
  ].join('\n');
  await fs.writeFile(path.join(bundle, 'visual-critique-report.md'), md);
  await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});

  console.log(`[visual-critique] ${counts.pass} pass · ${counts.fail} fail · ${counts.unsure} unsure`);
  console.log(`[visual-critique] report: ${path.join(bundle, 'visual-critique-report.md')}`);
  if (args.strict && counts.fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
