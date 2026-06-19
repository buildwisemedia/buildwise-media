import type { APIRoute } from 'astro';

const SITE = 'https://buildwisemedia.com';

// Filesystem-glob driven sitemap — new pages auto-discovered.
// Closes the manual-drift gap noted in the SEO/AEO plan
// (~/.claude/plans/if-we-don-t-have-federated-dusk.md).
const modules = import.meta.glob('./**/*.astro');

// Pages excluded from sitemap (per robots.txt + canonical-site-files contract).
const EXCLUDE = new Set([
  '/404',
  '/book',
  '/confirmation',
  '/thank-you-resource',
  // noindex campaign landing pages — keep them out of the sitemap so we don't
  // ask crawlers to index pages that carry <meta robots noindex>.
  '/mo-calm',
  '/mo-freedom',
  '/mo-life',
  '/mo-peace',
  '/mo-time',
]);

// Priority overrides — explicit weights for high-intent surfaces.
const PRIORITY_OVERRIDES: Record<string, { priority: string; changefreq: string }> = {
  '/': { priority: '1.0', changefreq: 'weekly' },
  '/audit': { priority: '0.9', changefreq: 'weekly' },
  '/revenue-leak-map': { priority: '0.9', changefreq: 'monthly' },
  '/services/ascend': { priority: '0.9', changefreq: 'monthly' },
  '/results': { priority: '0.8', changefreq: 'weekly' },
  '/services': { priority: '0.8', changefreq: 'monthly' },
  '/how-it-works': { priority: '0.8', changefreq: 'monthly' },
  '/about': { priority: '0.7', changefreq: 'monthly' },
  '/playbook': { priority: '0.8', changefreq: 'monthly' },
  '/playbook/category-of-one-marketing': { priority: '0.7', changefreq: 'monthly' },
  '/playbook/ai-marketing-department': { priority: '0.7', changefreq: 'monthly' },
  '/playbook/ai-marketing-department-small-business': { priority: '0.7', changefreq: 'monthly' },
  '/playbook/captured-baseline': { priority: '0.7', changefreq: 'monthly' },
  '/playbook/poor-four': { priority: '0.7', changefreq: 'monthly' },
  '/playbook/fractional-cmo-alternative': { priority: '0.7', changefreq: 'monthly' },
  '/privacy': { priority: '0.3', changefreq: 'yearly' },
  '/terms': { priority: '0.3', changefreq: 'yearly' },
};

function pathToUrl(modulePath: string): string {
  // './index.astro' → '/'
  // './about.astro' → '/about'
  // './problem/invisible-market.astro' → '/problem/invisible-market'
  // './services/index.astro' → '/services'
  let url = modulePath.replace(/^\.\//, '/').replace(/\.astro$/, '');
  if (url.endsWith('/index')) url = url.replace(/\/index$/, '') || '/';
  return url;
}

// Per-route <lastmod> = the source file's last git commit date (committer date,
// YYYY-MM-DD). This endpoint is prerendered to a static file at build time (see
// _routes.json `exclude` → not in the worker bundle), so node:child_process +
// git are available here. Anything that can't resolve — git missing, shallow
// clone with no commit touching the file, or an uncommitted page — falls back
// to the build date, so the sitemap is never worse than the prior behaviour.
async function lastmodByModule(
  modulePaths: string[],
  fallback: string,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  let execFileSync: typeof import('node:child_process').execFileSync;
  try {
    ({ execFileSync } = await import('node:child_process'));
  } catch {
    for (const mp of modulePaths) out[mp] = fallback;
    return out;
  }
  for (const mp of modulePaths) {
    // glob keys are relative to this file (src/pages/); git resolves the path
    // against process.cwd() = repo root during `astro build`.
    const rel = 'src/pages/' + mp.replace(/^\.\//, '');
    try {
      const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', rel], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      out[mp] = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : fallback;
    } catch {
      out[mp] = fallback;
    }
  }
  return out;
}

export const GET: APIRoute = async () => {
  const buildDate = new Date().toISOString().slice(0, 10);

  const entries = Object.keys(modules)
    .map((mp) => ({ mp, url: pathToUrl(mp) }))
    .filter((e) => !EXCLUDE.has(e.url))
    // Skip dynamic-route files (any `[slug]`-style page); none ship today, but future-proof.
    .filter((e) => !e.url.includes('['))
    .sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));

  const lastmods = await lastmodByModule(entries.map((e) => e.mp), buildDate);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(({ mp, url }) => {
    const meta = PRIORITY_OVERRIDES[url] ?? { priority: '0.5', changefreq: 'monthly' };
    const lastmod = lastmods[mp] ?? buildDate;
    return `  <url>
    <loc>${SITE}${url === '/' ? '/' : url + '/'}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${meta.changefreq}</changefreq>
    <priority>${meta.priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
