import { randomBytes } from "node:crypto";
import { prisma, transaction } from "../../config/database.js";
import { config } from "../../config/environment.js";
import { get, userSafe } from "../../repositories/domain.repository.js";
import {
  credential,
  insertSession,
  liveSession,
  lockedUserByEmail,
  revokeToken,
} from "../../repositories/security.repository.js";
import { fail } from "../../utils/errors.js";
import { digest, verifyPassword } from "../../utils/password.js";

export interface LoginInput {
  email: string;
  password: string;
  client: "web" | "mobile";
}
export async function signIn(input: LoginInput) {
  return transaction(async (db) => {
    const rows = await lockedUserByEmail(db, input.email);
    const user = rows[0] ? await get(db, "user", rows[0].id) : null;
    const credentials = user ? await credential(db, user.id) : null;
    const encoded =
      credentials?.passwordHash ??
      "00000000000000000000000000000000:" + "00".repeat(64);
    if (!verifyPassword(input.password, encoded) || !user)
      fail(401, "Invalid email or password", "unauthenticated");
    if (
      !user.active ||
      (input.client === "web" && user.role === "customer") ||
      (input.client === "mobile" && user.role !== "customer")
    )
      fail(403, "Account cannot use this application", "forbidden");
    const token = randomBytes(32).toString("base64url"),
      csrfToken = randomBytes(32).toString("base64url");
    await insertSession(db, {
      tokenHash: digest(token),
      userId: user.id,
      client: input.client,
      csrf: csrfToken,
      expiresAt: new Date(Date.now() + config.sessionDays * 86400000),
    });
    return { user: userSafe(user), token, csrfToken };
  });
}
export const currentSession = (token: string) =>
  liveSession(prisma, digest(token));
export const signOut = (token: string) => revokeToken(prisma, digest(token));
