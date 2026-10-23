import type { DB } from "../config/database.js";

export async function conversationRows(db: DB, customerId?: string) {
  return db.report.findMany({
    where: customerId ? { customerId } : {},
    select: {
      id: true,
      reference: true,
      category: true,
      status: true,
      description: true,
      submittedAt: true,
      message_report: {
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: 1,
        select: {
          id: true,
          text: true,
          authorId: true,
          authorRole: true,
          createdAt: true,
        },
      },
    },
  });
}
