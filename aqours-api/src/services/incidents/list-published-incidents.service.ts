import type { DB } from "../../config/database.js";
import { all } from "../../repositories/domain.repository.js";
import { published } from "../reports/report-context.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { page } from "../../utils/query.js";

export async function listPublishedIncidents(db: DB, req: CommandContext) {
  return page(
    req,
    (
      await Promise.all(
        (await all(db, "incident")).map((doc) => published(db, doc)),
      )
    ).filter(Boolean),
  );
}
