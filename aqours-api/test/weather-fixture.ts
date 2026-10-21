export function weatherFixture() {
  const start = Date.parse("2026-10-21T00:00:00+08:00") / 1000;
  return {
    timezone: "Asia/Manila",
    current_units: {
      temperature_2m: "°C",
      apparent_temperature: "°C",
      relative_humidity_2m: "%",
      precipitation: "mm",
      wind_speed_10m: "km/h",
    },
    daily_units: {
      temperature_2m_min: "°C",
      temperature_2m_max: "°C",
      precipitation_sum: "mm",
      precipitation_probability_max: "%",
    },
    current: {
      time: start + 36000,
      temperature_2m: 30,
      apparent_temperature: 34,
      relative_humidity_2m: 70,
      precipitation: 0,
      wind_speed_10m: 12,
      weather_code: 3,
    },
    daily: {
      time: Array.from({ length: 7 }, (_, i) => start + i * 86400),
      temperature_2m_min: [25, 24, 25, 26, 25, 24, 25],
      temperature_2m_max: [32, 33, 32, 31, 32, 33, 32],
      precipitation_sum: [0, 1, 2, 0, 3, 4, 0],
      precipitation_probability_max: [0, 30, 60, 10, 80, 90, 0],
      weather_code: [0, 3, 61, 2, 63, 95, 0],
    },
  };
}
