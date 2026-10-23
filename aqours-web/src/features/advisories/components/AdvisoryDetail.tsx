import { useState } from 'react';
import type { Advisory, Connection, User, Zone } from '@aqours/contracts';
import { ActionForm } from '../../../components/ActionForm';
import { date, Demo, label, StatusLabel } from '../../../components/Status';
import { AdvisoryEditor, AdvisoryPreview } from './AdvisoryEditor';
import { FormDialog } from '../../../components/FormDialog';

export function AdvisoryDetail({ d, user, zones, connections, referencesLoading, refresh }: {
  d: Advisory; user: User; zones: Zone[]; connections: Connection[]; referencesLoading: boolean; refresh(): void;
}) {
  const [view, setView] = useState('preview');
  const editable = user.role === 'admin' && d.state !== 'lifted';
  return <div>
    <Demo value={d.demo} />
    <div className="record-strip"><StatusLabel value={d.state} /><p>{label(d.kind)}</p><p>Version {d.version}</p><p>Updated {date(d.updatedAt)}</p></div>
    <nav className="tabs" aria-label="Advisory views">{[['preview', 'Customer notice'], ['history', 'Revision history']].map(([tab, text]) => <button key={tab} type="button" aria-current={view === tab ? 'page' : undefined} onClick={() => setView(tab)}>{text}</button>)}</nav>
    <div className="detail-grid"><div>
      <div hidden={view !== 'preview'}><section id="advisory-preview" tabIndex={-1}><h2>Customer notice</h2><AdvisoryPreview d={d} /></section>
      {d.liftedAt && <p className="notice">Lifted {date(d.liftedAt)} · {d.liftReason}</p>}
      </div><div hidden={view !== 'history'}><section id="advisory-revisions" tabIndex={-1}><h2>Revision history</h2>{d.revisions?.map(revision => <article className="entry" key={revision.version}>
        <h3>Version {revision.version} · {label(revision.action)} · {date(revision.createdAt)}</h3><p className="preserve">{revision.text}</p><p>Source: {revision.source}</p>
      </article>)}{!d.revisions?.length && <p>No revisions recorded.</p>}</section></div>
    </div><div>
      {editable && <>
        <FormDialog title={d.state === 'draft' ? 'Edit advisory draft' : 'Revise published advisory'} triggerLabel={d.state === 'draft' ? 'Edit draft' : 'Revise published advisory'} triggerDisabled={referencesLoading}>
          <AdvisoryEditor d={d} zones={zones} connections={connections} refresh={refresh} />
        </FormDialog>
        {d.state === 'draft' ? <FormDialog title="Publish advisory" triggerLabel="Publish advisory" triggerClassName="primary"><p className="hint">Review the complete notice before notifying matching customers.</p>
          <ActionForm path={`/staff/advisories/${d.id}/publish`} version={d.version} fields={[]}
            submit="Publish advisory" onDone={refresh} preview={() => <><AdvisoryPreview d={d} /><p>Matched customers are notified even when they have not filed a report.</p></>} />
        </FormDialog> :
          <FormDialog title="Lift advisory" triggerLabel="Lift advisory"><p className="hint">Only an authorized review ends this notice. Report and incident outcomes remain separate.</p>
            <ActionForm path={`/staff/advisories/${d.id}/lift`} version={d.version}
              fields={[{ name: 'reason', label: 'Authorized lifting reason', type: 'textarea', required: true }]} submit="Lift advisory" onDone={refresh}
              preview={body => <><h3>Lift {d.title}</h3><p>{String(body.reason)}</p><p>This action ends this advisory and records the lifting event.</p></>} />
          </FormDialog>}
      </>}
      {!editable && <section><h2>Publication permissions</h2><p>{d.state === 'lifted' ? 'This advisory has been lifted. Its customer notice and revision history remain available.' : 'An administrator reviews revisions and explicitly publishes or lifts official advisories.'}</p></section>}
    </div></div>
  </div>;
}
