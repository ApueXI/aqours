import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdir, readFile } from 'node:fs/promises';
import { mock } from 'node:test';
import { chromium } from '@playwright/test';
import { createApp } from '../aqours-api/src/app.ts';
import { disconnect } from '../aqours-api/src/config/database.ts';
import { weatherFixture } from '../aqours-api/test/weather-fixture.ts';

export async function weatherFixtureApi(freezeClock = false) {
  assert.ok(process.env.DATABASE_URL && new URL(process.env.DATABASE_URL).pathname.endsWith('_test'));
  assert.ok(process.env.AQOURS_TEST_API);
  const api = new URL(process.env.AQOURS_TEST_API);
  const controls = { failForecast: false, delayedLatitude: '', alternateLatitude: '', calls: [] as URL[] };
  const original = globalThis.fetch;
  if (freezeClock) mock.timers.enable({ apis: ['Date'], now: Date.now() });
  globalThis.fetch = async (input, options) => {
    const url = new URL(String(input));
    if (url.hostname !== 'api.open-meteo.com') return original(input, options);
    controls.calls.push(url);
    if (url.searchParams.get('latitude') === controls.delayedLatitude) await new Promise(resolve => setTimeout(resolve, 900));
    if (controls.failForecast) return new Response('Unavailable', { status: 503 });
    const payload = weatherFixture();
    if (url.searchParams.get('latitude') === controls.alternateLatitude) {
      payload.current.temperature_2m = 27;
      payload.current.weather_code = 1234;
      Object.assign(payload.daily, { precipitation_probability_max: [null, 30, 60, 10, 80, 90, 0] });
    }
    return Response.json(payload);
  };
  const server = createApp().listen(Number(api.port), '127.0.0.1');
  await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  return { controls, expire: () => mock.timers.tick(600_001),
    async close() {
      globalThis.fetch = original;
      if (freezeClock) mock.timers.reset();
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      await disconnect();
    },
  };
}

export async function weatherBrowserHarness() {
  const fixture = await weatherFixtureApi(true);
  const output = path.resolve('.local/psgc-weather/evidence/browser');
  const temporary = path.resolve('.local/psgc-weather/tmp');
  await Promise.all([mkdir(output, { recursive: true }), mkdir(temporary, { recursive: true })]);
  const context = await chromium.launchPersistentContext(path.join(output, 'profile'), {
    executablePath: '/usr/bin/chromium', headless: true, viewport: { width: 1440, height: 1000 },
    env: { ...process.env, TMPDIR: temporary }, args: ['--no-sandbox'],
  });
  await context.clearCookies();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const tile = await readFile(new URL('./fixtures/street-tile.png', import.meta.url));
  let failTiles = false;
  await page.route('https://tiles.example.test/**', route => failTiles ? route.abort() : route.fulfill({ contentType: 'image/png', body: tile }));
  await page.route('https://maps.geoapify.com/**', route => failTiles ? route.abort() : route.fulfill({ contentType: 'image/png', body: tile }));
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  return { ...fixture, context, page, output, web: process.env.AQOURS_TEST_WEB!,
    failTiles(value: boolean) { failTiles = value; },
    async close() { await context.close(); await fixture.close(); },
  };
}
export type WeatherBrowser = Awaited<ReturnType<typeof weatherBrowserHarness>>;
