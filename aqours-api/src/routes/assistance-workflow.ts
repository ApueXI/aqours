import type { Express } from "express";
import {
  addAssistanceNoteController,
  transitionAssistanceRequestController,
} from "../controllers/assistance-workflow.controller.js";
import { route } from "../middleware/endpoint.js";
export function assistanceWorkflowRoutes(app: Express) {
  route(
    app,
    "post",
    "/staff/assistance-requests/:id/transition",
    "staff",
    transitionAssistanceRequestController,
  );
  route(
    app,
    "post",
    "/staff/assistance-requests/:id/notes",
    "staff",
    addAssistanceNoteController,
  );
}
