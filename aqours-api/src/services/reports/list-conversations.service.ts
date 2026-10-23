import type { DB } from "../../config/database.js";
import type { CommandContext } from "../../types/command-context.js";
import { conversationRows } from "../../repositories/conversations.repository.js";
import { page } from "../../utils/query.js";

export async function listConversations(
  db: DB,
  req: CommandContext,
  staff: boolean,
) {
  const rows = await conversationRows(db, staff ? undefined : req.actor.id);
  const conversations = rows
    .map((row) => ({
      reportId: row.id,
      reference: row.reference,
      category: row.category,
      status: row.status,
      description: row.description,
      latestMessage: row.message_report[0]
        ? {
            ...row.message_report[0],
            createdAt: row.message_report[0].createdAt.toISOString(),
          }
        : null,
      updatedAt: (
        row.message_report[0]?.createdAt ?? row.submittedAt
      ).toISOString(),
    }))
    .sort(
      (a, b) =>
        b.updatedAt.localeCompare(a.updatedAt) ||
        a.reportId.localeCompare(b.reportId),
    );
  return page(req, conversations);
}
