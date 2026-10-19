import { z } from "zod";
import { expected, short, text } from "../common.js";
const accountFields = {
  name: short,
  phone: short.nullable().optional(),
  role: z.enum(["customer", "staff", "admin"]),
  active: z.boolean().optional(),
  password: z.string().min(12).max(200),
};
export function reviewAccountInput(body: unknown) {
  return z
    .object(accountFields)
    .partial()
    .extend({ expectedVersion: expected, reason: text })
    .strict()
    .parse(body);
}
