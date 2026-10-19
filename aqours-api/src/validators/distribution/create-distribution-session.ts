import { z } from "zod";
import { id, instant, text, totalLiters } from "../common.js";
const sessionFields = {
  siteId: id,
  zoneIds: z.array(id).min(1).max(100),
  startsAt: instant,
  endsAt: instant,
  totalLiters,
  instructions: text,
  demo: z.boolean().optional(),
};
export function createDistributionSessionInput(body: unknown) {
  return z.object(sessionFields).strict().parse(body);
}
