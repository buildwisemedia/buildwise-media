#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
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

// --- Route coverage is OPT-OUT, not an allowlist (PROJ-DESIGN-INTEL-001 / paid-LP
// post-mortem 2026-06-17). The rendered sweep used to run a hardcoded six-route
// allowlist, so /go/* paid landing pages were never visually swept at all and
// shipped with defects the source/text tier could not see. Every static route
// under src/pages now auto-enters the sweep; only routes named in ROUTE_OPT_OUT
// are skipped (each with a reason), and a meta-gate below FAILS if any /go/*
// paid LP is missing from the run. ---
const pagesDir = path.resolve('src/pages');

// Routes deliberately excluded from the rendered sweep. Each needs a reason.
// Dynamic param routes can't be rendered without params; legal/utility pages
// have no hero/CTA contract. Adding a /go/* route here trips the meta-gate.
const routeOptOut = new Map([
  ['/m/[card]', 'dynamic param route — no canonical render without :card'],
  ['/404', 'error route — intentionally single-purpose, no H1/CTA contract'],
  ['/confirmation', 'post-submit utility page — no hero/CTA contract'],
  ['/thank-you-resource', 'post-submit utility page — no hero/CTA contract'],
]);

function fileToRoute(absFile) {
  let rel = path.relative(pagesDir, absFile).replaceAll(path.sep, '/').replace(/\.astro$/, '');
  if (rel === 'index') return '/';
  rel = rel.replace(/\/index$/, '');
  return `/${rel}`;
}

function discoverRoutes() {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.astro')) files.push(full);
    }
  };
  walk(pagesDir);
  const paths = files
    .map(fileToRoute)
    .filter((route) => !route.includes('[')) // dynamic routes can't be swept
    .filter((route) => !routeOptOut.has(route));
  return [...new Set(paths)].sort();
}

