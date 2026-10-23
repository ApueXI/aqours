import { useEffect, useState } from 'react';
import type { PickupSession, PickupSite } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useReferences } from '../../../hooks/useReferences';
import { revealSection } from '../../../components/DetailNavigation';
import { Pagination } from '../../../components/Pagination';
import { date, Demo, EmptyState, label, ResourceState, StatusLabel } from '../../../components/Status';
import { CancelSession, SessionForm } from './DistributionForms';

export function DistributionSessions({ sites, create, refreshMonitoring }: { sites: PickupSite[]; create: boolean; refreshMonitoring: () => void }) {
  const [offset, setOffset] = useState(0), [selectedId, setSelectedId] = useState('');
  const sessions = useResource<PickupSession[]>(`/staff/distribution/sessions?offset=${offset}`);
  const refs = useReferences();
  useEffect(() => { if (create) revealSection('session-create'); }, [create]);
  useEffect(() => { if (selectedId) document.getElementById('pickup-session-editor')?.focus(); }, [selectedId]);
  const selected = sessions.data?.find(session => session.id === selectedId);
  const refresh = () => { void sessions.refresh(); refreshMonitoring(); };
  return <section><h2>Pickup sessions</h2><p className="hint">Remaining liters = total − reserved − collected. Acceptance and collection use current server stock; this view does not reserve water.</p>
    <button type="button" onClick={refresh}>Refresh stock and sessions</button>
    <ResourceState resource={sessions}>{sessions.data && <>
      {sessions.data.length === 0 ? <EmptyState title="No pickup sessions."><p>Create an operating session for an active pickup site to make water support available.</p></EmptyState> :
        <div className="table-scroll responsive-table" tabIndex={0} role="region" aria-label="Pickup session stock"><table className="stock-table"><thead><tr><th>Site / schedule (Manila)</th><th>Status</th><th>Total (L)</th><th>Reserved (L)</th><th>Collected (L)</th><th>Remaining (L)</th><th>Details</th></tr></thead>
          <tbody>{sessions.data.map(session => <tr key={session.id} aria-selected={selectedId === session.id}><td>{session.site.name}<br />{date(session.startsAt)} – {date(session.endsAt)}</td><td data-label="Status"><span>{label(session.status)}</span><div className="hint">{label(session.availability)}</div></td>
            <td data-label="Total (L)">{session.totalLiters}</td><td data-label="Reserved (L)">{session.reservedLiters}</td><td data-label="Collected (L)">{session.collectedLiters}</td><td data-label="Remaining (L)">{session.remainingLiters}</td>
            <td><button type="button" aria-label={`Manage session at ${session.site.name}`} onClick={() => setSelectedId(session.id)}>Manage</button></td></tr>)}</tbody></table></div>}
      <Pagination offset={offset} total={sessions.result?.page?.total ?? sessions.data.length} onChange={value => { setOffset(value); setSelectedId(''); }} />
    </>}</ResourceState>
    {selected && <article id="pickup-session-editor" tabIndex={-1} className="session settings-editor" key={`${selected.id}:${selected.version}`}><h3>{selected.site.name} · <StatusLabel value={selected.status} /></h3><Demo value={selected.demo} />
      <button type="button" onClick={() => setSelectedId('')}>Close session editor</button>
      <p>{selected.site.address}</p><p className="preserve">{selected.instructions}</p><p>Zones: {selected.zoneIds.map(id => refs.zones.data?.find(zone => zone.id === id)?.name || 'Unknown zone').join(', ')}</p>
      <p className="hint">Stock updated {date(selected.updatedAt)}</p>
      {selected.status !== 'cancelled' && <><details><summary>Edit stock / schedule</summary><SessionForm d={selected} sites={sites} zones={refs.zones.data || []} refresh={refresh} /></details>
        <details><summary>Cancel session and arrange follow-up</summary><CancelSession d={selected} refresh={refresh} /></details></>}
    </article>}
    <details id="session-create" open={create || undefined}><summary>Create pickup session</summary><ResourceState resource={refs.zones} /><SessionForm sites={sites} zones={refs.zones.data || []} refresh={refresh} /></details>
  </section>;
}
