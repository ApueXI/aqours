import { structuredAddress } from "../structured-address.js";
import { z } from "zod";
import { category, id, instant, text } from "../common.js";
const location = z
  .object({
    address: text,
    structuredAddress,
    source: z.enum(["saved_address", "geocoded_address", "gps"]),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    confirmed: z.boolean(),
    accuracy: z.number().nonnegative().nullable().optional(),
    candidateToken: z.string().max(3000).optional(),
  })
  .strict();
export function createReportInput(body: unknown) {
  return z
    .object({
      connectionId: id,
      category,
      description: text,
      noticedAt: instant,
      location: location.optional(),
      answers: z
        .object({ details: z.string().trim().max(2000).optional() })
        .strict()
        .optional(),
    })
    .strict()
    .parse(body);
}
