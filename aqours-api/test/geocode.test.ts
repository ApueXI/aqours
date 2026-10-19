import { test } from "node:test";
import assert from "node:assert/strict";
import { config } from "../src/config/environment.js";
import {
  geocode,
  signCandidate,
  verifyCandidate,
} from "../src/services/location/geocode.service.js";
test("disabled geocoder fails honestly and candidates bind address, point and expiry", async () => {
  const previous = { key: config.geocodeKey, secret: config.geocodeSecret };
  try {
    config.geocodeKey = undefined;
    config.geocodeSecret = undefined;
    await assert.rejects(() => geocode("Fictional location"), { status: 503 });
    config.geocodeSecret = "fictional-unit-test-signing-material";
    const point = {
      address: "Fictional confirmed address",
      latitude: 14.6,
      longitude: 121.0,
    };
    const candidateToken = signCandidate(
      point.address,
      point.latitude,
      point.longitude,
    );
    assert.doesNotThrow(() => verifyCandidate({ ...point, candidateToken }));
    assert.throws(() =>
      verifyCandidate({ ...point, longitude: 122.0, candidateToken }),
    );
    assert.throws(() =>
      verifyCandidate({ ...point, address: "Changed address", candidateToken }),
    );
    assert.throws(() =>
      verifyCandidate({ ...point, candidateToken: candidateToken + "x" }),
    );
    assert.throws(() =>
      verifyCandidate({ ...point, candidateToken: candidateToken + ".extra" }),
    );
    const clock = Date.now;
    try {
      Date.now = () => clock() - 16 * 60000;
      const expired = signCandidate(
        point.address,
        point.latitude,
        point.longitude,
      );
      Date.now = clock;
      assert.throws(() =>
        verifyCandidate({ ...point, candidateToken: expired }),
      );
    } finally {
      Date.now = clock;
    }
  } finally {
    config.geocodeKey = previous.key;
    config.geocodeSecret = previous.secret;
  }
});
test("provider adapter preserves real confidence/coordinates and converts transport failures to503", async () => {
  const previous = {
    fetch: globalThis.fetch,
    key: config.geocodeKey,
    secret: config.geocodeSecret,
    bias: config.geocodeBias,
    filter: config.geocodeFilter,
  };
  try {
    config.geocodeKey = "fictional-provider-test-key";
    config.geocodeSecret = "fictional-unit-test-signing-material";
    config.geocodeBias = "proximity:121,14.6";
    config.geocodeFilter = "countrycode:ph";
    globalThis.fetch = async (input, options) => {
      const url = new URL(String(input));
      assert.equal(url.hostname, "api.geoapify.com");
      assert.equal(url.searchParams.get("bias"), "proximity:121,14.6");
      assert.equal(url.searchParams.get("filter"), "countrycode:ph");
      assert.equal(url.searchParams.get("apiKey"), config.geocodeKey);
      assert.ok(options?.signal instanceof AbortSignal);
      return new Response(
        JSON.stringify({
          results: [
            {
              formatted: "Fictional provider candidate",
              lat: 14.6,
              lon: 121.0,
              rank: { confidence: 0.75 },
            },
            { formatted: "Missing point" },
          ],
        }),
        { status: 200 },
      );
    };
    const candidates = await geocode("Fictional query");
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0]!.confidence, 0.75);
    assert.equal(candidates[0]!.latitude, 14.6);
    assert.equal(candidates[0]!.longitude, 121);
    assert.doesNotThrow(() => verifyCandidate(candidates[0]!));
    config.geocodeBias = "";
    config.geocodeFilter = "";
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      assert.equal(url.searchParams.has("filter"), false);
      assert.equal(url.searchParams.has("bias"), false);
      return new Response(JSON.stringify({ results: [] }));
    };
    assert.deepEqual(await geocode("Fictional query"), []);
    globalThis.fetch = async () => {
      throw new Error("Synthetic provider unavailable");
    };
    await assert.rejects(() => geocode("Fictional query"), { status: 503 });
    globalThis.fetch = async () => new Response("unavailable", { status: 429 });
    await assert.rejects(() => geocode("Fictional query"), { status: 503 });
  } finally {
    globalThis.fetch = previous.fetch;
    config.geocodeKey = previous.key;
    config.geocodeSecret = previous.secret;
    config.geocodeBias = previous.bias;
    config.geocodeFilter = previous.filter;
  }
});
