require('./load-typescript.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { matchingConnections } = require('../src/features/home/utils/notice-context.ts');

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

const { advisoryPhase } = require('../src/features/home/utils/notice-context.ts');
const at = Date.parse('2026-10-23T04:00:00Z');
const scheduled = { kind: 'scheduled_interruption', state: 'published', startsAt: '2026-10-23T05:00:00Z', endsAt: '2026-10-23T06:00:00Z' };

test('published scheduled advisories remain discoverable before, during and after their window', () => {
  assert.equal(advisoryPhase(scheduled, at), 'upcoming');
  assert.equal(advisoryPhase(scheduled, Date.parse(scheduled.startsAt)), 'current');
  assert.equal(advisoryPhase(scheduled, Date.parse(scheduled.endsAt)), 'past');
  assert.equal(advisoryPhase({ ...scheduled, startsAt: null, endsAt: null }, at), 'current');
  assert.equal(advisoryPhase({ ...scheduled, state: 'draft' }, at), 'draft');
  assert.equal(advisoryPhase({ ...scheduled, state: 'lifted' }, at), 'lifted');
});

test('quality restrictions stay current across planned dates and move to history only when lifted', () => {
  for (const kind of ['boil_water', 'do_not_drink', 'do_not_use']) {
    const notice = { ...scheduled, kind };
    assert.equal(advisoryPhase(notice, at), 'current');
    assert.equal(advisoryPhase(notice, Date.parse('2027-01-01T00:00:00Z')), 'current');
    assert.equal(advisoryPhase({ ...notice, state: 'lifted' }, at), 'lifted');
  }
});
