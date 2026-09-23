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

function stripExecutableMarkup(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[^]*?-->/g, ' ');
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
    'reply-path',
    'form-panel',
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
  return [...html.matchAll(/\bhref=(?:"([^"]+)"|'([^']+)'|([^\s"'<>`]+))/gi)].map((m) => m[1] ?? m[2] ?? m[3]);
}

// Every embedded resource URL with its element: src, data-src (a deferred
// frame), each srcset candidate, a video poster and an object's data.
function srcsFrom(html) {
  const refs = [];
  for (const [tag, name] of html.matchAll(/<(img|script|iframe|source|video|audio|track|embed|object|input)\b[^>]*>/gi)) {
    for (const [kind, value] of attrsOf(tag)) {
      if (!['src', 'data-src', 'srcset', 'poster', 'data'].includes(kind)) continue;
      if ((kind === 'poster' && name.toLowerCase() !== 'video') || (kind === 'data' && name.toLowerCase() !== 'object')) continue;
      const urls = kind === 'srcset' ? value.split(',').map((c) => c.trim().split(/\s+/)[0]) : [value.trim()];
      for (const ref of urls.filter(Boolean)) refs.push({ element: name.toLowerCase(), ref });
    }
  }
  return refs;
}

// Stylesheet link targets: these must be real files, never a page route.
function stylesheetHrefs(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)]
    .map(([tag]) => attrsOf(tag))
    .filter((a) => (a.get('rel') ?? '').toLowerCase().split(/\s+/).includes('stylesheet'))
    .map((a) => a.get('href'))
    .filter(Boolean);
}

function metaContent(html, name) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (tag.match(/\bname=["']([^"']+)["']/i)?.[1]?.toLowerCase() === name) {
      return tag.match(/\bcontent=["']([^"']*)["']/i)?.[1] ?? '';
    }
  }
  return null;
}

