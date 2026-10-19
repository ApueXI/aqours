import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import type { Metrics, Report, ReportDetail } from '../aqours-contracts/src/index.ts';
import { actors, key, ok, report } from './harness.ts';
import { databaseSQL } from './database-client.ts';

let users: Awaited<ReturnType<typeof actors>>;
before(async () => { users = await actors(); });
const database = process.env.AQOURS_TEST_DATABASE_URL ?? 'postgresql://cred@127.0.0.1:55432/aqours_test';
const sql = (query: string) => databaseSQL(query, database);
function uuid(value: string) { assert.match(value, /^[0-9a-f-]{36}$/i); return value; }

async function review(item: Report, status: string, closureOutcome?: string) {
  return ok<Report>(users.staff, 'PATCH', `/staff/reports/${item.id}`, {
    expectedVersion: item.version, status, reason: 'Reviewed fictional metric fixture',
    ...(closureOutcome ? { closureOutcome } : {}),
  });
}
async function resolve(item: Report) {
  item = await review(item, 'under_review');
  item = await review(item, 'in_progress');
  return review(item, 'resolved', 'restored');
}
function meanDuration(items: Report[], field: 'firstRespondedAt' | 'firstResolvedAt') {
  const values = items.filter(item => item[field]).map(item =>
    (Date.parse(item[field]!) - Date.parse(item.submittedAt)) / 1000);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}
function assertCohort(actual: Metrics['firstResponse'] | Metrics['firstResolution'], expected: typeof actual) {
  const { meanSeconds: observed, ...counts } = actual;
  const { meanSeconds: target, ...expectedCounts } = expected;
  assert.deepEqual(counts, expectedCounts);
  if (target === null) assert.equal(observed, null);
  else {
    assert.equal(typeof observed, 'number');
    // Historical durations expose floating-point summation order. One microsecond
    // is below the timestamps' millisecond precision; every count remains exact.
    assert.ok(Math.abs(observed! - target) <= 0.000001, `Mean ${observed} differs from ${target}`);
  }
}

