import { z } from "zod";
import { geometry, id, instant, kind, short, text } from "../common.js";
const content = {
  kind,
  title: short,
  text,
  source: text,
  zoneIds: z.array(id).max(100),
  connectionIds: z.array(id).max(1000).optional(),
  geometry: geometry.nullable().optional(),
  startsAt: instant.nullable().optional(),
  endsAt: instant.nullable().optional(),
  demo: z.boolean().optional(),
};
export function createAdvisoryInput(body: unknown) {
  return z.object(content).strict().parse(body);
}
