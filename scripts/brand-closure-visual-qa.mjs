#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const baseUrl = process.env.BWM_QA_BASE_URL || 'http://127.0.0.1:4322';
const chromePath =
  process.env.BWM_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outRoot =
  process.env.BWM_VISUAL_QA_OUT ||
  path.resolve('_verification', `brand-closure-visual-cdp-${new Date().toISOString().slice(0, 10)}`);
const manualAcceptancePath =
  process.env.BWM_MANUAL_VISUAL_ACCEPTANCE || path.join(outRoot, 'manual-visual-review.md');
const requireManualAcceptance = process.env.BWM_REQUIRE_MANUAL_VISUAL_ACCEPTANCE === '1';

const routes = [
  { name: 'home', path: '/' },
  { name: 'book', path: '/book' },
  { name: 'system', path: '/system' },
  { name: 'pricing', path: '/pricing' },
  { name: 'services-ascend', path: '/services/ascend' },
  { name: 'results', path: '/results' },
];

const viewports = [
  { name: 'desktop-1920x1080', width: 1920, height: 1080, mobile: false },
  { name: 'desktop-1440x900', width: 1440, height: 900, mobile: false },
  { name: 'desktop-1280x800', width: 1280, height: 800, mobile: false },
  { name: 'tablet-768x1024', width: 768, height: 1024, mobile: false },
  { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) {
          pending.reject(new Error(`${pending.method}: ${message.error.message}`));
        } else {
          pending.resolve(message.result || {});
        }
        return;
      }
      this.events.push(message);
    });

    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { method, resolve, reject });
      this.ws.send(payload);
    });
  }

  async waitForEvent(method, timeoutMs = 15000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const found = this.events.find((event) => event.method === method);
      if (found) return found;
      await sleep(50);
    }
    throw new Error(`Timed out waiting for ${method}`);
  }

  close() {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.close();
  }
}

async function waitForJson(url, timeoutMs = 10000) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

async function launchChrome() {
  if (!existsSync(chromePath)) {
    throw new Error(`Chrome not found at ${chromePath}. Set BWM_CHROME_PATH to override.`);
  }

  const port = 9300 + Math.floor(Math.random() * 400);
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bwm-visual-qa-'));
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-default-browser-check',
    '--no-first-run',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ];
  const child = spawn(chromePath, args, { stdio: 'ignore' });
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  return { child, port, userDataDir };
}

