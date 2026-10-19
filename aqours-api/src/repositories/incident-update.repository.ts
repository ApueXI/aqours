import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const incidentPublicationRepository = (db: DB) =>
  makeRepository(db, db.incidentPublication as unknown as Delegate, {
    kind: "incident_update",
    table: "incident_publications",
    fields: {
      incidentId: "u",
      category: "s",
      summary: "s",
      status: "s",
      progress: "s",
      area: "s",
      restorationAt: "t?",
      geometry: "j?",
      publishedAt: "t",
      demo: "b",
    },
    junctions: ["zoneIds"],
    include: {
      zoneIds: true,
    },
    owned: false,
  });

export type IncidentPublicationCreate =
  Prisma.IncidentPublicationUncheckedCreateInput;
