import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const colors = { background: '#faf8f5', surface: '#ffffff', text: '#332a22', muted: '#665e55', border: '#d8d3ca', action: '#765126', danger: '#9f2d22' };
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 16, maxWidth: 680, width: '100%', alignSelf: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  heading: { fontSize: 19, fontWeight: '600', color: colors.text },
  text: { fontSize: 16, lineHeight: 23, color: colors.text },
  muted: { fontSize: 14, lineHeight: 21, color: colors.muted },
  error: { color: colors.danger, fontSize: 15, lineHeight: 23 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  section: { gap: 12, borderBottomColor: colors.border, borderBottomWidth: 1, paddingBottom: 20 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 6, padding: 12, minHeight: 48, color: colors.text, fontSize: 16 },
  button: { paddingHorizontal: 14, paddingVertical: 12, minHeight: 46, borderRadius: 6, backgroundColor: colors.action, justifyContent: 'center' },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  buttonText: { color: '#ffffff', fontWeight: '600', fontSize: 15, textAlign: 'center' },
  secondaryText: { color: colors.text },
  selected: { borderColor: colors.action, borderWidth: 2 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 5 },
});

export function navigate(path: string) { router.push(path as Href); }

export function Screen({ title, children, navigation = true }: { title: string; children: ReactNode; navigation?: boolean }) {
  return <SafeAreaView style={styles.page} edges={['bottom', 'left', 'right']}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {navigation && <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel="Main navigation">
          <View style={styles.row}>
            {[['Home', '/'], ['Reports', '/reports'], ['Assistance', '/assistance'], ['Updates', '/notifications'], ['Profile', '/profile']].map(([name, path]) =>
              <Button key={path} title={name} secondary onPress={() => navigate(path)} />)}
          </View>
        </ScrollView>}
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return <View style={styles.section}>{title && <Text accessibilityRole="header" style={styles.heading}>{title}</Text>}{children}</View>;
}

export function Body({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <Text style={muted ? styles.muted : styles.text}>{children}</Text>;
}

export function Button({ title, onPress, disabled, secondary = false, selected = false }: {
  title: string; onPress(): void; disabled?: boolean; secondary?: boolean; selected?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled, selected }} onPress={onPress} disabled={disabled}
    style={[styles.button, secondary && styles.secondary, selected && styles.selected, disabled && { opacity: 0.5 }]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>
  </Pressable>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 6 }}><Text style={styles.text}>{label}</Text>
    <TextInput {...props} accessibilityLabel={label} placeholderTextColor={colors.muted}
      style={[styles.input, props.multiline && { minHeight: 96, textAlignVertical: 'top' }, props.style]} />
  </View>;
}

export function ErrorNotice({ error, retry }: { error: string | null; retry?: () => void }) {
  if (!error) return null;
  return <View accessibilityLiveRegion="polite" style={{ gap: 8 }}><Text style={styles.error}>{error}</Text>
    {retry && <Button title="Retry" secondary onPress={retry} />}
  </View>;
}

export function Loading({ text = 'Loading…' }: { text?: string }) {
  return <View style={styles.row}><ActivityIndicator color={colors.action} /><Body muted>{text}</Body></View>;
}

export function Demo({ visible }: { visible: boolean | undefined }) {
  return visible ? <Text style={{ color: colors.danger, fontWeight: '600', fontSize: 14 }}>Demonstration data — fictional scenario</Text> : null;
}

export function Choices<T extends string>({ values, value, onChange, disabled }: {
  values: readonly T[]; value: T | null; onChange(value: T): void; disabled?: boolean;
}) {
  return <View style={styles.row}>{values.map((item) => <Button key={item} title={item.replaceAll('_', ' ')} secondary selected={item === value}
    disabled={disabled} onPress={() => onChange(item)} />)}</View>;
}
