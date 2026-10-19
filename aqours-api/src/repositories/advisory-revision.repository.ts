import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const advisoryRevisionRepository = (db: DB) =>
  makeRepository(db, db.advisoryRevision as unknown as Delegate, {
    kind: "advisory_revision",
    table: "advisory_revisions",
    fields: {
      advisoryId: "u",
      snapshot: "j",
      action: "s",
      createdAt: "t",
    },
    junctions: [],
    include: {},
    owned: false,
  });

export type AdvisoryRevisionCreate =
  Prisma.AdvisoryRevisionUncheckedCreateInput;
