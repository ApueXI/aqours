import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Connection, Report } from '@aqours/contracts';
import { customerPoints } from '../src/features/map/utils/customer-points';
import { clusterSummary, leadingCategory } from '../src/features/map/utils/report-symbols';

const bounds = { west: 120, east: 122, south: 14, north: 15 };
const connection = (customerId: string, fields: Partial<Connection> = {}): Connection => ({
  id: customerId, customerId, reference: `C-${customerId}`, address: 'Saved customer location',
  longitude: 121.1951, latitude: 14.1679, zoneId: null, zoneConfirmed: false, version: 1, ...fields,
});
const report = (id: string, customerId: string, fields: Partial<Report> = {}): Report => ({
  id, customerId, connectionId: customerId, reference: `R-${id}`, category: 'leak', status: 'received',
  submittedAt: '2026-10-23T00:00:00Z', latitude: 14.2, longitude: 121.2, address: 'Recorded issue location',
  priority: 'normal', ...fields,
} as Report);

test('customer counts deduplicate connections/reports and include customers with no reports', () => {
  const data = customerPoints([connection('one'), connection('one', { id: 'second' }), connection('two')],
    [report('a', 'one'), report('b', 'one', { category: 'outage' })], bounds, '');
  assert.equal(data.total, 2);
  assert.equal(data.points[0].category, 'outage');
  assert.equal(data.points[0].report?.id, 'b');
  assert.deepEqual(data.points[0].coordinates, [121.1951, 14.1679]);
  assert.equal(data.points[1].category, null);
  assert.equal(data.points[1].report, undefined);
});

test('resolved reports are neutral and reopened reports restore the issue color', () => {
  const records = [report('a', 'one', { status: 'resolved', category: 'outage' }), report('b', 'two')];
  assert.equal(customerPoints([connection('one'), connection('two')], records, bounds, '').points[0].category, null);
  records[0].status = 'under_review';
  assert.equal(customerPoints([connection('one')], records, bounds, '').points[0].category, 'outage');
});

test('cluster color uses red first regardless of report order or reviewed priority', () => {
  assert.equal(leadingCategory(['leak', 'outage', 'water_quality', 'low_pressure']), 'outage');
  assert.equal(leadingCategory(['low_pressure', 'water_quality', 'leak']), 'water_quality');
  assert.equal(leadingCategory(['low_pressure', 'leak']), 'leak');
  assert.equal(clusterSummary([], 4).color, '#475569');
  assert.match(clusterSummary(['outage'], 3).label, /3 customers.*no water/);
});

test('missing coordinates, viewport, search, filtered cohorts and cap remain explicit', () => {
  const connections = [connection('one'), connection('two', { latitude: null, longitude: null }),
    connection('three', { longitude: 123 })];
  const data = customerPoints(connections, [], bounds, '');
  assert.equal(data.total, 1); assert.equal(data.unlocated, 1);
  assert.equal(customerPoints(connections, [], bounds, 'C-one').total, 1);
  assert.equal(customerPoints(connections, [], bounds, '', true).total, 0);
  const capped = customerPoints([connection('one'), connection('two')], [], bounds, '', false, 1);
  assert.equal(capped.total, 2); assert.equal(capped.points.length, 1); assert.equal(capped.truncated, true);
  const fallback = customerPoints(connections, [report('fallback', 'two')], bounds, '');
  assert.equal(fallback.unlocated, 0); assert.equal(fallback.total, 2);
});
