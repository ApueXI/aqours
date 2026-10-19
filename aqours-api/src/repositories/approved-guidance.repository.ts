import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const approvedGuidanceRepository = (db: DB) =>
  makeRepository(db, db.approvedGuidance as unknown as Delegate, {
    kind: "approved_guidance",
    table: "approved_guidance",
    fields: {
      kind: "s",
      text: "s",
      source: "s",
      createdAt: "t",
    },
    junctions: [],
    include: {},
    owned: false,
  });

export type ApprovedGuidanceCreate =
  Prisma.ApprovedGuidanceUncheckedCreateInput;
