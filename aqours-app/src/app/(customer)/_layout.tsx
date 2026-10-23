import { NotificationAccess } from '@/features/notifications/components/notification-access';
import { Redirect, Stack, type Href } from 'expo-router';
import { useSession } from '@/features/auth/hooks/session';
import { Loading, Screen, colors } from '@/components/ui';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function CustomerLayout() {
  const { user, loading } = useSession();
  if (loading) return <Screen title="Aqours" navigation={false}><Loading text="Checking your session…" /></Screen>;
  if (!user) return <Redirect href={'/login' as Href} />;
  return <Stack key={user.id} screenOptions={{ headerRight: () => <NotificationAccess />, headerTitle: 'Aqours', headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.action,
    contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="service" options={{ title: 'Service updates' }} />
    <Stack.Screen name="reports/new" options={{ title: 'New report' }} />
    <Stack.Screen name="reports/[id]" options={{ title: 'Report' }} />
    <Stack.Screen name="assistance/new" options={{ title: 'New request' }} />
    <Stack.Screen name="assistance/[id]" options={{ title: 'Assistance request' }} />
    <Stack.Screen name="advisories/[id]" options={{ title: 'Service advisory' }} />
    <Stack.Screen name="incidents/[id]" options={{ title: 'Service incident' }} />
  </Stack>;
}
