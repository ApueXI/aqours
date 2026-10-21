import type { Message, Report, ReportDetail } from '@aqours/contracts';
import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, ErrorNotice, Field, Section, colors, styles } from '@/components/ui';
import { useCommand } from '@/hooks/use-command';
import { displayTime } from '@/utils/time';
import { PhotoPicker, PhotoUpload, type Photo } from './photos';

export function ReportMessages({ report, reload }: { report: ReportDetail; reload(): Promise<void> }) {
  const [text, setText] = useState('');
  const message = useCommand<Message>();
  async function send() {
    if (!text.trim()) return;
    const result = await message.execute(`/reports/${report.id}/messages`, { text: text.trim() });
    if (result) { setText(''); await reload(); }
  }
  return <Section title="Conversation with your supplier">
    {report.messages.length === 0 && <Body muted>No messages yet. Ask a question or share an update about this report.</Body>}
    {report.messages.map((item) => <View key={item.id} style={[styles.item, { padding: 12, borderLeftWidth: 2, borderLeftColor: item.authorRole === 'customer' ? colors.border : colors.action, backgroundColor: item.authorRole === 'customer' ? colors.background : colors.tint }]}>
      <Body>{item.authorRole === 'customer' ? 'You' : 'Supplier'}</Body><Body>{item.text}</Body>
      <Body muted>{displayTime(item.createdAt)}</Body>
    </View>)}
    <Field label="Message to the supplier" value={text} onChangeText={setText} multiline maxLength={5000} editable={!message.locked} />
    <ErrorNotice error={message.error} />
    {message.uncertain && <Body muted>Retry the same message to confirm delivery.</Body>}
    <Button title={message.busy ? 'Sending…' : message.uncertain ? 'Retry same message' : 'Send message'} disabled={message.busy || !text.trim()} onPress={() => void send()} />
  </Section>;
}

export function StillAffected({ report, reload }: { report: ReportDetail; reload(): Promise<void> }) {
  const [reason, setReason] = useState('');
  const followup = useCommand<Report>();
  async function submit() {
    if (!reason.trim()) return;
    const result = await followup.execute(`/reports/${report.id}/still-affected`, { expectedVersion: report.version, reason: reason.trim() });
    if (result) await reload();
  }
  return <Section title="Still affected?">
    <Body muted>This returns your report for supplier review and preserves its resolution history.</Body>
    <Field label="What is still happening?" value={reason} onChangeText={setReason} multiline maxLength={2000} editable={!followup.locked} />
    <ErrorNotice error={followup.error} />
    <Button title={followup.busy ? 'Sending…' : followup.uncertain ? 'Retry same follow-up' : 'Request another review'} disabled={followup.busy || !reason.trim()} onPress={() => void submit()} />
    {followup.error && !followup.uncertain && <Button title="Refresh current report" secondary onPress={() => void reload()} />}
  </Section>;
}

export function AddReportPhotos({ reportId }: { reportId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  return <>
    <PhotoPicker photos={photos} onChange={setPhotos} disabled={photos.length > 0} />
    {photos.map((photo) => <PhotoUpload key={photo.uri} reportId={reportId} photo={photo} />)}
  </>;
}
