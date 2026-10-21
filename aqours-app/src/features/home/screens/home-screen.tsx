import type { Advisory, AssistanceRequest, Connection, PublishedIncident, Report } from '@aqours/contracts';
import { View } from 'react-native';
import { Body, Button, Demo, Screen, Section, navigate, styles } from '@/components/ui';
import { StatusLabel } from '@/components/status-label';
import { ResourceState } from '@/components/resource-state';
import { useAllResources, useResource } from '@/hooks/use-resource';
import { displayTime, label } from '@/utils/time';
import { AdvisoryContext } from '../components/advisory-context';
import { WeatherSection } from '@/features/weather/components/weather-section';
import { useSession } from '@/features/auth/hooks/session';

export function HomeScreen() {
  const { user } = useSession();
  const connections = useResource<Connection[]>('/me/connections');
  const notices = useAllResources<Advisory>('/advisories', true);
  const reports = useAllResources<Report>('/reports', true);
  const assistance = useAllResources<AssistanceRequest>('/assistance-requests', true);
  const incidents = useAllResources<PublishedIncident>('/incidents', true);
  const openReports = reports.data?.filter(report => report.status !== 'resolved');
  const openRequests = assistance.data?.filter(request => !['completed', 'cancelled', 'unavailable'].includes(request.status));
  const activeIncidents = incidents.data?.filter(incident => incident.status !== 'resolved');
  return <Screen title="Your water service">
    <Button title="Report a water problem" onPress={() => navigate('/reports/new')} />
    <Section title="Service advisories">
      <ResourceState {...notices} empty={notices.data?.length === 0 && 'No matching published advisories. This does not establish water safety or normal supply.'} />
      {notices.data?.map((notice) => <View key={notice.id} style={styles.item}>
        <Demo visible={notice.demo} /><StatusLabel value={notice.state} />
        <Body>{notice.title}</Body><Body muted>{label(notice.kind)}</Body><Body>{notice.text}</Body>
        <AdvisoryContext notice={notice} connections={connections.data} verified={!connections.loading && !connections.error && connections.data !== null} />
        <Body muted>{notice.source} · Updated {displayTime(notice.updatedAt)}</Body>
        <Button title="Read advisory" secondary onPress={() => navigate(`/advisories/${notice.id}`)} />
      </View>)}
    </Section>
    <Section title="Current service incidents">
      <ResourceState {...incidents} empty={activeIncidents?.length === 0 && 'No current published incidents found.'} />
      {activeIncidents?.map((incident) => <View key={incident.id} style={styles.item}>
        <Demo visible={incident.demo} /><StatusLabel value={incident.status} />
        <Body>{incident.summary}</Body><Body muted>{incident.latestUpdate.area}</Body>
        <Body>{incident.latestUpdate.progress}</Body>
        <Body muted>Estimated restoration: {displayTime(incident.latestUpdate.restorationAt)}</Body>
        <Button title="View incident / mark affected" secondary onPress={() => navigate(`/incidents/${incident.id}`)} />
      </View>)}
    </Section>
    <Section title="Your open reports">
      <ResourceState {...reports} empty={openReports?.length === 0 && 'No open reports. You can still review your report history.'} />
      {openReports && openReports.length > 3 && <Body muted>Showing 3 of {openReports.length} open reports.</Body>}
      {openReports?.slice(0, 3).map((report) => <View key={report.id} style={styles.item}>
        <StatusLabel value={report.status} /><Body>{report.reference} · {label(report.category)}</Body>
        <Body muted>Submitted {displayTime(report.submittedAt)}</Body>
        <Button title="Open report" secondary onPress={() => navigate(`/reports/${report.id}`)} />
      </View>)}
      <Button title="View all reports" secondary onPress={() => navigate('/reports')} />
    </Section>
    <Section title="Your assistance requests">
      <ResourceState {...assistance} empty={openRequests?.length === 0 && 'No active assistance requests.'} />
      {openRequests && openRequests.length > 3 && <Body muted>Showing 3 of {openRequests.length} active requests.</Body>}
      {openRequests?.slice(0, 3).map(request => <View key={request.id} style={styles.item}>
        <StatusLabel value={request.status} /><Body>{request.reference} · {label(request.type)}</Body>
        <Body muted>Agreed appointment: {displayTime(request.appointmentAt)}</Body>
        <Button title="Open assistance request" secondary onPress={() => navigate(`/assistance/${request.id}`)} />
      </View>)}
      <Button title="View all assistance" secondary onPress={() => navigate('/assistance')} />
    </Section>
    <Section title="Saved connections">
      <ResourceState {...connections} empty={connections.data?.length === 0 && 'No saved connection. Ask the supplier to provision your connection.'} />
      {connections.data?.map((connection) => <View key={connection.id} style={styles.item}>
        <Body>{connection.reference}</Body><Body>{connection.address}</Body>
        {!connection.zoneConfirmed && <Body muted>Service zone is unconfirmed. Notices may be incomplete; contact support for clarification.</Body>}
      </View>)}
    </Section>
    <WeatherSection key={user?.id} connections={connections.error ? null : connections.data} />
    <Body muted>Service information refreshes every 30 seconds while this screen is visible. All times use Asia/Manila.</Body>
  </Screen>;
}
