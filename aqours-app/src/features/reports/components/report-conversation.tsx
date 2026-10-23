import { useMemo, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Body, Button, Field, colors, styles } from '@/components/ui';
import { displayTime } from '@/utils/time';
import { useReportWorkspace } from '../hooks/report-workspace';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';
import { useConversationScroll } from '../hooks/use-conversation-scroll';
import { ConversationStatus } from './conversation-status';

const day = (value: string) => new Date(value).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' });

export function ReportConversation() {
  const { resource, text, setText, message, sentMessageId, send } = useReportWorkspace();
  const keyboardVisible = useKeyboardVisible();
  const source = resource.data?.messages;
  const messages = useMemo(() => [...(source ?? [])].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt)
    || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)), [source]);
  const feed = useRef<ScrollView>(null);
  const { onScroll, onScrollBeginDrag, onScrollEndDrag, onMomentumScrollBegin, onMomentumScrollEnd,
    onViewportLayout, onContentSizeChange, onLastMessageLayout } = useConversationScroll(feed, messages, sentMessageId);
  return <View style={{ flex: 1, gap: 12 }}>
    <ConversationStatus resource={resource} error={message.error} uncertain={message.uncertain}>
    <ScrollView ref={feed} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
      scrollEventThrottle={100} onScroll={onScroll} onScrollBeginDrag={onScrollBeginDrag} onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollBegin={onMomentumScrollBegin} onMomentumScrollEnd={onMomentumScrollEnd}
      onLayout={onViewportLayout} onContentSizeChange={onContentSizeChange}>
      <Body muted>Messages are shared with your supplier for this report.</Body>
      {messages.length === 0 && <Body muted>No messages yet. Ask a question or share a report update.</Body>}
      {messages.map((item, index) => <View key={item.id} onLayout={index === messages.length - 1 ? onLastMessageLayout : undefined} style={{ gap: 8 }}>
        {(index === 0 || day(messages[index - 1].createdAt) !== day(item.createdAt)) && <Text style={[styles.muted, { textAlign: 'center', paddingVertical: 8 }]}>{day(item.createdAt)}</Text>}
        <View style={{ alignSelf: item.authorRole === 'customer' ? 'flex-end' : 'flex-start', maxWidth: '88%', padding: 12, gap: 6, borderRadius: 8,
          backgroundColor: item.authorRole === 'customer' ? colors.tint : colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <Text style={[styles.muted, { fontWeight: '600' }]}>{item.authorRole === 'customer' ? 'You' : 'Supplier'}</Text>
          <Body>{item.text}</Body><Body muted>{displayTime(item.createdAt)}</Body>
        </View>
      </View>)}
    </ScrollView>
    </ConversationStatus>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
      <View style={{ flex: 1 }}>
      <Field label="Message to the supplier" value={text} onChangeText={setText} multiline maxLength={5000} editable={!message.locked}
        scrollEnabled style={{ minHeight: keyboardVisible ? 48 : 64, height: keyboardVisible ? 48 : 64, maxHeight: 120 }} />
      </View>
      <Button title={message.busy ? 'Sending…' : message.uncertain ? 'Retry' : 'Send'}
        accessibilityLabel={message.busy ? 'Sending message' : message.uncertain ? 'Retry same message' : 'Send message'}
        disabled={message.busy || !text.trim()} onPress={() => void send()} />
    </View>
  </View>;
}
