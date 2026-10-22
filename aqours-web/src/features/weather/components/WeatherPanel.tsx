import { useState } from 'react';
import { weatherLocationLabel, type WeatherLocation } from '@aqours/contracts';
import { WeatherSearch } from './WeatherSearch';
import { WeatherForecastView } from './WeatherForecastView';

export function WeatherPanel() {
  const [location, setLocation] = useState<WeatherLocation>();
  const path = location ? `/weather?latitude=${location.latitude}&longitude=${location.longitude}` : null;
  return <section aria-label="Weather" className="weather-panel">
    <WeatherSearch onSelect={setLocation} />
    {!location && <p>Select a city to check current weather and the next seven days.</p>}
    {location && path && <WeatherForecastView key={path} path={path} location={weatherLocationLabel(location)} />}
    <p className="text-sm text-[#475569]">
      <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo</a> · City search by GeoNames.
      {' '}Forecasts are estimates. Check supplier advisories for water service updates.
    </p>
  </section>;
}
