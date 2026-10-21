import type { ReportDetail } from '@aqours/contracts';
import { useLocalSearchParams } from 'expo-router';
import { Body, Button, Screen, Section, navigate } from '@/components/ui';
import { StatusLabel } from '@/components/status-label';
import { ResourceState } from '@/components/resource-state';
import { IncidentUpdates, Timeline } from '@/components/timeline';
import { useResource } from '@/hooks/use-resource';
import { displayTime, label } from '@/utils/time';
import { MapPreview } from '@/features/location/components/map-preview';
import { ProtectedPhoto } from '../components/photos';
import { AddReportPhotos, ReportMessages, StillAffected } from '../components/report-actions';

export function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const resource = useResource<ReportDetail>(`/reports/${id}`);
  const report = resource.data;
  return <Screen title={report?.reference ?? 'Report detail'}>
    <ResourceState {...resource} />
    {report && <>
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
      <ReportMessages report={report} reload={resource.reload} />
      {report.incident && <>
        <Button title={`Linked incident: ${report.incident.summary}`} secondary onPress={() => navigate(`/incidents/${report.incident!.id}`)} />
        <IncidentUpdates updates={report.incident.updates} />
      </>}
      <Timeline events={report.timeline} />
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
