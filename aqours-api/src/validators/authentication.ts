import { z } from "zod";

export const loginInput = z
  .object({
    email: z.email().max(250),
    password: z.string().min(1).max(200),
    client: z.enum(["web", "mobile"]),
  })
  .strict();

export const changePasswordInput = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(12).max(200),
  })
  .strict()
  .refine((input) => input.currentPassword !== input.newPassword, {
    message: "Choose a different new password",
    path: ["newPassword"],
  });
