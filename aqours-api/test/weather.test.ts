import assert from "node:assert/strict";
import { test } from "node:test";
import {
  weatherCondition,
  weatherDayLabel,
  weatherMeasure,
} from "@aqours/contracts";
import { WeatherCache } from "../src/services/weather/cache.js";
import { normalizeForecast } from "../src/services/weather/normalize.js";
import { weatherQuery, weatherSearchQuery } from "../src/validators/weather.js";
import { weatherFixture } from "./weather-fixture.js";

test("weather normalization preserves Manila dates, zero measurements and missing values", () => {
  const payload = weatherFixture();
  const forecast = normalizeForecast(payload, 14.6, 121);
  assert.equal(forecast.current.time, "2026-10-21T02:00:00.000Z");
  assert.equal(forecast.daily[0]!.date, "2026-10-21");
  assert.equal(forecast.daily[6]!.date, "2026-10-27");
  assert.equal(forecast.current.precipitation, 0);
  assert.equal(forecast.daily[0]!.rainProbability, 0);
  const incomplete = {
    ...payload,
    current: { time: payload.current.time },
    daily: { time: payload.daily.time },
  };
  const missing = normalizeForecast(incomplete, 14.6, 121);
  assert.equal(missing.current.temperature, null);
  assert.equal(missing.daily[0]!.rainProbability, null);
  assert.equal(weatherMeasure(0, "mm"), "0 mm");
  assert.equal(weatherMeasure(null, "%"), "Unavailable");
  assert.equal(weatherCondition(95), "Thunderstorm");
  assert.equal(weatherCondition(1234), "Conditions unavailable");
  assert.equal(weatherCondition(null), "Conditions unavailable");
  assert.match(weatherDayLabel("2026-10-21"), /Oct 21/);
});

test("weather rejects malformed series, units, measurements and ambiguous query locations", () => {
  const payload = weatherFixture();
  for (const invalid of [
    {},
    { ...payload, timezone: "UTC" },
    {
      ...payload,
      current_units: { ...payload.current_units, temperature_2m: "°F" },
    },
    { ...payload, current: { ...payload.current, relative_humidity_2m: 101 } },
    { ...payload, daily: { ...payload.daily, time: [1, 1, 1, 1, 1, 1, 1] } },
    { ...payload, daily: { ...payload.daily, precipitation_sum: ["rain"] } },
  ])
    assert.throws(() => normalizeForecast(invalid, 14.6, 121), { status: 503 });
  for (const query of [
    {},
    { latitude: "", longitude: "0" },
    { latitude: "91", longitude: "0" },
    { latitude: "14", longitude: "NaN" },
    { latitude: ["14"], longitude: "121" },
    { latitude: "14", longitude: "121", connectionId: "bad" },
    { latitude: "14", longitude: "121", url: "http://example.test" },
  ])
    assert.equal(weatherQuery.safeParse(query).success, false);
  assert.deepEqual(weatherQuery.parse({ latitude: "0", longitude: "0" }), {
    latitude: 0,
    longitude: 0,
  });
  assert.equal(weatherSearchQuery.safeParse({ q: " " }).success, false);
  assert.equal(weatherSearchQuery.parse({ q: " Manila " }).q, "Manila");
});

test("weather cache deduplicates concurrent loads, expires, evicts and never caches failure", async () => {
  const cache = new WeatherCache<number>(1000, 2);
  let loads = 0;
  const load = async () => ++loads;
  assert.deepEqual(
    await Promise.all([cache.get("a", load), cache.get("a", load)]),
    [1, 1],
  );
  assert.equal(await cache.get("a", load), 1);
  const clock = Date.now;
  try {
    Date.now = () => clock() + 1001;
    assert.equal(await cache.get("a", load), 2);
    await cache.get("b", load);
    await cache.get("c", load);
    assert.equal(await cache.get("a", load), 5);
    await assert.rejects(
      cache.get("error", async () => {
        throw new Error("upstream");
      }),
    );
    assert.equal(await cache.get("error", load), 6);
  } finally {
    Date.now = clock;
  }
});

test("weather cache bounds distinct pending loads while allowing identical requests", async () => {
  const cache = new WeatherCache<number>(1000, 1);
  let finish!: (value: number) => void;
  const promise = new Promise<number>((resolve) => {
    finish = resolve;
  });
  const first = cache.get("a", () => promise);
  const duplicate = cache.get("a", () => promise);
  await assert.rejects(
    cache.get("b", async () => 2),
    { status: 503 },
  );
  finish(1);
  assert.deepEqual(await Promise.all([first, duplicate]), [1, 1]);
});
