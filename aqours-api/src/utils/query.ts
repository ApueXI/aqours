import { z } from "zod";
import type { CommandContext } from "../types/command-context.js";
import type { Doc } from "../types/domain.js";
import { assistanceType, category, id, instant } from "../validators/common.js";
import { fail } from "./errors.js";
export function page(req: CommandContext, values: any[]) {
  const offset = z.coerce
    .number()
    .int()
    .min(0)
    .max(1000000)
    .parse(req.query.offset ?? 0);
  const limit = z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .parse(req.query.limit ?? 30);
  return {
    data: values.slice(offset, offset + limit),
    page: { offset, limit, total: values.length },
  };
}
export function validateFilters(req: CommandContext) {
  const reportStates = z.enum([
    "received",
    "under_review",
    "in_progress",
    "resolved",
  ]);
  const assistanceStates = z.enum([
    "requested",
    "accepted",
    "scheduled",
    "in_progress",
    "completed",
    "unavailable",
    "cancelled",
  ]);
  const validators: Record<string, z.ZodType> = {
    category,
    type: assistanceType,
    priority: z.enum(["normal", "high", "urgent"]),
    zoneId: id,
    ownerId: id,
    status: req.path.includes("assistance-requests")
      ? assistanceStates
      : reportStates,
  };
  for (const [name, validator] of Object.entries(validators))
    if (req.query[name] !== undefined) validator.parse(req.query[name]);
}
export function filter(
  req: CommandContext,
  values: Doc[],
  dateField = "submittedAt",
) {
  validateFilters(req);
  const from = req.query.from ? instant.parse(req.query.from) : null,
    to = req.query.to ? instant.parse(req.query.to) : null;
  if (from && to && from >= to) fail(400, "Invalid date interval");
  for (const name of [
    "category",
    "status",
    "zoneId",
    "ownerId",
    "priority",
    "type",
  ]) {
    if (req.query[name] && typeof req.query[name] !== "string")
      fail(400, "Invalid filter");
  }
  return values.filter(
    (value) =>
      ["category", "status", "zoneId", "ownerId", "priority", "type"].every(
        (name) => !req.query[name] || value[name] === req.query[name],
      ) &&
      (!from || value[dateField] >= from) &&
      (!to || value[dateField] < to),
  );
}
