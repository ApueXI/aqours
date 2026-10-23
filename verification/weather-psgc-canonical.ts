import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { PsgcPart, WeatherPsgcLocation } from '../aqours-contracts/src/index.ts';

interface Node { psgc_code: string; name: string; geographic_level: PsgcPart['level']; children: Node[] }

// Independent traversal of the existing canonical address dataset, rather than the weather adapter.
export function canonicalWeatherPlaces() {
  const directory = path.resolve('psgc-address-data/data');
  const index = JSON.parse(readFileSync(path.join(directory, 'list-of-all-regions.json'), 'utf8')) as { file: string }[];
  const places = new Map<string, PsgcPart[]>();
  function visit(node: Node, ancestry: PsgcPart[]) {
    const chain = [...ancestry, { code: node.psgc_code, name: node.name, level: node.geographic_level }];
    if (node.geographic_level === 'city' || node.geographic_level === 'municipality') places.set(node.psgc_code, chain);
    node.children.forEach(child => visit(child, chain));
  }
  for (const entry of index) {
    const data = JSON.parse(readFileSync(path.join(directory, entry.file), 'utf8')) as { region: Node };
    visit(data.region, []);
  }
  return places;
}

export function assertWeatherCatalog(locations: WeatherPsgcLocation[]) {
  const canonical = canonicalWeatherPlaces();
  assert.equal(canonical.size, 1642);
  assert.equal(locations.length, canonical.size, 'Every canonical city/municipality remains selectable');
  assert.equal(new Set(locations.map(place => place.code)).size, canonical.size);
  for (const place of locations) {
    assert.match(place.code, /^\d{10}$/);
    const ancestry = canonical.get(place.code);
    assert.ok(ancestry, `Unknown weather locality ${place.code}`);
    assert.deepEqual(place.ancestry, ancestry);
    assert.equal(place.name, ancestry.at(-1)!.name);
    assert.equal(place.level, ancestry.at(-1)!.level);
    assert.equal(place.latitude === null, place.longitude === null, 'Coordinates are a paired availability decision');
    if (place.latitude !== null) {
      assert.ok(Number.isFinite(place.latitude) && place.latitude >= 4 && place.latitude <= 22);
      assert.ok(Number.isFinite(place.longitude) && place.longitude! >= 116 && place.longitude! <= 128);
    }
  }
  const names = locations.map(place => place.name);
  assert.ok(new Set(names).size < names.length, 'Duplicate locality names remain separate code identities');
  const ncr = locations.filter(place => place.ancestry[0].code === '1300000000');
  assert.equal(ncr.length, 17);
  assert.ok(ncr.every(place => place.ancestry.length === 2 && place.ancestry[1].code === place.code));
  const nir = locations.filter(place => place.ancestry[0].code === '1800000000');
  assert.ok(nir.some(place => place.name.trim() === 'City of Bacolod'), 'Current Negros Island ancestry retained');
  assert.equal(locations.filter(place => place.level === 'city').length, 149);
  assert.equal(locations.filter(place => place.level === 'municipality').length, 1493);
  return canonical.size;
}
