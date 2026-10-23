import assert from "node:assert/strict";
import { test } from "node:test";
import {
  weatherPsgcLocations,
  weatherPsgcPoint,
} from "../src/services/weather/psgc-locations.service.js";
import { weatherQuery } from "../src/validators/weather.js";

test("PSGC weather resolver returns paired coordinates and explicit locality failures", () => {
  const catalog = weatherPsgcLocations();
  assert.equal(catalog.length, 1642);
  const calamba = catalog.find((place) => place.code === "0403405000")!;
  assert.equal(calamba.name, "City of Calamba");
  assert.deepEqual(weatherPsgcPoint(calamba.code), {
    latitude: 14.2117,
    longitude: 121.1653,
  });
  const unavailable = catalog.find((place) => place.latitude === null)!;
  assert.throws(() => weatherPsgcPoint(unavailable.code), {
    status: 422,
    code: "location_unavailable",
  });
  for (const code of ["0000000000", "0400000000", "0403400000", "0403405001"])
    assert.throws(() => weatherPsgcPoint(code), { status: 400 });
});

test("PSGC weather query accepts exactly one ten-digit code mode", () => {
  assert.deepEqual(weatherQuery.parse({ psgcCode: "0403405000" }), {
    psgcCode: "0403405000",
  });
  for (const query of [
    { psgcCode: "" },
    { psgcCode: "043405000" },
    { psgcCode: " 0403405000 " },
    { psgcCode: ["0403405000"] },
    { psgcCode: "0403405000", latitude: "14", longitude: "121" },
    { psgcCode: "0403405000", connectionId: "other" },
    { psgcCode: "0403405000", url: "https://example.test" },
  ]) assert.equal(weatherQuery.safeParse(query).success, false);
});
