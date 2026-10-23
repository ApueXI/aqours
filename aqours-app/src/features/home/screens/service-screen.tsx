import type { Advisory, Connection } from '@aqours/contracts';
import { Screen } from '@/components/ui';
import { useAllResources, useResource } from '@/hooks/use-resource';
import { IncidentSummaries, ServiceNotices } from '../components/service-notices';

export default function ServiceScreen() {
  const connections = useResource<Connection[]>('/me/connections');
  const notices = useAllResources<Advisory>('/advisories', true);
  const verified = !connections.loading && !connections.error && connections.data !== null;
  return <Screen title="Service incidents and advisories">
    <ServiceNotices notices={notices} restrictions connections={connections.data} verified={verified} />
    <IncidentSummaries />
    <ServiceNotices notices={notices} restrictions={false} connections={connections.data} verified={verified} />
  </Screen>;
}
