import type { APIRoute } from 'astro';

const SITE = 'https://buildwisemedia.com';

// Filesystem-glob driven sitemap — new pages auto-discovered.
// Closes the manual-drift gap noted in the SEO/AEO plan
// (~/.claude/plans/if-we-don-t-have-federated-dusk.md).
const modules = import.meta.glob('./**/*.astro');

// Pages excluded from sitemap (per robots.txt + canonical-site-files contract).
const EXCLUDE = new Set([
  '/404',
  '/confirmation',
  '/thank-you-resource',
]);

// Priority overrides — explicit weights for high-intent surfaces.
const PRIORITY_OVERRIDES: Record<string, { priority: string; changefreq: string }> = {
  '/': { priority: '1.0', changefreq: 'weekly' },
  '/audit': { priority: '0.9', changefreq: 'weekly' },
  '/book': { priority: '0.9', changefreq: 'monthly' },
  '/services/ascend': { priority: '0.9', changefreq: 'monthly' },
  '/results': { priority: '0.8', changefreq: 'weekly' },
  '/services': { priority: '0.8', changefreq: 'monthly' },
  '/how-it-works': { priority: '0.8', changefreq: 'monthly' },
  '/about': { priority: '0.7', changefreq: 'monthly' },
  '/playbook': { priority: '0.8', changefreq: 'monthly' },
  '/playbook/category-of-one-marketing': { priority: '0.7', changefreq: 'monthly' },
  '/playbook/ai-marketing-department': { priority: '0.7', changefreq: 'monthly' },
  '/playbook/captured-baseline': { priority: '0.7', changefreq: 'monthly' },
  '/playbook/poor-four': { priority: '0.7', changefreq: 'monthly' },
  '/playbook/fractional-cmo-alternative': { priority: '0.7', changefreq: 'monthly' },
  '/privacy': { priority: '0.3', changefreq: 'yearly' },
  '/terms': { priority: '0.3', changefreq: 'yearly' },
};

function pathToUrl(modulePath: string): string {
  // './index.astro' → '/'
  // './about.astro' → '/about'
  // './problem/lead-drought.astro' → '/problem/lead-drought'
  // './services/index.astro' → '/services'
  let url = modulePath.replace(/^\.\//, '/').replace(/\.astro$/, '');
  if (url.endsWith('/index')) url = url.replace(/\/index$/, '') || '/';
  return url;
}

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = Object.keys(modules)
    .map(pathToUrl)
    .filter((url) => !EXCLUDE.has(url))
    // Skip dynamic-route files (any `[slug]`-style page); none ship today, but future-proof.
    .filter((url) => !url.includes('['))
    .sort();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((url) => {
    const meta = PRIORITY_OVERRIDES[url] ?? { priority: '0.5', changefreq: 'monthly' };
    return `  <url>
    <loc>${SITE}${url === '/' ? '/' : url}</loc>
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
