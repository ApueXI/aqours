import type { Advisory, Connection } from '@aqours/contracts';

export function matchingConnections(notice: Pick<Advisory, 'connectionIds' | 'zoneIds'>, owned: Connection[]) {
  return owned.filter(connection => notice.connectionIds.includes(connection.id) ||
    (connection.zoneConfirmed && connection.zoneId !== null && notice.zoneIds.includes(connection.zoneId)));
}

// Dates describe a scheduled service window; only explicit lifting ends quality restrictions.
export function advisoryPhase(notice: Pick<Advisory, 'kind' | 'state' | 'startsAt' | 'endsAt'>, at = Date.now()) {
  if (notice.state === 'draft') return 'draft';
  if (notice.state === 'lifted') return 'lifted';
  if (['boil_water', 'do_not_drink', 'do_not_use'].includes(notice.kind)) return 'current';
  if (notice.endsAt && Date.parse(notice.endsAt) <= at) return 'past';
  if (notice.startsAt && Date.parse(notice.startsAt) > at) return 'upcoming';
  return 'current';
}
