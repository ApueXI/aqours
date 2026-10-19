import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import type { AssistanceRequest, PickupSession } from '../aqours-contracts/src/index.ts';
import { actors, connection, key, ok, report, request, transition, waterFixture, waterRequest } from './harness.ts';
import { databaseSQL } from './database-client.ts';

let users: Awaited<ReturnType<typeof actors>>;
before(async () => { users = await actors(); });
const database = process.env.AQOURS_TEST_DATABASE_URL ?? 'postgresql://cred@127.0.0.1:55432/aqours_test';
const sql = (query: string) => databaseSQL(query, database);
function uuid(value: string) { assert.match(value, /^[0-9a-f-]{36}$/i); return value; }
const callbackDetails = {
  question: 'Fictional follow-up service question', contactMethod: 'phone',
  contactNumber: '09000000001', preferredWindow: 'Morning',
};
async function callback(reportId: string) {
  return ok<AssistanceRequest>(users.a, 'POST', '/assistance-requests', {
    reportId, type: 'callback', details: callbackDetails,
  });
}
async function history(id: string) {
  return ok<AssistanceRequest>(users.a, 'GET', `/assistance-requests/${id}`);
}

test('unsupported and terminal assistance transitions preserve history while later same-type requests remain legitimate', async () => {
  const { a, staff } = users;
  const item = await report(a);
  let service = await callback(item.id);
  for (const status of ['scheduled', 'in_progress', 'completed']) {
    const invalid = await request(staff, 'POST', `/staff/assistance-requests/${service.id}/transition`, {
      expectedVersion: service.version, status, ownerId: staff.user.id, reason: 'Unsupported shortcut',
      appointmentAt: new Date(Date.now() + 3600000).toISOString(), outcome: 'Invalid', nextSteps: 'Invalid',
    }, key());
    assert.equal(invalid.status, 409);
  }
  assert.deepEqual(await history(service.id), service);
  const finished: AssistanceRequest[] = [];
  finished.push(await ok<AssistanceRequest>(a, 'POST', `/assistance-requests/${service.id}/cancel`, {
    expectedVersion: service.version, reason: 'Cancel the first fictional request',
  }));
  service = await callback(item.id);
  finished.push(await transition(staff, service, 'unavailable', { reason: 'Fictional service unavailable; contact support' }));
  service = await transition(staff, await callback(item.id), 'accepted', { ownerId: staff.user.id });
  service = await transition(staff, service, 'in_progress', { reason: 'Customer available for immediate support' });
  service = await transition(staff, service, 'scheduled', {
    reason: 'Missed callback; customer agreed a later time', appointmentAt: new Date(Date.now() + 3600000).toISOString(),
  });
  assert.equal(service.canCancel, false);
  for (const actor of [a, staff]) {
    const path = actor === a ? `/assistance-requests/${service.id}/cancel` : `/staff/assistance-requests/${service.id}/transition`;
    assert.equal((await request(actor, 'POST', path, {
      expectedVersion: service.version, reason: 'Start boundary survives rescheduling', ...(actor === staff ? { status: 'cancelled' } : {}),
    }, key())).status, 409);
  }
  service = await transition(staff, service, 'in_progress');
  finished.push(await transition(staff, service, 'completed', {
    outcome: 'Fictional callback completed', nextSteps: 'Report remains under separate review',
  }));
  assert.deepEqual(finished.map(value => value.status), ['cancelled', 'unavailable', 'completed']);
  for (const terminal of finished) {
    const previous = await history(terminal.id);
    const invalid = await request(staff, 'POST', `/staff/assistance-requests/${terminal.id}/transition`, {
      expectedVersion: terminal.version, status: 'accepted', ownerId: staff.user.id,
    }, key());
    assert.equal(invalid.status, 409);
    assert.deepEqual(await history(terminal.id), previous);
  }
  const later = await callback(item.id);
  assert.equal(later.status, 'requested');
  assert.equal(new Set([...finished, later].map(value => value.id)).size, 4);
  assert.equal(sql(`SELECT count(*) FROM records WHERE kind='assistance' AND parent_id='${uuid(item.id)}'`), '4');
});

