import { randomUUID } from "node:crypto";
import type { DB } from "../config/database.js";

export async function event(
  db: DB,
  actor: string,
  target: string,
  action: string,
  text: string,
  from?: string,
  to?: string,
  isPrivate = false,
  metadata = {},
) {
  const result = await db.event.create({
    data: {
      id: randomUUID(),
      targetId: target,
      actorId: actor,
      action,
      text,
      fromStatus: from,
      toStatus: to,
      private: isPrivate,
      metadata: JSON.parse(JSON.stringify(metadata)),
    },
  });
  return result.id;
}
export async function timeline(db: DB, id: string, isPrivate = false) {
  const rows = await db.event.findMany({
    where: { targetId: id, private: isPrivate },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      action: true,
      text: true,
      actorId: true,
      fromStatus: true,
      toStatus: true,
      createdAt: true,
      metadata: true,
    },
  });
  return rows.map(({ metadata, ...item }) => {
    const times = metadata as Record<string, unknown>;
    const from = times?.oldAppointmentAt,
      to = times?.newAppointmentAt;
    const validTime = (value: unknown): value is string =>
      typeof value === "string" && Number.isFinite(Date.parse(value));
    if (item.action === "scheduled" && validTime(to))
      return {
        ...item,
        appointmentChange: { from: validTime(from) ? from : null, to },
      };
    return item;
  });
}
export async function notify(
  db: DB,
  user: string,
  key: string,
  targetType: string,
  targetId: string,
  title: string,
  text: string,
) {
  await db.notification.createMany({
    data: [
      {
        id: randomUUID(),
        userId: user,
        sourceEventKey: key,
        data: { title, text, targetType, targetId, sourceEventKey: key },
      },
    ],
    skipDuplicates: true,
  });
}
export const audit = (db: DB) =>
  db.event.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      targetId: true,
      actorId: true,
      action: true,
      text: true,
      fromStatus: true,
      toStatus: true,
      createdAt: true,
      metadata: true,
    },
  });
