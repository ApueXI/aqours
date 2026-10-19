import type { IncidentUpdate, TimelineEvent } from '@aqours/contracts';
import { View } from 'react-native';
import { displayTime, label } from '@/utils/time';
import { Body, Demo, Section, styles } from './ui';

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return <Section title="Timeline">
    {!events.length && <Body muted>No updates yet.</Body>}
    {events.map((event) => <View key={event.id} style={styles.item}>
      <Body>{label(event.action)}</Body><Body>{event.text}</Body>
      {event.appointmentChange && <Body muted>{event.appointmentChange.from
        ? `Agreed appointment changed from ${displayTime(event.appointmentChange.from)} to ${displayTime(event.appointmentChange.to)}`
        : `Agreed appointment: ${displayTime(event.appointmentChange.to)}`}</Body>}
      <Body muted>{displayTime(event.createdAt)}</Body>
    </View>)}
  </Section>;
}

export function IncidentUpdates({ updates }: { updates: IncidentUpdate[] }) {
  return <Section title="Published incident updates">
    {updates.map((update) => <View key={update.id} style={styles.item}>
      <Demo visible={update.demo} /><Body>{label(update.status)} · {update.area}</Body>
      <Body>{update.progress}</Body>
      <Body muted>Restoration estimate: {displayTime(update.restorationAt)}</Body>
      <Body muted>Published {displayTime(update.publishedAt)}</Body>
    </View>)}
  </Section>;
}
