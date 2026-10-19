import { z } from "zod";

export function recordGuidanceChoiceInput(body: unknown) {
  return z
    .object({
      action: z.enum(["callback", "inspection", "water_support", "decline"]),
    })
    .strict()
    .parse(body);
}
