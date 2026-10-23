import { readFileSync } from "node:fs";
import path from "node:path";
import type { WeatherPsgcLocation } from "@aqours/contracts";
import { localities } from "../location/psgc-catalog.service.js";
import { fail } from "../../utils/errors.js";

type Coordinate = { code: string; latitude: number | null; longitude: number | null };
let catalog: Map<string, WeatherPsgcLocation> | undefined;
function locations() {
  if (catalog) return catalog;
  const filename = path.resolve(import.meta.dirname, "../../../../psgc-address-data/weather/coordinates.json");
  const data = JSON.parse(readFileSync(filename, "utf8")) as { coordinates: Coordinate[] };
  const coordinates = new Map<string, Coordinate>();
  for (const point of data.coordinates) {
    const pairedNull = point.latitude === null && point.longitude === null;
    const located = typeof point.latitude === "number" && Number.isFinite(point.latitude) &&
      point.latitude >= 4 && point.latitude <= 22 && typeof point.longitude === "number" &&
      Number.isFinite(point.longitude) && point.longitude >= 116 && point.longitude <= 127;
    if (!/^\d{10}$/.test(point.code) || coordinates.has(point.code) || (!pairedNull && !located)) {
      throw new Error("Invalid weather coordinate catalog");
    }
    coordinates.set(point.code, point);
  }
  catalog = new Map(localities().map(({ place, ancestry }) => {
    const point = coordinates.get(place.code);
    return [place.code, { code: place.code, name: place.name,
      level: place.level as WeatherPsgcLocation["level"], ancestry,
      latitude: point?.latitude ?? null, longitude: point?.longitude ?? null }];
  }));
  if ([...coordinates.keys()].some((code) => !catalog!.has(code)))
    throw new Error("Weather coordinates reference an unknown locality");
  return catalog;
}
export function weatherPsgcLocations(): WeatherPsgcLocation[] {
  return [...locations().values()];
}
export function weatherPsgcPoint(code: string) {
  const locality = locations().get(code);
  if (!locality) fail(400, "Select a valid PSGC city or municipality");
  if (locality.latitude === null || locality.longitude === null)
    fail(422, "Weather coordinates are unavailable for this locality. Select another city or municipality.", "location_unavailable");
  return { latitude: locality.latitude, longitude: locality.longitude };
}
