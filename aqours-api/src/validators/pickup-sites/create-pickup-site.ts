import { z } from "zod";
import { short, text } from "../common.js";
const siteFields = {
  name: short,
  address: text,
  instructions: text,
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  active: z.boolean().optional(),
  demo: z.boolean().optional(),
};
export function createPickupSiteInput(body: unknown) {
  return z.object(siteFields).strict().parse(body);
}
