import type { Doc } from "../repositories/domain.repository.js";

/** Request-independent input supplied by HTTP controllers to application commands. */
export interface CommandContext {
  actor: Doc;
  session: { hash: string; client: string; csrf: string };
  params: Record<string, string | string[]>;
  query: Record<string, any>;
  body: any;
  path: string;
  file?: Express.Multer.File;
  pendingAttachment?: string;
}
