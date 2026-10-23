import type { DB } from "../../config/database.js";
import { notify } from "../../repositories/history.repository.js";

/** The single supplier's active operators may already read every operational report/request. */
export async function notifySupplier(
  db: DB,
  key: string,
  targetType: string,
  targetId: string,
  title: string,
  text: string,
) {
  const operators = await db.user.findMany({
    where: { active: true, role: { in: ["staff", "admin"] } },
    select: { id: true },
  });
  for (const operator of operators)
    await notify(db, operator.id, key, targetType, targetId, title, text);
}
