import type { DB } from "../../config/database.js";
import { listNotifications as listOwnedNotifications } from "../../repositories/notifications.repository.js";
import { notificationSafe } from "../presentation/notification-projection.js";
import type { CommandContext } from "../../types/command-context.js";
import { page } from "../../utils/query.js";

export async function listNotifications(db: DB, req: CommandContext) {
  const rows = await listOwnedNotifications(db, req.actor.id);
  return page(req, rows.map(notificationSafe));
}
