import { z } from "zod";
import type { DB } from "../../config/database.js";
import { readNotification } from "../../repositories/notifications.repository.js";
import { notificationSafe } from "../presentation/notification-projection.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";

export async function markNotificationRead(db: DB, req: CommandContext) {
  z.object({}).strict().parse(req.body);
  const rows = await readNotification(db, req.actor.id, String(req.params.id));
  if (!rows) fail(404, "Notification not found");
  const v = rows;
  return notificationSafe(v);
}
