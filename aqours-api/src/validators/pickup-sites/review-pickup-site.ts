import { structuredAddress } from "../structured-address.js";
import { z } from "zod";
import { expected, short, text } from "../common.js";
const siteFields = {
  name: short,
  address: text,
  structuredAddress,
  instructions: text,
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  active: z.boolean().optional(),
  demo: z.boolean().optional(),
};
export function reviewPickupSiteInput(body: unknown) {
  return z
    .object(siteFields)
    .partial()
    .extend({ expectedVersion: expected, reason: text })
    .strict()
    .parse(body);
}
