import type { Advisory, Connection } from '@aqours/contracts';
import { useState } from 'react';
import { Body, Button, Screen } from '@/components/ui';
import { useAllResources, useResource } from '@/hooks/use-resource';
import { IncidentSummaries, ServiceNotices } from '../components/service-notices';

export default function ServiceScreen() {
  const connections = useResource<Connection[]>('/me/connections');
  const notices = useAllResources<Advisory>('/advisories?includeLifted=true', true);
  const [history, setHistory] = useState(false);
  const verified = !connections.loading && !connections.error && connections.data !== null;
  return <Screen title="Service incidents and advisories">
    <Body muted>Advisories match your saved service connections or supplier-confirmed zone, rather than your phone location. Contact the supplier if your service zone needs review.</Body>
    <Button title="Refresh advisories and connection details" secondary disabled={notices.loading || connections.loading} onPress={() => { void notices.reload(); void connections.reload(); }} />
    <Button title={history ? 'Show current and upcoming advisories' : 'Include past and lifted advisories'} secondary selected={history} onPress={() => setHistory(!history)} />
    <ServiceNotices notices={notices} history={history} restrictions connections={connections.data} verified={verified} />
    <IncidentSummaries />
    <ServiceNotices notices={notices} history={history} restrictions={false} connections={connections.data} verified={verified} />
  </Screen>;
}
