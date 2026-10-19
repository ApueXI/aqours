import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const zoneRepository = (db: DB) =>
  makeRepository(db, db.zone as unknown as Delegate, {
    kind: "zone",
    table: "zones",
    fields: {
      code: "s",
      name: "s",
      boundary: "j?",
      active: "b",
      demo: "b",
    },
    junctions: [],
    include: {},
    owned: false,
  });

export type ZoneCreate = Prisma.ZoneUncheckedCreateInput;
