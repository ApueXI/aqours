import { z } from "zod";
import { category, expected, geometry, id, instant, text } from "../common.js";
const content = {
  category,
  summary: text,
  zoneIds: z.array(id).min(1).max(100),
  area: text,
  ownerId: id.nullable().optional(),
  geometry: geometry.nullable().optional(),
  restorationAt: instant.nullable().optional(),
  estimatedAffected: z.number().int().nonnegative().nullable().optional(),
  estimateBasis: text.nullable().optional(),
  demo: z.boolean().optional(),
};
export function reviewIncidentInput(body: unknown) {
  const { category: _c, demo: _d, ...editable } = content;
  return z
    .object(editable)
    .partial()
    .extend({
      expectedVersion: expected,
      reason: text,
      status: z
        .enum([
          "investigating",
          "confirmed",
          "work_in_progress",
          "monitoring",
          "resolved",
        ])
        .optional(),
    })
    .strict()
    .parse(body);
}
