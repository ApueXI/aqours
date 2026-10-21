import assert from 'node:assert/strict';
import { test } from 'node:test';
import { useQueueFilters } from '../src/hooks/useQueueFilters';
import { detailLink, returnLink } from '../src/app/navigation';

test('queue URL filters exclude navigation state and preserve an explicit inbox page', () => {
  const queue = useQueueFilters('reports', new URLSearchParams('category=leak&status=under_review&offset=30&selected=other&view=map&returnTo=bad'));
  assert.deepEqual(queue.filters, { category: 'leak', status: 'under_review' });
  assert.equal(queue.offset, 30);
  assert.equal(useQueueFilters('reports', new URLSearchParams('offset=-30')).offset, 0);
  assert.equal(useQueueFilters('reports', new URLSearchParams('offset=2.5')).offset, 0);
  assert.equal(useQueueFilters('reports', new URLSearchParams('offset=Infinity')).offset, 0);
});

test('assistance links retain queue context and reject external return destinations', () => {
  const queue = useQueueFilters('assistance', new URLSearchParams('type=inspection&status=requested&ownerId=staff&category=leak'));
  assert.deepEqual(queue.filters, { type: 'inspection', status: 'requested', ownerId: 'staff' });
  const link = detailLink('assistance', 'request-id', '/assistance?type=inspection&offset=30');
  const context = new URLSearchParams(link.split('?')[1]).get('returnTo');
  assert.equal(returnLink(context, 'assistance'), '#/assistance?type=inspection&offset=30');
  assert.equal(returnLink('https://example.com', 'reports'), '#/reports');
  assert.equal(returnLink('//example.com', 'reports'), '#/reports');
});
