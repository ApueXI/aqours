import type { DB } from "../../config/database.js";
import { all } from "../../repositories/domain.repository.js";

export async function listSettingsZones(db: DB) {
  return all(db, "zone");
}
