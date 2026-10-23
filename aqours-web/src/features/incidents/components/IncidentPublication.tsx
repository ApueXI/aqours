import type { StaffIncident } from '@aqours/contracts';
import { ActionForm } from '../../../components/ActionForm';
import { date, Demo, label } from '../../../components/Status';

export function IncidentPublication({ d, refresh, mode }: { d: StaffIncident; refresh(): void; mode: 'compose' | 'history' }) {
  return <>
    {mode === 'compose' && <section id="incident-publication" tabIndex={-1}><h2>Publish customer progress</h2>
      <p>Preview the affected area, current status, progress, and restoration estimate before publishing.</p>
      <ActionForm path={`/staff/incidents/${d.id}/updates`} version={d.version} onDone={refresh} submit="Publish update" fields={[
        { name: 'progress', label: 'Customer-visible progress', type: 'textarea', required: true },
        { name: 'area', label: 'Affected area', type: 'textarea', value: d.area, required: true },
        { name: 'restorationAt', label: 'Restoration estimate (Manila)', type: 'datetime-local', value: d.restorationAt, nullable: true, hint: 'Leave blank to publish “unknown”.' },
        { name: 'geometry', label: 'Approved public area geometry (optional)', type: 'json', nullable: true, value: d.geometry ? JSON.stringify(d.geometry) : '', hint: 'Polygon / MultiPolygon GeoJSON. Exclude household coordinates.' },
      ]} preview={body => <><h3>Customer preview</h3><Demo value={d.demo} /><p><strong>{d.summary}</strong> · {label(d.status)}</p>
        <p className="preserve">{String(body.progress)}</p><p>Affected area: {String(body.area)}</p><p>Restoration: {date(body.restorationAt as string | null)}</p>
        <p className="hint">Publishing notifies linked reporting customers. Internal notes are excluded.</p></>} />
    </section>}
    {mode === 'history' && <section><h2>Published updates</h2>{d.updates.length === 0 && <p>No customer update published.</p>}
      {d.updates.map(update => <article className="entry" key={update.id}><h3>{label(update.status)} · {date(update.publishedAt)}</h3>
        <Demo value={update.demo} /><p className="preserve">{update.progress}</p><p>{update.area}</p><p>Restoration estimate: {date(update.restorationAt)}</p>
      </article>)}
    </section>}
  </>;
}
