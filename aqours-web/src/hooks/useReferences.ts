import type { User, Zone } from '@aqours/contracts';
import { useResource } from './useResource';

export function useReferences() {
  const users = useResource<User[]>('/staff/users?limit=100');
  const zones = useResource<Zone[]>('/staff/zones');
  return { users, zones };
}
