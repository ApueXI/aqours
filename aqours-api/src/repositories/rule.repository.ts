import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const guidanceRuleRepository = (db: DB) =>
  makeRepository(db, db.guidanceRule as unknown as Delegate, {
    kind: "rule",
    table: "guidance_rules",
    fields: {
      active: "b",
      contactText: "s",
      inspectionText: "s",
      waterText: "s",
      createdAt: "t",
    },
    junctions: [],
    include: {},
    owned: false,
  });

export type GuidanceRuleCreate = Prisma.GuidanceRuleUncheckedCreateInput;
