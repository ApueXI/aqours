import assert from "node:assert/strict";
import { test } from "node:test";
import {
  regions,
  children,
  addressSnapshot,
  addressFields,
  formatAddress,
} from "../src/services/location/psgc-catalog.service.js";
import {
  signCandidate,
  verifyCandidate,
  geocode,
} from "../src/services/location/geocode.service.js";
import { config } from "../src/config/environment.js";
import { structuredAddress } from "../src/validators/structured-address.js";

test("PSGC catalog preserves all codes and real hierarchy exceptions", () => {
  const seen = new Set<string>(),
    counts: Record<string, number> = {};
  function walk(code: string, level: string) {
    assert.match(code, /^\d{10}$/);
    assert.ok(!seen.has(code));
    seen.add(code);
    counts[level] = (counts[level] || 0) + 1;
    for (const child of children(code)) walk(child.code, child.level);
  }
  const roots = regions();
  for (const root of roots) walk(root.code, root.level);
  assert.deepEqual(counts, {
    region: 18,
    city: 149,
    barangay: 42010,
    sub_municipality: 14,
    municipality: 1493,
    province: 82,
  });
  assert.ok(roots.some((root) => root.code.startsWith("01")));
  const ncr = children("1300000000");
  assert.ok(ncr.some((place) => place.level === "city"));
  const manila = ncr.find((place) => place.name.includes("Manila"))!;
  assert.ok(
    children(manila.code).some((place) => place.level === "sub_municipality"),
  );
  assert.throws(() => children("0000000000"));
});
test("PSGC snapshots resolve canonical ancestry, distinguish duplicate names, and never infer coordinates", () => {
  const one = addressSnapshot({
    barangayCode: "1380100001",
    streetDetails: "  Demo street  ",
  });
  const two = addressSnapshot({
    barangayCode: "1380100002",
    streetDetails: "",
  });
  assert.equal(one.streetDetails, "Demo street");
  assert.equal(one.datasetVersion, "PSGC-2Q-2026");
  assert.deepEqual(
    one.ancestry.map((part) => part.level),
    ["region", "city", "barangay"],
  );
  assert.match(formatAddress(one), /City of Caloocan/);
  assert.ok(!("latitude" in one));
  assert.notDeepEqual(one.ancestry, two.ancestry);
  const duplicate = children("1300000000")
    .filter((place) => place.level === "city" && place.code !== "1380100000")
    .flatMap((place) => children(place.code))
    .find((place) => place.name === one.ancestry.at(-1)!.name);
  assert.ok(duplicate);
  const sameName = addressSnapshot({
    barangayCode: duplicate.code,
    streetDetails: "Demo",
  });
  assert.notEqual(sameName.barangayCode, one.barangayCode);
  assert.notDeepEqual(sameName.ancestry, one.ancestry);

  assert.throws(() =>
    addressSnapshot({ barangayCode: "1300000000", streetDetails: "" }),
  );
  assert.throws(() =>
    structuredAddress.parse({ barangayCode: 1380100001, streetDetails: "" }),
  );
  assert.throws(() =>
    structuredAddress.parse({
      barangayCode: "1380100001",
      streetDetails: "",
      name: "Spoof",
    }),
  );
});
test("text corrections clear obsolete selections while untouched and saved snapshots remain intact", () => {
  const snapshot = addressSnapshot({
    barangayCode: "1380100001",
    streetDetails: "Demo",
  });
  const previous = {
    address: formatAddress(snapshot),
    structuredAddress: snapshot,
  };
  assert.deepEqual(addressFields({}, previous), previous);
  assert.deepEqual(addressFields({ address: "Corrected text" }, previous), {
    address: "Corrected text",
    structuredAddress: null,
  });
  assert.equal(
    addressFields({ structuredAddress: null }, previous).structuredAddress,
    null,
  );
});
test("geocoding uses canonical PSGC context and signatures reject altered selections", async () => {
  const original = {
    fetch: globalThis.fetch,
    key: config.geocodeKey,
    secret: config.geocodeSecret,
  };
  try {
    config.geocodeKey = "fictional-test-key";
    config.geocodeSecret = "fictional-psgc-test-signature";
    const input = { barangayCode: "1380100001", streetDetails: "Demo road" };
    globalThis.fetch = async (url) => {
      assert.equal(
        new URL(String(url)).searchParams.get("text"),
        formatAddress(addressSnapshot(input)),
      );
      return new Response(
        JSON.stringify({
          results: [
            { formatted: "Provider matched address", lat: 14.6, lon: 121 },
          ],
        }),
      );
    };
    const [candidate] = await geocode("Ignored spoofed hierarchy", input);
    assert.ok(candidate);
    assert.doesNotThrow(() =>
      verifyCandidate({ ...candidate, structuredAddress: input }),
    );
    assert.throws(() =>
      verifyCandidate({
        ...candidate,
        structuredAddress: { ...input, barangayCode: "1380100002" },
      }),
    );
    assert.throws(() =>
      verifyCandidate({
        ...candidate,
        structuredAddress: { ...input, streetDetails: "Changed road" },
      }),
    );
    assert.throws(() => verifyCandidate(candidate));
    const plain = { address: "Free text", latitude: 14.6, longitude: 121 };
    assert.doesNotThrow(() =>
      verifyCandidate({
        ...plain,
        candidateToken: signCandidate(
          plain.address,
          plain.latitude,
          plain.longitude,
        ),
      }),
    );
  } finally {
    globalThis.fetch = original.fetch;
    config.geocodeKey = original.key;
    config.geocodeSecret = original.secret;
  }
});
