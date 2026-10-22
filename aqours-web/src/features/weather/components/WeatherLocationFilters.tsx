import type { WeatherPsgcLocation } from '@aqours/contracts';
import { weatherLocationParts, weatherLocalities } from '../utils/psgc-hierarchy';
import { WeatherLocationSelect } from './WeatherLocationSelect';

export function WeatherLocationFilters({ locations, region, province, selected, onRegion, onProvince, onSelect }: {
  locations: WeatherPsgcLocation[]; region: string; province: string; selected: string;
  onRegion: (code: string) => void; onProvince: (code: string) => void; onSelect: (code: string) => void;
}) {
  const regional = weatherLocalities(locations, region, '');
  const provinces = region ? weatherLocationParts(regional, 'province') : [];
  const localities = region ? weatherLocalities(regional, region, province).sort((a, b) => a.name.localeCompare(b.name)) : [];
  const needsProvince = provinces.length > 0;
  return <fieldset className="weather-location-filters">
    <legend>Choose a weather locality</legend>
    <div className="weather-location-levels">
      <WeatherLocationSelect label="Region" searchLabel="Search regions" options={weatherLocationParts(locations, 'region')}
        value={region} onChange={onRegion} placeholder="Select a region" />
      <WeatherLocationSelect key={region || 'province'} label="Province" searchLabel="Search provinces" options={provinces}
        value={province} onChange={onProvince} disabled={!region || !needsProvince}
        placeholder={region && !needsProvince ? 'No province for this region' : 'Select a province'} />
      <WeatherLocationSelect key={`${region}:${province}`} label="City / Municipality" searchLabel="Search cities / municipalities"
        options={localities.map(location => ({ code: location.code, name: `${location.name.trim()}${location.latitude === null ? ' · Weather unavailable' : ''}` }))}
        value={selected} onChange={onSelect} disabled={!region || (needsProvince && !province)} placeholder="Select a city or municipality" />
    </div>
  </fieldset>;
}
