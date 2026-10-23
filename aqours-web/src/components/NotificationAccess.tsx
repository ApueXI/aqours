import { FiBell } from 'react-icons/fi';
import { useEffect } from 'react';
import type { Notification, SupplierMonitoringNotification } from '@aqours/contracts';
import { useResource } from '../hooks/useResource';

export function NotificationAccess() {
  const resource = useResource<Notification[]>('/staff/notifications?limit=100');
  const monitoring = useResource<SupplierMonitoringNotification[]>('/staff/distribution/notifications?limit=100');
  useEffect(() => {
    const refresh = () => { void resource.refresh(); void monitoring.refresh(); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('aqours-notifications-read', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('aqours-notifications-read', refresh); };
  }, [resource.refresh, monitoring.refresh]);
  const unread = [resource, monitoring].reduce((sum, item) => sum + (item.error ? 0 : item.data?.filter(n => !n.readAt).length || 0), 0);
  const partial = [resource, monitoring].some(item => (item.result?.page?.total || 0) > 100);
  return <a href="#/notifications" aria-label={`Notifications${unread ? `, ${unread} unread in latest alerts` : ''}`}>
    <FiBell aria-hidden="true" />Notifications{unread ? ` (${unread}${partial ? '+' : ''})` : ''}
    {resource.error || monitoring.error ? ' · unavailable' : ''}
  </a>;
}
