import { z } from "zod";
import { expected, id, text } from "../common.js";
const connectionFields = {
  address: text,
  zoneId: id.nullable().optional(),
  zoneConfirmed: z.boolean(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
};
export function reviewConnectionInput(body: unknown) {
  return z
    .object(connectionFields)
    .partial()
    .extend({ expectedVersion: expected, reason: text })
    .strict()
    .parse(body);
}