// Surface map: Brain brand/BWM-Brand-Guidelines.md (Bob brand, 2026-09-12).
// The Bob page system runs on exactly these routes; every other route keeps the
// legacy rules. The lists and the Bob stylesheet are checked against each other,
// so a page cannot join or leave the Bob rules without editing a list here.
const BOB_ROUTES = new Set(['/', '/contact', '/speaking', '/luncheon', '/privacy', '/terms']);
// The approved sample demos the Bob pages embed. They are proof, not landing
// pages: they stay out of search, name themselves as samples, carry no real
// contact action, and the page that embeds them labels them as samples beside
// the frame (guide: "Honest example labels next to the actual sample").
const BOB_PROOFS = new Set(['/bob/proof/hope-demo-r4', '/bob/proof/service-demo-r43']);
// Origins that count as this site when resolving references (the canonical
// production hosts, plus the placeholder origin used for relative paths).
const SITE_ORIGINS = new Set(['https://site.invalid', 'https://buildwisemedia.com', 'https://www.buildwisemedia.com']);
const LEGACY_CTA_EXEMPT = new Set(['/privacy', '/terms', '/404', '/confirmation', '/thank-you-resource']);
// Attributes of one start tag: double-, single- or un-quoted values, names lowercased.
function attrsOf(tag) {
  const attrs = new Map();
  const body = tag.replace(/^<[a-zA-Z][\w-]*/, '').replace(/\/?>$/, '');
  for (const [, name, dq, sq, bare] of body.matchAll(/([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    attrs.set(name.toLowerCase(), dq ?? sq ?? bare ?? '');
  }
  return attrs;
}
// A start tag that hides its element: hidden, aria-hidden=true, display:none,
// visibility:hidden, opacity:0 (even !important), or a hidden/sr-only class.
function hidesElement(tag) {
  const a = attrsOf(tag);
  const style = (a.get('style') ?? '').replace(/\s+/g, '').toLowerCase();
  return a.has('hidden') || (a.get('aria-hidden') ?? '').toLowerCase() === 'true'
    || /(^|;)(display:none|visibility:hidden|opacity:0*(\.0*)?(!important)?)(;|$)/.test(style)
    || (a.get('class') ?? '').split(/\s+/).some((c) => ['hidden', 'sr-only', 'visually-hidden'].includes(c));
}
// Active for screens unless every query is print/speech-only or excludes screen.
function screenMedia(media) {
  if (media === undefined) return true;
  return media.toLowerCase().split(',').map((q) => q.trim())
    .some((q) => q && !/^(only\s+)?(print|speech)\b/.test(q) && !/^not\s+(screen|all)\b/.test(q));
}

// A small markup walker for the visibility rules below. Each start tag and text
// run is reported with `hidden` = it sits in a subtree a visitor cannot see:
// hidden / aria-hidden / display:none / visibility:hidden / hidden or sr-only
// classes, <template>, and <noscript> (inert when JavaScript runs). Comments,
// scripts and styles are skipped. `depth` lets callers find an element's end.
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
function* walkMarkup(html) {
  const stack = [];
  const re = /<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<(\/?)([a-zA-Z][\w-]*)\b[^>]*>|[^<]+|</g;
  for (let m; (m = re.exec(html));) {
    if (m[0].startsWith('<!--') || m[1]) continue;
    const inHidden = stack.some((e) => e.hidden);
    if (!m[3]) {
      yield { type: 'text', text: m[0], hidden: inHidden };
      continue;
    }
    const name = m[3].toLowerCase();
    if (m[2]) {
      const at = stack.map((e) => e.name).lastIndexOf(name);
      if (at >= 0) stack.length = at;
      yield { type: 'close', name, depth: stack.length };
      continue;
    }
    const hidden = inHidden || hidesElement(m[0]) || name === 'template' || name === 'noscript';
    yield { type: 'open', name, tag: m[0], hidden, depth: stack.length };
    if (!VOID_TAGS.has(name) && !m[0].endsWith('/>')) stack.push({ name, hidden });
  }
}

// An active stylesheet link: rel=stylesheet, not alternate or disabled, for
// screen, and not inert inside <noscript> or <template>.
function loadsStylesheet(html, href, base = '/') {
  for (const t of walkMarkup(html)) {
    if (t.type !== 'open' || t.name !== 'link' || t.hidden) continue;
    const a = attrsOf(t.tag);
    const rel = (a.get('rel') ?? '').toLowerCase().split(/\s+/);
    const target = a.get('href');
    if (target && resolveRef(target.split('#')[0].split('?')[0], base) === href && rel.includes('stylesheet')
      && !rel.includes('alternate') && !a.has('disabled') && screenMedia(a.get('media'))) return true;
  }
  return false;
}

// Guide § Actions and forms: "Keep the header's cream, outlined pill: See Bob at
// Work." It must be a visible, working link (real href) inside the site header.
function bobHeaderAction(html) {
  let header = null;
  let link = null;
  for (const t of walkMarkup(html)) {
    if (!header) {
      if (t.type === 'open' && t.name === 'header' && (attrsOf(t.tag).get('class') ?? '').split(/\s+/).includes('site-header')) header = t;
      continue;
    }
    if (t.type === 'close' && t.depth <= header.depth) break;
    if (t.type === 'open' && t.name === 'a' && (attrsOf(t.tag).get('class') ?? '').split(/\s+/).includes('header-cta')) {
      const href = (attrsOf(t.tag).get('href') ?? '').trim();
      link = { ...t, text: '', href, usable: href !== '' && href !== '#' && !/^javascript:/i.test(href) };
    }
    else if (link && t.type === 'text' && !t.hidden) link.text += t.text;
    else if (link && t.type === 'close' && t.depth <= link.depth) {
      if (!link.hidden && link.usable && link.text.replace(/\s+/g, ' ').trim() === 'See Bob at Work') return link.href;
      link = null;
    }
  }
  return null;
}

// Every embedded Bob demo needs a visible "sample" label beside its frame
// (within 400 characters of visible text before or after it).
function unlabeledDemoFrames(html) {
  let text = '';
  const frames = [];
  for (const t of walkMarkup(html)) {
    // A space per text run keeps words in neighboring elements apart ("H" + "Sample").
    if (t.type === 'text' && !t.hidden) text += ` ${t.text.replace(/&[a-z0-9#]+;/gi, ' ')}`;
    if (t.type !== 'open' || t.name !== 'iframe') continue;
    const a = attrsOf(t.tag);
    const src = [a.get('data-src'), a.get('src')].find((v) => v?.startsWith('/bob/proof/'));
    if (src) frames.push({ src, at: text.length });
  }
  return frames.filter(({ at }) => !/\bsample\b/i.test(text.slice(Math.max(0, at - 400), at + 400))).map(({ src }) => src);
}

if (!exists(dist)) {
  fail('dist-present', 'dist', 'dist/ is missing. Run npm run build first.');
} else {
  pass('dist-present', 'dist/ exists');
}

const htmlFiles = walk(dist, (file) => file.endsWith('.html'));
const headerActions = [];
// Every shipped stylesheet and script, not only dist/assets/ (which is empty
// because Astro inlines styles; the Bob files live in dist/bob/ and dist/scripts/).
const assetFiles = walk(dist, (file) => /\.(m?js|css)$/i.test(file));
const textFiles = walk(dist, (file) => /\.(txt|xml)$/i.test(file));
const renderedFiles = [...htmlFiles, ...assetFiles, ...textFiles, path.join(dist, '_redirects')].filter(exists);

const vendorPattern = /\b(GoHighLevel|GHL|Cloudflare|Supabase|Resend|Cal\.com)\b/gi;
const bannedTokenPattern = /\b(d4a955|07070c|B47EFF|b47eff|7e4ec4|6b7eff|Instrument Serif|Inter Tight|See If I Qualify)\b/g;
const staleCopyPattern = /\b(free AI Marketing Audit|Revenue Engine|Build-Right Guarantee|Outcomes Commitment Card|Lead Drought|Manual Mayhem|Owner Trap|Reactive Mode|hidden pricing|private pricing|six-layer Ascend)\b/gi;

for (const file of renderedFiles) {
  const body = read(file);
  const allowedLegal = file.endsWith('.html') && isLegalHtml(file);
  const vendorHits = [...stripExecutableMarkup(body).matchAll(vendorPattern)].map((m) => m[0]);
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

  const loadsBobSheet = loadsStylesheet(html, '/bob/site.css', servedPath(file, route));
  if (BOB_ROUTES.has(route)) {
    if (!loadsBobSheet) fail('bob-surface-registry', rel(file), `${route} is listed as a Bob page but does not load /bob/site.css as a stylesheet`);
    const action = bobHeaderAction(html);
    if (!action) fail('locked-cta-present', rel(file), 'missing the approved Bob header action "See Bob at Work" in the visible site header');
    else headerActions.push({ file, route, href: action });
    for (const demo of unlabeledDemoFrames(html)) fail('bob-proof-sample-label', rel(file), `${route} embeds ${demo} without a sample label beside the frame`);
  } else if (BOB_PROOFS.has(route)) {
    if (!/\bnoindex\b/i.test(metaContent(html, 'robots') ?? '')) fail('bob-proof-noindex', rel(file), 'sample demo must carry <meta name="robots" content="noindex">');
    if (!/\bsample\b/i.test(`${htmlTitle(html)} ${metaContent(html, 'description') ?? ''}`)) fail('bob-proof-sample-label', rel(file), 'sample demo title or meta description must call it a sample');
  } else {
    if (loadsBobSheet) fail('bob-surface-registry', rel(file), `${route} loads /bob/site.css but is not a listed Bob route`);
    if (route.startsWith('/bob/proof/')) fail('bob-surface-registry', rel(file), `${route} is not on the approved sample demo list`);
    const ctaCount = (html.match(/See if (?:we|you)['’]re a fit/gi) ?? []).length;
    if (!LEGACY_CTA_EXEMPT.has(route) && ctaCount === 0) fail('locked-cta-present', rel(file), 'missing the accepted fit CTA');
  }

  for (const block of collectJsonLd(html)) {
    try {
      JSON.parse(block);
    } catch (error) {
      fail('jsonld-parse', rel(file), error.message);
    }
  }
}
const builtRoutes = new Set(htmlFiles.map(routeFromHtmlFile));
for (const route of [...BOB_ROUTES, ...BOB_PROOFS]) {
  if (!builtRoutes.has(route)) fail('bob-surface-registry', 'dist', `listed Bob route ${route} is missing from the build`);
}
if (!failures.some((f) => ['single-h1', 'meta-description', 'title', 'locked-cta-present', 'jsonld-parse', 'bob-surface-registry', 'bob-proof-noindex', 'bob-proof-sample-label'].includes(f.gate))) {
  pass('html-basics', `${htmlFiles.length} HTML files checked (${BOB_ROUTES.size} Bob pages, ${BOB_PROOFS.size} Bob sample demos, ${htmlFiles.length - BOB_ROUTES.size - BOB_PROOFS.size} legacy pages)`);
}
if (!failures.some((f) => f.gate === 'paid-lp-hero-wordcount')) {
  pass('paid-lp-hero-wordcount', 'paid /go/* heroes are within the 12-word clarity limit');
}

const routeSet = new Set(htmlFiles.map(routeFromHtmlFile));
routeSet.add('/');
routeSet.add('/book');
// This route is intentionally server-rendered, so it is present in the worker
// bundle rather than as dist/revenue-leak-map/index.html.
routeSet.add('/revenue-leak-map');
const STATIC_FILE = /\.(png|jpe?g|webp|avif|gif|svg|ico|txt|xml|json|webmanifest|pdf|vcf|woff2?|ttf|otf|eot|css|m?js|map|mp4|webm|html?)$/i;
// The URL path a built HTML file is served at, for resolving relative references.
function servedPath(file, route) {
  return file.endsWith(`${path.sep}index.html`) ? (route === '/' ? '/' : `${route}/`) : route;
}
// Same-origin path for a reference, normalized like a browser does ("..", "."),
// or null for other origins and schemes.
function resolveRef(ref, base) {
  // Only a malformed reference is caught; a bug here must fail loudly, never skip a check.
  let url;
  try {
    url = new URL(ref, `https://site.invalid${base}`);
  } catch {
    return null;
  }
  if (!SITE_ORIGINS.has(url.origin)) return null;
  try {
    return decodeURIComponent(url.pathname);
  } catch {
    return url.pathname;
  }
}
// A built file for a path. Pages also serves /x.html at /x and a directory's
// index.html, so a page route counts only where a page is requested (a link or
// an iframe). Scripts, images and media must be real files. Nothing outside
// dist/ counts.
function builtFor(clean, { allowRoute }) {
  const file = path.resolve(dist, `.${clean}`);
  if (file !== dist && !file.startsWith(`${dist}${path.sep}`)) return false;
  const stat = fs.statSync(file, { throwIfNoEntry: false });
  if (stat?.isFile()) return true;
  if (!allowRoute || /\.[a-z0-9]+$/i.test(clean)) return false;
  // A page route: /x or /x/ is served from x/index.html, or /x from x.html.
  if (stat?.isDirectory() && exists(path.join(file, 'index.html'))) return true;
  return !clean.endsWith('/') && exists(`${file}.html`);
}
// The built HTML file a page path is served from, or null.
function pageFileFor(clean) {
  const file = path.resolve(dist, `.${clean}`);
  if (file !== dist && !file.startsWith(`${dist}${path.sep}`)) return null;
  for (const candidate of [file, path.join(file, 'index.html'), `${file}.html`]) {
    if (fs.statSync(candidate, { throwIfNoEntry: false })?.isFile() && candidate.endsWith('.html')) return candidate;
  }
  return null;
}
let verifiedStaticRefs = 0;
for (const file of htmlFiles) {
  const route = routeFromHtmlFile(file);
  const base = servedPath(file, route);
  const html = read(file);
  const sheets = new Set(stylesheetHrefs(html));
  for (const href of hrefsFrom(html)) {
    if (sheets.has(href)) continue;
    if (/^(#|\?|\/\/|[a-z][a-z0-9+.-]*:)/i.test(href)) continue;
    if (!href.startsWith('/')) {
      // Relative links: verify the static files they name (routes stay unverified, as before).
      const clean = resolveRef(href, base);
      if (clean && STATIC_FILE.test(clean)) {
        if (builtFor(clean, { allowRoute: /\.html?$/i.test(clean) })) verifiedStaticRefs += 1;
        else fail('static-asset-link', rel(file), `${route} links to missing asset ${href}`);
      }
      continue;
    }
    if (href.startsWith('/_') || href.startsWith('/assets/') || href.startsWith('/brand/') || href.startsWith('/images/')) continue;
    const clean = href.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
    if (STATIC_FILE.test(clean)) {
      const resolved = resolveRef(clean, base);
      if (resolved && builtFor(resolved, { allowRoute: /\.html?$/i.test(resolved) })) verifiedStaticRefs += 1;
      else fail('static-asset-link', rel(file), `${route} links to missing asset ${href}`);
      continue;
    }
    if (routeSet.has(clean)) continue;
    if (expectedRedirects.some(([from]) => from === clean)) continue;
    warn('static-internal-link-unverified', rel(file), `${route} links to ${href}`);
  }
  for (const href of stylesheetHrefs(html)) {
    const clean = resolveRef(href.split('#')[0].split('?')[0], base);
    if (clean === null) continue;
    if (builtFor(clean, { allowRoute: false })) verifiedStaticRefs += 1;
    else fail('static-asset-link', rel(file), `${route} links a stylesheet that is not a built file: ${href}`);
  }
  for (const { element, ref } of srcsFrom(html)) {
    const clean = resolveRef(ref, base);
    if (clean === null) continue;
    if (builtFor(clean, { allowRoute: element === 'iframe' })) verifiedStaticRefs += 1;
    else fail('static-asset-link', rel(file), `${route} embeds missing file ${ref}`);
  }
}
// The header action must lead somewhere that exists: a built page, a known
// redirect, or a file.
for (const { file, route, href } of headerActions) {
  const [pathPart, fragment = ''] = href.split('#');
  const clean = resolveRef(pathPart.split('?')[0] || servedPath(file, route), servedPath(file, route));
  const target = clean && pageFileFor(clean);
  const redirected = clean && expectedRedirects.some(([from]) => from === (clean.replace(/\/$/, '') || '/'));
  const anchorOk = !fragment || (target && [...walkMarkup(read(target))].some((t) => t.type === 'open'
    && (attrsOf(t.tag).get('id') === fragment || (t.name === 'a' && attrsOf(t.tag).get('name') === fragment))));
  if (!(target || redirected) || !anchorOk) {
    fail('locked-cta-present', rel(file), `the "See Bob at Work" action points to a missing page or section: ${href}`);
  }
}
if (!failures.some((f) => f.gate === 'static-asset-link')) {
  pass('static-asset-link', `${verifiedStaticRefs} same-origin file references resolve in dist/`);
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
