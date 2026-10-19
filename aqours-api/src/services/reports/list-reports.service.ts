import type { DB } from "../../config/database.js";
import { all } from "../../repositories/domain.repository.js";
import { reportSafe } from "./report-context.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { filter, page } from "../../utils/query.js";

export async function listReports(db: DB, req: CommandContext, staff: boolean) {
  return page(
    req,
    filter(req, await all(db, "report", staff ? undefined : req.actor.id)).map(
      reportSafe,
    ),
  );
}
