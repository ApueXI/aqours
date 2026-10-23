import { FiRefreshCw } from 'react-icons/fi';
import { OperationsTable } from '../../../components/OperationsTable';
import { useState } from 'react';
import type { StaffIncident } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useReferences } from '../../../hooks/useReferences';
import { incidentFields } from '../validators/incident-fields';
import { Pagination } from '../../../components/Pagination';
import { date, EmptyState, label, PageTitle, ResourceState, StatusLabel } from '../../../components/Status';
import { ActionForm } from '../../../components/ActionForm';
import { FormDialog } from '../../../components/FormDialog';

export function Incidents() {
  const [offset, setOffset] = useState(0);
  const refs = useReferences();
  const resource = useResource<StaffIncident[]>(`/staff/incidents?offset=${offset}`);
  return <div className="operations-page"><PageTitle title="Incidents"><button onClick={() => void resource.refresh()}><FiRefreshCw aria-hidden="true" />Refresh</button><FormDialog title="Create incident" triggerLabel="New incident" triggerClassName="primary"
    triggerDisabled={refs.users.loading || refs.zones.loading || refs.users.data === undefined || refs.zones.data === undefined}>
    <ActionForm path="/staff/incidents" fields={incidentFields(refs.users.data, refs.zones.data)} submit="Create incident" onDone={() => void resource.refresh()} />
  </FormDialog></PageTitle>
    <p className="page-description">Review area incidents, assigned owners and restoration estimates.</p>
    <ResourceState resource={refs.users} /><ResourceState resource={refs.zones} />
    <ResourceState resource={resource}>{resource.data && <>
      {resource.data.length === 0 && <EmptyState title="No incidents yet."><p>Review customer reports or create an incident when an area problem is confirmed for investigation.</p></EmptyState>}
      <div className="operations-list-heading"><h2>Incident register</h2><span>{resource.result?.page?.total ?? resource.data.length} incidents</span></div>
      <OperationsTable label="Incidents"><table className="incident-queue-table"><thead><tr><th>Incident</th><th>Status / owner</th><th className="numeric">Reports</th><th className="numeric">Connections</th><th className="numeric" title="Estimated affected customers">Est. affected</th><th>Restoration estimate</th></tr></thead>
        <tbody>{resource.data.map(incident => <tr key={incident.id}>
          <th scope="row"><a href={`#/incidents/${incident.id}`}>{incident.summary}</a><div className="cell-secondary">{label(incident.category)}{incident.demo && <span className="warning-text"> · Demonstration</span>}</div></th>
          <td data-label="Status / owner"><StatusLabel value={incident.status} /><div className="cell-secondary">{refs.users.data?.find(user => user.id === incident.ownerId)?.name || 'Unassigned'}</div></td>
          <td className="numeric" data-label="Reports">{incident.reportCount}</td><td className="numeric" data-label="Unique connections">{incident.uniqueConnections}</td><td className="numeric" data-label="Estimated affected customers">{incident.estimatedAffected ?? 'Unknown'}</td><td className="operations-date" data-label="Restoration estimate">{date(incident.restorationAt)}</td>
        </tr>)}</tbody></table></OperationsTable>
      <Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} />
    </>}</ResourceState>
  </div>;
}
