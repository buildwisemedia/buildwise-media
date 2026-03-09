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
});
