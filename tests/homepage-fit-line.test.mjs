import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

// The homepage who-it's-for line is Robert's pick (2026-09-23) for the corrected
// customer profile: founders with a team who are ready to put AI to work. It sits
// between the hero explanation and the hero actions. Revenue bands stay internal,
// so the approved words carry no size cutoff. These checks read the source Astro
// publishes, so they run before a build.
const FIT_LINE = "For founders with a team, ready to put AI to work on what’s slowing growth.";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const html = fs.readFileSync(path.join(root, "src/data/bob/index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "public/bob/site.css"), "utf8");

// Body of the first `@media(...)` block for the query, found by brace matching.
function mediaBlock(query) {
  const open = css.indexOf(`@media(${query}){`);
  assert.notEqual(open, -1, `missing @media(${query})`);
  let depth = 0;
  for (let i = css.indexOf("{", open); i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}" && --depth === 0) return css.slice(css.indexOf("{", open) + 1, i);
  }
  throw new Error(`unclosed @media(${query})`);
}

test("homepage shows the approved who-it's-for line once", () => {
  const lines = [...html.matchAll(/<p class="fit-line">([^<]*)<\/p>/g)].map((m) => m[1]);
  assert.deepEqual(lines, [FIT_LINE]);
});

test("the line sits between the hero explanation and the hero actions", () => {
  const hero = html.match(/<div class="hero-copy">[\s\S]*?<div class="hero-bob">/)?.[0] ?? "";
  const order = ['<p class="lede">', '<p class="fit-line">', '<div class="actions">'].map((tag) => hero.indexOf(tag));
  assert.ok(order.every((at) => at >= 0), `hero is missing a piece: ${order}`);
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test("desktop styles the line; phones give it its own row under the explanation", () => {
  // Wide screens: a plain rule outside any media query.
  assert.match(css.slice(0, css.indexOf("@media")), /\.fit-line\{[^}]*font-weight:600/);
  // Phones flatten .hero-copy into the .hero grid (display:contents). A child with no
  // named area is auto-placed below the support line, so the line needs the fit row.
  const phone = mediaBlock("max-width:760px");
  assert.match(phone, /\.hero\{[^}]*grid-template-areas:[^;}]*'lede lede' 'fit fit' 'actions bob'/);
  assert.match(phone, /\.fit-line\{[^}]*grid-area:fit/);
});
