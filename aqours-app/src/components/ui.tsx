import { router, type Href } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';
import { Brand } from '@/components/brand';

export const colors = {
  background: '#f7f8f8', surface: '#ffffff', text: '#20312f', muted: '#56625f',
  border: '#dde3e1', action: '#0f766e', actionPressed: '#115e59', tint: '#e7f3f1',
  danger: '#a63030', dangerTint: '#fff1f1', warning: '#805400', warningTint: '#fff7df',
};
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32, gap: 20, maxWidth: 680, width: '100%', alignSelf: 'center' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700', color: colors.text },
  heading: { fontSize: 19, lineHeight: 26, fontWeight: '600', color: colors.text },
  text: { fontSize: 16, lineHeight: 24, color: colors.text },
  muted: { fontSize: 14, lineHeight: 21, color: colors.muted },
  error: { color: colors.danger, fontSize: 15, lineHeight: 23 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  section: { gap: 12, padding: 16, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 8 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 6, padding: 12, minHeight: 48, color: colors.text, fontSize: 16 },
  button: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 48, borderRadius: 6, backgroundColor: colors.action, justifyContent: 'center', borderWidth: 1, borderColor: colors.action },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  buttonText: { color: '#ffffff', fontWeight: '600', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  secondaryText: { color: colors.text },
  selected: { borderColor: colors.action, backgroundColor: colors.tint },
  focused: { outlineColor: colors.action, outlineWidth: 2, outlineOffset: 2 },
  item: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  notice: { padding: 12, gap: 8, borderWidth: 1, borderColor: '#e8bcbc', backgroundColor: colors.dangerTint, borderRadius: 6 },
});

export function navigate(path: string) { router.push(path as Href); }

export function Screen({ title, children, navigation = true, scrollKey, scrollable = true, tabbed = false }: {
  title: string; children: ReactNode; navigation?: boolean; scrollKey?: string | number; scrollable?: boolean; tabbed?: boolean;
}) {
  const scroll = useRef<ScrollView>(null);
  const previousKey = useRef(scrollKey);
  const keyboardFrame = useRef<View>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const compact = useKeyboardVisible(!scrollable);
  const insets = useSafeAreaInsets();
  const scrollBottom = 32 + (navigation && !tabbed ? insets.bottom : 0);
  return <SafeAreaView style={styles.page} edges={navigation ? scrollable ? ['left', 'right'] : ['left', 'right', 'bottom'] : ['top', 'bottom', 'left', 'right']}>
    <View ref={keyboardFrame} collapsable={false} style={{ flex: 1 }} onLayout={() => {
      if (!scrollable) keyboardFrame.current?.measureInWindow((_, top) => setKeyboardOffset(top));
    }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : !scrollable ? 'height' : undefined}
      keyboardVerticalOffset={!scrollable ? keyboardOffset : 0}>
      {scrollable ? <ScrollView ref={scroll} contentContainerStyle={[styles.content, { paddingBottom: scrollBottom }]} keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          if (previousKey.current !== scrollKey) { previousKey.current = scrollKey; scroll.current?.scrollTo({ y: 0, animated: false }); }
        }}>
        {title === 'Aqours' ? <Brand /> : <Text accessibilityRole="header" style={styles.title}>{title}</Text>}
        {children}
      </ScrollView> : <View style={[styles.content, { flex: 1, padding: compact ? 12 : 16, paddingBottom: compact ? 12 : 16, gap: compact ? 8 : 12 }]}>
        {title === 'Aqours' ? <Brand /> : <Text accessibilityRole="header" style={[styles.title, compact && { fontSize: 16, lineHeight: 22 }]}>{title}</Text>}{children}
      </View>}
    </KeyboardAvoidingView>
    </View>
  </SafeAreaView>;
}

export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return <View style={styles.section}>{title && <Text accessibilityRole="header" style={styles.heading}>{title}</Text>}{children}</View>;
}

export function Body({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <Text style={muted ? styles.muted : styles.text}>{children}</Text>;
}

export function Button({ title, onPress, disabled, secondary = false, selected = false, accessibilityLabel }: {
  title: string; onPress(): void; disabled?: boolean; secondary?: boolean; selected?: boolean; accessibilityLabel?: string;
}) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled: !!disabled, selected }} onPress={onPress} disabled={disabled}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, selected && styles.selected, focused && styles.focused,
      pressed && { backgroundColor: secondary ? colors.tint : colors.actionPressed }, disabled && { opacity: 0.5 }]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>
  </Pressable>;
}

export function Field({ label, hint, error, ...props }: TextInputProps & { label: string; hint?: string; error?: string | null }) {
  const [focused, setFocused] = useState(false);
  return <View style={{ gap: 6 }}><Text style={[styles.text, { fontWeight: '500' }]}>{label}</Text>
    {hint && <Text style={styles.muted}>{hint}</Text>}
    <TextInput {...props} accessibilityLabel={label} accessibilityHint={error || hint} placeholderTextColor={colors.muted}
      onFocus={event => { setFocused(true); props.onFocus?.(event); }} onBlur={event => { setFocused(false); props.onBlur?.(event); }}
      style={[styles.input, props.multiline && { minHeight: 104, textAlignVertical: 'top' }, focused && { borderColor: colors.action, outlineColor: colors.action, outlineWidth: 1 }, error && { borderColor: colors.danger }, props.style]} />
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}

export function ErrorNotice({ error, retry }: { error: string | null; retry?: () => void }) {
  if (!error) return null;
  return <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.notice}><Text style={styles.error}>{error}</Text>
    {retry && <Button title="Try again" secondary onPress={retry} />}
  </View>;
}

export function Loading({ text = 'Loading…' }: { text?: string }) {
  return <View accessibilityLiveRegion="polite" style={styles.row}><ActivityIndicator color={colors.action} /><Body muted>{text}</Body></View>;
}

export function Demo({ visible }: { visible: boolean | undefined }) {
  return visible ? <Text style={{ color: colors.danger, fontWeight: '600', fontSize: 14 }}>Demonstration data — fictional scenario</Text> : null;
}

export function Choices<T extends string>({ values, value, onChange, disabled, labels }: {
  values: readonly T[]; value: T | null; onChange(value: T): void; disabled?: boolean; labels?: Partial<Record<T, string>>;
}) {
  return <View style={styles.row}>{values.map((item) => <Button key={item} title={labels?.[item] ?? item.replaceAll('_', ' ').replace(/^./, letter => letter.toUpperCase())} secondary selected={item === value}
    disabled={disabled} onPress={() => onChange(item)} />)}</View>;
}
