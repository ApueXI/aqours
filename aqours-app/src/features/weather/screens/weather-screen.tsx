import type { Connection } from '@aqours/contracts';
import { Screen } from '@/components/ui';
import { ResourceState } from '@/components/resource-state';
import { useResource } from '@/hooks/use-resource';
import { useSession } from '@/features/auth/hooks/session';
import { WeatherSection } from '../components/weather-section';

export default function WeatherScreen() {
  const { user } = useSession();
  const connections = useResource<Connection[]>('/me/connections');
  return <Screen title="Weather" tabbed>
    <ResourceState {...connections} />
    <WeatherSection key={user?.id} connections={connections.error ? null : connections.data} />
  </Screen>;
}
