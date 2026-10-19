import { z } from "zod";
import { expected, id, text } from "../common.js";

export function linkReportIncidentInput(body: unknown) {
  return z
    .object({
      expectedVersion: expected,
      incidentId: id.nullable(),
      reason: text,
    })
    .strict()
    .parse(body);
}
