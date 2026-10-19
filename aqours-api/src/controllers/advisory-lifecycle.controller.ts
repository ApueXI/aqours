import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import { transitionAdvisory } from "../services/advisory-lifecycle/transition-advisory.service.js";
import { transitionAdvisoryInput } from "../validators/advisory-lifecycle/transition-advisory.js";
import { commandContext } from "./context.js";

export function transitionAdvisoryController(
  db: DB,
  req: ActorRequest,
  _res: Response,
  action: "publish" | "lift",
) {
  return transitionAdvisory(
    db,
    { ...commandContext(req), body: transitionAdvisoryInput(req.body, action) },
    action,
  );
}
