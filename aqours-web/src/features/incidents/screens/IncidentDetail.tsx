import type { StaffIncident } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useReferences } from '../../../hooks/useReferences';
import { ActionForm } from '../../../components/ActionForm';
import { incidentFields } from '../validators/incident-fields';
import { incidentStatuses, options } from '../../../components/Filters';
import { History, Notes } from '../../../components/History';
import { DetailNavigation } from '../../../components/DetailNavigation';
import { date, Demo, label, PageTitle, ResourceState, StatusLabel } from '../../../components/Status';
import { IncidentPublication } from '../components/IncidentPublication';

const sections = [
  { id: 'incident-publication', label: 'Customer progress' }, { id: 'incident-context', label: 'Affected area and estimates' },
  { id: 'incident-workflow', label: 'Edit incident' }, { id: 'incident-reports', label: 'Linked reports' },
  { id: 'incident-notes', label: 'Internal notes' }, { id: 'incident-history', label: 'History' },
];

export function IncidentDetail({ id }: { id: string }) {
  const resource = useResource<StaffIncident>(`/staff/incidents/${id}`);
  const refs = useReferences();
  const d = resource.data;
  const refresh = () => void resource.refresh();
  return <><PageTitle title={d?.summary || 'Incident detail'}><a href="#/incidents">Back to incidents</a><button onClick={refresh}>Refresh current record</button></PageTitle>
    <ResourceState resource={resource}>{d && <div key={d.version}>
      <Demo value={d.demo} />
      <div className="record-strip"><StatusLabel value={d.status} /><p>{label(d.category)}</p><p>Restoration estimate: {date(d.restorationAt)}</p></div>
      <DetailNavigation items={sections} />
      <div className="detail-grid"><div>
        <IncidentPublication d={d} refresh={refresh} />
        <section id="incident-reports" tabIndex={-1}><h2>Linked reports</h2>{!d.reports?.length && <p>No linked reports. Review suggested associations in the report inbox.</p>}
          {d.reports?.map(report => <p key={report.id}><a href={`#/reports/${report.id}`}>{report.reference}</a> · <StatusLabel value={report.status} /> · {report.address}</p>)}
          <a href="#/reports">Review report links and corrections</a>
        </section>
        <History id="incident-history" events={d.timeline} />
      </div><div>
        <section id="incident-context" tabIndex={-1}><h2>{label(d.category)} · {label(d.status)}</h2><dl className="facts">
          <dt>Affected area</dt><dd>{d.area}</dd><dt>Restoration estimate</dt><dd>{date(d.restorationAt)}</dd>
          <dt>Reports</dt><dd>{d.reportCount}</dd><dt>Unique reporting connections</dt><dd>{d.uniqueConnections}</dd>
          <dt>Estimated affected customers</dt><dd>{d.estimatedAffected ?? 'Unknown'} · {d.estimateBasis || 'No estimate basis'}</dd>
          <dt>Estimate updated</dt><dd>{date(d.estimateUpdatedAt)}</dd>
        </dl><p className="hint">Report and connection totals are separate from the affected-customer estimate. Incident resolution does not lift a quality restriction.</p></section>
        <details id="incident-workflow"><summary>Edit incident / workflow status</summary><section>
          <ResourceState resource={refs.users} /><ResourceState resource={refs.zones} />
          <ActionForm path={`/staff/incidents/${id}`} method="PATCH" version={d.version} onDone={refresh} submit="Save incident" fields={[
            ...incidentFields(refs.users.data, refs.zones.data, d),
            { name: 'status', label: 'Status', type: 'select', value: d.status, required: true, options: options(incidentStatuses) },
            { name: 'reason', label: 'Change / corrective-transition reason', type: 'textarea', required: true },
          ]} />
        </section></details>
        <Notes id="incident-notes" path={`/staff/incidents/${id}/notes`} notes={d.notes} refresh={refresh} />
      </div></div>
    </div>}</ResourceState>
  </>;
}
