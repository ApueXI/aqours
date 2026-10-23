import { useEffect, useState } from 'react';
import type { ConversationSummary } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { date, label, PageTitle, ResourceState } from '../../../components/Status';
import { Pagination } from '../../../components/Pagination';

export function Messages() {
  const [offset, setOffset] = useState(0);
  const resource = useResource<ConversationSummary[]>(`/staff/messages?offset=${offset}`);
  useEffect(() => { const timer = window.setInterval(() => void resource.refresh(), 30000); return () => window.clearInterval(timer); }, [resource.refresh]);
  return <><PageTitle title="Messages"><button onClick={() => void resource.refresh()}>Refresh messages</button></PageTitle>
    <p>Conversations are attached to customer reports. Open a conversation to read its history and reply.</p>
    <ResourceState resource={resource}>{resource.data?.length === 0 && <p>No customer reports yet.</p>}
      {resource.data?.map(item => <article className="entry" key={item.reportId}>
        <h2><a href={`#/reports/${encodeURIComponent(item.reportId)}?view=messages&returnTo=/messages`}>{item.reference} · {label(item.category)}</a></h2>
        <p>{item.latestMessage ? `${item.latestMessage.authorRole === 'customer' ? 'Customer' : 'Supplier'}: ${item.latestMessage.text}` : item.description}</p>
        <p className="hint">{date(item.updatedAt)} · {label(item.status)}{!item.latestMessage ? ' · No messages yet' : ''}</p>
      </article>)}
      {resource.data && <Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} />}
    </ResourceState>
  </>;
}
