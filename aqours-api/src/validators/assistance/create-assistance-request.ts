import { z } from "zod";
import { assistanceType, id, liters, short, text } from "../common.js";
const details = z
  .object({
    question: text.optional(),
    contactMethod: z.literal("phone").optional(),
    contactNumber: short.optional(),
    preferredWindow: text.optional(),
    issueDetails: text.optional(),
    siteAddress: text.optional(),
    accessInstructions: text.optional(),
    requestedLiters: liters.optional(),
    sessionId: id.nullable().optional(),
    notes: text.optional(),
  })
  .strict();
export function createAssistanceRequestInput(body: unknown) {
  return z
    .object({ reportId: id, type: assistanceType, details })
    .strict()
    .parse(body);
}
