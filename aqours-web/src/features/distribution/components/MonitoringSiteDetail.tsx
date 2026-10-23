import type { MonitoredSite } from '@aqours/contracts';
import { weatherCondition, weatherDayLabel, weatherMeasure } from '@aqours/contracts';
import { ActionForm } from '../../../components/ActionForm';
import { date, Demo, label } from '../../../components/Status';
import { selectedDay } from '../utils/distribution-state';
import { MonitoringConfigForm } from './MonitoringConfigForm';
import { warningLabel } from '../utils/warning-label';

export function MonitoringSiteDetail({ item, day, refresh }: { item: MonitoredSite; day: string; refresh: () => void }) {
  const evaluation = selectedDay(item, day), forecast = item.weather.forecast;
  const daily = forecast?.daily.find(entry => entry.date === day);
  const warnings = item.warnings.filter(warning => warning.forecastDate === day || warning.family === 'supply');
  return <section className="monitoring-selection" aria-label="Selected pickup site"><h2>{item.site.name}</h2><Demo value={item.site.demo} />
    <p>{item.site.address}</p><p>{item.site.active ? 'Active site' : 'Inactive site'} · {item.config?.enabled ? 'Monitoring enabled' : 'Monitoring not enabled'}</p>
    <p className="monitoring-status" data-status={evaluation?.status || 'unavailable'}>{label(evaluation?.status || 'unavailable')}{evaluation?.incomplete ? ' · incomplete evidence' : ''}</p>
    <dl className="facts"><dt>Forecast date (Manila)</dt><dd>{weatherDayLabel(day)}</dd>
      <dt>Daily maximum temperature</dt><dd>{weatherMeasure(evaluation?.temperature ?? null, '°C')} · {item.weather.status}</dd>
      <dt>Selected-day minimum / precipitation</dt><dd>{weatherMeasure(daily?.temperatureMin ?? null, '°C')} / {weatherMeasure(daily?.precipitation ?? null, 'mm')}</dd>
      <dt>Current weather</dt><dd>{forecast ? `${weatherMeasure(forecast.current.temperature, '°C')} · ${weatherCondition(forecast.current.weatherCode)} · ${date(forecast.current.time)}` : 'Unavailable'}</dd>
      <dt>Current humidity / precipitation</dt><dd>{weatherMeasure(forecast?.current.humidity ?? null, '%')} / {weatherMeasure(forecast?.current.precipitation ?? null, 'mm')}</dd>
      <dt>Last successful forecast</dt><dd>{date(item.weather.lastSuccessAt)}</dd><dt>Last forecast attempt</dt><dd>{date(item.weather.lastAttemptAt)}</dd>
      <dt>Next scheduled refresh</dt><dd>{date(item.weather.nextRefreshAt)}</dd>
      <dt>Available for reservation now</dt><dd>{item.supply.available ? `${item.supply.remainingLiters} L` : 'Unavailable · no eligible pickup session'}</dd>
      <dt>Current session stock</dt><dd>{item.supply.sessionCount} eligible sessions · Total {item.supply.totalLiters} L · Reserved {item.supply.reservedLiters} L · Collected {item.supply.collectedLiters} L</dd>
      <dt>Supply observed</dt><dd>{date(item.supply.observedAt)}</dd><dt>Planning capacity</dt><dd>{item.config?.capacityLiters ? `${item.config.capacityLiters} L · ${item.supply.capacityPercentage === null ? 'Ratio unavailable' : `${item.supply.capacityPercentage.toFixed(1)}% available`}` : 'Not configured'}</dd>
    </dl>
    <p className="hint">Supply is current across open, unexpired sessions, including future pickup sessions. Selecting another forecast date never projects liters. Capacity is a planning ratio and may exceed 100%.</p>
    {item.weather.status !== 'fresh' && <p className="notice">Forecast {item.weather.status}. Retained weather is historical evidence; unavailable weather is never a normal temperature result. Supply remains independent.</p>}
    {item.weather.error && <p className="notice">{item.weather.error}</p>}
    <h3>Active warnings for selected date / current supply</h3>{warnings.length ? <ul>{warnings.map(warning => <li key={warning.id}>{warningLabel(warning.type)} · {label(warning.severity)} · {warning.forecastDate}{warning.family === 'supply' ? ' · Current supply' : ''}</li>)}</ul> : <p>No active warning records. Check completeness before interpreting this as normal.</p>}
    <p className="preserve">{item.site.instructions}</p>
    {forecast && <p className="hint">Forecast: <a href={forecast.attribution.url} target="_blank" rel="noreferrer">{forecast.attribution.name}</a>. Site forecast points only; no regional interpolation.</p>}
    <ActionForm path={`/staff/pickup-sites/${item.site.id}/forecast/refresh`} fields={[]} submit="Queue site forecast refresh" onDone={refresh} />
    <MonitoringConfigForm item={item} refresh={refresh} />
  </section>;
}
