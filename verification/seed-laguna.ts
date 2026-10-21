import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

type Database = { query(sql: string, values?: unknown[]): Promise<{ rows: { kind: string; data: Record<string, any> }[] }> };
interface Place { psgc_code: string; name: string; geographic_level: string; children: Place[] }

/** Validate persisted fixture snapshots against the supplied catalog, including inheritance. */
export async function verifyLagunaSeed(db: Database) {
  const catalog = JSON.parse(await readFile(new URL('../psgc-address-data/data/0400000000-region-iv-a-calabarzon/addresses.json', import.meta.url), 'utf8')) as { region: Place };
  const laguna = catalog.region.children.find(place => place.psgc_code === '0403400000')!;
  const expected = ['0403405001', '0403411004', '0403428002'];
  const { rows } = await db.query(`SELECT v.kind,v.data || jsonb_build_object('structuredAddress',
    COALESCE(c.structured_address,r.structured_address,s.structured_address)) AS data
    FROM records v LEFT JOIN service_connections c ON c.id=v.id
    LEFT JOIN reports r ON r.id=v.id LEFT JOIN pickup_sites s ON s.id=v.id WHERE
    (v.kind='connection' AND v.data->>'reference' LIKE 'DEMO-CON-%') OR
    (v.kind='site' AND v.id IN ('00000000-0000-4000-8000-000000000600','00000000-0000-4000-8000-000000000601')) OR
    (v.kind='report' AND v.data->>'description' LIKE 'Fictional demonstration report %')`);
  assert.equal(rows.filter(row => row.kind === 'connection').length, 12);
  assert.equal(rows.filter(row => row.kind === 'site').length, 2);
  assert.equal(rows.filter(row => row.kind === 'report').length, 12);
  for (const { data } of rows) {
    const snapshot = data.structuredAddress;
    assert.ok(snapshot, 'Every original fixture must have a canonical PSGC snapshot');
    assert.equal(snapshot.datasetVersion, 'PSGC-2Q-2026');
    assert.ok(expected.includes(snapshot.barangayCode));
    const city = laguna.children.find(place => place.children.some(child => child.psgc_code === snapshot.barangayCode))!;
    const barangay = city.children.find(place => place.psgc_code === snapshot.barangayCode)!;
    assert.deepEqual(snapshot.ancestry, [catalog.region, laguna, city, barangay].map(place => ({
      code: place.psgc_code, name: place.name, level: place.geographic_level,
    })));
    assert.equal(data.address, [snapshot.streetDetails, ...[...snapshot.ancestry].reverse().map((place: { name: string }) => place.name), 'Philippines'].join(', '));
    if (data.latitude !== null) {
      assert.ok(data.latitude > 14.15 && data.latitude < 14.31);
      assert.ok(data.longitude > 121.09 && data.longitude < 121.26);
    } else assert.equal(data.longitude, null);
  }
  const connections = rows.filter(row => row.kind === 'connection');
  for (const report of rows.filter(row => row.kind === 'report')) {
    const connection = connections.find(row => row.data.customerId === report.data.customerId)!;
    for (const field of ['address', 'structuredAddress', 'latitude', 'longitude', 'zoneId', 'zoneConfirmed'])
      assert.deepEqual(report.data[field], connection.data[field], `Report inherits ${field}`);
  }
}
