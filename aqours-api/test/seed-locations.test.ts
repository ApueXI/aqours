import assert from "node:assert/strict";
import { test } from "node:test";
import {
  lagunaPlaces,
  seedConnectionLocation,
  seedSiteLocation,
  seedZone,
  seedVersion,
} from "../src/scripts/seed-locations.js";
import {
  addressSnapshot,
  formatAddress,
} from "../src/services/location/psgc-catalog.service.js";
import { assertDemoSeedAllowed } from "../src/scripts/seed-safety.js";

test("Laguna fixtures use canonical bundled PSGC ancestry and fictional street details", () => {
  assert.equal(seedVersion, "aqours-demo-laguna-v2");
  for (const location of [
    ...Array.from({ length: 12 }, (_, n) => seedConnectionLocation(n)),
    seedSiteLocation(0),
    seedSiteLocation(1),
  ]) {
    const snapshot = location.structuredAddress!;
    assert.equal(snapshot.datasetVersion, "PSGC-2Q-2026");
    assert.match(snapshot.streetDetails, /Fictional/);
    assert.equal(snapshot.ancestry[0]!.code, "0400000000");
    assert.equal(snapshot.ancestry[1]!.code, "0403400000");
    assert.equal(snapshot.ancestry[1]!.name, "Laguna");
    assert.deepEqual(
      snapshot,
      addressSnapshot({
        barangayCode: snapshot.barangayCode,
        streetDetails: snapshot.streetDetails,
      }),
    );
    assert.equal(location.address, formatAddress(snapshot));
    assert.ok(!("latitude" in snapshot));
  }
  assert.deepEqual(
    lagunaPlaces.map((v) => v.barangayCode),
    ["0403405001", "0403411004", "0403428002"],
  );
});
test("synthetic Laguna rectangles contain all corresponding located fixtures", () => {
  assert.deepEqual(
    lagunaPlaces.map((v) => v.name),
    ["Demo Calamba", "Demo Los Baños", "Demo Santa Rosa"],
  );
  for (let n = 0; n < 12; n++) {
    const zone = seedZone(n % 3),
      location = seedConnectionLocation(n);
    const ring = zone.boundary.coordinates[0]!;
    assert.deepEqual(ring[0], ring.at(-1));
    if (n === 11) {
      assert.equal(location.latitude, null);
      assert.equal(location.longitude, null);
      continue;
    }
    const lon = location.longitude!,
      lat = location.latitude!;
    assert.ok(lon > ring[0]![0]! && lon < ring[2]![0]!);
    assert.ok(lat > ring[0]![1]! && lat < ring[2]![1]!);
    assert.ok(lat > 14 && lat < 14.4 && lon > 121 && lon < 121.4);
  }
  for (let n = 0; n < 2; n++) {
    assert.equal(seedSiteLocation(n).latitude, lagunaPlaces[n]!.latitude);
    assert.equal(seedSiteLocation(n).longitude, lagunaPlaces[n]!.longitude);
  }
});
test("demo seed requires explicit opt-in and always rejects production", () => {
  assert.doesNotThrow(() => assertDemoSeedAllowed("test", "1"));
  assert.doesNotThrow(() => assertDemoSeedAllowed("development", "1"));
  for (const [environment, enabled] of [
    ["production", "1"],
    ["production", "0"],
    ["test", "0"],
    ["test", ""],
  ])
    assert.throws(
      () => assertDemoSeedAllowed(environment, enabled),
      /SEED_DEMO=1/,
    );
});
