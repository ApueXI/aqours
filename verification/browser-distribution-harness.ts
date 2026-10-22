import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { createApp } from '../aqours-api/src/app.ts';
import { startMonitoringScheduler } from '../aqours-api/src/services/monitoring/worker.ts';
import { disconnect } from '../aqours-api/src/config/database.ts';
import { weatherFixture } from '../aqours-api/test/weather-fixture.ts';
import { connection, key, login, ok } from './harness.ts';
import type { PickupSite, PickupSession } from '../aqours-contracts/src/index.ts';

export async function distributionBrowserHarness() {
  assert.ok(process.env.DATABASE_URL && new URL(process.env.DATABASE_URL).pathname.endsWith('_test'));
  const api = new URL(process.env.AQOURS_TEST_API!);
  const output = path.resolve('.local/distribution/evidence/browser');
  const temporary = path.resolve('.cache/tmp/distribution');
  await Promise.all([mkdir(output, { recursive: true }), mkdir(temporary, { recursive: true })]);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, options) => {
    const url = new URL(String(input));
    if (url.hostname !== 'api.open-meteo.com') return originalFetch(input, options);
    const payload = weatherFixture();
    const today = new Date(Date.now() + 28800000).toISOString().slice(0, 10);
    const start = Date.parse(`${today}T00:00:00+08:00`) / 1000;
    payload.daily.time = Array.from({ length: 7 }, (_, i) => start + i * 86400);
    payload.current.time = start + 36000;
    payload.daily.temperature_2m_max = [33, 35, 39, 32, 34, 36, 37];
    return Response.json(payload);
  };
  const server = createApp().listen(Number(api.port), '127.0.0.1');
  await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const admin = await login('admin@demo.aqours.test', 'web');
  const customer = await login('customer01@demo.aqours.test');
  const zoneId = (await connection(customer)).zoneId!;
  const suffix = key().slice(0, 8);
  const prefix = `Browser monitoring ${suffix}`;
  const site = await ok<PickupSite>(admin, 'POST', '/staff/pickup-sites', {
    name: `${prefix} active`, address: 'Fictional monitoring test hall', instructions: 'Fictional test pickup only',
    latitude: 14.221, longitude: 121.181, active: true, demo: true,
  });
  const inactive = await ok<PickupSite>(admin, 'POST', '/staff/pickup-sites', {
    name: `${prefix} inactive`, address: 'Fictional inactive hall', instructions: 'Closed test site',
    latitude: 14.25, longitude: 121.21, active: false, demo: true,
  });
  const unlocated = await ok<PickupSite>(admin, 'POST', '/staff/pickup-sites', {
    name: `${prefix} unlocated`, address: 'Fictional unlocated hall', instructions: 'Location review needed', demo: true,
  });
  const session = await ok<PickupSession>(admin, 'POST', '/staff/distribution/sessions', {
    siteId: site.id, zoneIds: [zoneId], startsAt: new Date(Date.now() - 60000).toISOString(),
    endsAt: new Date(Date.now() + 86400000).toISOString(), totalLiters: '100.00', instructions: 'Fictional monitoring session', demo: true,
  });
  const stopScheduler = startMonitoringScheduler();
  const context = await chromium.launchPersistentContext(path.join(output, 'profile'), {
    executablePath: '/usr/bin/chromium', headless: true, viewport: { width: 1440, height: 1000 },
    env: { ...process.env, TMPDIR: temporary }, args: ['--no-sandbox'],
  });
  await context.clearCookies();
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const tile = await readFile(new URL('./fixtures/street-tile.png', import.meta.url));
  await page.route('https://maps.geoapify.com/**', route => route.fulfill({ contentType: 'image/png', body: tile }));
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  return { page, context, output, prefix, site, inactive, unlocated, session, admin, tile,
    web: process.env.AQOURS_TEST_WEB!,
    async close() {
      await context.close(); await stopScheduler(); globalThis.fetch = originalFetch;
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      await disconnect();
    },
  };
}
export type DistributionBrowser = Awaited<ReturnType<typeof distributionBrowserHarness>>;
