import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import type { Connection, Report } from '../aqours-contracts/src/index.ts';

const output = path.resolve('.local/customer-map');
const temporary = path.join(output, 'tmp');
await mkdir(temporary, { recursive: true });
const context = await chromium.launchPersistentContext(path.join(output, 'browser'), {
  executablePath: process.env.AQOURS_CHROMIUM || '/opt/brave.com/brave/brave', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  env: { ...process.env, TMPDIR: temporary, XDG_CACHE_HOME: path.join(output, 'cache'), XDG_CONFIG_HOME: path.join(output, 'config') },
});
const page = await context.newPage();
const errors: string[] = [];
const writes: string[] = [];
page.on('pageerror', error => errors.push(error.message));
const connections = ['one', 'two', 'three', 'four', 'five'].map(customerId => ({
  id: customerId, customerId, reference: `C-${customerId}`, address: `Fictional customer ${customerId}`,
  latitude: 14.23, longitude: 121.17, zoneConfirmed: true, zoneId: null, version: 1,
})) as Connection[];
connections.push({ ...connections[0], id: 'second-connection' });
connections.push({ ...connections[0], id: 'missing', customerId: 'missing', latitude: null, longitude: null });
const categories = ['outage', 'water_quality', 'leak', 'low_pressure'] as const;
let reports = categories.map((category, index) => ({
  id: `report-${index}`, reference: `R-${index}`, customerId: connections[index].customerId,
  connectionId: connections[index].id, category, priority: 'normal', status: 'received',
  address: connections[index].address, latitude: 14.23, longitude: 121.17,
  submittedAt: '2026-10-23T00:00:00Z', locationSource: 'gps', locationReview: false,
})) as Report[];
reports.push({ ...reports[0], id: 'duplicate', reference: 'R-duplicate', category: 'leak' });
await page.route('**/api/v1/**', async route => {
  const request = route.request();
  const url = new URL(request.url());
  const endpoint = url.pathname.replace('/api/v1', '');
  const headers = { 'Access-Control-Allow-Origin': 'http://127.0.0.1:5198', 'Access-Control-Allow-Credentials': 'true' };
  if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
  if (request.method() !== 'GET') writes.push(endpoint);
  let data: unknown = [];
  if (endpoint === '/auth/session') data = { user: { id: 'staff', role: 'staff', name: 'Fictional operator', active: true } };
  if (endpoint === '/staff/connections') data = connections;
  if (endpoint === '/staff/reports') data = reports;
  if (endpoint === '/staff/map/reports') data = { type: 'FeatureCollection', features: reports.map(report => ({
    type: 'Feature', geometry: { type: 'Point', coordinates: [report.longitude, report.latitude] }, properties: report,
  })), total: reports.length, unlocatedCount: 0, truncated: false, limit: 1000 };
  await route.fulfill({ headers, json: { data, page: { total: Array.isArray(data) ? data.length : 1, offset: 0, limit: 100 } } });
});
await page.route(/https:\/\/(maps\.geoapify\.com|tile\.openstreetmap\.org)\//, route => route.abort());
try {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('http://127.0.0.1:5198/#/map');
  await expect(page.locator('.report-cluster')).toHaveCount(1);
  await expect(page.locator('.report-cluster')).toHaveText('5');
  await expect(page.locator('.report-cluster span')).toHaveCSS('background-color', 'rgb(220, 38, 38)');
  await expect(page.getByText(/5 customers mapped · 1 without coordinates/)).toBeVisible();
  await page.screenshot({ path: path.join(output, 'desktop-cluster.png'), fullPage: true });
  console.log('PASS five unique customers despite duplicate connections/reports; missing location count; red mixed cluster');

  await page.locator('.report-cluster').click();
  await expect(page.locator('.report-marker')).toHaveCount(5);
  const colors = ['rgb(220, 38, 38)', 'rgb(124, 58, 237)', 'rgb(37, 99, 235)', 'rgb(180, 83, 9)'];
  for (const [index, category] of categories.entries()) {
    const marker = page.locator(`.report-marker[title^="R-${index} ·"]`);
    await expect(marker.locator('svg')).toHaveCount(1);
    await expect(marker.locator('span')).toHaveCSS('background-color', colors[index]);
    assert.ok((await marker.locator('svg path').getAttribute('d'))?.length, category);
  }
  await page.locator('.report-marker[title^="C-five"]').click();
  await expect(page.locator('.leaflet-popup')).toContainText('No open reports in current filters');
  await page.locator('.leaflet-popup-close-button').click();
  await page.locator('.report-marker[title^="R-0 ·"]').click();
  await expect(page.getByRole('region', { name: 'Selected report', exact: true })).toContainText('R-0');
  await expect(page.locator('.leaflet-popup')).toContainText('R-0');
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click();
  console.log('PASS distinct issue SVGs, neutral customer popup, report selection and five expanded customers');

  reports = reports.map(report => report.category === 'outage' ? { ...report, status: 'resolved' } : report);
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await expect(page.locator('.report-cluster span')).toHaveCSS('background-color', 'rgb(124, 58, 237)');
  reports = reports.map(report => ({ ...report, status: 'resolved' }));
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.locator('.report-cluster span')).toHaveCSS('background-color', 'rgb(71, 85, 105)');
  console.log('PASS cluster color refreshes from red to purple to neutral as reports resolve');

  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await expect(page.locator('.leaflet-container')).toBeVisible();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  const layer = page.getByRole('checkbox', { name: 'Customers', exact: true });
  await layer.uncheck(); await expect(page.locator('.report-cluster')).toHaveCount(0);
  await layer.check(); await expect(page.locator('.report-cluster')).toHaveText('5');
  await page.screenshot({ path: path.join(output, 'mobile-cluster.png'), fullPage: true });
  await page.goto('http://127.0.0.1:5198/#/reports');
  assert.deepEqual(errors, []); assert.deepEqual(writes, []);
  console.log('PASS mobile fit, layer toggle, teardown and zero runtime errors/writes');
} finally { await context.close(); }
