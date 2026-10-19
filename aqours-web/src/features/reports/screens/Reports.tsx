import { styleClasses } from '../../../utils/style-classes';
import { useState } from 'react';
import type { Report } from '@aqours/contracts';
import { query } from '../../../services/http-client';
import { useReferences } from '../../../hooks/useReferences';
import { useResource } from '../../../hooks/useResource';
import { FilterBar } from '../../../components/Filters';
import { Pagination } from '../../../components/Pagination';
import { detailLink } from '../../../app/navigation';
import { date, label, PageTitle, ResourceState } from '../../../components/Status';

export function Reports({ params }: { params: URLSearchParams }) {
  const [filters, setFilters] = useState<Record<string, string>>(() => Object.fromEntries(params));
  const [offset, setOffset] = useState(0);
  const refs = useReferences();
  const resource = useResource<Report[]>(`/staff/reports${query({ ...filters, offset })}`);
  return <><PageTitle title="Report inbox"><a href={`#/map${query(filters)}`}>View on map</a></PageTitle>
    <FilterBar values={filters} zones={refs.zones.data} owners={refs.users.data} priority onChange={next => { setFilters(next); setOffset(0); }} />
    <ResourceState resource={resource}>{resource.data && <>
      {resource.data.length === 0 ? <p>No reports match these filters.</p> : <div className="table-scroll w-full overflow-x-auto"><table>
        <thead><tr><th>Reference / category</th><th>Submitted / noticed</th><th>Status / priority</th><th>Owner</th><th>Issue location</th></tr></thead>
        <tbody>{resource.data.map(report => <tr key={report.id}>
          <td><a href={detailLink('reports', report.id, `/reports${query(filters)}`)}>{report.reference}</a><div>{label(report.category)}</div></td>
          <td>{date(report.submittedAt)}<div className="hint text-[#475569] text-[13px]">Noticed {date(report.noticedAt)}</div></td>
          <td>{label(report.status)}<div>{label(report.priority)}{report.closureOutcome ? ` · ${label(report.closureOutcome)}` : ''}</div></td>
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
