import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';

// Presentation checks with controlled API responses; no database or private config.
const output = path.resolve('.local/advisory-feedback');
const temporary = path.resolve('.local/t');
await mkdir(temporary, { recursive: true });
const context = await chromium.launchPersistentContext(path.join(output, 'browser'), {
  executablePath: process.env.AQOURS_CHROMIUM || '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  env: { ...process.env, TMPDIR: temporary, XDG_CACHE_HOME: path.join(output, 'cache'), XDG_CONFIG_HOME: path.join(output, 'config') },
});
const page = await context.newPage();
const errors: string[] = [];
page.on('pageerror', error => errors.push(error.message));
let refreshes = 0;
let role = 'admin';
await page.route('**/api/v1/**', async route => {
  const endpoint = new URL(route.request().url()).pathname.replace('/api/v1', '');
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:5198', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': '*' } });
    return;
  }
  let data: unknown = [];
  if (endpoint === '/auth/session') data = { user: { id: 'demo-admin', name: 'Fictional Operator', role, active: true } };
  if (endpoint === '/staff/settings/guidance') {
    refreshes++;
    data = [{ id: 'guidance', kind: 'general', version: 1, text: 'Fictional approved instructions', source: 'Demo source', createdAt: '2026-10-23T00:00:00Z' }];
  }
  if (endpoint === '/staff/settings/rules') data = [{ id: 'rule', active: true, version: 1, contactText: 'Fictional callback', inspectionText: 'Fictional inspection', waterText: 'Fictional water support', createdAt: '2026-10-23T00:00:00Z' }];
  if (endpoint === '/staff/zones') data = [{ id: 'zone', name: 'Fictional Zone', active: true }];
  if (endpoint === '/staff/connections') data = [{ id: 'connection', reference: 'DEMO-1', address: 'Fictional address' }];
  await route.fulfill({ json: { data, page: { offset: 0, limit: 100, total: Array.isArray(data) ? data.length : 1 } }, headers: {
    'Access-Control-Allow-Origin': 'http://127.0.0.1:5198', 'Access-Control-Allow-Credentials': 'true',
  } });
});
try {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:5198/#/settings?tab=guidance');
    await expect(page.getByRole('heading', { name: 'Customer guidance', exact: true })).toBeVisible();
    await expect(page.getByText('Fictional approved instructions', { exact: true })).toBeVisible();
    await expect(page.getByText('Callback: Fictional callback', { exact: true })).toBeVisible();
    assert.equal(await page.getByRole('button', { name: 'Refresh guidance', exact: true }).count(), 1);
    const before = refreshes;
    await page.getByRole('button', { name: 'Refresh guidance', exact: true }).click();
    await expect.poll(() => refreshes).toBeGreaterThan(before);
    await page.getByRole('button', { name: 'Edit recommended next steps', exact: true }).click();
    await expect(page.getByRole('dialog').getByLabel('Callback recommendation explanation', { exact: true })).toHaveValue('Fictional callback');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: path.join(output, `guidance-${width}.png`), fullPage: true });
    await page.goto('http://127.0.0.1:5198/#/advisories');
    await page.getByRole('button', { name: 'New advisory', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Affected service zones', { exact: true })).toBeVisible();
    await expect(dialog.getByLabel('Individual service connections (optional)', { exact: true })).toBeVisible();
    await expect(dialog.getByLabel('Service starts (optional, Manila)', { exact: true })).toBeVisible();
    await expect(dialog.getByLabel('Expected end (optional, Manila)', { exact: true })).toBeVisible();
    await expect(dialog.getByText(/Quality restrictions remain in effect until explicitly lifted/)).toBeVisible();
    await page.screenshot({ path: path.join(output, `advisory-${width}.png`), fullPage: true });
    await page.keyboard.press('Escape');
    console.log(`PASS guidance workspace, refresh, prefilled editing and advisory field help at ${width}px`);
  }
  role = 'staff';
  await page.goto('http://127.0.0.1:5198/#/settings?tab=guidance');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Customer guidance', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add advisory instructions', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Edit recommended next steps', exact: true })).toHaveCount(0);
  assert.deepEqual(errors, []);
  console.log('PASS staff read-only guidance and no browser runtime errors');
} finally { await context.close(); }
