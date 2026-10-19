import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { readAll } from '../src/hooks/useAllRecords';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
test('reference selectors and pickup lookup retrieve every page instead of silently truncating records', async () => {
  const offsets: string[] = [];
  globalThis.fetch = async url => {
    const parsed = new URL(String(url));
    offsets.push(parsed.searchParams.get('offset')!);
    const offset = Number(parsed.searchParams.get('offset'));
    return new Response(JSON.stringify({ data: offset === 0 ? ['a', 'b'] : ['c'], page: { offset, total: 3, limit: 2 } }));
  };
  assert.deepEqual((await readAll<string>('/staff/assistance-requests?type=water_support')).data, ['a', 'b', 'c']);
  assert.deepEqual(offsets, ['0', '2']);
});
test('a failed subsequent page never produces a partial successful lookup', async () => {
  globalThis.fetch = async url => {
    if (new URL(String(url)).searchParams.get('offset') === '0') return new Response(JSON.stringify({ data: ['a'], page: { offset: 0, total: 2, limit: 1 } }));
    throw new TypeError('offline');
  };
  await assert.rejects(readAll<string>('/staff/assistance-requests'));
});
