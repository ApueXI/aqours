import assert from "node:assert/strict";
import { test } from "node:test";
import { getForecast } from "../src/services/weather/forecast.service.js";
import { searchWeatherLocations } from "../src/services/weather/locations.service.js";
import { weatherJson } from "../src/services/weather/provider.js";
import { weatherFixture } from "./weather-fixture.js";

test("weather adapters request only fixed Open-Meteo hosts and normalize Philippine city results", async () => {
  const original = globalThis.fetch;
  let forecasts = 0;
  let searches = 0;
  try {
    globalThis.fetch = async (input, options) => {
      assert.ok(options?.signal instanceof AbortSignal);
      const url = new URL(String(input));
      if (url.hostname === "api.open-meteo.com") {
        forecasts++;
        assert.equal(url.searchParams.get("forecast_days"), "7");
        assert.equal(url.searchParams.get("timeformat"), "unixtime");
        assert.equal(url.searchParams.get("timezone"), "Asia/Manila");
        assert.equal(url.searchParams.get("wind_speed_unit"), "kmh");
        assert.equal(url.searchParams.get("apikey"), null);
        return Response.json(weatherFixture());
      }
      searches++;
      assert.equal(url.hostname, "geocoding-api.open-meteo.com");
      assert.equal(url.searchParams.get("countryCode"), "PH");
      assert.equal(url.searchParams.get("count"), "5");
      return Response.json({
        results: [
          {
            id: 1701668,
            name: "Manila",
            admin1: "Metro Manila",
            country: "Philippines",
            country_code: "PH",
            latitude: 14.6,
            longitude: 121,
          },
        ],
      });
    };
    const results = await Promise.all([
      getForecast(14.612345, 121.1),
      getForecast(14.612345, 121.1),
    ]);
    assert.equal(forecasts, 1);
    assert.equal(results[0].daily.length, 7);
    const cities = await searchWeatherLocations("Manila adapter fixture");
    assert.equal(cities[0]!.area, "Metro Manila");
    assert.equal(cities[0]!.latitude, 14.6);
    await searchWeatherLocations("MANILA ADAPTER FIXTURE");
    assert.equal(searches, 1);
  } finally {
    globalThis.fetch = original;
  }
});

test("weather transport reports timeouts, provider limits and malformed JSON as retryable unavailability", async () => {
  const original = globalThis.fetch;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  try {
    for (const failure of [
      async () => {
        throw new DOMException("Timed out", "TimeoutError");
      },
      async () => new Response("Limited", { status: 429 }),
      async () => new Response("Broken", { status: 500 }),
      async () => new Response("not json"),
    ]) {
      globalThis.fetch = failure;
      await assert.rejects(weatherJson(url), {
        status: 503,
        code: "provider_unavailable",
      });
    }
    globalThis.fetch = async () =>
      Response.json({ results: [{ id: 1, name: "Invalid point" }] });
    await assert.rejects(searchWeatherLocations("invalid city fixture"), {
      status: 503,
    });
    globalThis.fetch = async () => Response.json({ results: [] });
    assert.deepEqual(await searchWeatherLocations("invalid city fixture"), []);
    globalThis.fetch = async () => Response.json({});
    assert.deepEqual(
      await searchWeatherLocations("no matching city fixture"),
      [],
    );
    await assert.rejects(getForecast(14.69876, 121.1), { status: 503 });
  } finally {
    globalThis.fetch = original;
  }
});
