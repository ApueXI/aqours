import { useState, type ComponentProps, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Body, Button, ErrorNotice, colors, styles } from '@/components/ui';
import { ResourceState } from '@/components/resource-state';

export function ConversationStatus({ resource, error, uncertain, children }: {
  resource: ComponentProps<typeof ResourceState>; error: string | null; uncertain: boolean; children: ReactNode;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const status = uncertain ? 'Delivery unconfirmed' : error ? 'Message not sent'
    : resource.error ? 'Messages could not refresh' : resource.loading ? 'Refreshing messages'
      : resource.stale ? 'Showing previous messages' : '';
  const statusKey = `${status}:${resource.receivedAt || ''}:${error || ''}`;
  const showDetails = Boolean(status) && expanded === statusKey;
  return <View style={{ flex: 1, gap: 8 }}>
    {!!status && <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={[styles.muted, { flex: 1 }]}>{status}</Text>
      <Button title={showDetails ? 'Messages' : 'Details'} secondary
        accessibilityLabel={showDetails ? 'Return to report messages' : 'Show conversation status details'} onPress={() => setExpanded(showDetails ? null : statusKey)} />
    </View>}
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }} pointerEvents={showDetails ? 'none' : 'auto'} accessibilityElementsHidden={showDetails}
        importantForAccessibility={showDetails ? 'no-hide-descendants' : 'auto'}>{children}</View>
      {showDetails && <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingBottom: 16 }} accessibilityLabel="Conversation status details">
          <Text accessibilityRole="header" style={styles.heading}>Conversation status</Text>
          <ResourceState {...resource} />
          <ErrorNotice error={error} />
          {uncertain && <Body muted>Delivery is unconfirmed. Retry this same message.</Body>}
        </ScrollView>
      </View>}
    </View>
  </View>;
}
