import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createIntent, query, RequestError, request, sendIntent, setCsrfToken } from '../src/services/http-client';

const originalFetch = globalThis.fetch;
const browser = new EventTarget();
Object.defineProperty(globalThis, 'window', { value: browser, configurable: true });
afterEach(() => { globalThis.fetch = originalFetch; setCsrfToken(undefined); });
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

test('cookie mutations send CSRF and freeze key/body across uncertain transport retry', async () => {
  setCsrfToken('test-csrf');
  const calls: RequestInit[] = [];
  globalThis.fetch = async (_url, init) => {
    calls.push(init!);
    if (calls.length === 1) throw new TypeError('offline');
    return reply({ data: { id: 'committed' } });
  };
  const payload = { text: 'A customer message' };
  const intent = createIntent('/staff/reports/test/messages', 'POST', payload);
  payload.text = 'Changed after submission';
  await assert.rejects(sendIntent(intent), (error: unknown) => error instanceof RequestError && error.status === 0);
  assert.equal(createIntent(intent.path, intent.method, { text: 'A customer message' }).key, intent.key);
  const result = await sendIntent<{ id: string }>(intent);
  assert.equal(result.data.id, 'committed');
  assert.equal(calls[0].body, calls[1].body);
  assert.equal(calls[0].body, '{"text":"A customer message"}');
  assert.equal(calls[0].credentials, 'include');
  assert.equal(calls[0].cache, 'no-store');
  const headers = calls[0].headers as Headers;
  assert.equal(headers.get('X-CSRF-Token'), 'test-csrf');
  assert.equal(headers.get('Idempotency-Key'), (calls[1].headers as Headers).get('Idempotency-Key'));
  assert.notEqual(createIntent(intent.path, intent.method, { text: 'A customer message' }).key, intent.key);
});

test('a known version conflict clears the old intention for reviewed resubmission', async () => {
  globalThis.fetch = async () => reply({ error: { code: 'conflict', message: 'Version changed' } }, 409);
  const body = { expectedVersion: 1, reason: 'Reviewed' };
  const intent = createIntent('/staff/reports/conflict', 'PATCH', body);
  await assert.rejects(sendIntent(intent), (error: unknown) => error instanceof RequestError && error.status === 409);
  assert.notEqual(createIntent(intent.path, intent.method, body).key, intent.key);
});

test('server failure retains operation identity and never returns a fake success', async () => {
  globalThis.fetch = async () => reply({ error: { code: 'unavailable', message: 'Try later' } }, 503);
  const intent = createIntent('/staff/incidents/server-error/updates', 'POST', { progress: 'Reviewing' });
  await assert.rejects(sendIntent(intent));
  assert.equal(createIntent(intent.path, intent.method, { progress: 'Reviewing' }).key, intent.key);
});

test('unauthorized responses immediately broadcast session revocation', async () => {
  let ended = false;
  const handler = () => { ended = true; };
  browser.addEventListener('aqours-session-ended', handler);
  globalThis.fetch = async () => reply({ error: { code: 'unauthenticated', message: 'Session ended' } }, 401);
  await assert.rejects(request('/staff/reports'));
  assert.equal(ended, true);
  browser.removeEventListener('aqours-session-ended', handler);
});

test('unreadable success remains uncertain for safe same-key recovery', async () => {
  globalThis.fetch = async () => new Response('<html>Unavailable</html>');
  const intent = createIntent('/staff/incidents/unreadable/updates', 'POST', { progress: 'Published' });
  await assert.rejects(sendIntent(intent), (error: unknown) => error instanceof RequestError && error.status === 0);
  assert.equal(createIntent(intent.path, intent.method, { progress: 'Published' }).key, intent.key);
});

test('filters omit missing values, preserve zero, and escape text', () => {
  assert.equal(query({ category: 'water_quality', offset: 0, from: '', missing: undefined, reason: 'a&b' }), '?category=water_quality&offset=0&reason=a%26b');
});

test('malformed JSON success envelopes preserve the original mutation for recovery', async () => {
  for (const malformed of [{}, null, [], { error: { message: 'Unexpected success status' } }]) {
    const payload = { text: 'Committed but response unverified' };
    const intent = createIntent('/staff/reports/invalid-envelope/messages', 'POST', payload);
    globalThis.fetch = async () => reply(malformed);
    await assert.rejects(sendIntent(intent), (error: unknown) => error instanceof RequestError && error.status === 0 && error.code === 'invalid_response');
    assert.equal(createIntent(intent.path, intent.method, payload).key, intent.key);
  }
});