test('customer cancellation racing first work start commits one transition and one notification', async () => {
  const { a, staff } = users;
  let service = await transition(staff, await callback((await report(a)).id), 'accepted', { ownerId: staff.user.id });
  service = await transition(staff, service, 'scheduled', { appointmentAt: new Date(Date.now() + 3600000).toISOString() });
  const cancel = { expectedVersion: service.version, reason: 'Fictional cancellation competing with work start' };
  const start = { expectedVersion: service.version, status: 'in_progress' };
  const cancelKey = key(), startKey = key();
  const attempts = await Promise.all([
    request<AssistanceRequest>(a, 'POST', `/assistance-requests/${service.id}/cancel`, cancel, cancelKey),
    request<AssistanceRequest>(staff, 'POST', `/staff/assistance-requests/${service.id}/transition`, start, startKey),
  ]);
  assert.deepEqual(attempts.map(value => value.status).sort(), [200, 409]);
  const winner = attempts.find(value => value.status === 200)!.data;
  assert.equal(winner.version, service.version + 1);
  assert.ok(['cancelled', 'in_progress'].includes(winner.status));
  assert.equal(winner.canCancel, false);
  const replay = winner.status === 'cancelled'
    ? await ok<AssistanceRequest>(a, 'POST', `/assistance-requests/${service.id}/cancel`, cancel, cancelKey)
    : await ok<AssistanceRequest>(staff, 'POST', `/staff/assistance-requests/${service.id}/transition`, start, startKey);
  assert.deepEqual(replay, winner);
  const { notes: _notes, ...publicWinner } = winner;
  assert.deepEqual(await history(service.id), publicWinner);
  assert.equal(sql(`SELECT count(*) FROM events WHERE target_id='${uuid(service.id)}' AND action IN ('cancelled','in_progress')`), '1');
  assert.equal(sql(`SELECT count(*) FROM notifications WHERE data->>'targetId'='${service.id}' AND data->>'title' IN ('Assistance cancelled','Assistance in_progress')`), '1');
});

test('session cancellation racing collection retains exactly one irreversible allocation outcome', async () => {
  const { a, admin, staff } = users;
  const pickup = await waterFixture(admin, (await connection(a)).zoneId!, '100.00');
  const service = await transition(staff, await waterRequest(a, pickup, '35.25'), 'accepted', { ownerId: staff.user.id });
  const collect = { expectedVersion: service.version, reason: 'Immediate fictional pickup', outcome: 'Collected demo water', nextSteps: 'Review report independently' };
  const cancellation = { expectedVersion: service.session!.version, reason: 'Fictional session cancelled; supplier support follow-up' };
  const attempts = await Promise.all([
    request<AssistanceRequest>(staff, 'POST', `/staff/water-allocations/${service.allocation!.id}/collect`, collect, key()),
    request<PickupSession>(staff, 'POST', `/staff/distribution/sessions/${pickup.id}/cancel`, cancellation, key()),
  ]);
  assert.deepEqual(attempts.map(value => value.status).sort(), [200, 409]);
  let current = await history(service.id);
  if (current.session!.status !== 'cancelled') {
    await ok(staff, 'POST', `/staff/distribution/sessions/${pickup.id}/cancel`, {
      ...cancellation, expectedVersion: current.session!.version,
    });
    current = await history(service.id);
  }
  assert.equal(current.session!.status, 'cancelled');
  assert.equal(current.session!.reservedLiters, '0.00');
  assert.equal(current.allocation!.id, service.allocation!.id);
  assert.equal(current.allocation!.liters, '35.25');
  assert.equal(current.canCancel, false);
  const collected = attempts[0].status === 200;
  assert.equal(current.status, collected ? 'completed' : 'unavailable');
  assert.equal(current.allocation!.state, collected ? 'collected' : 'released');
  assert.equal(current.session!.collectedLiters, collected ? '35.25' : '0.00');
  assert.equal(current.session!.remainingLiters, collected ? '64.75' : '100.00');
  if (!collected) assert.match(current.nextSteps!, /support/);
  const retry = await request(staff, 'POST', `/staff/water-allocations/${service.allocation!.id}/collect`, {
    ...collect, expectedVersion: current.version,
  }, key());
  assert.equal(retry.status, 409);
  assert.equal(sql(`SELECT count(*) FROM allocations WHERE request_id='${uuid(service.id)}'`), '1');
  assert.equal(sql(`SELECT count(*) FROM events WHERE target_id='${service.id}' AND action IN ('collected','session_cancelled')`), '1');
  assert.equal(sql(`SELECT count(*) FROM notifications WHERE data->>'targetId'='${service.id}' AND data->>'title' IN ('Water collected','Pickup session cancelled')`), '1');
});
