import { useEffect, useState } from 'react';
import type { SupplierMonitoringNotification } from '@aqours/contracts';
import { useResource } from '../../../hooks/useResource';
import { ActionForm } from '../../../components/ActionForm';
import { Pagination } from '../../../components/Pagination';
import { date, ResourceState } from '../../../components/Status';
const day = (value: string) => new Date(value).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' });

export function MonitoringNotifications() {
  const [offset, setOffset] = useState(0);
  const notifications = useResource<SupplierMonitoringNotification[]>(`/staff/distribution/notifications?offset=${offset}`);
  useEffect(() => { const timer = window.setInterval(() => void notifications.refresh(), 30000); return () => window.clearInterval(timer); }, [notifications.refresh]);
  const unread = notifications.data?.filter(item => !item.readAt).length;
  return <details><summary>My monitoring notifications{unread ? ` · ${unread} unread on this page` : ''}</summary><section><ResourceState resource={notifications}>
    {notifications.data?.length === 0 && <p>No monitoring notifications.</p>}
    {notifications.data?.map((notification, index, all) => <div key={notification.id}>
      {(index === 0 || day(all[index - 1].createdAt) !== day(notification.createdAt)) && <h3 className="notification-date">{day(notification.createdAt)}</h3>}
      <article className="entry notification-row" data-read={Boolean(notification.readAt)}><div><h3>{notification.title}</h3><p>{notification.text}</p>
      <p className="read-state">{date(notification.createdAt)} · {notification.readAt ? `Read ${date(notification.readAt)}` : 'Unread'}</p>
      <a href={`#/distribution?tab=monitoring&siteId=${encodeURIComponent(notification.siteId)}`}>Review pickup site</a></div>
      {!notification.readAt && <ActionForm path={`/staff/distribution/notifications/${notification.id}/read`} submit="Mark notification read" fields={[]} onDone={() => void notifications.refresh()} />}
    </article></div>)}
    {notifications.data && <Pagination offset={offset} total={notifications.result?.page?.total ?? notifications.data.length} onChange={setOffset} />}
  </ResourceState></section></details>;
}
