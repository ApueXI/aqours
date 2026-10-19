import type { RequestHandler } from "express";
import multer from "multer";
import { prisma } from "../config/database.js";
import { authenticate } from "../middleware/authentication.js";
import { get, own } from "../repositories/domain.repository.js";
import { fail } from "../utils/errors.js";
import { digest } from "../utils/password.js";
import { id } from "../validators/common.js";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
}).single("file");

export const prepareAttachmentUpload: RequestHandler = async (
  raw,
  res,
  next,
) => {
  try {
    const req = await authenticate(raw);
    id.parse(req.params.id);
    if (req.actor.role !== "customer") fail(403, "Customer upload only");
    own(await get(prisma, "report", String(req.params.id)), req.actor);
    upload(req, res, (error) => {
      if (error) return next(error);
      if (!req.file) {
        try {
          fail(400, "Choose one image file");
        } catch (error) {
          next(error);
        }
        return;
      }
      req.body = {
        digest: digest(req.file.buffer.toString("base64")),
        filename: req.file.originalname,
      };
      next();
    });
  } catch (error) {
    next(error);
  }
};
