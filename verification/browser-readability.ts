import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, expect, type Locator } from '@playwright/test';
import type { Connection, PickupSite, User, Zone } from '../aqours-contracts/src/index.ts';
import { fixturePassword, key, login, ok } from './harness.ts';

const output = path.resolve('.local/reference-ui/evidence/readability');
await mkdir(output, { recursive: true });
const admin = await login('admin@demo.aqours.test', 'web');
const suffix = key();
const name = `Synthetic long account identity for Calamba service coordination ${suffix}`;
const user = await ok<User>(admin, 'POST', '/staff/settings/accounts', {
  name, email: `synthetic-long-customer-identity-${suffix}@demo.aqours.test`, password: fixturePassword, role: 'customer',
});
const reference = `LONG-SYNTHETIC-CONNECTION-REFERENCE-${suffix}`;
await ok<Connection>(admin, 'POST', '/staff/settings/connections', { customerId: user.id, reference,
  address: 'Synthetic long service address at the far end of Fictional Community Road, Bagong Kalsada, Calamba, Laguna, Philippines', zoneId: null, zoneConfirmed: false });
const siteName = `Synthetic long pickup site for community water distribution ${suffix}`;
const site = await ok<PickupSite>(admin, 'POST', '/staff/pickup-sites', { name: siteName,
  address: 'Synthetic long pickup site address at Fictional Community Hall, Calamba, Laguna, Philippines', instructions: 'Synthetic verification only', demo: true });
const zone = (await ok<Zone[]>(admin, 'GET', '/staff/settings/zones'))[0];
await ok(admin, 'POST', '/staff/distribution/sessions', { siteId: site.id, zoneIds: [zone.id],
  startsAt: new Date(Date.now() - 60000).toISOString(), endsAt: new Date(Date.now() + 86400000).toISOString(), totalLiters: '100.00', instructions: 'Synthetic verification only', demo: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true,
  env: { ...process.env, TMPDIR: path.resolve('.local/reference-ui/tmp') }, args: ['--no-sandbox'] });
const page = await browser.newPage();
const results: unknown[] = [];
async function unbroken(locator: Locator, text: string) {
  await expect(locator).toBeVisible();
  const geometry = await locator.evaluate((element, value) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const offset = node.textContent?.indexOf(value) ?? -1;
      if (offset < 0) continue;
      const range = document.createRange(); range.setStart(node, offset); range.setEnd(node, offset + value.length);
      const rects = [...range.getClientRects()].filter(rect => rect.width > 0);
      return { lines: new Set(rects.map(rect => Math.round(rect.top))).size, width: element.clientWidth,
        scroll: element.scrollWidth, text: value };
    }
    throw new Error('Expected label text not found');
  }, text);
  assert.equal(geometry.lines, 1, `${text} must remain unbroken: ${JSON.stringify(geometry)}`);
  assert.ok(geometry.scroll <= geometry.width + 1, `${text} overflows its control/cell`);
  return geometry;
}
try {
  await page.goto(process.env.AQOURS_TEST_WEB!);
  await page.getByLabel('Email', { exact: true }).fill('admin@demo.aqours.test');
  await page.getByLabel('Password', { exact: true }).fill(fixturePassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${process.env.AQOURS_TEST_WEB}/#/settings`);
    const account = page.locator('tbody tr').filter({ hasText: name });
    await expect(account).toHaveCount(1);
    const labels = [await unbroken(account.locator('[data-label="Role"]'), 'Customer'),
      await unbroken(account.locator('[data-label="State"]'), 'Active')];
    await page.screenshot({ path: path.join(output, `accounts-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Connections', exact: true }).click();
    const connection = page.locator('tbody tr').filter({ hasText: reference });
    labels.push(await unbroken(connection.locator('[data-label="Zone"]'), 'Unknown'));
    await page.screenshot({ path: path.join(output, `connections-${width}.png`), fullPage: true });
    await page.goto(`${process.env.AQOURS_TEST_WEB}/#/distribution?tab=sessions`);
    const session = page.locator('tbody tr').filter({ hasText: siteName });
    labels.push(await unbroken(session.locator('[data-label="Status"] > span'), 'Open'),
      await unbroken(session.getByRole('button', { name: `Manage session at ${siteName}`, exact: true }), 'Manage'));
    await page.screenshot({ path: path.join(output, `sessions-${width}.png`), fullPage: true });
    await page.getByRole('navigation', { name: 'Distribution sections' }).getByRole('link', { name: 'Sites', exact: true }).click();
    const pickup = page.locator('tbody tr').filter({ hasText: siteName });
    labels.push(await unbroken(pickup.getByRole('button', { name: `Manage pickup site ${siteName}`, exact: true }), 'Manage site'));
    await page.screenshot({ path: path.join(output, `sites-${width}.png`), fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Page must not overflow horizontally');
    results.push({ width, labels });
    console.log(`PASS READABILITY${width} Long account, connection, session and site rows retain complete short labels/actions`);
  }
} finally {
  await writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2) + '\n');
  await browser.close();
}
