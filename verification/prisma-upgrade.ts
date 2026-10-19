import assert from 'node:assert/strict';
import { databaseSQL } from './database-client.ts';

const database = process.env.AQOURS_MIGRATION_DATABASE_URL;
assert.ok(database, 'Set AQOURS_MIGRATION_DATABASE_URL to an upgraded isolated database ending _test');
const sql = (query: string) => databaseSQL(query, database);
const source = process.env.AQOURS_MIGRATION_SOURCE_DATABASE_URL;
assert.ok(source, 'Set AQOURS_MIGRATION_SOURCE_DATABASE_URL to the matching frozen legacy source ending _test');
const counts = JSON.parse(sql(`SELECT json_build_object(
  'legacy',(SELECT count(*) FROM legacy_records),
  'typed',(SELECT count(*) FROM records),
  'identities',(SELECT count(*) FROM entities))`));
assert.ok(counts.legacy > 0, 'This check requires a populated legacy upgrade');
assert.equal(counts.legacy, counts.typed);
assert.equal(counts.legacy, counts.identities);
assert.equal(sql(`SELECT count(*) FROM legacy_records l FULL JOIN records r USING(id)
  WHERE l.id IS NULL OR r.id IS NULL OR l.kind<>r.kind OR l.version<>r.version
  OR l.created_at<>r.created_at OR l.updated_at<>r.updated_at`), '0');
// Future private test sentinels remain in the frozen archive; they are not domain fields.
// Compare every original field, including snapshots and exact decimal quantities.
assert.equal(sql(`SELECT count(*) FROM legacy_records l JOIN records r USING(id),
  jsonb_object_keys(l.data) AS k WHERE k<>'futurePrivateField' AND
  CASE WHEN k='details' AND l.data->>'type'='water_support' THEN
    ((l.data->k) - 'requestedLiters') IS DISTINCT FROM ((r.data->k) - 'requestedLiters' - 'notes')
    AND jsonb_strip_nulls((l.data->k) - 'requestedLiters') IS DISTINCT FROM jsonb_strip_nulls((r.data->k) - 'requestedLiters')
  ELSE l.data->k IS DISTINCT FROM r.data->k END`), '0');
assert.equal(sql(`SELECT count(*) FROM legacy_records l JOIN water_support_details w ON w.request_id=l.id
  WHERE (l.data->'details'->>'requestedLiters')::numeric IS DISTINCT FROM w.requested_liters`), '0');
const duplicate = sql(`SELECT count(*) FROM reports r LEFT JOIN service_connections c ON c.id=r.connection_id
  WHERE c.id IS NULL OR r.customer_id<>c.customer_id`);
assert.equal(duplicate, '0');
assert.equal(sql(`SELECT count(*) FROM stock_sessions s WHERE total < COALESCE(
  (SELECT sum(liters) FROM allocations a WHERE a.session_id=s.id AND state IN ('reserved','collected')),0)`), '0');
for (const query of [
  'UPDATE legacy_records SET version=version',
  'UPDATE incident_publications SET progress=progress',
  'UPDATE guidance_evaluations SET source_signature=source_signature',
  'UPDATE events SET text=text',
  'UPDATE incident_publications_zone_ids SET position=position',
  `INSERT INTO incident_publications_zone_ids(entity_id,target_id,position) SELECT p.id,z.id,999 FROM incident_publications p CROSS JOIN zones z WHERE NOT EXISTS (SELECT 1 FROM incident_publications_zone_ids j WHERE j.entity_id=p.id AND j.target_id=z.id) LIMIT 1`,
  'DELETE FROM allocations',
]) assert.throws(() => sql(query));
assert.equal(sql(`SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`), '2');
for (const table of ['credentials','sessions','operations','events','notifications','stock_sessions','allocations','schema_migrations']) {
  const fingerprint = `SELECT md5(COALESCE(string_agg(row_to_json(t)::text,E'\\n' ORDER BY row_to_json(t)::text),'')) FROM ${table} t`;
  assert.equal(sql(fingerprint), databaseSQL(fingerprint, source), `${table} differs from the preserved migration source`);
}
console.log(`PASS: populated Prisma upgrade preserves ${counts.legacy} domain rows, IDs, versions, timestamps, fields, ownership, immutable history, and exact stock.`);
