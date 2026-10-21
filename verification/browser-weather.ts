import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { normalizeForecast } from '../aqours-api/src/services/weather/normalize.ts';
import { weatherFixture } from '../aqours-api/test/weather-fixture.ts';
import { fixturePassword } from './harness.ts';

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
  { id: 1, name: 'Manila', area: 'Metro Manila', country: 'Philippines', latitude: 14.6, longitude: 121 },
  { id: 2, name: 'Cebu City', area: 'Central Visayas', country: 'Philippines', latitude: 10.3, longitude: 123.9 },
];
await page.route('**/api/v1/weather**', async route => {
  const url = new URL(route.request().url());
  if (url.pathname.endsWith('/locations')) {
    const q = url.searchParams.get('q')!;
    if (failSearch) return route.fulfill({ status: 503, json: { error: { code: 'provider_unavailable', message: 'Weather city search unavailable.' } } });
    return route.fulfill({ json: { data: q === 'NoMatch' ? [] : cities } });
  }
  if (delayForecast && url.searchParams.get('latitude') === '14.6')
    await new Promise(resolve => setTimeout(resolve, 900));
  if (failForecast) return route.fulfill({ status: 503, json: { error: { code: 'provider_unavailable', message: 'Weather provider unavailable.' } } });
  const forecast = normalizeForecast(weatherFixture(), Number(url.searchParams.get('latitude')), Number(url.searchParams.get('longitude')));
  if (url.searchParams.get('latitude') === '10.3') {
    forecast.current.temperature = 27;
    forecast.current.weatherCode = 1234;
    forecast.daily[0]!.rainProbability = null;
  }
  return route.fulfill({ json: { data: forecast } });
});

async function signIn(email: string) {
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(fixturePassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
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
  await expect(weather).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reports and incidents', exact: true })).toBeVisible();
  await expect(weather.getByText('Select a city to check current weather and the next seven days.')).toBeVisible();
  passed('Admin dashboard keeps weather independent from operational metrics');

  await search('Manila');
  await page.getByRole('button', { name: 'Manila, Metro Manila, Philippines', exact: true }).click();
  await expect(weather.getByText('30°C', { exact: true })).toBeVisible();
  const forecast = page.getByRole('region', { name: 'Seven-day weather forecast' });
  await expect(forecast.locator('tbody tr')).toHaveCount(7);
  await expect(forecast.getByText('0%', { exact: true }).first()).toBeVisible();
  await expect(weather.getByText(/Current model estimate:.*Asia\/Manila/)).toBeVisible();
  await expect(weather.getByRole('link', { name: 'Weather data by Open-Meteo' })).toHaveAttribute('href', 'https://open-meteo.com/');
  passed('City selection renders current measurements, seven Manila dates, zero rainfall and attribution');

  failForecast = true;
  await weather.getByRole('button', { name: 'Refresh weather', exact: true }).click();
  await expect(weather.getByText(/Stale results/)).toBeVisible();
  await expect(weather.getByText('30°C', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reports and incidents', exact: true })).toBeVisible();
  failForecast = false;
  await weather.getByRole('button', { name: 'Retry loading', exact: true }).click();
  await expect(weather.getByText(/Stale results/)).toHaveCount(0);
  passed('Provider failure retains labeled stale weather and working metrics; retry recovers');

  await search('NoMatch');
  await expect(weather.getByText('No matching cities. Try another city name.')).toBeVisible();
  failSearch = true;
  await search('Manila');
  await expect(weather.getByText('Weather city search unavailable.')).toBeVisible();
  failSearch = false;
  await weather.getByRole('button', { name: 'Retry loading', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cebu City, Central Visayas, Philippines', exact: true })).toBeVisible();
  await page.getByLabel('City in the Philippines').fill('Changed');
  await expect(page.getByRole('list', { name: 'Weather city results' })).toHaveCount(0);
  passed('Empty and failed searches recover; editing the query hides obsolete candidates');

  await search('Cebu');
  await page.getByRole('button', { name: 'Cebu City, Central Visayas, Philippines', exact: true }).click();
  await expect(weather.getByText('27°C', { exact: true })).toBeVisible();
  await expect(weather.getByText(/Conditions unavailable/)).toBeVisible();
  await expect(forecast.locator('tbody tr').first().getByText('Unavailable', { exact: true })).toBeVisible();
  await expect(weather.getByText('30°C', { exact: true })).toHaveCount(0);
  passed('Switching cities clears old weather; missing values and unknown conditions stay unavailable');

  delayForecast = true;
  await search('Manila');
  await page.getByRole('button', { name: 'Manila, Metro Manila, Philippines', exact: true }).click();
  await search('Cebu');
  await page.getByRole('button', { name: 'Cebu City, Central Visayas, Philippines', exact: true }).click();
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
  await signIn('staff@demo.aqours.test');
  await expect(weather.getByText('Select a city to check current weather and the next seven days.')).toBeVisible();
  await expect(weather.getByText('27°C', { exact: true })).toHaveCount(0);
  await search('Cebu');
  await page.getByRole('button', { name: 'Cebu City, Central Visayas, Philippines', exact: true }).click();
  await expect(weather.getByText('27°C', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Reports', exact: true }).click();
  await page.getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(weather.getByText('Select a city to check current weather and the next seven days.')).toBeVisible();
  passed('Staff can use weather; sign-out and leaving the dashboard clear its selection');
  assert.deepEqual(errors, []);
} finally {
  await writeFile(path.join(output, 'results.txt'), evidence.join('\n') + '\n');
  await context.close();
}
