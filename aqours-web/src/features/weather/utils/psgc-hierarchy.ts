import type { PsgcPart, WeatherPsgcLocation } from '@aqours/contracts';

export function localityPart(location: WeatherPsgcLocation, level: 'region' | 'province') {
  return location.ancestry.find(part => part.level === level);
}

export function weatherLocationParts(locations: WeatherPsgcLocation[], level: 'region' | 'province') {
  const parts = new Map<string, PsgcPart>();
  for (const location of locations) {
    const part = localityPart(location, level);
    if (part) parts.set(part.code, part);
  }
  return [...parts.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function weatherLocalities(locations: WeatherPsgcLocation[], region: string, province: string) {
  return locations.filter(location => (!region || localityPart(location, 'region')?.code === region) &&
    (!province || localityPart(location, 'province')?.code === province));
}

export function psgcWeatherLabel(location: WeatherPsgcLocation) {
  return [...location.ancestry].reverse().map(part => part.name.trim()).join(', ');
}

export function hasWeatherPoint(location: WeatherPsgcLocation): location is WeatherPsgcLocation & { latitude: number; longitude: number } {
  return location.latitude !== null && location.longitude !== null;
}
