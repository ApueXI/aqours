import { z } from "zod";
import { text } from "../common.js";

export function addReportMessageInput(body: unknown, _staff: boolean) {
  return z.object({ text }).strict().parse(body);
}
