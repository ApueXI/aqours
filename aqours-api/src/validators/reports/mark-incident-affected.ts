import { z } from "zod";
import { id } from "../common.js";

export function markIncidentAffectedInput(body: unknown) {
  return z.object({ connectionId: id }).strict().parse(body);
}
