import type { Report } from '@aqours/contracts';
import type { Resource } from '../../../hooks/useResource';
import { Pagination } from '../../../components/Pagination';
import { label, ResourceState } from '../../../components/Status';
import { detailLink } from '../../../app/navigation';

export function MapReportList({ resource, rows, selectedId, returnTo, offset, search, onSearch, onOffset, onSelect }: {
  resource: Resource<Report[]>; rows: Report[]; selectedId?: string; returnTo: string;
  offset: number; onOffset: (value: number) => void;
  onSelect: (id: string) => void;
  search: string; onSearch: (value: string) => void;
}) {
  return <section className="map-report-list" aria-labelledby="map-list-heading">
    <h2 id="map-list-heading">Report list{resource.data ? ` · ${rows.length}` : ''}</h2>
    <form className="map-list-search" key={search} onSubmit={event => { event.preventDefault(); onSearch(String(new FormData(event.currentTarget).get('q') || '').trim()); }}>
      <label htmlFor="map-report-search">Find reference or issue address</label><div className="map-search-controls"><input id="map-report-search" name="q" defaultValue={search} />
      <button type="submit" aria-label="Search list and map">Search</button></div>{search && <button type="button" className="map-search-clear" onClick={() => onSearch('')}>Clear search</button>}
    </form>
    <ResourceState resource={resource}>{resource.data && <>
      {search && <p className="hint map-result-count">Matching “{search}” in the list and mapped viewport.</p>}
      {rows.length === 0 ? <p className="empty-state">No reports match this list.</p> : <div className="table-scroll responsive-table map-list-rows" tabIndex={0} role="region" aria-label="Scrollable report locations"><table>
        <thead><tr><th>Reference / status</th><th>Issue location</th></tr></thead>
        <tbody>{rows.slice(offset, offset + 30).map(item => <tr key={item.id} className={selectedId === item.id ? 'selected-report-row' : undefined} aria-selected={selectedId === item.id}>
          <td><a href={detailLink('reports', item.id, returnTo)}>{item.reference}</a>
            <span className="report-row-status">{label(item.category)} · {label(item.status)} · {label(item.priority)}</span>
            <button type="button" className="report-map-select" onClick={() => onSelect(item.id)} aria-label={`Select ${item.reference} on map`}>Select on map</button></td>
          <td data-label="Issue address">{item.address}<span className="report-row-status">{item.latitude === null || item.longitude === null ? 'No coordinates' : 'Located'}{item.locationReview ? ' · Review needed' : ''}</span></td>
        </tr>)}</tbody>
      </table></div>}
      <Pagination offset={offset} total={rows.length} onChange={onOffset} />
    </>}</ResourceState>
  </section>;
}
