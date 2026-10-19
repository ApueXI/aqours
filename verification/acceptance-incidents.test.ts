import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import type { Connection, Notification, Report, StaffIncident } from '../aqours-contracts/src/index.ts';
import { actors, connection, key, ok, request } from './harness.ts';
import { databaseSQL } from './database-client.ts';

let users: Awaited<ReturnType<typeof actors>>;
before(async () => { users = await actors(); });
const database = process.env.AQOURS_TEST_DATABASE_URL ?? 'postgresql://cred@127.0.0.1:55432/aqours_test';
const sql = (query: string) => databaseSQL(query, database);
function uuid(value: string) { assert.match(value, /^[0-9a-f-]{36}$/i); return value; }

async function incident(zoneId: string, summary: string, estimate?: number) {
  return ok<StaffIncident>(users.staff, 'POST', '/staff/incidents', {
    category: 'outage', summary, zoneIds: [zoneId], area: 'Fictional acceptance area', demo: true,
    ...(estimate === undefined ? {} : { estimatedAffected: estimate, estimateBasis: 'Independent fictional supplier estimate' }),
  });
}

async function submit(conn: Connection) {
  return ok<Report>(users.a, 'POST', '/reports', {
    connectionId: conn.id, category: 'outage', description: 'Separate fictional customer observation',
    noticedAt: new Date().toISOString(),
  });
}

test('concurrent and repeated affected assertions reuse one owned report without merging independent reports', async () => {
  const { a, b, staff } = users;
  const conn = await connection(a);
  const separate = await submit(conn);
  const shared = await incident(conn.zoneId!, 'Fictional affected-assertion concurrency');
  await ok(staff, 'POST', `/staff/incidents/${shared.id}/updates`, {
    expectedVersion: shared.version, progress: 'Fictional published investigation',
    area: shared.area, restorationAt: null,
  });
  const attempts = await Promise.all(Array.from({ length: 5 }, () =>
    request<Report>(a, 'POST', `/incidents/${shared.id}/affected`, { connectionId: conn.id }, key())));
  assert.ok(attempts.every(result => result.status === 200));
  assert.equal(new Set(attempts.map(result => result.data.id)).size, 1);
  const asserted = attempts[0].data;
  assert.notEqual(asserted.id, separate.id);
  assert.equal(asserted.customerId, a.user.id);
  assert.equal(asserted.connectionId, conn.id);
  assert.equal(asserted.incidentId, shared.id);
  assert.equal((await ok<Report>(a, 'POST', `/incidents/${shared.id}/affected`, { connectionId: conn.id })).id, asserted.id);
  assert.equal((await ok<Report>(a, 'GET', `/reports/${separate.id}`)).incidentId, null);
  const other = await ok<Report>(b, 'POST', `/incidents/${shared.id}/affected`, { connectionId: (await connection(b)).id });
  assert.notEqual(other.id, asserted.id);
  assert.equal(other.customerId, b.user.id);
  assert.equal(sql(`SELECT count(*) FROM records WHERE kind='report' AND data->>'assertedIncidentId'='${uuid(shared.id)}' AND owner_id='${uuid(a.user.id)}'`), '1');
  assert.equal(sql(`SELECT count(*) FROM events WHERE target_id='${uuid(asserted.id)}' AND action='affected'`), '1');
});

test('simultaneous corrective incident links have one version winner and preserve exact old/new history', async () => {
  const { a, staff } = users;
  const conn = await connection(a);
  let item = await submit(conn);
  const initial = await incident(conn.zoneId!, 'Fictional original incident association');
  const choices = await Promise.all(['Correction A', 'Correction B'].map(name => incident(conn.zoneId!, `Fictional ${name}`)));
  item = await ok<Report>(staff, 'POST', `/staff/reports/${item.id}/link`, {
    expectedVersion: item.version, incidentId: initial.id, reason: 'Initial reviewed association',
  });
  const attempts = await Promise.all(choices.map(candidate => request<Report>(staff, 'POST', `/staff/reports/${item.id}/link`, {
    expectedVersion: item.version, incidentId: candidate.id, reason: `Reviewed correction to ${candidate.summary}`,
  }, key())));
  assert.deepEqual(attempts.map(result => result.status).sort(), [200, 409]);
  const winner = attempts.find(result => result.status === 200)!.data;
  assert.equal(winner.version, item.version + 1);
  assert.equal((await ok<Report>(a, 'GET', `/reports/${item.id}`)).incidentId, winner.incidentId);
  const history = JSON.parse(sql(`SELECT COALESCE(json_agg(metadata ORDER BY created_at,id),'[]') FROM events WHERE target_id='${uuid(item.id)}' AND action='incident_link'`));
  assert.deepEqual(history, [
    { oldIncidentId: null, newIncidentId: initial.id },
    { oldIncidentId: initial.id, newIncidentId: winner.incidentId },
  ]);
});

test('two reports at one connection stay separate from unique connections and independent affected estimates', async () => {
  const { a, staff } = users;
  const conn = await connection(a);
  const shared = await incident(conn.zoneId!, 'Fictional independent estimate fixture', 137);
  const items = await Promise.all([submit(conn), submit(conn)]);
  assert.notEqual(items[0].id, items[1].id);
  for (const item of items) await ok(staff, 'POST', `/staff/reports/${item.id}/link`, {
    expectedVersion: item.version, incidentId: shared.id, reason: 'Reviewed independent reports from one connection',
  });
  const detail = await ok<StaffIncident>(staff, 'GET', `/staff/incidents/${shared.id}`);
  assert.equal(detail.reportCount, 2);
  assert.equal(detail.uniqueConnections, 1);
  assert.equal(detail.estimatedAffected, 137);
  assert.equal(detail.estimateBasis, 'Independent fictional supplier estimate');
  assert.deepEqual(new Set(detail.reports?.map(item => item.id)), new Set(items.map(item => item.id)));
  assert.ok(detail.reports?.every(item => item.connectionId === conn.id));
  await ok(staff, 'POST', `/staff/incidents/${shared.id}/updates`, {
    expectedVersion: detail.version, progress: 'Fictional publication for two reports at one connection',
    area: detail.area, restorationAt: null,
  });
  const notices=await ok<Notification[]>(a,'GET','/notifications?limit=100');
  assert.equal(notices.filter(notice=>notice.targetId===shared.id).length,1);
});
