import { router, Stack, useFocusEffect, type Href } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, Pressable, Text } from 'react-native';
import { colors } from './ui';

export function FormBack({ previous, locked, fallback }: { previous?: () => void; locked: boolean; fallback: string }) {
  const back = useCallback(() => {
    if (locked) return;
    if (previous) previous();
    else if (router.canGoBack()) router.back();
    else router.replace(fallback as Href);
  }, [previous, locked, fallback]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (locked || previous) { back(); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [back, locked, previous]));
  return <Stack.Screen options={{ gestureEnabled: false, headerBackVisible: false, headerLeft: () =>
    <Pressable accessibilityRole="button" accessibilityLabel="Back" accessibilityState={{ disabled: locked }} disabled={locked}
      onPress={back} style={{ minWidth: 56, minHeight: 44, justifyContent: 'center' }}>
      <Text style={{ color: colors.action, fontSize: 16 }}>Back</Text>
    </Pressable>,
  }} />;
}
