import { useState } from 'react';
import type { StaffIncident } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useReferences } from '../../../hooks/useReferences';
import { ActionForm } from '../../../components/ActionForm';
import { incidentFields } from '../validators/incident-fields';
import { incidentStatuses, options } from '../../../components/Filters';
import { History, Notes } from '../../../components/History';
import { date, Demo, label, PageTitle, ResourceState, StatusLabel } from '../../../components/Status';
import { IncidentPublication } from '../components/IncidentPublication';

export function IncidentDetail({ id }: { id: string }) {
  const [view, setView] = useState('preview');
  const resource = useResource<StaffIncident>(`/staff/incidents/${id}`);
  const refs = useReferences();
  const d = resource.data;
  const latest = d?.updates.reduce<StaffIncident['updates'][number] | undefined>((current, update) => !current || update.publishedAt > current.publishedAt ? update : current, undefined);
  const refresh = () => void resource.refresh();
  return <><PageTitle title={d?.summary || 'Incident detail'}><a href="#/incidents">Back to incidents</a><button onClick={refresh}>Refresh current record</button></PageTitle>
    <ResourceState resource={resource}>{d && <div key={d.version}>
      <Demo value={d.demo} />
      <div className="record-strip"><StatusLabel value={d.status} /><p>{label(d.category)}</p><p>Restoration estimate: {date(d.restorationAt)}</p></div>
      <nav className="tabs" aria-label="Incident views">{[['preview', 'Customer preview'], ['publish', 'Publish update'], ['history', 'History']].map(([tab, text]) => <button key={tab} aria-current={view === tab ? 'page' : undefined} onClick={() => setView(tab)}>{text}</button>)}</nav>
      <div className="detail-grid"><div>
        <div hidden={view !== 'preview'}><section id="incident-preview"><h2>Latest customer publication</h2>
          {latest ? <><StatusLabel value={latest.status} /><p className="preserve">{latest.progress}</p><p>Affected area: {latest.area}</p><p>Estimated restoration: {date(latest.restorationAt)}</p><p className="hint">Published {date(latest.publishedAt)} · This is the published snapshot; editing the incident does not publish a customer update.</p></> : <p>No customer update has been published. Internal changes are not a public service notice.</p>}
        </section>
        <section id="incident-reports" tabIndex={-1}><h2>Linked reports</h2>{!d.reports?.length && <p>No linked reports. Review suggested associations in the report inbox.</p>}
          {d.reports?.map(report => <p key={report.id}><a href={`#/reports/${report.id}`}>{report.reference}</a> · <StatusLabel value={report.status} /> · {report.address}</p>)}
          <a href="#/reports">Review report links and corrections</a>
        </section>
        </div><div hidden={view !== 'publish'}><IncidentPublication d={d} refresh={refresh} mode="compose" /></div>
        <div hidden={view !== 'history'}><IncidentPublication d={d} refresh={refresh} mode="history" /><History id="incident-history" events={d.timeline} /></div>
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