const routeToName = (routePath) =>
  routePath === '/' ? 'home' : routePath.slice(1).replace(/\//g, '-');

const allRoutes = discoverRoutes().map((routePath) => ({ name: routeToName(routePath), path: routePath }));
// Paid landing pages — the class that escaped the old allowlist. The meta-gate
// asserts every one of these is in the swept set.
const paidLpRoutes = allRoutes.filter((route) => /^\/(go|mo)(\/|-|$)/.test(route.path));

// BWM_QA_ROUTES scopes a run to a comma-separated subset of paths (fast targeted
// reruns); when set, the meta-gate is skipped because the scope is explicit.
const routeOverride = (process.env.BWM_QA_ROUTES || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const routes = routeOverride.length
  ? allRoutes.filter((route) => routeOverride.includes(route.path))
  : allRoutes;

const allViewports = [
  { name: 'desktop-1920x1080', width: 1920, height: 1080, mobile: false },
  { name: 'desktop-1440x900', width: 1440, height: 900, mobile: false },
  { name: 'desktop-1280x800', width: 1280, height: 800, mobile: false },
  { name: 'tablet-768x1024', width: 768, height: 1024, mobile: false },
  { name: 'mobile-390x844', width: 390, height: 844, mobile: true },
];
// BWM_QA_VIEWPORTS scopes the matrix (e.g. "desktop-1440x900,mobile-390x844")
// so the full-fleet sweep can run the two gate-critical viewports for speed.
const viewportOverride = (process.env.BWM_QA_VIEWPORTS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const viewports = viewportOverride.length
  ? allViewports.filter((viewport) => viewportOverride.includes(viewport.name))
  : allViewports;

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

    // --- [S]-tier deterministic adjuncts (PROJ-DESIGN-INTEL-001 P2) ---
    // yellow-ratio: Y2/Y1-matched paint area must stay ≤10% of page area per
    // viewport (R015 color discipline). Tolerance ±10% per HSL channel.
    const parseRgb = (value) => {
      const m = /rgba?\(([^)]+)\)/.exec(value || '');
      if (!m) return null;
      const parts = m[1].split(',').map((p) => Number.parseFloat(p));
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    };
    const rgbToHsl = ({ r, g, b }) => {
      const rn = r / 255;
      const gn = g / 255;
      const bn = b / 255;
      const max = Math.max(rn, gn, bn);
      const min = Math.min(rn, gn, bn);
      const l = (max + min) / 2;
      if (max === min) return { h: 0, s: 0, l };
      const d = max - min;
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      let h;
      if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
      else if (max === gn) h = (bn - rn) / d + 2;
      else h = (rn - gn) / d + 4;
      return { h: h * 60, s, l };
    };
    const BRAND_YELLOWS = [
      { h: 63.5, s: 1, l: 0.5 }, // Y2 #F0FF00
      { h: 81.6, s: 1, l: 0.614 }, // Y1 #B8FF3A
    ];
    const isBrandYellow = (value) => {
      const rgb = parseRgb(value);
      if (!rgb || rgb.a < 0.5) return false;
      const hsl = rgbToHsl(rgb);
      return BRAND_YELLOWS.some(
        (y) => Math.abs(hsl.h - y.h) <= 36 && Math.abs(hsl.s - y.s) <= 0.1 && Math.abs(hsl.l - y.l) <= 0.1,
      );
    };
    const countedYellowBg = new Set();
    const hasCountedYellowAncestor = (element) => {
      let node = element.parentElement;
      while (node) {
        if (countedYellowBg.has(node)) return true;
        node = node.parentElement;
      }
      return false;
    };
    let yellowArea = 0;
    const yellowSamples = [];
    const directText = (element) =>
      Array.from(element.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    document.querySelectorAll('body, body *').forEach((element) => {
      if (!visible(element)) return;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area < 4) return;
      const sample = (kind, contributed) => {
        if (yellowSamples.length < 12) {
          yellowSamples.push({
            kind,
            tag: element.tagName.toLowerCase(),
            cls: `${element.className || ''}`.slice(0, 48),
            area: Math.round(contributed),
          });
        }
      };
      if (isBrandYellow(style.backgroundColor) && !hasCountedYellowAncestor(element)) {
        countedYellowBg.add(element);
        yellowArea += area;
        sample('bg', area);
        return;
      }
      if (element instanceof SVGElement && isBrandYellow(style.fill) && !hasCountedYellowAncestor(element)) {
        countedYellowBg.add(element);
        yellowArea += area;
        sample('svg-fill', area);
        return;
      }
      if (directText(element) && isBrandYellow(style.color)) {
        // Text paints glyphs, not the full rect — 0.12 glyph-coverage factor.
        yellowArea += area * 0.12;
        sample('text', area * 0.12);
      }
    });

    // WCAG 2.2 AA: pointer targets ≥24×24 (2.5.8; inline-text links exempt).
    const wcagTargets = [];
    document.querySelectorAll('a,button,input,select,textarea,[role="button"]').forEach((element) => {
      if (wcagTargets.length >= 20) return;
      if (!visible(element)) return;
      if (element.closest('[aria-hidden="true"]')) return;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (rect.width >= 24 && rect.height >= 24) return;
      const tag = element.tagName.toLowerCase();
      if (tag === 'a' && style.display === 'inline') return; // WCAG 2.5.8 inline exception
      const type = (element.getAttribute('type') || '').toLowerCase();
      // Range inputs: the 3px track is the element rect but the THUMB is the
      // pointer target — rect-based measurement under-counts. Skip.
      if (tag === 'input' && type === 'range') return;
      if (tag === 'input' && (type === 'radio' || type === 'checkbox')) {
        const label = element.closest('label');
        if (label) {
          const lr = label.getBoundingClientRect();
          if (lr.width >= 24 && lr.height >= 24) return;
        }
      }
      wcagTargets.push({
        tag,
        type,
        text: norm(element.textContent || element.getAttribute('aria-label') || '').slice(0, 48),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      });
    });

    // WCAG 2.2 AA: computed contrast ≥4.5:1 body / ≥3:1 large text. Elements
    // over images/gradients are indeterminate — left to the [S]/[J] tiers.
    const effectiveBackground = (element) => {
      let node = element;
      while (node && node.nodeType === 1) {
        const style = window.getComputedStyle(node);
        if (style.backgroundImage && style.backgroundImage !== 'none') return null;
        const rgb = parseRgb(style.backgroundColor);
        if (rgb && rgb.a >= 0.95) return rgb;
        node = node.parentElement;
      }
      return { r: 5, g: 5, b: 7, a: 1 }; // Triangulation canvas #050507
    };
    const relLum = ({ r, g, b }) => {
      const chan = (v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
    };
    const wcagContrast = [];
    document
      .querySelectorAll('p,li,a,button,label,h1,h2,h3,h4,h5,h6,span,td,th,dt,dd,figcaption,blockquote,output,summary')
      .forEach((element) => {
        if (wcagContrast.length >= 20) return;
        if (!visible(element)) return;
        if (element.closest('[aria-hidden="true"]')) return;
        if (!directText(element)) return;
        const style = window.getComputedStyle(element);
        const fg = parseRgb(style.color);
        if (!fg) return;
        const bg = effectiveBackground(element);
        if (!bg) return;
        const composited =
          fg.a >= 1
            ? fg
            : {
                r: fg.r * fg.a + bg.r * (1 - fg.a),
                g: fg.g * fg.a + bg.g * (1 - fg.a),
                b: fg.b * fg.a + bg.b * (1 - fg.a),
              };
        const l1 = relLum(composited);
        const l2 = relLum(bg);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const size = Number.parseFloat(style.fontSize);
        const weight = Number.parseInt(style.fontWeight, 10) || 400;
        const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
        const threshold = isLarge ? 3 : 4.5;
        if (ratio < threshold) {
          wcagContrast.push({
            tag: element.tagName.toLowerCase(),
            text: norm(element.textContent).slice(0, 48),
            ratio: Math.round(ratio * 100) / 100,
            threshold,
            size: Math.round(size),
          });
        }
      });

    // --- Paid-LP post-mortem gates (2026-06-17) ---------------------------------
    // These are the rendered-pixel checks the old sweep lacked: a selector-agnostic
    // primary-CTA-above-fold measure (was hardcoded to "See If We're a Fit"), an
    // SVG text-vs-graphic collision check (caught nothing before), a bar-chart
    // conclusion-annotation check, section prose-density, and comparison-table
    // hierarchy. Each maps 1:1 to a defect Robert caught by eye on /go/*.

    const isBook = location.pathname === '/book' || location.pathname === '/book/';

    // ITEM 3 — primary CTA, selector-agnostic. Any conversion control counts:
    // .cta / [class*=cta] anchors, [data-cta-source], plus the legacy locked-CTA
    // and (on /book) the booking form actions already detected above.
    const genericCtas = Array.from(
      document.querySelectorAll('a.cta, a[class*="cta"], [data-cta-source], button.cta, a.cta-primary'),
    )
      .filter(visible)
      .map((element) => rectObj(element).absTop);
    const ctaTops = [
      ...genericCtas,
      ...exactCtas.map((item) => item.rect.absTop),
      ...(isBook ? bookActions.map((item) => item.rect.absTop) : []),
    ];
    const ctaPrimaryTop = ctaTops.length ? Math.min(...ctaTops) : null;

    // ITEM 2 — SVG text-vs-graphic collision. High-precision marks only: filled
    // nodes (circle/ellipse — tight bbox), axis-aligned lines (thin bbox), and
    // small stroked outline rects. Curved path/polyline bboxes are too loose for a
    // deterministic call and are left to the [S]-tier multimodal critique.
    // Ink marks = glyph-colliding graphics with a TIGHT bounding box: filled/stroked
    // nodes (circle/ellipse) and near-axis-aligned lines. `rect` is excluded — a
    // stroked rect is almost always a label/value container the text sits INSIDE by
    // design, and a filled rect is a bar or backdrop panel; curved path/polyline
    // bboxes are too loose. Node/line collisions are exactly what Robert caught.
    const isInkMark = (mark) => {
      if (!visible(mark)) return false;
      const tag = mark.tagName.toLowerCase();
      const rect = mark.getBoundingClientRect();
      if (rect.width < 1 && rect.height < 1) return false;
      const style = window.getComputedStyle(mark);
      const fill = (style.fill || '').toLowerCase();
      const stroke = (style.stroke || '').toLowerCase();
      const hasFill = fill && fill !== 'none' && fill !== 'rgba(0, 0, 0, 0)' && fill !== 'transparent';
      const hasStroke = stroke && stroke !== 'none' && stroke !== 'rgba(0, 0, 0, 0)';
      // Small nodes/dots only — a LARGE circle is a node container whose label
      // legitimately sits inside or at its edge (node-map diagrams), not a glyph
      // collision. The real collisions are plotted dots (r~3-7) landing on text.
      if (tag === 'circle' || tag === 'ellipse') return (hasFill || hasStroke) && Math.max(rect.width, rect.height) <= 36;
      if (tag === 'line') return hasStroke && Math.min(rect.width, rect.height) <= 6;
      return false;
    };
    const svgTextCollisions = [];
    Array.from(document.querySelectorAll('svg'))
      .filter(visible)
      .forEach((svg, svgIndex) => {
        const texts = Array.from(svg.querySelectorAll('text')).filter(visible);
        const marks = Array.from(svg.querySelectorAll('circle, ellipse, line')).filter(isInkMark);
        texts.forEach((text) => {
          if (svgTextCollisions.length >= 12) return;
          const tr = text.getBoundingClientRect();
          if (tr.width < 1 || tr.height < 1) return;
          const textGroup = text.closest('g');
          for (const mark of marks) {
            if (mark.contains(text) || text.contains(mark)) continue;
            // Text and mark sharing the same <g> node-group → the text is that
            // node's LABEL (node-map diagrams), not a collision with an unrelated
            // mark. Flat-SVG collisions (text + dot both direct <svg> children)
            // have no shared group and are still caught.
            const markGroup = mark.closest('g');
            if (markGroup && markGroup === textGroup) continue;
            const mr = mark.getBoundingClientRect();
            // text fully inside the mark's box → a label/value container, by design.
            const textInsideMark =
              tr.left >= mr.left - 1 && tr.right <= mr.right + 1 && tr.top >= mr.top - 1 && tr.bottom <= mr.bottom + 1;
            if (textInsideMark) continue;
            const overlapX = Math.min(tr.right, mr.right) - Math.max(tr.left, mr.left);
            const overlapY = Math.min(tr.bottom, mr.bottom) - Math.max(tr.top, mr.top);
            if (overlapX > 1 && overlapY > 1) {
              svgTextCollisions.push({
                svgIndex,
                text: norm(text.textContent).slice(0, 32),
                mark: mark.tagName.toLowerCase(),
                overlap: `${Math.round(overlapX)}x${Math.round(overlapY)}`,
              });
              break;
            }
          }
        });
      });

    // ITEM 6 — bar-chart conclusion annotation. A filled, similar-width series of
    // ≥3 bars is a quantitative chart; it must state its conclusion in a NUMBER the
    // sighted viewer can read (a <text> or sibling <figcaption>), not leave them to
    // estimate from bar heights. aria-label-only numbers are accessible but invisible
    // → advisory. No number anywhere → strict.
    const numRe = /\d|%|×/;
    const dataVizCharts = [];
    Array.from(document.querySelectorAll('svg'))
      .filter(visible)
      .forEach((svg) => {
        // Icon-sized SVGs are decorative glyphs (growth bars, equalizer marks),
        // not data charts — a real bar chart is a substantial graphic.
        if (svg.getBoundingClientRect().width < 160) return;
        const filledBars = Array.from(svg.querySelectorAll('rect')).filter((rect) => {
          const style = window.getComputedStyle(rect);
          const fill = (style.fill || '').toLowerCase();
          const stroke = (style.stroke || '').toLowerCase();
          const hasFill = fill && fill !== 'none' && fill !== 'rgba(0, 0, 0, 0)' && fill !== 'transparent';
          const hasStroke = stroke && stroke !== 'none' && stroke !== 'rgba(0, 0, 0, 0)';
          const box = rect.getBoundingClientRect();
          return hasFill && !hasStroke && box.width > 2 && box.height > 4;
        });
        if (filledBars.length < 4) return;
        const widths = filledBars.map((rect) => Math.round(rect.getBoundingClientRect().width)).sort((a, b) => a - b);
        const median = widths[Math.floor(widths.length / 2)];
        const series = widths.filter((width) => Math.abs(width - median) <= 3);
        if (series.length < 4) return; // a uniform series of <4 bars is likely a decorative motif
        const visibleText = Array.from(svg.querySelectorAll('text')).map((t) => t.textContent).join(' ');
        const figure = svg.closest('figure');
        const figcaption = figure ? figure.querySelector('figcaption')?.textContent || '' : '';
        const aria = svg.getAttribute('aria-label') || '';
        const hasVisibleNumber = numRe.test(visibleText) || numRe.test(figcaption);
        const hasAnyNumber = hasVisibleNumber || numRe.test(aria);
        dataVizCharts.push({
          bars: series.length,
          hasVisibleNumber,
          hasAnyNumber,
          sample: (aria || figcaption || visibleText).replace(/\s+/g, ' ').trim().slice(0, 56),
        });
      });

    // ITEM 5 — section prose density (advisory). >120 words of body prose above a
    // section's first visual, with no bold/emphasis skim layer, reads as a wall.
    const proseDensity = [];
    Array.from(document.querySelectorAll('section'))
      .filter(visible)
      .forEach((section) => {
        if (proseDensity.length >= 10) return;
        const firstVisual = Array.from(
          section.querySelectorAll('svg, img, figure, table, canvas, picture, video'),
        ).filter(visible)[0];
        const visualTop = firstVisual ? rectObj(firstVisual).absTop : Number.POSITIVE_INFINITY;
        let words = 0;
        let hasEmphasis = false;
        Array.from(section.querySelectorAll('p'))
          .filter(visible)
          .forEach((p) => {
            if (rectObj(p).absTop >= visualTop) return;
            // Skip prose already structured inside a component (comparison cell,
            // card, list item, table) — that is a scan layer, not a wall of text.
            if (p.closest('[role="cell"], [role="row"], [role="listitem"], li, table, figure, [class*="card"], [class*="grid"], [class*="compare"], [class*="step"]')) {
              return;
            }
            words += norm(p.textContent).split(/\s+/).filter(Boolean).length;
            if (p.querySelector('strong, b, em, mark')) hasEmphasis = true;
          });
        if (words > 120 && !hasEmphasis) {
          proseDensity.push({ words, cls: `${section.className || ''}`.slice(0, 40) });
        }
      });

    // ITEM 8 — comparison-table visual hierarchy. A 2-column comparison must guide
    // the eye with per-row treatment on the winner column (accent border/background),
    // not just a colored header, and keep rows scannable (≤60 words).
    const comparisonTables = [];
    Array.from(document.querySelectorAll('[role="table"], table'))
      .filter(visible)
      .forEach((table) => {
        const headers = Array.from(table.querySelectorAll('[role="columnheader"], th')).filter(visible);
        const cells = Array.from(table.querySelectorAll('[role="cell"], td')).filter(visible);
        // Binary "us vs them" comparison only: exactly 2 column headers and a small
        // cell count. Multi-tier pricing/feature matrices (3+ columns, dozens of
        // cells) are a different table type and are out of scope for this check.
        if (headers.length !== 2 || cells.length < 4 || cells.length > 16) return;
        let treatedCells = 0;
        let longRows = 0;
        cells.forEach((cell) => {
          const style = window.getComputedStyle(cell);
          const borderLeft = Number.parseFloat(style.borderLeftWidth) || 0;
          const borderTop = Number.parseFloat(style.borderTopWidth) || 0;
          if (borderLeft >= 2 || borderTop >= 2) treatedCells += 1;
          if (norm(cell.textContent).split(/\s+/).filter(Boolean).length > 60) longRows += 1;
        });
        comparisonTables.push({
          cells: cells.length,
          treatedCells,
          longRows,
          noPerRowTreatment: treatedCells === 0,
        });
      });

    const html = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(html.scrollWidth, body ? body.scrollWidth : 0);

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
      mobileCtaWithin580: ctaTops.some((top) => top <= 580),
      ctaPrimaryTop,
      ctaCount: ctaTops.length,
      svgTextCollisions,
      dataVizCharts,
      proseDensity,
      comparisonTables,
      headingQuality,
      cropSafety,
      sliderAffordance,
      curveMarkers,
      desktopCtaAboveFold: ctaPrimaryTop !== null && ctaPrimaryTop <= window.innerHeight,
      yellowRatio: (() => {
        const pageArea =
          window.innerWidth * Math.max(html.scrollHeight, body ? body.scrollHeight : 0);
        return {
          ratio: pageArea ? yellowArea / pageArea : 0,
          area: Math.round(yellowArea),
          pageArea: Math.round(pageArea),
          samples: yellowSamples,
        };
      })(),
      wcag: { targets: wcagTargets, contrast: wcagContrast },
    };
  })();
}

