import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { canonicalWeatherPlaces } from './weather-psgc-canonical.ts';

const directory = new URL('../psgc-address-data/weather/', import.meta.url);
const read = (name: string) => JSON.parse(readFileSync(new URL(name, directory), 'utf8'));
interface Coordinate { code: string; latitude: number | null; longitude: number | null; sourceCode: string | null }
interface Source { cityMunCode: string; lat: number; lng: number; name: string; province: string | null; region: string }

test('PSGC representative coordinates preserve pinned source bytes, identity, coverage and explicit gaps', () => {
  const sourceBytes = readFileSync(new URL('source-coordinates.json', directory));
  const source = read('source-coordinates.json') as { _meta: Record<string, unknown>; coords: Source[] };
  const coverage = read('coverage.json');
  const coordinates = read('coordinates.json').coordinates as Coordinate[];
  const canonical = canonicalWeatherPlaces();
  assert.equal(coverage.sourceRevision, '06f38a00f8b9ac03f8bd6a3693893b8c449ac466');
  assert.equal(coverage.sourceSha256, createHash('sha256').update(sourceBytes).digest('hex'));
  assert.equal(source.coords.length, 1573);
  assert.equal(coverage.sourceCount, source.coords.length);
  assert.equal(coverage.localityCount, canonical.size);
  assert.equal(coordinates.length, canonical.size);
  assert.equal(new Set(coordinates.map(item => item.code)).size, canonical.size);
  assert.match(String(source._meta.license), /CC BY 4\.0/);
  assert.match(String(source._meta.note), /representative point/);
  const metadata = read('metadata.json');
  assert.equal(metadata.qualityExclusions.sha256, createHash('sha256').update(readFileSync(new URL('source-exclusions.json', directory))).digest('hex'));
  assert.equal(metadata.qualityExclusions.count, 2);
  assert.ok(JSON.stringify(metadata).includes('0dd17a33fba02110edb55d85d1e0382d3c9a6ea2'));
  for (const [name, expected] of [
    ['source-provinces.json', '50f78b7845f0761af9bd4203507b1adb723e02f889076e48e53068a41a19667b'],
    ['source-regions.json', '8fbf594eefc0507c56b6deaf505a248267229be43d5003a577da069b0df2ee36'],
  ]) {
    assert.equal(createHash('sha256').update(readFileSync(new URL(name, directory))).digest('hex'), expected);
    assert.ok(JSON.stringify(metadata).includes(expected));
  }
  const sourceByCode = new Map(source.coords.map(item => [item.cityMunCode, item]));
  const crosswalk = read('ancestry-crosswalk.json') as Record<string, string[]>;
  const normalizeName = (value: string) => value.split('(')[0].normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().replace(/\bcity\b|\bof\b/g, '').replace(/[^a-z0-9]/g, '');
  const used = new Set<string>();
  const gaps: string[] = [];
  for (const coordinate of coordinates) {
    assert.ok(canonical.has(coordinate.code));
    assert.equal(coordinate.latitude === null, coordinate.longitude === null);
    if (coordinate.latitude === null) {
      assert.equal(coordinate.sourceCode, null);
      gaps.push(coordinate.code);
      continue;
    }
    assert.ok(coordinate.sourceCode && !used.has(coordinate.sourceCode));
    used.add(coordinate.sourceCode);
    const point = sourceByCode.get(coordinate.sourceCode)!;
    assert.ok(point, `Unknown source identity ${coordinate.sourceCode}`);
    const ancestry = canonical.get(coordinate.code)!;
    assert.equal(normalizeName(ancestry.at(-1)!.name), normalizeName(point.name), coordinate.code);
    const province = ancestry.find(part => part.level === 'province');
    if (point.province) assert.ok(province && crosswalk[point.province]?.includes(province.name), coordinate.code);
    else if (point.region === '13') assert.equal(ancestry[0].code, '1300000000');
    else {
      assert.equal(point.cityMunCode, '129804');
      assert.equal(province?.name, 'Maguindanao del Norte');
    }
    assert.equal(coordinate.latitude, point.lat);
    assert.equal(coordinate.longitude, point.lng);
    assert.ok(coordinate.latitude >= 4 && coordinate.latitude <= 22);
    assert.ok(coordinate.longitude! >= 116 && coordinate.longitude! <= 128);
  }
  assert.equal(used.size, coverage.matchedCount);
  assert.equal(gaps.length, coverage.unavailableCount);
  assert.deepEqual(gaps.sort(), coverage.unavailable.map((item: { code: string }) => item.code).sort());
  assert.ok(coverage.matchedCount > 1500 && coverage.unavailableCount > 0);
  assert.equal(coverage.matchedCount + coverage.unavailableCount, canonical.size);
  const byCode = new Map(coordinates.map(item => [item.code, item]));
  for (const [code, sourceCode, latitude, longitude] of [
    ['0403405000', '043405', 14.2117, 121.1653],
    ['0403411000', '043411', 14.1702, 121.2418],
    ['1380300000', '137602', 14.55185, 121.0235],
    ['0306918000', '036918', 15.488, 120.6401],
    ['0401022000', '041022', 13.7384, 121.1736],
  ] as const) assert.deepEqual(byCode.get(code), { code, sourceCode, latitude, longitude });
  for (const code of ['0403428000', '1380600000'])
    assert.deepEqual(byCode.get(code), { code, sourceCode: null, latitude: null, longitude: null });
  assert.equal(coverage.matchedCount, 1553);
  assert.equal(coverage.unavailableCount, 89);
  assert.equal(coverage.unmatchedSource.length, 18);
  assert.deepEqual(coverage.excludedSource.map((item: { source: Source }) => item.source.cityMunCode).sort(), ['043428', '133900']);
});
