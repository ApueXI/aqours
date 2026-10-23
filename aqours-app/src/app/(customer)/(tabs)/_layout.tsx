import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, Text, useWindowDimensions } from 'react-native';
import { NotificationAccess } from '@/features/notifications/components/notification-access';
import { colors } from '@/components/ui';
import { Brand } from '@/components/brand';

const destinations = [
  { name: 'index', title: 'Home', ios: 'house', android: 'home' },
  { name: 'reports', title: 'Reports', ios: 'doc.text', android: 'description' },
  { name: 'messages', title: 'Messages', ios: 'bubble.left', android: 'chat' },
  { name: 'weather', title: 'Weather', ios: 'cloud.sun', android: 'cloud' },
  { name: 'profile', title: 'Settings', ios: 'person.crop.circle', android: 'account_circle' },
] as const;

export default function CustomerTabs() {
  const { fontScale } = useWindowDimensions();
  const symbolSize = Platform.OS === 'android' ? 23 / fontScale : 23;
  return <Tabs screenOptions={{
    headerRight: () => <NotificationAccess />,
    headerTitle: () => <Brand />, headerTitleAlign: 'left', headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text,
    tabBarActiveTintColor: colors.action, tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
    tabBarLabelStyle: { fontSize: 12, fontWeight: '600' }, tabBarItemStyle: { minHeight: 48 },
    tabBarHideOnKeyboard: true,
  }}>
    {destinations.map(item => <Tabs.Screen key={item.name} name={item.name} options={{
      title: item.title, tabBarAccessibilityLabel: `${item.title} tab`,
      tabBarLabel: ({ color }) => <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}
        style={{ fontSize: 12, fontWeight: '600', color, textAlign: 'center' }}>{item.title}</Text>,
      tabBarIcon: ({ color }) => <SymbolView name={{ ios: item.ios, android: item.android, web: item.android }} size={symbolSize}
        style={{ width: 23, height: 23, alignItems: 'center', justifyContent: 'center' }} tintColor={color} />,
    }} />)}
    <Tabs.Screen name="notifications" options={{ href: null, title: 'Notifications' }} />
    <Tabs.Screen name="assistance" options={{ href: null, title: 'Assistance' }} />
  </Tabs>;
}
