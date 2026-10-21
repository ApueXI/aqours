import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import type { Connection, WeatherForecast, WeatherLocation } from '../aqours-contracts/src/index.ts';
import { createApp } from '../aqours-api/src/app.ts';
import { disconnect } from '../aqours-api/src/config/database.ts';
import { weatherFixture } from '../aqours-api/test/weather-fixture.ts';
import { actors, connection, key, ok, request } from './harness.ts';

// Dedicated database and port must be supplied; never run against ordinary data.
assert.ok(process.env.DATABASE_URL, 'Supply an isolated seeded verification database');
assert.ok(new URL(process.env.DATABASE_URL).pathname.endsWith('_test'), 'Weather HTTP checks require an isolated database ending _test');
assert.ok(process.env.AQOURS_TEST_API, 'Supply a dedicated verification API URL');
const base = new URL(process.env.AQOURS_TEST_API);
const original = globalThis.fetch;
let server: Server;
let upstream = 0;
let failure = false;
before(async () => {
  globalThis.fetch = async (input, options) => {
    const url = new URL(String(input));
    if (!['api.open-meteo.com', 'geocoding-api.open-meteo.com'].includes(url.hostname)) return original(input, options);
    upstream++;
    if (failure) return new Response('Temporarily unavailable', { status: 429 });
    return Response.json(url.hostname.startsWith('geocoding') ? { results: [{
      id: 1, name: 'Manila', admin1: 'Metro Manila', country: 'Philippines', country_code: 'PH', latitude: 14.6, longitude: 121,
    }] } : weatherFixture());
  };
  await new Promise<void>((resolve, reject) => {
    server = createApp().listen(Number(base.port), '127.0.0.1', () => resolve());
    server.once('error', reject);
  });
});
after(async () => {
  globalThis.fetch = original;
  if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await disconnect();
});

test('weather HTTP requires authentication and serves all three roles with normalized data', async () => {
  const count = upstream;
  assert.equal((await request(null, 'GET', '/weather?latitude=14.6&longitude=121')).status, 401);
  assert.equal((await request(null, 'GET', '/weather/locations?q=Manila')).status, 401);
  assert.equal(upstream, count);
  const users = await actors();
  for (const actor of [users.a, users.staff, users.admin]) {
    const locations = await ok<WeatherLocation[]>(actor, 'GET', '/weather/locations?q=Manila');
    assert.equal(locations[0]!.name, 'Manila');
    const weather = await ok<WeatherForecast>(actor, 'GET', '/weather?latitude=14.6&longitude=121');
    assert.equal(weather.daily.length, 7);
    assert.equal(weather.daily[0]!.date, '2026-10-21');
    assert.equal(weather.units.temperature, '°C');
    assert.equal(weather.current.precipitation, 0);
    assert.equal(weather.timezone, 'Asia/Manila');
    assert.ok(weather.attribution.url.startsWith('https://open-meteo.com'));
  }
  assert.equal(upstream - count, 2, 'Forecast and city requests are shared across roles');
});

test('weather HTTP checks connection ownership before even a warmed forecast cache', async () => {
  const { a, b, staff, admin } = await actors();
  const owned = await connection(a);
  const before = await ok<Connection[]>(a, 'GET', '/me/connections');
  await ok(a, 'GET', `/weather?connectionId=${owned.id}`);
  const count = upstream;
  assert.equal((await request(b, 'GET', `/weather?connectionId=${owned.id}`)).status, 404);
  assert.equal((await request(staff, 'GET', `/weather?connectionId=${owned.id}`)).status, 403);
  assert.equal((await request(admin, 'GET', `/weather?connectionId=${owned.id}`)).status, 403);
  assert.equal(upstream, count);
  const unlocated = await ok<Connection>(admin, 'POST', '/staff/settings/connections', {
    customerId: a.user.id, reference: `WEATHER-${key()}`, address: 'Fictional address without coordinates', zoneConfirmed: false,
  });
  assert.equal((await request(a, 'GET', `/weather?connectionId=${unlocated.id}`)).status, 422);
  assert.equal(upstream, count);
  const after = await ok<Connection[]>(a, 'GET', '/me/connections');
  assert.deepEqual(after.filter(item => item.id !== unlocated.id), before, 'Weather reads never alter saved locations');
  await ok(admin, 'PATCH', `/staff/settings/connections/${unlocated.id}`, {
    expectedVersion: unlocated.version, reason: 'Reviewed fictional test connection after the missing-coordinate check',
    zoneId: owned.zoneId, zoneConfirmed: owned.zoneConfirmed, latitude: owned.latitude, longitude: owned.longitude,
  });
});

test('weather HTTP rejects invalid input before upstream and recovers from provider rate limiting', async () => {
  const { a } = await actors();
  const count = upstream;
  for (const path of [
    '/weather', '/weather?latitude=91&longitude=0', '/weather?latitude=&longitude=0',
    '/weather?latitude=0&longitude=Infinity', '/weather?latitude=14&longitude=121&connectionId=bad',
    '/weather/locations?q=x', '/weather/locations?q=Manila&url=http://localhost',
  ]) assert.equal((await request(a, 'GET', path)).status, 400);
  assert.equal(upstream, count);
  failure = true;
  const unavailable = await request(a, 'GET', '/weather?latitude=14.7&longitude=121');
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.body.error?.code, 'provider_unavailable');
  assert.equal((await request(a, 'GET', '/weather/locations?q=Unavailable')).status, 503);
  failure = false;
  await ok(a, 'GET', '/weather?latitude=14.7&longitude=121');
  await ok(a, 'GET', '/weather/locations?q=Unavailable');
});
