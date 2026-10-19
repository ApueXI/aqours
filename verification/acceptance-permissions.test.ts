import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { before, test } from 'node:test';
import type { Advisory, AssistanceRequest, StaffIncident } from '../aqours-contracts/src/index.ts';
import { actors, connection, fixturePassword, key, ok, report, request } from './harness.ts';
import { databaseSQL } from './database-client.ts';

let users: Awaited<ReturnType<typeof actors>>;
let ids: Record<string, string>;
let draft: Advisory;
const database = process.env.AQOURS_TEST_DATABASE_URL ?? 'postgresql://cred@127.0.0.1:55432/aqours_test';
before(async () => {
  users = await actors();
  const item = await report(users.a, 'outage', `Fictional permissions fixture ${key()}`);
  const conn = await connection(users.a);
  const shared = await ok<StaffIncident>(users.staff, 'POST', '/staff/incidents', {
    category: 'outage', summary: `Fictional permissions incident ${key()}`,
    zoneIds: [conn.zoneId], area: 'Fictional permission test area', demo: true,
  });
  draft = await ok<Advisory>(users.admin, 'POST', '/staff/advisories', {
    kind: 'general', title: `Fictional permissions notice ${key()}`, text: 'DEMONSTRATION ONLY',
    source: 'Fictional verification', zoneIds: [], connectionIds: [conn.id], demo: true,
  });
  const service = await ok<AssistanceRequest>(users.a, 'POST', '/assistance-requests', {
    reportId: item.id, type: 'callback', details: {
      question: 'Fictional permission check', contactMethod: 'phone',
      contactNumber: '09000000001', preferredWindow: 'Tomorrow',
    },
  });
  ids = { report: item.id, incident: shared.id, advisory: draft.id, assistance: service.id,
    account: users.a.user.id, connection: conn.id, zone: conn.zoneId!, site: key(), session: key(), allocation: key() };
});

// Deliberately fixed from docs/api.md: adding a route does not silently redefine expected access.
const reads = [
  '/staff/reports', '/staff/reports/:report', '/staff/map/reports?west=-180&south=-90&east=180&north=90',
  '/staff/metrics', '/staff/incidents', '/staff/incidents/:incident',
  '/staff/assistance-requests', '/staff/assistance-requests/:assistance',
  '/staff/pickup-sites', '/staff/distribution/sessions', '/staff/advisories', '/staff/advisories/:advisory',
  '/staff/settings/accounts', '/staff/settings/connections', '/staff/settings/zones',
  '/staff/settings/guidance', '/staff/settings/rules', '/staff/audit',
  '/staff/zones', '/staff/users', '/staff/connections',
];
const operationalWrites = [
  ['PATCH', '/staff/reports/:report'], ['POST', '/staff/reports/:report/messages'],
  ['POST', '/staff/reports/:report/notes'], ['POST', '/staff/reports/:report/link'],
  ['POST', '/staff/incidents'], ['PATCH', '/staff/incidents/:incident'],
  ['POST', '/staff/incidents/:incident/notes'], ['POST', '/staff/incidents/:incident/updates'],
  ['POST', '/staff/assistance-requests/:assistance/transition'], ['POST', '/staff/assistance-requests/:assistance/notes'],
  ['POST', '/staff/pickup-sites'], ['PATCH', '/staff/pickup-sites/:site'],
  ['POST', '/staff/distribution/sessions'], ['PATCH', '/staff/distribution/sessions/:session'],
  ['POST', '/staff/distribution/sessions/:session/cancel'], ['POST', '/staff/water-allocations/:allocation/collect'],
];
const adminWrites = [
  ['POST', '/staff/advisories'], ['PATCH', '/staff/advisories/:advisory'],
  ['POST', '/staff/advisories/:advisory/publish'], ['POST', '/staff/advisories/:advisory/lift'],
  ['POST', '/staff/settings/accounts'], ['PATCH', '/staff/settings/accounts/:account'],
  ['POST', '/staff/settings/connections'], ['PATCH', '/staff/settings/connections/:connection'],
  ['POST', '/staff/settings/zones'], ['PATCH', '/staff/settings/zones/:zone'],
  ['POST', '/staff/settings/guidance'], ['POST', '/staff/settings/rules'],
];
const path = (template: string) => template.replace(/:([a-z]+)/g, (_match, name: string) => ids[name]);
function advisoryState() {
  return databaseSQL(`SELECT json_build_object('notice',(SELECT row_to_json(r) FROM records r WHERE id='${draft.id}'),
    'revisions',(SELECT json_agg(r ORDER BY id) FROM records r WHERE parent_id='${draft.id}'),
    'events',(SELECT json_agg(e ORDER BY id) FROM events e WHERE target_id='${draft.id}'),
    'notifications',(SELECT count(*) FROM notifications WHERE data->>'targetId'='${draft.id}'))`,
  database);
}

test('all 49 documented supplier endpoints reject unauthenticated and customer callers before data or commands', async () => {
  const before = advisoryState();
  const endpoints = [...reads.map(value => ['GET', value]), ...operationalWrites, ...adminWrites];
  assert.equal(endpoints.length, 49);
  for (const actor of [null, users.a]) for (const [method, template] of endpoints) {
    const result = await request(actor, method, path(template), method === 'GET' ? undefined : {
      expectedVersion: 1, reason: 'Fictional denied command', text: 'Fictional denied text',
    }, key());
    assert.equal(result.status, actor ? 403 : 401, `${actor ? 'customer' : 'anonymous'} ${method} ${template}`);
    assert.equal(result.body.data, undefined);
    assert.equal(result.body.error?.code, actor ? 'forbidden' : 'unauthenticated');
  }
  assert.equal(advisoryState(), before);
});

