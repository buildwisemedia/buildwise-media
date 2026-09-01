#!/usr/bin/env node

/**
 * BWM homepage + /book deterministic contract gate.
 *
 * This gate is deliberately rendered-output-first. Source greps can ratchet
 * green while stale copy, schema, canonicals, or links still ship from a
 * different template. Run it after `astro build` and before visual QA.
 *
 * It protects the accepted bottleneck-first homepage and direct-contact
 * conversion path. It does not score taste, authorize deployment, or claim
 * search/conversion performance.
 */

import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

const SITE_ORIGIN = 'https://buildwisemedia.com';
const MAX_PRINTED_FAILURES = 160;

function parseArgs(argv) {
  const out = { root: process.cwd(), dist: null, json: false, selfTest: false };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') out.root = path.resolve(argv[++index]);
    else if (arg === '--dist') out.dist = path.resolve(argv[++index]);
    else if (arg === '--json') out.json = true;
    else if (arg === '--self-test') out.selfTest = true;
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(64);
    }
  }
  out.dist ??= path.join(out.root, 'dist');
  return out;
}

function walk(dir, predicate = () => true, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function verifyBoundFile(issues, root, location, binding) {
  const relative = String(binding?.path ?? '').trim();
  const expected = String(binding?.sha256 ?? '').trim().toLowerCase();
  if (!relative || !/^[a-f0-9]{64}$/.test(expected)) {
    addIssue(issues, 'binding-invalid', location, 'binding requires a repository path and SHA-256');
    return;
  }
  const file = path.resolve(root, relative);
  const rootPrefix = `${path.resolve(root)}${path.sep}`;
  if (!file.startsWith(rootPrefix)) {
    addIssue(issues, 'binding-path-outside-root', location, relative);
    return;
  }
  if (!fs.existsSync(file)) {
    addIssue(issues, 'binding-source-missing', location, relative);
    return;
  }
  const actual = sha256(file);
  if (actual !== expected) addIssue(issues, 'binding-hash-mismatch', location, `${relative}: expected ${expected}, found ${actual}`);
}

function auditBindingIntegrity(root, issues) {
  const preflightPath = path.join(root, '.bwm-preflight-passed');
  const integrationPath = path.join(root, 'growth-integration/contracts/integration-manifest.json');
  const websiteSourcePath = path.join(root, 'growth-integration/contracts/website-to-content-source-manifest.json');
  const crawlerPolicyPath = path.join(root, 'growth-integration/contracts/crawler-policy.json');
  const required = [preflightPath, integrationPath, websiteSourcePath, crawlerPolicyPath];
  for (const file of required) {
    if (!fs.existsSync(file)) addIssue(issues, 'binding-contract-missing', path.relative(root, file), 'required local integration contract is missing');
  }
  if (required.some((file) => !fs.existsSync(file))) return;

  try {
    const preflight = JSON.parse(read(preflightPath));
    for (const binding of preflight.bindings ?? []) {
      verifyBoundFile(issues, root, `.bwm-preflight-passed:${binding.role ?? 'unknown'}`, binding);
    }
    const identityBinding = (preflight.bindings ?? []).find((binding) => binding.role === 'identity_record');
    if (!identityBinding || preflight.identity_record_hash !== identityBinding.sha256) {
      addIssue(issues, 'preflight-identity-hash', '.bwm-preflight-passed', 'identity_record_hash must equal the identity-record binding');
    }
  } catch (error) {
    addIssue(issues, 'preflight-invalid', '.bwm-preflight-passed', error instanceof Error ? error.message : 'invalid JSON');
  }

  try {
    const integration = JSON.parse(read(integrationPath));
    const preflightHash = sha256(preflightPath);
    if (integration.preflight_sha256 !== preflightHash) {
      addIssue(issues, 'integration-preflight-hash', 'growth-integration/contracts/integration-manifest.json', `expected ${preflightHash}`);
    }
    const contractFiles = {
      conflict_ledger_sha256: 'conflict-ledger.json',
      seo_account_contract_sha256: 'seo-account-contract.json',
      seo_intent_ownership_sha256: 'seo-intent-ownership.json',
      migration_lifecycle_sha256: 'migration-lifecycle-manifest.json',
      crawler_policy_sha256: 'crawler-policy.json',
      website_to_content_source_sha256: 'website-to-content-source-manifest.json',
    };
    for (const [key, filename] of Object.entries(contractFiles)) {
      verifyBoundFile(issues, root, `integration-manifest:${key}`, {
        path: `growth-integration/contracts/${filename}`,
        sha256: integration.local_contracts?.[key],
      });
    }
  } catch (error) {
    addIssue(issues, 'integration-manifest-invalid', 'growth-integration/contracts/integration-manifest.json', error instanceof Error ? error.message : 'invalid JSON');
  }

  try {
    const sourceManifest = JSON.parse(read(websiteSourcePath));
    for (const [role, binding] of Object.entries(sourceManifest.source_bindings ?? {})) {
      verifyBoundFile(issues, root, `website-to-content-source:${role}`, binding);
    }
  } catch (error) {
    addIssue(issues, 'website-source-manifest-invalid', 'growth-integration/contracts/website-to-content-source-manifest.json', error instanceof Error ? error.message : 'invalid JSON');
  }

  try {
    const crawlerPolicy = JSON.parse(read(crawlerPolicyPath));
    verifyBoundFile(issues, root, 'crawler-policy:robots', {
      path: 'public/robots.txt',
      sha256: crawlerPolicy.robots_sha256,
    });
  } catch (error) {
    addIssue(issues, 'crawler-policy-invalid', 'growth-integration/contracts/crawler-policy.json', error instanceof Error ? error.message : 'invalid JSON');
  }
}

function auditMigrationLifecycle(root, sitemapRoutes, issues) {
  const lifecyclePath = path.join(root, 'growth-integration/contracts/migration-lifecycle-manifest.json');
  const redirectsPath = path.join(root, 'public/_redirects');
  if (!fs.existsSync(lifecyclePath) || !fs.existsSync(redirectsPath)) {
    addIssue(issues, 'migration-contract-missing', 'growth-integration/contracts/migration-lifecycle-manifest.json', 'lifecycle manifest and public/_redirects are required');
    return;
  }
  try {
    const lifecycle = JSON.parse(read(lifecyclePath));
    if (lifecycle.candidate_sitemap_denominator !== sitemapRoutes.size) {
      addIssue(issues, 'migration-denominator-mismatch', 'growth-integration/contracts/migration-lifecycle-manifest.json', `contract ${lifecycle.candidate_sitemap_denominator}; rendered ${sitemapRoutes.size}`);
    }
    const rules = new Map();
    for (const rawLine of read(redirectsPath).split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const [source, destination, status] = line.split(/\s+/);
      if (source && destination && status) rules.set(normalizePathname(source), { destination, status: Number(status) });
    }
    const lifecycleRoutes = new Set();
    for (const redirect of lifecycle.redirects_added ?? []) {
      const route = normalizePathname(redirect.route);
      if (!route) {
        addIssue(issues, 'migration-redirect-route-invalid', 'migration-lifecycle-manifest.json', String(redirect.route ?? '(missing)'));
        continue;
      }
      if (lifecycleRoutes.has(route)) addIssue(issues, 'migration-redirect-duplicate', route, 'redirect route appears more than once');
      lifecycleRoutes.add(route);
      if (sitemapRoutes.has(route)) addIssue(issues, 'migration-redirect-in-sitemap', route, 'redirect source remains in the sitemap denominator');
      const rule = rules.get(route);
      if (!rule || rule.destination !== redirect.destination || rule.status !== redirect.status) {
        addIssue(issues, 'migration-edge-rule-mismatch', route, `expected ${redirect.destination} ${redirect.status}`);
      }
      const targetRoute = normalizePathname(redirect.destination);
      if (!targetRoute || !sitemapRoutes.has(targetRoute)) {
        addIssue(issues, 'migration-target-outside-sitemap', route, `target ${redirect.destination} is not a current sitemap URL`);
      }
      if ((lifecycle.redirects_added ?? []).some((candidate) => normalizePathname(candidate.route) === targetRoute)) {
        addIssue(issues, 'migration-redirect-chain', route, `target ${redirect.destination} is another redirect source`);
      }
    }
  } catch (error) {
    addIssue(issues, 'migration-contract-invalid', 'growth-integration/contracts/migration-lifecycle-manifest.json', error instanceof Error ? error.message : 'invalid JSON');
  }
}

function routeFromHtmlFile(dist, file) {
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  if (relative === 'index.html') return '/';
  if (relative === '404.html') return '/404';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'/index.html'.length)}/`;
  return `/${relative}`;
}

function expectedCanonical(route) {
  if (route === '/') return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${route.endsWith('/') ? route : `${route}/`}`;
}

function attribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return match?.[2]?.trim() ?? '';
}

function metaContent(html, name) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (attribute(tag, 'name').toLowerCase() === name.toLowerCase()) return attribute(tag, 'content');
  }
  return '';
}

function canonicalLinks(html) {
  return (html.match(/<link\b[^>]*>/gi) ?? [])
    .filter((tag) => attribute(tag, 'rel').toLowerCase().split(/\s+/).includes('canonical'))
    .map((tag) => attribute(tag, 'href'))
    .filter(Boolean);
}

function htmlTitle(html) {
  return decodeEntities(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim();
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&rsquo;/gi, '’')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function visibleText(fragment) {
  return decodeEntities(fragment)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function anchors(html) {
  const out = [];
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const tag = `<a${match[1]}>`;
    out.push({ href: attribute(tag, 'href'), text: visibleText(match[2]) });
  }
  return out;
}

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[2].trim());
}

function collectSchemaTypes(value, out = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectSchemaTypes(item, out);
    return out;
  }
  if (!value || typeof value !== 'object') return out;
  const type = value['@type'];
  if (Array.isArray(type)) type.forEach((item) => out.add(String(item)));
  else if (type) out.add(String(type));
  Object.values(value).forEach((item) => collectSchemaTypes(item, out));
  return out;
}

