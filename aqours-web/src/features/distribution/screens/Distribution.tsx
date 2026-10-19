import { useState, type FormEvent } from 'react';
import type { AssistanceRequest, PickupSession, PickupSite } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useReferences } from '../../../hooks/useReferences';
import { useAllRecords } from '../../../hooks/useAllRecords';
import { CancelSession, SessionForm, SiteForm } from '../components/DistributionForms';
import { Pagination } from '../../../components/Pagination';
import { date, Demo, label, PageTitle, ResourceState } from '../../../components/Status';

export function Distribution() {
  const [offset, setOffset] = useState(0);
  const [siteOffset, setSiteOffset] = useState(0);
  const [lookup, setLookup] = useState('');
  const [search, setSearch] = useState('');
  const sessions = useResource<PickupSession[]>(`/staff/distribution/sessions?offset=${offset}`);
  const sites = useResource<PickupSite[]>(`/staff/pickup-sites?offset=${siteOffset}`);
  const requests = useAllRecords<AssistanceRequest>('/staff/assistance-requests?type=water_support');
  const siteChoices = useAllRecords<PickupSite>('/staff/pickup-sites');
  const refs = useReferences();
  const refresh = () => { void sessions.refresh(); void sites.refresh(); void requests.refresh(); void siteChoices.refresh(); };
  const find = (event: FormEvent) => { event.preventDefault(); setSearch(lookup.trim()); void requests.refresh(); };
  const matches = search ? requests.data?.filter(item => item.allocation?.reference.toLowerCase() === search.toLowerCase() || item.reference.toLowerCase() === search.toLowerCase()) : [];
  return <><PageTitle title="Water distribution"><button onClick={refresh}>Refresh stock and sessions</button></PageTitle>
    <section><h2>Find pickup reservation</h2><form className="lookup flex items-end gap-[12px] [&_.field]:flex-[1] [&_.field]:m-[0]" onSubmit={find}><label className="field flex flex-col gap-[6px] mb-[16px] max-w-[640px] [&_>_span:first-child]:font-[550]"><span>Pickup or request reference</span><input value={lookup} onChange={event => setLookup(event.target.value)} required /></label><button type="submit">Find reservation</button></form>
      {search && <ResourceState resource={requests}>
        {matches?.map(item => <p key={item.id}><a href={`#/assistance/${item.id}`}>{item.reference} · {item.allocation?.reference}</a> · {label(item.status)} · {item.allocation?.liters || item.details.requestedLiters} L</p>)}
        {!requests.loading && !requests.error && matches?.length === 0 && <p>No matching pickup or request reference. <a href="#/assistance">Review the assistance queue</a> for customer follow-up.</p>}
      </ResourceState>}
    </section>
    <section><h2>Pickup sessions</h2><p className="hint text-[#475569] text-[13px]">Remaining liters = total − reserved − collected. Acceptance and collection use current server stock; this view does not reserve water.</p>
      <ResourceState resource={sessions}>{sessions.data && <>
        {sessions.data.length === 0 && <p>No pickup sessions.</p>}
        {sessions.data.map(session => <article className="session [padding:20px_0] [border-bottom:1px_solid_#d3dce3]" key={`${session.id}:${session.version}`}><h3>{session.site.name} · {label(session.status)}</h3><Demo value={session.demo} />
          <p>{session.site.address}</p><p>{date(session.startsAt)} – {date(session.endsAt)}</p><p className="preserve whitespace-pre-wrap [overflow-wrap:anywhere]">{session.instructions}</p>
          <p>Zones: {session.zoneIds.map(id => refs.zones.data?.find(zone => zone.id === id)?.name || 'Unknown zone').join(', ')}</p>
          <table className="stock [@media(max-width:_760px)]:text-[12px] [@media(max-width:_760px)]:[&_th]:[padding:8px_4px] [@media(max-width:_760px)]:[&_td]:[padding:8px_4px]"><thead><tr><th>Total (L)</th><th>Reserved (L)</th><th>Collected (L)</th><th>Remaining (L)</th><th>Availability</th></tr></thead>
            <tbody><tr><td>{session.totalLiters}</td><td>{session.reservedLiters}</td><td>{session.collectedLiters}</td><td>{session.remainingLiters}</td><td>{label(session.availability)}</td></tr></tbody></table>
          <p className="hint text-[#475569] text-[13px]">Stock updated {date(session.updatedAt)}</p>
          {session.status !== 'cancelled' && <><details><summary>Edit stock / schedule</summary><SessionForm d={session} sites={siteChoices.data || []} zones={refs.zones.data || []} refresh={refresh} /></details>
            <details><summary>Cancel session and arrange follow-up</summary><CancelSession d={session} refresh={refresh} /></details></>}
        </article>)}
        <Pagination offset={offset} total={sessions.result?.page?.total ?? sessions.data.length} onChange={setOffset} />
      </>}</ResourceState>
      <details><summary>Create pickup session</summary><ResourceState resource={siteChoices} /><SessionForm sites={siteChoices.data || []} zones={refs.zones.data || []} refresh={refresh} /></details>
    </section>
    <section><h2>Pickup sites</h2><ResourceState resource={sites}>{sites.data && <>
      {sites.data.length === 0 && <p>No pickup sites.</p>}{sites.data.map(site => <article className="entry [padding:16px_0] [border-bottom:1px_solid_#dbe3e9] [&_p:last-child]:mb-[0] [&_+_.action-form]:mt-[20px]" key={`${site.id}:${site.version}`}><h3>{site.name} · {site.active ? 'Active' : 'Inactive'}</h3><Demo value={site.demo} /><p>{site.address}</p><p>{site.instructions}</p>
        <details><summary>Edit pickup site</summary><SiteForm d={site} refresh={refresh} /></details>
      </article>)}<Pagination offset={siteOffset} total={sites.result?.page?.total ?? sites.data.length} onChange={setSiteOffset} />
    </>}</ResourceState><details><summary>Create pickup site</summary><SiteForm refresh={refresh} /></details></section>
  </>;
}