async function createPage(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Unable to create Chrome target: ${response.status}`);
  const target = await response.json();
  const cdp = new CdpClient(target.webSocketDebuggerUrl);
  await cdp.connect();
  await Promise.all([
    cdp.send('Page.enable'),
    cdp.send('Runtime.enable'),
    cdp.send('Network.enable'),
    cdp.send('Log.enable'),
  ]);
  return cdp;
}

async function navigate(cdp, url) {
  const eventStart = cdp.events.length;
  await cdp.send('Page.navigate', { url });
  await cdp.waitForEvent('Page.loadEventFired', 20000).catch(() => {});
  await sleep(500);

  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    const state = await cdp.send('Runtime.evaluate', {
      expression: 'document.readyState',
      returnByValue: true,
    });
    if (state.result?.value === 'complete') break;
    await sleep(100);
  }

  return eventStart;
}

function pageAudit() {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const norm = (value) => (value || '').replace(/\s+/g, ' ').trim();
  const visible = (element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
  };
  const rectObj = (element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      bottom: Math.round(rect.bottom),
      right: Math.round(rect.right),
      absTop: Math.round(rect.top + window.scrollY),
      absBottom: Math.round(rect.bottom + window.scrollY),
    };
  };
  const lineCount = (element) => {
    const style = window.getComputedStyle(element);
    const lineHeight = Number.parseFloat(style.lineHeight);
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) return 0;
    return Math.max(1, Math.round(element.getBoundingClientRect().height / lineHeight));
  };
  const highlightRatio = (element) => {
    const textLength = norm(element.textContent).length || 1;
    const highlightLength = Array.from(element.querySelectorAll('em,mark,.accent,.highlight'))
      .map((item) => norm(item.textContent).length)
      .reduce((sum, length) => sum + length, 0);
    return highlightLength / textLength;
  };
  const intersectsVertically = (a, b) => a.absTop < b.absBottom && a.absBottom > b.absTop;

  return (async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((image) => {
      image.loading = 'eager';
    });

    const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0);
    const step = Math.max(360, Math.floor(window.innerHeight * 0.75));
    for (let y = 0; y <= scrollHeight; y += step) {
      window.scrollTo(0, y);
      await wait(60);
    }
    window.scrollTo(0, scrollHeight);
    await wait(250);
    window.scrollTo(0, 0);

    await Promise.race([
      Promise.all(
        Array.from(document.images).map((image) =>
          image.complete
            ? true
            : new Promise((resolve) => {
                image.addEventListener('load', resolve, { once: true });
                image.addEventListener('error', resolve, { once: true });
              }),
        ),
      ),
      wait(2500),
    ]);
    await wait(300);

    const h1s = Array.from(document.querySelectorAll('h1'))
      .filter(visible)
      .map((element) => norm(element.textContent));

    const interactive = Array.from(document.querySelectorAll('a,button,input,select,textarea'))
      .filter(visible)
      .map((element) => {
        const tag = element.tagName.toLowerCase();
        const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';
        const text = isInput
          ? element.value || element.getAttribute('aria-label') || element.name || element.placeholder || ''
          : element.textContent || element.getAttribute('aria-label') || '';
        return {
          tag,
          type: element.getAttribute('type') || '',
          text: norm(text),
          href: element.getAttribute('href') || '',
          ctaSource: element.getAttribute('data-cta-source') || '',
          rect: rectObj(element),
          clippedX: element.scrollWidth > element.clientWidth + 2,
          clippedY: element.scrollHeight > element.clientHeight + 2,
        };
      });

    const exactCtas = interactive.filter(
      (item) =>
        item.text.includes("See If We're a Fit") || item.href === '/book' || item.href.endsWith('/book'),
    );
    const bookActions = interactive.filter(
      (item) => item.tag === 'button' || item.tag === 'input' || item.tag === 'select',
    );
    const clippedControls = interactive
      .filter((item) => (item.clippedX || item.clippedY) && item.rect.width > 12 && item.rect.height > 12)
      .slice(0, 20);

    const images = Array.from(document.images)
      .filter(visible)
      .map((image) => ({
        alt: image.getAttribute('alt') || '',
        src: image.currentSrc || image.src || '',
        rect: rectObj(image),
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        loading: image.getAttribute('loading') || '',
      }));

    const headingQuality = { issues: [] };
    const operatingHead = document.querySelector('.operating-reframe .reframe-head .h-section');
    const operatingLedger = document.querySelector('.operating-reframe .reframe-ledger');
    const operatingProof = document.querySelector('.operating-reframe .frontier-proof-grid');
    if (operatingHead && visible(operatingHead)) {
      const text = norm(operatingHead.textContent);
      const ratio = highlightRatio(operatingHead);
      if (text.length > 72) headingQuality.issues.push(`operating heading too long (${text.length} chars)`);
      if (ratio < 0.06 || ratio > 0.42) {
        headingQuality.issues.push(`operating heading emphasis ratio ${ratio.toFixed(2)}`);
      }
      const headRect = rectObj(operatingHead);
      if (window.innerWidth > 900 && operatingLedger && visible(operatingLedger)) {
        const ledgerRect = rectObj(operatingLedger);
        if (intersectsVertically(headRect, ledgerRect) && headRect.right > ledgerRect.left - 12) {
          headingQuality.issues.push('operating heading collides with ledger divider');
        }
      }
      if (window.innerWidth > 900 && operatingProof && visible(operatingProof)) {
        const proofRect = rectObj(operatingProof);
        if (intersectsVertically(headRect, proofRect) && headRect.right > proofRect.left + 12) {
          headingQuality.issues.push('operating heading overlaps proof cards');
        }
      }
    }
    Array.from(document.querySelectorAll('.operating-reframe .reframe-card h3'))
      .filter(visible)
      .forEach((heading) => {
        const text = norm(heading.textContent);
        const ratio = highlightRatio(heading);
        if (text.length > 58 && ratio < 0.06) {
          headingQuality.issues.push(`reframe card heading lacks emphasis: "${text.slice(0, 64)}"`);
        }
      });
    Array.from(document.querySelectorAll('main h1, main h2'))
      .filter(visible)
      .forEach((heading) => {
        const text = norm(heading.textContent);
        const hasBreak = heading.querySelectorAll('br').length > 0;
        const ratio = highlightRatio(heading);
        if (text.length > 90 && lineCount(heading) >= 3 && ratio < 0.06 && !hasBreak) {
          headingQuality.issues.push(`long unbroken heading: "${text.slice(0, 72)}"`);
        }
      });

    const cropSafety = { issues: [] };
    const curveGrid = document.querySelector('.curve-grid');
    const revealNum = document.querySelector('.curve-grid .reveal-num');
    if (curveGrid && revealNum && visible(curveGrid) && visible(revealNum)) {
      const gridRect = rectObj(curveGrid);
      const numRect = rectObj(revealNum);
      if (numRect.top < gridRect.top + 4 || numRect.bottom > gridRect.bottom - 4) {
        cropSafety.issues.push('24/7 numeral cropped by curve-grid container');
      }
    }

    const sliderAffordance = Array.from(document.querySelectorAll('.ebc-calc'))
      .filter(visible)
      .map((calc, index) => {
        const ranges = Array.from(calc.querySelectorAll('input[type="range"]')).filter(visible);
        const visibleOutputs = Array.from(calc.querySelectorAll('output.ebc-slider-out')).filter((output) => {
          const style = window.getComputedStyle(output);
          return visible(output) && Number.parseFloat(style.opacity || '1') > 0.5;
        });
        const note = calc.querySelector('.ebc-control-note');
        const noteText = note ? norm(note.textContent) : '';
        const rangeLabelSets = Array.from(calc.querySelectorAll('.ebc-range-labels')).filter(visible);
        return {
          index,
          rangeCount: ranges.length,
          visibleOutputCount: visibleOutputs.length,
          rangeLabelSetCount: rangeLabelSets.length,
          hasInstruction: /adjust|drag/i.test(noteText) && note && visible(note),
          issues: [
            ranges.length && !/adjust|drag/i.test(noteText) ? 'missing visible adjust/drag instruction' : '',
            visibleOutputs.length < ranges.length ? 'slider value chips hidden by default' : '',
            rangeLabelSets.length < ranges.length ? 'missing min/max range cues' : '',
          ].filter(Boolean),
        };
      });

    const curveMarkers = Array.from(document.querySelectorAll('.curve-svg'))
      .filter(visible)
      .map((svg, index) => ({
        index,
        calloutNodeCount: svg.querySelectorAll('.milestone-node').length,
        stemCount: svg.querySelectorAll('.milestone-stem').length,
      }));

    const html = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(html.scrollWidth, body ? body.scrollWidth : 0);
    const isBook = location.pathname === '/book' || location.pathname === '/book/';

    return {
      url: location.href,
      pathname: location.pathname,
      title: document.title,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: {
        scrollWidth,
        scrollHeight: Math.max(html.scrollHeight, body ? body.scrollHeight : 0),
        overflowX: Math.max(0, scrollWidth - window.innerWidth),
      },
      h1s,
      exactCtas: exactCtas.slice(0, 12),
      firstInteractive: interactive.slice(0, 12),
      clippedControls,
      images: {
        visibleCount: images.length,
        aboveFoldCount: images.filter((image) => image.rect.absTop < window.innerHeight).length,
        broken: images
          .filter((image) => image.naturalWidth < 1 || image.naturalHeight < 1)
          .slice(0, 10),
      },
      mobileCtaWithin580:
        exactCtas.some((item) => item.rect.absTop <= 580) ||
        (isBook && bookActions.some((item) => item.rect.absTop <= 580)),
      headingQuality,
      cropSafety,
      sliderAffordance,
      curveMarkers,
    };
  })();
}

function routeFailures(metrics, viewport) {
  const failures = [];
  if (metrics.document.overflowX > 2) failures.push(`horizontal overflow ${metrics.document.overflowX}px`);
  if (metrics.h1s.length !== 1) failures.push(`visible H1 count ${metrics.h1s.length}`);
  if (metrics.images.broken.length) failures.push(`broken visible images ${metrics.images.broken.length}`);

  const clipped = metrics.clippedControls.filter(
    (item) =>
      item.type !== 'range' &&
      item.rect.width > 24 &&
      item.rect.height > 18 &&
      (item.text.length > 2 || item.tag === 'button' || item.tag === 'a'),
  );
  if (clipped.length) failures.push(`clipped controls ${clipped.length}`);
  if (viewport.mobile && !metrics.mobileCtaWithin580) {
    failures.push('mobile CTA/form action not visible within first 580px');
  }
  if (metrics.headingQuality?.issues?.length) {
    failures.push(`heading composition ${metrics.headingQuality.issues.length}`);
  }
  if (metrics.cropSafety?.issues?.length) {
    failures.push(`crop safety ${metrics.cropSafety.issues.length}`);
  }
  const sliderIssues = (metrics.sliderAffordance || []).flatMap((item) => item.issues || []);
  if (sliderIssues.length) failures.push(`slider affordance ${sliderIssues.length}`);
  const curveMarkerFailures = (metrics.curveMarkers || []).filter(
    (item) => item.calloutNodeCount < 4 || item.stemCount < 4,
  );
  if (curveMarkerFailures.length) failures.push(`curve marker callouts ${curveMarkerFailures.length}`);
  return failures;
}

async function ensureManualAcceptanceTemplate() {
  const content = [
    '# Manual Visual Review',
    '',
    'Status: pending',
    '',
    'Reviewer:',
    'Reviewed at:',
    '',
    'Required checks:',
    '- [ ] No heading crosses decorative dividers or center rules.',
    '- [ ] Long headings are broken into readable lines with meaningful emphasis.',
    '- [ ] Capability chart dots/milestones are visually intentional.',
    '- [ ] The 24/7 section is not cropped.',
    '- [ ] ROI sliders are obviously adjustable before interaction.',
    '- [ ] The approved Poor Four highlight pattern remains intact.',
    '',
    'Notes:',
  ].join('\n');
  await fs.mkdir(path.dirname(manualAcceptancePath), { recursive: true });
  await fs.writeFile(manualAcceptancePath, content, { flag: 'wx' }).catch((error) => {
    if (error.code !== 'EEXIST') throw error;
  });
}

async function readManualAcceptance() {
  await ensureManualAcceptanceTemplate();
  const content = await fs.readFile(manualAcceptancePath, 'utf8').catch(() => '');
  return {
    required: requireManualAcceptance,
    path: manualAcceptancePath,
    accepted: /^Status:\s*accepted\b/im.test(content),
  };
}

// Chrome's WebGL/Skia max layer is typically 16384px on one axis (macOS).
// A single Page.captureScreenshot with `captureBeyondViewport: true` on a taller
// page silently produces blank tile artifacts below that limit. We clip the
// page into vertical slices under the limit and stitch with sharp. Single-shot
// fast path preserved for pages within the limit.
const MAX_CAPTURE_TILE_HEIGHT = 12000;

// captureBeyondViewport re-anchors `position: fixed` elements to each tile's
// viewport, so a fixed header repeats at the top of every stitched tile. Pin
// fixed elements to their absolute document position for the duration of the
// capture so each is painted once where it truly sits, then restore originals.
function pinFixedElements() {
  const saved = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (window.getComputedStyle(el).position === 'fixed') {
      const rect = el.getBoundingClientRect();
      saved.push({ el, cssText: el.style.cssText });
      el.style.position = 'absolute';
      el.style.top = `${Math.round(rect.top + window.scrollY)}px`;
      el.style.bottom = 'auto';
    }
  });
  window.__bwmPinnedFixed = saved;
  return saved.length;
}

function restoreFixedElements() {
  const saved = window.__bwmPinnedFixed || [];
  saved.forEach(({ el, cssText }) => {
    el.style.cssText = cssText;
  });
  delete window.__bwmPinnedFixed;
  return saved.length;
}

async function captureFullPage(cdp, filePath) {
  const { contentSize } = await cdp.send('Page.getLayoutMetrics');
  const width = Math.ceil(contentSize.width);
  const height = Math.ceil(contentSize.height);

  await cdp.send('Runtime.evaluate', {
    expression: `(${pinFixedElements.toString()})()`,
    returnByValue: true,
  });

  try {
    if (height <= MAX_CAPTURE_TILE_HEIGHT) {
      const screenshot = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width, height, scale: 1 },
      });
      await fs.writeFile(filePath, Buffer.from(screenshot.data, 'base64'));
      return;
    }

    const { default: sharp } = await import('sharp');
    const composite = [];
    for (let y = 0; y < height; y += MAX_CAPTURE_TILE_HEIGHT) {
      const tileHeight = Math.min(MAX_CAPTURE_TILE_HEIGHT, height - y);
      const screenshot = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: true,
        clip: { x: 0, y, width, height: tileHeight, scale: 1 },
      });
      composite.push({ input: Buffer.from(screenshot.data, 'base64'), top: y, left: 0 });
    }

    await sharp({
      create: { width, height, channels: 3, background: { r: 5, g: 5, b: 7 } },
    })
      .composite(composite)
      .png()
      .toFile(filePath);
  } finally {
    await cdp.send('Runtime.evaluate', {
      expression: `(${restoreFixedElements.toString()})()`,
      returnByValue: true,
    });
  }
}

async function main() {
  const response = await fetch(baseUrl);
  if (!response.ok) throw new Error(`Base URL failed before visual QA: ${baseUrl} (${response.status})`);

  await fs.mkdir(outRoot, { recursive: true });
  const chrome = await launchChrome();
  let cdp;

  try {
    cdp = await createPage(chrome.port);
    const captures = [];
    const failures = [];

    for (const viewport of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.mobile,
      });

      for (const route of routes) {
        const url = new URL(route.path, baseUrl).toString();
        const eventStart = await navigate(cdp, url);
        const audit = await cdp.send('Runtime.evaluate', {
          expression: `(${pageAudit.toString()})()`,
          awaitPromise: true,
          returnByValue: true,
        });
        const metrics = audit.result.value;
        const routeDir = path.join(outRoot, route.name, viewport.name);
        await fs.mkdir(routeDir, { recursive: true });
        const screenshotPath = path.join(routeDir, 'full-page.png');
        await fs.writeFile(path.join(routeDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
        await captureFullPage(cdp, screenshotPath);

        const recentEvents = cdp.events.slice(eventStart);
        const browserIssues = recentEvents
          .filter(
            (event) =>
              event.method === 'Runtime.exceptionThrown' ||
              (event.method === 'Log.entryAdded' && ['error', 'warning'].includes(event.params?.entry?.level)),
          )
          .map((event) => event.params)
          .slice(0, 20);
        await fs.writeFile(path.join(routeDir, 'browser-events.json'), JSON.stringify(browserIssues, null, 2));

        const capture = {
          route: route.path,
          viewport: viewport.name,
          screenshot: screenshotPath,
          failures: routeFailures(metrics, viewport),
          h1s: metrics.h1s,
          overflowX: metrics.document.overflowX,
          visibleImages: metrics.images.visibleCount,
          aboveFoldImages: metrics.images.aboveFoldCount,
          mobileCtaWithin580: metrics.mobileCtaWithin580,
          browserIssueCount: browserIssues.length,
        };
        captures.push(capture);
        if (capture.failures.length) failures.push(capture);
      }
    }

    const manualAcceptance = await readManualAcceptance();
    if (manualAcceptance.required && !manualAcceptance.accepted) {
      failures.push({
        route: 'manual visual review',
        viewport: 'all',
        screenshot: manualAcceptance.path,
        failures: ['manual visual acceptance note missing Status: accepted'],
      });
    }

    const summary = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      chromePath,
      routes: routes.map((route) => route.path),
      viewports,
      totalCaptures: captures.length,
      failureCount: failures.length,
      failures,
      captures,
      manualAcceptance,
    };
    await fs.writeFile(path.join(outRoot, 'visual-qa-summary.json'), JSON.stringify(summary, null, 2));
    await fs.writeFile(
      path.join(outRoot, 'visual-qa-summary.md'),
      [
        '# Brand Closure Visual QA',
        '',
        `Base: ${baseUrl}`,
        `Captures: ${summary.totalCaptures}`,
        `Failures: ${summary.failureCount}`,
        `Manual visual review: ${manualAcceptance.accepted ? 'accepted' : 'pending'} (${manualAcceptance.path})`,
        '',
        '## Captures',
        '',
        ...captures.map(
          (capture) =>
            `- ${capture.route} @ ${capture.viewport}: ${
              capture.failures.length ? `FAIL (${capture.failures.join('; ')})` : 'pass'
            }; images ${capture.visibleImages}/${capture.aboveFoldImages} above fold; overflow ${
              capture.overflowX
            }px; screenshot ${capture.screenshot}`,
        ),
        '',
        '## Failures',
        '',
        ...(failures.length
          ? failures.map((capture) => `- ${capture.route} @ ${capture.viewport}: ${capture.failures.join('; ')}`)
          : ['- None']),
      ].join('\n'),
    );

    if (failures.length) {
      console.error(`Brand visual QA failed with ${failures.length} failing capture(s).`);
      console.error(`See ${path.join(outRoot, 'visual-qa-summary.md')}`);
      process.exitCode = 1;
      return;
    }

    console.log(`Brand visual QA passed with ${captures.length} captures.`);
    console.log(`See ${path.join(outRoot, 'visual-qa-summary.md')}`);
  } finally {
    cdp?.close();
    chrome.child.kill('SIGTERM');
    await Promise.race([
      new Promise((resolve) => chrome.child.once('exit', resolve)),
      sleep(1500),
    ]);
    await fs.rm(chrome.userDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
