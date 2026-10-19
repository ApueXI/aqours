import { z } from "zod";
import { id, short, text } from "../common.js";
const connectionFields = {
  address: text,
  zoneId: id.nullable().optional(),
  zoneConfirmed: z.boolean(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
};
export function createConnectionInput(body: unknown) {
  return z
    .object({ ...connectionFields, customerId: id, reference: short })
    .strict()
    .parse(body);
}
