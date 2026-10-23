import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import type { Connection, ConversationSummary, Guidance, Report, User } from '../aqours-contracts/src/index.ts';
import { actors, denied, key, login, ok, report, request } from './harness.ts';

// Run against a separately migrated/seeded test database, never an ordinary workspace.
assert.match(process.env.AQOURS_TEST_API || '', /:4049\/api\/v1$/);
const credentials = { password: 'FictionalInitial2026!', newPassword: 'FictionalChanged2026!' };
async function signIn(email: string, password: string) {
  const result = await request<{ user: User; token: string }>(null, 'POST', '/auth/login', { email, password, client: 'mobile' });
  assert.equal(result.status, 200);
  return result.data;
}

test('atomic customer provisioning creates one owned connection and retries without duplicates', async () => {
  const { admin, staff, a } = await actors();
  const zones = await ok<{ id: string }[]>(admin, 'GET', '/staff/zones');
  const body = { email: `provision-${randomUUID()}@example.test`, name: 'Fictional provision', role: 'customer', password: credentials.password,
    connection: { address: 'Fictional service address', zoneId: zones[0]!.id, zoneConfirmed: true } };
  const operation = key();
  const user = await ok<User>(admin, 'POST', '/staff/settings/accounts', body, operation);
  assert.deepEqual(await ok(admin, 'POST', '/staff/settings/accounts', body, operation), user);
  assert.equal(Object.hasOwn(user, 'password'), false);
  const owner = await signIn(body.email, credentials.password);
  const connections = await ok<Connection[]>(owner, 'GET', '/me/connections');
  assert.equal(connections.length, 1);
  assert.equal(connections[0]!.zoneId, zones[0]!.id);
  assert.match(connections[0]!.reference, /^CON-/);
  await denied(staff, 'POST', '/staff/settings/accounts', body);
  await denied(a, 'POST', '/staff/settings/accounts', body);
});

test('invalid connection rolls back the account and password; supplier accounts reject connection ownership', async () => {
  const { admin } = await actors();
  const email = `rollback-${randomUUID()}@example.test`;
  const body = { email, name: 'Fictional rollback', role: 'customer', password: credentials.password,
    connection: { address: 'Fictional address', zoneId: randomUUID(), zoneConfirmed: true } };
  const failed = await request(admin, 'POST', '/staff/settings/accounts', body, key());
  assert.equal(failed.status, 404);
  // Reusing the email proves the failed transaction left no user/credential behind.
  const user = await ok<User>(admin, 'POST', '/staff/settings/accounts', { ...body, connection: { address: 'Fictional address', zoneConfirmed: false } });
  assert.ok(user.id);
  const wrongRole = await request(admin, 'POST', '/staff/settings/accounts', { ...body, email: `staff-${randomUUID()}@example.test`, role: 'staff' }, key());
  assert.equal(wrongRole.status, 400);
});

test('password change validates current password, revokes other sessions and permits exact retry', async () => {
  const { admin } = await actors();
  const email = `password-${randomUUID()}@example.test`;
  await ok(admin, 'POST', '/staff/settings/accounts', { email, name: 'Fictional password', role: 'customer', password: credentials.password });
  const owner = await signIn(email, credentials.password);
  const other = await signIn(email, credentials.password);
  const failed = await request(owner, 'POST', '/me/password', { currentPassword: 'wrong', newPassword: credentials.newPassword }, key());
  assert.equal(failed.status, 400);
  await ok(other, 'GET', '/me');
  const body = { currentPassword: credentials.password, newPassword: credentials.newPassword };
  const operation = key();
  assert.deepEqual(await ok(owner, 'POST', '/me/password', body, operation), { changed: true });
  assert.deepEqual(await ok(owner, 'POST', '/me/password', body, operation), { changed: true });
  await denied(other, 'GET', '/me');
  await ok(owner, 'GET', '/me');
  const oldLogin = await request(null, 'POST', '/auth/login', { email, password: credentials.password, client: 'mobile' });
  assert.equal(oldLogin.status, 401);
  await signIn(email, credentials.newPassword);
});

test('conversation index filters ownership in the query and opens report-scoped messages', async () => {
  const { a, b, staff } = await actors();
  const item = await report(a, 'leak', 'Fictional inbox ownership scenario');
  const text = 'Fictional supplier inbox reply';
  await ok(staff, 'POST', `/staff/reports/${item.id}/messages`, { text });
  const inbox = await ok<ConversationSummary[]>(a, 'GET', '/messages?limit=100');
  assert.equal(inbox[0]!.reportId, item.id);
  assert.equal(inbox[0]!.latestMessage!.text, text);
  assert.equal((await ok<ConversationSummary[]>(b, 'GET', '/messages?limit=100')).some(row => row.reportId === item.id), false);
  assert.equal((await ok<ConversationSummary[]>(staff, 'GET', '/staff/messages?limit=100')).some(row => row.reportId === item.id), true);
  await denied(a, 'GET', '/staff/messages');
  await denied(b, 'GET', `/reports/${item.id}`);
});

test('question submission accepts false/unknown answers and retains all questionnaire options', async () => {
  const { a, b } = await actors();
  const item = await report(a);
  const answers = { needsWater: false, hazard: false, persistent: true, nearbyAffected: 'unknown' };
  const guidance = await ok<Guidance>(a, 'POST', `/reports/${item.id}/guidance`, { answers });
  assert.equal(guidance.current, true);
  assert.equal(guidance.questions.length, 4);
  await denied(b, 'POST', `/reports/${item.id}/guidance`, { answers });
});

test('supplier notifications persist new reports, customer messages and assistance; read state stays per recipient', async () => {
  const { a, b, admin, staff } = await actors();
  const item = await report(a, 'outage', 'Fictional supplier notification scenario');
  const body = { text: 'Fictional notification message' }, operation = key();
  await ok(a, 'POST', `/reports/${item.id}/messages`, body, operation);
  await ok(a, 'POST', `/reports/${item.id}/messages`, body, operation);
  const assistance = await ok<{ id: string }>(a, 'POST', '/assistance-requests', { reportId: item.id, type: 'water_support', details: { requestedLiters: '10.00' } });
  const entries = await ok<import('../aqours-contracts/src/index.ts').Notification[]>(admin, 'GET', '/staff/notifications?limit=100');
  assert.equal(entries.filter(n => n.targetId === item.id).length, 2);
  assert.equal(entries.filter(n => n.targetId === assistance.id).length, 1);
  const message = entries.find(n => n.targetId === item.id && n.title === 'Customer message')!;
  const staffEntries = await ok<import('../aqours-contracts/src/index.ts').Notification[]>(staff, 'GET', '/staff/notifications?limit=100');
  const staffMessage = staffEntries.find(n => n.targetId === item.id && n.title === 'Customer message')!;
  assert.ok(staffMessage);
  await ok(admin, 'PATCH', `/staff/notifications/${message.id}/read`, {});
  const own = await ok<import('../aqours-contracts/src/index.ts').Notification>(admin, 'GET', `/staff/notifications/${message.id}`);
  assert.ok(own.readAt);
  const other = await ok<import('../aqours-contracts/src/index.ts').Notification>(staff, 'GET', `/staff/notifications/${staffMessage.id}`);
  assert.equal(other.readAt, null);
  await denied(staff, 'GET', `/staff/notifications/${message.id}`);
  await denied(b, 'GET', '/staff/notifications');
});
