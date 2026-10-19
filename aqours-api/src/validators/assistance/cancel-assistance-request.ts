import { z } from "zod";
import { expected, text } from "../common.js";

export function cancelAssistanceRequestInput(body: unknown) {
  return z
    .object({ expectedVersion: expected, reason: text })
    .strict()
    .parse(body);
}
