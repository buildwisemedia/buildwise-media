#!/usr/bin/env node
// prebuild — guarantee full git history for the sitemap's per-route <lastmod>.
//
// src/pages/sitemap.xml.ts derives each URL's <lastmod> from the source file's
// last git commit date. That needs real history. Cloudflare Pages (and most CI)
// clone shallow (depth 1), which collapses every page's date to the latest
// commit — i.e. "everything changed today" on every deploy, the mild anti-signal
// Google learns to ignore. If the repo is shallow, unshallow once here so the
// per-route dates resolve in production.
//
// Fully guarded: any failure (no remote/credentials, offline, already complete,
// git absent) leaves the repo untouched and the sitemap falls back to the build
// date — no worse than before. This script never throws and always exits 0, so
// it can never abort the build.
import { execFileSync } from 'node:child_process';

function git(args, timeout) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    timeout,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

try {
  if (git(['rev-parse', '--is-shallow-repository'], 5000) === 'true') {
    git(['fetch', '--unshallow', '--quiet'], 120000);
    console.log('[prebuild] unshallowed git history → per-route sitemap lastmod enabled');
  } else {
    console.log('[prebuild] git history already complete → per-route sitemap lastmod enabled');
  }
} catch (err) {
  const why = (err && err.message ? String(err.message).split('\n')[0] : 'unavailable');
  console.log(`[prebuild] git history unavailable (${why}) → sitemap lastmod falls back to build date`);
}

process.exit(0);
