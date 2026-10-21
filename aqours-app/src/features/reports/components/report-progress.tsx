import { View, Text } from 'react-native';
import { colors, styles } from '@/components/ui';
import { reportSteps } from '../utils/report-draft';

export function ReportProgress({ step }: { step: number }) {
  return <View style={{ gap: 8 }} accessibilityLabel={`Step ${step + 1} of ${reportSteps.length}: ${reportSteps[step]}`} accessibilityLiveRegion="polite">
    <Text style={[styles.text, { fontWeight: '600' }]}>Step {step + 1} of {reportSteps.length} · {reportSteps[step]}</Text>
    <View style={{ flexDirection: 'row', gap: 6 }} accessible={false}>
      {reportSteps.map((name, index) => <View key={name} style={{ flex: 1, height: 4, backgroundColor: index <= step ? colors.action : colors.border }} />)}
    </View>
  </View>;
}
