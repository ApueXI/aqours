import type { DB } from "../../config/database.js";
import { all } from "../../repositories/domain.repository.js";
import { requestDetail } from "../distribution/stock.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { filter, page } from "../../utils/query.js";

export async function listAssistanceRequests(
  db: DB,
  req: CommandContext,
  staff: boolean,
) {
  return page(
    req,
    await Promise.all(
      filter(
        req,
        await all(db, "assistance", staff ? undefined : req.actor.id),
        "createdAt",
      ).map((v) => requestDetail(db, v, staff, false)),
    ),
  );
}
