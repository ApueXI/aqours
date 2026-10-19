import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pool, transaction } from './db.js';
export async function migrate() {
  await transaction(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(hashtextextended('aqours-migrations',0))");
    await db.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    const dir = path.resolve(import.meta.dirname, '../migrations');
    for (const name of (await readdir(dir)).filter((v) => /^\d+_.*\.sql$/.test(v)).sort()) {
      const sql = await readFile(path.join(dir, name), 'utf8'),
        checksum = createHash('sha256').update(sql).digest('hex');
      const { rows } = await db.query('SELECT checksum FROM schema_migrations WHERE name=$1', [
        name,
      ]);
      if (rows[0]) {
        if (rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${name}`);
        continue;
      }
      await db.query(sql);
      await db.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)', [
        name,
        checksum,
      ]);
      console.log(`Applied migration ${name}`);
    }
  });
}
if (process.argv[1]?.endsWith('/migrate.ts') || process.argv[1]?.endsWith('/migrate.js')) {
  migrate()
    .then(() => pool.end())
    .catch(() => {
      console.error('Migration failed; inspect database connectivity and migration consistency.');
      process.exitCode = 1;
      void pool.end();
    });
}
