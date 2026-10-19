import { z } from "zod";
import { short } from "../common.js";
const accountFields = {
  name: short,
  phone: short.nullable().optional(),
  role: z.enum(["customer", "staff", "admin"]),
  active: z.boolean().optional(),
  password: z.string().min(12).max(200),
};
export function createAccountInput(body: unknown) {
  return z
    .object({ ...accountFields, email: z.email().max(250) })
    .strict()
    .parse(body);
}
