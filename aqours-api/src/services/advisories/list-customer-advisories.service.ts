import type { DB } from "../../config/database.js";
import { all } from "../../repositories/domain.repository.js";
import { advisorySafe, applicable } from "./advisory-context.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { page } from "../../utils/query.js";

export async function listCustomerAdvisories(db: DB, req: CommandContext) {
  const connections = await all(db, "connection", req.actor.id);
  const notices = await applicable(
    db,
    req.actor.id,
    req.query.includeLifted === "true",
  );
  return page(
    req,
    notices.map((doc) => advisorySafe(doc, connections)),
  );
}
