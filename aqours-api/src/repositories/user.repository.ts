import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const userRepository = (db: DB) =>
  makeRepository(db, db.user as unknown as Delegate, {
    kind: "user",
    table: "users",
    fields: {
      email: "s",
      name: "s",
      phone: "s?",
      active: "b",
      role: "s",
    },
    junctions: [],
    include: {},
    owned: false,
  });

export type UserCreate = Prisma.UserUncheckedCreateInput;
