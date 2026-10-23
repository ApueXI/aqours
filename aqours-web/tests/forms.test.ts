import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFields, type Field } from '../src/components/ActionForm';
import { transitionTargets } from '../src/features/assistance/components/AssistanceActions';
import type { AssistanceRequest } from '@aqours/contracts';

test('exact liter amounts remain strings and missing optional coordinates remain null', () => {
  const fields: Field[] = [
    { name: 'totalLiters', label: 'Liters' },
    { name: 'latitude', label: 'Latitude', type: 'number', nullable: true },
    { name: 'longitude', label: 'Longitude', type: 'number', nullable: true },
  ];
  const data = new FormData(); data.set('totalLiters', '999999999.99');
  assert.deepEqual(readFields(fields, data), { totalLiters: '999999999.99', latitude: null, longitude: null });
});

test('Manila appointment input becomes the intended UTC instant', () => {
  const data = new FormData(); data.set('appointmentAt', '2026-10-20T09:30');
  const result = readFields([{ name: 'appointmentAt', label: 'Appointment', type: 'datetime-local' }], data);
  assert.equal(result.appointmentAt, '2026-10-20T01:30:00.000Z');
});

test('multi-targets, boolean review, optional empty fields and unknown estimates retain their meaning', () => {
  const data = new FormData(); data.append('zoneIds', 'zone-a'); data.append('zoneIds', 'zone-b'); data.set('confirmed', 'on');
  const result = readFields([
    { name: 'zoneIds', label: 'Zones', type: 'multi' },
    { name: 'confirmed', label: 'Confirmed', type: 'checkbox' },
    { name: 'password', label: 'Password', omitEmpty: true },
    { name: 'restorationAt', label: 'Restoration', type: 'datetime-local', nullable: true },
  ], data);
  assert.deepEqual(result, { zoneIds: ['zone-a', 'zone-b'], confirmed: true, restorationAt: null });
});

test('invalid polygon JSON is rejected before any mutation can be created', () => {
  const data = new FormData(); data.set('geometry', '{bad json');
  assert.throws(() => readFields([{ name: 'geometry', label: 'Boundary', type: 'json' }], data));
});

test('water completion is offered only through the dedicated collection action', () => {
  const water = { type: 'water_support', status: 'in_progress' } as AssistanceRequest;
  const callback = { type: 'callback', status: 'in_progress' } as AssistanceRequest;
  assert.equal(transitionTargets(water).includes('completed'), false);
  assert.equal(transitionTargets(callback).includes('completed'), true);
  assert.deepEqual(transitionTargets({ type: 'inspection', status: 'completed' } as AssistanceRequest), []);
});

test('guided addresses retain structured codes and incomplete selections cannot be submitted during loading', () => {
  const fields: Field[] = [{ name: 'address', label: 'Address', type: 'address' }];
  const data = new FormData();
  data.set('address', 'Demo street, Barangay 1, City of Caloocan');
  data.set('address:guided', 'true'); data.set('address:structured', 'null');
  assert.throws(() => readFields(fields, data));
  const structured = { barangayCode: '1380100001', streetDetails: 'Demo street' };
  data.set('address:structured', JSON.stringify(structured));
  assert.deepEqual(readFields(fields, data), { address: data.get('address'), structuredAddress: structured });
  data.set('address:guided', 'false'); data.set('address:structured', 'null');
  assert.equal(readFields(fields, data).structuredAddress, null);
});

import { validateMonitoring, validateBands } from '../src/features/distribution/utils/monitoring-validation';

test('monitoring form validates ordered thresholds and optional positive capacity without changing exact liters', () => {
  const body = { warningTemperature: 35, criticalTemperature: 38, lowSupplyLiters: '100.25', criticalSupplyLiters: '0', capacityLiters: null };
  assert.equal(validateMonitoring(body), undefined);
  for (const invalid of [{ criticalTemperature: 35 }, { lowSupplyLiters: '' }, { criticalSupplyLiters: '-1' }, { criticalSupplyLiters: '100.25' }, { lowSupplyLiters: '100.251' }, { capacityLiters: '0' }]) {
    assert.equal(typeof validateMonitoring({ ...body, ...invalid }), 'string');
  }
  assert.equal(validateMonitoring({ ...body, capacityLiters: '10.00' }), undefined);
  assert.equal(body.lowSupplyLiters, '100.25');
});

test('temperature legend requires exactly four increasing finite numeric boundaries', () => {
  assert.equal(validateBands({ boundaries: [25, 30, 34, 37] }), undefined);
  for (const boundaries of [[25, 30, 34], [25, 30, 30, 37], [25, 30, 38, 37], ['25', 30, 34, 37], [25, 30, 34, Infinity]]) {
    assert.equal(typeof validateBands({ boundaries }), 'string');
  }
});
