import { useState } from 'react';
import type { StaffIncident } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useReferences } from '../../../hooks/useReferences';
import { ActionForm } from '../../../components/ActionForm';
import { incidentFields } from '../validators/incident-fields';
import { Pagination } from '../../../components/Pagination';
import { revealSection } from '../../../components/DetailNavigation';
import { date, EmptyState, label, PageTitle, ResourceState, StatusLabel } from '../../../components/Status';

export function Incidents() {
  const [offset, setOffset] = useState(0);
  const refs = useReferences();
  const resource = useResource<StaffIncident[]>(`/staff/incidents?offset=${offset}`);
  return <><PageTitle title="Incidents"><button onClick={() => void resource.refresh()}>Refresh</button><button className="primary" onClick={() => revealSection('incident-create')}>New incident</button></PageTitle>
    <p className="page-description">Coordinate an area problem and publish progress after review. Report associations and customer notices remain explicit actions.</p>
    <ResourceState resource={resource}>{resource.data && <>
      {resource.data.length === 0 && <EmptyState title="No incidents yet."><p>Review customer reports or create an incident when an area problem is confirmed for investigation.</p></EmptyState>}
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Incidents"><table><thead><tr><th>Incident</th><th>Status / owner</th><th>Reports</th><th>Unique connections</th><th>Estimated affected customers</th><th>Restoration estimate</th></tr></thead>
        <tbody>{resource.data.map(incident => <tr key={incident.id}>
          <td><a href={`#/incidents/${incident.id}`}>{incident.summary}</a><div>{label(incident.category)}</div>{incident.demo && <span className="warning-text">Demonstration</span>}</td>
          <td><StatusLabel value={incident.status} /><div>{refs.users.data?.find(user => user.id === incident.ownerId)?.name || 'Unassigned'}</div></td>
          <td>{incident.reportCount}</td><td>{incident.uniqueConnections}</td><td>{incident.estimatedAffected ?? 'Unknown'}</td><td>{date(incident.restorationAt)}</td>
        </tr>)}</tbody></table></div>
      <Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} />
    </>}</ResourceState>
    <details id="incident-create"><summary>Create incident</summary><section><h2>New incident</h2>
      <ResourceState resource={refs.users} /><ResourceState resource={refs.zones} />
      <ActionForm path="/staff/incidents" fields={incidentFields(refs.users.data, refs.zones.data)} submit="Create incident" onDone={() => void resource.refresh()} />
    </section></details>
  </>;
}
