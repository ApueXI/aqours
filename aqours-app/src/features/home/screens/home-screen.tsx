import type { Advisory, AssistanceRequest, Connection, Report } from '@aqours/contracts';
import { View } from 'react-native';
import { Body, Button, Screen, Section, navigate, styles } from '@/components/ui';
import { StatusLabel } from '@/components/status-label';
import { ResourceState } from '@/components/resource-state';
import { useAllResources, useResource } from '@/hooks/use-resource';
import { displayTime, label } from '@/utils/time';
import { IncidentSummaries, ServiceNotices } from '../components/service-notices';
import { WeatherSection } from '@/features/weather/components/weather-section';
import { useSession } from '@/features/auth/hooks/session';

export function HomeScreen() {
  const { user } = useSession();
  const connections = useResource<Connection[]>('/me/connections');
  const notices = useAllResources<Advisory>('/advisories', true);
  const reports = useAllResources<Report>('/reports', true);
  const assistance = useAllResources<AssistanceRequest>('/assistance-requests', true);
  const openReports = reports.data?.filter(report => report.status !== 'resolved');
  const openRequests = assistance.data?.filter(request => !['completed', 'cancelled', 'unavailable'].includes(request.status));
  return <Screen title="Your water service" tabbed>
    <ServiceNotices notices={notices} restrictions connections={connections.data} verified={!connections.loading && !connections.error && connections.data !== null} />
    <Button title="Report a water problem" onPress={() => navigate('/reports/new')} />
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
        <Body muted>{request.status === 'requested' ? 'Awaiting supplier review; arrangements are not confirmed.' : `Agreed appointment: ${displayTime(request.appointmentAt)}`}</Body>
        <Button title="Open assistance request" secondary onPress={() => navigate(`/assistance/${request.id}`)} />
      </View>)}
      <Button title="View all assistance" secondary onPress={() => navigate('/assistance')} />
    </Section>
    <ServiceNotices notices={notices} restrictions={false} connections={connections.data} verified={!connections.loading && !connections.error && connections.data !== null} />
    <IncidentSummaries />
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
