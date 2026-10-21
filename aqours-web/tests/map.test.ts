import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Advisory, StaffIncident, Zone, Geometry } from '@aqours/contracts';
import { areaFeatures } from '../src/features/map/utils/layers';
import { basemapConfig } from '../src/features/map/utils/basemap';
import { mapFilters, mapLocation } from '../src/features/map/utils/map-state';

const polygon: Geometry = { type: 'Polygon', coordinates: [[[120.9, 14.5], [121, 14.5], [121, 14.6], [120.9, 14.5]]] };
const advisory = (fields: Partial<Advisory>): Advisory => ({
  id: 'fixture', kind: 'general', title: 'Demo', text: 'Fictional notice', source: 'Fictional supplier',
  zoneIds: [], connectionIds: [], geometry: polygon, startsAt: null, endsAt: null,
  state: 'draft', publishedAt: null, liftedAt: null, liftReason: null, version: 1, demo: true,
  updatedAt: '2026-01-01T00:00:00Z', ...fields,
});

test('Leaflet defaults require a public key, encode it, and retain mandatory Geoapify attribution with overrides', () => {
  const missing = basemapConfig({});
  assert.equal(missing.url, null);
  assert.match(missing.notice!, /not configured/);
  assert.match(basemapConfig({ legacyStyleUrl: 'https://example.test/style.json' }).notice!, /configure raster/);
  const configured = basemapConfig({ apiKey: 'public browser/key', attribution: 'Additional source' });
  assert.equal(configured.url, 'https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=public%20browser%2Fkey');
  for (const name of ['Geoapify', 'OpenMapTiles', 'OpenStreetMap', 'Additional source']) assert.match(configured.attribution, new RegExp(name));
  const custom = basemapConfig({ apiKey: 'unused', tileUrl: 'https://tiles.example.test/{z}/{x}/{y}.png', attribution: 'Custom provider' });
  assert.equal(custom.url, 'https://tiles.example.test/{z}/{x}/{y}.png');
  assert.match(custom.attribution, /OpenStreetMap/);
  assert.match(custom.attribution, /Custom provider/);
  assert.equal(custom.notice, null);
  assert.match(basemapConfig({ tileUrl: 'https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=public' }).attribution, /OpenMapTiles/);
});

test('map URL state separates server filters from selection and preserves return context', () => {
  const filters = mapFilters(new URLSearchParams('category=leak&status=received&zoneId=zone&ownerId=staff&priority=high&selected=private-id&view=map&unlocated=1'));
  assert.deepEqual(filters, { category: 'leak', status: 'received', zoneId: 'zone', ownerId: 'staff', priority: 'high' });
  const location = mapLocation(filters, { selected: 'report/id', view: 'map', unlocated: true });
  const roundtrip = new URLSearchParams(location.split('?')[1]);
  assert.equal(roundtrip.get('selected'), 'report/id');
  assert.equal(roundtrip.get('view'), 'map');
  assert.equal(roundtrip.get('unlocated'), '1');
  assert.deepEqual(mapFilters(roundtrip), filters);
  assert.equal(mapLocation({}, { view: 'list', unlocated: false }), '/map');
});
test('map areas use published snapshots, exclude drafts, and preserve explicit quality restrictions after end time', () => {
  const zones = [{ name: 'Demo zone', boundary: polygon, demo: true }] as Zone[];
  const incidents = [{ summary: 'Private edit', geometry: polygon, updates: [] },
    { summary: 'Published incident', updates: [{ geometry: polygon, publishedAt: '2026-01-01T00:00:00Z', demo: true }] }] as unknown as StaffIncident[];
  const advisories = [
    advisory({ title: 'Draft', state: 'draft', kind: 'general' }),
    advisory({ title: 'Lifted quality notice', state: 'lifted', kind: 'boil_water' }),
    advisory({ title: 'Ended scheduled notice', state: 'published', kind: 'scheduled_interruption', endsAt: '2020-01-01T00:00:00Z' }),
    advisory({ title: 'Active quality restriction', state: 'published', kind: 'do_not_drink', endsAt: '2020-01-01T00:00:00Z' }),
    advisory({ title: 'Explicit published future quality restriction', state: 'published', kind: 'do_not_use', startsAt: '2099-01-01T00:00:00Z' }),
  ];
  const result = areaFeatures(zones, incidents, advisories);
  assert.deepEqual(result.features.map(feature => feature.properties?.name), ['Demo zone', 'Published incident', 'Active quality restriction', 'Explicit published future quality restriction']);
  assert.equal(result.features[0].properties?.demo, true);
  assert.deepEqual(result.features[0].geometry, polygon);
});
