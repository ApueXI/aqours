import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import type { SiteForecast } from '../aqours-contracts/src/index.ts';
import { refreshSiteForecast, siteForecast } from '../aqours-api/src/services/monitoring/forecast.ts';
import { transaction } from '../aqours-api/src/config/database.ts';
import { key, ok } from './harness.ts';
import { clock, configure, forecastLoader, observed, prisma, provider, site, users } from './distribution-fixtures.ts';

test('site forecast persists through fresh process restart and enforces hourly cooldown', async () => {
  const item = await site(); await configure(item);
  const count = provider.calls;
  assert.equal(await refreshSiteForecast(item.id), true);
  const fresh = await ok<SiteForecast>(users.staff, 'GET', `/staff/pickup-sites/${item.id}/forecast`);
  assert.equal(fresh.status, 'fresh'); assert.equal(fresh.forecast!.daily.length, 7);
  assert.equal(provider.calls, count + 1);
  const persisted = await prisma.monitoringForecast.findUniqueOrThrow({ where: { siteId: item.id } });
  assert.deepEqual(persisted.forecast, fresh.forecast);
  const restarted = JSON.parse(execFileSync(process.execPath, ['--import', './aqours-api/node_modules/tsx/dist/loader.mjs',
    './verification/distribution-restart.ts', item.id], { encoding: 'utf8', timeout: 20000 }));
  assert.deepEqual(restarted, fresh, 'New process reads durable forecast with no provider');
  assert.equal(await refreshSiteForecast(item.id), false);
  assert.equal((await ok<{ queued: boolean }>(users.staff, 'POST', `/staff/pickup-sites/${item.id}/forecast/refresh`, {}, key())).queued, false);
  assert.equal(provider.calls, count + 1, 'Manual refresh cannot bypass cooldown');
});

test('forecast failures retain success timestamp with bounded retry and become unavailable at six hours', async () => {
  const item = await site(); await configure(item);
  const origin = new Date(clock.getTime() - 7 * 3600_000);
  await refreshSiteForecast(item.id, { now: origin, forecastLoader });
  const fail = async () => { throw new Error('Controlled upstream outage'); };
  const attempt = new Date(origin.getTime() + 3600_000);
  assert.equal(await refreshSiteForecast(item.id, { now: attempt, forecastLoader: fail }), true);
  let row = await prisma.monitoringForecast.findUniqueOrThrow({ where: { siteId: item.id } });
  assert.equal(row.lastSuccessAt!.toISOString(), origin.toISOString());
  assert.equal(row.lastAttemptAt!.toISOString(), attempt.toISOString()); assert.equal(row.failures, 1);
  assert.equal(row.nextRefreshAt.getTime() - attempt.getTime(), 60_000);
  const stale = await transaction(db => siteForecast(db, item.id, attempt));
  assert.equal(stale.status, 'stale'); assert.ok(stale.forecast); assert.ok(stale.error);
  assert.equal(await refreshSiteForecast(item.id, { now: new Date(attempt.getTime() + 59999), forecastLoader: fail }), false);
  await refreshSiteForecast(item.id, { now: row.nextRefreshAt, forecastLoader: fail });
  row = await prisma.monitoringForecast.findUniqueOrThrow({ where: { siteId: item.id } });
  assert.equal(row.failures, 2); assert.equal(row.nextRefreshAt.getTime() - row.lastAttemptAt!.getTime(), 120_000);
  await refreshSiteForecast(item.id, { now: row.nextRefreshAt, forecastLoader: fail });
  row = await prisma.monitoringForecast.findUniqueOrThrow({ where: { siteId: item.id } });
  assert.equal(row.failures, 3); assert.equal(row.nextRefreshAt.getTime() - row.lastAttemptAt!.getTime(), 3600_000);
  assert.equal((await transaction(db => siteForecast(db, item.id, new Date(origin.getTime() + 6 * 3600_000 - 1)))).status, 'stale');
  assert.equal((await transaction(db => siteForecast(db, item.id, new Date(origin.getTime() + 6 * 3600_000)))).status, 'unavailable');
  await refreshSiteForecast(item.id, { forecastLoader });
  assert.equal((await observed(item.id)).weather.status, 'fresh');
});

test('coordinates invalidate forecasts and in-flight old-coordinate results cannot repopulate cache', async () => {
  const item = await site(); await configure(item);
  let started!: () => void, finish!: () => void;
  const entered = new Promise<void>(resolve => { started = resolve; });
  const released = new Promise<void>(resolve => { finish = resolve; });
  const pending = refreshSiteForecast(item.id, { forecastLoader: async (latitude, longitude) => {
    started(); await released; return forecastLoader(latitude, longitude);
  } });
  await entered;
  const moved = await ok<{ version: number }>(users.staff, 'PATCH', `/staff/pickup-sites/${item.id}`, {
    expectedVersion: item.version, latitude: 14.2, longitude: 121.3, reason: 'Fictional point correction while provider pending' });
  finish(); await pending;
  assert.equal((await observed(item.id)).weather.status, 'missing');
  await refreshSiteForecast(item.id, { forecastLoader });
  assert.deepEqual((await observed(item.id)).weather.forecast!.location, { latitude: 14.2, longitude: 121.3 });
  await ok(users.staff, 'PATCH', `/staff/pickup-sites/${item.id}`, { expectedVersion: moved.version,
    latitude: null, longitude: null, reason: 'Fictional coordinate removal' });
  assert.equal((await observed(item.id)).weather.status, 'unlocated');
  assert.equal(await refreshSiteForecast(item.id, { forecastLoader }), false);
});

test('refresh leases reject overlapping fetches and expired leases recover without duplicate work', async () => {
  const item = await site(); await configure(item);
  await prisma.monitoringWork.update({ where: { siteId: item.id }, data: {
    leaseToken: randomUUID(), leaseUntil: new Date(clock.getTime() + 60_000) } });
  assert.equal(await refreshSiteForecast(item.id, { now: clock, forecastLoader }), false);
  let loads = 0;
  const options = { now: new Date(clock.getTime() + 60_001), forecastLoader: async (latitude: number, longitude: number) => {
    loads++; await new Promise(resolve => setTimeout(resolve, 25)); return forecastLoader(latitude, longitude);
  } };
  const results = await Promise.all(Array.from({ length: 6 }, () => refreshSiteForecast(item.id, options)));
  assert.equal(results.filter(Boolean).length, 1); assert.equal(loads, 1);
  const row = await prisma.monitoringWork.findUniqueOrThrow({ where: { siteId: item.id } });
  assert.equal(row.leaseToken, null); assert.equal(row.leaseUntil, null);
});
