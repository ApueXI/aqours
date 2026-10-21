import type { Notification } from '@aqours/contracts';
import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, ErrorNotice, Screen, styles, navigate } from '@/components/ui';
import { Paging, ResourceState } from '@/components/resource-state';
import { useSession } from '@/features/auth/hooks/session';
import { useResource } from '@/hooks/use-resource';
import { errorText } from '@/services/http-client';
import { StatusLabel } from '@/components/status-label';
import { displayTime } from '@/utils/time';

const destinations = { report: '/reports/', incident: '/incidents/', advisory: '/advisories/', assistance: '/assistance/' };

export function NotificationsScreen() {
  const { api } = useSession();
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const resource = useResource<Notification[]>(`/notifications?offset=${offset}&limit=30`, true);

  async function open(notification: Notification) {
    if (busy) return;
    setBusy(notification.id); setError(null);
    try {
      const current = await api<Notification>(`/notifications/${notification.id}`);
      if (!current.data.readAt) await api(`/notifications/${notification.id}/read`, { method: 'PATCH', body: {} });
      const target = current.data;
      if (!Object.hasOwn(destinations, target.targetType) || !/^[a-zA-Z0-9-]+$/.test(target.targetId)) throw new Error('This notification has no supported destination.');
      // Every destination fetches its current record through its normal authorized endpoint.
      navigate(`${destinations[target.targetType]}${target.targetId}`);
    } catch (failure) { setError(errorText(failure)); }
    finally { setBusy(null); }
  }

  return <Screen title="Updates">
    <Body muted>Messages from your supplier and changes to your reports and requests appear here.</Body>
    <ResourceState {...resource} empty={resource.data?.length === 0 && 'No updates yet.'} />
    <ErrorNotice error={error} />
    {resource.data?.map((notification) => <View key={notification.id} style={styles.item}>
      <StatusLabel value={notification.readAt ? 'read' : 'unread'} /><Body>{notification.title}</Body><Body>{notification.text}</Body>
      <Body muted>{displayTime(notification.createdAt)}</Body>
      <Button title={busy === notification.id ? 'Opening…' : 'Open update'} secondary disabled={!!busy} onPress={() => void open(notification)} />
    </View>)}
    <Paging offset={offset} total={resource.page?.total} onChange={setOffset} />
    <Button title="Refresh updates" secondary onPress={() => void resource.reload()} />
  </Screen>;
}
