import { useEffect, useState } from 'react';
import type { MonitoringWarning, MonitoringWarningHistory } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { Pagination } from '../../../components/Pagination';
import { date, label, ResourceState } from '../../../components/Status';
import { query } from '../../../services/http-client';
import { warningLabel } from '../utils/warning-label';

function WarningDetail({ id }: { id: string }) {
  const detail = useResource<{ warning: MonitoringWarning; history: MonitoringWarningHistory[] }>(`/staff/distribution/warnings/${id}`);
  useEffect(() => { const timer = window.setInterval(() => void detail.refresh(), 30000); return () => window.clearInterval(timer); }, [detail.refresh]);
  return <ResourceState resource={detail}>{detail.data && <section aria-label="Warning details"><h3>{detail.data.warning.siteName} · {warningLabel(detail.data.warning.type)}</h3>
    <p>{label(detail.data.warning.state)} · {label(detail.data.warning.severity)} · Forecast date {detail.data.warning.forecastDate}</p>
    <p>{detail.data.warning.closedReason}</p><ol className="history">{detail.data.history.map(event => <li key={event.id}>
      <strong>{label(event.action)} · {label(event.state)} · {label(event.severity)}</strong><p>{date(event.createdAt)} · revision {event.revision}</p>
      <p>Daily maximum {event.evidence.temperature ?? 'Unavailable'} °C · Available {event.evidence.availableLiters ?? 'Unavailable'} L</p>
      <p>Thresholds: temperature warning {event.evidence.warningTemperature ?? 'Unset'} / critical {event.evidence.criticalTemperature ?? 'Unset'} °C; supply low {event.evidence.lowSupplyLiters ?? 'Unset'} / critical {event.evidence.criticalSupplyLiters ?? 'Unset'} L</p>
      <p className="hint">Configuration v{event.evidence.configVersion} · Forecast {date(event.evidence.forecastUpdatedAt)} · Supply {date(event.evidence.supplyObservedAt)}</p>{event.reason && <p>{event.reason}</p>}
    </li>)}</ol>
  </section>}</ResourceState>;
}
export function warningHistoryDate(value: string | null, forecastDay: string): string | undefined {
  if (value === 'all') return undefined;
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const instant = new Date(`${value}T00:00:00Z`);
    if (Number.isFinite(instant.getTime()) && instant.toISOString().slice(0, 10) === value) return value;
  }
  return forecastDay;
}
export function MonitoringWarnings({ siteId, day, onDateChange }: {
  siteId: string; day: string | undefined; onDateChange: (value: string) => void;
}) {
  const [state, setState] = useState(''), [offset, setOffset] = useState(0), [selected, setSelected] = useState('');
  useEffect(() => { setOffset(0); setSelected(''); }, [day]);
  const warnings = useResource<MonitoringWarning[]>(`/staff/distribution/warnings${query({ siteId, date: day, state, offset })}`);
  useEffect(() => { const timer = window.setInterval(() => void warnings.refresh(), 30000); return () => window.clearInterval(timer); }, [warnings.refresh]);
  return <section><h2>Warning history</h2><p className="hint">Warning lifecycle and evidence are retained. Resolved, expired and suspended records remain distinct.</p>
    <div className="filters"><label className="field"><span>Warning date (Manila)</span>
      <input key={day || 'all'} type="date" aria-label="Warning date (Manila)" defaultValue={day || ''} onChange={event => onDateChange(event.target.value || 'all')} />
    </label><button type="button" onClick={() => onDateChange('all')}>All warning dates</button>
      <p className="hint">{day ? `Warnings for ${day}. Choose any date to inspect retained history.` : 'Showing all warning dates, including expired past warnings.'}</p>
    </div>
    <label className="field"><span>Warning state</span><select aria-label="Warning state" value={state} onChange={event => { setState(event.target.value); setOffset(0); }}>
      <option value="">All states</option>{['active', 'resolved', 'expired', 'suspended'].map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
    <ResourceState resource={warnings}>{warnings.data && <>{warnings.data.length === 0 && <p>No warnings for these filters.</p>}
      <div className="table-scroll responsive-table"><table><thead><tr><th>Site / forecast date</th><th>Warning</th><th>Severity</th><th>State</th><th>Updated (Manila)</th><th>Details</th></tr></thead>
        <tbody>{warnings.data.map(warning => <tr key={warning.id}><td>{warning.siteName}<br />{warning.forecastDate}</td><td data-label="Warning">{warningLabel(warning.type)}</td><td data-label="Severity">{label(warning.severity)}</td><td data-label="State">{label(warning.state)}</td><td data-label="Updated (Manila)">{date(warning.updatedAt)}</td>
          <td><button type="button" aria-label={`Warning history for ${warning.siteName}`} onClick={() => setSelected(warning.id)}>View history</button></td></tr>)}</tbody></table></div>
      <Pagination offset={offset} total={warnings.result?.page?.total ?? warnings.data.length} onChange={setOffset} />
    </>}</ResourceState>{selected && <WarningDetail key={selected} id={selected} />}
  </section>;
}
