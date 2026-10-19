import type { DB } from "../../config/database.js";
import { all } from "../../repositories/domain.repository.js";
import { sessionDetail } from "./stock.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { page } from "../../utils/query.js";

export async function listDistributionSessions(db: DB, req: CommandContext) {
  return page(
    req,
    await Promise.all(
      (await all(db, "pickup_session")).map((v) => sessionDetail(db, v)),
    ),
  );
}
