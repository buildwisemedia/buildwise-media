---
title: "Gate annotations: keep in source, strip at publish, check the bundle"
status: review
owner: robert
last_validated: 2026-09-23
tags: ["reference", "publishing", "qa", "gates", "client-sites"]
---

# Gate annotations: keep in source, strip at publish, check the bundle

> **Status: proposal + one pilot (2026-09-23).** Canonical home: Brain `reference/Gate-Annotation-Publish-Strip.md` (to be published from a lane with Brain write access; this repo copy is the reviewed source until then). Found during the Bronkar cutover QA. No live client site has been changed. Each site adopts this with its next reviewed release, through its normal review and approval path.

## The problem

BWM's write-time gates make builders put pragma comments in page **source**:

- the R020 visual gate (`@r020:…`, `@r020-exempt`)
- the Show-Don't-Tell density gate (`@sdt-exempt`, `@sdt-interactive-proof`, `@cta-proof`)
- the creative copy gate (`@creative-exempt`, `@internal-architecture`)
- the build-authoring router (`@build-author-exempt`, `@codex-authored`, `@sol-authored`)
- the client claim ledger (`@audience`, `@proof`, `@status`, `@claim-ledger-exempt`)
- the Pre-Ship Grep Gate (`@bwm-exp-slot`, `@bwm-exp-slot-exempt`, `@r017c-sanctioned`)

Those comments ship in the public HTML. Visitors don't see them, but anyone can read them with view-source. They name internal process, models and tools. Example from Bronkar's programs page:

`<!-- @creative-exempt: … BWM connective prose was authored at FK ≤7 (Sol V4 receipts); vendor-name + room-metaphor protection still enforced by _build-context/qa-v4-grep.sh -->`

The gates need these comments in source, so they stay there. The published bundle must not carry them.

### How big it is (live check, 2026-09-23)

Checked with the tool below: up to 15 pages per site from the sitemap, plus the CSS, JS and SVG files those pages load. **Every live BWM-built site leaks.**

| Site | Gate tags found live | How it publishes |
|---|---:|---|
| homedesign2sell.com (Design2Sell) | 344 | Astro; Cloudflare builds from GitHub |
| townrg.com (Townsend) | 294 | Astro; Cloudflare builds from GitHub |
| rutherfordmade.com | 164 | Astro; Cloudflare builds from GitHub |
| buildwisemedia.com (BWM) | 109 | Astro; Cloudflare builds from GitHub — **pilot** |
| cronoscontractors.com | 67 | custom build (`tools/build.mjs`) → folder upload |
| pattimoynihan.com | 27 | folder upload |
| gretajaeger.com | 22 | `scripts/deploy-live.sh` assembles a folder → upload |
| adiemccalmon.com | 18 | `scripts/deploy-preview.sh` copies an allowlist → upload |
| bronkar-lee.pages.dev (bronkar.com pending) | 17 (home page only) | `scripts/bundle-review.mjs` allowlist bundle + hash manifest → upload |
| robertechevarria.com (Robert, personal) | 14 | Cloudflare publishes from GitHub; no build step in the repo |
| cabdihomes.com | 13 | folder upload |
| keltech-global.com | 4 (home page only) | `scripts/release_package.py` allowlist package → upload |
| removeasap.com (ASAP) | 2 | Cloudflare publishes the `production` branch; no build step in the repo |
| procoolheatingandair.com | 1 (in `site.css`) | folder upload |
| callursula.com | 0 | not BWM-built (hosted elsewhere) |

The Deploy Manifest (`reference/Deploy-Manifest.md`) is out of date for most of these rows. The table above comes from the live Cloudflare project list and each repo's default branch on 2026-09-23.

## The rule (proposed)

1. **Source keeps the annotations.** No gate changes. No source edits.
2. **Every publish strips them.** Only comments that carry a known gate tag are removed. Nothing else changes.
3. **The bundle is checked before upload.** If any gate tag remains anywhere in the bundle, the publish fails.

## The tool: `bwm-gate-annotations.mjs` v1.0.0

One Node file with no dependencies. The canonical copy is proposed for Brain `tools/`. Each site keeps an identical copy in `scripts/`, so builds stay self-contained and a reviewed bundle can be rebuilt byte for byte. The pilot copy lives in `buildwisemedia/buildwise-media` at `scripts/bwm-gate-annotations.mjs`.

```
node scripts/bwm-gate-annotations.mjs strip <bundle-dir> [--receipt <file outside the bundle>]
node scripts/bwm-gate-annotations.mjs check <bundle-dir | https://site> [--pages N] [--allow-tag NAME]
node scripts/bwm-gate-annotations.mjs selftest
node scripts/bwm-gate-annotations.mjs version
```

