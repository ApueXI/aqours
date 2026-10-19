import { z } from "zod";
import { expected, text } from "../common.js";

export function collectWaterAllocationInput(body: unknown) {
  return z
    .object({
      expectedVersion: expected,
      reason: text.optional(),
      outcome: text,
      nextSteps: text,
    })
    .strict()
    .parse(body);
}
