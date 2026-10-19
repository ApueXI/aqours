import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const guidanceChoiceRepository = (db: DB) =>
  makeRepository(db, db.guidanceChoice as unknown as Delegate, {
    kind: "guidance_choice",
    table: "guidance_choices",
    fields: {
      guidanceId: "u",
      action: "s",
      createdAt: "t",
      customerId: "u",
    },
    junctions: [],
    include: {},
    owned: true,
  });

export type GuidanceChoiceCreate = Prisma.GuidanceChoiceUncheckedCreateInput;
