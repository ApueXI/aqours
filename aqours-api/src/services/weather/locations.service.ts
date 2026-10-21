import type { WeatherLocation } from "@aqours/contracts";
import { z } from "zod";
import { fail } from "../../utils/errors.js";
import { WeatherCache } from "./cache.js";
import { weatherJson } from "./provider.js";

const searches = new WeatherCache<WeatherLocation[]>(24 * 3600000);
const schema = z.object({
  results: z
    .array(
      z.object({
        id: z.number().int().positive(),
        name: z.string().min(1),
        admin1: z.string().optional(),
        country: z.string().min(1),
        country_code: z.literal("PH"),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }),
    )
    .max(5)
    .optional(),
});

export function searchWeatherLocations(query: string) {
  return searches.get(query.toLocaleLowerCase("en"), async () => {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.search = new URLSearchParams({
      name: query,
      count: "5",
      language: "en",
      countryCode: "PH",
    }).toString();
    const parsed = schema.safeParse(await weatherJson(url));
    if (!parsed.success)
      fail(
        503,
        "Weather location search is temporarily unavailable.",
        "provider_unavailable",
      );
    return (parsed.data.results ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      area: item.admin1 ?? null,
      country: item.country,
      latitude: item.latitude,
      longitude: item.longitude,
    }));
  });
}
