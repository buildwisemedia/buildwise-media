import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// data-cta-source names follow the Brand-System Direction taxonomy (hero-primary, final-primary, ...)
// and the header value used by Header.astro, so GA4 reports one CTA vocabulary across old and Bob pages.
const page = (name) => fs.readFileSync(new URL(`../src/data/bob/${name}.html`, import.meta.url), 'utf8');
const anchors = (html) => [...html.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const SOURCE = /^[a-z0-9-]{1,60}$/; // the only values bob-tracking.js forwards

test('every Bob page tags its header CTA', () => {
  for (const name of ['index', 'contact', 'speaking', 'luncheon', 'privacy', 'terms']) {
    const header = anchors(page(name)).filter((tag) => attr(tag, 'class') === 'header-cta');
    assert.equal(header.length, 1, name);
    assert.equal(attr(header[0], 'data-cta-source'), 'header', name);
  }
});

test('homepage CTAs follow the brand CTA taxonomy', () => {
  const tags = anchors(page('index'));
  const sources = tags.map((tag) => attr(tag, 'data-cta-source')).filter(Boolean);
  for (const tag of tags.filter((t) => /\bbutton\b/.test(attr(t, 'class') || ''))) {
    assert.match(attr(tag, 'data-cta-source') || '', SOURCE, tag);
  }
  for (const source of sources) assert.match(source, SOURCE);
  assert.equal(new Set(sources).size, sources.length, 'each CTA source is used once');
  const hero = tags.find((t) => attr(t, 'href') === '#work' && attr(t, 'class') === 'button');
  assert.equal(attr(hero, 'data-cta-source'), 'hero-primary');
  const secondary = tags.find((t) => attr(t, 'data-cta-source') === 'hero-secondary');
  assert.equal(attr(secondary, 'href'), '/contact');
  const final = tags.find((t) => attr(t, 'data-cta-source') === 'final-primary');
  assert.equal(attr(final, 'href'), '/contact');
});

test('speaking page tags its primary CTA', () => {
  const tag = anchors(page('speaking')).find((t) => attr(t, 'href') === '#speaking-inquiry');
  assert.equal(attr(tag, 'data-cta-source'), 'speaking-hero-primary');
});
