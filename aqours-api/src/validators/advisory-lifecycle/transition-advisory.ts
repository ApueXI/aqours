import { z } from "zod";
import { expected, text } from "../common.js";

export function transitionAdvisoryInput(
  body: unknown,
  action: "publish" | "lift",
) {
  return z
    .object({
      expectedVersion: expected,
      ...(action === "lift" ? { reason: text } : {}),
    })
    .strict()
    .parse(body);
}
