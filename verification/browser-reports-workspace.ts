import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { reportsWorkspaceFixture } from './fixtures/reports-workspace.ts';

const output = path.resolve('.local/reports-redesign/verified');
const temporary = path.resolve('.local/tmp');
await mkdir(output, { recursive: true });
await mkdir(temporary, { recursive: true });
const context = await chromium.launchPersistentContext(path.join(output, 'browser'), {
  executablePath: process.env.AQOURS_CHROMIUM || '/opt/brave.com/brave/brave', headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  env: { ...process.env, TMPDIR: temporary, XDG_CACHE_HOME: path.join(output, 'cache'), XDG_CONFIG_HOME: path.join(output, 'config') },
});
const page = await context.newPage();
page.setDefaultTimeout(30000);
const errors: string[] = [];
const writes: string[] = [];
page.on('pageerror', error => errors.push(error.message));
let empty = false;
let failed = false;
await page.route('**/api/v1/**', async route => {
  const request = route.request();
  const headers = { 'Access-Control-Allow-Origin': 'http://127.0.0.1:5198', 'Access-Control-Allow-Credentials': 'true' };
  if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
  if (request.method() !== 'GET') writes.push(request.url());
  const url = new URL(request.url());
  const endpoint = url.pathname.replace('/api/v1', '');
  if (failed && endpoint === '/staff/reports') {
    await route.fulfill({ status: 503, headers, json: { error: { code: 'unavailable', message: 'Reports temporarily unavailable.' } } }); return;
  }
  const data = empty && ['/staff/reports', '/staff/messages'].includes(endpoint) ? [] : reportsWorkspaceFixture(endpoint, url.searchParams);
  await route.fulfill({ headers, json: { data, page: { total: Array.isArray(data) ? data.length : 1, offset: 0, limit: 100 } } });
});
await page.route(/https:\/\/(maps\.geoapify\.com|tile\.openstreetmap\.org)\//, route => route.abort());
const go = async (screen: string) => {
  await page.goto(`http://127.0.0.1:5198/#/${screen}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
};
try {
  for (const width of (process.env.AQOURS_SKIP_LAYOUT === '1' ? [] : [1440, 768, 390])) {
    await page.setViewportSize({ width, height: 900 });
    for (const screen of ['overview', 'reports', 'messages', 'map']) {
      await go(screen);
      if (screen === 'overview') await expect(page.locator('.task-summary a')).toHaveCount(3);
      if (screen === 'reports') await expect(page.getByRole('link', { name: 'Review RPT-2026-001', exact: true })).toBeVisible();
      if (screen === 'messages') await expect(page.getByRole('link', { name: 'Open conversation for RPT-2026-001' })).toBeVisible();
      if (screen === 'map') await expect(page.getByRole('button', { name: 'Select RPT-2026-001 on map' })).toBeVisible();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.screenshot({ path: path.join(output, `${screen}-${width}.png`), fullPage: true });
    }
    console.log(`PASS ${width}px: four screens, reachable actions, no document overflow`);
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await go('reports');
  const filters = page.getByRole('button', { name: 'Filters', exact: true });
  await filters.click();
  const dialog = page.getByRole('dialog', { name: 'Filter records' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Category', { exact: true }).selectOption('leak');
  await dialog.getByLabel('Submitted from (Manila)').fill('2026-10-23T08:30');
  await page.screenshot({ path: path.join(output, 'filters-390.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(filters).toBeFocused();
  assert.equal(new URLSearchParams(page.url().split('?')[1]).has('category'), false);
  await filters.click();
  await expect(dialog.getByLabel('Category', { exact: true })).toHaveValue('');
  await dialog.getByLabel('Category', { exact: true }).selectOption('leak');
  await dialog.getByLabel('Submitted from (Manila)').fill('2026-10-23T08:30');
  await dialog.getByRole('button', { name: 'Apply filters' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.report-inbox-table tbody tr')).toHaveCount(2);
  assert.ok(page.url().includes('2026-10-23T00%3A30%3A00.000Z'));
  await page.getByRole('button', { name: /^Filters/ }).click();
  await dialog.getByRole('button', { name: 'Clear all', exact: true }).click();
  await expect(dialog.getByLabel('Category', { exact: true })).toHaveValue('');
  await dialog.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.locator('.report-inbox-table tbody tr')).toHaveCount(6);
  await page.getByRole('link', { name: 'Review RPT-2026-001', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'RPT-2026-001', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to inbox' }).click();
  await expect(page.getByRole('heading', { name: 'Report inbox', exact: true })).toBeVisible();
  console.log('PASS filter modal: draft discard, Escape/focus, Manila dates, apply/clear, report action/back');

  await go('messages');
  await page.getByRole('link', { name: 'Open conversation for RPT-2026-001' }).click();
  await expect(page.getByRole('heading', { name: 'Customer conversation' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to inbox' }).click();
  await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible();
  const menu = page.locator('.navigation-toggle');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.screenshot({ path: path.join(output, 'navigation-390.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.getByRole('link', { name: 'Reports map', exact: true }).click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Select RPT-2026-001 on map' }).click();
  await expect(page.getByRole('region', { name: 'Selected report', exact: true })).toContainText('RPT-2026-001');
  await expect(page.locator('.leaflet-popup')).toBeVisible();
  await expect.poll(async () => {
    const mapBox = await page.locator('.leaflet-report-map').boundingBox();
    const popupBox = await page.locator('.leaflet-popup').boundingBox();
    return Boolean(mapBox && popupBox && popupBox.x >= mapBox.x && popupBox.y >= mapBox.y
      && popupBox.x + popupBox.width <= mapBox.x + mapBox.width
      && popupBox.y + popupBox.height <= mapBox.y + mapBox.height);
  }, { message: 'selected popup fits the revealed mobile map after auto-pan' }).toBe(true);
  await page.screenshot({ path: path.join(output, 'map-selected-390.png'), fullPage: true });
  await page.locator('.leaflet-popup-close-button').click();
  await expect(page.locator('.leaflet-popup')).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click();
  console.log('PASS conversation action/back, mobile menu/Escape/navigation, map selection/clear');

  empty = true;
  await go('reports');
  await expect(page.getByRole('heading', { name: 'No reports match these filters.' })).toBeVisible();
  await go('messages');
  await expect(page.getByRole('heading', { name: 'No customer conversations yet' })).toBeVisible();
  empty = false;
  await go('reports');
  await expect(page.locator('.report-inbox-table tbody tr')).toHaveCount(6);
  failed = true;
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Reports temporarily unavailable');
  await expect(page.getByText(/Stale results/)).toBeVisible();
  failed = false;
  await page.getByRole('button', { name: 'Retry loading' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  assert.deepEqual(errors, []);
  assert.deepEqual(writes, []);
  console.log('PASS empty, stale/error/retry states; zero runtime errors or API writes');
} finally { await context.close(); }
