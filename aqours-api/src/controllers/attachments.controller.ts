import type { Response } from "express";
import type { DB } from "../config/database.js";
import type { ActorRequest } from "../middleware/authentication.js";
import {
  downloadAttachment,
  uploadAttachment,
} from "../services/attachments/attachments.service.js";
import { commandContext } from "./context.js";

export async function uploadAttachmentController(db: DB, req: ActorRequest) {
  const input = {
    ...commandContext(req),
    file: req.file,
    pendingAttachment: undefined as string | undefined,
  };
  try {
    return await uploadAttachment(db, input);
  } finally {
    (req as ActorRequest & { pendingAttachment?: string }).pendingAttachment =
      input.pendingAttachment;
  }
}
export async function downloadAttachmentController(
  db: DB,
  req: ActorRequest,
  res: Response,
) {
  const result = await downloadAttachment(db, commandContext(req));
  res.set({
    "Content-Type": result.mediaType,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
  });
  res.send(result.bytes);
}
