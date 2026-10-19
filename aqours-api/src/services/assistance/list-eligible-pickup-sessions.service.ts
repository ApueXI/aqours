import type { DB } from "../../config/database.js";
import { get, own } from "../../repositories/domain.repository.js";
import { eligibleSessions } from "../distribution/stock.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { page } from "../../utils/query.js";
import { id } from "../../validators/common.js";

export async function listEligiblePickupSessions(db: DB, req: CommandContext) {
  const reportId = req.query.reportId ? id.parse(req.query.reportId) : null;
  const report = reportId ? await get(db, "report", reportId) : undefined;
  if (report) own(report, req.actor);
  return page(req, await eligibleSessions(db, req.actor.id, report));
}
