import type { MonitoredSite } from '@aqours/contracts';
import { weatherMeasure } from '@aqours/contracts';
import { OperationsTable } from '../../../components/OperationsTable';
import { date, label } from '../../../components/Status';
import { selectedDay } from '../utils/distribution-state';

export function MonitoringSitesTable({ items, day, selectedId, onSelect }: {
  items: MonitoredSite[]; day: string; selectedId: string; onSelect: (id: string) => void;
}) {
  return <div className="distribution-site-list" aria-label="Monitored pickup sites">
    {items.length === 0 ? <p>No sites match these filters.</p> : <OperationsTable label="Monitored pickup site data">
      <table className="monitoring-sites-table"><thead><tr>
        <th scope="col">Pickup site / status</th><th scope="col" className="numeric">Daily max</th><th scope="col" className="numeric">Available (L)</th>
      </tr></thead><tbody>{items.map(item => {
        const evaluation = selectedDay(item, day);
        return <tr key={item.site.id} aria-selected={selectedId === item.site.id}>
          <th scope="row">
            <button type="button" aria-pressed={selectedId === item.site.id} onClick={() => onSelect(item.site.id)}>{item.site.name}</button>
            <div className="monitoring-status" data-status={evaluation?.status || 'unavailable'}>{label(evaluation?.status || 'unavailable')}</div>
            <div className="cell-secondary">{item.site.address}</div>
            <div className="cell-secondary">{!item.site.active ? 'Inactive · ' : ''}{!item.config?.enabled ? 'Monitoring off' : 'Monitoring on'}
              {evaluation?.incomplete ? ' · Incomplete evidence' : ''}{item.site.latitude === null || item.site.longitude === null ? ' · No coordinates' : ''}</div>
          </th>
          <td className="numeric">{weatherMeasure(evaluation?.temperature ?? null, '°C')}
            <div className="cell-secondary">{label(item.weather.status)}</div>
            <div className="cell-secondary">Forecast: {item.weather.lastSuccessAt ? date(item.weather.lastSuccessAt) : 'Unavailable'}</div>
          </td>
          <td className="numeric">{item.supply.available ? item.supply.remainingLiters : 'Unavailable'}
            <div className="cell-secondary">{item.supply.sessionCount} {item.supply.sessionCount === 1 ? 'session' : 'sessions'}</div>
            <div className="cell-secondary">Stock: {date(item.supply.observedAt)}</div>
          </td>
        </tr>;
      })}</tbody></table>
    </OperationsTable>}
  </div>;
}
