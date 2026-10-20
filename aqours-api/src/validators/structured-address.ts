import { z } from "zod";
export const structuredAddress = z
  .object({
    barangayCode: z.string().regex(/^\d{10}$/),
    streetDetails: z.string().trim().max(1000),
  })
  .strict()
  .nullable()
  .optional();
