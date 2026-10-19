import { test } from "node:test";
import assert from "node:assert/strict";

import { hashPassword, verifyPassword, digest } from "../src/utils/password.js";
import {
  coordinates,
  geometry,
  liters,
  totalLiters,
} from "../src/validators/common.js";
import { version } from "../src/repositories/domain.repository.js";
import { matches, isCurrent } from "../src/services/advisories/advisory-context.service.js";
test("scrypt uses independent salts and rejects incorrect credentials", () => {
  const a = hashPassword("FictionalTestPassword!"),
    b = hashPassword("FictionalTestPassword!");
  assert.notEqual(a, b);
  assert.equal(verifyPassword("FictionalTestPassword!", a), true);
  assert.equal(verifyPassword("wrong", a), false);
  assert.equal(verifyPassword("anything", "invalid"), false);
  assert.equal(digest("opaque token").length, 64);
});
test("coordinates reject half-pairs, nonfinite values and range errors", () => {
  assert.doesNotThrow(() => coordinates({ latitude: null, longitude: null }));
  assert.doesNotThrow(() => coordinates({ latitude: 14.5, longitude: 121.1 }));
  for (const value of [
    { latitude: 10 },
    { latitude: 91, longitude: 1 },
    { latitude: 0, longitude: Infinity },
    { latitude: "0", longitude: 0 },
  ])
    assert.throws(() => coordinates(value));
});
test("exact-liter inputs reject exponents, excess scale, negatives and over-limit stock", () => {
  for (const value of ["0.01", "1", "1000000000.00"])
    assert.equal(liters.safeParse(value).success, true);
  for (const value of ["0", "-1", "1e3", "0.001", "1000000000.01"])
    assert.equal(liters.safeParse(value).success, false);
  assert.equal(totalLiters.safeParse("0.00").success, true);
});
test("geometry requires WGS84 closed polygon rings", () => {
  assert.equal(
    geometry.safeParse({
      type: "Polygon",
      coordinates: [
        [
          [121, 14],
          [122, 14],
          [122, 15],
          [121, 14],
        ],
      ],
    }).success,
    true,
  );
  assert.equal(
    geometry.safeParse({
      type: "Polygon",
      coordinates: [
        [
          [121, 14],
          [122, 14],
          [122, 15],
          [120, 14],
        ],
      ],
    }).success,
    false,
  );
});
test("optimistic versions reject stale state and missing versions", () => {
  assert.doesNotThrow(() => version({ id: "test", version: 2 }, 2));
  assert.throws(() => version({ id: "test", version: 2 }, 1));
  assert.throws(() => version({ id: "test", version: 2 }, undefined));
});
test("quality notices require explicit lifting and zone matching requires confirmation", () => {
  const advisory = {
    id: "a",
    version: 1,
    kind: "do_not_use",
    state: "published",
    endsAt: "2000-01-01T00:00:00.000Z",
    zoneIds: ["z"],
    connectionIds: [],
  };
  assert.equal(isCurrent(advisory), true);
  assert.equal(isCurrent({ ...advisory, state: "lifted" }), false);
  assert.equal(
    matches(advisory, {
      id: "c",
      version: 1,
      zoneId: "z",
      zoneConfirmed: false,
    }),
    false,
  );
  assert.equal(
    matches(advisory, {
      id: "c",
      version: 1,
      zoneId: "z",
      zoneConfirmed: true,
    }),
    true,
  );
});
