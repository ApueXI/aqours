import type { DB } from "../../config/database.js";
import { get, own } from "../../repositories/domain.repository.js";
import { reportDetail } from "./report-context.service.js";
import type { CommandContext } from "../../types/command-context.js";

export async function getReport(db: DB, req: CommandContext, staff: boolean) {
  const doc = await get(db, "report", String(req.params.id));
  if (!staff) own(doc, req.actor);
  return reportDetail(db, doc, staff);
}
