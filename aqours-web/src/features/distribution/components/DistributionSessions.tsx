import { OperationsTable } from '../../../components/OperationsTable';
import { useEffect, useState } from 'react';
import type { PickupSession, PickupSite } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useReferences } from '../../../hooks/useReferences';
import { Pagination } from '../../../components/Pagination';
import { date, Demo, EmptyState, label, ResourceState, StatusLabel } from '../../../components/Status';
import { CancelSession, SessionForm } from './DistributionForms';
import { FormDialog } from '../../../components/FormDialog';

export function DistributionSessions({ sites, sitesLoading, create, refreshMonitoring, onCreateClose }: {
  sites: PickupSite[]; sitesLoading: boolean; create: boolean; refreshMonitoring: () => void; onCreateClose: () => void;
}) {
  const [offset, setOffset] = useState(0), [selectedId, setSelectedId] = useState('');
  const sessions = useResource<PickupSession[]>(`/staff/distribution/sessions?offset=${offset}`);
  const refs = useReferences();
  useEffect(() => { if (selectedId) document.getElementById('pickup-session-editor')?.focus(); }, [selectedId]);
  const selected = sessions.data?.find(session => session.id === selectedId);
  const refresh = () => { void sessions.refresh(); refreshMonitoring(); };
  return <section><h2>Pickup sessions</h2><p className="hint">Remaining liters = total − reserved − collected. Acceptance and collection use current server stock; this view does not reserve water.</p>
    <button type="button" onClick={refresh}>Refresh stock and sessions</button>
    <ResourceState resource={sessions}>{sessions.data && <>
      {sessions.data.length === 0 ? <EmptyState title="No pickup sessions."><p>Create an operating session for an active pickup site to make water support available.</p></EmptyState> :
        <OperationsTable label="Pickup session stock"><table className="stock-table"><thead><tr><th>Site / schedule (Manila)</th><th>Status</th><th>Total (L)</th><th>Reserved (L)</th><th>Collected (L)</th><th>Remaining (L)</th><th>Details</th></tr></thead>
          <tbody>{sessions.data.map(session => <tr key={session.id} aria-selected={selectedId === session.id}><th scope="row">{session.site.name}<div className="cell-secondary">{date(session.startsAt)} – {date(session.endsAt)}</div></th><td data-label="Status"><span>{label(session.status)}</span><div className="hint">{label(session.availability)}</div></td>
            <td data-label="Total (L)">{session.totalLiters}</td><td data-label="Reserved (L)">{session.reservedLiters}</td><td data-label="Collected (L)">{session.collectedLiters}</td><td data-label="Remaining (L)">{session.remainingLiters}</td>
            <td><button type="button" aria-label={`Manage session at ${session.site.name}`} onClick={() => setSelectedId(session.id)}>Manage</button></td></tr>)}</tbody></table></OperationsTable>}
      <Pagination offset={offset} total={sessions.result?.page?.total ?? sessions.data.length} onChange={value => { setOffset(value); setSelectedId(''); }} />
    </>}</ResourceState>
    {selected && <article id="pickup-session-editor" tabIndex={-1} className="session settings-editor"><h3>{selected.site.name} · <StatusLabel value={selected.status} /></h3><Demo value={selected.demo} />
      <button type="button" onClick={() => setSelectedId('')}>Close session editor</button>
      <p>{selected.site.address}</p><p className="preserve">{selected.instructions}</p><p>Zones: {selected.zoneIds.map(id => refs.zones.data?.find(zone => zone.id === id)?.name || 'Unknown zone').join(', ')}</p>
      <p className="hint">Stock updated {date(selected.updatedAt)}</p>
      {selected.status !== 'cancelled' && <><FormDialog title="Edit stock / schedule" triggerLabel="Edit stock / schedule"
        triggerDisabled={refs.zones.loading || refs.zones.data === undefined}><SessionForm d={selected} sites={sites} zones={refs.zones.data || []} refresh={refresh} /></FormDialog>
        <FormDialog title="Cancel session and arrange follow-up" triggerLabel="Cancel session"><CancelSession d={selected} refresh={refresh} /></FormDialog></>}
    </article>}
    <ResourceState resource={refs.zones} />
    <FormDialog title="Create pickup session" triggerLabel="Create pickup session" triggerClassName="primary" defaultOpen={create}
      ready={!sitesLoading && !refs.zones.loading && refs.zones.data !== undefined}
      triggerDisabled={sitesLoading || refs.zones.loading || refs.zones.data === undefined} onClose={onCreateClose}>
      <SessionForm sites={sites} zones={refs.zones.data || []} refresh={refresh} />
    </FormDialog>
  </section>;
}
