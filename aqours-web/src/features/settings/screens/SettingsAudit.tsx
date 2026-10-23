import { useState } from 'react';
import { useResource } from '../../../hooks/useResource';
import { Pagination } from '../../../components/Pagination';
import { date, label, ResourceState } from '../../../components/Status';

type AuditEvent = {
  id: string; actorId: string; action: string; targetType?: string; targetId?: string;
  reason?: string | null; text?: string; createdAt: string; details?: unknown;
};
export function SettingsAudit() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const resource = useResource<AuditEvent[]>(`/staff/audit?offset=${offset}`);
  const visible = resource.data?.filter(event => `${event.action} ${event.actorId} ${event.targetType || ''} ${event.targetId || ''} ${event.reason || event.text || ''}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <><h2>Audit history</h2><button onClick={() => void resource.refresh()}>Refresh audit</button><ResourceState resource={resource}>{resource.data && <>
    <label className="field settings-search"><span>Find action, actor, target or reason on this page</span><input value={search} onChange={event => setSearch(event.target.value)} /></label>
    <div className="table-scroll responsive-table"><table className="audit-history-table"><thead><tr><th>Time</th><th>Action</th><th>Actor</th><th>Target</th><th>Reason</th></tr></thead><tbody>
      {visible?.map(event => <tr key={event.id}><td>{date(event.createdAt)}</td><td data-label="Action">{label(event.action)}</td><td data-label="Actor">{event.actorId}</td><td data-label="Target">{event.targetType} {event.targetId}</td><td data-label="Reason">{event.reason || event.text || '—'}</td></tr>)}
    </tbody></table></div>{visible?.length === 0 && <p>No audit events match this page.</p>}
    <Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} />
  </>}</ResourceState></>;
}
