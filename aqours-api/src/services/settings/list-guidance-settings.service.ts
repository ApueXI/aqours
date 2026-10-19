import type { DB } from "../../config/database.js";
import { all } from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";

export async function listGuidanceSettings(
  db: DB,
  _req: CommandContext,
  settings: string,
) {
  const recordKind = settings === "guidance" ? "approved_guidance" : "rule";
  const values = await all(db, recordKind),
    latest = Math.max(0, ...values.map((v) => v.version));
  return settings === "rules"
    ? values.map((v) => ({ ...v, active: v.version === latest }))
    : values;
}
