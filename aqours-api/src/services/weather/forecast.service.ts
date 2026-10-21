import type { WeatherForecast } from "@aqours/contracts";
import { WeatherCache } from "./cache.js";
import { weatherJson } from "./provider.js";
import { normalizeForecast } from "./normalize.js";

const forecasts = new WeatherCache<WeatherForecast>(10 * 60000);

export function getForecast(latitude: number, longitude: number) {
  return forecasts.get(`${latitude},${longitude}`, async () => {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      timezone: "Asia/Manila",
      timeformat: "unixtime",
      forecast_days: "7",
      temperature_unit: "celsius",
      wind_speed_unit: "kmh",
      precipitation_unit: "mm",
      current:
        "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
    }).toString();
    return normalizeForecast(await weatherJson(url), latitude, longitude);
  });
}
