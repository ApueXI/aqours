import { z } from "zod";
import { expected, geometry, instant, text } from "../common.js";

export function publishIncidentUpdateInput(body: unknown) {
  return z
    .object({
      expectedVersion: expected,
      progress: text,
      area: text,
      restorationAt: instant.nullable(),
      geometry: geometry.nullable().optional(),
    })
    .strict()
    .parse(body);
}
