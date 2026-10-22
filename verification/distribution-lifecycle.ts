import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import type { MonitoringWarning, PickupSession } from '../aqours-contracts/src/index.ts';
import { evaluateSiteMonitoring } from '../aqours-api/src/services/monitoring/evaluate.ts';
import { refreshSiteForecast } from '../aqours-api/src/services/monitoring/forecast.ts';
import { startMonitoringScheduler } from '../aqours-api/src/services/monitoring/worker.ts';
import { ok, request } from './harness.ts';
import { clock, configure, day, forecastLoader, observed, prisma, provider, session, site, users } from './distribution-fixtures.ts';

test('stale normal weather cannot resolve warnings and six-hour-old data cannot create new temperature warnings', async () => {
  const item = await site(); const config = await configure(item); await session(item, '200.00');
  await refreshSiteForecast(item.id, { now: clock, forecastLoader }); await evaluateSiteMonitoring(item.id, clock);
  const active = await ok<MonitoringWarning[]>(users.staff, 'GET', `/staff/distribution/warnings?siteId=${item.id}&state=active&limit=100`);
  assert.equal(active.length, 5); assert.ok(active.every(value => value.family === 'temperature'));
  await configure(item, { warningTemperature: 40, criticalTemperature: 45 }, config.version);
  await evaluateSiteMonitoring(item.id, new Date(clock.getTime() + 3600_000));
  assert.deepEqual(await ok(users.staff, 'GET', `/staff/distribution/warnings?siteId=${item.id}&state=active&limit=100`), active);
  await evaluateSiteMonitoring(item.id, clock);
  assert.equal((await ok<MonitoringWarning[]>(users.staff, 'GET', `/staff/distribution/warnings?siteId=${item.id}&state=active&limit=100`)).length, 0);
  const unknown = await site(); await configure(unknown); await session(unknown, '200.00');
  await refreshSiteForecast(unknown.id, { now: new Date(clock.getTime() - 6 * 3600_000), forecastLoader });
  await evaluateSiteMonitoring(unknown.id, clock);
  assert.equal((await ok<MonitoringWarning[]>(users.staff, 'GET', `/staff/distribution/warnings?siteId=${unknown.id}&state=active&limit=100`)).length, 0);
  const current = await observed(unknown.id);
  assert.equal(current.weather.status, 'unavailable');
  assert.ok(current.days.every(value => value.temperatureSeverity === null && value.status === 'unavailable' && value.incomplete));
});

test('missing forecast measurements remain incomplete and malformed provider payloads are never cached as success', async () => {
  const item = await site(); await configure(item); await session(item, '80.00');
  await refreshSiteForecast(item.id, { forecastLoader: async (latitude, longitude) => {
    const forecast = await forecastLoader(latitude, longitude); forecast.daily[0]!.temperatureMax = null; return forecast;
  } });
  await evaluateSiteMonitoring(item.id);
  const current = await observed(item.id);
  assert.equal(current.days[0]!.date, day()); assert.equal(current.days[0]!.temperature, null);
  assert.equal(current.days[0]!.temperatureSeverity, null); assert.equal(current.days[0]!.incomplete, true);
  assert.equal(current.days[0]!.status, 'warning', 'Known low supply remains visible beside missing temperature evidence');
  assert.ok(current.warnings.filter(value => value.forecastDate === day()).every(value => value.family === 'supply'));
  const malformed = await site(); await configure(malformed);
  provider.malformed = true;
  try { assert.equal(await refreshSiteForecast(malformed.id), true); }
  finally { provider.malformed = false; }
  const row = await prisma.monitoringForecast.findUniqueOrThrow({ where: { siteId: malformed.id } });
  assert.equal(row.lastSuccessAt, null); assert.equal(row.forecast, null); assert.equal(row.failures, 1);
  assert.equal((await observed(malformed.id)).weather.status, 'unavailable');
});

test('ambiguous supplier configuration fails closed before cached forecast or warning access', async () => {
  const item = await site(); await configure(item); await refreshSiteForecast(item.id, { forecastLoader });
  const id = randomUUID();
  await prisma.entity.create({ data: { id, kind: 'supplier' } });
  await prisma.supplier.create({ data: { id, name: 'Fictional ambiguous supplier', demo: true } });
  try {
    for (const path of ['/staff/distribution/monitoring', `/staff/pickup-sites/${item.id}/forecast`, '/staff/distribution/warnings',
      '/staff/distribution/temperature-bands', '/staff/distribution/notifications']) {
      const result = await request(users.staff, 'GET', path);
      assert.equal(result.status, 503, path); assert.equal(result.body.error!.code, 'supplier_configuration');
    }
  } finally {
    await prisma.supplier.delete({ where: { id } }); await prisma.entity.delete({ where: { id } });
  }
  assert.equal((await observed(item.id)).weather.status, 'fresh');
});

