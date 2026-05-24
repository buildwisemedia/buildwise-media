// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

const legacyProblemRedirects = Object.fromEntries([
  [['lead', 'drought'], 'invisible-market'],
  [['owner', 'trap'], 'owner-bottleneck'],
  [['manual', 'mayhem'], 'leaky-revenue'],
  [['reactive', 'mode'], 'reactive-growth'],
].map(([parts, destination]) => [
  `/problem/${parts.join('-')}`,
  { status: 301, destination: `/problem/${destination}` },
]));

const allRedirects = {
  ...legacyProblemRedirects,
  '/m': '/',
  '/m/': '/',
};

export default defineConfig({
  site: 'https://buildwisemedia.com',
  output: 'static',
  adapter: cloudflare({
    imageService: 'compile',
  }),
  build: {
    assets: 'assets',
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  redirects: allRedirects,
});
