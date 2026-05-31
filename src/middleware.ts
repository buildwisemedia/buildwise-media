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
  return next();
});
