import type { Advisory } from '@aqours/contracts';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Body, Demo, Screen, Section, styles } from '@/components/ui';
import { ResourceState } from '@/components/resource-state';
import { useResource } from '@/hooks/use-resource';
import { displayTime, label } from '@/lib/time';

export default function AdvisoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const advisory = useResource<Advisory>(`/advisories/${id}`, true);
  return <Screen title="Advisory">
    <ResourceState {...advisory} />
    {advisory.data && <>
      <Demo visible={advisory.data.demo} />
      <Section title={advisory.data.title}>
        <Body>{label(advisory.data.kind)} · {label(advisory.data.state)}</Body><Body>{advisory.data.text}</Body>
        <Body muted>Source: {advisory.data.source}</Body><Body muted>Updated {displayTime(advisory.data.updatedAt)} · Revision {advisory.data.version}</Body>
        <Body muted>Published {displayTime(advisory.data.publishedAt)}</Body>
        {advisory.data.liftedAt ? <Body>Lifted {displayTime(advisory.data.liftedAt)}: {advisory.data.liftReason}</Body>
          : ['boil_water', 'do_not_drink', 'do_not_use'].includes(advisory.data.kind) && <Body>This restriction remains in effect until the supplier explicitly lifts it.</Body>}
      </Section>
      {!!advisory.data.revisions?.length && <Section title="Revision history">{advisory.data.revisions.map((revision) => <View key={revision.version} style={styles.item}>
        <Body>Revision {revision.version} · {label(revision.action)}</Body><Body>{revision.text}</Body>
        <Body muted>{revision.source} · {displayTime(revision.createdAt)}</Body>
      </View>)}</Section>}
    </>}
  </Screen>;
}