function collectSchemaKeys(value, out = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectSchemaKeys(item, out);
    return out;
  }
  if (!value || typeof value !== 'object') return out;
  for (const [key, item] of Object.entries(value)) {
    out.add(key);
    collectSchemaKeys(item, out);
  }
  return out;
}

function schemaNodes(value) {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(schemaNodes);
  const graph = Array.isArray(value['@graph']) ? value['@graph'] : [];
  return [value, ...graph.flatMap(schemaNodes)];
}

function normalizePathname(value) {
  try {
    const url = new URL(value, SITE_ORIGIN);
    if (url.origin !== new URL(SITE_ORIGIN).origin) return '';
    return url.pathname.endsWith('/') || url.pathname === '/' ? url.pathname : `${url.pathname}/`;
  } catch {
    return '';
  }
}

const STALE_COPY_RULES = [
  {
    code: 'stale-revenue-leak-map',
    pattern: /\brevenue\s+leak\s+map\b|\bget\s+my\s+free\b|\bfree\s+(?:ai\s+|marketing\s+)?audit\b/i,
    detail: 'retired Revenue Leak Map/free-audit offer copy',
  },
  {
    code: 'stale-45-day-delivery',
    pattern: /\b45[\s-]*day(?:s)?\b/i,
    detail: 'retired 45-day delivery language',
  },
  {
    code: 'stale-30-day-install',
    pattern: /\b30[\s-]*day(?:s)?\b/i,
    detail: 'retired 30-day install language',
  },
  {
    code: 'stale-eight-layer-system',
    pattern: /\b(?:8|eight)[\s-]*layer(?:s)?\b/i,
    detail: 'retired eight-layer system language',
  },
  {
    code: 'stale-public-pricing',
    pattern: /\$(?:7,?000|15,?000|25,?000)|\btransparent\s+pricing\b|\bper\s+month\s+plus\b|\bterritory\s+lock\b/i,
    detail: 'retired public price/tier language',
  },
];

const FORBIDDEN_SCHEMA_TYPES = new Set([
  'AggregateRating',
  'FAQPage',
  'LocalBusiness',
  'ProfessionalService',
  'SpeakableSpecification',
]);

const FORBIDDEN_SCHEMA_KEYS = new Set([
  'aggregateRating',
  'offers',
  'price',
  'priceCurrency',
  'priceRange',
  'speakable',
]);

const SCOPED_COPY_ROUTES = new Set(['/', '/book/']);
const FORBIDDEN_ACTION_PATHS = new Set(['/contact/', '/pricing/', '/revenue-leak-map/']);
const SSR_SITEMAP_ROUTES = new Map([
  ['/revenue-leak-map/', 'src/pages/revenue-leak-map.astro'],
]);

function addIssue(issues, code, location, detail) {
  issues.push({ code, location, detail });
}

function scanStaleCopy(issues, location, content) {
  for (const rule of STALE_COPY_RULES) {
    if (rule.pattern.test(content)) addIssue(issues, rule.code, location, rule.detail);
  }
}

function latestInputMtime(root) {
  const candidates = [
    ...walk(path.join(root, 'src'), () => true),
    ...walk(path.join(root, 'public'), () => true),
    path.join(root, 'astro.config.mjs'),
  ].filter((file) => fs.existsSync(file));
  return candidates.reduce((latest, file) => Math.max(latest, fs.statSync(file).mtimeMs), 0);
}

