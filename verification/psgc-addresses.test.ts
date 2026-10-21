import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Connection, PsgcPlace, Report, PickupSite, MapResponse } from '../aqours-contracts/src/index.ts';
import { actors, connection, key, ok, request } from './harness.ts';

test('authenticated PSGC catalog rejects invalid parents and remains available to every existing role', async () => {
  assert.equal((await request(null, 'GET', '/locations/psgc/regions')).status, 401);
  const users = await actors();
  for (const actor of [users.a, users.staff, users.admin]) {
    const regions = await ok<PsgcPlace[]>(actor, 'GET', '/locations/psgc/regions');
    assert.equal(regions.length, 18);
    assert.ok(regions.some(place => place.code === '0100000000'));
    const cities = await ok<PsgcPlace[]>(actor, 'GET', '/locations/psgc/children?parentCode=1300000000');
    assert.ok(cities.some(place => place.level === 'city'));
    assert.equal((await request(actor, 'GET', '/locations/psgc/children?parentCode=0000000000')).status, 400);
    assert.equal((await request(actor, 'GET', '/locations/psgc/children?parentCode=bad')).status, 400);
  }
});
test('PSGC addresses persist across connections, report snapshots, corrections, free text, and map projections', async () => {
  const { b: customer, admin, staff } = await actors();
  const baseline = await connection(customer);
  const input = { barangayCode: '1380100001', streetDetails: 'Fictional integration address' };
  const created = await ok<Connection>(admin, 'POST', '/staff/settings/connections', {
    customerId: customer.user.id, reference: `PSGC-${key()}`, address: 'Client supplied names are ignored',
    structuredAddress: input, zoneConfirmed: false,
  });
  assert.match(created.address, /Barangay 1, City of Caloocan/);
  assert.equal(created.structuredAddress?.datasetVersion, 'PSGC-2Q-2026');
  assert.equal(created.latitude, null); assert.equal(created.zoneConfirmed, false);
  const report = await ok<Report>(customer, 'POST', '/reports', { connectionId: created.id, category: 'leak', description: 'PSGC snapshot fixture', noticedAt: new Date().toISOString() });
  assert.deepEqual(report.structuredAddress, created.structuredAddress);
  const corrected = await ok<Connection>(admin, 'PATCH', `/staff/settings/connections/${created.id}`, {
    expectedVersion: created.version, reason: 'Fictional address correction', address: 'Corrected free-text address', structuredAddress: null,
  });
  assert.equal(corrected.structuredAddress, null);
  const original = await ok<Report>(customer, 'GET', `/reports/${report.id}`);
  assert.deepEqual(original.structuredAddress, created.structuredAddress);
  assert.equal(original.address, created.address);
  const located = await ok<Report>(customer, 'POST', '/reports', { connectionId: created.id, category: 'leak', description: 'PSGC GPS fixture', noticedAt: new Date().toISOString(),
    location: { address: 'Spoofed hierarchy', structuredAddress: input, source: 'gps', latitude: 14.6, longitude: 121.01, confirmed: true } });
  assert.match(located.address, /City of Caloocan/);
  assert.equal(located.zoneId, null); assert.equal(located.locationReview, true);
  const map = await ok<MapResponse>(staff, 'GET', '/staff/map/reports?west=120&south=14&east=122&north=15');
  const point = map.features.find(feature => feature.properties.id === located.id)!;
  assert.deepEqual(point.geometry.coordinates, [121.01, 14.6]);
  assert.equal(point.properties.address, located.address);
  assert.deepEqual(point.properties.structuredAddress, located.structuredAddress);
  assert.equal((await request(customer, 'GET', '/staff/map/reports?west=120&south=14&east=122&north=15')).status, 403);
  const invalid = await request(customer, 'POST', '/reports', { connectionId: created.id, category: 'leak', description: 'Bad catalog code', noticedAt: new Date().toISOString(),
    location: { address: 'Test', structuredAddress: { ...input, barangayCode: '1300000000' }, source: 'geocoded_address', confirmed: false } });
  assert.equal(invalid.status, 400);
  // Keep later fixture consumers' default connection context usable without another login.
  await ok(admin, 'PATCH', `/staff/settings/connections/${created.id}`, {
    expectedVersion: corrected.version, reason: 'Explicitly reviewed fictional fixture service context',
    zoneId: baseline.zoneId, zoneConfirmed: baseline.zoneConfirmed, latitude: baseline.latitude, longitude: baseline.longitude,
  });
});
test('staff pickup sites support guided addresses and legacy text edits without assigning coordinates', async () => {
  const { staff, a: customer } = await actors();
  const input = { name: 'Fictional PSGC pickup', address: 'Ignored hierarchy', instructions: 'Demo only', demo: true,
    structuredAddress: { barangayCode: '1380100002', streetDetails: 'Demo hall' } };
  assert.equal((await request(customer, 'POST', '/staff/pickup-sites', input)).status, 403);
  const site = await ok<PickupSite>(staff, 'POST', '/staff/pickup-sites', input);
  assert.equal(site.latitude, null); assert.match(site.address, /Barangay 2/);
  const edited = await ok<PickupSite>(staff, 'PATCH', `/staff/pickup-sites/${site.id}`, { expectedVersion: site.version, reason: 'Correct address', address: 'Free text correction' });
  assert.equal(edited.structuredAddress, null);
  const saved = await connection(customer);
  assert.equal(saved.structuredAddress, null);
  assert.ok(saved.address);
});
