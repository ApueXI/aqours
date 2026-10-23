import type { Notification } from '@aqours/contracts';
import { Button, navigate } from '@/components/ui';
import { useResource } from '@/hooks/use-resource';

export function NotificationAccess() {
  const resource = useResource<Notification[]>('/notifications?limit=100', true);
  const count = resource.error ? 0 : resource.data?.filter(item => !item.readAt).length || 0;
  return <Button title={`Updates${count ? ` (${count}${(resource.page?.total || 0) > 100 ? '+' : ''})` : ''}`}
    accessibilityLabel={resource.error ? 'Notifications, refresh unavailable' : `Notifications${count ? `, ${count} unread in latest updates` : ''}`}
    secondary onPress={() => navigate('/notifications')} />;
}
