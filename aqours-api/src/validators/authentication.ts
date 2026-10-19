import { z } from "zod";

export const loginInput = z
  .object({
    email: z.email().max(250),
    password: z.string().min(1).max(200),
    client: z.enum(["web", "mobile"]),
  })
  .strict();
