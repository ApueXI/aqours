import { useState } from 'react';
import type { Advisory, ApprovedGuidance, Connection, Zone } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { ActionForm, type Field } from '../../../components/ActionForm';
import { advisoryKinds, options, zoneOptions } from '../../../components/Filters';
import { date, Demo, label, ResourceState } from '../../../components/Status';

export function AdvisoryPreview({ d }: { d: Pick<Advisory, 'title' | 'kind' | 'text' | 'source' | 'zoneIds' | 'connectionIds' | 'demo' | 'startsAt' | 'endsAt'> }) {
  return <><h3>{d.title}</h3><Demo value={d.demo} /><p><strong>{label(d.kind)}</strong></p><p className="preserve">{d.text}</p>
    <p>Source: {d.source}</p><p>{d.zoneIds.length} explicit zones · {d.connectionIds.length} explicit connections</p>
    <p>Service starts: {d.startsAt ? date(d.startsAt) : 'Immediately on publication'} · Expected end: {d.endsAt ? date(d.endsAt) : 'Not specified'}</p>
    {['boil_water', 'do_not_drink', 'do_not_use'].includes(d.kind) && <p className="notice">This quality restriction remains active until an administrator explicitly lifts it.</p>}
  </>;
}
export function AdvisoryEditor({ d, zones, connections, refresh }: { d?: Advisory; zones: Zone[]; connections: Connection[]; refresh: () => void }) {
  const guidance = useResource<ApprovedGuidance[]>('/staff/settings/guidance');
  const [approvedId, setApprovedId] = useState('');
  const approved = guidance.data?.find(item => item.id === approvedId);
  const fields: Field[] = [
    { name: 'kind', label: 'Advisory type', type: 'select', value: approved?.kind || d?.kind, required: true, options: options(advisoryKinds) },
    { name: 'title', label: 'Title', value: d?.title, required: true },
    { name: 'text', label: 'Approved customer instructions', type: 'textarea', value: approved?.text || d?.text, required: true },
    { name: 'source', label: 'Approved source / reference', value: approved?.source || d?.source, required: true },
    { name: 'zoneIds', label: 'Affected service zones', hint: 'Customers with supplier-confirmed connections in these zones receive this advisory. Choose a zone, individual connections, or both.', type: 'multi', value: d?.zoneIds, options: zoneOptions(zones) },
    { name: 'connectionIds', label: 'Individual service connections (optional)', hint: 'Include specific properties, including connections without a confirmed zone. Matching either selection is enough; recipients are deduplicated.', type: 'multi', value: d?.connectionIds, options: connections.map(item => ({ value: item.id, label: `${item.reference} · ${item.address}` })) },
    { name: 'startsAt', label: 'Service starts (optional, Manila)', hint: 'When the announced interruption or service period begins. Blank means immediately; publication is a separate action.', type: 'datetime-local', value: d?.startsAt, nullable: true },
    { name: 'endsAt', label: 'Expected end (optional, Manila)', hint: 'An estimate for the service period. Quality restrictions remain in effect until explicitly lifted, even after this time.', type: 'datetime-local', value: d?.endsAt, nullable: true },
    { name: 'geometry', label: 'Optional approved public boundary', type: 'json', value: d?.geometry ? JSON.stringify(d.geometry) : '', nullable: true },
    ...(d ? [{ name: 'reason', label: 'Revision reason', type: 'textarea' as const, required: true }] : [{ name: 'demo', label: 'Fictional demonstration advisory', type: 'checkbox' as const }]),
  ];
  return <><ResourceState resource={guidance} /><label className="field"><span>Start from approved guidance (optional)</span>
    <select value={approvedId} onChange={event => setApprovedId(event.target.value)}><option value="">Choose approved guidance…</option>
      {guidance.data?.map(item => <option value={item.id} key={item.id}>{label(item.kind)} · v{item.version} · {item.source}</option>)}
    </select></label>
    <ActionForm key={`${d?.version || 'new'}:${approvedId}`} path={d ? `/staff/advisories/${d.id}` : '/staff/advisories'} method={d ? 'PATCH' : 'POST'}
      version={d?.version} fields={fields} submit={d ? 'Save advisory revision' : 'Create draft'} onDone={refresh}
      preview={d?.state === 'published' ? body => <AdvisoryPreview d={{ ...d, ...body } as Advisory} /> : undefined} />
  </>;
}
