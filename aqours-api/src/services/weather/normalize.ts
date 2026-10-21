import type { WeatherForecast } from "@aqours/contracts";
import { z } from "zod";
import { fail } from "../../utils/errors.js";

const measurement = z.number().finite().nullish();
const nonnegative = z.number().finite().min(0).nullish();
const percentage = z.number().min(0).max(100).nullish();
const code = z.number().int().min(0).nullish();
const series = (schema: z.ZodType) => z.array(schema).max(7).optional();
const epoch = z.number().int().min(0).max(253402300799);
const schema = z.object({
  timezone: z.literal("Asia/Manila"),
  current_units: z.object({
    temperature_2m: z.literal("°C"),
    apparent_temperature: z.literal("°C"),
    relative_humidity_2m: z.literal("%"),
    precipitation: z.literal("mm"),
    wind_speed_10m: z.literal("km/h"),
  }),
  daily_units: z.object({
    temperature_2m_min: z.literal("°C"),
    temperature_2m_max: z.literal("°C"),
    precipitation_sum: z.literal("mm"),
    precipitation_probability_max: z.literal("%"),
  }),
  current: z.object({
    time: epoch,
    temperature_2m: measurement,
    apparent_temperature: measurement,
    relative_humidity_2m: percentage,
    precipitation: nonnegative,
    wind_speed_10m: nonnegative,
    weather_code: code,
  }),
  daily: z.object({
    time: z
      .array(epoch)
      .length(7)
      .refine((times) =>
        times.every((time, i) => i === 0 || time - times[i - 1]! === 86400),
      ),
    temperature_2m_min: series(measurement),
    temperature_2m_max: series(measurement),
    precipitation_sum: series(nonnegative),
    precipitation_probability_max: series(percentage),
    weather_code: series(code),
  }),
});

export function normalizeForecast(
  payload: unknown,
  latitude: number,
  longitude: number,
): WeatherForecast {
  const parsed = schema.safeParse(payload);
  if (!parsed.success)
    fail(
      503,
      "Weather provider returned incomplete data. Try again shortly.",
      "provider_unavailable",
    );
  const { current, daily } = parsed.data;
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const value = (values: unknown[] | undefined, i: number): number | null =>
    typeof values?.[i] === "number" ? (values[i] as number) : null;
  return {
    location: { latitude, longitude },
    timezone: "Asia/Manila",
    fetchedAt: new Date().toISOString(),
    units: {
      temperature: "°C",
      precipitation: "mm",
      windSpeed: "km/h",
      probability: "%",
    },
    attribution: {
      name: "Weather data by Open-Meteo",
      url: "https://open-meteo.com/",
    },
    current: {
      time: new Date(current.time * 1000).toISOString(),
      temperature: current.temperature_2m ?? null,
      feelsLike: current.apparent_temperature ?? null,
      humidity: current.relative_humidity_2m ?? null,
      precipitation: current.precipitation ?? null,
      windSpeed: current.wind_speed_10m ?? null,
      weatherCode: current.weather_code ?? null,
    },
    daily: daily.time.map((time, i) => ({
      date: day.format(new Date(time * 1000)),
      weatherCode: value(daily.weather_code, i),
      temperatureMin: value(daily.temperature_2m_min, i),
      temperatureMax: value(daily.temperature_2m_max, i),
      precipitation: value(daily.precipitation_sum, i),
      rainProbability: value(daily.precipitation_probability_max, i),
    })),
  };
}
