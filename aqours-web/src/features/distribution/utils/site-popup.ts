import type { MonitoredSite } from '@aqours/contracts';
import { weatherCondition, weatherMeasure } from '@aqours/contracts';
import { date, label } from '../../../components/Status';
import { selectedDay } from './distribution-state';
import { warningLabel } from './warning-label';

export function sitePopup(item: MonitoredSite, day: string) {
  const root = document.createElement('div'), evaluation = selectedDay(item, day), forecast = item.weather.forecast;
  const daily = forecast?.daily.find(entry => entry.date === day);
  const warnings = item.warnings.filter(warning => warning.forecastDate === day || warning.family === 'supply');
  const heading = document.createElement('strong'); heading.textContent = item.site.name; root.append(heading);
  const lines = [item.site.address, `${item.site.active ? 'Active' : 'Inactive'} · ${item.config?.enabled ? 'Monitoring enabled' : 'Monitoring not enabled'}`,
    `${label(evaluation?.status || 'unavailable')}${evaluation?.incomplete ? ' · incomplete evidence' : ''} · ${day} (Manila)`,
    `Daily maximum: ${weatherMeasure(evaluation?.temperature ?? null, '°C')} · Forecast ${item.weather.status}`,
    `Selected-day minimum: ${weatherMeasure(daily?.temperatureMin ?? null, '°C')} · Precipitation ${weatherMeasure(daily?.precipitation ?? null, 'mm')}`,
    `Current weather: ${forecast ? `${weatherMeasure(forecast.current.temperature, '°C')} · ${weatherCondition(forecast.current.weatherCode)} · ${date(forecast.current.time)}` : 'Unavailable'}`,
    `Current humidity: ${weatherMeasure(forecast?.current.humidity ?? null, '%')} · Precipitation ${weatherMeasure(forecast?.current.precipitation ?? null, 'mm')}`,
    `Last successful forecast: ${date(item.weather.lastSuccessAt)}`,
    `Available for reservation now: ${item.supply.available ? `${item.supply.remainingLiters} L` : 'Unavailable'}`,
    `Total ${item.supply.totalLiters} L · Reserved ${item.supply.reservedLiters} L · Collected ${item.supply.collectedLiters} L`,
    `${item.supply.sessionCount} eligible sessions · Supply observed ${date(item.supply.observedAt)}`,
    `Planning capacity: ${item.config?.capacityLiters ? `${item.config.capacityLiters} L · ${item.supply.capacityPercentage === null ? 'Ratio unavailable' : `${item.supply.capacityPercentage.toFixed(1)}%`}` : 'Not configured'}`,
    `Active warnings: ${warnings.map(warning => `${warningLabel(warning.type)} (${warning.severity}, ${warning.forecastDate}${warning.family === 'supply' ? ', current supply' : ''})`).join('; ') || 'None recorded'}`,
    item.site.instructions];
  for (const text of lines) { const paragraph = document.createElement('p'); paragraph.textContent = text; root.append(paragraph); }
  return root;
}
