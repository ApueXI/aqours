import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const supplierRepository = (db: DB) =>
  makeRepository(db, db.supplier as unknown as Delegate, {
    kind: "supplier",
    table: "suppliers",
    fields: {
      name: "s",
      demo: "b",
    },
    junctions: [],
    include: {},
    owned: false,
  });

export type SupplierCreate = Prisma.SupplierUncheckedCreateInput;
