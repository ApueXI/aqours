import type { DB } from "../../config/database.js";
import {
  all,
  create,
  event,
  now,
} from "../../repositories/domain.repository.js";
import { advisoryLock } from "../../repositories/locks.repository.js";
import type { CommandContext } from "../../types/command-context.js";

export async function publishGuidanceSettings(
  db: DB,
  req: CommandContext,
  settings: string,
) {
  const recordKind = settings === "guidance" ? "approved_guidance" : "rule";
  const input = req.body;
  await advisoryLock(db, recordKind);
  const previous = await all(db, recordKind),
    next = Math.max(0, ...previous.map((v) => v.version)) + 1;
  const doc = await create(db, recordKind, {
    ...input,
    version: next,
    ...(settings === "rules" ? { active: true } : {}),
    createdAt: now(),
  });
  await event(
    db,
    req.actor.id,
    doc.id,
    `${recordKind}_published`,
    "New approved immutable configuration version",
    undefined,
    undefined,
    true,
  );
  return doc;
}
