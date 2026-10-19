import type { DB } from "../../config/database.js";
import { get } from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { incidentDetail } from "./detail.service.js";
export async function getStaffIncident(db: DB, req: CommandContext) {
  return incidentDetail(
    db,
    await get(db, "incident", String(req.params.id)),
    true,
  );
}
