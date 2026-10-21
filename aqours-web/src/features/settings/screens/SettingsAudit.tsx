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
  const resource = useResource<AuditEvent[]>(`/staff/audit?offset=${offset}`);
  return <><h2>Audit history</h2><button onClick={() => void resource.refresh()}>Refresh audit</button><ResourceState resource={resource}>{resource.data && <>
    <div className="table-scroll"><table><thead><tr><th>Time</th><th>Action</th><th>Actor</th><th>Target</th><th>Reason</th></tr></thead><tbody>
      {resource.data.map(event => <tr key={event.id}><td>{date(event.createdAt)}</td><td>{label(event.action)}</td><td>{event.actorId}</td><td>{event.targetType} {event.targetId}</td><td>{event.reason || event.text || '—'}</td></tr>)}
    </tbody></table></div>{resource.data.length === 0 && <p>No audit events.</p>}
    <Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} />
  </>}</ResourceState></>;
}
