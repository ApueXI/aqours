import { z } from "zod";
import { text } from "../common.js";

export function addIncidentNoteInput(body: unknown) {
  return z.object({ text }).strict().parse(body);
}
