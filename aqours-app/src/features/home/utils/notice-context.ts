import type { Advisory, Connection } from '@aqours/contracts';

export function matchingConnections(notice: Pick<Advisory, 'connectionIds' | 'zoneIds'>, owned: Connection[]) {
  return owned.filter(connection => notice.connectionIds.includes(connection.id) ||
    (connection.zoneConfirmed && connection.zoneId !== null && notice.zoneIds.includes(connection.zoneId)));
}
