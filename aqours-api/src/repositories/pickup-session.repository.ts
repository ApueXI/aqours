import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const pickupSessionRepository = (db: DB) =>
  makeRepository(db, db.pickupSession as unknown as Delegate, {
    kind: "pickup_session",
    table: "pickup_sessions",
    fields: {
      siteId: "u",
      startsAt: "t",
      endsAt: "t",
      status: "s",
      instructions: "s",
      demo: "b",
      updatedAt: "t",
    },
    junctions: ["zoneIds"],
    include: {
      zoneIds: true,
    },
    owned: false,
  });

export type PickupSessionCreate = Prisma.PickupSessionUncheckedCreateInput;
