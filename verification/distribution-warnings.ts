import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { MonitoringWarning, MonitoringWarningHistory, Notification, PickupSession, SupplierMonitoringNotification } from '../aqours-contracts/src/index.ts';
import { evaluateSiteMonitoring } from '../aqours-api/src/services/monitoring/evaluate.ts';
import { refreshSiteForecast } from '../aqours-api/src/services/monitoring/forecast.ts';
import { runMonitoringTick } from '../aqours-api/src/services/monitoring/worker.ts';
import { key, ok, request } from './harness.ts';
import { clock, configure, day, forecastLoader, observed, prisma, provider, session, site, users } from './distribution-fixtures.ts';

async function warnings(siteId: string, state = '') {
  return ok<MonitoringWarning[]>(users.staff, 'GET', `/staff/distribution/warnings?siteId=${siteId}&limit=100${state ? `&state=${state}` : ''}`);
}
async function detail(id: string) {
  return ok<{ warning: MonitoringWarning; history: MonitoringWarningHistory[] }>(users.staff, 'GET', `/staff/distribution/warnings/${id}`);
}
async function notices(siteId: string, actor = users.staff) {
  return (await ok<SupplierMonitoringNotification[]>(actor, 'GET', '/staff/distribution/notifications?limit=100')).filter(value => value.siteId === siteId);
}

test('exact warning boundaries independently create temperature/supply/combined families with highest severity', async () => {
  const item = await site(); await configure(item); let pickup = await session(item, '100.00');
  await refreshSiteForecast(item.id, { forecastLoader });
  await evaluateSiteMonitoring(item.id);
  const active = await warnings(item.id, 'active');
  assert.equal(active.length, 11);
  assert.equal(active.filter(value => value.family === 'temperature').length, 5);
  assert.equal(active.filter(value => value.family === 'supply').length, 1);
  assert.equal(active.filter(value => value.family === 'combined').length, 5);
  for (const [offset, expected] of [[0, 'warning'], [1, 'critical'], [3, 'warning'], [5, 'warning'], [6, 'critical']] as const) {
    assert.equal(active.find(value => value.forecastDate === day(offset) && value.family === 'temperature')!.severity, expected);
    assert.equal(active.find(value => value.forecastDate === day(offset) && value.family === 'combined')!.severity, expected);
  }
  assert.ok(active.filter(value => value.family === 'supply').every(value => value.severity === 'warning'));
  const snapshot = await observed(item.id);
  assert.equal(snapshot.days[2]!.temperatureSeverity, 'normal'); assert.equal(snapshot.days[3]!.temperatureSeverity, 'warning');
  assert.ok(snapshot.days.every(value => value.supplySeverity === 'warning' && !value.incomplete));
  const initialHistory = await Promise.all(active.map(value => detail(value.id)));
  assert.ok(initialHistory.every(value => value.history.length === 1 && value.history[0]!.action === 'triggered'));
  const initialNotices = await notices(item.id);
  assert.equal(initialNotices.length, 1, 'Consolidate all daily/family transitions into one notice per recipient');
  const adminNotices = await notices(item.id, users.admin); assert.equal(adminNotices.length, 1);
  assert.notEqual(adminNotices[0]!.id, initialNotices[0]!.id);
  assert.equal((await request(users.admin, 'POST', `/staff/distribution/notifications/${initialNotices[0]!.id}/read`, {}, key())).status, 404);
  const read = await ok<SupplierMonitoringNotification>(users.staff, 'POST', `/staff/distribution/notifications/${initialNotices[0]!.id}/read`, {});
  assert.ok(read.readAt); assert.equal((await notices(item.id, users.admin))[0]!.readAt, null);
  const customerNotices = await ok<Notification[]>(users.a, 'GET', '/notifications?limit=100');
  assert.ok(customerNotices.every(value => String(value.targetType) !== 'monitoring'));
  assert.equal((await request(users.a, 'GET', `/notifications/${initialNotices[0]!.id}`)).status, 404);
  await Promise.all(Array.from({ length: 8 }, () => evaluateSiteMonitoring(item.id)));
  assert.deepEqual(await warnings(item.id, 'active'), active);
  assert.equal((await notices(item.id)).length, 1);
  pickup = await ok<PickupSession>(users.staff, 'PATCH', `/staff/distribution/sessions/${pickup.id}`, { expectedVersion: pickup.version,
    totalLiters: '50.00', reason: 'Fictional exact critical stock boundary' });
  await evaluateSiteMonitoring(item.id);
  const escalated = await warnings(item.id, 'active');
  assert.ok(escalated.filter(value => value.family !== 'temperature').every(value => value.severity === 'critical'));
  assert.equal((await notices(item.id)).length, 2);
  for (const original of initialHistory) {
    const current = await detail(original.warning.id);
    assert.deepEqual(current.history[0], original.history[0], 'Escalation preserves old evidence/history');
  }
  await ok(users.staff, 'PATCH', `/staff/distribution/sessions/${pickup.id}`, { expectedVersion: pickup.version,
    totalLiters: '200.01', reason: 'Fictional replenishment resolves current supply warnings' });
  await evaluateSiteMonitoring(item.id);
  const remaining = await warnings(item.id, 'active');
  assert.equal(remaining.length, 5); assert.ok(remaining.every(value => value.family === 'temperature'));
  const closed = (await warnings(item.id)).filter(value => value.family !== 'temperature');
  assert.ok(closed.every(value => value.state === 'resolved' && value.closedReason));
  const history = (await detail(closed[0]!.id)).history;
  assert.deepEqual(history.map(value => value.revision), history.map((_, i) => i + 1));
  await assert.rejects(prisma.monitoringHistory.update({ where: { id: history[0]!.id }, data: { reason: 'Forbidden history mutation' } }));
  await assert.rejects(prisma.monitoringHistory.delete({ where: { id: history[0]!.id } }));
});

