import type { Category, Connection, MapResponse, Report } from '@aqours/contracts';
import { leadingCategory } from './report-symbols';

export type CustomerPoint = {
  id: string; customerId: string; reference: string; address: string; coordinates: [number, number];
  locationLabel?: string; category: Category | null; clusterCategory?: Category | null; report?: MapResponse['features'][number]['properties'];
};
export type CustomerMapData = { points: CustomerPoint[]; total: number; unlocated: number; truncated: boolean };
type Bounds = { west: number; east: number; south: number; north: number };
const located = (point: { latitude: number | null; longitude: number | null }) =>
  point.latitude !== null && point.longitude !== null && Number.isFinite(point.latitude) && Number.isFinite(point.longitude);

function reportProperties(report: Report): NonNullable<CustomerPoint['report']> {
  return { id: report.id, reference: report.reference, category: report.category, status: report.status,
    priority: report.priority, address: report.address, locationSource: report.locationSource, locationReview: report.locationReview };
}

export function reportPoint(report: Report): CustomerPoint | undefined {
  if (!located(report)) return;
  return { id: report.id, customerId: report.customerId, reference: report.reference, address: report.address,
    coordinates: [report.longitude!, report.latitude!], category: report.status === 'resolved' ? null : report.category,
    report: reportProperties(report), locationLabel: 'Recorded report issue location' };
}

/** One representative point per customer; every individual report remains accessible in the list. */
export function customerPoints(connections: Connection[], reports: Report[], bounds: Bounds, search: string,
  filtered = false, limit = 1000): CustomerMapData {
  const customers = new Map<string, { connections: Connection[]; reports: Report[] }>();
  const group = (id: string) => {
    if (!customers.has(id)) customers.set(id, { connections: [], reports: [] });
    return customers.get(id)!;
  };
  for (const connection of connections) group(connection.customerId).connections.push(connection);
  for (const report of reports) group(report.customerId).reports.push(report);
  const points: CustomerPoint[] = [];
  let unlocated = 0;
  const term = search.trim().toLowerCase();
  for (const [customerId, customer] of customers) {
    if (filtered && !customer.reports.length) continue;
    const open = customer.reports.filter(report => report.status !== 'resolved');
    const category = leadingCategory(open.map(report => report.category));
    const ranked = [...open].sort((a, b) => Number(b.category === category) - Number(a.category === category)
      || b.submittedAt.localeCompare(a.submittedAt) || a.id.localeCompare(b.id));
    const connection = [...customer.connections].sort((a, b) => a.id.localeCompare(b.id)).find(located);
    // Prefer a saved customer location; an explicitly recorded issue point is the fallback.
    const fallback = ranked.find(located) || customer.reports.find(located);
    const position = connection || fallback;
    const issue = ranked[0];
    const history = [...customer.reports].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt) || a.id.localeCompare(b.id))[0];
    const representative = issue || (filtered ? history : undefined);
    const report = representative ? reportProperties(representative) : undefined;
    const address = position?.address || customer.connections[0]?.address || customer.reports[0]?.address || '';
    const reference = connection?.reference || customer.connections[0]?.reference || representative?.reference || customerId;
    if (term && ![reference, address, ...customer.reports.flatMap(item => [item.reference, item.address])].some(text => text.toLowerCase().includes(term))) continue;
    if (!position) { unlocated++; continue; }
    const coordinates: [number, number] = [position.longitude!, position.latitude!];
    if (coordinates[0] < bounds.west || coordinates[0] > bounds.east || coordinates[1] < bounds.south || coordinates[1] > bounds.north) continue;
    points.push({ id: representative?.id || `customer:${customerId}`, customerId, reference, address, coordinates,
      category: category || null, report, locationLabel: connection ? 'Saved customer connection location' : 'Recorded report location used as customer location' });
  }
  points.sort((a, b) => a.customerId.localeCompare(b.customerId));
  return { points: points.slice(0, limit), total: points.length, unlocated, truncated: points.length > limit };
}
