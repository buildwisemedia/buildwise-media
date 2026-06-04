import { defineMiddleware } from 'astro:middleware';
import metros from './data/metros.json';

type MetroEntry = {
  name: string;
  slug: string;
  country: string;
  aliases: string[];
};

const metroIndex: Map<string, MetroEntry> = (() => {
  const idx = new Map<string, MetroEntry>();
  for (const entry of Object.values(metros as Record<string, MetroEntry>)) {
    for (const alias of entry.aliases) {
      idx.set(alias.toLowerCase(), entry);
    }
  }
  return idx;
})();

// Routes that opt into SSR via `export const prerender = false` and consume
// Astro.locals.metro. Reading request.headers on prerendered routes triggers
// Astro build-time warnings, so we gate the header lookup on this allowlist.
const SSR_ROUTES = new Set(['/']);

// Security headers mirrored from public/_headers. Cloudflare Pages applies the
// _headers file only to static/prerendered responses; SSR routes are served by
// the Pages Function (worker), which _headers does NOT cover. Setting them here
// closes that gap so SSR responses (e.g. the homepage) carry the same headers.
// Keep these values identical to public/_headers.
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Strict-Transport-Security': 'max-age=31536000',
};

export const onRequest = defineMiddleware(async (context, next) => {
  let known = false;
  let name: string | null = null;
  let slug: string | null = null;

  if (SSR_ROUTES.has(context.url.pathname)) {
    const city = context.request.headers.get('cf-ipcity');
    const country = context.request.headers.get('cf-ipcountry');

    if (city) {
      const match = metroIndex.get(city.trim().toLowerCase());
      if (match && (!country || match.country === country.toUpperCase())) {
        known = true;
        name = match.name;
        slug = match.slug;
      }
    }
  }

  context.locals.metro = { known, name, slug };

  const response = await next();

  // At runtime the Cloudflare adapter only invokes middleware for SSR routes,
  // so this applies the headers exactly where _headers cannot reach. For
  // prerendered routes during `astro build` it is a harmless no-op (their static
  // output is served with _headers applied by _headers file).
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
});
