import assert from 'node:assert/strict';
import { test } from 'node:test';
import { provisionAccountBody } from '../src/features/settings/utils/provision-account.ts';

test('customer provision groups the saved address and reviewed zone into an atomic request', () => {
  assert.deepEqual(provisionAccountBody({ role: 'customer', name: 'Fictional Customer', address: 'Test address', zoneId: 'zone-a', zoneConfirmed: true, structuredAddress: null }), {
    role: 'customer', name: 'Fictional Customer', connection: { address: 'Test address', zoneId: 'zone-a', zoneConfirmed: true, structuredAddress: null },
  });
  assert.deepEqual(provisionAccountBody({ role: 'staff', name: 'Staff', address: 'Old value', zoneId: 'zone-a', zoneConfirmed: true }), { role: 'staff', name: 'Staff' });
});