test('dashboard exact cohorts separate unresolved categories, pending responses, reviewed closures and historic resolutions', async () => {
  const { a, b, staff } = users;
  // Only these newly created report records receive controlled submission instants.
  // Real HTTP messages, review and follow-up still generate all measured end events.
  const clock = Date.UTC(2000, 0, 1) + Number.parseInt(key().replaceAll('-', '').slice(0, 10), 16) % 315360000000;
  const from = new Date(clock).toISOString(), to = new Date(clock + 1000).toISOString();
  const path = `/staff/metrics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const baseline = await ok<Metrics>(staff, 'GET', path);
  assert.equal(baseline.reportCount, 0);
  const items: Report[] = [];
  for (const [index, category] of ['outage', 'outage', 'low_pressure', 'leak', 'water_quality', 'water_quality', 'outage'].entries()) {
    const item = await report(index === 3 ? b : a, category, 'Fictional isolated dashboard cohort');
    const submittedAt = new Date(clock + (index === 6 ? 1000 : index * 100)).toISOString();
    sql(`UPDATE records SET data=jsonb_set(data,'{submittedAt}',to_jsonb('${submittedAt}'::text)) WHERE kind='report' AND id='${uuid(item.id)}'`);
    items.push(await ok<Report>(staff, 'GET', `/staff/reports/${item.id}`));
  }
  const read = (index: number) => ok<ReportDetail>(staff, 'GET', `/staff/reports/${items[index].id}`);
  await ok(staff, 'POST', `/staff/reports/${items[0].id}/notes`, { text: 'Internal note must not complete a response duration' });
  items[1] = await review(items[1], 'under_review');
  await ok(a, 'POST', `/reports/${items[1].id}/messages`, { text: 'Customer clarification is not staff response' });
  assert.equal((await read(1)).firstRespondedAt, null);
  for (const index of [1, 4, 5]) {
    await ok(staff, 'POST', `/staff/reports/${items[index].id}/messages`, { text: 'First visible supplier acknowledgment' });
    items[index] = await read(index);
  }
  const firstResponse = items[1].firstRespondedAt;
  await ok(staff, 'POST', `/staff/reports/${items[1].id}/messages`, { text: 'Later response must not reset the first response' });
  assert.equal((await read(1)).firstRespondedAt, firstResponse);
  items[2] = await review(items[2], 'resolved', 'duplicate');
  items[3] = await review(items[3], 'resolved', 'invalid');
  items[4] = await resolve(items[4]);
  items[5] = await resolve(items[5]);
  const firstResolution = items[5].firstResolvedAt;
  items[5] = await ok<Report>(a, 'POST', `/reports/${items[5].id}/still-affected`, {
    expectedVersion: items[5].version, reason: 'Individual service is still affected after supplier resolution',
  });
  assert.equal(items[5].firstResolvedAt, firstResolution);
  assert.equal(items[5].status, 'under_review');
  assert.equal((await read(0)).firstRespondedAt, null);
  const cohort = items.slice(0, 6);
  const metrics = await ok<Metrics>(staff, 'GET', path);
  assert.equal(metrics.from, from);
  assert.equal(metrics.to, to);
  assert.equal(metrics.timezone, 'Asia/Manila');
  assert.ok(Number.isFinite(Date.parse(metrics.asOf)));
  assert.match(metrics.cohort, /at or after from and before to/);
  assert.equal(metrics.reportCount, 6);
  assert.equal(metrics.uniqueConnections, 2);
  assert.equal(metrics.unresolvedReports, 3);
  assert.deepEqual(metrics.categories, { outage: 2, low_pressure: 1, leak: 1, water_quality: 2 });
  assert.equal(metrics.reviewedClosures, 2);
  assert.equal(metrics.reopenedReports, 1);
  assertCohort(metrics.firstResponse, {
    meanSeconds: meanDuration(cohort, 'firstRespondedAt'), sampleCount: 3, pendingCount: 3,
  });
  assertCohort(metrics.firstResolution, {
    meanSeconds: meanDuration(cohort, 'firstResolvedAt'), sampleCount: 2, excludedCount: 2, pendingCount: 2,
  });
  const category = await ok<Metrics>(staff, 'GET', path + '&category=water_quality');
  assert.equal(category.reportCount, 2);
  assert.equal(category.uniqueConnections, 1);
  assert.equal(category.unresolvedReports, 1);
  assert.equal(category.firstResolution.sampleCount, 2);
  assert.equal(category.reopenedReports, 1);
  assert.deepEqual(category.categories, { outage: 0, low_pressure: 0, leak: 0, water_quality: 2 });
  const reviewed = await ok<Metrics>(staff, 'GET', path + '&status=under_review');
  assert.equal(reviewed.reportCount, 2);
  assert.equal(reviewed.unresolvedReports, 2);
  assert.equal(reviewed.firstResponse.sampleCount, 2);
  assertCohort(reviewed.firstResolution, {
    meanSeconds: meanDuration([items[5]], 'firstResolvedAt'), sampleCount: 1, excludedCount: 0, pendingCount: 1,
  });
  const unanswered = await ok<Metrics>(staff, 'GET', path + '&status=received');
  assert.equal(unanswered.reportCount, 1);
  assert.deepEqual(unanswered.firstResponse, { meanSeconds: null, sampleCount: 0, pendingCount: 1 });
  const empty = await ok<Metrics>(staff, 'GET', path + '&category=leak&status=received');
  assert.equal(empty.reportCount, 0);
  assert.equal(empty.uniqueConnections, 0);
  assert.equal(empty.unresolvedReports, 0);
  assert.deepEqual(empty.firstResponse, { meanSeconds: null, sampleCount: 0, pendingCount: 0 });
  assert.deepEqual(empty.firstResolution, { meanSeconds: null, sampleCount: 0, excludedCount: 0, pendingCount: 0 });
  for (const result of [metrics, category, reviewed, unanswered, empty]) assert.equal(result.activeIncidents, baseline.activeIncidents);
  for (let index = 0; index < items.length; index++) {
    const unchanged = await read(index);
    assert.equal(unchanged.version, items[index].version);
    assert.equal(unchanged.status, items[index].status);
    assert.equal(unchanged.firstResolvedAt, items[index].firstResolvedAt);
  }
});
