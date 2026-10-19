import type { StaffIncident } from '@aqours/contracts';
import { useResource } from '../hooks/useResource';
import { useReferences } from '../hooks/useReferences';
import { ActionForm } from '../components/ActionForm';
import { incidentFields } from '../components/IncidentFields';
import { incidentStatuses, options } from '../components/Filters';
import { History, Notes } from '../components/History';
import { date, Demo, label, PageTitle, ResourceState } from '../components/Status';

export function IncidentDetail({ id }: { id: string }) {
  const resource = useResource<StaffIncident>(`/staff/incidents/${id}`);
  const refs = useReferences();
  const d = resource.data;
  const refresh = () => void resource.refresh();
  return <><PageTitle title={d?.summary || 'Incident detail'}><a href="#/incidents">Back to incidents</a><button onClick={refresh}>Refresh current record</button></PageTitle>
    <ResourceState resource={resource}>{d && <div key={d.version}>
      <Demo value={d.demo} />
      <section><h2>{label(d.category)} · {label(d.status)}</h2><dl className="facts">
        <dt>Affected area</dt><dd>{d.area}</dd><dt>Restoration estimate</dt><dd>{date(d.restorationAt)}</dd>
        <dt>Reports</dt><dd>{d.reportCount}</dd><dt>Unique reporting connections</dt><dd>{d.uniqueConnections}</dd>
        <dt>Estimated affected customers</dt><dd>{d.estimatedAffected ?? 'Unknown'} · {d.estimateBasis || 'No estimate basis'}</dd>
        <dt>Estimate updated</dt><dd>{date(d.estimateUpdatedAt)}</dd>
      </dl><p className="hint">Report and connection totals are separate from the affected-customer estimate. Incident resolution does not lift a quality restriction.</p></section>
      <details><summary>Edit incident / workflow status</summary><section>
        <ActionForm path={`/staff/incidents/${id}`} method="PATCH" version={d.version} onDone={refresh} submit="Save incident" fields={[
          ...incidentFields(refs.users.data, refs.zones.data, d),
          { name: 'status', label: 'Status', type: 'select', value: d.status, required: true, options: options(incidentStatuses) },
          { name: 'reason', label: 'Change / corrective-transition reason', type: 'textarea', required: true },
        ]} />
      </section></details>
      <section><h2>Publish customer progress</h2><p>Preview the affected area, current status, progress, and restoration estimate before publishing.</p>
        <ActionForm path={`/staff/incidents/${id}/updates`} version={d.version} onDone={refresh} submit="Publish update" fields={[
          { name: 'progress', label: 'Customer-visible progress', type: 'textarea', required: true },
          { name: 'area', label: 'Affected area', type: 'textarea', value: d.area, required: true },
          { name: 'restorationAt', label: 'Restoration estimate (Manila)', type: 'datetime-local', value: d.restorationAt, nullable: true, hint: 'Leave blank to publish “unknown”.' },
          { name: 'geometry', label: 'Approved public area geometry (optional)', type: 'json', nullable: true, value: d.geometry ? JSON.stringify(d.geometry) : '', hint: 'Polygon / MultiPolygon GeoJSON. Exclude household coordinates.' },
        ]} preview={body => <><h3>Customer preview</h3><Demo value={d.demo} /><p><strong>{d.summary}</strong> · {label(d.status)}</p>
          <p className="preserve">{String(body.progress)}</p><p>Affected area: {String(body.area)}</p><p>Restoration: {date(body.restorationAt as string | null)}</p>
          <p className="hint">Publishing notifies linked reporting customers. Internal notes are excluded.</p></>} />
      </section>
      <section><h2>Published updates</h2>{d.updates.length === 0 && <p>No customer update published.</p>}
        {d.updates.map(update => <article className="entry" key={update.id}><h3>{label(update.status)} · {date(update.publishedAt)}</h3>
          <Demo value={update.demo} /><p className="preserve">{update.progress}</p><p>{update.area}</p><p>Restoration: {date(update.restorationAt)}</p>
        </article>)}
      </section>
      <section><h2>Linked reports</h2>{!d.reports?.length && <p>No linked reports. Review suggested associations in the report inbox.</p>}
        {d.reports?.map(report => <p key={report.id}><a href={`#/reports/${report.id}`}>{report.reference}</a> · {label(report.status)} · {report.address}</p>)}
        <a href="#/reports">Review report links and corrections</a>
      </section>
      <Notes path={`/staff/incidents/${id}/notes`} notes={d.notes} refresh={refresh} /><History events={d.timeline} />
    </div>}</ResourceState>
  </>;
}
