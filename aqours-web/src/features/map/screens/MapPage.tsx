import { useMemo, useState } from 'react';
import type { Advisory, MapResponse, Report, StaffIncident } from '@aqours/contracts';
import { query } from '../../../services/http-client';
import { useResource } from '../../../hooks/useResource';
import { useAllRecords } from '../../../hooks/useAllRecords';
import { useReferences } from '../../../hooks/useReferences';
import { FilterBar } from '../../../components/Filters';
import { Pagination } from '../../../components/Pagination';
import { label, PageTitle, ResourceState } from '../../../components/Status';
import { MapCanvas, type Bounds } from '../components/MapCanvas';
import { areaFeatures } from '../utils/layers';
import { detailLink } from '../../../app/navigation';

export function MapPage({ params }: { params: URLSearchParams }) {
  const [filters, setFilters] = useState<Record<string, string>>(() => Object.fromEntries(params));
  const [bounds, setBounds] = useState<Bounds>({ west: 120.9, south: 14.5, east: 121.1, north: 14.7 });
  const [unlocated, setUnlocated] = useState(false);
  const [offset, setOffset] = useState(0);
  const refs = useReferences();
  const incidents = useAllRecords<StaffIncident>('/staff/incidents');
  const advisories = useAllRecords<Advisory>('/staff/advisories');
  const reports = useResource<MapResponse>(`/staff/map/reports${query({ ...filters, ...bounds, limit: 1000 })}`);
  const list = useAllRecords<Report>(`/staff/reports${query(filters)}`);
  const areas = useMemo(() => areaFeatures(refs.zones.data || [], incidents.data || [], advisories.data || []), [refs.zones.data, incidents.data, advisories.data]);
  const rows = (list.data || []).filter(item => !unlocated || item.latitude === null || item.longitude === null);
  const refresh = () => { void reports.refresh(); void list.refresh(); void incidents.refresh(); void advisories.refresh(); };
  return <><PageTitle title="Report map"><a href={`#/reports${query(filters)}`}>Open inbox with filters</a><button onClick={refresh}>Refresh</button></PageTitle>
    <FilterBar values={filters} zones={refs.zones.data} onChange={next => { setFilters(next); setOffset(0); }} />
    <p className="hint text-[#475569] text-[13px]">Normal reports: teal · High priority: amber · Urgent: red. Service zones: gray · Published incident areas: teal · Official advisory areas: amber. Select a report to review it.</p>
    <ResourceState resource={reports}>{reports.data && <p>{reports.data.features.length} mapped of {reports.data.total} matching reports in the viewport · {reports.data.unlocatedCount} unlocated reports across the selected filters</p>}
      {reports.data?.truncated && <p className="notice [border-left:3px_solid] [padding:10px_12px] [margin:12px_0] text-[#854d0e] bg-[#fffbeb] [border-color:#b45309]">Results are capped at {reports.data.limit} markers. Zoom in or narrow filters to inspect all locations.</p>}
      {reports.data?.features.length === 0 && <p>No mapped reports in this viewport. This does not establish normal supply or safe water.</p>}
    </ResourceState>
    <MapCanvas reports={reports.data} areas={areas} onBounds={setBounds} onSelect={id => { window.location.hash = detailLink('reports', id, `/map${query(filters)}`); }} />
    <p className="hint text-[#475569] text-[13px]">Clusters change with zoom. They do not confirm incidents, shared supply, severity, or outage boundaries. Published demonstration shapes retain their label when selected.</p>
    <ResourceState resource={refs.zones} /><ResourceState resource={incidents} /><ResourceState resource={advisories} />
    <section><h2>Report list</h2><label className="check-field flex items-center flex-wrap gap-[8px] mb-[16px] [&_>_.hint]:basis-[100%]"><input type="checkbox" checked={unlocated} onChange={event => { setUnlocated(event.target.checked); setOffset(0); }} />Show only reports without coordinates</label>
      <ResourceState resource={list}>{list.data && <>
        {rows.length === 0 ? <p>No reports match this list.</p> : <div className="table-scroll w-full overflow-x-auto"><table><thead><tr><th>Reference</th><th>Category / status</th><th>Issue address</th><th>Location</th></tr></thead><tbody>
          {rows.slice(offset, offset + 30).map(item => <tr key={item.id}><td><a href={detailLink('reports', item.id, `/map${query(filters)}`)}>{item.reference}</a></td><td>{label(item.category)} · {label(item.status)}</td><td>{item.address}</td><td>{item.latitude === null ? 'No coordinates' : 'Located'}{item.locationReview ? ' · Review needed' : ''}</td></tr>)}
        </tbody></table></div>}
        <Pagination offset={offset} total={rows.length} onChange={setOffset} />
      </>}</ResourceState>
    </section>
  </>;
}
