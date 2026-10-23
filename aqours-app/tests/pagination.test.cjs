require('./load-typescript.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { fetchAllPages } = require('../src/utils/pagination.ts');

test('home obtains an older active restriction and incident beyond the first hundred records', async () => {
  for (const path of ['/advisories', '/incidents', '/reports']) {
    const records = Array.from({ length: 101 }, (_, index) => ({
      id: String(index), kind: index === 100 ? 'do_not_use' : 'general',
      status: index === 100 ? 'in_progress' : 'resolved',
    }));
    const calls = [];
    const result = await fetchAllPages(async (request) => {
      calls.push(request);
      const offset = Number(new URL(request, 'https://example.invalid').searchParams.get('offset'));
      return { data: records.slice(offset, offset + 100), page: { offset, limit: 100, total: records.length } };
    }, path);
    assert.equal(result.data.length, 101);
    assert.equal(result.data.at(-1).kind, 'do_not_use');
    assert.equal(result.data.filter((item) => item.status !== 'resolved').length, 1);
    assert.equal(calls.length, 2);
  }
});

test('failed or incomplete later pages never become a partial successful home list', async () => {
  await assert.rejects(fetchAllPages(async (request) => {
    const offset = Number(new URL(request, 'https://example.invalid').searchParams.get('offset'));
    return { data: offset === 0 ? ['first'] : [], page: { offset, limit: 100, total: 2 } };
  }, '/advisories'), /incomplete information/);
  await assert.rejects(fetchAllPages(async () => ({ data: null }), '/incidents'), /could not be verified/);
});

test('advisory discovery retains the history audience query across every page', async () => {
  const calls = [];
  const result = await fetchAllPages(async request => {
    const query = new URL(request, 'https://example.invalid').searchParams;
    calls.push(query);
    const offset = Number(query.get('offset'));
    return { data: [offset], page: { offset, limit: 1, total: 2 } };
  }, '/advisories?includeLifted=true');
  assert.deepEqual(result.data, [0, 1]);
  assert.equal(calls.length, 2);
  for (const query of calls) assert.equal(query.get('includeLifted'), 'true');
});
