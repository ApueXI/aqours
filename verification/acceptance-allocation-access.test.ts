import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import type { AssistanceRequest } from '../aqours-contracts/src/index.ts';
import { actors, connection, denied, fixturePassword, key, ok, request, transition, waterFixture, waterRequest } from './harness.ts';

let users: Awaited<ReturnType<typeof actors>>;
before(async () => { users = await actors(); });

test('customers cannot collect allocations and tampered allocation IDs cannot complete another request', async () => {
  const { a, b, staff, admin } = users;
  const session = await waterFixture(admin, (await connection(a)).zoneId!, '50.00');
  const service = await transition(staff, await waterRequest(a, session, '15.00'), 'accepted', { ownerId: staff.user.id });
  const allocation = service.allocation!;
  const body = {
    expectedVersion: service.version, reason: 'Immediate fictional collection',
    outcome: 'Collected fifteen demonstration liters', nextSteps: 'Review the report independently',
  };
  for (const customer of [a, b]) {
    await denied(customer, 'POST', `/staff/water-allocations/${allocation.id}/collect`, body);
    await denied(customer, 'POST', '/staff/pickup-sites', {
      name: 'Denied fixture site', address: 'Fictional location', instructions: 'Denied customer operation',
    });
  }
  await denied(b, 'GET', `/assistance-requests/${service.id}`);
  await denied(staff, 'POST', '/staff/settings/accounts', {
    email: `denied-${key()}@demo.aqours.test`, name: 'Denied account', role: 'customer', password: fixturePassword,
  });
  assert.equal((await request(staff, 'POST', `/staff/water-allocations/${service.id}/collect`, body, key())).status, 404);
  assert.equal((await request(staff, 'POST', `/staff/water-allocations/${key()}/collect`, body, key())).status, 404);
  const untouched = await ok<AssistanceRequest>(a, 'GET', `/assistance-requests/${service.id}`);
  assert.equal(untouched.version, service.version);
  assert.equal(untouched.status, 'accepted');
  assert.equal(untouched.allocation?.state, 'reserved');
  assert.equal(untouched.session?.reservedLiters, '15.00');
  const collected = await ok<AssistanceRequest>(staff, 'POST', `/staff/water-allocations/${allocation.id}/collect`, body);
  assert.equal(collected.status, 'completed');
  assert.equal(collected.allocation?.state, 'collected');
  assert.equal(collected.session?.remainingLiters, '35.00');
});
