import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import type { Advisory, MapResponse, StaffIncident, Zone } from '@aqours/contracts';

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
export function addLayers(map: MapLibreMap) {
  const empty: FeatureCollection = { type: 'FeatureCollection', features: [] };
  map.addSource('areas', { type: 'geojson', data: empty });
  map.addLayer({ id: 'area-fill', type: 'fill', source: 'areas', paint: {
    'fill-color': ['match', ['get', 'kind'], 'zone', '#64748b', 'incident', '#0f766e', '#b45309'], 'fill-opacity': 0.08,
  } });
  map.addLayer({ id: 'area-outline', type: 'line', source: 'areas', paint: {
    'line-color': ['match', ['get', 'kind'], 'zone', '#64748b', 'incident', '#0f766e', '#b45309'], 'line-width': 2,
  } });
  map.addSource('reports', { type: 'geojson', data: empty, cluster: true, clusterMaxZoom: 14, clusterRadius: 45 });
  map.addLayer({ id: 'clusters', type: 'circle', source: 'reports', filter: ['has', 'point_count'], paint: {
    'circle-color': '#0f766e', 'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 50, 30], 'circle-stroke-width': 1, 'circle-stroke-color': '#fff',
  } });
  map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'reports', filter: ['has', 'point_count'], layout: {
    'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Open Sans Semibold'], 'text-size': 12,
  }, paint: { 'text-color': '#fff' } });
  map.addLayer({ id: 'points', type: 'circle', source: 'reports', filter: ['!', ['has', 'point_count']], paint: {
    'circle-color': ['match', ['get', 'priority'], 'urgent', '#be123c', 'high', '#b45309', '#0f766e'],
    'circle-radius': 7, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff',
  } });
}
export function updateLayers(map: MapLibreMap, reports?: MapResponse, areas?: FeatureCollection) {
  if (map.getSource('reports')) (map.getSource('reports') as GeoJSONSource).setData(reports || { type: 'FeatureCollection', features: [] });
  if (areas && map.getSource('areas')) (map.getSource('areas') as GeoJSONSource).setData(areas);
}
