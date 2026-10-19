import type { DB } from "../../config/database.js";

import {
  all,
  event,
  get,
  save,
  userSafe,
  version,
} from "../../repositories/domain.repository.js";
import { advisoryLock } from "../../repositories/locks.repository.js";
import {
  revokeUser,
  setCredential,
} from "../../repositories/security.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { hashPassword } from "../../utils/password.js";

export async function reviewAccount(db: DB, req: CommandContext) {
  const input = req.body;
  await advisoryLock(db, "account-administration");
  const doc = await get(db, "user", String(req.params.id), true);
  version(doc, input.expectedVersion);
  const { expectedVersion: _e, reason: _r, password, ...fields } = input;
  if (
    doc.role === "admin" &&
    doc.active &&
    ((fields.role && fields.role !== "admin") || fields.active === false)
  ) {
    if (
      (await all(db, "user")).filter((v) => v.active && v.role === "admin")
        .length <= 1
    )
      fail(409, "The last active administrator must remain active");
  }
  if (fields.role && fields.role !== doc.role) {
    const connections = await all(db, "connection", doc.id);
    if (connections.length && fields.role !== "customer")
      fail(409, "Customer connections must retain customer ownership");
  }
  if (password) await setCredential(db, doc.id, hashPassword(password));
  if (
    password ||
    (fields.role !== undefined && fields.role !== doc.role) ||
    (fields.active !== undefined && fields.active !== doc.active)
  )
    await revokeUser(db, doc.id);
  await event(
    db,
    req.actor.id,
    doc.id,
    "account_updated",
    input.reason,
    undefined,
    undefined,
    true,
    { fields: Object.keys(fields), passwordReset: !!password },
  );
  return userSafe(await save(db, "user", { ...doc, ...fields }));
}
