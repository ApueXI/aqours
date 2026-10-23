import type { DB } from "../../config/database.js";
import type { CommandContext } from "../../types/command-context.js";
import { event, get } from "../../repositories/domain.repository.js";
import {
  credential,
  liveSession,
  revokeOtherSessions,
  setCredential,
} from "../../repositories/security.repository.js";
import { fail } from "../../utils/errors.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { changePasswordInput } from "../../validators/authentication.js";

export async function changePassword(db: DB, req: CommandContext) {
  const input = changePasswordInput.parse(req.body);
  // Serialize with sign-in and administrative password changes on the same user row.
  const user = await get(db, "user", req.actor.id, true);
  if (!user.active || !(await liveSession(db, req.session.hash, req.actor.id)))
    fail(401, "Session expired or revoked", "unauthenticated");
  const stored = await credential(db, req.actor.id);
  if (!stored || !verifyPassword(input.currentPassword, stored.passwordHash))
    fail(400, "Current password is incorrect", "invalid_password");
  await setCredential(db, req.actor.id, hashPassword(input.newPassword));
  await revokeOtherSessions(db, req.actor.id, req.session.hash);
  await event(
    db,
    req.actor.id,
    req.actor.id,
    "password_changed",
    "Account password changed",
    undefined,
    undefined,
    true,
  );
  return { changed: true };
}
