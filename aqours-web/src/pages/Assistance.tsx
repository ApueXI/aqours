import { useState } from 'react';
import type { AssistanceRequest, Report } from '@aqours/contracts';
import { query } from '../api/client';
import { useResource } from '../hooks/useResource';
import { useReferences } from '../hooks/useReferences';
import { useAllRecords } from '../hooks/useAllRecords';
import { assistanceStatuses, FilterBar } from '../components/Filters';
import { Pagination } from '../components/Pagination';
import { date, label, PageTitle, ResourceState } from '../components/Status';

export function Assistance() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [offset, setOffset] = useState(0);
  const refs = useReferences();
  const reports = useAllRecords<Report>('/staff/reports');
  const resource = useResource<AssistanceRequest[]>(`/staff/assistance-requests${query({ ...filters, offset })}`);
  return <><PageTitle title="Assistance queue"><button onClick={() => void resource.refresh()}>Refresh</button></PageTitle>
    <FilterBar values={filters} assistance statuses={assistanceStatuses} owners={refs.users.data} onChange={next => { setFilters(next); setOffset(0); }} />
    <ResourceState resource={resource}>{resource.data && <>
      {resource.data.length === 0 ? <p>No requests match these filters.</p> : <div className="table-scroll"><table>
        <thead><tr><th>Request / report</th><th>Service</th><th>Status</th><th>Owner</th><th>Requested</th><th>Appointment / pickup</th></tr></thead>
        <tbody>{resource.data.map(item => <tr key={item.id}><td><a href={`#/assistance/${item.id}`}>{item.reference}</a><div><a href={`#/reports/${item.reportId}`}>{reports.data?.find(report => report.id === item.reportId)?.reference || 'Linked report'}</a></div></td>
          <td>{label(item.type)}</td><td>{label(item.status)}</td><td>{refs.users.data?.find(user => user.id === item.ownerId)?.name || 'Unassigned'}</td>
          <td>{date(item.createdAt)}</td><td>{date(item.appointmentAt)}{item.allocation && <div>Pickup: {item.allocation.reference}</div>}</td>
        </tr>)}</tbody>
      </table></div>}
      <Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} />
    </>}</ResourceState>
  </>;
}
