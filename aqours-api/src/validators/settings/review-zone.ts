import { z } from "zod";
import { expected, geometry, short, text } from "../common.js";
const zoneFields = {
  name: short,
  boundary: geometry.nullable().optional(),
  active: z.boolean().optional(),
  demo: z.boolean().optional(),
};
export function reviewZoneInput(body: unknown) {
  const { demo: _d, ...editable } = zoneFields;
  return z
    .object(editable)
    .partial()
    .extend({ expectedVersion: expected, reason: text })
    .strict()
    .parse(body);
}
