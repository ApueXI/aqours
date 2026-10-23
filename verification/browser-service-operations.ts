import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { serviceOperationsFixture } from './fixtures/service-operations.ts';
import { staff } from './fixtures/reports-workspace.ts';

const phase = process.env.AQOURS_VISUAL_PHASE || 'after';
const output = path.resolve(`.local/service-operations/${phase}`);
const temporary = path.resolve('.tmp');
await mkdir(output, { recursive: true });
await mkdir(temporary, { recursive: true });
const context = await chromium.launchPersistentContext(path.join(output, 'browser'), {
  executablePath: process.env.AQOURS_CHROMIUM || '/opt/brave.com/brave/brave', headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  env: { ...process.env, TMPDIR: temporary, XDG_CACHE_HOME: path.join(output, 'cache'), XDG_CONFIG_HOME: path.join(output, 'config') },
});
const page = await context.newPage();
const errors: string[] = [], writes: string[] = [];
const measurements: object[] = [];
let empty = false, failed = false, role = 'admin';
page.on('pageerror', error => errors.push(error.message));
await page.route('**/api/v1/**', async route => {
  const request = route.request();
  const headers = { 'Access-Control-Allow-Origin': 'http://127.0.0.1:5199', 'Access-Control-Allow-Credentials': 'true' };
  if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
  if (request.method() !== 'GET') writes.push(request.url());
  const url = new URL(request.url());
  const endpoint = url.pathname.replace('/api/v1', '');
  if (failed && ['/staff/incidents', '/staff/advisories', '/staff/assistance-requests', '/weather'].includes(endpoint)) {
    await route.fulfill({ status: 503, headers, json: { error: { code: 'unavailable', message: 'Operations temporarily unavailable.' } } }); return;
  }
  const data = endpoint === '/auth/session' ? { user: { ...staff, role } }
    : empty && ['/staff/incidents', '/staff/advisories', '/staff/assistance-requests', '/staff/distribution/sessions', '/staff/pickup-sites'].includes(endpoint)
      ? [] : serviceOperationsFixture(endpoint, url.searchParams);
  await route.fulfill({ headers, json: { data, page: { total: Array.isArray(data) ? data.length : 1, offset: 0, limit: 100 } } });
});
await page.route(/https:\/\/(maps\.geoapify\.com|tile\.openstreetmap\.org)\//, route => route.abort());
const go = async (screen: string) => {
  await page.goto(`http://127.0.0.1:5199/#/${screen}`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.resource-loading')).toHaveCount(0);
};
const chooseWeather = async () => {
  await page.getByRole('combobox', { name: 'Region', exact: true }).selectOption('0400000000');
  await page.getByRole('combobox', { name: 'Province', exact: true }).selectOption('0403400000');
  await page.getByRole('combobox', { name: 'City / Municipality', exact: true }).selectOption('0403405000');
  await expect(page.getByRole('region', { name: 'Seven-day weather forecast' }).locator('tbody tr')).toHaveCount(7);
};
try {
  for (const width of (process.env.AQOURS_SKIP_LAYOUT === '1' ? [] : [1440, 768, 390])) {
    await page.setViewportSize({ width, height: 900 });
    for (const screen of ['incidents', 'advisories', 'assistance', 'distribution', 'distribution?tab=sessions', 'distribution?tab=sites', 'weather']) {
      await go(screen);
      if (screen === 'weather') await chooseWeather();
      if (width === 1440) {
        const snapshot = await page.evaluate(() => {
          const documentCopy = document.documentElement.cloneNode(true) as HTMLElement;
          documentCopy.querySelectorAll('script').forEach(script => script.remove());
          const base = document.createElement('base'); base.href = location.origin;
          documentCopy.querySelector('head')!.prepend(base);
          return '<!doctype html>' + documentCopy.outerHTML;
        });
        await writeFile(path.join(output, `${screen.replaceAll('?', '-').replaceAll('=', '-')}-selected.html`), snapshot);
      }
      await page.screenshot({ path: path.join(output, `${screen.replaceAll('?', '-').replaceAll('=', '-')}-${width}.png`), fullPage: true });
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        rows: [...document.querySelectorAll('table tbody tr')].map(row => Math.round(row.getBoundingClientRect().height)),
        padding: [...document.querySelectorAll('table tbody td')].slice(0, 1).map(cell => getComputedStyle(cell).padding),
        tables: [...document.querySelectorAll('table')].map(table => getComputedStyle(table).display),
      }));
      measurements.push({ screen, width, ...metrics });
      assert.equal(metrics.overflow, false, `${screen}: no document overflow at ${width}`);
      if (phase === 'after') assert.ok(metrics.tables.every(display => display === 'table'), 'retain table layout at every width');
    }
    console.log(`PASS ${width}px: seven operations views, weather selection, no document overflow`);
  }
  if (measurements.length) await writeFile(path.join(output, 'measurements.json'), JSON.stringify(measurements, null, 2));
  if (phase === 'before') {
    await writeFile(path.join(output, 'measurements.json'), JSON.stringify(measurements, null, 2));
  } else {
    await page.setViewportSize({ width: 390, height: 900 });
    await go('incidents');
    const table = page.getByRole('region', { name: 'Incidents', exact: true });
    await table.focus(); await page.keyboard.press('ArrowRight');
    await expect.poll(() => table.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    console.log('PASS keyboard focus and horizontal table scrolling');
    await page.getByRole('button', { name: 'New incident', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Create incident', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'New incident', exact: true })).toBeFocused();
    await page.locator('.incident-queue-table a').first().click();
    await expect(page).toHaveURL(/incidents\/incident-0/);
    await go('advisories');
    await page.getByRole('button', { name: 'New advisory', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Create advisory draft', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.locator('.advisory-queue-table a').first().click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Scheduled supply interruption');
    console.log('PASS incident/advisory creation modals, Escape/focus and record navigation');
    await go('assistance');
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    const filters = page.getByRole('dialog', { name: 'Filter records', exact: true });
    await filters.getByLabel('Service type', { exact: true }).selectOption('inspection');
    await filters.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page.locator('.assistance-queue-table tbody tr')).toHaveCount(2);
    await page.locator('.assistance-queue-table a').first().click();
    await expect(page).toHaveURL(/assistance\/request-1/);
    await page.getByRole('link', { name: /Back to/ }).first().click();
    await expect(page.locator('.assistance-queue-table tbody tr')).toHaveCount(2);
    console.log('PASS assistance filters, selected record and preserved return context');
    await go('distribution?tab=sessions');
    await page.getByRole('button', { name: 'Manage session at Real barangay hall', exact: true }).click();
    await expect(page.locator('#pickup-session-editor')).toBeVisible();
    await page.getByRole('button', { name: 'Edit stock / schedule', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Edit stock / schedule', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'New pickup session', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Create pickup session', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await go('distribution?tab=sites');
    await page.getByRole('button', { name: 'Manage pickup site Real barangay hall', exact: true }).click();
    await expect(page.locator('#pickup-site-editor')).toBeVisible();
    await page.getByRole('link', { name: 'Warning history', exact: true }).click();
    await expect(page.getByRole('button', { name: 'All warning dates', exact: true })).toBeVisible();
    await go('distribution');
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await filters.getByLabel('Search sites', { exact: true }).fill('Halang');
    await filters.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await expect(page.locator('.monitoring-sites-table tbody tr')).toHaveCount(1);
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await expect(page.locator('.monitoring-sites-table tbody tr')).toHaveCount(3);
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await expect(page.locator('.leaflet-distribution-map')).toBeVisible();
    await page.getByRole('button', { name: 'List', exact: true }).click();
    await page.getByRole('button', { name: 'Real barangay hall', exact: true }).click();
    await expect(page.locator('.monitoring-selection')).toBeVisible();
    await page.getByRole('textbox', { name: 'Pickup or request reference', exact: true }).fill('AST-2026-003');
    await page.getByRole('button', { name: 'Find reservation', exact: true }).click();
    await expect(page.locator('.distribution-lookup a', { hasText: 'AST-2026-003' })).toBeVisible();
    console.log('PASS distribution filters/clear, List/Map, tabs, site/session modals and reservation lookup');
    await go('weather'); await chooseWeather();
    await page.getByRole('combobox', { name: 'City / Municipality', exact: true }).selectOption('0403400001');
    await expect(page.getByText('Weather coordinates are unavailable for this locality. Select another city or municipality.')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Seven-day weather forecast' })).toHaveCount(0);
    await page.getByRole('combobox', { name: 'City / Municipality', exact: true }).selectOption('0403405000');
    await expect(page.getByRole('region', { name: 'Seven-day weather forecast' }).locator('tbody tr')).toHaveCount(7);
    failed = true;
    await page.getByRole('button', { name: 'Refresh weather', exact: true }).click();
    await expect(page.locator('.error[role="alert"]')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Seven-day weather forecast' })).toBeVisible();
    failed = false;
    await page.getByRole('button', { name: 'Retry loading', exact: true }).click();
    await expect(page.locator('.error[role="alert"]')).toHaveCount(0);
    console.log('PASS weather hierarchy, missing point, stale forecast and retry');
    empty = true;
    for (const [screen, title] of [['incidents', 'No incidents yet.'], ['advisories', 'No advisories.'], ['assistance', 'No requests match these filters.'], ['distribution?tab=sessions', 'No pickup sessions.']]) {
      await go(screen); await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    }
    empty = false;
    await go('incidents');
    await expect(page.locator('.incident-queue-table tbody tr')).toHaveCount(6);
    await expect(page.locator('.resource-loading')).toHaveCount(0);
    failed = true;
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(page.getByText(/Stale results/)).toBeVisible(); failed = false;
    await page.getByRole('button', { name: 'Retry loading', exact: true }).click();
    await expect(page.locator('.error[role="alert"]')).toHaveCount(0);
    role = 'staff'; await go('advisories'); await page.reload();
    await expect(page.getByRole('button', { name: 'New advisory', exact: true })).toHaveCount(0);
    assert.deepEqual(errors, []); assert.deepEqual(writes, []);
    console.log('PASS queue empty/error/retry states, staff publication boundary, zero runtime errors or API writes');
  }
} finally { await context.close().catch(() => undefined); }