**strip is narrow on purpose:**

- It removes only HTML comments in markup, and CSS comments in stylesheets and `<style>`, and only those carrying a known gate tag.
- An HTML comment is removed exactly; the whitespace around it stays, because it can render (for example inside `<pre>`). In the rare spots where removing one would change the page, an empty `<!---->` is left instead. That covers joining text into a character reference like `&copy;`, and exposing a newline right after `<pre>`. An inline CSS comment becomes an empty `/**/`, so the words on either side stay separate.
- It never edits attribute values, `<script>` or other raw-text content, CSS `url(...)`, CDATA, or unterminated comments.
- It follows the HTML parser's rules for tags and attributes. Inside `<svg>`/`<math>` and in `.svg` files it uses the XML rules.
- It keeps every other byte. Each changed file must still match its original once comments and whitespace are set aside, or the file is left alone and the run fails.
- It fails on a file that isn't UTF-8 text, and on a symlink.
- It writes an optional receipt: tool version and fingerprint (sha256), plus before and after sha256 for every changed file. The receipt must sit outside the bundle.

**check is wide on purpose (fail-closed):**

- It reads every file in the bundle that decodes as text, including scripts, JSON, source maps and server code. It also sees through string escapes (`"<!--\n@r020"`), since page text often sits inside a script as a string.
- Distinctive tags such as `@r020` fail anywhere they appear. Ordinary-word tags (`@proof`, `@status`, `@audience`) fail only inside comments, so a social handle like "@proof" is fine.
- An HTML comment that opens with an **unknown** `@name` fails, in pages, scripts and server code. In Astro, the build also fails if a page template has one. A new gate tag can't ship silently; add it to the list first.
- A folder with no pages fails. A wrong path can never pass.
- The URL mode is a spot-check of a live site (sitemap pages plus the assets they load).

**Astro sites** get a three-line integration (`bwmGateAnnotations()` in `astro.config.mjs`). It:

- strips `.astro` source before compile, using Astro's own parser to find the real template comments, so pages rendered on request are covered. (Found in the pilot: `@astrojs/compiler` 2.x reports comment positions as UTF-8 **byte** offsets, with the start just after `<!--`. The tool maps them to string positions and refuses to cut if a position doesn't check out.);
- strips raw HTML/SVG imports (`?raw`) the same way, since those can reach server code too;
- strips the finished build folder (`public/` files, SVGs, anything else);
- runs the check, and fails `astro build` on any leftover.

It works however the build is started: by Cloudflare, by CI or on a laptop.

## Where the step goes, by publish type

| Type | Sites | Insertion point |
|---|---|---|
| A. Astro, built by Cloudflare from GitHub | buildwisemedia.com (pilot), Design2Sell, Townsend, RutherfordMade | Add the integration. Add `node scripts/bwm-gate-annotations.mjs check dist` to CI after the build. |
| B. Folder upload from a script | Bronkar, Adie, Greta, Cronos, KelTech, Moynihan, Cabdi, ProCool | After the bundle folder is assembled, and **before** any hash manifest, site checks or `wrangler pages deploy`: `strip <bundle> --receipt <outside>` then `check <bundle>`. |
| C. Cloudflare publishes committed files, no build step in the repo | ASAP (`production` branch), robertechevarria.com | These publish committed files as-is, so docs in the published folder go out too. They need a real publish folder and a Cloudflare build command. That's a Cloudflare project-setting change, so it rides the site's next reviewed release. Until then, the URL spot-check is the only guard. |

Site notes:

- **Bronkar:** in `scripts/bundle-review.mjs`, after the `cp` loop and before the manifest `walk`. Leave the current cutover candidate alone. It is under a hash-bound review, and stripping changes its bytes. Adopt with the next reviewed release after cutover.
- **KelTech:** `release_package.py` checks that the package bytes equal the source bytes. The strip must run inside the packager, and the comparison must be against the stripped view.
- **Design2Sell:** `src/pages/lead-review.astro` carries `<!-- @mode: d2s-client-facing -->`. That isn't a known gate tag, so the check will flag it at adoption. Decide then: add it to the list if a gate reads it, or allow it with `--allow-tag mode`.
- **Pages Functions** (`functions/`) are built separately from the bundle. If one renders HTML with gate comments, only the URL spot-check sees it.

## Things the pilot surfaced

