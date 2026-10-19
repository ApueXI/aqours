require('./load-typescript.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { matchingConnections } = require('../src/lib/notice-context.ts');

test('advisory context identifies only owned explicit or confirmed-zone connections without duplicates', () => {
  const owned = [
    { id: 'owned-a', zoneId: 'zone-a', zoneConfirmed: true },
    { id: 'owned-b', zoneId: 'zone-b', zoneConfirmed: false },
    { id: 'owned-c', zoneId: null, zoneConfirmed: false },
  ];
  assert.deepEqual(matchingConnections({ connectionIds: ['foreign', 'owned-a'], zoneIds: ['zone-a', 'zone-b'] }, owned).map(v => v.id), ['owned-a']);
  assert.deepEqual(matchingConnections({ connectionIds: ['owned-b', 'owned-c'], zoneIds: [] }, owned).map(v => v.id), ['owned-b', 'owned-c']);
  assert.deepEqual(matchingConnections({ connectionIds: ['foreign'], zoneIds: ['zone-b'] }, owned), []);
});
