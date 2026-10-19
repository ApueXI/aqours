import type { DB } from "../../config/database.js";
import { create, get, own } from "../../repositories/domain.repository.js";
import { evaluate } from "./evaluation.service.js";
import { guidanceSafe } from "../presentation/projection.js";
import type { CommandContext } from "../../types/command-context.js";

export async function evaluateGuidance(db: DB, req: CommandContext) {
  const input = req.body;
  const report = await get(db, "report", String(req.params.id));
  own(report, req.actor);
  const result = await evaluate(
    db,
    report,
    input.answers ?? report.answers ?? {},
  );
  const doc = await create(
    db,
    "guidance",
    {
      ...result,
      customerId: req.actor.id,
      answers: input.answers ?? report.answers ?? {},
    },
    req.actor.id,
    report.id,
  );
  return guidanceSafe(doc);
}
