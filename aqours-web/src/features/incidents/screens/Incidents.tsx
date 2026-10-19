import { useState } from 'react';
import type { StaffIncident } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useReferences } from '../../../hooks/useReferences';
import { ActionForm } from '../../../components/ActionForm';
import { incidentFields } from '../validators/incident-fields';
import { Pagination } from '../../../components/Pagination';
import { date, label, PageTitle, ResourceState } from '../../../components/Status';

export function Incidents() {
  const [offset, setOffset] = useState(0);
  const refs = useReferences();
  const resource = useResource<StaffIncident[]>(`/staff/incidents?offset=${offset}`);
  return <><PageTitle title="Incidents"><button onClick={() => void resource.refresh()}>Refresh</button></PageTitle>
    <ResourceState resource={resource}>{resource.data && <>
      {resource.data.length === 0 && <p>No incidents yet.</p>}
      <div className="table-scroll w-full overflow-x-auto"><table><thead><tr><th>Incident</th><th>Status / owner</th><th>Reports</th><th>Unique connections</th><th>Estimated affected customers</th><th>Restoration</th></tr></thead>
        <tbody>{resource.data.map(incident => <tr key={incident.id}>
          <td><a href={`#/incidents/${incident.id}`}>{incident.summary}</a><div>{label(incident.category)}</div>{incident.demo && <span className="warning-text text-[#92400e]">Demonstration</span>}</td>
          <td>{label(incident.status)}<div>{refs.users.data?.find(user => user.id === incident.ownerId)?.name || 'Unassigned'}</div></td>
          <td>{incident.reportCount}</td><td>{incident.uniqueConnections}</td><td>{incident.estimatedAffected ?? 'Unknown'}</td><td>{date(incident.restorationAt)}</td>
        </tr>)}</tbody></table></div>
      <Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} />
    </>}</ResourceState>
    <details><summary>Create incident</summary><section><h2>New incident</h2>
      <ResourceState resource={refs.users} /><ResourceState resource={refs.zones} />
      <ActionForm path="/staff/incidents" fields={incidentFields(refs.users.data, refs.zones.data)} submit="Create incident" onDone={() => void resource.refresh()} />
    </section></details>
  </>;
}
