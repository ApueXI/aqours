import type { DB } from "../../config/database.js";
import { audit } from "../../repositories/history.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { page } from "../../utils/query.js";

export async function listAuditEvents(db: DB, req: CommandContext) {
  const rows = await audit(db);
  return page(req, rows);
}
