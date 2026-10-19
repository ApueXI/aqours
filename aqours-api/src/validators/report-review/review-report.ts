import { z } from "zod";
import { expected, id, text } from "../common.js";

export function reviewReportInput(body: unknown) {
  return z
    .object({
      expectedVersion: expected,
      reason: text,
      status: z
        .enum(["received", "under_review", "in_progress", "resolved"])
        .optional(),
      ownerId: id.nullable().optional(),
      priority: z.enum(["normal", "high", "urgent"]).optional(),
      closureOutcome: z.enum(["restored", "duplicate", "invalid"]).optional(),
      zoneId: id.nullable().optional(),
      zoneConfirmed: z.boolean().optional(),
    })
    .strict()
    .parse(body);
}
