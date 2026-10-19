import type { DB } from "../../config/database.js";
import { all } from "../../repositories/domain.repository.js";
import { advisorySafe, applicable } from "./advisory-context.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";

export async function getCustomerAdvisory(db: DB, req: CommandContext) {
  const doc = (await applicable(db, req.actor.id, true)).find(
    (v) => v.id === req.params.id,
  );
  if (!doc) fail(404, "Advisory not found");
  const revisions = (await all(db, "advisory_revision"))
    .filter((v) => v.advisoryId === doc.id && v.action !== "draft")
    .map((v) => ({
      version: v.snapshot.version,
      text: v.snapshot.text,
      source: v.snapshot.source,
      action: v.action,
      createdAt: v.createdAt,
    }));
  return {
    ...advisorySafe(doc, await all(db, "connection", req.actor.id)),
    revisions,
  };
}
