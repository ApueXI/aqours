import { styleClasses } from '../../../utils/style-classes';
import type { Report } from '@aqours/contracts';
import { query } from '../../../services/http-client';
import { useReferences } from '../../../hooks/useReferences';
import { useResource } from '../../../hooks/useResource';
import { useQueueFilters } from '../../../hooks/useQueueFilters';
import { FilterBar } from '../../../components/Filters';
import { Pagination } from '../../../components/Pagination';
import { detailLink } from '../../../app/navigation';
import { date, EmptyState, label, PageTitle, ResourceState, StatusLabel } from '../../../components/Status';

export function Reports({ params }: { params: URLSearchParams }) {
  const { filters, offset, setFilters, setOffset } = useQueueFilters('reports', params);
  const refs = useReferences();
  const resource = useResource<Report[]>(`/staff/reports${query({ ...filters, offset })}`);
  return <><PageTitle title="Report inbox"><a href={`#/map${query(filters)}`}>View on map</a><button onClick={() => void resource.refresh()}>Refresh inbox</button></PageTitle>
    <p className="page-description">Review customer reports, confirm issue locations, and coordinate a response.</p>
    <FilterBar values={filters} zones={refs.zones.data} owners={refs.users.data} priority onChange={setFilters} />
    <ResourceState resource={resource}>{resource.data && <>
      <div className="queue-heading"><p>{resource.result?.page?.total ?? resource.data.length} reports · Submitted times in Asia/Manila</p></div>
      {resource.data.length === 0 ? <EmptyState title="No reports match these filters."><p>Try another category, status, or date range to find a report.</p></EmptyState> : <div className="table-scroll" tabIndex={0} role="region" aria-label="Report inbox results"><table className="report-inbox-table">
        <thead><tr><th>Reference / category</th><th>Submitted / noticed</th><th>Status / priority</th><th>Owner</th><th>Issue location</th></tr></thead>
        <tbody>{resource.data.map(report => <tr key={report.id}>
          <td><a href={detailLink('reports', report.id, `/reports${query({ ...filters, ...(offset ? { offset } : {}) })}`)}>{report.reference}</a><div>{label(report.category)}</div></td>
          <td>{date(report.submittedAt)}<div className="hint">Noticed {date(report.noticedAt)}</div></td>
          <td><StatusLabel value={report.status} /><div className={report.priority === 'normal' ? 'hint' : 'warning-text'}>{label(report.priority)}{report.closureOutcome ? ` · ${label(report.closureOutcome)}` : ''}</div></td>
          <td>{refs.users.data?.find(user => user.id === report.ownerId)?.name || (report.ownerId ? 'Assigned staff' : 'Unassigned')}</td>
          <td>{report.address}<div className={styleClasses(report.locationReview ? 'warning-text' : 'hint')}>
            {report.latitude === null ? 'Unlocated · ' : ''}{report.locationReview ? 'Location review needed' : 'Location reviewed'}
            {!report.zoneConfirmed ? ' · Zone unconfirmed' : ''}
          </div></td>
        </tr>)}</tbody>
      </table></div>}
      <Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} />
    </>}</ResourceState>
  </>;
}
