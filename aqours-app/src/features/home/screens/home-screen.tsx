import type { Advisory, Connection } from '@aqours/contracts';
import { Body, Button, Screen, Section, navigate } from '@/components/ui';
import { useAllResources, useResource } from '@/hooks/use-resource';
import { ServiceNotices } from '../components/service-notices';
import { useSession } from '@/features/auth/hooks/session';

export function HomeScreen() {
  const { user } = useSession();
  const connections = useResource<Connection[]>('/me/connections');
  const notices = useAllResources<Advisory>('/advisories?includeLifted=true', true);
  return <Screen title={`Hello, ${user?.name || 'there'}`} tabbed>
    <Button title="Report a water problem" onPress={() => navigate('/reports/new')} />
    <ServiceNotices notices={notices} restrictions connections={connections.data}
      verified={!connections.loading && !connections.error && connections.data !== null} />
    <ServiceNotices notices={notices} restrictions={false} connections={connections.data}
      verified={!connections.loading && !connections.error && connections.data !== null} />
    <Section title="Your water service">
      <Button title="Service incidents and advisories" secondary onPress={() => navigate('/service')} />
      <Button title="Request or track assistance" secondary onPress={() => navigate('/assistance')} />
      <Button title="Account settings" secondary onPress={() => navigate('/profile')} />
      <Button title="View your reports" secondary onPress={() => navigate('/reports')} />
    </Section>
    <Body muted>Find supplier conversations in Messages, forecasts in Weather, and password and saved connections in Settings.</Body>
  </Screen>;
}
