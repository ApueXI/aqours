import type { Express } from "express";
import {
  downloadAttachmentController,
  uploadAttachmentController,
} from "../controllers/attachments.controller.js";
import { prepareAttachmentUpload } from "../middleware/attachment-upload.js";
import { route } from "../middleware/endpoint.js";

export function attachmentRoutes(app: Express) {
  app.post("/api/v1/reports/:id/attachments", prepareAttachmentUpload);
  route(
    app,
    "post",
    "/reports/:id/attachments",
    "customer",
    uploadAttachmentController,
  );
  route(app, "get", "/attachments/:id", "any", downloadAttachmentController);
}
