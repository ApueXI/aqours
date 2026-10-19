import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Advisory, StaffIncident, Zone, Geometry } from '@aqours/contracts';
import { areaFeatures } from '../src/features/map/utils/layers';

const polygon: Geometry = { type: 'Polygon', coordinates: [[[120.9, 14.5], [121, 14.5], [121, 14.6], [120.9, 14.5]]] };
const advisory = (fields: Partial<Advisory>): Advisory => ({
  id: 'fixture', kind: 'general', title: 'Demo', text: 'Fictional notice', source: 'Fictional supplier',
  zoneIds: [], connectionIds: [], geometry: polygon, startsAt: null, endsAt: null,
  state: 'draft', publishedAt: null, liftedAt: null, liftReason: null, version: 1, demo: true,
  updatedAt: '2026-01-01T00:00:00Z', ...fields,
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
