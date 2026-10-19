import { useState } from 'react';
import type { Advisory, Connection, User } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useReferences } from '../../../hooks/useReferences';
import { useAllRecords } from '../../../hooks/useAllRecords';
import { AdvisoryEditor, AdvisoryPreview } from '../components/AdvisoryEditor';
import { ActionForm } from '../../../components/ActionForm';
import { Pagination } from '../../../components/Pagination';
import { date, Demo, label, PageTitle, ResourceState } from '../../../components/Status';

export function Advisories({ user, id }: { user: User; id?: string }) {
  const [offset, setOffset] = useState(0);
  const resource = useResource<Advisory[]>(`/staff/advisories?offset=${offset}`);
  const detail = useResource<Advisory>(id ? `/staff/advisories/${id}` : null);
  const refs = useReferences();
  const connections = useAllRecords<Connection>(user.role === 'admin' ? '/staff/connections' : null);
  const refresh = () => { void resource.refresh(); void detail.refresh(); };
  const d = detail.data;
  return <><PageTitle title={id ? d?.title || 'Advisory detail' : 'Official advisories'}>
    {id && <a href="#/advisories">Back to advisories</a>}<button onClick={refresh}>Refresh</button>
  </PageTitle><p className="hint text-[#475569] text-[13px]">Official notices apply independently of reports and incidents. Boil water, do not drink, and do not use are distinct restrictions.</p>
    {id ? <ResourceState resource={detail}>{d && <div key={d.version}><section><Demo value={d.demo} /><p>State: {label(d.state)} · Version {d.version} · Updated {date(d.updatedAt)}</p><AdvisoryPreview d={d} /></section>
      {user.role === 'admin' && d.state !== 'lifted' && <>
        <details><summary>{d.state === 'draft' ? 'Edit draft' : 'Revise published advisory'}</summary><section><AdvisoryEditor d={d} zones={refs.zones.data || []} connections={connections.data || []} refresh={refresh} /></section></details>
        {d.state === 'draft' ? <section><h2>Publish advisory</h2><ActionForm path={`/staff/advisories/${id}/publish`} version={d.version} fields={[]}
          submit="Publish advisory" onDone={refresh} preview={() => <><AdvisoryPreview d={d} /><p>Matched customers are notified even when they have not filed a report.</p></>} /></section> :
          <section><h2>Explicitly lift advisory</h2><ActionForm path={`/staff/advisories/${id}/lift`} version={d.version}
            fields={[{ name: 'reason', label: 'Authorized lifting reason', type: 'textarea', required: true }]} submit="Lift advisory" onDone={refresh}
            preview={body => <><h3>Lift {d.title}</h3><p>{String(body.reason)}</p><p>This action ends this advisory and records the lifting event.</p></>} /></section>}
      </>}
      {d.liftedAt && <p className="notice [border-left:3px_solid] [padding:10px_12px] [margin:12px_0] text-[#854d0e] bg-[#fffbeb] [border-color:#b45309]">Lifted {date(d.liftedAt)} · {d.liftReason}</p>}
      <section><h2>Revision history</h2>{d.revisions?.map(revision => <article className="entry [padding:16px_0] [border-bottom:1px_solid_#dbe3e9] [&_p:last-child]:mb-[0] [&_+_.action-form]:mt-[20px]" key={revision.version}>
        <h3>Version {revision.version} · {label(revision.action)} · {date(revision.createdAt)}</h3><p className="preserve whitespace-pre-wrap [overflow-wrap:anywhere]">{revision.text}</p><p>Source: {revision.source}</p>
      </article>)}</section>
    </div>}</ResourceState> : <>
      <ResourceState resource={resource}>{resource.data && <><table><thead><tr><th>Advisory</th><th>Type</th><th>State</th><th>Updated</th></tr></thead><tbody>
        {resource.data.map(item => <tr key={item.id}><td><a href={`#/advisories/${item.id}`}>{item.title}</a>{item.demo && <div className="warning-text text-[#92400e]">Demonstration</div>}</td><td>{label(item.kind)}</td><td>{label(item.state)}</td><td>{date(item.updatedAt)}</td></tr>)}
      </tbody></table>{resource.data.length === 0 && <p>No advisories.</p>}<Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} /></>}</ResourceState>
      {user.role === 'admin' && <details><summary>Create advisory draft</summary><section><h2>New advisory</h2><AdvisoryEditor zones={refs.zones.data || []} connections={connections.data || []} refresh={refresh} /></section></details>}
    </>}
    {user.role !== 'admin' && <p className="hint text-[#475569] text-[13px]">Staff can read advisories. An administrator manages publication, revisions, and lifting.</p>}
  </>;
}
