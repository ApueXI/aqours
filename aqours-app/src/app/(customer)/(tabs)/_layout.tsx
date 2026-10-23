import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, Text, useWindowDimensions } from 'react-native';
import { colors } from '@/components/ui';

const destinations = [
  { name: 'index', title: 'Home', ios: 'house', android: 'home' },
  { name: 'reports', title: 'Reports', ios: 'doc.text', android: 'description' },
  { name: 'assistance', title: 'Assistance', ios: 'bubble.left', android: 'support_agent' },
  { name: 'notifications', title: 'Updates', ios: 'bell', android: 'notifications' },
  { name: 'profile', title: 'Profile', ios: 'person.crop.circle', android: 'account_circle' },
] as const;

export default function CustomerTabs() {
  const { fontScale } = useWindowDimensions();
  const symbolSize = Platform.OS === 'android' ? 23 / fontScale : 23;
  return <Tabs screenOptions={{
    headerTitle: 'Aqours', headerTitleAlign: 'left', headerShadowVisible: false,
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
  </Tabs>;
}
