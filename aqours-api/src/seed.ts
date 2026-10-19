import { pool, transaction } from './db.js';
import { create } from './store.js';
import { seedIdentities } from './seed-identities.js';
import { seedOperations } from './seed-operations.js';
export async function seed() {
  if (process.env.NODE_ENV === 'production' || process.env.SEED_DEMO !== '1')
    throw new Error('Demo seed requires SEED_DEMO=1 and a nonproduction environment');
  await transaction(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(hashtextextended('aqours-demo-seed',0))");
    const { rows } = await db.query("SELECT id FROM records WHERE kind='seed_marker'");
    if (rows.length) {
      console.log('Demo seed already applied; existing records preserved.');
      return;
    }
    if (Number((await db.query('SELECT count(*) FROM records')).rows[0].count))
      throw new Error('Seed requires an empty application database; no records were overwritten');
    const identities = await seedIdentities(db);
    await seedOperations(db, identities);
    await create(db, 'seed_marker', {
      fixture: 'aqours-demo-v1',
      appliedAt: new Date().toISOString(),
      demo: true,
    });
    console.log(
      'Fictional Aqours demo dataset created. See aqours-api/README.md for demo login identities.',
    );
  });
}
if (process.argv[1]?.endsWith('/seed.ts') || process.argv[1]?.endsWith('/seed.js')) {
  seed()
    .then(() => pool.end())
    .catch(() => {
      console.error(
        'Demo seed failed. Verify SEED_DEMO=1, a nonproduction empty database, and applied migrations.',
      );
      process.exitCode = 1;
      void pool.end();
    });
}
