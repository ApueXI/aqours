import { Text, View } from 'react-native';
import { label } from '@/utils/time';
import { colors } from './ui';

const completed = new Set(['resolved', 'completed', 'collected', 'lifted']);
const pending = new Set(['received', 'requested', 'investigating', 'under_review', 'monitoring']);
const stopped = new Set(['cancelled', 'unavailable', 'released']);

export function StatusLabel({ value }: { value: string }) {
  const tone = completed.has(value) ? { color: '#16634c', background: '#e9f4ee' }
    : pending.has(value) ? { color: colors.warning, background: colors.warningTint }
    : stopped.has(value) ? { color: colors.muted, background: '#edf0ef' }
    : { color: colors.actionPressed, background: colors.tint };
  return <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: tone.background, borderRadius: 4 }}>
    <Text style={{ color: tone.color, fontSize: 14, lineHeight: 20, fontWeight: '600' }}>{label(value)}</Text>
  </View>;
}
