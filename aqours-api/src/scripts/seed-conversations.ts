import type { DB } from "../config/database.js";
import type { Doc } from "../types/domain.js";
import { addReportMessage } from "../services/reports/add-report-message.service.js";

export async function seedConversation(
  db: DB,
  customer: Doc,
  staff: Doc,
  reportId: string,
) {
  const context = {
    actor: customer,
    session: { hash: "seed", client: "mobile", csrf: "" },
    params: { id: reportId },
    query: {},
    path: "seed",
    body: {
      text: "Fictional customer update: the water issue is continuing. Could you check the service status?",
    },
  };
  await addReportMessage(db, context, false);
  await addReportMessage(
    db,
    {
      ...context,
      actor: staff,
      body: {
        text: "Demonstration supplier reply: we received your update and are reviewing your report. A restoration time has not been confirmed.",
      },
    },
    true,
  );
}
