import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const directory = import.meta.dirname;
const read = (file: string) => JSON.parse(readFileSync(path.join(directory, file), 'utf8'));
type Part = { psgc_code: string; name: string; geographic_level: string; children: Part[] };
type Locality = { code: string; name: string; ancestry: Part[] };
type Source = { cityMunCode: string; name: string; province: string | null; region: string; lat: number; lng: number; points: number };
const localities: Locality[] = [];
function visit(node: Part, parents: Part[]) {
  const ancestry = [...parents, node];
  if (['city', 'municipality'].includes(node.geographic_level)) {
    localities.push({ code: node.psgc_code, name: node.name, ancestry });
  }
  node.children.forEach(child => visit(child, ancestry));
}
for (const region of read('../data/list-of-all-regions.json')) {
  visit(read(`../data/${region.file}`).region, []);
}
// Strip parenthetical alternate names, city prefixes/suffixes and diacritics only.
// A normalized name must still resolve uniquely inside reviewed ancestry.
const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLowerCase().replace(/\([^)]*\)/g, '').replace(/\bcity of\b|\bcity\b/g, '').replace(/[^a-z0-9]/g, '');
const crosswalk: Record<string, string[]> = read('ancestry-crosswalk.json');
const provinces: { code: string; name: string; region: string }[] = read('source-provinces.json');
for (const [code, names] of Object.entries(crosswalk)) {
  const sourceProvince = provinces.find(province => province.code === code);
  if (!sourceProvince || names[0] !== sourceProvince.name ||
      (names.length !== 1 && !(code === '1538' && names.join('|') === 'Maguindanao del Norte|Maguindanao del Sur'))) {
    throw new Error(`Unreviewed province crosswalk: ${code}`);
  }
}
const source: { coords: Source[] } = read('source-coordinates.json');
const exclusions: { sourceCode: string; sourceName: string; canonicalCode: string; reason: string; referenceUrl: string }[] = read('source-exclusions.json');
for (const exclusion of exclusions) {
  if (!source.coords.some(point => point.cityMunCode === exclusion.sourceCode && point.name === exclusion.sourceName)) {
    throw new Error(`Unknown quality exclusion: ${exclusion.sourceCode}`);
  }
}
const matched = new Map<string, Source>();
const unmatchedSource: Source[] = [];
const excludedSource: { source: Source; canonicalCode: string; reason: string; referenceUrl: string }[] = [];
for (const point of source.coords) {
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng) || point.lat < 4 || point.lat > 22 || point.lng < 116 || point.lng > 127) {
    throw new Error(`Coordinate outside Philippine extent: ${point.cityMunCode}`);
  }
  if (point.province && point.region !== provinces.find(province => province.code === point.province)?.region) {
    throw new Error(`Unexpected source ancestry: ${point.cityMunCode}`);
  }
  const candidates = localities.filter(locality => {
    if (normalize(locality.name) !== normalize(point.name)) return false;
    const province = locality.ancestry.find(part => part.geographic_level === 'province');
    if (point.province) return Boolean(province && crosswalk[point.province]?.includes(province.name));
    // NCR has no province. Cotabato City moved from source Region XII to BARMM;
    // its current canonical parent is Maguindanao del Norte in this local tree.
    if (point.region === '13') return !province && locality.ancestry[0].name === 'National Capital Region (NCR)';
    return point.cityMunCode === '129804' && province?.name === 'Maguindanao del Norte';
  });
  if (candidates.length !== 1) { unmatchedSource.push(point); continue; }
  const target = candidates[0];
  const exclusion = exclusions.find(item => item.sourceCode === point.cityMunCode);
  if (exclusion) {
    if (exclusion.canonicalCode !== target.code) throw new Error(`Quality exclusion identity mismatch: ${point.cityMunCode}`);
    excludedSource.push({ source: point, canonicalCode: target.code, reason: exclusion.reason, referenceUrl: exclusion.referenceUrl });
    continue;
  }
  if (matched.has(target.code)) throw new Error(`Duplicate locality match: ${target.code}`);
  matched.set(target.code, point);
}
const coordinates = localities.map(locality => {
  const source = matched.get(locality.code);
  return { code: locality.code, latitude: source?.lat ?? null, longitude: source?.lng ?? null,
    sourceCode: source?.cityMunCode ?? null };
});
const sha256 = createHash('sha256').update(readFileSync(path.join(directory, 'source-coordinates.json'))).digest('hex');
const metadata = {
  coordinateSource: { repository: 'https://github.com/kon2raya24/ph-geo', revision: '06f38a00f8b9ac03f8bd6a3693893b8c449ac466',
    file: 'data/coords.json', retainedAs: 'source-coordinates.json', sha256, license: 'CC-BY-4.0', attribution: 'GeoNames' },
  ancestrySource: { repository: 'https://github.com/kon2raya24/ph-dev-utils', revision: '0dd17a33fba02110edb55d85d1e0382d3c9a6ea2',
    license: 'MIT', files: ['provinces', 'regions'].map(name => ({ file: `data/${name}.json`, retainedAs: `source-${name}.json`,
      sha256: createHash('sha256').update(readFileSync(path.join(directory, `source-${name}.json`))).digest('hex') })) },
  canonicalDataset: 'PSGC-2Q-2026',
  qualityExclusions: { file: 'source-exclusions.json', count: exclusions.length,
    sha256: createHash('sha256').update(readFileSync(path.join(directory, 'source-exclusions.json'))).digest('hex') },
  mapping: 'Unique normalized locality name within explicitly reviewed source-province-to-canonical-province ancestry; NCR regional match and explicit Cotabato City exception.',
  limitations: 'Approximate GeoNames postal-point means, not official centroids, administrative boundaries, or water-service coverage. Unmatched and quality-excluded localities retain null coordinates.',
};
const coverage = { sourceRevision: '06f38a00f8b9ac03f8bd6a3693893b8c449ac466', sourceSha256: sha256,
  sourceCount: source.coords.length, localityCount: localities.length, matchedCount: matched.size,
  unavailableCount: localities.length - matched.size,
  unavailable: localities.filter(locality => !matched.has(locality.code)).map(locality => ({ code: locality.code,
    ancestry: locality.ancestry.map(part => part.name) })), unmatchedSource, excludedSource };
writeFileSync(path.join(directory, 'coordinates.json'), JSON.stringify({ coordinates }, null, 2) + '\n');
writeFileSync(path.join(directory, 'coverage.json'), JSON.stringify(coverage, null, 2) + '\n');
writeFileSync(path.join(directory, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
console.log(JSON.stringify({ sourceCount: coverage.sourceCount, localityCount: coverage.localityCount,
  matchedCount: coverage.matchedCount, unavailableCount: coverage.unavailableCount, unmatchedSourceCount: unmatchedSource.length }));
