// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { bwmGateAnnotations } from './scripts/bwm-gate-annotations.mjs';

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
  // Gate comments (@r020, @sdt-exempt, ...) stay in source for the write-time
  // gates; every published build drops them and fails if any remain.
  integrations: [bwmGateAnnotations()],
});
