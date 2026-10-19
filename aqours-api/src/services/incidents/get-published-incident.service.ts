import type { DB } from "../../config/database.js";
import { get } from "../../repositories/domain.repository.js";
import { published } from "../reports/report-context.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";

export async function getPublishedIncident(db: DB, req: CommandContext) {
  const result = await published(
    db,
    await get(db, "incident", String(req.params.id)),
  );
  if (!result) fail(404, "Published incident not found");
  return result;
}
