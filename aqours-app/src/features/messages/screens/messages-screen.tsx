import type { ConversationSummary } from '@aqours/contracts';
import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Screen, styles, navigate } from '@/components/ui';
import { Paging, ResourceState } from '@/components/resource-state';
import { useResource } from '@/hooks/use-resource';
import { displayTime, label } from '@/utils/time';

export default function MessagesScreen() {
  const [offset, setOffset] = useState(0);
  const resource = useResource<ConversationSummary[]>(`/messages?offset=${offset}`, true);
  return <Screen title="Messages" tabbed>
    <Body muted>Conversations with your supplier, organized by report.</Body>
    <ResourceState {...resource} empty={resource.data?.length === 0 && 'No reports yet. Submit a report to start a conversation with your supplier.'} />
    {resource.data?.map(item => <View style={styles.item} key={item.reportId}>
      <Body>{item.reference} · {label(item.category)}</Body>
      <Body>{item.latestMessage ? `${item.latestMessage.authorRole === 'customer' ? 'You' : 'Supplier'}: ${item.latestMessage.text}` : item.description}</Body>
      <Body muted>{displayTime(item.updatedAt)} · {item.latestMessage ? label(item.status) : 'No messages yet'}</Body>
      <Button title="Open conversation" secondary onPress={() => navigate(`/reports/${item.reportId}/messages`)} />
    </View>)}
    <Paging offset={offset} total={resource.page?.total} onChange={setOffset} />
    <Button title="Refresh conversations" secondary onPress={() => void resource.reload()} />
  </Screen>;
}
