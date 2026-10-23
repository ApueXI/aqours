import { useMemo, useState } from 'react';
import type { WeatherPsgcLocation } from '@aqours/contracts';
import { ResourceState } from '../../../components/Status';
import { useResource } from '../../../hooks/useResource';
import { hasWeatherPoint, localityPart, psgcWeatherLabel, weatherLocalities } from '../utils/psgc-hierarchy';
import { WeatherLocationFilters } from './WeatherLocationFilters';
import { WeatherLocalityMap } from './WeatherLocalityMap';
import { WeatherForecastView } from './WeatherForecastView';
import '../weather.css';

const emptyLocations: WeatherPsgcLocation[] = [];

export function WeatherPanel() {
  const resource = useResource<WeatherPsgcLocation[]>('/weather/psgc-locations');
  const locations = resource.data ?? emptyLocations;
  const [region, setRegion] = useState(''), [province, setProvince] = useState(''), [selected, setSelected] = useState('');
  const filtered = useMemo(() => weatherLocalities(locations, region, province), [locations, region, province]);
  const location = locations.find(location => location.code === selected);
  const available = locations.filter(hasWeatherPoint).length;
  const select = (code: string) => {
    const next = locations.find(location => location.code === code);
    setSelected(next?.code ?? '');
    if (next) { setRegion(localityPart(next, 'region')?.code ?? ''); setProvince(localityPart(next, 'province')?.code ?? ''); }
  };
  return <section aria-label="Weather" className="weather-panel">
    <ResourceState resource={resource} />
    {resource.data && resource.data.length === 0 && <p role="status">No weather localities are available.</p>}
    {locations.length > 0 && <>
      <WeatherLocationFilters locations={locations} region={region} province={province} selected={selected}
        onRegion={code => { setRegion(code); setProvince(''); setSelected(''); }}
        onProvince={code => { setProvince(code); setSelected(''); }} onSelect={select} />
      <p className="weather-coverage">{available.toLocaleString()} of {locations.length.toLocaleString()} localities have approximate weather points.
        {' '}Unavailable localities remain selectable and have no marker. Points represent localities, not water-service boundaries.</p>
    </>}
    <div className="weather-workspace">
      <WeatherLocalityMap locations={filtered} scope={province || region} selected={selected} onSelect={select}
        onReset={() => { setRegion(''); setProvince(''); setSelected(''); }} />
      <div className="weather-forecast-panel">
        {!location && <p>Select a city or municipality on the map or in the selectors to check current weather and the next seven days.</p>}
        {location && !hasWeatherPoint(location) && <div role="status"><h2>{psgcWeatherLabel(location)}</h2>
          <p>Weather coordinates are unavailable for this locality. Select another city or municipality.</p></div>}
        {location && hasWeatherPoint(location) && <WeatherForecastView key={location.code}
          path={`/weather?psgcCode=${location.code}`} location={psgcWeatherLabel(location)} />}
      </div>
    </div>
    <p className="text-sm text-[#475569]">
      <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo</a> · Locality points derived from{' '}
      <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a> through{' '}
      <a href="https://github.com/kon2raya24/ph-geo" target="_blank" rel="noreferrer">ph-geo</a> ({' '}
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>), reconciled to PSGC Q2 2026.
      {' '}Forecasts are estimates. Check supplier advisories for water service updates.
    </p>
  </section>;
}
