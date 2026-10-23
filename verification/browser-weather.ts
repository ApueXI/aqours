import assert from 'node:assert/strict';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { expect } from '@playwright/test';
import type { WeatherPsgcLocation } from '../aqours-contracts/src/index.ts';
import { fixturePassword } from './harness.ts';
import { weatherBrowserHarness } from './weather-browser-harness.ts';

const h = await weatherBrowserHarness();
const { page, context, controls, output, web } = h;
const evidence: string[] = [], errors: string[] = [], forecastRequests: URL[] = [];
const tileZooms: number[] = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => {
  if (request.url().includes('/weather?')) forecastRequests.push(new URL(request.url()));
  if (request.url().startsWith('https://tiles.example.test/')) tileZooms.push(Number(new URL(request.url()).pathname.split('/')[1]));
  if (request.url().startsWith('https://maps.geoapify.com/')) {
    const zoom = new URL(request.url()).pathname.match(/\/tile\/[^/]+\/(\d+)\//)?.[1];
    if (zoom !== undefined) tileZooms.push(Number(zoom));
  }
});
const passed = (message: string) => { evidence.push(message); console.log('PASS', message); };
const weather = page.getByRole('region', { name: 'Weather', exact: true });
const forecast = page.getByRole('region', { name: 'Seven-day weather forecast' });
const region = page.getByRole('combobox', { name: 'Region', exact: true });
const province = page.getByRole('combobox', { name: 'Province', exact: true });
const locality = page.getByRole('combobox', { name: 'City / Municipality', exact: true });
let catalog: WeatherPsgcLocation[] = [];
async function signIn(email: string, destination = 'Overview') {
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(fixturePassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: destination, exact: true })).toBeVisible();
}
async function choose(code: string) {
  const place = catalog.find(item => item.code === code)!;
  await page.getByLabel('Search regions', { exact: true }).fill('');
  await region.selectOption(place.ancestry.find(part => part.level === 'region')!.code);
  const parent = place.ancestry.find(part => part.level === 'province');
  if (parent) {
    await page.getByLabel('Search provinces', { exact: true }).fill('');
    await province.selectOption(parent.code);
  }
  await locality.selectOption(code);
}
const markerLabel = (place: WeatherPsgcLocation) => [...place.ancestry].reverse().map(part => part.name.trim()).join(', ');
const marker = (place: WeatherPsgcLocation) => page.locator('.weather-locality-marker').filter({ has: page.locator('span') }).locator(`xpath=self::*[@title=${JSON.stringify(markerLabel(place))}]`);
const renderedPointCount = () => page.locator('.leaflet-weather-map').evaluate(element =>
  element.querySelectorAll('.weather-locality-marker').length + [...element.querySelectorAll('.weather-locality-cluster')].reduce((total, item) => total + Number(item.textContent), 0));
