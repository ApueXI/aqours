import { notifySupplier } from "../notifications/notify-supplier.service.js";
import type { DB } from "../../config/database.js";
import { event } from "../../repositories/domain.repository.js";
import { reportCreate, reportSafe } from "./report-context.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";

export async function createReport(db: DB, req: CommandContext) {
  const input = req.body;
  if (new Date(input.noticedAt).getTime() > Date.now() + 60000)
    fail(400, "Noticed time cannot be in the future");
  const result = await reportCreate(db, req.actor, input);
  await event(
    db,
    req.actor.id,
    result.id,
    "submitted",
    "Report received",
    undefined,
    "received",
  );
  await notifySupplier(db, result.id, "report", result.id, "New customer report", `${result.reference}: ${result.description}`);
  return reportSafe(result);
}
