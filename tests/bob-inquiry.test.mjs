import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanSource, sourceDetails, requestNote, deliveryComplete } from '../public/scripts/bob-inquiry.js';

test('source keeps event tags while dropping email, free text, fragment and credentials', () => {
  assert.equal(cleanSource('https://user:pass@buildwisemedia.com/talk/?email=private%40example.com&utm_source=luncheon&note=secret#name'), 'https://buildwisemedia.com/talk/?utm_source=luncheon');
  assert.equal(cleanSource('mailto:private@example.com'), '');
  const details = sourceDetails('https://buildwisemedia.com/speaking/?utm_campaign=owner-talk&name=private');
  assert.equal(details.utm_campaign, 'owner-talk');
  assert.equal(JSON.stringify(details).includes('private'), false);
});

test('event request is explicit and a fit note remains the visitor’s words', () => {
  assert.equal(requestNote('fit', ' Follow-up '), 'Follow-up');
  assert.match(requestNote('luncheon', ''), /^Luncheon interest:/);
  assert.match(requestNote('speaking', 'Owners in Atlanta'), /Speaking request:[\s\S]*Owners in Atlanta$/);
});

test('partial capture or an error cannot display a successful submission', () => {
  const done = { ok:true, captured:true, emailed:true, receipt_recorded:true };
  assert.equal(deliveryComplete({ok:true}, done), true);
  for (const key of Object.keys(done)) assert.equal(deliveryComplete({ok:true}, {...done, [key]:false}), false);
  assert.equal(deliveryComplete({ok:false}, done), false);
  assert.equal(deliveryComplete({ok:true}, {}), false);
});

test('direct visits have no referrer and a real referral retains its source', () => {
  const href = 'https://buildwisemedia.com/?utm_source=luncheon';
  assert.equal(sourceDetails(href).referrer, '');
  assert.equal(cleanSource('   ', href), '');
  assert.equal(sourceDetails(href, 'https://example.com/event/?email=private').referrer, 'https://example.com/event/');
});
