import { z } from "zod";
import { category, geometry, id, instant, text } from "../common.js";
const content = {
  category,
  summary: text,
  zoneIds: z.array(id).min(1).max(100),
  area: text,
  ownerId: id.nullable().optional(),
  geometry: geometry.nullable().optional(),
  restorationAt: instant.nullable().optional(),
  estimatedAffected: z.number().int().nonnegative().nullable().optional(),
  estimateBasis: text.nullable().optional(),
  demo: z.boolean().optional(),
};
export function createIncidentInput(body: unknown) {
  return z.object(content).strict().parse(body);
}