// WCAG 2.2 AA focus-visible sweep (PROJ-DESIGN-INTEL-001 P2): dispatch real Tab
// keys via CDP (programmatic .focus() does not trigger :focus-visible) and
// verify every tab stop carries a visible focus indication. Runs at
// desktop-1440x900 only — focus styling does not vary by viewport.
async function focusSweep(cdp, maxStops = 25) {
  await cdp.send('Runtime.evaluate', {
    expression:
      'window.scrollTo(0, 0); if (document.activeElement && document.activeElement.blur) document.activeElement.blur();',
    returnByValue: true,
  });
  const seen = new Set();
  const missing = [];
  let stops = 0;
  for (let i = 0; i < maxStops; i++) {
    for (const type of ['rawKeyDown', 'keyUp']) {
      await cdp.send('Input.dispatchKeyEvent', {
        type,
        key: 'Tab',
        code: 'Tab',
        windowsVirtualKeyCode: 9,
        nativeVirtualKeyCode: 9,
      });
    }
    await sleep(40);
    const probe = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.activeElement;
        if (!el || el === document.body || el === document.documentElement) return null;
        const id = (el.tagName || '') + '|' + (el.id || '') + '|' + ('' + (el.className || '')).slice(0, 40) + '|' + (el.textContent || '').trim().slice(0, 32);
        const read = () => {
          const s = window.getComputedStyle(el);
          return {
            outlineStyle: s.outlineStyle,
            outlineWidth: s.outlineWidth,
            boxShadow: s.boxShadow,
            borderColor: s.borderColor,
            backgroundColor: s.backgroundColor,
            color: s.color,
          };
        };
        const focused = read();
        el.blur();
        const blurred = read();
        el.focus({ preventScroll: true });
        const indicated =
          (focused.outlineStyle !== 'none' && focused.outlineWidth !== '0px') ||
          focused.boxShadow !== blurred.boxShadow ||
          focused.borderColor !== blurred.borderColor ||
          focused.backgroundColor !== blurred.backgroundColor ||
          focused.color !== blurred.color;
        return { id, indicated };
      })()`,
      returnByValue: true,
    });
    const value = probe.result?.value;
    if (!value) break;
    if (seen.has(value.id)) break; // wrapped around the tab ring
    seen.add(value.id);
    stops += 1;
    if (!value.indicated) missing.push(value.id);
  }
  return { stops, missing: missing.slice(0, 10) };
}

// 44×44 tap-target sweep at 375px (PROJ-DESIGN-INTEL-001 P4): Gate 1 [A]
// assertion from Brain reference/QA-Visual-Design-Gate.md § Tap Targets —
// primary conversion controls (.cta CTAs, qualifier next/prev/submit, option
// labels, #book-cta-fallback) must measure ≥44×44 CSS px at the 375px mobile
// width (Apple HIG floor for conversion-path controls; stricter than the
// WCAG 2.5.8 ≥24px sweep, which keeps covering everything else). Runs once
// per route inside the mobile-390x844 pass under a temporary 375×667
// override; the caller restores the viewport before screenshots.
function tapTargetAudit() {
  const MIN = 44;
  const selectors = [
    'a.cta',
    'a.cta-primary',
    '#book-cta-fallback',
    '.qualifier-form [data-next]',
    '.qualifier-form [data-prev]',
    '.qualifier-form [data-mobile-next]',
    '.qualifier-form button[type="submit"]',
    '.q-options label',
    '.q-option-card',
  ].join(',');
  // Step-gated qualifier controls are display:none until their step activates;
  // their styling is what ships, so reveal for measurement and revert so the
  // screenshots that follow capture the page as visitors see it.
  const undo = [];
  document.querySelectorAll('.q-step:not(.is-active)').forEach((el) => {
    el.classList.add('is-active');
    undo.push(() => el.classList.remove('is-active'));
  });
  document
    .querySelectorAll('.qualifier-form [hidden], #cal-inline[hidden], #book-cta-fallback[hidden]')
    .forEach((el) => {
      el.removeAttribute('hidden');
      undo.push(() => el.setAttribute('hidden', ''));
    });
  const failures = [];
  let measured = 0;
  document.querySelectorAll(selectors).forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    if (window.getComputedStyle(el).visibility === 'hidden') return;
    measured += 1;
    if (rect.width < MIN || rect.height < MIN) {
      failures.push({
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      });
    }
  });
  undo.forEach((revert) => revert());
  return { viewport: '375x667', minPx: MIN, measured, failures: failures.slice(0, 20) };
}

async function tapTargetSweep(cdp) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 667,
    deviceScaleFactor: 1,
    mobile: true,
  });
  const audit = await cdp.send('Runtime.evaluate', {
    expression: `(${tapTargetAudit.toString()})()`,
    returnByValue: true,
  });
  return audit.result.value;
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

  // [S]-tier deterministic adjuncts (PROJ-DESIGN-INTEL-001 P2). STRICT posture
  // was validated by a clean flagship smoke on 2026-06-11 (zero false-block);
  // tier contract in Brain reference/QA-Visual-Design-Gate.md.
  // ITEM 3 — primary CTA must clear the fold at 1440x900 (top ≤ viewportH − 80).
  // Selector-agnostic: catches /go/* CTAs ("Get My Free Revenue Leak Map") the
  // old "See If We're a Fit" hardcode missed.
  if (viewport.name === 'desktop-1440x900') {
    if (metrics.ctaPrimaryTop === null) {
      failures.push('no primary CTA detected on page');
    } else if (metrics.ctaPrimaryTop > viewport.height - 80) {
      failures.push(`primary CTA below the fold (top ${metrics.ctaPrimaryTop}px > ${viewport.height - 80}px @1440x900)`);
    }
  }
  // ITEM 2 — SVG text/graphic collisions (deterministic, high-precision marks).
  if (metrics.svgTextCollisions?.length) {
    const sample = metrics.svgTextCollisions
      .slice(0, 3)
      .map((c) => `"${c.text}"×${c.mark}`)
      .join(', ');
    failures.push(`svg text collisions ${metrics.svgTextCollisions.length} (${sample})`);
  }
  // ITEM 6 — a bar chart with no conclusion number anywhere is unreadable.
  const unannotatedCharts = (metrics.dataVizCharts || []).filter((chart) => !chart.hasAnyNumber);
  if (unannotatedCharts.length) {
    failures.push(`bar chart without a conclusion number ${unannotatedCharts.length}`);
  }
  // ITEM 8 — comparison table must guide the eye, not be a wall of text.
  const flatTables = (metrics.comparisonTables || []).filter((t) => t.noPerRowTreatment);
  if (flatTables.length) {
    failures.push(`comparison table with header-only treatment (no winner-column rows) ${flatTables.length}`);
  }
  const wordyTables = (metrics.comparisonTables || []).filter((t) => t.longRows > 0);
  if (wordyTables.length) {
    failures.push(`comparison table rows over 60 words ${wordyTables.reduce((sum, t) => sum + t.longRows, 0)}`);
  }
  if (metrics.yellowRatio && metrics.yellowRatio.ratio > 0.1) {
    failures.push(`yellow-ratio ${(metrics.yellowRatio.ratio * 100).toFixed(1)}% exceeds 10% accent budget`);
  }
  if (metrics.wcag?.targets?.length) failures.push(`wcag target-size ${metrics.wcag.targets.length}`);
  if (metrics.focusAudit?.missing?.length) {
    failures.push(`focus-visible missing on ${metrics.focusAudit.missing.length} tab stops`);
  }
  // 44×44 tap-target assertion at 375px (PROJ-DESIGN-INTEL-001 P4, Gate 1 [A]).
  if (metrics.tapTargets?.failures?.length) {
    failures.push(`tap-target <44x44 at 375px: ${metrics.tapTargets.failures.length}`);
  }
  return failures;
}

// ADVISORY findings (burn-in per QA-Visual-Design-Gate.md): surfaced in the
// summary but never set the exit code. wcag-contrast sits here because the
// 2026-06-11 flagship smoke found pre-existing sub-threshold micro-labels
// (8-9px faint diagram annotations ~3:1) — a design-tier [J] decision, not a
// regression this sweep should hard-block on. Flips to routeFailures once the
// micro-label register is resolved.
function routeAdvisories(metrics) {
  const advisories = [];
  if (metrics.wcag?.contrast?.length) advisories.push(`wcag contrast ${metrics.wcag.contrast.length}`);
  // ITEM 5 — prose density: a wall of body text with no skim layer before its
  // first visual. Advisory (scannability is a [J] judgment, not a hard regression).
  if (metrics.proseDensity?.length) {
    const worst = Math.max(...metrics.proseDensity.map((p) => p.words));
    advisories.push(`prose density ${metrics.proseDensity.length} (worst ${worst} words)`);
  }
  // ITEM 6 (advisory tier) — a bar chart whose only number lives in aria-label is
  // accessible but makes the SIGHTED viewer estimate the delta from bar heights.
  const ariaOnlyCharts = (metrics.dataVizCharts || []).filter((c) => c.hasAnyNumber && !c.hasVisibleNumber);
  if (ariaOnlyCharts.length) {
    advisories.push(`bar chart number not visibly rendered (aria-only) ${ariaOnlyCharts.length}`);
  }
  return advisories;
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
        if (viewport.name === 'desktop-1440x900') {
          metrics.focusAudit = await focusSweep(cdp).catch((error) => ({
            stops: 0,
            missing: [],
            error: error.message,
          }));
        }
        if (viewport.name === 'mobile-390x844') {
          metrics.tapTargets = await tapTargetSweep(cdp).catch((error) => ({
            error: error.message,
            failures: [],
          }));
          // restore the pass's viewport before the screenshot below
          await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: viewport.width,
            height: viewport.height,
            deviceScaleFactor: 1,
            mobile: viewport.mobile,
          });
        }
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
          advisories: routeAdvisories(metrics),
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

    // META-GATE (paid-LP post-mortem 2026-06-17): the sweep must actually cover
    // every paid landing page. If a /go/* or /mo-* route exists in src/pages but
    // is absent from the run (re-hardcoded list, stray opt-out, build drift),
    // FAIL loudly — a silently-skipped LP is exactly how the agency-alternative
    // page shipped unswept. Skipped only when the run is explicitly scoped.
    if (!routeOverride.length) {
      const sweptPaths = new Set(routes.map((route) => route.path));
      const missingPaidLp = paidLpRoutes.filter((route) => !sweptPaths.has(route.path));
      if (!paidLpRoutes.length) {
        failures.push({
          route: 'meta-gate',
          viewport: 'all',
          screenshot: '',
          failures: ['no /go/* or /mo-* paid landing pages discovered — route auto-discovery is broken'],
        });
      } else if (missingPaidLp.length) {
        failures.push({
          route: 'meta-gate',
          viewport: 'all',
          screenshot: '',
          failures: [`paid landing pages missing from sweep: ${missingPaidLp.map((route) => route.path).join(', ')}`],
        });
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
      advisoryCount: captures.reduce((sum, c) => sum + (c.advisories?.length || 0), 0),
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
        `Advisories (non-blocking): ${summary.advisoryCount}`,
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

    // [S]-tier visual-critique (PROJ-DESIGN-INTEL-001 P2): multimodal rubric
    // pass over THIS bundle's screenshots (scripts/visual-critique-rubric.json,
    // scorer contract in Brain reference/QA-Visual-Design-Gate.md). ADVISORY
    // burn-in — the report informs HITL review and never sets the exit code.
    if (process.env.BWM_VISUAL_CRITIQUE === '1') {
      const critique = spawn('node', [path.resolve('scripts/visual-critique.mjs'), '--bundle', outRoot], {
        stdio: 'inherit',
      });
      await new Promise((resolve) => critique.once('exit', resolve));
      console.log(`[S]-tier visual-critique report: ${path.join(outRoot, 'visual-critique-report.md')} (advisory)`);
    } else {
      console.log(`[S]-tier visual-critique available: node scripts/visual-critique.mjs --bundle ${outRoot}`);
    }

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
