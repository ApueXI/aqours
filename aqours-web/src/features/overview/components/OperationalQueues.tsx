import type { Advisory, AssistanceRequest } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { useAllRecords } from '../../../hooks/useAllRecords';
import { date, label, ResourceState } from '../../../components/Status';

export function OperationalQueues() {
  const requests = useResource<AssistanceRequest[]>('/staff/assistance-requests?status=requested&limit=3');
  const advisories = useAllRecords<Advisory>('/staff/advisories');
  const published = advisories.data?.filter(item => item.state === 'published');
  return <div className="overview-work columns">
    <section><h2>Assistance awaiting review</h2><ResourceState resource={requests}>
      {requests.data && <>
        <p>{requests.result?.page?.total ?? requests.data.length} requested · Acceptance confirms an owner and checks availability.</p>
        {requests.data.length === 0 ? <p>No assistance is waiting for acceptance.</p> : <ul className="work-list">
          {requests.data.map(item => <li key={item.id}><div><strong>{item.reference}</strong><p>{label(item.type)} · Requested {date(item.createdAt)}</p></div><a href={`#/assistance/${item.id}`}>Review request</a></li>)}
        </ul>}
        <div className="actions"><a href="#/assistance?status=requested">Open requested assistance</a></div>
      </>}
    </ResourceState></section>
    <section><h2>Published advisories</h2><ResourceState resource={advisories}>
      {published && <>
        {published.length === 0 ? <p>No published advisories.</p> : <ul className="work-list">
          {published.slice(0, 3).map(item => <li key={item.id}><div><strong>{item.title}</strong><p>{label(item.kind)} · Updated {date(item.updatedAt)}</p></div><a href={`#/advisories/${item.id}`}>View advisory</a></li>)}
        </ul>}
        <div className="actions"><a href="#/advisories">Review all advisories</a></div>
      </>}
    </ResourceState><p className="hint">Quality restrictions remain in effect until an administrator explicitly lifts them.</p></section>
  </div>;
}
