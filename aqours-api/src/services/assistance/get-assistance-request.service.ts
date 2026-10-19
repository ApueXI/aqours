import type { DB } from "../../config/database.js";
import { get, own } from "../../repositories/domain.repository.js";
import { requestDetail } from "../distribution/stock.service.js";
import type { CommandContext } from "../../types/command-context.js";

export async function getAssistanceRequest(
  db: DB,
  req: CommandContext,
  staff: boolean,
) {
  const doc = await get(db, "assistance", String(req.params.id));
  if (!staff) own(doc, req.actor);
  return requestDetail(db, doc, staff);
}
