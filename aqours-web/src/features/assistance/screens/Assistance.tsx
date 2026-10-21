import type { AssistanceRequest, Report } from '@aqours/contracts';
import { query } from '../../../services/http-client';
import { useResource } from '../../../hooks/useResource';
import { useQueueFilters } from '../../../hooks/useQueueFilters';
import { useReferences } from '../../../hooks/useReferences';
import { useAllRecords } from '../../../hooks/useAllRecords';
import { assistanceStatuses, FilterBar } from '../../../components/Filters';
import { Pagination } from '../../../components/Pagination';
import { detailLink } from '../../../app/navigation';
import { date, EmptyState, label, PageTitle, ResourceState, StatusLabel } from '../../../components/Status';

export function Assistance({ params }: { params: URLSearchParams }) {
  const { filters, offset, setFilters, setOffset } = useQueueFilters('assistance', params);
  const refs = useReferences();
  const reports = useAllRecords<Report>('/staff/reports');
  const resource = useResource<AssistanceRequest[]>(`/staff/assistance-requests${query({ ...filters, offset })}`);
  return <><PageTitle title="Assistance queue"><button onClick={() => void resource.refresh()}>Refresh</button></PageTitle>
    <p className="page-description">Arrange callbacks, site inspections, and water pickup. Track fulfillment separately from the customer report.</p>
    <FilterBar values={filters} assistance statuses={assistanceStatuses} owners={refs.users.data} onChange={setFilters} />
    <ResourceState resource={resource}>{resource.data && <>
      <div className="queue-heading"><p>{resource.result?.page?.total ?? resource.data.length} assistance requests</p><a href="#/distribution">Find a pickup reservation</a></div>
      {resource.data.length === 0 ? <EmptyState title="No requests match these filters."><p>Clear or adjust the filters to view other requests.</p></EmptyState> : <div className="table-scroll" tabIndex={0} role="region" aria-label="Assistance queue results"><table className="assistance-queue-table">
        <thead><tr><th>Request / report</th><th>Service</th><th>Status</th><th>Owner</th><th>Requested</th><th>Appointment / pickup</th></tr></thead>
        <tbody>{resource.data.map(item => <tr key={item.id}><td><a href={detailLink('assistance', item.id, `/assistance${query({ ...filters, ...(offset ? { offset } : {}) })}`)}>{item.reference}</a><div><a href={`#/reports/${item.reportId}`}>{reports.data?.find(report => report.id === item.reportId)?.reference || 'Linked report'}</a></div></td>
          <td>{label(item.type)}</td><td><StatusLabel value={item.status} /></td><td>{refs.users.data?.find(user => user.id === item.ownerId)?.name || 'Unassigned'}</td>
          <td>{date(item.createdAt)}</td><td>{date(item.appointmentAt)}{item.allocation && <div>Pickup: {item.allocation.reference}</div>}</td>
        </tr>)}</tbody>
      </table></div>}
      <Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} />
    </>}</ResourceState>
  </>;
}
