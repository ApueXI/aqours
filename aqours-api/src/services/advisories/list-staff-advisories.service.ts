import type { DB } from "../../config/database.js";
import { all } from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { page } from "../../utils/query.js";

export async function listStaffAdvisories(db: DB, req: CommandContext) {
  return page(req, await all(db, "advisory"));
}
