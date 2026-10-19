import type { DB } from "../config/database.js";

export const liveSession = (db: DB, hash: string, userId?: string) =>
  db.session.findFirst({
    where: {
      tokenHash: hash,
      ...(userId ? { userId } : {}),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
export const credential = (db: DB, userId: string) =>
  db.credential.findUnique({ where: { userId } });
export const setCredential = (db: DB, userId: string, passwordHash: string) =>
  db.credential.upsert({
    where: { userId },
    create: { userId, passwordHash },
    update: { passwordHash },
  });
export const revokeUser = (db: DB, userId: string) =>
  db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
export const revokeToken = (db: DB, tokenHash: string) =>
  db.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
export async function lockedUserByEmail(db: DB, email: string) {
  return db.$queryRaw<
    { id: string }[]
  >`SELECT id FROM users WHERE lower(email)=${email.toLowerCase()} FOR UPDATE`;
}
export const insertSession = (
  db: DB,
  data: {
    tokenHash: string;
    userId: string;
    client: string;
    csrf: string;
    expiresAt: Date;
  },
) => db.session.create({ data });
