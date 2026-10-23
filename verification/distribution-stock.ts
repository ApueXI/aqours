import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AssistanceRequest, PickupSession } from '../aqours-contracts/src/index.ts';
import { ok, transition, waterRequest } from './harness.ts';
import { configure, observed, prisma, session, site, users } from './distribution-fixtures.ts';

test('monitoring sums exact decimals from open unexpired sessions including future starts only', async () => {
  const item = await site(); await configure(item);
  const current = await session(item, '100.10');
  const future = await session(item, '50.15', { start: 86400_000, end: 2 * 86400_000 });
  await session(item, '999.99', { start: -2 * 86400_000, end: -86400_000 });
  const closed = await session(item, '888.88');
  await ok(users.staff, 'PATCH', `/staff/distribution/sessions/${closed.id}`, { expectedVersion: closed.version, status: 'closed', reason: 'Fictional closed session' });
  const cancelled = await session(item, '777.77');
  await ok(users.staff, 'POST', `/staff/distribution/sessions/${cancelled.id}/cancel`, { expectedVersion: cancelled.version, reason: 'Fictional cancelled session' });
  const supply = (await observed(item.id)).supply;
  assert.equal(supply.available, true); assert.equal(supply.sessionCount, 2);
  assert.deepEqual([...supply.sessionIds].sort(), [current.id, future.id].sort());
  assert.equal(supply.totalLiters, '150.25'); assert.equal(supply.remainingLiters, '150.25');
  assert.equal(supply.reservedLiters, '0.00'); assert.equal(supply.collectedLiters, '0.00');
  assert.equal(supply.capacityPercentage, 150.25, 'Planning capacity ratio may exceed 100%');
});

test('monitoring reflects reserve release collect and cancelled session without double counting', async () => {
  const item = await site(); await configure(item);
  let pickup = await session(item, '100.25');
  const future = await session(item, '50.15', { start: 86400_000, end: 2 * 86400_000 });
  let revision = (await prisma.monitoringWork.findUniqueOrThrow({ where: { siteId: item.id } })).revision;
  const assertQueued = async () => {
    const queued = await prisma.monitoringWork.findUniqueOrThrow({ where: { siteId: item.id } });
    assert.ok(queued.revision > revision, 'Committed stock mutation must durably queue monitoring reevaluation');
    revision = queued.revision;
  };
  const first = await transition(users.staff, await waterRequest(users.a, pickup, '40.10'), 'accepted', { ownerId: users.staff.user.id });
  await assertQueued();
  const second = await transition(users.staff, await waterRequest(users.a, pickup, '20.05'), 'accepted', { ownerId: users.staff.user.id });
  await assertQueued();
  let supply = (await observed(item.id)).supply;
  assert.equal(supply.totalLiters, '150.40'); assert.equal(supply.reservedLiters, '60.15');
  assert.equal(supply.collectedLiters, '0.00'); assert.equal(supply.remainingLiters, '90.25');
  await ok<AssistanceRequest>(users.a, 'POST', `/assistance-requests/${second.id}/cancel`, { expectedVersion: second.version, reason: 'Fictional cancellation releases reserved liters' });
  await assertQueued();
  supply = (await observed(item.id)).supply;
  assert.equal(supply.reservedLiters, '40.10'); assert.equal(supply.remainingLiters, '110.30');
  await ok(users.staff, 'POST', `/staff/water-allocations/${first.allocation!.id}/collect`, { expectedVersion: first.version,
    reason: 'Fictional pickup', outcome: 'Collected 40.10 liters', nextSteps: 'Review future water needs separately' });
  await assertQueued();
  supply = (await observed(item.id)).supply;
  assert.equal(supply.reservedLiters, '0.00'); assert.equal(supply.collectedLiters, '40.10');
  assert.equal(supply.remainingLiters, '110.30', 'Collection moves reserved to collected without restoring availability');
  pickup = (await ok<PickupSession[]>(users.staff, 'GET', '/staff/distribution/sessions?limit=100')).find(value => value.id === pickup.id)!;
  await ok(users.staff, 'POST', `/staff/distribution/sessions/${pickup.id}/cancel`, { expectedVersion: pickup.version, reason: 'Fictional session cancellation preserves collection history' });
  await assertQueued();
  supply = (await observed(item.id)).supply;
  assert.deepEqual(supply.sessionIds, [future.id]); assert.equal(supply.remainingLiters, '50.15');
  await ok(users.staff, 'POST', `/staff/distribution/sessions/${future.id}/cancel`, { expectedVersion: future.version, reason: 'Fictional final session cancellation' });
  supply = (await observed(item.id)).supply;
  assert.equal(supply.available, false); assert.equal(supply.sessionCount, 0); assert.equal(supply.remainingLiters, '0.00');
});
