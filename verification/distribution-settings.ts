import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import type { MonitoringOverview, SiteMonitoringConfig, TemperatureBands } from '../aqours-contracts/src/index.ts';
import { key, ok, request } from './harness.ts';
import { configure, day, defaults, observed, site, users } from './distribution-fixtures.ts';

test('distribution permissions reject customers and anonymous reads/writes before record lookup', async () => {
  const item = await site();
  const routes: [string, string, unknown?][] = [
    ['GET', '/staff/distribution/monitoring'], ['GET', `/staff/pickup-sites/${item.id}/forecast`],
    ['PATCH', `/staff/pickup-sites/${item.id}/monitoring`, { ...defaults, expectedVersion: 0 }],
    ['POST', `/staff/pickup-sites/${item.id}/forecast/refresh`, {}], ['GET', '/staff/distribution/warnings'],
    ['GET', `/staff/distribution/warnings/${randomUUID()}`], ['GET', '/staff/distribution/temperature-bands'],
    ['GET', '/staff/distribution/notifications'], ['POST', `/staff/distribution/notifications/${randomUUID()}/read`, {}],
  ];
  for (const [method, path, body] of routes) {
    assert.equal((await request(null, method, path, body, key())).status, 401, path);
    assert.equal((await request(users.a, method, path, body, key())).status, 403, path);
  }
  for (const actor of [users.staff, users.admin]) {
    for (const [method, suffix] of [['GET', 'forecast'], ['POST', 'forecast/refresh']] as const)
      assert.equal((await request(actor, method, `/staff/pickup-sites/${randomUUID()}/${suffix}`, method === 'POST' ? {} : undefined, key())).status, 404);
  }
});

test('distribution overview includes disabled/unlocated sites and exactly seven Manila dates', async () => {
  const item = await site(false);
  const overview = await ok<MonitoringOverview>(users.staff, 'GET', '/staff/distribution/monitoring');
  assert.deepEqual(overview.dates, Array.from({ length: 7 }, (_, i) => day(i)));
  assert.ok(overview.supplier.id); assert.ok(overview.supplier.name);
  const current = await observed(item.id);
  assert.equal(current.config, null);
  assert.equal(current.weather.status, 'unlocated');
  assert.equal(current.supply.available, false);
  assert.ok(current.days.every(value => value.status === 'unavailable' && value.incomplete));
});

test('site settings validate thresholds/precision and freeze idempotent retries with optimistic conflicts', async () => {
  const item = await site();
  const path = `/staff/pickup-sites/${item.id}/monitoring`;
  for (const patch of [{ criticalTemperature: 35 }, { warningTemperature: 39 }, { criticalSupplyLiters: '100.00' },
    { lowSupplyLiters: '-1.00' }, { criticalSupplyLiters: '-0.01' }, { capacityLiters: '0.00' },
    { capacityLiters: '100.001' }, { lowSupplyLiters: '100.001' }, { warningTemperature: '35' }, { enabled: 'true' }]) {
    assert.equal((await request(users.staff, 'PATCH', path, { ...defaults, ...patch, expectedVersion: 0 }, key())).status, 400, JSON.stringify(patch));
  }
  const operation = key(), payload = { ...defaults, expectedVersion: 0 };
  const saved = await ok<SiteMonitoringConfig>(users.staff, 'PATCH', path, payload, operation);
  assert.equal(saved.version, 1); assert.equal(saved.enabled, true);
  assert.equal((await configure(item, { warningTemperature: 34 }, saved.version)).version, 2);
  assert.deepEqual(await ok(users.staff, 'PATCH', path, payload, operation), saved);
  assert.equal((await request(users.staff, 'PATCH', path, payload, key())).status, 409);
  assert.equal((await request(users.staff, 'PATCH', path, { ...payload, warningTemperature: 33 }, operation)).status, 409);
});

test('temperature band writes are admin-only, versioned, validated and retry-safe', async () => {
  const path = '/staff/distribution/temperature-bands';
  const before = await ok<TemperatureBands>(users.staff, 'GET', path);
  const payload = { expectedVersion: before.version, boundaries: [24, 29, 33, 36], reason: 'Demonstration temperature legend' };
  assert.equal((await request(users.staff, 'PATCH', path, payload, key())).status, 403);
  for (const boundaries of [[25, 30, 34], [25, 30, 34, 37, 40], [25, 30, 30, 37], [37, 34, 30, 25], ['25', 30, 34, 37]])
    assert.equal((await request(users.admin, 'PATCH', path, { ...payload, boundaries }, key())).status, 400);
  const operation = key();
  const saved = await ok<TemperatureBands>(users.admin, 'PATCH', path, payload, operation);
  assert.deepEqual(saved.boundaries, payload.boundaries); assert.equal(saved.version, before.version + 1);
  assert.deepEqual(await ok(users.admin, 'PATCH', path, payload, operation), saved);
  assert.equal((await request(users.admin, 'PATCH', path, payload, key())).status, 409);
});
