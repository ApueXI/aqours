import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { processImage } from "./process-image.js";
import type { DB } from "../../config/database.js";
import { config } from "../../config/environment.js";
import {
  create,
  event,
  get,
  now,
  own,
} from "../../repositories/domain.repository.js";
import { attachmentSafe } from "../presentation/projection.js";
import type { CommandContext } from "../../types/command-context.js";
import { fail } from "../../utils/errors.js";
export async function uploadAttachment(db: DB, req: CommandContext) {
  const report = await get(db, "report", String(req.params.id));
  own(report, req.actor);
  const file = req.file;
  if (!file) fail(400, "Choose one image file");
  const { bytes, mediaType } = await processImage(file.buffer);
  await mkdir(config.attachmentDir, { recursive: true, mode: 0o700 });
  if (
    !(await realpath(config.attachmentDir)).startsWith(
      config.projectRoot + path.sep,
    )
  )
    fail(500, "Invalid attachment storage");
  const attachmentId = randomUUID(),
    filePath = path.join(config.attachmentDir, attachmentId),
    temp = filePath + ".partial";
  try {
    await writeFile(temp, bytes, { flag: "wx", mode: 0o600 });
    await rename(temp, filePath);
  } catch (error) {
    await unlink(temp).catch(() => undefined);
    throw error;
  }
  req.pendingAttachment = filePath;
  const doc = await create(
    db,
    "attachment",
    {
      reportId: report.id,
      filename:
        path
          .basename(file.originalname)
          .replace(/[\r\n\x00-\x1f]/g, "")
          .slice(0, 180) || "photo",
      mediaType,
      byteSize: bytes.length,
      createdAt: now(),
    },
    req.actor.id,
    report.id,
    attachmentId,
  );
  await event(db, req.actor.id, report.id, "attachment", "Photo attached");
  return attachmentSafe(doc);
}
export async function downloadAttachment(db: DB, req: CommandContext) {
  const doc = await get(db, "attachment", String(req.params.id)),
    report = await get(db, "report", doc.reportId);
  if (req.actor.role === "customer") own(report, req.actor);
  let bytes: Buffer;
  try {
    bytes = await readFile(path.join(config.attachmentDir, doc.id));
  } catch {
    fail(503, "Photo is temporarily unavailable", "storage_unavailable");
  }
  return { bytes, mediaType: doc.mediaType };
}
