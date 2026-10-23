import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../aqours-api/package.json', import.meta.url));
const { Client } = require('pg');
const database = process.env.AQOURS_TEST_DATABASE_URL || 'postgresql://workflow@127.0.0.1:55439/workflow_test';
if (!/^postgresql:\/\/workflow@127\.0\.0\.1:55439\/workflow(?:_seed)?_test$/.test(database) || process.env.DATABASE_URL !== database)
  throw new Error('Seed verification requires matching disposable workflow test database settings');
const db = new Client({ connectionString: database });
await db.connect();
try {
  const mismatch = await db.query(`SELECT count(*)::int AS count FROM reports r JOIN incidents i ON i.id=r.incident_id
    WHERE NOT EXISTS (SELECT 1 FROM incidents_zone_ids z WHERE z.entity_id=i.id AND z.target_id=r.zone_id)`);
  assert.equal(mismatch.rows[0].count, 0);
  const messages = await db.query("SELECT count(*)::int AS count FROM report_messages m JOIN reports r ON r.id=m.report_id WHERE r.description LIKE 'Fictional demonstration report %'");
  assert.equal(messages.rows[0].count, 8);
  console.log('PASS fresh seed: all incident links agree with report zone; four real two-way conversations');
  async function fingerprint() {
    const tables = await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    const result = [];
    for (const { tablename } of tables.rows) {
      const table = '"' + tablename.replaceAll('"', '""') + '"';
      const value = await db.query(`SELECT count(*)::int AS count, md5(string_agg(row_to_json(t)::text, '' ORDER BY row_to_json(t)::text)) AS digest FROM ${table} t`);
      result.push({ table: tablename, ...value.rows[0] });
    }
    return result;
  }
  const before = await fingerprint();
  const { seed } = await import('../aqours-api/src/scripts/seed.ts');
  const { prisma } = await import('../aqours-api/src/config/database.ts');
  try { await seed(); } finally { await prisma.$disconnect(); }
  assert.deepEqual(await fingerprint(), before);
  console.log(`PASS repeat seed preserves all ${before.length} public tables, including existing accounts and operational history`);
} finally { await db.end(); }
