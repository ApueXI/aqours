import type { AssistanceRequest, AssistanceType } from '@aqours/contracts';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Body, Button, Choices, Screen, navigate, styles } from '@/components/ui';
import { StatusLabel } from '@/components/status-label';
import { Paging, ResourceState } from '@/components/resource-state';
import { useResource } from '@/hooks/use-resource';
import { displayTime } from '@/utils/time';
import { assistanceNames } from '../components/assistance-summary';

export default function AssistanceList() {
  const [offset, setOffset] = useState(0);
  const [type, setType] = useState<AssistanceType | 'all'>('all');
  const resource = useResource<AssistanceRequest[]>(`/assistance-requests?offset=${offset}&limit=30${type === 'all' ? '' : `&type=${type}`}`);
  return <Screen title="Assistance" tabbed>
    <Body muted>Choose a report to request callback/support, inspection, or water pickup.</Body>
    <Button title="Choose a report for assistance" secondary onPress={() => navigate('/reports')} />
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ paddingBottom: 8 }}>
    <Choices values={['all', 'callback', 'inspection', 'water_support'] as const} labels={{ all: 'All', ...assistanceNames }} value={type} onChange={(value) => { setType(value); setOffset(0); }} />
    </ScrollView>
    <ResourceState {...resource} empty={resource.data?.length === 0 && 'No assistance requests match this view.'} />
    {resource.data?.map((item) => <View key={item.id} style={styles.item}>
      <StatusLabel value={item.status} /><Body>{item.reference} · {assistanceNames[item.type]}</Body>
      <Body muted>Updated {displayTime(item.updatedAt)}</Body>
      <Button title="Open request" secondary onPress={() => navigate(`/assistance/${item.id}`)} />
    </View>)}
    <Paging offset={offset} total={resource.page?.total} onChange={setOffset} />
  </Screen>;
}
