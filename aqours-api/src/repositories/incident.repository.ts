import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const incidentRepository = (db: DB) =>
  makeRepository(db, db.incident as unknown as Delegate, {
    kind: "incident",
    table: "incidents",
    fields: {
      category: "s",
      summary: "s",
      status: "s",
      ownerId: "u?",
      area: "s",
      geometry: "j?",
      restorationAt: "t?",
      estimatedAffected: "i?",
      estimateBasis: "s?",
      estimateUpdatedAt: "t?",
      demo: "b",
      createdAt: "t",
    },
    junctions: ["zoneIds"],
    include: {
      zoneIds: true,
    },
    owned: false,
  });

export type IncidentCreate = Prisma.IncidentUncheckedCreateInput;
