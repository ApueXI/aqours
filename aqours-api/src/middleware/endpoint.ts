import type { Express, Response } from "express";
import { unlink } from "node:fs/promises";
import {
  CommitUncertain,
  prisma,
  transaction,
  type DB,
} from "../config/database.js";
import {
  beginOperation,
  finishOperation,
  priorOperation,
} from "../repositories/operations.repository.js";
import { fail } from "../utils/errors.js";
import { operationFingerprint } from "../utils/operation-fingerprint.js";
import { id } from "../validators/common.js";
import { authenticate, type ActorRequest } from "./authentication.js";
type Handler = (db: DB, req: ActorRequest, res: Response) => Promise<any>;
export function route(
  app: Express,
  method: "get" | "post" | "patch",
  path: string,
  access: "any" | "customer" | "staff" | "admin",
  handler: Handler,
  idempotent = method !== "get",
) {
  app[method]("/api/v1" + path, async (raw, res, next) => {
    try {
      const req = await authenticate(raw);
      if (
        (access === "customer" && req.actor.role !== "customer") ||
        (access === "staff" && req.actor.role === "customer") ||
        (access === "admin" && req.actor.role !== "admin")
      )
        fail(403, "Role denied", "forbidden");
      for (const value of Object.values(req.params)) id.parse(value);
      const invoke = async (db: DB) => {
        if (!idempotent) return handler(db, req, res);
        const key = id.parse(req.get("idempotency-key"));
        const scope = `${req.method}:${req.path}`;
        const fingerprint = await operationFingerprint(
          req.actor.id,
          scope,
          key,
          req.body ?? {},
        );
        const prior = await priorOperation(db, req.actor.id, scope, key);
        if (prior) {
          if (prior.fingerprint !== fingerprint)
            fail(
              409,
              "Operation key reused with different content",
              "idempotency_conflict",
            );
          return prior.response;
        }
        await beginOperation(db, req.actor.id, scope, key, fingerprint);
        const result = await handler(db, req, res);
        await finishOperation(db, req.actor.id, scope, key, result);
        return result;
      };
      const value =
        method === "get" ? await invoke(prisma) : await transaction(invoke);
      if (!res.headersSent)
        res.json(
          value && typeof value === "object" && "data" in value
            ? value
            : { data: value },
        );
    } catch (error) {
      const pending = (raw as ActorRequest & { pendingAttachment?: string })
        .pendingAttachment;
      if (pending && !(error instanceof CommitUncertain))
        await unlink(pending).catch(() => undefined);
      next(error);
    }
  });
}
export { filter, page, validateFilters } from "../utils/query.js";
