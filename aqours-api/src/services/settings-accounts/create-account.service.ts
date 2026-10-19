import type { DB } from "../../config/database.js";

import {
  create,
  event,
  userSafe,
} from "../../repositories/domain.repository.js";
import { setCredential } from "../../repositories/security.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { hashPassword } from "../../utils/password.js";

export async function createAccount(db: DB, req: CommandContext) {
  const input = req.body,
    { password, ...fields } = input;
  const doc = await create(db, "user", {
    ...fields,
    email: fields.email.toLowerCase(),
    active: fields.active ?? true,
    phone: fields.phone ?? null,
  });
  await setCredential(db, doc.id, hashPassword(password));
  await event(
    db,
    req.actor.id,
    doc.id,
    "account_created",
    "Account provisioned",
    undefined,
    undefined,
    true,
  );
  return userSafe(doc);
}
