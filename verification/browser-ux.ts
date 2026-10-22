import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { fixturePassword } from './harness.ts';

const web = process.env.AQOURS_TEST_WEB ?? 'http://localhost:5173';
const output = path.resolve('.local/ui-ux/evidence');
const temporary = path.resolve('.cache/tmp');
await Promise.all([mkdir(output, { recursive: true }), mkdir(temporary, { recursive: true })]);
const context = await chromium.launchPersistentContext(path.resolve('.local/ui-ux/ux-browser-profile'), {
  executablePath: '/usr/bin/chromium', headless: true, viewport: { width: 1440, height: 1000 },
  env: { ...process.env, TMPDIR: temporary }, args: ['--no-sandbox'],
});
await context.clearCookies();
const page = await context.newPage();
const readTile = await readFile(new URL('./fixtures/street-tile.png', import.meta.url));
await page.route('https://tiles.example.test/**', route => route.fulfill({
  contentType: 'image/png', body: readTile,
}));
page.setDefaultTimeout(15000);
const evidence: string[] = [], errors: string[] = [];
const passed = (message: string) => { evidence.push(message); console.log('PASS', message); };
page.on('pageerror', error => errors.push(`${error.message}\n${error.stack ?? ''}`));
const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
try {
  await page.goto(web);
  await page.getByLabel('Email', { exact: true }).fill('staff@demo.aqours.test');
  await page.getByLabel('Password', { exact: true }).fill(fixturePassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  passed('UX1 Keyboard skip link moves focus into the operational workspace');

  await page.goto(`${web}/#/reports`);
  const contrast = await page.locator('.filters button[type="submit"]').evaluate(button => {
    const luminance = (value: string) => {
      const channels = (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number).map(channel => {
        const scaled = channel / 255;
        return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const style = getComputedStyle(button);
    const text = luminance(style.color), background = luminance(style.backgroundColor);
    return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
  });
  assert.ok(contrast >= 4.5, `Primary action contrast ${contrast} is below 4.5:1`);
  const target = await page.locator('.filters button[type="submit"]').boundingBox();
  assert.ok(target && target.height >= 44);
  passed('UX7 Primary action has measured AA text contrast and at least a 44px target');
  await page.getByLabel('Category', { exact: true }).selectOption('leak');
  await page.getByLabel('Status', { exact: true }).selectOption('received');
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
  await expect.poll(() => page.url()).toContain('category=leak');
  await page.reload();
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue('leak');
  await expect(page.getByLabel('Status', { exact: true })).toHaveValue('received');
  await page.getByRole('link', { name: 'View on map', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Report map', exact: true })).toBeVisible();
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue('leak');
  await page.getByRole('link', { name: 'Open inbox with filters', exact: true }).click();
  await expect(page.getByLabel('Status', { exact: true })).toHaveValue('received');
  passed('UX2 Applied report filters survive reload and coordinated inbox/map navigation');

  const routes = [
    ['overview', 'Overview'], ['reports', 'Report inbox'], ['map', 'Report map'],
    ['incidents', 'Incidents'], ['advisories', 'Official advisories'],
    ['assistance', 'Assistance queue'], ['distribution', 'Water distribution'], ['weather', 'Weather'], ['settings', 'Settings and audit'],
  ];
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [route, title] of routes) {
      await page.goto(`${web}/#/${route}`);
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(page.getByText('Loading…', { exact: true })).toHaveCount(0);
      assert.equal(await overflow(), false, `${route} overflows the page at ${width}px`);
    }
    await page.screenshot({ path: path.join(output, `supplier-settings-${width}.png`), fullPage: true });
    passed(`UX3 All supplier destinations retain usable page width at ${width}px`);
  }

  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await menu.click();
  await expect(page.getByRole('button', { name: 'Close menu', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Reports', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Report inbox', exact: true })).toBeVisible();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  passed('UX4 Narrow navigation supports keyboard dismissal and closes after choosing a destination');

  await page.goto(`${web}/#/map`);
  await expect(page.getByRole('button', { name: 'List', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Report list', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Map', exact: true }).click();
  await expect(page.getByLabel('Supplier report map', { exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(output, 'supplier-map-phone.png'), fullPage: true });
  passed('UX5 Narrow map workspace offers explicit list and map views');
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [route] of routes) {
    await page.goto(`${web}/#/${route}`);
    await expect(page.getByText('Loading…', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: path.join(output, `supplier-${route}.png`), fullPage: true });
    await page.screenshot({ path: path.join(output, `supplier-${route}-viewport.png`) });
  }
  assert.deepEqual(errors, []);
  passed('UX6 Redesigned supplier navigation and viewport changes produce no uncaught exceptions');
} catch (error) {
  await page.screenshot({ path: path.join(output, 'ux-failure.png'), fullPage: true });
  throw error;
} finally {
  await writeFile(path.join(output, 'browser-ux-results.txt'), evidence.join('\n') + '\n');
  await context.close();
}