test('disabled inactive unavailable and past-date evidence suspend or expire warnings without false resolution', async () => {
  const item = await site(); let config = await configure(item); await session(item, '50.00', { end: 3 * 86400_000 });
  await refreshSiteForecast(item.id, { forecastLoader }); await evaluateSiteMonitoring(item.id);
  const original = await warnings(item.id, 'active'); assert.ok(original.length);
  config = await configure(item, { enabled: false }, config.version); await evaluateSiteMonitoring(item.id);
  assert.equal((await warnings(item.id, 'active')).length, 0);
  assert.ok((await warnings(item.id)).every(value => value.state === 'suspended'));
  config = await configure(item, { enabled: true }, config.version); await evaluateSiteMonitoring(item.id);
  assert.equal((await warnings(item.id, 'active')).length, original.length);
  const currentSite = (await observed(item.id)).site;
  await ok(users.staff, 'PATCH', `/staff/pickup-sites/${item.id}`, { expectedVersion: currentSite.version, active: false, reason: 'Fictional inactive pickup point' });
  await evaluateSiteMonitoring(item.id);
  assert.equal((await warnings(item.id, 'active')).length, 0);
  assert.ok((await warnings(item.id)).every(value => value.state === 'suspended'));
  const dated = await site(); await configure(dated); await session(dated, '50.00', { end: 3 * 86400_000 });
  await refreshSiteForecast(dated.id, { forecastLoader }); await evaluateSiteMonitoring(dated.id);
  const todayWarnings = (await warnings(dated.id, 'active')).filter(value => value.forecastDate === day());
  await evaluateSiteMonitoring(dated.id, new Date(clock.getTime() + 86400_000));
  for (const warning of todayWarnings) {
    const current = await detail(warning.id); assert.equal(current.warning.state, 'expired');
    assert.equal(current.history.at(-1)!.action, 'expired');
  }
  assert.ok((await warnings(dated.id)).some(value => value.state === 'suspended'), 'Six-hour-old temperature evidence suspends future warnings');
});

test('same-severity evidence changes append immutable revisions without extra notifications', async () => {
  const item = await site(); await configure(item); let pickup = await session(item, '80.00');
  await refreshSiteForecast(item.id, { forecastLoader }); await evaluateSiteMonitoring(item.id);
  const original = (await warnings(item.id, 'active')).find(value => value.family === 'supply')!;
  const initial = await detail(original.id); assert.equal(initial.history.length, 1);
  const count = (await notices(item.id)).length;
  pickup = await ok<PickupSession>(users.staff, 'PATCH', `/staff/distribution/sessions/${pickup.id}`, {
    expectedVersion: pickup.version, totalLiters: '70.00', reason: 'Fictional stock update within warning band' });
  await evaluateSiteMonitoring(item.id);
  const updated = await detail(original.id);
  assert.equal(updated.warning.state, 'active'); assert.equal(updated.warning.severity, 'warning');
  assert.equal(updated.warning.evidence.availableLiters, '70.00');
  assert.equal(updated.warning.revision, original.revision + 1);
  assert.equal(updated.history.length, 2); assert.equal(updated.history[1]!.action, 'updated');
  assert.deepEqual(updated.history[0], initial.history[0]);
  assert.equal((await notices(item.id)).length, count, 'Unchanged severity does not notify recipients again');
  await Promise.all([evaluateSiteMonitoring(item.id), evaluateSiteMonitoring(item.id)]);
  assert.deepEqual(await detail(original.id), updated, 'Observation time alone does not produce another revision');
  assert.equal(pickup.remainingLiters, '70.00');
});

test('durable revisions survive concurrent worker passes and upstream requests stay bounded to three', async () => {
  const fixtures = await Promise.all(Array.from({ length: 5 }, () => site()));
  for (const item of fixtures) { await configure(item); await session(item, '50.00'); }
  provider.maximumActive = 0;
  await Promise.all([runMonitoringTick(), runMonitoringTick()]);
  assert.ok(provider.maximumActive > 0 && provider.maximumActive <= 3, `Observed ${provider.maximumActive} upstream requests`);
  for (const item of fixtures) {
    const work = await prisma.monitoringWork.findUniqueOrThrow({ where: { siteId: item.id } });
    assert.equal(work.revision, work.evaluatedRevision); assert.equal(work.leaseToken, null);
    const current = await warnings(item.id, 'active'); assert.equal(current.length, 11);
    assert.equal(new Set(current.map(value => `${value.family}/${value.forecastDate}`)).size, current.length);
    assert.equal((await notices(item.id)).length, 2, 'Pre-forecast supply and complete weather transitions each consolidate once');
    for (const record of await Promise.all(current.map(value => detail(value.id)))) {
      assert.equal(record.history.filter(value => value.action === 'triggered').length, 1);
      assert.ok(record.history.slice(1).every(value => value.action === 'updated'));
      assert.equal(new Set(record.history.map(value => value.revision)).size, record.history.length);
    }
  }
  const before = await prisma.monitoringHistory.count();
  await Promise.all([runMonitoringTick(), runMonitoringTick()]);
  assert.equal(await prisma.monitoringHistory.count(), before, 'Repeated concurrent passes create no duplicate histories');
});
