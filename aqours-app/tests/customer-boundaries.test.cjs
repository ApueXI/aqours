require('./load-typescript.cjs');
const assert = require('node:assert/strict');
const { test, beforeEach, after } = require('node:test');
const { randomUUID } = require('node:crypto');
process.env.EXPO_PUBLIC_API_URL = 'https://api.example.invalid/api/v1';
const { request, RequestError } = require('../src/lib/api.ts');
const { acquireIntention, finishIntention, clearIntentions } = require('../src/lib/operations.ts');
const { parseManilaInput, displayTime } = require('../src/lib/time.ts');
const originalFetch = global.fetch;
after(() => { global.fetch = originalFetch; });
beforeEach(() => clearIntentions());

test('mobile API uses bearer header, envelope, and stable operation key without URL credentials', async () => {
  let sent;
  global.fetch = async (url, options) => {
    sent = { url, ...options };
    return new Response(JSON.stringify({ data: { reference: 'R-123' } }), { status: 201 });
  };
  const response = await request('/reports', { method: 'POST', token: 'fictional-test-token', key: 'same-operation', body: { description: 'Low pressure' } });
  assert.equal(response.data.reference, 'R-123');
  assert.equal(sent.url, 'https://api.example.invalid/api/v1/reports');
  assert.equal(sent.headers.Authorization, 'Bearer fictional-test-token');
  assert.equal(sent.headers['Idempotency-Key'], 'same-operation');
  assert.equal(sent.body, '{"description":"Low pressure"}');
});

test('network failure and invalid success body remain uncertain, never synthetic success', async () => {
  global.fetch = async () => { throw new Error('offline'); };
  await assert.rejects(request('/reports'), (error) => error instanceof RequestError && error.status === 0 && error.code === 'NETWORK');
  global.fetch = async () => new Response('{}', { status: 200 });
  await assert.rejects(request('/reports'), (error) => error.status === 0 && error.code === 'INVALID_RESPONSE');
});

test('ownership and stale version errors retain server status and safe explanation', async () => {
  for (const status of [401, 403, 404, 409, 413, 415, 429, 503]) {
    global.fetch = async () => new Response(JSON.stringify({ error: { code: 'REJECTED', message: 'Safe explanation' } }), { status });
    await assert.rejects(request('/reports/foreign'), (error) => error.status === status && error.message === 'Safe explanation' && error.code === 'REJECTED');
  }
});

test('multipart uploads leave boundary header to fetch and retain the file body', async () => {
  let sent;
  global.fetch = async (_url, options) => {
    sent = options;
    return new Response(JSON.stringify({ data: { id: 'photo' } }), { status: 201 });
  };
  const body = new FormData();
  body.append('file', new Blob(['fixture'], { type: 'image/png' }), 'test.png');
  await request('/reports/owned/attachments', { method: 'POST', key: 'upload-key', body });
  assert.equal(sent.headers['Content-Type'], undefined);
  assert.equal(sent.body, body);
});

test('uncertain report retry preserves exact intention across route remounts', () => {
  const body = { connectionId: 'owned', description: 'No supply' };
  const first = acquireIntention('customer-a', '/reports', body, 'POST', randomUUID);
  const retried = acquireIntention('customer-a', '/reports', { ...body }, 'POST', randomUUID);
  assert.equal(first.intention.key, retried.intention.key);
  assert.equal(first.intention.body, retried.intention.body);
  finishIntention(first.identity);
  const deliberateNew = acquireIntention('customer-a', '/reports', body, 'POST', randomUUID);
  assert.notEqual(deliberateNew.intention.key, first.intention.key);
});

test('intention isolation covers customers, action paths, payload versions, and cleared sessions', () => {
  const first = acquireIntention('a', '/requests/id/cancel', { expectedVersion: 1 }, 'POST', randomUUID);
  const others = [
    acquireIntention('b', '/requests/id/cancel', { expectedVersion: 1 }, 'POST', randomUUID),
    acquireIntention('a', '/requests/other/cancel', { expectedVersion: 1 }, 'POST', randomUUID),
    acquireIntention('a', '/requests/id/cancel', { expectedVersion: 2 }, 'POST', randomUUID),
  ];
  for (const other of others) assert.notEqual(first.intention.key, other.intention.key);
  clearIntentions();
  assert.notEqual(acquireIntention('a', '/requests/id/cancel', { expectedVersion: 1 }, 'POST', randomUUID).intention.key, first.intention.key);
});

test('photo retries preserve original multipart body independently of report creation', () => {
  const firstBody = new FormData();
  const first = acquireIntention('a', '/reports/id/attachments', firstBody, 'POST', randomUUID, 'same-photo-uri');
  const replay = acquireIntention('a', '/reports/id/attachments', new FormData(), 'POST', randomUUID, 'same-photo-uri');
  assert.equal(replay.intention.body, firstBody);
  assert.equal(replay.intention.key, first.intention.key);
  const report = acquireIntention('a', '/reports', {}, 'POST', randomUUID);
  assert.notEqual(report.intention.key, replay.intention.key);
});

test('observed times use Manila and reject normalized invalid dates', () => {
  assert.equal(parseManilaInput('2026-10-18 08:30'), '2026-10-18T00:30:00.000Z');
  assert.equal(parseManilaInput('2026-02-30 08:30'), null);
  assert.equal(parseManilaInput('2026-10-18 24:30'), null);
  assert.equal(parseManilaInput('yesterday'), null);
  assert.match(displayTime('2026-10-18T00:30:00Z'), /8:30/);
  assert.equal(displayTime(null), 'Not yet confirmed');
});
