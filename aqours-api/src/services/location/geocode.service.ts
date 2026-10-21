import type { StructuredAddressInput } from "@aqours/contracts";
import { addressSnapshot, formatAddress } from "./psgc-catalog.service.js";
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../../config/environment.js";
import { fail } from "../../utils/errors.js";
export function signCandidate(
  address: string,
  latitude: number,
  longitude: number,
  structuredAddress?: StructuredAddressInput | null,
) {
  if (!config.geocodeSecret)
    fail(
      503,
      "Geocoding unavailable; enter an address for review",
      "provider_unavailable",
    );
  const body = Buffer.from(
    JSON.stringify({
      address,
      latitude,
      longitude,
      structuredAddress: structuredAddress
        ? addressContext(structuredAddress)
        : null,
      expires: Date.now() + 900000,
    }),
  ).toString("base64url");
  return (
    body +
    "." +
    createHmac("sha256", config.geocodeSecret).update(body).digest("base64url")
  );
}
export function verifyCandidate(location: Record<string, any>) {
  if (!config.geocodeSecret || typeof location.candidateToken !== "string")
    fail(400, "Confirm a current geocoding candidate");
  const [body, signature, extra] = location.candidateToken.split(".");
  if (!body || !signature || extra !== undefined)
    fail(400, "Invalid geocoding candidate");
  const actual = createHmac("sha256", config.geocodeSecret)
    .update(body)
    .digest();
  const supplied = Buffer.from(signature, "base64url");
  if (actual.length !== supplied.length || !timingSafeEqual(actual, supplied))
    fail(400, "Invalid geocoding candidate");
  let value;
  try {
    value = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    fail(400, "Invalid geocoding candidate");
  }
  if (
    value.expires < Date.now() ||
    value.address !== location.address ||
    value.latitude !== location.latitude ||
    value.longitude !== location.longitude ||
    JSON.stringify(value.structuredAddress ?? null) !==
      JSON.stringify(
        location.structuredAddress
          ? addressContext(location.structuredAddress)
          : null,
      )
  )
    fail(400, "Candidate expired or location changed");
}
function addressContext(input: StructuredAddressInput) {
  const snapshot = addressSnapshot(input);
  return {
    barangayCode: snapshot.barangayCode,
    streetDetails: snapshot.streetDetails,
  };
}
export async function geocode(
  address: string,
  structuredAddress?: StructuredAddressInput | null,
) {
  if (structuredAddress)
    address = formatAddress(addressSnapshot(structuredAddress));
  if (!config.geocodeKey || !config.geocodeSecret)
    fail(
      503,
      "Geocoding unavailable; enter an address for review",
      "provider_unavailable",
    );
  const params = new URLSearchParams({
    text: address,
    apiKey: config.geocodeKey,
    format: "json",
    limit: "5",
  });
  if (config.geocodeBias) params.set("bias", config.geocodeBias);
  if (config.geocodeFilter) params.set("filter", config.geocodeFilter);
  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?${params}`,
      {
        signal: AbortSignal.timeout(config.geocodeTimeoutMs),
      },
    );
    if (!response.ok) throw new Error("upstream");
    const payload = (await response.json()) as {
      results?: Record<string, any>[];
    };
    if (!Array.isArray(payload.results)) throw new Error("invalid upstream");
    return payload.results
      .filter(
        (v) =>
          typeof v.formatted === "string" &&
          Number.isFinite(v.lat) &&
          Number.isFinite(v.lon) &&
          Math.abs(v.lat) <= 90 &&
          Math.abs(v.lon) <= 180,
      )
      .map((v) => ({
        address: v.formatted,
        latitude: v.lat,
        longitude: v.lon,
        confidence:
          typeof v.rank?.confidence === "number" ? v.rank.confidence : null,
        candidateToken: signCandidate(
          v.formatted,
          v.lat,
          v.lon,
          structuredAddress,
        ),
      }));
  } catch {
    fail(
      503,
      "Geocoding unavailable; enter an address for review",
      "provider_unavailable",
    );
  }
}
