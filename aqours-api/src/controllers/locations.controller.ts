import { z } from "zod";
import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import {
  children,
  regions,
} from "../services/location/psgc-catalog.service.js";
export async function psgcRegionsController(
  _db: DB,
  _req: ActorRequest,
  _res: Response,
) {
  return regions();
}
export async function psgcChildrenController(
  _db: DB,
  req: ActorRequest,
  _res: Response,
) {
  const parentCode = z
    .string()
    .regex(/^\d{10}$/)
    .parse(req.query.parentCode);
  return children(parentCode);
}
