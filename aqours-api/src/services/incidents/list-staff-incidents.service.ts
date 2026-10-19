import type { DB } from "../../config/database.js";
import { all } from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { page } from "../../utils/query.js";
import { incidentDetail } from "./detail.service.js";
export async function listStaffIncidents(db: DB, req: CommandContext) {
  return page(
    req,
    await Promise.all(
      (await all(db, "incident")).map((v) => incidentDetail(db, v)),
    ),
  );
}
