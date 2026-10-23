import { connectionProvision } from "../settings-connections/create-connection.js";
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
    .object({
      ...accountFields,
      email: z.email().max(250),
      connection: connectionProvision.optional(),
    })
    .strict()
    .superRefine((input, ctx) => {
      if (input.connection && input.role !== "customer")
        ctx.addIssue({
          code: "custom",
          message: "Only customers can have service connections",
          path: ["connection"],
        });
    })
    .parse(body);
}
