import type { DB } from "../../config/database.js";
import { get, own } from "../../repositories/domain.repository.js";
import { context } from "./context.service.js";
import { guidanceSafe } from "../presentation/projection.js";
import type { CommandContext } from "../../types/command-context.js";

export async function getGuidance(db: DB, req: CommandContext) {
  const doc = await get(db, "guidance", String(req.params.id));
  own(doc, req.actor);
  const ctx = await context(db, await get(db, "report", doc.reportId));
  return {
    ...guidanceSafe(doc),
    current: doc.sourceSignature === ctx.signature,
  };
}
