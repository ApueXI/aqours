import type { DB } from "../../config/database.js";
import { geocode } from "../location/geocode.service.js";
import type { CommandContext } from "../../types/command-context.js";

export async function geocodeLocation(_db: DB, req: CommandContext) {
  return geocode(req.body.address, req.body.structuredAddress);
}
