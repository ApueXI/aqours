import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { prisma, transaction, type DB } from '../aqours-api/src/config/database.ts';
import { Prisma } from '../aqours-api/src/generated/prisma/client.ts';
import { all, create, get } from '../aqours-api/src/repositories/domain.repository.ts';
import { fixtureId, legacyVersion } from '../aqours-api/src/scripts/seed-legacy-locations.ts';
import { seedVersion } from '../aqours-api/src/scripts/seed-locations.ts';
import { upgradeLagunaFixtures, upgradeSeedLocations } from '../aqours-api/src/scripts/seed-upgrade-laguna.ts';
import { verifyLagunaSeed } from './seed-laguna.ts';

// Supply a migrated, original v1-seeded isolated database. This runner deliberately
// installs a transactional failure trigger; never point it at ordinary demo data.
assert.ok(process.env.DATABASE_URL && new URL(process.env.DATABASE_URL).pathname.endsWith('_test'));
assert.equal(process.env.SEED_DEMO, '1');
const results: string[] = [];
const passed = (message: string) => { results.push(message); console.log('PASS', message); };
const sentinel = new Error('Roll back isolated verification scenario');
async function fingerprint(db: DB | typeof prisma = prisma) {
  const tables = await db.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`;
  const values: Record<string, string> = {};
  for (const { tablename } of tables) {
    assert.match(tablename, /^[a-z_]+$/);
    const [row] = await db.$queryRaw<{ digest: string }[]>(Prisma.raw(
      `SELECT md5(COALESCE(string_agg(md5(to_jsonb(t)::text),'' ORDER BY to_jsonb(t)::text),'')) AS digest FROM "${tablename}" t`,
    ));
    values[tablename] = row!.digest;
  }
  return values;
}
async function rollbackScenario(name: string, run: (db: DB) => Promise<void>) {
  const before = await fingerprint();
  await assert.rejects(transaction(async db => { await run(db); throw sentinel; }), error => error === sentinel);
  assert.deepEqual(await fingerprint(), before, name);
  passed(name);
}
try {
  const markers = await prisma.seedMarker.findMany();
  assert.equal(markers.length, 1);
  assert.equal(markers[0]!.fixture, legacyVersion, 'Use a fresh v1 seed for this upgrade test');
  // A user-created report deliberately inherits the old saved location and must
  // stay historical even though its original demo connection will move.
  const unrelatedId = await transaction(async db => {
    const source = (await all(db, 'report'))[0]!;
    const { id: _id, version: _version, ...fields } = source;
    return (await create(db, 'report', { ...fields, description: 'User-created historical report retained by Laguna upgrade' }, null, null, randomUUID())).id;
  });
  const before = await fingerprint();
  const environment = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    await assert.rejects(upgradeSeedLocations());
  } finally { if (environment === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = environment; }
  const optIn = process.env.SEED_DEMO;
  try { delete process.env.SEED_DEMO; await assert.rejects(upgradeSeedLocations()); }
  finally { process.env.SEED_DEMO = optIn; }
  assert.deepEqual(await fingerprint(), before);
  passed('Production and missing opt-in refuse before writes');

  await rollbackScenario('Modified original geography aborts with no writes', async db => {
    await db.serviceConnection.update({ where: { id: fixtureId(200) }, data: { address: 'Manually reviewed address' } });
    await assert.rejects(upgradeLagunaFixtures(db), /Demo upgrade conflict/);
  });
  await rollbackScenario('An ambiguous original report aborts with no writes', async db => {
    const source = (await all(db, 'report')).find(row => row.description.startsWith('Fictional demonstration report 1:'))!;
    const { id: _id, version: _version, ...fields } = source;
    await create(db, 'report', fields);
    await assert.rejects(upgradeLagunaFixtures(db), /ambiguous original report/);
  });
  await rollbackScenario('Modified fixture identity flag aborts with no writes', async db => {
    await db.pickupSite.update({ where: { id: fixtureId(600) }, data: { demo: false } });
    await assert.rejects(upgradeLagunaFixtures(db), /Demo upgrade conflict/);
  });
  // Trigger after all location and publication work, at the version-marker commit.
  await prisma.$executeRawUnsafe(`CREATE FUNCTION fail_laguna_marker() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Deliberate isolated late upgrade failure'; END $$`);
  await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_laguna_marker BEFORE INSERT ON seed_markers FOR EACH ROW EXECUTE FUNCTION fail_laguna_marker()`);
  const failureBefore = await fingerprint();
  try {
    await assert.rejects(upgradeSeedLocations());
    assert.deepEqual(await fingerprint(), failureBefore);
  } finally {
    await prisma.$executeRawUnsafe('DROP TRIGGER fail_laguna_marker ON seed_markers');
    await prisma.$executeRawUnsafe('DROP FUNCTION fail_laguna_marker()');
  }
  passed('Failure after location/publication writes rolls back the entire upgrade');

  const domainBefore = await transaction(async db => all(db, 'report'));
  const historicalBefore = await prisma.incidentPublication.findMany({ orderBy: { id: 'asc' } });
  const eventsBefore = await prisma.event.findMany({ orderBy: { id: 'asc' } });
  const unrelatedBefore = await transaction(db => get(db, 'report', unrelatedId));
  const connectionsBefore = await prisma.serviceConnection.findMany({ orderBy: { id: 'asc' } });
  const concurrent = await Promise.all([upgradeSeedLocations(), upgradeSeedLocations()]);
  assert.deepEqual(concurrent.map(result => result.upgraded).sort(), [false, true]);
  const after = await fingerprint();
  const changedTables = new Set(['entities', 'events', 'zones', 'service_connections', 'reports', 'pickup_sites', 'incidents', 'assistance_requests', 'inspection_details', 'incident_publications', 'incident_publications_zone_ids', 'seed_markers']);
  for (const table of Object.keys(before).filter(table => !changedTables.has(table)))
    assert.equal(after[table], before[table], `${table} preserved byte-for-byte`);
  assert.deepEqual(await transaction(db => get(db, 'report', unrelatedId)), unrelatedBefore);
  const publications = await prisma.incidentPublication.findMany({ orderBy: { id: 'asc' } });
  assert.equal(publications.length, historicalBefore.length + 4);
  for (const row of historicalBefore) assert.deepEqual(publications.find(item => item.id === row.id), row);
  const events = await prisma.event.findMany({ orderBy: { id: 'asc' } });
  for (const row of eventsBefore) assert.deepEqual(events.find(item => item.id === row.id), row);
  const domainAfter = await transaction(async db => all(db, 'report'));
  for (const original of domainBefore.filter(row => row.id !== unrelatedId)) {
    const current = domainAfter.find(row => row.id === original.id)!;
    for (const field of Object.keys(original).filter(key => !['address', 'structuredAddress', 'latitude', 'longitude', 'version'].includes(key)))
      assert.deepEqual(current[field], original[field], `Report ${field} retained`);
    assert.equal(current.version, original.version + 1);
    assert.equal(current.structuredAddress.ancestry[1].code, '0403400000');
  }
  const connectionsAfter = await prisma.serviceConnection.findMany({ orderBy: { id: 'asc' } });
  for (const original of connectionsBefore) {
    const current = connectionsAfter.find(row => row.id === original.id)!;
    assert.deepEqual(current.changedAt, original.changedAt);
    assert.deepEqual(current.storedAt, original.storedAt);
  }
  assert.ok((await prisma.seedMarker.findMany()).some(row => row.fixture === seedVersion));
  await verifyLagunaSeed({ query: async sql => ({ rows: await prisma.$queryRawUnsafe<{ kind: string; data: Record<string, any> }[]>(sql) }) });
  assert.equal((await prisma.inspectionDetails.findUniqueOrThrow({ where: { requestId: fixtureId(803) } })).siteAddress, connectionsAfter.find(row => row.id === fixtureId(203))!.address);
  passed('Concurrent upgrades apply once; canonical Laguna fixtures, unrelated reports, immutable history, timestamps, credentials and stock are verified');
  assert.equal((await upgradeSeedLocations()).upgraded, false);
  assert.deepEqual(await fingerprint(), after);
  passed('Repeated upgrade is a complete database no-op');
} finally {
  await mkdir('.local/laguna/evidence', { recursive: true });
  await writeFile('.local/laguna/evidence/upgrade-results.txt', results.join('\n') + '\n');
  await prisma.$disconnect();
}
