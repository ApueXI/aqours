import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const attachmentRepository = (db: DB) =>
  makeRepository(db, db.attachment as unknown as Delegate, {
    kind: "attachment",
    table: "attachments",
    fields: {
      reportId: "u",
      filename: "s",
      mediaType: "s",
      byteSize: "i",
      createdAt: "t",
    },
    junctions: [],
    include: {},
    owned: false,
  });

export type AttachmentCreate = Prisma.AttachmentUncheckedCreateInput;
