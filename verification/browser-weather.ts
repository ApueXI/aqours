import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { mock } from 'node:test';
import type { Server } from 'node:http';
import { createApp } from '../aqours-api/src/app.ts';
import { disconnect } from '../aqours-api/src/config/database.ts';
import { weatherFixture } from '../aqours-api/test/weather-fixture.ts';
import { fixturePassword } from './harness.ts';

assert.ok(process.env.DATABASE_URL && new URL(process.env.DATABASE_URL).pathname.endsWith('_test'), 'Supply a seeded isolated database ending _test');
assert.ok(process.env.AQOURS_TEST_API, 'Supply a free API port matching the supplier client configuration');
const api = new URL(process.env.AQOURS_TEST_API);
const originalFetch = globalThis.fetch;
let server: Server;
// Advance only server wall time to exercise real ten-minute cache expiry without waiting.
mock.timers.enable({ apis: ['Date'], now: Date.now() });
const expireForecast = () => mock.timers.tick(600_001);
const output = path.resolve('.local/weather/browser');
const temporary = path.resolve('.cache/tmp/weather');
await mkdir(output, { recursive: true });
await mkdir(temporary, { recursive: true });
const context = await chromium.launchPersistentContext(path.join(output, 'profile'), {
  executablePath: '/usr/bin/chromium', headless: true, viewport: { width: 1280, height: 950 },
  env: { ...process.env, TMPDIR: temporary }, args: ['--no-sandbox'],
});
const page = await context.newPage();
const evidence: string[] = [];
const errors: string[] = [];
page.on('pageerror', error => errors.push(error.message));
const passed = (message: string) => { evidence.push(message); console.log('PASS', message); };
const web = process.env.AQOURS_TEST_WEB || 'http://localhost:5175';
let failForecast = false;
let failSearch = false;
let delayForecast = false;
const cities = [
  { id: 1, name: 'Calamba', admin1: 'Laguna', country: 'Philippines', country_code: 'PH', latitude: 14.1679, longitude: 121.1951 },
  { id: 2, name: 'Los Baños', admin1: 'Laguna', country: 'Philippines', country_code: 'PH', latitude: 14.1674, longitude: 121.2433 },
  { id: 3, name: 'Santa Rosa', admin1: 'Laguna', country: 'Philippines', country_code: 'PH', latitude: 14.2946, longitude: 121.1054 },
];
// Only external Open-Meteo responses are replaced; Chromium calls the real API.
globalThis.fetch = async (input, options) => {
  const url = new URL(String(input));
  if (!['api.open-meteo.com', 'geocoding-api.open-meteo.com'].includes(url.hostname)) return originalFetch(input, options);
  if (url.hostname.startsWith('geocoding')) {
    if (failSearch) return new Response('Unavailable', { status: 503 });
    return Response.json({ results: url.searchParams.get('name') === 'NoMatch' ? [] : cities });
  }
  if (delayForecast && url.searchParams.get('latitude') === '14.1679')
    await new Promise(resolve => setTimeout(resolve, 900));
  if (failForecast) return new Response('Unavailable', { status: 503 });
  const forecast = weatherFixture();
  if (url.searchParams.get('latitude') === '14.1674') {
    forecast.current.temperature_2m = 27;
    forecast.current.weather_code = 1234;
    // Model a provider omitting a daily measurement; normalization must retain unavailable.
    Object.assign(forecast.daily, { precipitation_probability_max: [null, 30, 60, 10, 80, 90, 0] });
  }
  return Response.json(forecast);
};
await new Promise<void>((resolve, reject) => {
  server = createApp().listen(Number(api.port), '127.0.0.1', () => resolve());
  server.once('error', reject);
});

