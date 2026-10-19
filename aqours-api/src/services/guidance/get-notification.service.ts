import type { DB } from "../../config/database.js";
import { findNotification } from "../../repositories/notifications.repository.js";
import { notificationSafe } from "../presentation/notification-projection.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";

export async function getNotification(db: DB, req: CommandContext) {
  const rows = await findNotification(db, req.actor.id, String(req.params.id));
  if (!rows) fail(404, "Notification not found");
  const v = rows;
  return notificationSafe(v);
}
