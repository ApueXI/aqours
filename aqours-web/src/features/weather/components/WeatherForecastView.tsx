import type { WeatherForecast } from '@aqours/contracts';
import { weatherCondition, weatherDayLabel, weatherMeasure } from '@aqours/contracts';
import { date, ResourceState } from '../../../components/Status';
import { useResource } from '../../../hooks/useResource';

export function WeatherForecastView({ path, location }: { path: string; location: string }) {
  const resource = useResource<WeatherForecast>(path);
  const forecast = resource.data;
  const current = forecast?.current;
  return <div aria-live="polite">
    <div className="flex items-center flex-wrap gap-3 mt-4">
      <h2 className="mr-auto">{location}</h2>
      <button type="button" disabled={resource.loading} onClick={() => void resource.refresh()}>Refresh weather</button>
    </div>
    <ResourceState resource={resource}>
      {resource.loading && forecast && <p>Refreshing. Previously retrieved weather is shown below.</p>}
      {forecast && current && <>
        <p><strong>{weatherMeasure(current.temperature, '°C')}</strong> · {weatherCondition(current.weatherCode)}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
          <dt>Feels like</dt><dd>{weatherMeasure(current.feelsLike, '°C')}</dd>
          <dt>Humidity</dt><dd>{weatherMeasure(current.humidity, '%')}</dd>
          <dt>Precipitation</dt><dd>{weatherMeasure(current.precipitation, 'mm')}</dd>
          <dt>Wind</dt><dd>{weatherMeasure(current.windSpeed, 'km/h')}</dd>
        </dl>
        <p className="text-sm text-[#475569]">Current model estimate: {date(current.time)} · Retrieved {date(forecast.fetchedAt)} · Asia/Manila</p>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Seven-day weather forecast">
          <table>
            <caption className="text-left font-semibold py-3">Seven-day forecast</caption>
            <thead><tr><th scope="col">Day</th><th scope="col">Conditions</th><th scope="col">Low / high</th><th scope="col">Precipitation</th><th scope="col">Rain chance</th></tr></thead>
            <tbody>{forecast.daily.map(day => <tr key={day.date}>
              <th scope="row">{weatherDayLabel(day.date)}</th><td>{weatherCondition(day.weatherCode)}</td>
              <td>{weatherMeasure(day.temperatureMin, '°C')} / {weatherMeasure(day.temperatureMax, '°C')}</td>
              <td>{weatherMeasure(day.precipitation, 'mm')}</td><td>{weatherMeasure(day.rainProbability, '%')}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </>}
    </ResourceState>
  </div>;
}
