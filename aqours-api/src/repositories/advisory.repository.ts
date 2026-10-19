import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const advisoryRepository = (db: DB) =>
  makeRepository(db, db.advisory as unknown as Delegate, {
    kind: "advisory",
    table: "advisories",
    fields: {
      kind: "s",
      title: "s",
      text: "s",
      source: "s",
      geometry: "j?",
      startsAt: "t?",
      endsAt: "t?",
      state: "s",
      publishedAt: "t?",
      liftedAt: "t?",
      liftReason: "s?",
      demo: "b",
      updatedAt: "t",
    },
    junctions: ["zoneIds", "connectionIds"],
    include: {
      zoneIds: true,
      connectionIds: true,
    },
    owned: false,
  });

export type AdvisoryCreate = Prisma.AdvisoryUncheckedCreateInput;
