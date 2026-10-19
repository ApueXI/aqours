import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const seedMarkerRepository = (db: DB) =>
  makeRepository(db, db.seedMarker as unknown as Delegate, {
    kind: "seed_marker",
    table: "seed_markers",
    fields: {
      fixture: "s",
      appliedAt: "t",
      demo: "b",
    },
    junctions: [],
    include: {},
    owned: false,
  });

export type SeedMarkerCreate = Prisma.SeedMarkerUncheckedCreateInput;
