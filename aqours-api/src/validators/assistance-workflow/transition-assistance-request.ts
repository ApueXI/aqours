import { z } from "zod";
import { expected, id, instant, text } from "../common.js";

export function transitionAssistanceRequestInput(body: unknown) {
  return z
    .object({
      expectedVersion: expected,
      status: z.enum([
        "accepted",
        "scheduled",
        "in_progress",
        "completed",
        "unavailable",
        "cancelled",
      ]),
      reason: text.optional(),
      ownerId: id.optional(),
      appointmentAt: instant.optional(),
      outcome: text.optional(),
      nextSteps: text.optional(),
    })
    .strict()
    .parse(body);
}
