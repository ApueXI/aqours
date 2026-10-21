export interface WeatherLocation {
  id: number;
  name: string;
  area: string | null;
  country: string;
  latitude: number;
  longitude: number;
}

export interface WeatherCurrent {
  time: string;
  weatherCode: number | null;
  temperature: number | null;
  feelsLike: number | null;
  humidity: number | null;
  precipitation: number | null;
  windSpeed: number | null;
}

export interface WeatherDay {
  date: string;
  weatherCode: number | null;
  temperatureMin: number | null;
  temperatureMax: number | null;
  precipitation: number | null;
  rainProbability: number | null;
}

export interface WeatherForecast {
  location: { latitude: number; longitude: number };
  timezone: 'Asia/Manila';
  fetchedAt: string;
  current: WeatherCurrent;
  daily: WeatherDay[];
  units: { temperature: '°C'; precipitation: 'mm'; windSpeed: 'km/h'; probability: '%' };
  attribution: { name: string; url: string };
}

const conditions: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  66: 'Light freezing rain', 67: 'Heavy freezing rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

export function weatherCondition(code: number | null): string {
  return code === null ? 'Conditions unavailable' : conditions[code] ?? 'Conditions unavailable';
}

export function weatherMeasure(value: number | null, unit: string): string {
  return value === null ? 'Unavailable' : `${Number(value.toFixed(1))}${unit === '%' || unit === '°C' ? '' : ' '}${unit}`;
}

export function weatherDayLabel(date: string): string {
  return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric' })
    .format(new Date(`${date}T00:00:00+08:00`));
}

export function weatherLocationLabel(location: WeatherLocation): string {
  return [location.name, location.area, location.country].filter(Boolean).join(', ');
}
