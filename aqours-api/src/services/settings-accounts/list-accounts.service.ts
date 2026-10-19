import type { DB } from "../../config/database.js";
import { all, userSafe } from "../../repositories/domain.repository.js";
import type { CommandContext } from "../../types/command-context.js";
import { page } from "../../utils/query.js";

export async function listAccounts(db: DB, req: CommandContext) {
  return page(req, (await all(db, "user")).map(userSafe));
}
