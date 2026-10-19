import { z } from "zod";
import { instant } from "../common.js";
const answers = z
  .object({
    needsWater: z.boolean().optional(),
    hazard: z.boolean().optional(),
    persistent: z.boolean().optional(),
    nearbyAffected: z.enum(["yes", "no", "unknown"]).optional(),
    waterNeededBy: instant.optional(),
  })
  .strict();
export function evaluateGuidanceInput(body: unknown) {
  return z.object({ answers: answers.optional() }).strict().parse(body);
}
