import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../src/data/wallpaper/index.html', import.meta.url), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
function node(dataset = {}) {
  const listeners = new Map(), attrs = new Map();
  return {dataset, complete: false, classList: {add() {}, remove() {}},
    addEventListener(type, fn) { listeners.set(type, fn); },
    fire(type, event = {}) { listeners.get(type)?.({button: 0, preventDefault() {}, ...event}); },
    setAttribute(key, value) { attrs.set(key, value); }, getAttribute: key => attrs.get(key),
    focus() {}};
}
function gallery() {
  const events = [], controls = new Map(), formats = ['desktop', 'phone'].map(fmt => node({fmt}));
  for (const id of ['viewer', 'v-title', 'v-stage', 'v-img', 'v-err', 'v-dl', 'v-dl-t', 'v-meta', 'v-close', 'v-prev', 'v-next']) controls.set(id, node());
  const dialog = controls.get('viewer');
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.fire('close'); };
  dialog.querySelectorAll = () => formats;
  const plates = ['13', '15'].map(no => {
    const views = ['desktop', 'phone'].map(format => {
      const view = node({format, dims: 'test dimensions', size: 'test size'}), img = node();
      img.setAttribute('src', `/wallpaper/assets/${no}-${format}.webp`);
      img.setAttribute('alt', `Wallpaper ${no}`);
      view.querySelector = () => img;
      return view;
    });
    const downloads = ['desktop', 'phone'].map(format => {
      const a = node(); a.setAttribute('href', `/wallpaper/full/${no}-${format}.png`); return a;
    });
    return {dataset: {no, title: `Wallpaper ${no}`}, views,
      querySelectorAll: () => views,
      querySelector(selector) { const i = selector.includes('"phone"') ? 1 : 0; return selector.startsWith('.dl') ? downloads[i] : views[i]; }};
  });
  const document = {getElementById: id => controls.get(id), addEventListener() {},
    querySelectorAll: selector => selector === '.plate' ? plates : []};
  vm.runInNewContext(script, {document, window: {__bwmTrackEvent: (name, data) => events.push({name, ...data})}});
  return {events, controls, formats, plates};
}

test('only a gallery selection counts as an open; browsing keeps the correct download', () => {
  const g = gallery();
  g.plates[0].views[0].fire('click');
  g.controls.get('v-next').fire('click');
  g.formats[1].fire('click');
  g.controls.get('viewer').fire('keydown', {key: 'ArrowLeft'});
  assert.equal(g.controls.get('v-dl').getAttribute('href'), '/wallpaper/full/13-phone.png');
  assert.equal(g.events.filter(e => e.name === 'wallpaper_open').length, 1);
  g.controls.get('v-close').fire('click');
  g.plates[1].views[1].fire('click');
  assert.deepEqual(g.events.map(e => [e.name, e.wallpaper_id, e.wallpaper_format]),
    [['wallpaper_open', '13', 'desktop'], ['wallpaper_open', '15', 'phone']]);
});
