import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const serviceConnectionRepository = (db: DB) =>
  makeRepository(db, db.serviceConnection as unknown as Delegate, {
    kind: "connection",
    table: "service_connections",
    fields: {
      customerId: "u",
      reference: "s",
      address: "s",
      zoneId: "u?",
      zoneConfirmed: "b",
      latitude: "f?",
      longitude: "f?",
    },
    junctions: [],
    include: {},
    owned: true,
  });

export type ServiceConnectionCreate =
  Prisma.ServiceConnectionUncheckedCreateInput;
