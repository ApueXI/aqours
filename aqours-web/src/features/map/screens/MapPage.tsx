import { useEffect, useMemo, useRef, useState } from 'react';
import type { Advisory, MapResponse, Report, StaffIncident } from '@aqours/contracts';
import { query } from '../../../services/http-client';
import { useResource } from '../../../hooks/useResource';
import { useAllRecords } from '../../../hooks/useAllRecords';
import { useReferences } from '../../../hooks/useReferences';
import { FilterBar } from '../../../components/Filters';
import { label, PageTitle, ResourceState } from '../../../components/Status';
import { MapCanvas, type Bounds } from '../components/MapCanvas';
import { MapReportList } from '../components/MapReportList';
import { MapLegend } from '../components/MapLegend';
import { reportCategories } from '../utils/report-categories';
import { areaFeatures } from '../utils/layers';
import { mapFilters, mapLocation } from '../utils/map-state';
import { defaultMapBounds } from '../utils/default-view';
import { detailLink } from '../../../app/navigation';

export function MapPage({ params }: { params: URLSearchParams }) {
  const filters = mapFilters(params);
  const selectedId = params.get('selected') || undefined;
  const urlUnlocated = params.get('unlocated') === '1';
  const [unlocated, setUnlocated] = useState(urlUnlocated);
  useEffect(() => setUnlocated(urlUnlocated), [urlUnlocated]);
  const view = params.get('view') === 'map' ? 'map' : 'list';
  const [bounds, setBounds] = useState<Bounds>(defaultMapBounds);
  const [offset, setOffset] = useState(0);
  const [focusKey, setFocusKey] = useState(0);
  const summary = useRef<HTMLElement>(null);
  const refs = useReferences();
  const incidents = useAllRecords<StaffIncident>('/staff/incidents');
  const advisories = useAllRecords<Advisory>('/staff/advisories');
  const reports = useResource<MapResponse>(`/staff/map/reports${query({ ...filters, ...bounds, limit: 1000 })}`);
  const list = useAllRecords<Report>(`/staff/reports${query(filters)}`);
  const areas = useMemo(() => areaFeatures(refs.zones.data || [], incidents.data || [], advisories.data || []), [refs.zones.data, incidents.data, advisories.data]);
  const rows = (list.data || []).filter(item => !unlocated || item.latitude === null || item.longitude === null);
  const selected = list.data?.find(item => item.id === selectedId);
  useEffect(() => {
    if (selected && view === 'map' && window.matchMedia('(max-width: 850px)').matches) summary.current?.focus({ preventScroll: true });
  }, [selected?.id, view, focusKey]);
  const returnTo = mapLocation(filters, { selected: selectedId, view, unlocated });
  const navigate = (changes: { selected?: string; view?: string; unlocated?: boolean }) => {
    window.location.hash = mapLocation(filters, { selected: selectedId, view, unlocated, ...changes });
  };
  const select = (id: string) => { setFocusKey(value => value + 1); navigate({ selected: id, view: 'map' }); };
  const open = (id: string) => { window.location.hash = detailLink('reports', id, returnTo); };
  const refresh = () => { void reports.refresh(); void list.refresh(); void incidents.refresh(); void advisories.refresh(); };

  return <><PageTitle title="Report map"><a href={`#/reports${query(filters)}`}>Open inbox with filters</a><button onClick={refresh}>Refresh</button></PageTitle>
    <FilterBar values={filters} zones={refs.zones.data} owners={refs.users.data} priority onChange={next => {
      window.location.hash = mapLocation(next, { view, unlocated }); setOffset(0);
    }} />
    <ResourceState resource={reports}>{reports.data && <p>{reports.data.features.length} mapped of {reports.data.total} matching reports in the viewport · {reports.data.unlocatedCount} unlocated reports across the selected filters</p>}
      {reports.data?.truncated && <p className="notice">Results are capped at {reports.data.limit} markers. Zoom in or narrow filters to inspect all locations.</p>}
      {reports.data?.features.length === 0 && <p>No mapped reports in this viewport. This does not establish normal supply or safe water.</p>}
    </ResourceState>
    <div className="map-mobile-view" aria-label="Report view">
      <button type="button" aria-pressed={view === 'list'} onClick={() => navigate({ view: 'list' })}>List</button>
      <button type="button" aria-pressed={view === 'map'} onClick={() => navigate({ view: 'map' })}>Map</button>
    </div>
    <div className="map-workspace" data-view={view}>
      <MapReportList resource={list} rows={rows} selectedId={selectedId} returnTo={returnTo} unlocated={unlocated} offset={offset}
        onUnlocated={value => { setUnlocated(value); navigate({ unlocated: value }); setOffset(0); }} onOffset={setOffset} onSelect={select} />
      <section className="map-map-panel" aria-label="Map and selected report">
        <MapCanvas reports={reports.data} areas={areas} selected={selected} focusKey={focusKey} onBounds={setBounds} onSelect={select} onOpen={open} />
        <MapLegend />
        {selected ? <section ref={summary} tabIndex={-1} className="map-selection" aria-label="Selected report">
          <h2>{selected.reference}</h2><p>{reportCategories[selected.category].label} · {label(selected.status)} · {label(selected.priority)} priority</p>
          <p>{selected.address}</p><p>{selected.latitude === null || selected.longitude === null ? 'No coordinates. Review the recorded address in report details.' : 'Selected report location'}{selected.locationReview ? ' · Location review needed' : ''}</p>
          <div className="map-selection-actions"><a href={detailLink('reports', selected.id, returnTo)}>Open full report</a><button type="button" onClick={() => navigate({ selected: undefined })}>Clear selection</button></div>
        </section> : <p className="map-selection">Select a report from the list or a map marker to review its location and status.</p>}
        <p className="map-legend">Clusters change with zoom. They do not confirm incidents, shared supply, severity, or outage boundaries. Select overlapping reports by expanding their cluster. Published demonstration shapes retain their label when selected.</p>
      </section>
    </div>
    <ResourceState resource={refs.zones} /><ResourceState resource={incidents} /><ResourceState resource={advisories} />
  </>;
}
