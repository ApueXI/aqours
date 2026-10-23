import { structuredAddress } from "../structured-address.js";
import { z } from "zod";
import { id, short, text } from "../common.js";
const connectionFields = {
  address: text,
  structuredAddress,
  zoneId: id.nullable().optional(),
  zoneConfirmed: z.boolean(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
};
export const connectionProvision = z
  .object({
    ...connectionFields,
    reference: short.optional(),
  })
  .strict();
export function createConnectionInput(body: unknown) {
  return connectionProvision.extend({ customerId: id }).parse(body);
}
