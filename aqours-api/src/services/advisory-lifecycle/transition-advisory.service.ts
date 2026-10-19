import type { DB } from "../../config/database.js";
import {
  event,
  get,
  now,
  save,
  version,
} from "../../repositories/domain.repository.js";
import {
  advisoryFanout,
  advisoryPublisher,
  advisoryRevision,
  advisoryTargets,
} from "../advisories/advisory-context.service.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";

export async function transitionAdvisory(
  db: DB,
  req: CommandContext,
  action: "publish" | "lift",
) {
  const input = req.body;
  await advisoryPublisher(db, req);
  const doc = await get(db, "advisory", String(req.params.id), true);
  version(doc, input.expectedVersion);
  if (action === "publish") {
    await advisoryTargets(db, doc);
  }
  if (
    (action === "publish" && doc.state !== "draft") ||
    (action === "lift" && doc.state !== "published")
  )
    fail(409, "Invalid advisory lifecycle transition");
  const result = await save(db, "advisory", {
    ...doc,
    state: action === "publish" ? "published" : "lifted",
    updatedAt: now(),
    ...(action === "publish"
      ? { publishedAt: now() }
      : { liftedAt: now(), liftReason: input.reason }),
  });
  await advisoryRevision(db, result, result.state);
  await event(
    db,
    req.actor.id,
    doc.id,
    result.state,
    String(input.reason ?? "Advisory published"),
  );
  await advisoryFanout(db, result, result.state);
  return result;
}
