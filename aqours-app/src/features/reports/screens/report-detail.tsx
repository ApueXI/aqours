import { router, useLocalSearchParams, type Href } from 'expo-router';
import { View } from 'react-native';
import { Body, Button, Screen, Section, navigate } from '@/components/ui';
import { StatusLabel } from '@/components/status-label';
import { ResourceState } from '@/components/resource-state';
import { IncidentUpdates, Timeline } from '@/components/timeline';
import { displayTime, label } from '@/utils/time';
import { MapPreview } from '@/features/location/components/map-preview';
import { ProtectedPhoto } from '../components/photos';
import { AddReportPhotos, StillAffected } from '../components/report-actions';
import { useReportWorkspace } from '../hooks/report-workspace';
import { ReportConversation } from '../components/report-conversation';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';

export function ReportDetailScreen({ messages = false }: { messages?: boolean }) {
  const { id, view } = useLocalSearchParams<{ id: string; view?: string }>();
  const { resource } = useReportWorkspace();
  const report = resource.data;
  const active = messages ? 'messages' : view === 'history' ? 'history' : 'summary';
  const composing = useKeyboardVisible(messages);
  return <Screen title={report?.reference ?? 'Report detail'} scrollable={!messages || !report}>
    {!composing && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['summary', 'messages', 'history'].map(tab => <Button key={tab} title={label(tab)} secondary selected={active === tab}
      onPress={() => router.replace((tab === 'messages' ? `/reports/${id}/messages` : `/reports/${id}${tab === 'history' ? '?view=history' : ''}`) as Href)} />)}</View>}
    {(!messages || !report) && <ResourceState {...resource} />}
    {messages && report && <ReportConversation />}
    {active === 'history' && report && <Timeline events={report.timeline} />}
    {report && active === 'summary' && <>
      <Section title={label(report.category)}>
        <StatusLabel value={report.status} /><Body>{report.description}</Body>
        {report.guidedDetails && <Body>{report.guidedDetails}</Body>}
        <Body muted>Noticed {displayTime(report.noticedAt)}</Body>
        <Body muted>Submitted {displayTime(report.submittedAt)}</Body>
        {report.closureOutcome && <Body>Reviewed closure: {label(report.closureOutcome)}. {report.closureReason}</Body>}
      </Section>
      <Button title="Review guidance and options" onPress={() => navigate(`/reports/${id}/guidance`)} />
      <Button title="Request assistance" secondary onPress={() => navigate(`/assistance/new?reportId=${id}`)} />
      {report.status === 'resolved' && <StillAffected report={report} reload={resource.reload} />}
      <Button title={`Messages with your supplier · ${report.messages.length}`} secondary onPress={() => navigate(`/reports/${id}/messages`)} />
      {report.incident && <>
        <Button title={`Linked incident: ${report.incident.summary}`} secondary onPress={() => navigate(`/incidents/${report.incident!.id}`)} />
        <IncidentUpdates updates={report.incident.updates} />
      </>}
      <Section title="Reported location">
        <Body>{report.address}</Body>
        <Body muted>{label(report.locationSource)} · {report.locationReview ? 'Location requires supplier review' : 'Location recorded'}</Body>
        {report.accuracy !== null && <Body muted>GPS reported accuracy: approximately {Math.round(report.accuracy)} meters</Body>}
        {!report.zoneConfirmed && <Body muted>Issue service zone is unconfirmed; supplier review is needed.</Body>}
        {report.latitude !== null && report.longitude !== null && <MapPreview latitude={report.latitude} longitude={report.longitude} />}
      </Section>
      <Section title="Attached photos">
        {report.attachments.length === 0 && <Body muted>No confirmed attachments.</Body>}
        {report.attachments.map((attachment) => <ProtectedPhoto key={attachment.id} attachment={attachment} />)}
      </Section>
      <AddReportPhotos reportId={id} />
      <Button title="Refresh report" secondary onPress={() => void resource.reload()} />
    </>}
  </Screen>;
}
