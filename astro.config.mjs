// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://buildwisemedia.com',
  output: 'static',
  build: {
    assets: 'assets',
    inlineStylesheets: 'always',
  },
  compressHTML: true,
  redirects: {
    '/problem/lead-drought': { status: 301, destination: '/problem/invisible-market' },
    '/problem/owner-trap': { status: 301, destination: '/problem/owner-bottleneck' },
    '/problem/manual-mayhem': { status: 301, destination: '/problem/leaky-revenue' },
    '/problem/reactive-mode': { status: 301, destination: '/problem/reactive-growth' },
  },
});
