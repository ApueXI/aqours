import type { DB } from "../../config/database.js";
import {
  create,
  event,
  get,
  now,
} from "../../repositories/domain.repository.js";
import { advisoryRevision } from "./advisory-context.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
import { zones } from "../../validators/common.js";

export async function createAdvisory(db: DB, req: CommandContext) {
  const input = req.body;
  if (input.zoneIds.length) await zones(db, input.zoneIds);
  for (const connection of input.connectionIds ?? [])
    await get(db, "connection", connection);
  if (!input.zoneIds.length && !input.connectionIds?.length)
    fail(400, "Advisory requires explicit targets");
  if (input.startsAt && input.endsAt && input.startsAt >= input.endsAt)
    fail(400, "Invalid advisory interval");
  const result = await create(db, "advisory", {
    ...input,
    connectionIds: input.connectionIds ?? [],
    geometry: input.geometry ?? null,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    demo: input.demo ?? false,
    state: "draft",
    publishedAt: null,
    liftedAt: null,
    liftReason: null,
    updatedAt: now(),
  });
  await advisoryRevision(db, result, "draft");
  await event(db, req.actor.id, result.id, "created", "Advisory draft created");
  return result;
}
