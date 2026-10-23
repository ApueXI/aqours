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

import type { MonitoredSite } from '@aqours/contracts';
import { distributionLink, distributionState, filterMonitoredSites, manilaToday } from '../src/features/distribution/utils/distribution-state';

test('distribution URL preserves site, date, filters and independent layers across tabs and basemap styles', () => {
  const original = new URLSearchParams('tab=monitoring&date=2026-10-23&siteId=site-a&status=warning&q=Laguna&view=map&style=streets&temperature=0');
  const link = distributionLink(original, { tab: 'sessions', style: 'dark' });
  const state = distributionState(new URLSearchParams(link.split('?')[1]), ['2026-10-22', '2026-10-23']);
  assert.deepEqual(state, { tab: 'sessions', date: '2026-10-23', siteId: 'site-a', status: 'warning', q: 'Laguna', view: 'map', style: 'dark', temperature: false });
  assert.equal(original.get('tab'), 'monitoring');
  assert.equal(new URLSearchParams(distributionLink(original, { q: '' }).split('?')[1]).has('q'), false);
});

test('distribution rejects expired forecast dates and invalid enum values and defaults to Manila today', () => {
  assert.equal(manilaToday(new Date('2026-10-22T16:01:00Z')), '2026-10-23');
  const state = distributionState(new URLSearchParams('tab=other&date=2020-01-01&style=custom&view=other&status=bogus'), ['2026-10-22', '2026-10-23']);
  assert.equal(state.tab, 'monitoring'); assert.equal(state.date, '2026-10-22'); assert.equal(state.style, 'streets');
  assert.equal(state.status, ''); assert.equal(state.view, 'list'); assert.equal(state.temperature, true);
});

test('distribution filters use server day status and retain unlocated sites without calculating risk from temperature', () => {
  const sites = [
    { site: { id: 'a', name: 'Laguna site', address: 'Santa Rosa', latitude: null, longitude: null }, days: [{ date: '2026-10-22', status: 'critical', temperature: 20 }] },
    { site: { id: 'b', name: 'Second site', address: 'Calamba' }, days: [{ date: '2026-10-22', status: 'unavailable', temperature: null }] },
  ] as MonitoredSite[];
  assert.deepEqual(filterMonitoredSites(sites, '2026-10-22', 'critical', 'LAGUNA').map(item => item.site.id), ['a']);
  assert.deepEqual(filterMonitoredSites(sites, '2026-10-23', 'unavailable', '').map(item => item.site.id), ['a', 'b']);
  assert.deepEqual(filterMonitoredSites(sites, '2026-10-22', 'normal', ''), []);
});


import { warningHistoryDate } from '../src/features/distribution/components/MonitoringWarnings';

test('warning history supports unrestricted dates and all dates separately from the seven-day forecast selection', () => {
  const forecastDay = '2026-10-22';
  assert.equal(warningHistoryDate(null, forecastDay), forecastDay);
  assert.equal(warningHistoryDate('all', forecastDay), undefined);
  assert.equal(warningHistoryDate('2026-10-01', forecastDay), '2026-10-01');
  assert.equal(warningHistoryDate('2027-01-01', forecastDay), '2027-01-01');
  for (const invalid of ['2026-02-30', '2026-13-01', 'not-a-date', '2026-1-1']) assert.equal(warningHistoryDate(invalid, forecastDay), forecastDay);
  const params = new URLSearchParams(`tab=warnings&date=${forecastDay}&siteId=site-a`);
  const changed = new URLSearchParams(distributionLink(params, { warningDate: 'all' }).split('?')[1]);
  assert.equal(changed.get('date'), forecastDay);
  assert.equal(changed.get('siteId'), 'site-a');
  assert.equal(changed.get('warningDate'), 'all');
  assert.equal(distributionState(changed, [forecastDay]).date, forecastDay);
});
