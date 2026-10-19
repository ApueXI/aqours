import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const reportMessageRepository = (db: DB) =>
  makeRepository(db, db.reportMessage as unknown as Delegate, {
    kind: "message",
    table: "report_messages",
    fields: {
      reportId: "u",
      text: "s",
      authorId: "u",
      authorRole: "s",
      createdAt: "t",
    },
    junctions: [],
    include: {},
    owned: false,
  });

export type ReportMessageCreate = Prisma.ReportMessageUncheckedCreateInput;
