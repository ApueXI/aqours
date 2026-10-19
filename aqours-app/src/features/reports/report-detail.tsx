import type { ReportDetail } from '@aqours/contracts';
import { useLocalSearchParams } from 'expo-router';
import { Body, Button, Screen, Section, navigate } from '@/components/ui';
import { ResourceState } from '@/components/resource-state';
import { IncidentUpdates, Timeline } from '@/components/timeline';
import { useResource } from '@/hooks/use-resource';
import { displayTime, label } from '@/lib/time';
import { MapPreview } from '@/features/location/map-preview';
import { ProtectedPhoto } from './photos';
import { AddReportPhotos, ReportMessages, StillAffected } from './report-actions';

export function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const resource = useResource<ReportDetail>(`/reports/${id}`);
  const report = resource.data;
  return <Screen title={report?.reference ?? 'Report detail'}>
    <ResourceState {...resource} />
    {report && <>
      <Section title={`${label(report.category)} · ${label(report.status)}`}>
        <Body>{report.description}</Body><Body>{report.address}</Body>
        {report.guidedDetails && <Body>Additional issue details: {report.guidedDetails}</Body>}
        <Body muted>Noticed {displayTime(report.noticedAt)} · Submitted {displayTime(report.submittedAt)}</Body>
        <Body muted>{label(report.locationSource)} · {report.locationReview ? 'Location requires supplier review' : 'Location recorded'}</Body>
        {report.latitude !== null && report.longitude !== null && <MapPreview latitude={report.latitude} longitude={report.longitude} />}
        {report.closureOutcome && <Body>Reviewed closure: {label(report.closureOutcome)}. {report.closureReason}</Body>}
      </Section>
      <Button title="Review guidance and options" onPress={() => navigate(`/reports/${id}/guidance`)} />
      <Button title="Request assistance" secondary onPress={() => navigate(`/assistance/new?reportId=${id}`)} />
      {report.incident && <>
        <Button title={`Linked published incident: ${report.incident.summary}`} secondary onPress={() => navigate(`/incidents/${report.incident!.id}`)} />
        <IncidentUpdates updates={report.incident.updates} />
      </>}
      <Timeline events={report.timeline} />
      <ReportMessages report={report} reload={resource.reload} />
      {report.status === 'resolved' && <StillAffected report={report} reload={resource.reload} />}
      <Section title="Attached photos">
        {report.attachments.length === 0 && <Body muted>No confirmed attachments.</Body>}
        {report.attachments.map((attachment) => <ProtectedPhoto key={attachment.id} attachment={attachment} />)}
      </Section>
      <AddReportPhotos reportId={id} />
      <Button title="Refresh report" secondary onPress={() => void resource.reload()} />
    </>}
  </Screen>;
}
