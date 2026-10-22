import { useMemo } from 'react';
import type { MonitoringOverview } from '@aqours/contracts';
import { weatherDayLabel, weatherMeasure } from '@aqours/contracts';
import { label } from '../../../components/Status';
import { distributionState, filterMonitoredSites, selectedDay } from '../utils/distribution-state';
import { DistributionMap } from './DistributionMap';
import { MonitoringSiteDetail } from './MonitoringSiteDetail';
import { MonitoringMapControls } from './MonitoringMapControls';

export function MonitoringWorkspace({ overview, params, change, refresh }: {
  overview: MonitoringOverview; params: URLSearchParams; change: (values: Record<string, string>) => void; refresh: () => void;
}) {
  const state = distributionState(params, overview.dates);
  const items = useMemo(() => filterMonitoredSites(overview.sites, state.date, state.status, state.q), [overview.sites, state.date, state.status, state.q]);
  const selected = overview.sites.find(item => item.site.id === state.siteId);
  const unlocated = items.filter(item => item.site.latitude === null || item.site.longitude === null).length;
  return <><h2>Distribution monitoring</h2><p className="hint">Seven forecast dates in Asia/Manila. Supply remains current for every selected date. Monitoring status comes from the server.</p>
    <div className="distribution-timeline" role="group" aria-label="Forecast date">{overview.dates.map(day => <button key={day} type="button" aria-pressed={state.date === day} onClick={() => change({ date: day })}>{weatherDayLabel(day)}</button>)}</div>
    <MonitoringMapControls style={state.style} temperature={state.temperature} bands={overview.temperatureBands.boundaries} change={change} />
    <div className="map-mobile-view" role="group" aria-label="Monitoring view"><button type="button" aria-pressed={state.view === 'list'} onClick={() => change({ view: 'list' })}>List</button><button type="button" aria-pressed={state.view === 'map'} onClick={() => change({ view: 'map' })}>Map</button></div>
    <p className="hint">{items.length} sites · {unlocated} without coordinates. Sites without coordinates remain accessible in the list.</p>
    <div className="distribution-workspace" data-view={state.view}><div className="distribution-site-list" aria-label="Monitored pickup sites">
      {items.length === 0 && <p>No sites match these filters.</p>}
      {items.map(item => { const evaluation = selectedDay(item, state.date); return <article className="distribution-site-row" data-selected={state.siteId === item.site.id} key={item.site.id}>
        <button type="button" aria-pressed={state.siteId === item.site.id} onClick={() => change({ siteId: item.site.id })}>{item.site.name}</button>
        <p className="monitoring-status" data-status={evaluation?.status || 'unavailable'}>{label(evaluation?.status || 'unavailable')}{evaluation?.incomplete ? ' · incomplete evidence' : ''}</p>
        <p>{item.site.address}</p><p>Daily max {weatherMeasure(evaluation?.temperature ?? null, '°C')} · Forecast {item.weather.status}</p>
        <p>Available now: {item.supply.available ? `${item.supply.remainingLiters} L` : 'Unavailable'} · {item.supply.sessionCount} sessions</p>
        <p className="hint">{!item.site.active ? 'Inactive site · ' : ''}{!item.config?.enabled ? 'Monitoring not enabled · ' : ''}{item.site.latitude === null || item.site.longitude === null ? 'Coordinates missing' : 'Saved coordinates'}</p>
      </article>; })}
    </div><div className="distribution-map-panel"><DistributionMap items={items} day={state.date} selectedId={state.siteId} style={state.style} temperature={state.temperature} bands={overview.temperatureBands.boundaries} onSelect={siteId => change({ siteId })} /></div></div>
    {selected ? <MonitoringSiteDetail item={selected} day={state.date} refresh={refresh} /> : <p className="hint">Select a pickup site to review weather, current stock, warnings and monitoring setup.</p>}
  </>;
}
