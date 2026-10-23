import { useMemo } from 'react';
import type { MonitoringOverview } from '@aqours/contracts';
import { weatherDayLabel } from '@aqours/contracts';
import { distributionState, filterMonitoredSites } from '../utils/distribution-state';
import { MonitoringSitesTable } from './MonitoringSitesTable';
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
    <details className="distribution-map-key"><summary>Map layers and legend</summary><MonitoringMapControls style={state.style} temperature={state.temperature} bands={overview.temperatureBands.boundaries} change={change} /></details>
    <div className="map-mobile-view" role="group" aria-label="Monitoring view"><button type="button" aria-pressed={state.view === 'list'} onClick={() => change({ view: 'list' })}>List</button><button type="button" aria-pressed={state.view === 'map'} onClick={() => change({ view: 'map' })}>Map</button></div>
    <p className="hint">{items.length} sites · {unlocated} without coordinates. Sites without coordinates remain accessible in the list.</p>
    <div className="distribution-workspace" data-view={state.view}>
      <MonitoringSitesTable items={items} day={state.date} selectedId={state.siteId} onSelect={siteId => change({ siteId })} />
      <div className="distribution-map-panel"><DistributionMap items={items} day={state.date} selectedId={state.siteId} style={state.style} temperature={state.temperature} bands={overview.temperatureBands.boundaries} onSelect={siteId => change({ siteId })} /></div></div>
    {selected ? <MonitoringSiteDetail item={selected} day={state.date} refresh={refresh} /> : <p className="hint">Select a pickup site to review weather, current stock, warnings and monitoring setup.</p>}
  </>;
}
