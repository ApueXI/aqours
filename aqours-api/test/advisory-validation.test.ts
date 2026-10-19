import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ActorRequest } from '../src/auth.js';
import type { DB } from '../src/db.js';
import { advisoryPublisher, advisoryTargets } from '../src/services/advisories.js';

test('publication rechecks current administrator and session while holding the user lock', async () => {
  const queries: string[] = [];
  const actor = { id: 'admin', version: 1, active: true, role: 'admin' };
  let sessionValid = true;
  const db = {
    query: async (sql: string) => {
      queries.push(sql);
      return sql.includes('FROM records')
        ? { rows: [{ id: actor.id, version: actor.version, data: actor }] }
        : { rows: sessionValid ? [{ token_hash: 'session' }] : [] };
    },
  } as unknown as DB;
  const req = {
    actor: { ...actor },
    session: { hash: 'session' },
  } as ActorRequest;
  await advisoryPublisher(db, req);
  assert.match(queries[0]!, /FOR UPDATE$/);
  assert.match(queries[1]!, /revoked_at IS NULL AND expires_at>now\(\)/);
  sessionValid = false;
  await assert.rejects(() => advisoryPublisher(db, req), { status: 401 });
  actor.role = 'staff';
  await assert.rejects(() => advisoryPublisher(db, req), { status: 403 });
  actor.role = 'admin';
  actor.active = false;
  await assert.rejects(() => advisoryPublisher(db, req), { status: 403 });
});

test('publication locks current targets and rejects a zone deactivated after draft creation', async () => {
  const calls: { kind: string; id: string; sql: string }[] = [];
  let active = true;
  const db = {
    query: async (sql: string, values: string[]) => {
      const [kind, id] = values;
      calls.push({ kind: kind!, id: id!, sql });
      return { rows: [{ id, version: 2, data: { active } }] };
    },
  } as unknown as DB;
  const doc = {
    id: 'draft',
    version: 1,
    zoneIds: ['zone'],
    connectionIds: ['b', 'a'],
  };
  await advisoryTargets(db, doc);
  assert.deepEqual(
    calls.map((v) => [v.kind, v.id]),
    [
      ['connection', 'a'],
      ['connection', 'b'],
      ['zone', 'zone'],
    ],
  );
  assert.ok(calls.every((v) => v.sql.endsWith('FOR UPDATE')));
  active = false;
  await assert.rejects(() => advisoryTargets(db, doc), { status: 400 });
  await assert.rejects(() => advisoryTargets(db, { ...doc, zoneIds: [], connectionIds: [] }), {
    status: 400,
  });
});
