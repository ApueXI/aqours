import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { collectWaterAllocation } from "../services/collection/collect-water-allocation.service.js";
import { collectWaterAllocationInput } from "../validators/collection/collect-water-allocation.js";
import { commandContext } from "./context.js";

export function collectWaterAllocationController(
  db: DB,
  req: ActorRequest,
  _res: Response,
) {
  return collectWaterAllocation(db, {
    ...commandContext(req),
    body: collectWaterAllocationInput(req.body),
  });
}
