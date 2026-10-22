import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import type { Connection, WeatherForecast, WeatherLocation, WeatherPsgcLocation } from '../aqours-contracts/src/index.ts';
import { createApp } from '../aqours-api/src/app.ts';
import { disconnect } from '../aqours-api/src/config/database.ts';
import { weatherFixture } from '../aqours-api/test/weather-fixture.ts';
import { actors, connection, login, ok, request } from './harness.ts';
import { assertWeatherCatalog } from './weather-psgc-canonical.ts';

// Dedicated database and port must be supplied; never run against ordinary data.
assert.ok(process.env.DATABASE_URL, 'Supply an isolated seeded verification database');
assert.ok(new URL(process.env.DATABASE_URL).pathname.endsWith('_test'), 'Weather HTTP checks require an isolated database ending _test');
assert.ok(process.env.AQOURS_TEST_API, 'Supply a dedicated verification API URL');
const base = new URL(process.env.AQOURS_TEST_API);
const original = globalThis.fetch;
let server: Server;
let upstream = 0;
let failure = false;
const forecastCoordinates: string[] = [];
before(async () => {
  globalThis.fetch = async (input, options) => {
    const url = new URL(String(input));
    if (!['api.open-meteo.com', 'geocoding-api.open-meteo.com'].includes(url.hostname)) return original(input, options);
    upstream++;
    if (url.hostname === 'api.open-meteo.com') forecastCoordinates.push(`${url.searchParams.get('latitude')},${url.searchParams.get('longitude')}`);
    if (failure) return new Response('Temporarily unavailable', { status: 429 });
    return Response.json(url.hostname.startsWith('geocoding') ? { results: [{
      id: 1, name: 'Calamba', admin1: 'Laguna', country: 'Philippines', country_code: 'PH', latitude: 14.1679, longitude: 121.1951,
    }, {
      id: 2, name: 'Los Baños', admin1: 'Laguna', country: 'Philippines', country_code: 'PH', latitude: 14.1674, longitude: 121.2433,
    }, {
      id: 3, name: 'Santa Rosa', admin1: 'Laguna', country: 'Philippines', country_code: 'PH', latitude: 14.2946, longitude: 121.1054,
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
  assert.equal((await request(null, 'GET', '/weather?latitude=14.1679&longitude=121.1951')).status, 401);
  assert.equal((await request(null, 'GET', '/weather/locations?q=Calamba')).status, 401);
  assert.equal(upstream, count);
  const users = await actors();
  for (const actor of [users.a, users.staff, users.admin]) {
    const locations = await ok<WeatherLocation[]>(actor, 'GET', '/weather/locations?q=Calamba');
    assert.deepEqual(locations.map(city => city.name), ['Calamba', 'Los Baños', 'Santa Rosa']);
    assert.ok(locations.every(city => city.area === 'Laguna'));
    const weather = await ok<WeatherForecast>(actor, 'GET', '/weather?latitude=14.1679&longitude=121.1951');
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
  assert.equal(owned.reference, 'DEMO-CON-001');
  assert.ok(owned.latitude! > 14 && owned.latitude! < 14.5, 'Fresh customer01 connection is in Laguna');
  assert.ok(owned.longitude! > 121.05 && owned.longitude! < 121.6);
  const forecast = await ok<WeatherForecast>(a, 'GET', `/weather?connectionId=${owned.id}`);
  assert.deepEqual(forecast.location, { latitude: owned.latitude, longitude: owned.longitude });
  assert.equal(forecast.daily.length, 7);
  const count = upstream;
  assert.equal((await request(b, 'GET', `/weather?connectionId=${owned.id}`)).status, 404);
  assert.equal((await request(staff, 'GET', `/weather?connectionId=${owned.id}`)).status, 403);
  assert.equal((await request(admin, 'GET', `/weather?connectionId=${owned.id}`)).status, 403);
  assert.equal(upstream, count);
  const unlocatedCustomer = await login('customer12@demo.aqours.test');
  const unlocated = await connection(unlocatedCustomer);
  assert.equal(unlocated.reference, 'DEMO-CON-012');
  assert.equal(unlocated.latitude, null);
  assert.equal(unlocated.longitude, null);
  const missing = await request(unlocatedCustomer, 'GET', `/weather?connectionId=${unlocated.id}`);
  assert.equal(missing.status, 422);
  assert.equal(missing.body.error?.code, 'location_unavailable');
  assert.equal(upstream, count);
  const cities = await ok<WeatherLocation[]>(unlocatedCustomer, 'GET', '/weather/locations?q=Calamba');
  const city = cities[0]!;
  const searched = await ok<WeatherForecast>(unlocatedCustomer, 'GET', `/weather?latitude=${city.latitude}&longitude=${city.longitude}`);
  assert.equal(searched.daily.length, 7, 'Customer without saved coordinates can use a searched city');
  assert.deepEqual(await ok<Connection[]>(a, 'GET', '/me/connections'), before, 'Weather reads never alter saved locations');
  assert.deepEqual(await connection(unlocatedCustomer), unlocated, 'City fallback never alters missing coordinates');
});

test('weather HTTP rejects invalid input before upstream and recovers from provider rate limiting', async () => {
  const { a } = await actors();
  const count = upstream;
  for (const path of [
    '/weather', '/weather?latitude=91&longitude=0', '/weather?latitude=&longitude=0',
    '/weather?latitude=0&longitude=Infinity', '/weather?latitude=14&longitude=121&connectionId=bad',
    '/weather/locations?q=x', '/weather/locations?q=Calamba&url=http://localhost',
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

test('PSGC weather catalog enforces supplier roles and exactly preserves current canonical locality identities', async () => {
  const { a, staff, admin } = await actors();
  const count = upstream;
  assert.equal((await request(null, 'GET', '/weather/psgc-locations')).status, 401);
  assert.equal((await request(a, 'GET', '/weather/psgc-locations')).status, 403);
  const locations = await ok<WeatherPsgcLocation[]>(staff, 'GET', '/weather/psgc-locations');
  assertWeatherCatalog(locations);
  assert.deepEqual(await ok(admin, 'GET', '/weather/psgc-locations'), locations);
  assert.equal((await request(staff, 'GET', '/weather/psgc-locations?url=http://localhost')).status, 400);
  assert.equal(upstream, count, 'Static catalog never contacts weather/geocoding providers');
});

test('PSGC forecast resolves code to canonical coordinates and rejects invalid, mixed, noncity and unavailable inputs before provider', async () => {
  const { a, staff, admin } = await actors();
  const locations = await ok<WeatherPsgcLocation[]>(admin, 'GET', '/weather/psgc-locations');
  const calamba = locations.find(place => place.name === 'City of Calamba' && place.ancestry.some(part => part.name === 'Laguna'))!;
  assert.ok(calamba && calamba.latitude !== null);
  let count = upstream;
  assert.equal((await request(null, 'GET', `/weather?psgcCode=${calamba.code}`)).status, 401);
  assert.equal((await request(a, 'GET', `/weather?psgcCode=${calamba.code}`)).status, 403);
  for (const query of [
    'psgcCode=', 'psgcCode=123', 'psgcCode=0000000000', 'psgcCode=0400000000',
    'psgcCode=0403400000', 'psgcCode=0403405001', 'psgcCode=0434050000x',
    'psgcCode=0434050000',
    `psgcCode=${calamba.code}&psgcCode=${calamba.code}`,
    `psgcCode=${calamba.code}&latitude=14&longitude=121`,
    `psgcCode=${calamba.code}&connectionId=00000000-0000-4000-8000-000000000000`,
    `psgcCode=${calamba.code}&url=http://localhost`,
  ]) assert.equal((await request(staff, 'GET', `/weather?${query}`)).status, 400, query);
  assert.equal(upstream, count);
  const unavailable = locations.find(place => place.latitude === null);
  assert.ok(unavailable, 'Unmatched source records are explicit coordinate gaps');
  const missing = await request(staff, 'GET', `/weather?psgcCode=${unavailable.code}`);
  assert.equal(missing.status, 422);
  assert.equal(missing.body.error?.code, 'location_unavailable');
  assert.equal(upstream, count);
  const forecast = await ok<WeatherForecast>(staff, 'GET', `/weather?psgcCode=${calamba.code}`);
  assert.deepEqual(forecast.location, { latitude: calamba.latitude, longitude: calamba.longitude });
  assert.equal(forecast.daily.length, 7);
  if (upstream > count) assert.equal(forecastCoordinates.at(-1), `${calamba.latitude},${calamba.longitude}`);
  count = upstream;
  assert.deepEqual(await ok(admin, 'GET', `/weather?psgcCode=${calamba.code}`), forecast);
  assert.equal(upstream, count, 'Supplier code requests share the coordinate-bound forecast cache');
});
