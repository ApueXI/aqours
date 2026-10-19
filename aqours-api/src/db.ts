import pg from 'pg';
import { config } from './config.js';
import { Fault } from './errors.js';
export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 12 });
export type DB = Pick<pg.PoolClient, 'query'>;
type TransactionClient = DB & { release(error?: Error | boolean): void };
export class CommitUncertain extends Fault {
  constructor() {
    super(
      503,
      'commit_uncertain',
      'Result could not be confirmed; retry with the same operation key',
    );
  }
}
export async function withTransaction<T>(
  db: TransactionClient,
  fn: (db: DB) => Promise<T>,
): Promise<T> {
  let committing = false,
    uncertain = false;
  try {
    await db.query('BEGIN');
    const value = await fn(db);
    committing = true;
    await db.query('COMMIT');
    return value;
  } catch (error) {
    if (committing) {
      uncertain = true;
      throw new CommitUncertain();
    }
    await db.query('ROLLBACK');
    throw error;
  } finally {
    db.release(uncertain);
  }
}
export async function transaction<T>(fn: (db: DB) => Promise<T>): Promise<T> {
  return withTransaction(await pool.connect(), fn);
}
