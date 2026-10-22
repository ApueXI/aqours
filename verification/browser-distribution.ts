import assert from 'node:assert/strict';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { expect } from '@playwright/test';
import type { MonitoringOverview, PickupSession } from '../aqours-contracts/src/index.ts';
import { fixturePassword, ok } from './harness.ts';
import { distributionBrowserHarness } from './browser-distribution-harness.ts';

const h = await distributionBrowserHarness();
const { page, web, site, prefix, admin, output } = h;
const evidence: string[] = [], errors: string[] = [], tilePaths: string[] = [];
const passed = (message: string) => { evidence.push(message); console.log('PASS', message); };
page.on('pageerror', error => errors.push(error.stack || error.message));
page.on('request', request => { const url = new URL(request.url()); if (url.hostname === 'maps.geoapify.com') tilePaths.push(url.pathname); });
const overview = () => ok<MonitoringOverview>(admin, 'GET', '/staff/distribution/monitoring');
const detail = page.getByRole('region', { name: 'Selected pickup site', exact: true });
const timeline = page.getByRole('group', { name: 'Forecast date', exact: true });
try {
  await page.goto(web);
  await page.getByLabel('Email', { exact: true }).fill('admin@demo.aqours.test');
  await page.getByLabel('Password', { exact: true }).fill(fixturePassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await page.goto(`${web}/#/distribution?q=${encodeURIComponent(prefix)}`);
  await expect(page.getByRole('heading', { name: 'Distribution monitoring', exact: true })).toBeVisible();
  await expect(page.getByLabel('Pickup or request reference', { exact: true })).toBeVisible();
  await expect(timeline.getByRole('button')).toHaveCount(7);
  await expect(page.locator('.distribution-site-marker')).toHaveCount(2);
  await expect(page.getByText(/3 sites · 1 without coordinates/)).toBeVisible();
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  passed('Monitoring opens first with seven dates, real tiles, located markers, and an accessible unlocated site');

  await page.locator(`.distribution-site-marker[title^="${site.name}"]`).click();
  await expect(page.locator('.leaflet-popup')).toContainText(site.name);
  await expect(page.locator('.leaflet-popup')).toContainText('Available for reservation now: 100.00 L');
  await expect(detail).toContainText('Monitoring not enabled');
  await detail.getByText(`Configure monitoring for ${site.name}`, { exact: true }).click();
  await detail.getByLabel('Enable monitoring', { exact: true }).check();
  await detail.getByLabel('Low supply threshold (L)', { exact: true }).fill('20.00');
  await detail.getByLabel('Critical supply threshold (L)', { exact: true }).fill('5.00');
  await detail.getByLabel('Planning capacity (L, optional)', { exact: true }).fill('200.00');
  await detail.getByLabel('Monitoring change reason', { exact: true }).fill('Fictional browser monitoring setup');
  const configured = page.waitForResponse(response => response.request().method() === 'PATCH' && response.url().endsWith(`/pickup-sites/${site.id}/monitoring`));
  await detail.getByRole('button', { name: 'Save monitoring configuration', exact: true }).click();
  assert.equal((await configured).status(), 200);
  await expect.poll(async () => (await overview()).sites.find(item => item.site.id === site.id)?.days[0]?.status, { timeout: 25000 }).toBe('normal');
  await page.getByRole('button', { name: 'Refresh monitoring', exact: true }).click();
  await expect(page.locator(`.distribution-site-marker[title="${site.name} · normal"] span`)).toHaveCSS('background-color', 'rgb(21, 128, 61)');
  await expect(detail).toContainText('100.00 L');
  await expect(detail).toContainText('50.0%');
  await expect(detail).toContainText('33°C');
  await page.getByLabel('Monitoring status', { exact: true }).selectOption('normal');
  await page.getByRole('button', { name: 'Apply monitoring filters', exact: true }).click();
  await expect(page.locator('.distribution-site-marker')).toHaveCount(1);
  await expect(page).toHaveURL(/status=normal/);
  await page.getByLabel('Monitoring status', { exact: true }).selectOption('');
  await page.getByRole('button', { name: 'Apply monitoring filters', exact: true }).click();
  await expect(page.locator('.distribution-site-marker')).toHaveCount(2);
  passed('Site configuration persists and the real scheduler produces normal status with current reservable stock and capacity ratio');

  await timeline.getByRole('button').nth(1).click();
  await expect(page).toHaveURL(/date=/);
  await expect(page.locator(`.distribution-site-marker[title="${site.name} · warning"] span`)).toHaveCSS('background-color', 'rgb(234, 179, 8)');
  await expect(detail).toContainText('35°C');
  await expect(page.locator('.site-temperature-label').filter({ hasText: '35.0°C' })).toBeVisible();
  await expect(detail).toContainText('100.00 L');
  const position = await page.locator('.leaflet-map-pane').getAttribute('style');
  await expect(page.getByLabel('Map style', { exact: true })).toBeEnabled();
  for (const style of ['light', 'dark', 'streets']) {
    await page.getByLabel('Map style', { exact: true }).selectOption(style);
    const tileStyle = style === 'light' ? 'positron' : style === 'dark' ? 'dark-matter' : 'osm-bright';
    await expect(page.locator(`.leaflet-tile-loaded[src*="/tile/${tileStyle}/"]`).first()).toBeVisible();
    await expect(page.locator(`.distribution-site-marker[title="${site.name} · warning"]`)).toBeVisible();
    await expect(page.locator('.site-temperature-label').filter({ hasText: '35.0°C' })).toBeVisible();
    assert.equal(await page.locator('.leaflet-map-pane').getAttribute('style'), position);
  }
  await page.getByLabel('Daily maximum temperature overlay', { exact: true }).uncheck();
  await expect(page.locator('.site-temperature-label')).toHaveCount(0);
  await expect(page.locator('.distribution-site-marker')).toHaveCount(2);
  await page.getByLabel('Daily maximum temperature overlay', { exact: true }).check();
  await page.reload();
  await expect(detail).toContainText('35°C');
  await expect(timeline.getByRole('button').nth(1)).toHaveAttribute('aria-pressed', 'true');
  passed('Timeline, marker risk, temperature labels and URL survive style changes, overlay toggles and reload while supply stays current');

  const session = await ok<PickupSession>(admin, 'PATCH', `/staff/distribution/sessions/${h.session.id}`, {
    expectedVersion: h.session.version, totalLiters: '10.00', reason: 'Fictional browser low-stock threshold',
  });
  await expect.poll(async () => (await overview()).sites.find(item => item.site.id === site.id)?.warnings.some(warning => warning.family === 'combined'), { timeout: 25000 }).toBe(true);
  await page.getByRole('button', { name: 'Refresh monitoring', exact: true }).click();
  await expect(detail).toContainText('10.00 L');
  await expect(detail).toContainText('High temperature and low supply');
  await timeline.getByRole('button').nth(2).click();
  await expect(page.locator(`.distribution-site-marker[title="${site.name} · critical"] span`)).toHaveCSS('background-color', 'rgb(220, 38, 38)');
  await expect(detail).toContainText('39°C');
  await expect(page.locator(`.distribution-site-marker[title^="${h.inactive.name}"] span`)).toHaveCSS('background-color', 'rgb(107, 114, 128)');
  passed('Committed stock changes generate combined warnings; critical heat and inactive sites use the correct status colors');

  await page.getByRole('navigation', { name: 'Distribution sections' }).getByRole('link', { name: 'Warning history', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Warning history', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'All warning dates', exact: true }).click();
  await expect(page).toHaveURL(/warningDate=all/);
  const yesterday = new Date(Date.now() - 86400000 + 28800000).toISOString().slice(0, 10);
  await page.getByLabel('Warning date (Manila)', { exact: true }).fill(yesterday);
  await expect(page).toHaveURL(new RegExp(`warningDate=${yesterday}`));
  await expect(page.getByText('No warnings for these filters.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'All warning dates', exact: true }).click();
  await page.getByRole('button', { name: `Warning history for ${site.name}`, exact: true }).first().click();
  await expect(page.getByRole('region', { name: 'Warning details', exact: true })).toContainText('Triggered');
  await expect(page.getByRole('region', { name: 'Warning details', exact: true })).toContainText('Thresholds:');
  await expect(page.getByLabel('Pickup or request reference', { exact: true })).toBeVisible();
  passed('Warning history exposes immutable threshold evidence and reservation lookup remains accessible');

  await page.getByRole('navigation', { name: 'Distribution sections' }).getByRole('link', { name: 'Sessions', exact: true }).click();
  await page.getByRole('button', { name: `Manage session at ${site.name}`, exact: true }).click();
  const managedSession = page.locator('article.session');
  await managedSession.getByText('Edit stock / schedule', { exact: true }).click();
  await managedSession.getByLabel('Total stock (liters)', { exact: true }).fill('25.50');
  await managedSession.getByLabel('Stock / schedule change reason', { exact: true }).fill('Fictional browser exact-decimal correction');
  const restock = page.waitForResponse(response => response.request().method() === 'PATCH' && response.url().endsWith(`/sessions/${session.id}`));
  await managedSession.getByRole('button', { name: 'Save pickup session', exact: true }).click();
  assert.equal((await restock).status(), 200);
  assert.equal((await ok<PickupSession[]>(admin, 'GET', '/staff/distribution/sessions?limit=100')).find(item => item.id === session.id)?.remainingLiters, '25.50');
  passed('Compact session management retains existing versioned exact-decimal stock editing');

  await page.reload();
  const notifications = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: /^My monitoring notifications$/ }) });
  await notifications.locator('summary').click();
  const notificationRead = page.waitForResponse(response => response.request().method() === 'POST' && /\/notifications\/[^/]+\/read$/.test(new URL(response.url()).pathname));
  await notifications.getByRole('button', { name: 'Mark notification read', exact: true }).first().click();
  assert.equal((await notificationRead).status(), 200);
  await expect(notifications.getByText(/Read /).first()).toBeVisible();
  await page.getByText('Temperature legend settings', { exact: true }).click();
  await page.getByLabel('Temperature boundaries (°C, JSON)', { exact: true }).fill('[20,25,30,35]');
  await page.getByLabel('Legend change reason', { exact: true }).fill('Fictional browser temperature legend setup');
  const legendSaved = page.waitForResponse(response => response.request().method() === 'PATCH' && response.url().endsWith('/temperature-bands'));
  await page.getByRole('button', { name: 'Save temperature legend', exact: true }).click();
  assert.equal((await legendSaved).status(), 200);
  passed('Supplier notification read state and admin temperature-band configuration persist through the real API');

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const tab of ['monitoring', 'sessions', 'sites', 'warnings']) {
      await page.goto(`${web}/#/distribution?tab=${tab}&q=${encodeURIComponent(prefix)}&siteId=${site.id}`);
      await expect(page.getByRole('heading', { name: 'Water distribution', exact: true })).toBeVisible();
      await expect(page.getByText('Loading…', { exact: true })).toHaveCount(0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${tab} overflows ${width}`);
    }
    passed(`Distribution tabs remain usable without page overflow at ${width}px`);
  }
  await page.goto(`${web}/#/distribution?q=${encodeURIComponent(prefix)}&siteId=${site.id}`);
  await page.getByRole('group', { name: 'Monitoring view' }).getByRole('button', { name: 'Map', exact: true }).click();
  await expect(page.getByLabel('Distribution monitoring map', { exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(output, 'monitoring-phone.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(output, 'monitoring-desktop.png'), fullPage: true });
  await page.unroute('https://maps.geoapify.com/**');
  await page.route('https://maps.geoapify.com/**', route => route.abort('failed'));
  await page.reload();
  await expect(page.getByRole('alert').filter({ hasText: 'Basemap tiles could not load' })).toBeVisible();
  await expect(page.getByRole('button', { name: site.name, exact: true })).toBeVisible();
  await expect(page.locator('.distribution-site-marker')).toHaveCount(2);
  await page.unroute('https://maps.geoapify.com/**');
  await page.route('https://maps.geoapify.com/**', route => route.fulfill({ contentType: 'image/png', body: h.tile }));
  await page.getByRole('button', { name: 'Retry basemap', exact: true }).click();
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'Basemap tiles could not load' })).toHaveCount(0);
  passed('Failed tiles retain an explicit notice and usable site data; a successful retry restores the basemap');
  assert.deepEqual(errors, []);
  passed('Narrow List/Map switching and the integrated distribution workflow have no uncaught browser errors');
} catch (problem) {
  console.log('Browser diagnostic', JSON.stringify({ route: page.url(), style: await page.getByLabel('Map style', { exact: true }).inputValue().catch(() => 'missing'), tilePaths: tilePaths.slice(-12) }));
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }); throw problem;
} finally {
  await writeFile(path.join(output, 'results.txt'), evidence.join('\n') + '\n');
  await writeFile(path.join(output, 'errors.txt'), errors.join('\n') + '\n');
  await h.close();
}