async function signIn(email: string, destination = 'Overview') {
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(fixturePassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: destination, exact: true })).toBeVisible();
}
async function search(query: string) {
  await page.getByLabel('City in the Philippines', { exact: true }).fill(query);
  await page.getByRole('button', { name: 'Search weather cities', exact: true }).click();
}
try {
  await context.clearCookies();
  await page.goto(web);
  await signIn('admin@demo.aqours.test');
  const weather = page.getByRole('region', { name: 'Weather', exact: true });
  await expect(weather).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Reports and incidents', exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Weather', exact: true }).click();
  await expect(page).toHaveURL(/#\/weather$/);
  await expect(page.getByRole('heading', { name: 'Weather', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Weather', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(weather.getByText('Select a city to check current weather and the next seven days.')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await expect(weather).toHaveCount(0);
  await page.goForward();
  await expect(weather).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Weather', exact: true })).toBeVisible();
  passed('Admin navigation, direct loading and browser history open Weather separately from Overview');

  await search('Calamba');
  await page.getByRole('button', { name: 'Calamba, Laguna, Philippines', exact: true }).click();
  await expect(weather.getByText('30°C', { exact: true })).toBeVisible();
  const forecast = page.getByRole('region', { name: 'Seven-day weather forecast' });
  await expect(forecast.locator('tbody tr')).toHaveCount(7);
  await expect(forecast.getByText('0%', { exact: true }).first()).toBeVisible();
  await expect(weather.getByText(/Current model estimate:.*Asia\/Manila/)).toBeVisible();
  await expect(weather.getByRole('link', { name: 'Weather data by Open-Meteo' })).toHaveAttribute('href', 'https://open-meteo.com/');
  passed('City selection renders current measurements, seven Manila dates, zero rainfall and attribution');

  expireForecast();
  failForecast = true;
  await weather.getByRole('button', { name: 'Refresh weather', exact: true }).click();
  await expect(weather.getByText(/Stale results/)).toBeVisible();
  await expect(weather.getByText('30°C', { exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  failForecast = false;
  await weather.getByRole('button', { name: 'Retry loading', exact: true }).click();
  await expect(weather.getByText(/Stale results/)).toHaveCount(0);
  passed('Provider failure retains labeled stale weather and usable navigation; retry recovers');

  await search('NoMatch');
  await expect(weather.getByText('No matching cities. Try another city name.')).toBeVisible();
  failSearch = true;
  await search('Santa Rosa');
  await expect(weather.getByText('Weather is temporarily unavailable. Try again shortly.')).toBeVisible();
  failSearch = false;
  await weather.getByRole('button', { name: 'Retry loading', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Los Baños, Laguna, Philippines', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Santa Rosa, Laguna, Philippines', exact: true })).toBeVisible();
  await page.getByLabel('City in the Philippines').fill('Changed');
  await expect(page.getByRole('list', { name: 'Weather city results' })).toHaveCount(0);
  passed('Empty and failed searches recover; editing the query hides obsolete candidates');

  await search('Los Baños');
  await page.getByRole('button', { name: 'Los Baños, Laguna, Philippines', exact: true }).click();
  await expect(weather.getByText('27°C', { exact: true })).toBeVisible();
  await expect(weather.getByText(/Conditions unavailable/)).toBeVisible();
  await expect(forecast.locator('tbody tr').first().getByText('Unavailable', { exact: true })).toBeVisible();
  await expect(weather.getByText('30°C', { exact: true })).toHaveCount(0);
  passed('Switching cities clears old weather; missing values and unknown conditions stay unavailable');

  expireForecast();
  delayForecast = true;
  await search('Calamba');
  await page.getByRole('button', { name: 'Calamba, Laguna, Philippines', exact: true }).click();
  await search('Los Baños');
  await page.getByRole('button', { name: 'Los Baños, Laguna, Philippines', exact: true }).click();
  await expect(weather.getByText('27°C', { exact: true })).toBeVisible();
  await page.waitForTimeout(1100);
  await expect(weather.getByText('30°C', { exact: true })).toHaveCount(0);
  passed('A delayed response cannot replace the weather for the newer selected city');

  await page.screenshot({ path: path.join(output, 'admin-weather.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(weather).toBeVisible();
  await page.screenshot({ path: path.join(output, 'narrow-weather.png'), fullPage: true });
  assert.equal(await weather.evaluate(element => element.scrollWidth <= element.clientWidth), true);
  passed('Weather remains usable at a narrow viewport without overflowing its section');

  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(weather).toHaveCount(0);
  await signIn('staff@demo.aqours.test', 'Weather');
  await expect(weather.getByText('Select a city to check current weather and the next seven days.')).toBeVisible();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(weather).toHaveCount(0);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'Weather', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await expect(weather.getByText('Select a city to check current weather and the next seven days.')).toBeVisible();
  await expect(weather.getByText('27°C', { exact: true })).toHaveCount(0);
  await search('Los Baños');
  await page.getByRole('button', { name: 'Los Baños, Laguna, Philippines', exact: true }).click();
  await expect(weather.getByText('27°C', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'Reports', exact: true }).click();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'Weather', exact: true }).click();
  await expect(weather.getByText('Select a city to check current weather and the next seven days.')).toBeVisible();
  passed('Staff mobile navigation opens Weather; sign-out and leaving the page clear its selection');
  assert.deepEqual(errors, []);
} finally {
  await writeFile(path.join(output, 'results.txt'), evidence.join('\n') + '\n');
  await context.close();
  globalThis.fetch = originalFetch;
  mock.timers.reset();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await disconnect();
}