const visibleMapIndex = (selector: string) => page.locator(selector).evaluateAll(nodes => {
  const map = document.querySelector('.leaflet-weather-map')!.getBoundingClientRect();
  return nodes.findIndex(node => { const point = node.getBoundingClientRect();
    return point.x >= map.x && point.right <= map.right && point.y >= map.y && point.bottom <= Math.min(map.bottom, innerHeight); });
});
try {
  await page.goto(web);
  await signIn('admin@demo.aqours.test');
  await expect(weather).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Weather', exact: true }).click();
  await expect(page).toHaveURL(/#\/weather$/);
  await expect(region).toBeVisible();
  catalog = (await (await page.request.get(process.env.AQOURS_TEST_API + '/weather/psgc-locations')).json()).data;
  const calamba = catalog.find(place => place.code === '0403405000')!;
  const losBanos = catalog.find(place => place.code === '0403411000')!;
  controls.alternateLatitude = String(losBanos.latitude);
  await expect(province).toBeDisabled(); await expect(locality).toBeDisabled();
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  await expect(page.locator('.weather-locality-cluster').first()).toBeVisible();
  assert.equal(forecastRequests.length, 0);
  assert.equal(controls.calls.length, 0);
  await expect(page.getByLabel('City in the Philippines', { exact: true })).toHaveCount(0);
  await page.goBack(); await expect(weather).toHaveCount(0);
  await page.goForward(); await expect(region).toBeVisible();
  await page.reload(); await expect(region).toHaveValue('');
  assert.equal(forecastRequests.length, 0);
  await expect(page.locator('.weather-locality-cluster').first()).toBeVisible();
  const beforeClusterZoom = Math.max(...tileZooms);
  await page.getByRole('region', { name: 'Weather locality map', exact: true }).scrollIntoViewIfNeeded();
  const clusters = page.locator('.weather-locality-cluster');
  const visibleCluster = await visibleMapIndex('.weather-locality-cluster');
  assert.ok(visibleCluster >= 0, 'Laguna viewport contains an actual clickable cluster');
  await clusters.nth(visibleCluster).click();
  await expect.poll(() => Math.max(...tileZooms)).toBeGreaterThan(beforeClusterZoom);
  assert.equal(forecastRequests.length, 0);
  await page.screenshot({ path: path.join(output, 'laguna-cluster-expanded.png'), fullPage: true });
  passed('PSGC1 Dedicated navigation/history/reload renders Laguna Leaflet clusters without an automatic forecast');

  await page.getByLabel('Search regions', { exact: true }).fill('CALABARZON');
  await expect(region.locator('option')).toHaveCount(2);
  await region.selectOption('0400000000');
  await expect(province).toBeEnabled(); await expect(locality).toBeDisabled();
  await expect.poll(renderedPointCount).toBe(catalog.filter(place => place.ancestry[0].code === '0400000000' && place.latitude !== null).length);
  await page.getByLabel('Search provinces', { exact: true }).fill('Laguna');
  await expect(province.locator('option')).toHaveCount(2);
  await province.selectOption('0403400000');
  await expect.poll(renderedPointCount).toBe(catalog.filter(place => place.ancestry.some(part => part.code === '0403400000') && place.latitude !== null).length);
  await page.getByLabel('Search cities / municipalities', { exact: true }).fill('Calamba');
  await expect(locality.locator('option')).toHaveCount(2);
  await locality.selectOption(calamba.code);
  await expect(weather.getByText('30°C', { exact: true })).toBeVisible();
  await expect(forecast.locator('tbody tr')).toHaveCount(7);
  await expect(forecast.getByText('0%', { exact: true }).first()).toBeVisible();
  await expect(weather.getByText(/Current model estimate:.*Asia\/Manila/)).toBeVisible();
  await expect(page.locator('.weather-locality-selected')).toHaveAttribute('title', markerLabel(calamba));
  await expect(page.locator('.leaflet-popup-content')).toContainText(markerLabel(calamba));
  assert.equal(forecastRequests.at(-1)!.searchParams.get('psgcCode'), calamba.code);
  assert.equal([...forecastRequests.at(-1)!.searchParams].length, 1);
  for (const name of ['Weather data by Open-Meteo', 'GeoNames', 'ph-geo', 'CC BY 4.0']) await expect(weather.getByRole('link', { name, exact: true })).toBeVisible();
  passed('PSGC2 Searchable hierarchy selects canonical code, synchronizes map/popup and renders current plus seven Manila dates and source credits');

  h.expire(); controls.failForecast = true;
  await weather.getByRole('button', { name: 'Refresh weather', exact: true }).click();
  await expect(weather.getByText(/Stale results/)).toBeVisible();
  await expect(weather.getByText('30°C', { exact: true })).toBeVisible();
  controls.failForecast = false;
  await weather.getByRole('button', { name: 'Retry loading', exact: true }).click();
  await expect(weather.getByText(/Stale results/)).toHaveCount(0);
  passed('PSGC3 Failed same-locality refresh retains labeled stale measurements and retry recovers');

  await choose(losBanos.code);
  await expect(weather.getByText('27°C', { exact: true })).toBeVisible();
  await expect(weather.getByText(/Conditions unavailable/)).toBeVisible();
  await expect(forecast.locator('tbody tr').first().getByText('Unavailable', { exact: true })).toBeVisible();
  await expect(weather.getByText('30°C', { exact: true })).toHaveCount(0);
  h.expire(); controls.delayedLatitude = String(calamba.latitude);
  await choose(calamba.code);
  await choose(losBanos.code);
  await expect(weather.getByText('27°C', { exact: true })).toBeVisible();
  await page.waitForTimeout(1100);
  await expect(weather.getByText('30°C', { exact: true })).toHaveCount(0);
  controls.delayedLatitude = '';
  passed('PSGC4 Locality changes clear old values, retain missing values as unavailable and reject late responses');

  await page.getByLabel('Search provinces', { exact: true }).fill('');
  await province.selectOption('0401000000');
  await expect(locality).toHaveValue(''); await expect(forecast).toHaveCount(0);
  await expect(weather.getByText('27°C', { exact: true })).toHaveCount(0);
  await region.selectOption('1300000000');
  await expect(province).toHaveValue(''); await expect(province).toBeDisabled();
  await expect(province).toContainText('No province for this region');
  await expect(locality).toBeEnabled();
  assert.equal(await locality.locator('option').count(), 18);
  await page.getByLabel('Search cities / municipalities', { exact: true }).fill('Makati');
  await locality.selectOption('1380300000');
  await expect(forecast.locator('tbody tr')).toHaveCount(7);
  await expect(province).toBeDisabled();
  await expect(page.getByLabel('Barangay', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('District', { exact: true })).toHaveCount(0);
  passed('PSGC5 Parent changes clear descendants/forecast; NCR skips province and stops at city or municipality');

  const unavailable = catalog.find(place => place.code === '1381300000')!;
  const beforeUnavailable = forecastRequests.length;
  await page.getByLabel('Search cities / municipalities', { exact: true }).fill('');
  await locality.selectOption(unavailable.code);
  await expect(weather.getByText('Weather coordinates are unavailable for this locality. Select another city or municipality.')).toBeVisible();
  await expect(forecast).toHaveCount(0);
  await expect(marker(unavailable)).toHaveCount(0);
  assert.equal(forecastRequests.length, beforeUnavailable);
  passed('PSGC6 Unavailable locality stays selectable with an explicit gap, no marker and no forecast request');

  await page.getByRole('button', { name: 'Reset weather map', exact: true }).click();
  await expect(region).toHaveValue(''); await expect(province).toHaveValue(''); await expect(locality).toHaveValue('');
  await expect(forecast).toHaveCount(0); await expect(province).toBeDisabled(); await expect(locality).toBeDisabled();
  assert.equal(forecastRequests.length, beforeUnavailable);
  passed('PSGC6b Reset after NCR selection clears hierarchy/forecast and restores nationwide points at Laguna');

  await choose(calamba.code);
  await expect(weather.getByText('30°C', { exact: true })).toBeVisible();
  await province.selectOption(''); await province.selectOption('0403400000');
  await page.getByRole('region', { name: 'Weather locality map', exact: true }).scrollIntoViewIfNeeded();
  for (let attempt = 0; await visibleMapIndex('.weather-locality-marker') < 0 && attempt < 5; attempt++) {
    const index = await visibleMapIndex('.weather-locality-cluster'); assert.ok(index >= 0);
    await page.locator('.weather-locality-cluster').nth(index).click();
  }
  const index = await visibleMapIndex('.weather-locality-marker'); assert.ok(index >= 0);
  const clickedTitle = await page.locator('.weather-locality-marker').nth(index).getAttribute('title');
  const clickedPlace = catalog.find(place => markerLabel(place) === clickedTitle)!;
  const clickedMarker = marker(clickedPlace);
  for (const key of ['Enter', 'Space']) {
    const beforeKey: number = forecastRequests.length;
    await clickedMarker.focus(); await page.keyboard.press(key);
    await expect(locality).toHaveValue(clickedPlace.code);
    await expect(forecast.locator('tbody tr')).toHaveCount(7);
    await page.waitForTimeout(100);
    assert.equal(forecastRequests.length, beforeKey + 1, `${key} selects and requests the locality exactly once`);
    assert.equal(forecastRequests.at(-1)!.searchParams.get('psgcCode'), clickedPlace.code);
    await province.selectOption('0403400000');
    await expect(locality).toHaveValue(''); await expect(forecast).toHaveCount(0);
  }
  passed('PSGC7a Enter and Space on an actual locality marker synchronize hierarchy and forecast exactly once');
  await clickedMarker.click();
  await expect(locality).toHaveValue(clickedPlace.code);
  await expect(region).toHaveValue('0400000000'); await expect(province).toHaveValue('0403400000');
  await expect(forecast.locator('tbody tr')).toHaveCount(7);
  await expect(page.locator('.leaflet-popup-content')).toContainText(markerLabel(clickedPlace));
  await expect(page.locator('.weather-locality-selected')).toHaveAttribute('title', markerLabel(clickedPlace));
  passed('PSGC7 Actual map marker click synchronizes all hierarchy selects and requests the clicked locality');

  await region.selectOption('');
  await page.getByLabel('Search regions', { exact: true }).fill('NoSuchRegion');
  await expect(weather.getByText('No matching options. Try another name.')).toBeVisible();
  await page.getByLabel('Search regions', { exact: true }).fill('CALABARZON');
  await page.getByLabel('Search regions', { exact: true }).focus();
  await page.keyboard.press('Tab'); await expect(region).toBeFocused();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await expect(region).toHaveValue('0400000000');
  await page.getByLabel('Search provinces', { exact: true }).fill('');
  await province.selectOption('0403400000');
  await expect(locality).toBeEnabled();
  await page.screenshot({ path: path.join(output, 'admin-weather-desktop.png'), fullPage: true });
  passed('PSGC8 Search empty state recovers and keyboard focus/selection operate the searchable native hierarchy');

  h.failTiles(true); await page.getByRole('button', { name: 'Reset weather map', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(weather.getByRole('alert').filter({ hasText: /Street tiles/ })).toBeVisible();
  await choose(losBanos.code);
  await expect(weather.getByText('27°C', { exact: true })).toBeVisible();
  h.failTiles(false); await page.getByRole('button', { name: 'Retry basemap', exact: true }).click();
  await expect(weather.getByRole('alert').filter({ hasText: /Street tiles/ })).toHaveCount(0);
  passed('PSGC9 Tile failure preserves markers/selectors/forecast selection and basemap retry recovers');

  await page.setViewportSize({ width: 390, height: 1000 });
  await page.getByRole('region', { name: 'Weather locality map', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.locator('.leaflet-popup')).toBeVisible();
  const popupConstraints = () => page.locator('.leaflet-popup').evaluate(element => {
    const map = document.querySelector('.leaflet-weather-map')!.getBoundingClientRect();
    const box = element.getBoundingClientRect();
    const close = element.querySelector('.leaflet-popup-close-button')!.getBoundingClientRect();
    const range = document.createRange(); range.selectNodeContents(element.querySelector('strong')!);
    const titleFits = [...range.getClientRects()].every(rect => rect.left >= map.left - 1 && rect.right <= map.right + 1);
    const center = { x: close.x + close.width / 2, y: close.y + close.height / 2 };
    const hit = document.elementFromPoint(center.x, center.y);
    return { bounded: box.left >= map.left - 1 && box.right <= map.right + 1, titleFits,
      closeInside: center.x >= map.left && center.x <= map.right && center.y >= map.top && center.y <= map.bottom,
      closeHittable: Boolean(hit?.closest('.leaflet-popup-close-button')) };
  });
  await expect.poll(popupConstraints).toEqual({ bounded: true, titleFits: true, closeInside: true, closeHittable: true });
  await page.screenshot({ path: path.join(output, 'selected-popup-390.png'), fullPage: true });
  await page.locator('.leaflet-popup-close-button').click(); await expect(page.locator('.leaflet-popup')).toHaveCount(0);
  await expect(forecast.locator('tbody tr')).toHaveCount(7);
  passed('PSGC9a Selected popup stays bounded on desktop-to-phone resize, fits its title and has a reachable close control');

  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await expect(locality).toBeVisible();
    await expect(forecast.locator('tbody tr')).toHaveCount(7);
    await page.screenshot({ path: path.join(output, `weather-${width}.png`), fullPage: true });
  }
  passed('PSGC10 Tablet and phone layouts retain hierarchy/map/seven-day forecast without page overflow');

  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(weather).toHaveCount(0); await signIn('staff@demo.aqours.test', 'Weather');
  await expect(region).toHaveValue(''); await expect(forecast).toHaveCount(0);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'Overview', exact: true }).click(); await expect(weather).toHaveCount(0);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('link', { name: 'Weather', exact: true }).click();
  await expect(region).toHaveValue(''); await expect(forecast).toHaveCount(0);
  await choose(losBanos.code); await expect(weather.getByText('27°C', { exact: true })).toBeVisible();
  await page.goto(`${web}/#/reports`); await page.goto(`${web}/#/weather`);
  await expect(region).toHaveValue(''); await expect(forecast).toHaveCount(0);
  passed('PSGC11 Staff mobile navigation works; account changes and leaving Weather clear all locality/forecast state');

  await page.route('**/api/v1/weather/psgc-locations', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'provider_unavailable', message: 'Catalog fixture unavailable' } }) }), { times: 1 });
  await page.reload(); await expect(weather.getByText('Catalog fixture unavailable')).toBeVisible();
  await weather.getByRole('button', { name: 'Retry loading', exact: true }).click();
  await expect(region).toBeVisible(); await expect(region).toHaveValue('');
  h.expire(); controls.failForecast = true;
  await choose(calamba.code);
  await expect(weather.getByText('Weather is temporarily unavailable. Try again shortly.')).toBeVisible();
  await expect(forecast).toHaveCount(0); controls.failForecast = false;
  await weather.getByRole('button', { name: 'Retry loading', exact: true }).click();
  await expect(weather.getByText('30°C', { exact: true })).toBeVisible();
  passed('PSGC12 Catalog and initial provider failures show independent errors, preserve navigation and recover by retry');
  assert.deepEqual(errors, []);
} catch (error) {
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true });
  throw error;
} finally {
  await writeFile(path.join(output, 'results.txt'), evidence.join('\n') + '\n');
  await context.clearCookies();
  await h.close();
}
