import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider } from '@/features/auth/hooks/session';
import { colors } from '@/components/ui';

export default function RootLayout() {
  return <SessionProvider>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
  </SessionProvider>;
}
