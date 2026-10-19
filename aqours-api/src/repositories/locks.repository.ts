import type { DB } from "../config/database.js";

export async function advisoryLock(db: DB, key: string) {
  // SELECT pg_advisory_xact_lock returns void; exclude it from the Prisma result decoder.
  await db.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${key},0))`;
}
export async function lockStock(db: DB, id: string) {
  await db.$queryRaw`SELECT id FROM stock_sessions WHERE id=${id}::uuid FOR UPDATE`;
}
