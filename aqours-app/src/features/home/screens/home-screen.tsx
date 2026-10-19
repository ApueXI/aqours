import type { Advisory, Connection, PublishedIncident, Report } from '@aqours/contracts';
import { View } from 'react-native';
import { Body, Button, Demo, Screen, Section, navigate, styles } from '@/components/ui';
import { ResourceState } from '@/components/resource-state';
import { useAllResources, useResource } from '@/hooks/use-resource';
import { displayTime, label } from '@/utils/time';
import { AdvisoryContext } from '../components/advisory-context';

export function HomeScreen() {
  const connections = useResource<Connection[]>('/me/connections');
  const notices = useAllResources<Advisory>('/advisories', true);
  const reports = useAllResources<Report>('/reports', true);
  const incidents = useAllResources<PublishedIncident>('/incidents', true);
  return <Screen title="Your water service">
    <Button title="Report a water problem" onPress={() => navigate('/reports/new')} />
    <Section title="Saved connections">
      <ResourceState {...connections} empty={connections.data?.length === 0 && 'No saved connection. Ask the supplier to provision your connection.'} />
      {connections.data?.map((connection) => <View key={connection.id} style={styles.item}>
        <Body>{connection.reference}</Body><Body>{connection.address}</Body>
        {!connection.zoneConfirmed && <Body muted>Service zone is unconfirmed. Notices may be incomplete; contact support for clarification.</Body>}
      </View>)}
    </Section>
    <Section title="Applicable advisories">
      <ResourceState {...notices} empty={notices.data?.length === 0 && 'No matching published advisories. This does not establish water safety or normal supply.'} />
      {notices.data?.map((notice) => <View key={notice.id} style={styles.item}>
        <Demo visible={notice.demo} /><Body>{label(notice.kind)} · {notice.title}</Body><Body>{notice.text}</Body>
        <Body muted>{notice.source} · Updated {displayTime(notice.updatedAt)}</Body>
        <AdvisoryContext notice={notice} connections={connections.data} verified={!connections.loading && !connections.error && connections.data !== null} />
        <Button title="Read advisory" secondary onPress={() => navigate(`/advisories/${notice.id}`)} />
      </View>)}
    </Section>
    <Section title="Published incidents">
      <ResourceState {...incidents} empty={incidents.data?.length === 0 && 'No published incidents found.'} />
      {incidents.data?.filter((incident) => incident.status !== 'resolved').map((incident) => <View key={incident.id} style={styles.item}>
        <Demo visible={incident.demo} /><Body>{incident.summary}</Body><Body muted>{label(incident.status)} · {incident.latestUpdate.area}</Body>
        <Body>{incident.latestUpdate.progress}</Body>
        <Body muted>Restoration estimate: {displayTime(incident.latestUpdate.restorationAt)}</Body>
        <Button title="View incident / mark affected" secondary onPress={() => navigate(`/incidents/${incident.id}`)} />
      </View>)}
    </Section>
    <Section title="Your open reports">
      <ResourceState {...reports} empty={reports.data?.filter((report) => report.status !== 'resolved').length === 0 && 'No open reports.'} />
      {reports.data?.filter((report) => report.status !== 'resolved').map((report) => <View key={report.id} style={styles.item}>
        <Body>{report.reference} · {label(report.category)}</Body><Body muted>{label(report.status)} · Submitted {displayTime(report.submittedAt)}</Body>
        <Button title="Open report" secondary onPress={() => navigate(`/reports/${report.id}`)} />
      </View>)}
      {reports.page && reports.page.total > 100 && <Button title="See all reports" secondary onPress={() => navigate('/reports')} />}
    </Section>
    <Body muted>Information refreshes every 30 seconds while this screen is visible. All times use Asia/Manila.</Body>
  </Screen>;
}
