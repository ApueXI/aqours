import type { DB } from "../../config/database.js";
import { all, get } from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";

export async function getStaffAdvisory(db: DB, req: CommandContext) {
  const doc = await get(db, "advisory", String(req.params.id));
  return {
    ...doc,
    revisions: (await all(db, "advisory_revision"))
      .filter((v) => v.advisoryId === doc.id)
      .map((v) => ({
        version: v.snapshot.version,
        text: v.snapshot.text,
        source: v.snapshot.source,
        action: v.action,
        createdAt: v.createdAt,
      })),
  };
}
