import type { Report } from '@aqours/contracts';
import type { Resource } from '../../../hooks/useResource';
import { Pagination } from '../../../components/Pagination';
import { label, ResourceState } from '../../../components/Status';
import { detailLink } from '../../../app/navigation';

export function MapReportList({ resource, rows, selectedId, returnTo, unlocated, offset, onUnlocated, onOffset, onSelect }: {
  resource: Resource<Report[]>; rows: Report[]; selectedId?: string; returnTo: string;
  unlocated: boolean; offset: number; onUnlocated: (value: boolean) => void; onOffset: (value: number) => void;
  onSelect: (id: string) => void;
}) {
  return <section className="map-report-list" aria-labelledby="map-list-heading">
    <h2 id="map-list-heading">Report list</h2>
    <label className="check-field"><input type="checkbox" checked={unlocated} onChange={event => onUnlocated(event.target.checked)} />Show only reports without coordinates</label>
    <ResourceState resource={resource}>{resource.data && <>
      {rows.length === 0 ? <p className="empty-state">No reports match this list.</p> : <div className="table-scroll"><table>
        <thead><tr><th>Reference / status</th><th>Issue location</th></tr></thead>
        <tbody>{rows.slice(offset, offset + 30).map(item => <tr key={item.id} className={selectedId === item.id ? 'selected-report-row' : undefined} aria-selected={selectedId === item.id}>
          <td><a href={detailLink('reports', item.id, returnTo)}>{item.reference}</a>
            <span className="report-row-status">{label(item.category)} · {label(item.status)} · {label(item.priority)}</span>
            <button type="button" className="report-map-select" onClick={() => onSelect(item.id)} aria-label={`Select ${item.reference} on map`}>Select on map</button></td>
          <td>{item.address}<span className="report-row-status">{item.latitude === null || item.longitude === null ? 'No coordinates' : 'Located'}{item.locationReview ? ' · Review needed' : ''}</span></td>
        </tr>)}</tbody>
      </table></div>}
      <Pagination offset={offset} total={rows.length} onChange={onOffset} />
    </>}</ResourceState>
  </section>;
}
