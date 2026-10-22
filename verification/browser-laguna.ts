import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import type { MapResponse, Report, WeatherForecast } from '../aqours-contracts/src/index.ts';
import { fixturePassword } from './harness.ts';

// Read-only UI verification against an isolated fresh Laguna-seeded API/web.
// Raster bytes are local. AQOURS_LIVE_WEATHER=1 additionally calls real Open-Meteo.
const output = path.resolve('.local/laguna/evidence/browser');
const temporary = path.resolve('.cache/tmp/laguna');
await mkdir(output, { recursive: true });
await mkdir(temporary, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true,
  env: { ...process.env, TMPDIR: temporary }, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors: string[] = [];
const results: string[] = [];
const passed = (message: string) => { results.push(message); console.log('PASS', message); };
const maps: MapResponse[] = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', async response => {
  if (response.url().includes('/staff/map/reports?') && response.status() === 200)
    maps.push((await response.json()).data);
});
const tile = await readFile(new URL('./fixtures/street-tile.png', import.meta.url));
try {
  await page.route('https://tiles.example.test/**', route => route.fulfill({ contentType: 'image/png', body: tile }));
  await page.route('https://maps.geoapify.com/**', route => route.abort());
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  await page.goto(process.env.AQOURS_TEST_WEB ?? 'http://127.0.0.1:5179');
  await page.getByLabel('Email', { exact: true }).fill('admin@demo.aqours.test');
  await page.getByLabel('Password', { exact: true }).fill(fixturePassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  if (process.env.AQOURS_LIVE_WEATHER === '1') {
    await page.getByRole('link', { name: 'Weather', exact: true }).click();
    await page.getByRole('combobox', { name: 'Region', exact: true }).selectOption('0400000000');
    await page.getByRole('combobox', { name: 'Province', exact: true }).selectOption('0403400000');
    const fetched = page.waitForResponse(response => response.url().includes('/weather?') && response.status() === 200);
    await page.getByRole('combobox', { name: 'City / Municipality', exact: true }).selectOption('0403405000');
    const weather = (await (await fetched).json()).data as WeatherForecast;
    assert.equal(weather.daily.length, 7);
    assert.ok(weather.location.latitude > 14 && weather.location.latitude < 14.4);
    assert.ok(weather.location.longitude > 121 && weather.location.longitude < 121.4);
    await expect(page.getByRole('region', { name: 'Seven-day weather forecast' }).locator('tbody tr')).toHaveCount(7);
    await page.screenshot({ path: path.join(output, 'admin-live-weather.png'), fullPage: true });
    passed('Admin displays a live Open-Meteo Calamba forecast with seven daily rows');
  }
  await page.getByRole('link', { name: 'Map', exact: true }).click();
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  await expect.poll(() => maps.at(-1)?.features.length).toBe(11);
  assert.equal(maps.at(-1)!.unlocatedCount, 1);
  for (const feature of maps.at(-1)!.features) {
    const [longitude, latitude] = feature.geometry.coordinates;
    assert.ok(latitude > 14.15 && latitude < 14.31);
    assert.ok(longitude > 121.09 && longitude < 121.26);
    assert.match(feature.properties.address ?? '', /Laguna, Region IV-A/);
  }
  await expect(page.locator('.report-cluster')).toHaveCount(3);
  await page.screenshot({ path: path.join(output, 'laguna-default-map.png'), fullPage: true });
  passed('Default Leaflet viewport shows eleven Laguna reports in three clusters and one unlocated report');
  const listResponse = await page.request.get((process.env.AQOURS_TEST_API ?? 'http://127.0.0.1:4007/api/v1') + '/staff/reports');
  assert.equal(listResponse.status(), 200);
  const reports = (await listResponse.json()).data as Report[];
  for (const barangay of ['Bagong Kalsada', 'Batong Malake', 'Balibago']) {
    const report = reports.find(item => item.address.includes(barangay) && item.latitude !== null)!;
    await page.getByRole('button', { name: `Select ${report.reference} on map`, exact: true }).click();
    await expect(page.getByRole('region', { name: 'Selected report', exact: true })).toContainText(report.address);
    await expect(page.locator('.leaflet-popup-content')).toContainText(report.reference);
  }
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click();
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await expect.poll(() => maps.at(-1)?.features.length).toBe(11);
  passed('All three Laguna localities select their own report; reset retains the Laguna viewport');
  assert.deepEqual(errors, []);
} finally {
  await writeFile(path.join(output, 'results.txt'), results.join('\n') + '\n');
  await browser.close();
}
