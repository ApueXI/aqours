import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const pickupSiteRepository = (db: DB) =>
  makeRepository(db, db.pickupSite as unknown as Delegate, {
    kind: "site",
    table: "pickup_sites",
    fields: {
      name: "s",
      address: "s",
      structuredAddress: "j?",
      instructions: "s",
      latitude: "f?",
      longitude: "f?",
      active: "b",
      demo: "b",
    },
    junctions: [],
    include: {},
    owned: false,
  });

export type PickupSiteCreate = Prisma.PickupSiteUncheckedCreateInput;
