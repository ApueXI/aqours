import type { FeatureCollection } from 'geojson';
import type { Advisory, StaffIncident, Zone } from '@aqours/contracts';

export function areaFeatures(zones: Zone[], incidents: StaffIncident[], advisories: Advisory[]): FeatureCollection {
  const now = Date.now();
  return { type: 'FeatureCollection', features: [
    ...zones.filter(zone => zone.boundary).map(zone => ({ type: 'Feature' as const, geometry: zone.boundary!, properties: { kind: 'zone', name: zone.name, demo: zone.demo } })),
    ...incidents.flatMap(incident => {
      const latest = [...incident.updates].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
      return latest?.geometry ? [{ type: 'Feature' as const, geometry: latest.geometry, properties: { kind: 'incident', name: incident.summary, demo: latest.demo } }] : [];
    }),
    ...advisories.filter(item => item.geometry && item.state === 'published' &&
      (['boil_water', 'do_not_drink', 'do_not_use'].includes(item.kind) ||
        ((!item.startsAt || Date.parse(item.startsAt) <= now) && (!item.endsAt || Date.parse(item.endsAt) > now)))).map(item => ({
        type: 'Feature' as const, geometry: item.geometry!, properties: { kind: 'advisory', name: item.title, demo: item.demo },
      })),
  ] };
}
