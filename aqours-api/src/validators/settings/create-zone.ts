import { z } from "zod";
import { geometry, short } from "../common.js";
const zoneFields = {
  name: short,
  boundary: geometry.nullable().optional(),
  active: z.boolean().optional(),
  demo: z.boolean().optional(),
};
export function createZoneInput(body: unknown) {
  return z
    .object({ code: short, ...zoneFields })
    .strict()
    .parse(body);
}
