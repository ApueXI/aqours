import { useEffect, useState } from 'react';
import type { Notification } from '@aqours/contracts';
import { PageTitle, ResourceState, date } from '../../../components/Status';
import { ActionForm } from '../../../components/ActionForm';
import { Pagination } from '../../../components/Pagination';
import { useResource } from '../../../hooks/useResource';
import { MonitoringNotifications } from '../../distribution/components/MonitoringNotifications';

export function Notifications() {
  const [offset, setOffset] = useState(0);
  const resource = useResource<Notification[]>(`/staff/notifications?offset=${offset}`);
  useEffect(() => { const timer = window.setInterval(() => void resource.refresh(), 30000); return () => window.clearInterval(timer); }, [resource.refresh]);
  return <><PageTitle title="Notifications"><button onClick={() => void resource.refresh()}>Refresh notifications</button></PageTitle>
    <h2>Customer activity</h2>
    <ResourceState resource={resource}>{resource.data?.length === 0 && <p>No customer activity notifications yet. New reports, messages and assistance requests appear here.</p>}
      {resource.data?.map(item => <article className="entry" key={item.id}>
        <h3>{item.title}</h3><p>{item.text}</p><p className="hint">{date(item.createdAt)} · {item.readAt ? 'Read' : 'Unread'}</p>
        {['report', 'assistance'].includes(item.targetType) && <a href={`#/${item.targetType === 'report' ? 'reports' : 'assistance'}/${encodeURIComponent(item.targetId)}${item.title === 'Customer message' ? '?view=messages' : ''}`}>Open {item.targetType === 'report' ? 'report' : 'request'}</a>}
        {!item.readAt && <ActionForm path={`/staff/notifications/${item.id}/read`} method="PATCH" fields={[]} submit="Mark read" onDone={() => { void resource.refresh(); window.dispatchEvent(new Event('aqours-notifications-read')); }} />}
      </article>)}
      {resource.data && <Pagination offset={offset} total={resource.result?.page?.total ?? resource.data.length} onChange={setOffset} />}
    </ResourceState>
    <h2>Pickup-site monitoring</h2><MonitoringNotifications />
  </>;
}
