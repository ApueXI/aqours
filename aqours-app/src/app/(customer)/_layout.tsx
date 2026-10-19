import { Redirect, Stack, type Href } from 'expo-router';
import { useSession } from '@/auth/session';
import { Loading, Screen, colors } from '@/components/ui';

export default function CustomerLayout() {
  const { user, loading } = useSession();
  if (loading) return <Screen title="Aqours" navigation={false}><Loading text="Checking your session…" /></Screen>;
  if (!user) return <Redirect href={'/login' as Href} />;
  return <Stack key={user.id} screenOptions={{ headerTitle: 'Aqours', headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.background } }} />;
}
