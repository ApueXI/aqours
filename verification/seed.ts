import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fixturePassword } from './harness.ts';
import { verifyLagunaSeed } from './seed-laguna.ts';

const database = process.env.AQOURS_TEST_DATABASE_URL ?? 'postgresql://cred@127.0.0.1:55432/aqours_test';
assert.ok(new URL(database).pathname.endsWith('_test'), 'Use an isolated seeded database ending _test');
const requireApi = createRequire(new URL('../aqours-api/package.json', import.meta.url));
const { Client } = requireApi('pg');
const db = new Client({ connectionString: database });
const results: string[] = [];
const fixtureId = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
const passed = (message: string) => { results.push(`PASS ${message}`); console.log('PASS', message); };
type RecordRow = { id: string; kind: string; owner_id: string | null; data: Record<string, unknown> };
async function fixture(kind: string, value: number): Promise<RecordRow> {
  const result = await db.query('SELECT id,kind,owner_id,data FROM records WHERE kind=$1 AND id=$2', [kind, fixtureId(value)]);
  assert.equal(result.rows.length, 1, `Missing fictional ${kind} fixture`);
  return result.rows[0] as RecordRow;
}

try {
  await db.connect();
  await verifyLagunaSeed(db);
  passed('All original connections, sites and reports have canonical Laguna PSGC addresses and coherent location snapshots');
  const supplier = await fixture('supplier', 1);
  assert.equal(supplier.data.demo, true);
  const salts = new Set<string>();
  for (let index = 0; index < 14; index++) {
    const user = await fixture('user', 10 + index);
    const role = index === 0 ? 'admin' : index === 1 ? 'staff' : 'customer';
    const email = index === 0 ? 'admin@demo.aqours.test' : index === 1
      ? 'staff@demo.aqours.test' : `customer${String(index - 1).padStart(2, '0')}@demo.aqours.test`;
    assert.equal(user.data.email, email);
    assert.equal(user.data.role, role);
    assert.equal(user.data.active, true);
    const credential = await db.query('SELECT password_hash FROM credentials WHERE user_id=$1', [user.id]);
    assert.equal(credential.rows.length, 1);
    const [salt, expected] = String(credential.rows[0].password_hash).split(':');
    const actual = scryptSync(fixturePassword, salt!, 64);
    assert.equal(timingSafeEqual(actual, Buffer.from(expected!, 'hex')), true);
    salts.add(salt!);
    if (index >= 2) {
      const connection = await fixture('connection', 200 + index - 2);
      assert.equal(connection.owner_id, user.id);
      assert.equal(connection.data.customerId, user.id);
      assert.ok(String(connection.data.address).length > 0);
      if (index === 13) {
        assert.equal(connection.data.zoneId, null);
        assert.equal(connection.data.zoneConfirmed, false);
        assert.equal(connection.data.latitude, null);
        assert.equal(connection.data.longitude, null);
      }
    }
  }
  assert.equal(salts.size, 14);
  passed('One fictional supplier, fourteen active role-correct identities and twelve owned connections have valid independently salted demo credentials');
  for (let index = 0; index < 3; index++) {
    const zone = await fixture('zone', 100 + index);
    assert.equal(zone.data.demo, true);
    assert.equal(zone.data.code, `DEMO-${index + 1}`);
  }
  for (let index = 0; index < 2; index++) assert.equal((await fixture('site', 600 + index)).data.demo, true);
  const reports = (await db.query("SELECT data FROM records WHERE kind='report' AND data->>'description' LIKE 'Fictional demonstration report %'")).rows as {data: Record<string, unknown>}[];
  assert.equal(reports.length, 12);
  assert.deepEqual([...new Set(reports.map(row => row.data.category))].sort(), ['leak', 'low_pressure', 'outage', 'water_quality']);
  assert.ok(reports.some(row => row.data.latitude === null && row.data.zoneConfirmed === false));
  assert.ok(reports.some(row => row.data.status === 'under_review' && row.data.firstResolvedAt));
  passed('Three labeled zones, two labeled pickup sites and twelve reports retain all four categories, unknown location and still-affected history');
  const amounts = await db.query(`SELECT s.id,s.total::text,
    COALESCE(sum(a.liters) FILTER(WHERE a.state='reserved'),0)::numeric(14,2)::text AS reserved,
    COALESCE(sum(a.liters) FILTER(WHERE a.state='collected'),0)::numeric(14,2)::text AS collected
    FROM stock_sessions s LEFT JOIN allocations a ON a.session_id=s.id
    WHERE s.id=ANY($1::uuid[]) GROUP BY s.id,s.total ORDER BY s.id`, [[700, 701, 702].map(fixtureId)]);
  assert.deepEqual(amounts.rows.map((row: {total: string; reserved: string; collected: string}) => [row.total, row.reserved, row.collected]),
    [['1000.00', '20.00', '0.00'], ['100.00', '100.00', '0.00'], ['100.00', '0.00', '0.00']]);
  for (let index = 0; index < 3; index++) {
    const session = await fixture('pickup_session', 700 + index);
    assert.equal(session.data.demo, true);
    assert.equal(session.data.status, index === 2 ? 'cancelled' : 'open');
    assert.ok(Date.parse(String(session.data.startsAt)) < Date.parse(String(session.data.endsAt)));
    assert.ok(Date.parse(String(session.data.endsAt)) > Date.now(), 'Fixture sessions have aged; use a fresh isolated seed or deliberately maintain their dates');
  }
  const notice = await fixture('advisory', 500);
  assert.equal(notice.data.demo, true);
  assert.equal(notice.data.kind, 'boil_water');
  assert.equal(notice.data.state, 'published');
  assert.ok(Date.parse(String(notice.data.endsAt)) < Date.now());
  passed('Available/full/cancelled exact-stock fixtures remain coherent and the published demo quality restriction remains explicit after its end time');
} catch {
  results.push('FAIL Seed acceptance; check the isolated seed, fixture age and deliberate fixture maintenance privately');
  console.error(results.at(-1));
  process.exitCode = 1;
} finally {
  await db.end();
  await mkdir('.local/evidence', { recursive: true });
  await writeFile('.local/evidence/seed-results.txt', results.join('\n') + '\n');
}