function audit({ root, dist, skipFreshness = false }) {
  const issues = [];
  if (!fs.existsSync(dist)) {
    addIssue(issues, 'dist-missing', path.relative(root, dist) || 'dist', 'rendered build directory is missing');
    return issues;
  }

  const htmlFiles = walk(dist, (file) => file.endsWith('.html') && !file.includes(`${path.sep}_worker.js${path.sep}`));
  const pages = new Map(htmlFiles.map((file) => {
    const route = routeFromHtmlFile(dist, file);
    return [route, { file, route, html: read(file) }];
  }));

  if (!skipFreshness) {
    auditBindingIntegrity(root, issues);
    const representative = path.join(dist, 'index.html');
    if (!fs.existsSync(representative)) {
      addIssue(issues, 'homepage-render-missing', 'dist/index.html', 'homepage was not rendered');
    } else if (latestInputMtime(root) > fs.statSync(representative).mtimeMs + 1) {
      addIssue(issues, 'dist-stale', 'dist/index.html', 'source/public input is newer than the rendered homepage; rebuild before trusting QA');
    }
  }

  const sitemapFile = path.join(dist, 'sitemap.xml');
  if (!fs.existsSync(sitemapFile)) {
    addIssue(issues, 'sitemap-missing', 'dist/sitemap.xml', 'sitemap is required for indexation and canonical checks');
  }
  const sitemap = fs.existsSync(sitemapFile) ? read(sitemapFile) : '';
  const sitemapUrls = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim());
  const sitemapRoutes = new Map();
  for (const urlValue of sitemapUrls) {
    let url;
    try {
      url = new URL(urlValue);
    } catch {
      addIssue(issues, 'sitemap-url-invalid', 'dist/sitemap.xml', `invalid <loc>: ${urlValue}`);
      continue;
    }
    if (url.origin !== SITE_ORIGIN) {
      addIssue(issues, 'sitemap-origin', 'dist/sitemap.xml', `unexpected sitemap origin: ${url.origin}`);
    }
    const route = normalizePathname(urlValue);
    if (sitemapRoutes.has(route)) addIssue(issues, 'sitemap-duplicate', route, 'duplicate sitemap URL');
    sitemapRoutes.set(route, urlValue);
  }

  for (const [route, page] of pages) {
    const robots = metaContent(page.html, 'robots').toLowerCase();
    const isNoindex = robots.split(/[\s,]+/).includes('noindex');
    const isUtility404 = route === '/404';
    const inSitemap = sitemapRoutes.has(route);

    if (route === '/' && isNoindex) {
      addIssue(issues, 'homepage-noindex', route, 'the production homepage cannot carry noindex');
    }
    if (inSitemap && isNoindex) {
      addIssue(issues, 'sitemap-noindex', route, 'sitemap URL renders noindex');
    }
    if (!isNoindex && !inSitemap && !isUtility404) {
      addIssue(issues, 'indexable-missing-sitemap', route, 'indexable HTML is absent from the sitemap denominator');
    }
    if (route === '/book/') {
      if (isNoindex || !robots.split(/[\s,]+/).includes('index') || !robots.split(/[\s,]+/).includes('follow')) {
        addIssue(issues, 'book-indexation', route, '/book must be index,follow in the production candidate');
      }
      if (!inSitemap) addIssue(issues, 'book-missing-sitemap', route, '/book must be in the sitemap denominator');
    }

    // The accepted integration changes only the homepage and /book copy. Legacy
    // inner pages remain lifecycle candidates until an explicit migration
    // decision exists, so copy retirement is enforced only on the authorized
    // surfaces plus the machine-readable summaries below.
    if (SCOPED_COPY_ROUTES.has(route)) scanStaleCopy(issues, route, page.html);

    const pageAnchors = anchors(page.html);
    const isAuthorizedCopySurface = SCOPED_COPY_ROUTES.has(route);
    for (const anchor of pageAnchors) {
      const pathname = normalizePathname(anchor.href);
      if (isAuthorizedCopySurface && anchor.href && FORBIDDEN_ACTION_PATHS.has(pathname)) {
        addIssue(issues, 'retired-internal-action', route, `${anchor.text || 'link'} points to retired ${pathname}`);
      }
      if (isAuthorizedCopySurface && (/^(?:https?:)?\/\/(?:book\.)?cal\.com\b/i.test(anchor.href) || /book\.buildwisemedia\.com/i.test(anchor.href))) {
        addIssue(issues, 'scheduler-action', route, 'scheduler link violates the direct-contact /book contract');
      }
      if (/^see\s+if\s+you(?:'|’)?re\s+a\s+fit$/i.test(anchor.text)) {
        if (pathname !== '/book/') {
          addIssue(issues, 'fit-cta-target', route, `"${anchor.text}" must point to /book, found ${anchor.href || '(empty)'}`);
        }
      }
      if (isAuthorizedCopySurface && /\b(?:get my free|revenue leak map|free audit|schedule (?:a )?call|book (?:a )?call)\b/i.test(anchor.text)) {
        addIssue(issues, 'retired-cta-label', route, `retired action label: ${anchor.text}`);
      }
    }

    const blocks = jsonLdBlocks(page.html);
    if (!isNoindex && !isUtility404 && blocks.length === 0) {
      addIssue(issues, 'schema-missing', route, 'indexable page has no rendered JSON-LD graph');
    }
    if (isAuthorizedCopySurface && blocks.length > 1) {
      addIssue(issues, 'schema-multiple-blocks', route, `${blocks.length} JSON-LD blocks found; emit one coherent graph`);
    }
    for (const block of blocks) {
      let payload;
      try {
        payload = JSON.parse(block);
      } catch (error) {
        addIssue(issues, 'schema-invalid-json', route, error instanceof Error ? error.message : 'invalid JSON-LD');
        continue;
      }
      if (SCOPED_COPY_ROUTES.has(route)) {
        for (const type of collectSchemaTypes(payload)) {
          if (FORBIDDEN_SCHEMA_TYPES.has(type)) addIssue(issues, 'schema-forbidden-type', route, `retired/unsupported @type ${type}`);
        }
        for (const key of collectSchemaKeys(payload)) {
          if (FORBIDDEN_SCHEMA_KEYS.has(key)) addIssue(issues, 'schema-forbidden-key', route, `retired/unsupported schema key ${key}`);
        }
      }
      const canonical = canonicalLinks(page.html)[0] ?? '';
      const title = htmlTitle(page.html);
      const description = metaContent(page.html, 'description');
      for (const node of isAuthorizedCopySurface ? schemaNodes(payload) : []) {
        const nodeTypes = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
        if (!nodeTypes.includes('WebPage')) continue;
        if (node.url && canonical && node.url !== canonical) {
          addIssue(issues, 'schema-canonical-conflict', route, `WebPage.url ${node.url} contradicts canonical ${canonical}`);
        }
        if (node.name && title && decodeEntities(String(node.name)).trim() !== title) {
          addIssue(issues, 'schema-title-conflict', route, 'WebPage.name contradicts the rendered <title>');
        }
        if (node.description && description && decodeEntities(String(node.description)).trim() !== decodeEntities(description).trim()) {
          addIssue(issues, 'schema-description-conflict', route, 'WebPage.description contradicts the meta description');
        }
      }
    }
  }

  const home = pages.get('/');
  if (!home) {
    addIssue(issues, 'homepage-render-missing', '/', 'homepage HTML is missing');
  } else {
    const fitLinks = anchors(home.html).filter((anchor) => /^see\s+if\s+you(?:'|’)?re\s+a\s+fit$/i.test(anchor.text));
    if (fitLinks.length === 0) addIssue(issues, 'homepage-fit-cta-missing', '/', 'homepage needs a visible “See if you’re a fit” link');
    const canonicals = canonicalLinks(home.html);
    if (canonicals.length !== 1 || canonicals[0] !== `${SITE_ORIGIN}/`) {
      addIssue(issues, 'homepage-canonical', '/', `expected one canonical ${SITE_ORIGIN}/, found ${canonicals.join(', ') || '(none)'}`);
    }
  }

  for (const [route, urlValue] of sitemapRoutes) {
    const page = pages.get(route);
    if (!page) {
      const source = SSR_SITEMAP_ROUTES.get(route);
      if (!source || !fs.existsSync(path.join(root, source))) {
        addIssue(issues, 'sitemap-render-missing', route, 'sitemap URL has no rendered HTML or declared SSR source');
      }
      continue;
    }
    const canonicals = canonicalLinks(page.html);
    if (canonicals.length !== 1) {
      addIssue(issues, 'canonical-count', route, `expected one canonical, found ${canonicals.length}`);
    } else if (canonicals[0] !== urlValue) {
      addIssue(issues, 'canonical-mismatch', route, `canonical ${canonicals[0]} does not equal sitemap URL ${urlValue}`);
    }
  }

  if (!skipFreshness) {
    const ownershipFile = path.join(root, 'growth-integration', 'contracts', 'seo-intent-ownership.json');
    if (!fs.existsSync(ownershipFile)) {
      addIssue(issues, 'intent-ownership-missing', 'growth-integration/contracts/seo-intent-ownership.json', 'rendered sitemap needs an explicit route-to-intent contract');
    } else {
      try {
        const ownership = JSON.parse(read(ownershipFile));
        const entries = Array.isArray(ownership.entries) ? ownership.entries : [];
        const byRoute = new Map();
        const byIntent = new Map();
        for (const entry of entries) {
          const route = normalizePathname(entry?.route ?? '');
          const intent = String(entry?.primary_intent ?? '').trim();
          if (!route) addIssue(issues, 'intent-route-invalid', 'seo-intent-ownership.json', 'entry has an invalid route');
          else if (byRoute.has(route)) addIssue(issues, 'intent-route-duplicate', route, 'route appears more than once in the ownership manifest');
          else byRoute.set(route, entry);
          const intentKey = intent.toLowerCase();
          if (!intent) addIssue(issues, 'intent-primary-missing', route || 'seo-intent-ownership.json', 'primary_intent is required');
          else if (byIntent.has(intentKey)) addIssue(issues, 'intent-primary-duplicate', route, `primary intent also belongs to ${byIntent.get(intentKey)}`);
          else byIntent.set(intentKey, route);
          if (!String(entry?.page_job ?? '').trim()) addIssue(issues, 'intent-page-job-missing', route || 'seo-intent-ownership.json', 'page_job is required');
        }
        for (const route of sitemapRoutes.keys()) {
          const entry = byRoute.get(route);
          if (!entry) {
            addIssue(issues, 'intent-route-unowned', route, 'sitemap URL has no intent owner');
            continue;
          }
          const page = pages.get(route);
          if (!page) continue;
          const renderedTitle = htmlTitle(page.html);
          const renderedH1 = visibleText(page.html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '');
          if (String(entry.title ?? '').trim() !== renderedTitle) addIssue(issues, 'intent-title-stale', route, 'manifest title does not match rendered title');
          if (String(entry.h1 ?? '').trim() !== renderedH1) addIssue(issues, 'intent-h1-stale', route, 'manifest H1 does not match rendered H1');
        }
        for (const route of byRoute.keys()) {
          if (!sitemapRoutes.has(route)) addIssue(issues, 'intent-route-outside-sitemap', route, 'manifest owns a URL outside the current sitemap denominator');
        }
      } catch (error) {
        addIssue(issues, 'intent-ownership-invalid', 'seo-intent-ownership.json', error instanceof Error ? error.message : 'invalid JSON');
      }
    }
  }

  if (!skipFreshness) auditMigrationLifecycle(root, sitemapRoutes, issues);

  const book = pages.get('/book/');
  if (!book) {
    addIssue(issues, 'conversion-page-missing', '/book/', 'direct-contact page is missing');
  } else {
    const bookCanonical = canonicalLinks(book.html);
    if (bookCanonical.length !== 1 || bookCanonical[0] !== `${SITE_ORIGIN}/book/`) {
      addIssue(issues, 'book-canonical', '/book/', `expected ${SITE_ORIGIN}/book/`);
    }
    const requiredFields = ['contact_name', 'work_email', 'bottleneck', 'contact_permission'];
    if (!/<form\b[^>]*id\s*=\s*(["'])contact-form\1/i.test(book.html)) {
      addIssue(issues, 'conversion-form', '/book/', 'direct contact form #contact-form is missing');
    }
    for (const field of requiredFields) {
      const re = new RegExp(`\\bname\\s*=\\s*(["'])${field}\\1`, 'i');
      if (!re.test(book.html)) addIssue(issues, 'conversion-field', '/book/', `missing required field ${field}`);
    }
    if (!/fetch\s*\(\s*(["'])\/api\/book\1/i.test(book.html)) {
      addIssue(issues, 'conversion-endpoint', '/book/', 'form must submit to same-origin /api/book');
    }
    for (const flag of ['ok', 'captured', 'emailed', 'receipt_recorded']) {
      const re = new RegExp(`result\\.${flag}\\s*===\\s*true`);
      if (!re.test(book.html)) addIssue(issues, `conversion-client-${flag}-guard`, '/book/', `success state must require result.${flag} === true`);
    }
    if (!/Nothing (?:was|has been) sent/i.test(book.html)) {
      addIssue(issues, 'conversion-failure-copy', '/book/', 'failure path must state that nothing was sent');
    }
    if (/\b(?:take (?:the|our) quiz|start (?:the )?quiz|score your|your quiz score|cal\.com|schedule (?:a )?call|book (?:a )?call)\b/i.test(visibleText(book.html))) {
      addIssue(issues, 'conversion-funnel-drift', '/book/', 'quiz/scheduler language violates the direct contact-form decision');
    }
    if (!/track\s*\(\s*(["'])fit_note_submitted\1/.test(book.html)) {
      addIssue(issues, 'conversion-event', '/book/', 'confirmed delivery must emit fit_note_submitted');
    }
  }

  const apiFile = path.join(root, 'src/pages/api/book.js');
  if (!fs.existsSync(apiFile)) {
    addIssue(issues, 'conversion-api-missing', 'src/pages/api/book.js', 'same-origin relay is missing');
  } else {
    const api = read(apiFile);
    for (const flag of ['ok', 'captured', 'emailed', 'receipt_recorded']) {
      const re = new RegExp(`result\\?\\.${flag}\\s*===\\s*true`);
      if (!re.test(api)) addIssue(issues, `conversion-api-${flag}-guard`, 'src/pages/api/book.js', `upstream success must require ${flag} === true`);
    }
    if (!/incomplete_intake_response/.test(api)) {
      addIssue(issues, 'conversion-api-false-success', 'src/pages/api/book.js', 'partial upstream success must fail closed');
    }
  }

  for (const filename of ['llms.txt', 'llms-full.txt']) {
    const file = path.join(dist, filename);
    if (fs.existsSync(file)) scanStaleCopy(issues, `/${filename}`, read(file));
  }

  // One actionable row per rule/location. Repeated nav/footer links and a
  // schema graph with several forbidden keys should not drown the actual page
  // inventory problem in hundreds of near-identical failures.
  const deduped = new Map();
  for (const issue of issues) {
    const key = `${issue.code}\u0000${issue.location}`;
    const prior = deduped.get(key);
    if (!prior) {
      deduped.set(key, issue);
      continue;
    }
    const details = new Set(prior.detail.split(' | '));
    details.add(issue.detail);
    prior.detail = [...details].slice(0, 4).join(' | ');
  }
  return [...deduped.values()].sort((a, b) =>
    a.code.localeCompare(b.code) || a.location.localeCompare(b.location) || a.detail.localeCompare(b.detail));
}

function baseIndexHtml({ cta = '/book/', ctaAttribute = 'href', noindex = false, canonical = `${SITE_ORIGIN}/`, body = '', schemaType = 'Organization' } = {}) {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': schemaType, name: 'Buildwise Media', url: SITE_ORIGIN },
      {
        '@type': 'WebPage',
        url: canonical,
        name: 'Fix the bottleneck | Buildwise Media',
        description: 'Buildwise builds a custom AI system around the bottleneck holding back growth.',
      },
    ],
  };
  return `<!doctype html><html><head>
<title>Fix the bottleneck | Buildwise Media</title>
<meta name="description" content="Buildwise builds a custom AI system around the bottleneck holding back growth.">
${noindex ? '<meta name="robots" content="noindex,nofollow">' : ''}
<link rel="canonical" href="${canonical}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head><body><h1>Fix the bottleneck holding back your growth.</h1>${body}<a ${ctaAttribute}="${cta}">See if you’re a fit</a></body></html>`;
}

function baseBookHtml({ receiptGuard = true } = {}) {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', name: 'Buildwise Media', url: `${SITE_ORIGIN}/` },
      {
        '@type': ['WebPage', 'ContactPage'],
        url: `${SITE_ORIGIN}/book/`,
        name: 'See If We’re a Fit | Buildwise Media',
        description: 'Tell Buildwise what is getting in the way of growth.',
      },
    ],
  };
  return `<!doctype html><html><head>
<title>See If We’re a Fit | Buildwise Media</title>
<meta name="description" content="Tell Buildwise what is getting in the way of growth.">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${SITE_ORIGIN}/book/">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head><body><form id="contact-form" action="/book/">
<input name="contact_name"><input name="work_email"><textarea name="bottleneck"></textarea><input name="contact_permission" type="checkbox">
<button>Send to Buildwise</button></form><p>Nothing was sent.</p>
<script>async function send(){const response=await fetch("/api/book",{method:"POST"});const result=await response.json();
if(result.ok === true && result.captured === true && result.emailed === true${receiptGuard ? ' && result.receipt_recorded === true' : ''}){track("fit_note_submitted");document.body.dataset.sent="true";}}</script>
</body></html>`;
}

function baseApiSource({ receiptGuard = true } = {}) {
  return `export async function handle(){const result={};if(result?.ok === true && result?.captured === true && result?.emailed === true${receiptGuard ? ' && result?.receipt_recorded === true' : ''}) return result;return {error:"incomplete_intake_response"};}`;
}

function writeFixture(root, variant = {}) {
  const dist = path.join(root, 'dist');
  fs.mkdirSync(path.join(dist, 'book'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src/pages/api'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src/pages/api/book.js'), baseApiSource({ receiptGuard: variant.receiptGuard !== false }));
  fs.writeFileSync(path.join(dist, 'index.html'), baseIndexHtml(variant));
  fs.writeFileSync(path.join(dist, 'book/index.html'), baseBookHtml({ receiptGuard: variant.receiptGuard !== false }));
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0"?><urlset><url><loc>${SITE_ORIGIN}/</loc></url><url><loc>${SITE_ORIGIN}/book/</loc></url></urlset>`);
  return { root, dist };
}

function runSelfTest() {
  const cases = [
    ['stale offer copy', { body: '<p>Get my free Revenue Leak Map.</p>' }, 'stale-revenue-leak-map'],
    ['public pricing', { body: '<p>Ascend is $15,000.</p>' }, 'stale-public-pricing'],
    ['wrong CTA target', { cta: '/contact/' }, 'fit-cta-target'],
    ['off-origin CTA target', { cta: 'https://other.example/book/' }, 'fit-cta-target'],
    ['malformed CTA attribute', { ctaAttribute: 'data-href' }, 'fit-cta-target'],
    ['unintended noindex', { noindex: true }, 'homepage-noindex'],
    ['wrong canonical', { canonical: 'https://example.com/' }, 'canonical-mismatch'],
    ['broken conversion receipt guard', { receiptGuard: false }, 'conversion-client-receipt_recorded-guard'],
    ['contradictory schema', { schemaType: 'FAQPage' }, 'schema-forbidden-type'],
  ];

  const baselineRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bwm-growth-qa-baseline-'));
  try {
    const baseline = writeFixture(baselineRoot);
    const baselineIssues = audit({ ...baseline, skipFreshness: true });
    if (baselineIssues.length) {
      console.error('SELF-TEST FAIL · valid baseline was rejected');
      baselineIssues.forEach((issue) => console.error(`  ${issue.code} · ${issue.location} · ${issue.detail}`));
      return 1;
    }
  } finally {
    fs.rmSync(baselineRoot, { recursive: true, force: true });
  }

  const bindingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bwm-growth-qa-binding-'));
  try {
    fs.writeFileSync(path.join(bindingRoot, 'bound.txt'), 'current bytes');
    const bindingIssues = [];
    verifyBoundFile(bindingIssues, bindingRoot, 'negative-control', {
      path: 'bound.txt',
      sha256: crypto.createHash('sha256').update('stale bytes').digest('hex'),
    });
    if (!bindingIssues.some((issue) => issue.code === 'binding-hash-mismatch')) {
      console.error('SELF-TEST FAIL · stale bound bytes did not produce binding-hash-mismatch');
      return 1;
    }
    console.log('SELF-TEST PASS · stale bound bytes → binding-hash-mismatch');
  } finally {
    fs.rmSync(bindingRoot, { recursive: true, force: true });
  }

  const migrationRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bwm-growth-qa-migration-'));
  try {
    fs.mkdirSync(path.join(migrationRoot, 'growth-integration/contracts'), { recursive: true });
    fs.mkdirSync(path.join(migrationRoot, 'public'), { recursive: true });
    fs.writeFileSync(path.join(migrationRoot, 'growth-integration/contracts/migration-lifecycle-manifest.json'), JSON.stringify({
      candidate_sitemap_denominator: 2,
      redirects_added: [],
    }));
    fs.writeFileSync(path.join(migrationRoot, 'public/_redirects'), '');
    const migrationIssues = [];
    auditMigrationLifecycle(migrationRoot, new Set(['/']), migrationIssues);
    if (!migrationIssues.some((issue) => issue.code === 'migration-denominator-mismatch')) {
      console.error('SELF-TEST FAIL · stale migration denominator did not produce migration-denominator-mismatch');
      return 1;
    }
    console.log('SELF-TEST PASS · stale migration denominator → migration-denominator-mismatch');
  } finally {
    fs.rmSync(migrationRoot, { recursive: true, force: true });
  }

  let failed = false;
  for (const [name, variant, expectedCode] of cases) {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bwm-growth-qa-negative-'));
    try {
      const fixture = writeFixture(fixtureRoot, variant);
      const issues = audit({ ...fixture, skipFreshness: true });
      if (!issues.some((issue) => issue.code === expectedCode)) {
        failed = true;
        console.error(`SELF-TEST FAIL · ${name} did not produce ${expectedCode}`);
      } else {
        console.log(`SELF-TEST PASS · ${name} → ${expectedCode}`);
      }
    } finally {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    }
  }
  return failed ? 1 : 0;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.selfTest) process.exit(runSelfTest());

  const issues = audit(args);
  if (args.json) {
    console.log(JSON.stringify({ gate: 'bwm-homepage-book-contract', ok: issues.length === 0, failures: issues }, null, 2));
  } else if (issues.length === 0) {
    console.log('BWM homepage + /book contract QA passed.');
  } else {
    console.error(`BWM homepage + /book contract QA failed: ${issues.length} finding(s).`);
    for (const issue of issues.slice(0, MAX_PRINTED_FAILURES)) {
      console.error(`  FAIL · ${issue.code} · ${issue.location} · ${issue.detail}`);
    }
    if (issues.length > MAX_PRINTED_FAILURES) {
      console.error(`  … ${issues.length - MAX_PRINTED_FAILURES} additional finding(s) omitted`);
    }
  }
  process.exit(issues.length ? 1 : 0);
}

main();