1. **Local gates read these tags from the build folder.** The Pre-Ship Grep Gate's Show-Don't-Tell density scan reads `dist/` when it exists, and it counts `@sdt-exempt` and `@r020` there. Measured on the flagship with all surfaces in scope: 5 findings on the annotated build, 82 on a stripped one. So:
   - Publish builds strip by default.
   - `BWM_KEEP_GATE_ANNOTATIONS=1 npm run build` makes an annotated build for local gate runs.
   - That setting is refused inside a Cloudflare build (`CF_PAGES=1`), so an annotated build can't publish.
   - Stripping only ever makes those gates fail more, never pass wrongly.
2. **Pages rendered on request.** The build-folder strip can't reach them, so the integration strips `.astro` source before compile, and the check also scans the server bundle (`_worker.js`).
3. **Runtime slot markers.** `@bwm-exp-slot` comments are also created by page scripts on the flagship: the `/mo-*` pages and the Fit Diagnostic form. Page source is off-limits here, so they stay. They show in browser dev tools but not in view-source HTML. The `data-bwm-exp-slot` attributes that experiments use are unchanged. On pages rendered on request the rule is strict: a slot marker written as a literal comment string fails the build, even inside an inline script. Build the text at runtime instead (`'@bwm-exp-slot: ' + name`), as the `/mo-*` pages already do.
4. **Hash-bound reviews.** Stripping changes published bytes, so a site's existing hash-bound review no longer matches. Adopt only with the next reviewed release. Put the strip receipt in the review packet.
5. **Greta (side finding, not changed):** some of its pages still link old WordPress stylesheet addresses. The site answers those with its homepage HTML and a success code (soft 404s). Worth a cleanup on its next release.
6. **Plain comments.** Some plain comments also name internal things, but they carry no gate tag, so this rule doesn't touch them. Examples: "BWM Attribution Tracker — Phase 1 QLS M78", "Triangulation V3 banner — image on R2 bucket …", "SEED: … BWM legal-page template". Separate follow-up if wanted.

## Pilot: buildwisemedia.com (BWM-owned)

The pilot is BWM's own site: same stack as three client sites (Astro, built by Cloudflare from GitHub), and no client approval path involved.

- **Before:** the build carried 3,239 gate annotations (348 pages, the server bundle and 6 SVGs, including the public favicon), measured on the branch rebased onto #67.
- **After:** 0 annotations in 348 pages and 602 files, including the server bundle.
- **Nothing else changed.** 254 files are byte-identical to the baseline build. 354 match it once comments are set aside (17 of those spots keep an empty `<!---->` from the safety guards). All 107 server chunks match their baseline twins the same way. The remaining differences are hashed chunk names, Astro's per-build random key and route-list order.
- **On-request page:** `/revenue-leak-map`, served by the real worker locally, has 0 tags (production has 4 today). Experiment attributes are unchanged.
- **Tests:** 63/63 built-in self-test cases; 136/136 repo tests (23 new); brand QA passes.
- **Tests that bite:** deliberately broken copies go red, including dropping any gate tag from the list and swapping an old bug back in.
- **Independent review:** cross-model review (gpt-6-astra, high effort), 19 rounds, 46 findings: 44 fixed and 2 accepted as limits (escaped CSS function names; a literal slot marker inside an inline script on an on-request page fails the build). The last two rounds were SHIP-SAFE. Every fix came with a test that fails on the old code. Log: `bwm-review-log` review_id `buildwise-media@b6490eb..gate-annotations#codex-review`.
- **Whole fleet, on real bytes:** copies of all 14 live sites (up to 15 pages each, plus their CSS and SVG) strip clean, with no strip errors. Every changed file passed the nothing-but-comments check.
- **Pull request:** buildwisemedia/buildwise-media#69 (branch `claude/infallible-roentgen-7eb4ac`). Reviewed tool version: v1.0.0, sha256 `2889bb2f55155396daae9f18f4d97bdb7dda0ba118bfdc1d514872d2870e5998`.
- **Not done:** merge and production deploy wait for Robert's go-ahead.

## Rollout (each item waits for that site's next reviewed release)

1. **Flagship:** merge the pilot PR on Robert's go-ahead, then spot-check `https://buildwisemedia.com`.
2. **Type A:** Design2Sell, Townsend, RutherfordMade: same three-line change plus the CI step.
3. **Type B:** add the two commands to each bundle script (Bronkar only after cutover).
4. **Type C:** ASAP and robertechevarria.com get a publish folder and a Cloudflare build command.
5. **Fleet guard (needs Robert's OK; Brain tools change):**
   - Put the canonical copy in Brain `tools/`.
   - Add the URL spot-check to `tools/bwm-website-qa.sh` as a warning until each site adopts, then as a failure.
   - Teach the Pre-Ship density scan to spot a stripped `dist/` and say so.
   - Add a drift check that compares each site's `scripts/bwm-gate-annotations.mjs` against the canonical fingerprint.
