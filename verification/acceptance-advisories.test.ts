import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import type { Advisory, Connection, Notification, User, Zone } from '../aqours-contracts/src/index.ts';
import { actors, connection, denied, fixturePassword, key, login, ok, request } from './harness.ts';
import { databaseSQL } from './database-client.ts';

let users: Awaited<ReturnType<typeof actors>>;
before(async () => { users = await actors(); });
const database = process.env.AQOURS_TEST_DATABASE_URL ?? 'postgresql://cred@127.0.0.1:55432/aqours_test';
const sql = (query: string) => databaseSQL(query, database);
function uuid(value: string) { assert.match(value, /^[0-9a-f-]{36}$/i); return value; }

async function advisory(zoneIds: string[], connectionIds: string[] = []) {
  return ok<Advisory>(users.admin, 'POST', '/staff/advisories', {
    kind: 'do_not_drink', title: 'Fictional acceptance notice',
    text: 'DEMONSTRATION ONLY: approved supplier fixture, not actual water-safety advice.',
    source: 'Fictional software acceptance source', zoneIds, connectionIds, demo: true,
  });
}

test('a report-free zone-only audience with two matching connections receives one persisted publication notification', async () => {
  const { admin, b } = users;
  const zone = await ok<Zone>(admin, 'POST', '/staff/settings/zones', {
    code: `AUDIENCE-${key()}`, name: 'Fictional report-free audience zone', demo: true,
  });
  const account = await ok<User>(admin, 'POST', '/staff/settings/accounts', {
    email: `report-free-${key()}@demo.aqours.test`, name: 'Fictional report-free customer',
    password: fixturePassword, role: 'customer',
  });
  for (let index = 0; index < 2; index++) await ok<Connection>(admin, 'POST', '/staff/settings/connections', {
    customerId: account.id, reference: `AUDIENCE-${key()}`, address: `Fictional audience connection ${index}`,
    zoneId: zone.id, zoneConfirmed: true,
  });
  assert.equal(sql(`SELECT count(*) FROM records WHERE kind='report' AND owner_id='${uuid(account.id)}'`), '0');
  const customer = await login(account.email);
  const draft = await advisory([zone.id]);
  assert.deepEqual(draft.connectionIds, []);
  const operation = key(), body = { expectedVersion: draft.version };
  const published = await ok<Advisory>(admin, 'POST', `/staff/advisories/${draft.id}/publish`, body, operation);
  assert.equal((await ok<Advisory>(admin, 'POST', `/staff/advisories/${draft.id}/publish`, body, operation)).version, published.version);
  const notices = await ok<Notification[]>(customer, 'GET', '/notifications?limit=100');
  const matching = notices.filter(notice => notice.targetId === draft.id);
  assert.equal(matching.length, 1);
  assert.equal(matching[0].targetType, 'advisory');
  assert.equal((await ok<Advisory>(customer, 'GET', `/advisories/${draft.id}`)).state, 'published');
  await denied(b, 'GET', `/advisories/${draft.id}`);
  assert.equal(sql(`SELECT count(*) FROM notifications WHERE data->>'targetId'='${uuid(draft.id)}'`), '1');
  assert.equal(sql(`SELECT count(*) FROM records WHERE kind='report' AND owner_id='${uuid(account.id)}'`), '0');
});

function snapshot(id: string, operation: string) {
  return JSON.parse(sql(`SELECT json_build_object(
    'state',(SELECT data->>'state' FROM records WHERE id='${uuid(id)}'),
    'version',(SELECT version FROM records WHERE id='${id}'),
    'revisions',(SELECT count(*) FROM records WHERE kind='advisory_revision' AND parent_id='${id}'),
    'events',(SELECT count(*) FROM events WHERE target_id='${id}'),
    'notifications',(SELECT count(*) FROM notifications WHERE data->>'targetId'='${id}'),
    'operations',(SELECT count(*) FROM operations WHERE key='${uuid(operation)}'))`));
}

test('advisory fan-out failure rolls back state, revisions, events, operation and notifications before same-key recovery', async () => {
  const { a, b, admin } = users;
  const draft = await advisory([], [(await connection(a)).id, (await connection(b)).id]);
  const operation = key(), body = { expectedVersion: draft.version };
  const before = snapshot(draft.id, operation);
  const trigger = `verify_advisory_${key().replaceAll('-', '')}`;
  sql(`CREATE FUNCTION ${trigger}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.data->>'targetId'='${uuid(draft.id)}' THEN RAISE EXCEPTION 'Injected advisory publication fault'; END IF; RETURN NEW; END $$; CREATE TRIGGER ${trigger} BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION ${trigger}();`);
  try {
    assert.equal((await request(admin, 'POST', `/staff/advisories/${draft.id}/publish`, body, operation)).status, 500);
    assert.deepEqual(snapshot(draft.id, operation), before);
    await denied(a, 'GET', `/advisories/${draft.id}`);
  } finally {
    sql(`DROP TRIGGER ${trigger} ON notifications; DROP FUNCTION ${trigger}();`);
  }
  const published = await ok<Advisory>(admin, 'POST', `/staff/advisories/${draft.id}/publish`, body, operation);
  assert.equal(published.state, 'published');
  assert.deepEqual(snapshot(draft.id, operation), {
    state: 'published', version: draft.version + 1, revisions: before.revisions + 1,
    events: before.events + 1, notifications: 2, operations: 1,
  });
  assert.equal((await ok<Advisory>(admin, 'POST', `/staff/advisories/${draft.id}/publish`, body, operation)).version, published.version);
  assert.equal(snapshot(draft.id, operation).notifications, 2);
});
