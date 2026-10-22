import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { MonitoredSite, MonitoringOverview, PickupSession, PickupSite, SiteMonitoringConfig } from '../aqours-contracts/src/index.ts';
import { createApp } from '../aqours-api/src/app.ts';
import { disconnect, prisma } from '../aqours-api/src/config/database.ts';
import { weatherFixture } from '../aqours-api/test/weather-fixture.ts';
import { normalizeForecast } from '../aqours-api/src/services/weather/normalize.ts';
import { actors, connection, key, ok } from './harness.ts';

export { prisma };
export const clock = new Date();
export const day = (offset = 0) => new Date(clock.getTime() + 8 * 3600_000 + offset * 86400_000).toISOString().slice(0, 10);
export const provider = { calls: 0, active: 0, maximumActive: 0, fail: false, malformed: false, maxima: [35, 38, 34.99, 37.99, 30, 35, 38] as (number | null)[] };
const originalFetch = globalThis.fetch;
let server: Server | undefined;
export let users: Awaited<ReturnType<typeof actors>>;
export const defaults = { enabled: true, warningTemperature: 35, criticalTemperature: 38,
  lowSupplyLiters: '100.00', criticalSupplyLiters: '50.00', capacityLiters: '100.00', reason: 'Fictional monitoring verification' };
export function forecastPayload() {
  const fixture = weatherFixture();
  const epoch = Date.parse(`${day()}T00:00:00+08:00`) / 1000;
  fixture.current.time = epoch + 36000;
  fixture.daily.time = Array.from({ length: 7 }, (_, index) => epoch + index * 86400);
  fixture.daily.temperature_2m_max = [...provider.maxima] as number[];
  return fixture;
}
export async function forecastLoader(latitude: number, longitude: number) {
  return normalizeForecast(forecastPayload(), latitude, longitude);
}

export async function start() {
  assert.ok(process.env.DATABASE_URL, 'Supply an isolated seeded verification database');
  assert.ok(new URL(process.env.DATABASE_URL).pathname.endsWith('_test'), 'Distribution checks require an isolated database ending _test');
  assert.ok(process.env.AQOURS_TEST_API, 'Supply a dedicated verification API URL');
  const base = new URL(process.env.AQOURS_TEST_API);
  assert.equal(base.hostname, '127.0.0.1');
  globalThis.fetch = async (input, options) => {
    const url = new URL(String(input));
    if (url.hostname !== 'api.open-meteo.com') return originalFetch(input, options);
    provider.calls++; provider.active++; provider.maximumActive = Math.max(provider.maximumActive, provider.active);
    try {
      await new Promise(resolve => setTimeout(resolve, 5));
      if (provider.fail) return new Response('Controlled provider failure', { status: 429 });
      if (provider.malformed) return Response.json({ timezone: 'Asia/Manila', daily: {} });
      return Response.json(forecastPayload());
    } finally { provider.active--; }
  };
  await new Promise<void>((resolve, reject) => {
    server = createApp().listen(Number(base.port), '127.0.0.1', () => resolve());
    server.once('error', reject);
  });
  users = await actors();
}
export async function stop() {
  globalThis.fetch = originalFetch;
  if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()));
  await disconnect();
}
export async function site(located = true): Promise<PickupSite> {
  return ok(users.admin, 'POST', '/staff/pickup-sites', { name: `Monitoring verification ${key()}`,
    address: 'Fictional Laguna collection point', instructions: 'Demonstration only', demo: true,
    ...(located ? { latitude: 14.17 + Math.random() / 1000, longitude: 121.2 } : {}) });
}
export async function configure(item: PickupSite, patch: Partial<typeof defaults> = {}, expectedVersion = 0) {
  return ok<SiteMonitoringConfig>(users.staff, 'PATCH', `/staff/pickup-sites/${item.id}/monitoring`, { ...defaults, ...patch, expectedVersion });
}
export async function session(item: PickupSite, liters = '100.00', options: { start?: number; end?: number } = {}) {
  return ok<PickupSession>(users.staff, 'POST', '/staff/distribution/sessions', { siteId: item.id,
    zoneIds: [(await connection(users.a)).zoneId!], startsAt: new Date(clock.getTime() + (options.start ?? -60_000)).toISOString(),
    endsAt: new Date(clock.getTime() + (options.end ?? 86400_000)).toISOString(), totalLiters: liters,
    instructions: 'Fictional monitoring stock', demo: true });
}
export async function observed(id: string): Promise<MonitoredSite> {
  const overview = await ok<MonitoringOverview>(users.staff, 'GET', '/staff/distribution/monitoring');
  const item = overview.sites.find(value => value.site.id === id);
  assert.ok(item, `Monitoring overview omitted site ${id}`);
  return item;
}
