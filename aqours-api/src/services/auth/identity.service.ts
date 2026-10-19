import type { DB } from "../../config/database.js";
import { all, userSafe } from "../../repositories/domain.repository.js";
import { connectionSafe, zoneSafe } from "../presentation/projection.js";

export async function connections(db: DB, customerId?: string) {
  return (await all(db, "connection", customerId)).map(connectionSafe);
}
export async function zones(db: DB, includeInactive = false) {
  return (await all(db, "zone"))
    .filter((zone) => includeInactive || zone.active)
    .map(zoneSafe);
}
export async function operators(db: DB) {
  return (await all(db, "user"))
    .filter((user) => user.active && user.role !== "customer")
    .map(userSafe);
}
