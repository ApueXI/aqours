import type { ActorRequest } from "../middleware/authentication.js";
import type { CommandContext } from "../types/command-context.js";

/** Pass explicit request data to application services without exposing Express methods. */
export const commandContext = (req: ActorRequest): CommandContext => ({
  actor: req.actor,
  session: req.session,
  params: req.params,
  query: req.query,
  body: req.body,
  path: req.path,
});
