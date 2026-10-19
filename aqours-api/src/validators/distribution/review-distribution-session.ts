import { z } from "zod";
import { expected, id, instant, text, totalLiters } from "../common.js";
const sessionFields = {
  siteId: id,
  zoneIds: z.array(id).min(1).max(100),
  startsAt: instant,
  endsAt: instant,
  totalLiters,
  instructions: text,
  demo: z.boolean().optional(),
};
export function reviewDistributionSessionInput(body: unknown) {
  const { siteId: _s, demo: _d, ...editable } = sessionFields;
  return z
    .object(editable)
    .partial()
    .extend({
      expectedVersion: expected,
      reason: text,
      status: z.enum(["open", "closed"]).optional(),
    })
    .strict()
    .parse(body);
}
