import { useEffect, useState } from 'react';
import type { SupplierMonitoringNotification } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { ActionForm } from '../../../components/ActionForm';
import { Pagination } from '../../../components/Pagination';
import { date, ResourceState } from '../../../components/Status';

export function MonitoringNotifications() {
  const [offset, setOffset] = useState(0);
  const notifications = useResource<SupplierMonitoringNotification[]>(`/staff/distribution/notifications?offset=${offset}`);
  useEffect(() => { const timer = window.setInterval(() => void notifications.refresh(), 30000); return () => window.clearInterval(timer); }, [notifications.refresh]);
  return <details><summary>My monitoring notifications</summary><section><ResourceState resource={notifications}>
    {notifications.data?.length === 0 && <p>No monitoring notifications.</p>}
    {notifications.data?.map(notification => <article className="entry" key={notification.id}><h3>{notification.title}</h3><p>{notification.text}</p>
      <p className="hint">{date(notification.createdAt)} · {notification.readAt ? `Read ${date(notification.readAt)}` : 'Unread'}</p>
      {!notification.readAt && <ActionForm path={`/staff/distribution/notifications/${notification.id}/read`} submit="Mark notification read" fields={[]} onDone={() => void notifications.refresh()} />}
    </article>)}
    {notifications.data && <Pagination offset={offset} total={notifications.result?.page?.total ?? notifications.data.length} onChange={setOffset} />}
  </ResourceState></section></details>;
}
