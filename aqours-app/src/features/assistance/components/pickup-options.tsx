import type { PickupSession } from '@aqours/contracts';
import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Demo, Section, styles } from '@/components/ui';
import { Paging, ResourceState } from '@/components/resource-state';
import { useResource } from '@/hooks/use-resource';
import { displayTime, label } from '@/utils/time';

export function PickupOptions({ reportId, selected, onChange, onCallback, disabled }: {
  reportId: string; selected: string | null; onChange(id: string): void; onCallback(): void; disabled: boolean;
}) {
  const [offset, setOffset] = useState(0);
  const sessions = useResource<PickupSession[]>(`/pickup-sessions?reportId=${encodeURIComponent(reportId)}&limit=30&offset=${offset}`);
  return <Section title="Eligible pickup sessions">
    <Body muted>Availability is informational. Stock is reserved only after supplier acceptance. This is pickup, with no home delivery.</Body>
    <ResourceState {...sessions} empty={sessions.data?.length === 0 && 'No eligible pickup sessions are listed.'} />
    {sessions.data?.map((session) => <View key={session.id} style={styles.item}>
      <Demo visible={session.demo || session.site.demo} />
      <Body>{session.site.name}</Body><Body>{session.site.address}</Body>
      <Body muted>{displayTime(session.startsAt)} to {displayTime(session.endsAt)}</Body>
      <Body>{label(session.status)} · {label(session.availability)} · {session.remainingLiters} L currently remaining</Body>
      <Body>{session.site.instructions}</Body><Body>{session.instructions}</Body>
      <Button title={selected === session.id ? 'Selected session' : 'Select this session'} secondary selected={selected === session.id}
        disabled={disabled || session.availability !== 'available' || session.status !== 'open'} onPress={() => onChange(session.id)} />
    </View>)}
    <Paging offset={offset} total={sessions.page?.total} onChange={setOffset} />
    <Button title="Request callback/support instead" secondary disabled={disabled} onPress={onCallback} />
    <Button title="Refresh pickup availability" secondary disabled={disabled} onPress={() => void sessions.reload()} />
  </Section>;
}
