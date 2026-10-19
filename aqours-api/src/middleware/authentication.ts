import type { Request } from "express";
import { prisma } from "../config/database.js";
import { config } from "../config/environment.js";
import { get, type Doc } from "../repositories/domain.repository.js";
import { liveSession } from "../repositories/security.repository.js";
import { fail } from "../utils/errors.js";
import { digest } from "../utils/password.js";
export type ActorRequest = Request & {
  actor: Doc;
  session: { hash: string; client: string; csrf: string };
};
export function presented(req: Request) {
  const bearer = req.get("authorization");
  if (bearer?.startsWith("Bearer "))
    return { token: bearer.slice(7), client: "mobile" };
  const token = req
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("aqours_session="))
    ?.slice(15);
  return token ? { token, client: "web" } : null;
}
export function origin(req: Request) {
  if (req.get("origin") !== config.webOrigin)
    fail(403, "Origin denied", "origin");
}
export async function authenticate(req: Request): Promise<ActorRequest> {
  const supplied = presented(req);
  if (!supplied) fail(401, "Sign in required", "unauthenticated");
  const hash = digest(supplied.token);
  const session = await liveSession(prisma, hash);
  if (!session || session.client !== supplied.client)
    fail(401, "Session expired or revoked", "unauthenticated");
  const actor = await get(prisma, "user", session.userId);
  if (!actor.active) fail(401, "Account is inactive", "unauthenticated");
  if (
    session.client === "web" &&
    !["GET", "HEAD", "OPTIONS"].includes(req.method)
  ) {
    origin(req);
    if (req.get("x-csrf-token") !== session.csrf)
      fail(403, "CSRF verification failed", "csrf");
  }
  return Object.assign(req, {
    actor,
    session: { hash, client: session.client, csrf: session.csrf },
  });
}
