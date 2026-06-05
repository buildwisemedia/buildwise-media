#!/usr/bin/env node
// guard-no-vendored-modules.mjs — block node_modules (and stray symlinks into
// it) from ever being tracked in git.
//
// Why this exists:
//   On 2026-06-04 an automated build committed `node_modules` as a bare symlink
//   (mode 120000) pointing at its own absolute path
//   (`node_modules -> /Users/.../buildwisemedia.com/node_modules`). That
//   self-referential loop produced "Too many levels of symbolic links" and
//   broke every local `astro build` on checkout (Cloudflare Pages was spared —
//   it builds from a fresh `npm ci`). `.gitignore` had `node_modules/` (trailing
//   slash → directory *contents* only), so the bare `node_modules` symlink (no
//   trailing slash) slipped past it and got swept in by a broad `git add -A`.
//   Fixed in efbcc0b via `git rm --cached node_modules`. This guard turns that
//   class of mistake into a loud failure instead of a silent ship.
//
// What it checks — against `git ls-files` (everything tracked in the index):
//   1. Any tracked path matching (^|/)node_modules($|/).
//   2. Any tracked symlink (mode 120000) whose target is an absolute path under
//      the repo root, OR whose target resolves into a `node_modules` segment.
//   Either hit → print the offending path(s) + remediation and exit non-zero.
//
// Enforcement:
//   - Always-on: .github/workflows/guard.yml runs this on every push + PR. CI is
//     the real gate — local hooks aren't shared across machines/executors (the
//     build that caused the incident ran without one).
//   - Optional local pre-commit (additive). From the repo root:
//       ln -sf ../../scripts/guard-no-vendored-modules.mjs .git/hooks/pre-commit
//   - Manual: npm run qa:guard
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// Quote a path for the copy-pasteable `git rm --cached` remediation hint.
function shellQuote(p) {
  return /[^\w@%+=:,./-]/.test(p) ? `'${p.replace(/'/g, `'\\''`)}'` : p;
}

// Resolve symlinks in the longest existing prefix of an absolute path, keeping
// any non-existent tail intact. Makes the "under the repo root" comparison
// robust to symlinked parents (e.g. macOS /tmp → /private/tmp) and to symlink
// targets that don't exist on disk (dangling links).
function canonical(absPath) {
  const parts = absPath.split(path.sep);
  for (let i = parts.length; i > 0; i--) {
    const prefix = parts.slice(0, i).join(path.sep) || path.sep;
    try {
      return path.join(fs.realpathSync(prefix), ...parts.slice(i));
    } catch {
      // Shrink the prefix and retry against a shallower (existing) ancestor.
    }
  }
  return absPath;
}

let repoRoot;
let realRepoRoot;
let entries;
try {
  repoRoot = git(['rev-parse', '--show-toplevel']).trim();
  realRepoRoot = canonical(repoRoot);
  // -s: stat lines "<mode> <object> <stage>\t<path>"; -z: NUL-separated, raw
  // (unquoted) paths so names with spaces survive intact.
  entries = git(['ls-files', '-s', '-z']).split('\0').filter(Boolean);
} catch (err) {
  const why = err && err.message ? String(err.message).split('\n')[0] : 'unknown error';
  console.error(`[guard-no-vendored-modules] cannot read git index (${why}).`);
  process.exit(1);
}

const NM_PATH = /(^|\/)node_modules($|\/)/;
const violations = [];

for (const entry of entries) {
  const tab = entry.indexOf('\t');
  if (tab === -1) continue;
  const [mode, object] = entry.slice(0, tab).split(' ');
  const file = entry.slice(tab + 1);

  // (1) Path is, or lives inside, node_modules.
  if (NM_PATH.test(file)) {
    violations.push({ file, why: 'tracked path is (or is inside) node_modules' });
    continue;
  }

  // (2) Stray symlink (different name) pointing into node_modules, or an
  //     absolute symlink into the repo itself — both break on a fresh checkout.
  if (mode === '120000') {
    let target = '';
    try {
      target = git(['cat-file', 'blob', object]).trim();
    } catch {
      target = '';
    }
    if (!target) continue;

    const linkDir = path.dirname(path.resolve(repoRoot, file));
    const resolved = path.isAbsolute(target)
      ? path.normalize(target)
      : path.normalize(path.resolve(linkDir, target));

    const resolvedReal = canonical(resolved);
    const absoluteUnderRepo =
      path.isAbsolute(target) &&
      (resolvedReal === realRepoRoot || resolvedReal.startsWith(realRepoRoot + path.sep));
    const intoNodeModules = resolved.split(path.sep).includes('node_modules');

    if (absoluteUnderRepo || intoNodeModules) {
      const reason = absoluteUnderRepo
        ? 'absolute path under the repo root'
        : 'resolves into node_modules';
      violations.push({ file, why: `symlink → ${target} (${reason})` });
    }
  }
}

if (violations.length === 0) {
  console.log('[guard-no-vendored-modules] OK — no node_modules paths or vendored symlinks tracked.');
  process.exit(0);
}

console.error('[guard-no-vendored-modules] BLOCKED — vendored dependencies must never be committed.\n');
for (const v of violations) {
  console.error(`  ✖ ${v.file}`);
  console.error(`      ${v.why}`);
  console.error(`      fix: git rm --cached ${shellQuote(v.file)}\n`);
}
console.error('node_modules is reinstalled from package-lock.json (npm ci); it is never tracked.');
process.exit(1);
