import type { DB } from "../config/database.js";

const shape = (row: {
  id: string;
  data: unknown;
  createdAt: Date;
  readAt: Date | null;
}) => ({
  id: row.id,
  data: row.data,
  created_at: row.createdAt,
  read_at: row.readAt,
});
export async function listNotifications(db: DB, userId: string) {
  return (
    await db.notification.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    })
  ).map(shape);
}
export async function findNotification(db: DB, userId: string, id: string) {
  const row = await db.notification.findFirst({ where: { userId, id } });
  return row ? shape(row) : null;
}
export async function readNotification(db: DB, userId: string, id: string) {
  await db.notification.updateMany({
    where: { userId, id, readAt: null },
    data: { readAt: new Date() },
  });
  return findNotification(db, userId, id);
}