test('staff can read all 18 operational endpoints but cannot use any of 12 admin writes or 3 private settings reads', async () => {
  const before = advisoryState();
  const restricted = ['/staff/settings/accounts', '/staff/settings/connections', '/staff/settings/zones'];
  assert.equal(adminWrites.length, 12);
  const operationalReads = reads.filter(value => !restricted.includes(value));
  assert.equal(operationalReads.length, 18);
  for (const template of operationalReads)
    assert.equal((await request(users.staff, 'GET', path(template))).status, 200, template);
  for (const [method, template] of [...restricted.map(value => ['GET', value]), ...adminWrites]) {
    const result = await request(users.staff, method, path(template), method === 'GET' ? undefined : {
      expectedVersion: draft.version, reason: 'Fictional denied administrative action',
    }, key());
    assert.equal(result.status, 403, `${method} ${template}`);
    assert.equal(result.body.error?.code, 'forbidden');
    assert.equal(result.body.data, undefined);
  }
  assert.equal(advisoryState(), before);
});

test('isolated production auth emits secure cookies, generic invalid credentials and exact throttling without affecting main API', async () => {
  const app = new URL('../aqours-api/dist/app.js', import.meta.url).href;
  const db = new URL('../aqours-api/dist/config/database.js', import.meta.url).href;
  const script = `import { createApp } from ${JSON.stringify(app)}; import { prisma } from ${JSON.stringify(db)};
    const server = createApp().listen(0, '127.0.0.1', () => process.send({ port: server.address().port }));
    process.once('SIGTERM', () => server.close(() => prisma.$disconnect().then(() => process.exit(0))));`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', script], {
    cwd: new URL('..', import.meta.url), stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    env: { NODE_ENV: 'production', WEB_ORIGIN: 'https://supplier.demo.aqours.test',
      DATABASE_URL: database, PORT: '4002' },
  });
  try {
    const [ready] = await once(child, 'message', { signal: AbortSignal.timeout(10000) });
    const endpoint = `http://127.0.0.1:${(ready as { port: number }).port}/api/v1`;
    const headers = { Origin: 'https://supplier.demo.aqours.test', 'Content-Type': 'application/json' };
    const signIn = (email: string, password: string) => fetch(endpoint + '/auth/login', {
      method: 'POST', headers, body: JSON.stringify({ email, password, client: 'web' }),
    });
    const missing = await signIn(`missing-${key()}@demo.aqours.test`, 'FictionalIncorrectPassword');
    const wrong = await signIn('staff@demo.aqours.test', 'FictionalIncorrectPassword');
    assert.equal(missing.status, 401);
    assert.equal(wrong.status, 401);
    assert.deepEqual(await missing.json(), { error: { code: 'unauthenticated', message: 'Invalid email or password' } });
    assert.deepEqual(await wrong.json(), { error: { code: 'unauthenticated', message: 'Invalid email or password' } });
    const signed = await signIn('staff@demo.aqours.test', fixturePassword);
    assert.equal(signed.status, 200);
    const cookie = signed.headers.get('set-cookie') ?? '';
    for (const flag of [/; HttpOnly/i, /; Secure/i, /; SameSite=Lax/i, /; Path=\/api\/v1/i])
      assert.ok(flag.test(cookie), 'Production cookie attribute missing');
    const identity = (await signed.json()).data;
    assert.equal(identity.token, undefined);
    assert.equal(identity.user.role, 'staff');
    const authenticated = { ...headers, Cookie: cookie.split(';')[0], 'X-CSRF-Token': identity.csrfToken };
    assert.equal((await fetch(endpoint + '/auth/session', { headers: authenticated })).status, 200);
    const failedLogout = await fetch(endpoint + '/auth/logout', {
      method: 'POST', headers: { ...authenticated, 'X-CSRF-Token': 'wrong' }, body: '{}',
    });
    assert.equal(failedLogout.status, 403);
    assert.equal((await fetch(endpoint + '/auth/session', { headers: authenticated })).status, 200);
    for (let index = 0; index < 2; index++) {
      const logout = await fetch(endpoint + '/auth/logout', { method: 'POST', headers: authenticated, body: '{}' });
      assert.equal(logout.status, 200);
      assert.deepEqual(await logout.json(), { data: { loggedOut: true } });
    }
    assert.equal((await fetch(endpoint + '/auth/session', { headers: authenticated })).status, 401);
    for (let attempt = 4; attempt <= 12; attempt++)
      assert.equal((await signIn('staff@demo.aqours.test', 'FictionalIncorrectPassword')).status, 401);
    const throttled = await signIn('staff@demo.aqours.test', fixturePassword);
    assert.equal(throttled.status, 429);
    assert.deepEqual(await throttled.json(), { error: { code: 'rate_limit', message: 'Too many login attempts; try again shortly' } });
  } finally {
    if (child.exitCode === null) {
      const exited = once(child, 'exit', { signal: AbortSignal.timeout(5000) });
      child.kill('SIGTERM');
      try { await exited; } catch { child.kill('SIGKILL'); await once(child, 'exit'); }
    }
  }
});