test('running scheduler consumes dirty stock revisions within five seconds and shutdown stops new work', async () => {
  const item = await site(); await configure(item); let pickup = await session(item, '200.00');
  await refreshSiteForecast(item.id, { forecastLoader }); await evaluateSiteMonitoring(item.id);
  const shutdown = startMonitoringScheduler();
  const waitFor = async (condition: () => Promise<boolean>, timeout: number) => {
    const deadline = Date.now() + timeout;
    while (!await condition()) {
      assert.ok(Date.now() < deadline, 'Scheduler did not consume durable dirty revision before deadline');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };
  try {
    pickup = await ok<PickupSession>(users.staff, 'PATCH', `/staff/distribution/sessions/${pickup.id}`, {
      expectedVersion: pickup.version, totalLiters: '50.00', reason: 'Fictional critical stock scheduler check' });
    await waitFor(async () => {
      const work = await prisma.monitoringWork.findUniqueOrThrow({ where: { siteId: item.id } });
      return work.revision === work.evaluatedRevision;
    }, 5000);
    const warnings = (await observed(item.id)).warnings;
    assert.ok(warnings.some(value => value.family === 'supply' && value.severity === 'critical'));
  } finally { await shutdown(); }
  await ok(users.staff, 'PATCH', `/staff/distribution/sessions/${pickup.id}`, {
    expectedVersion: pickup.version, totalLiters: '200.00', reason: 'Fictional stopped-worker dirty revision' });
  await new Promise(resolve => setTimeout(resolve, 4200));
  const queued = await prisma.monitoringWork.findUniqueOrThrow({ where: { siteId: item.id } });
  assert.ok(queued.revision > queued.evaluatedRevision, 'Shutdown prevents claiming more work');
  await evaluateSiteMonitoring(item.id);
  const recovered = await prisma.monitoringWork.findUniqueOrThrow({ where: { siteId: item.id } });
  assert.equal(recovered.revision, recovered.evaluatedRevision, 'New worker can recover durable outstanding revision');
});

test('evaluation waiting behind site activation consumes current state and the latest revision', async () => {
  const item = await site(); await configure(item); await session(item, '50.00');
  await refreshSiteForecast(item.id, { forecastLoader });
  await ok(users.staff, 'PATCH', `/staff/pickup-sites/${item.id}`, { expectedVersion: item.version, active: false, reason: 'Fictional inactive-to-active concurrency fixture' });
  await evaluateSiteMonitoring(item.id);
  let locked!: () => void, release!: () => void;
  const entered = new Promise<void>(resolve => { locked = resolve; });
  const allowed = new Promise<void>(resolve => { release = resolve; });
  const activation = prisma.$transaction(async db => {
    await db.$queryRaw`SELECT site_id FROM monitoring_work WHERE site_id=${item.id}::uuid FOR UPDATE`;
    locked(); await allowed;
    await db.pickupSite.update({ where: { id: item.id }, data: { active: true } });
  }, { timeout: 10000 });
  await entered;
  const evaluation = evaluateSiteMonitoring(item.id);
  try {
    const deadline = Date.now() + 3000;
    let waiting = false;
    while (!waiting) {
      const rows = await prisma.$queryRaw<{ count: bigint }[]>`SELECT count(*) FROM pg_stat_activity
        WHERE datname=current_database() AND pid<>pg_backend_pid() AND wait_event_type='Lock'
        AND query LIKE '%SELECT site_id FROM monitoring_work%'`;
      waiting = Number(rows[0]!.count) > 0;
      assert.ok(waiting || Date.now() < deadline, 'Evaluation must be observed waiting on the held durable work lock');
      if (!waiting) await new Promise(resolve => setTimeout(resolve, 10));
    }
  } finally { release(); }
  await activation; await evaluation;
  const current = await observed(item.id);
  assert.equal(current.site.active, true); assert.equal(current.warnings.length, 11);
  const work = await prisma.monitoringWork.findUniqueOrThrow({ where: { siteId: item.id } });
  assert.equal(work.evaluatedRevision, work.revision, 'Current state must be evaluated before the newest revision is acknowledged');
});
