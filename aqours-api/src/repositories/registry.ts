import type { DB } from "../config/database.js";
import { advisoryRevisionRepository } from "./advisory-revision.repository.js";
import { advisoryRepository } from "./advisory.repository.js";
import { approvedGuidanceRepository } from "./approved-guidance.repository.js";
import { assistanceRequestRepository } from "./assistance.repository.js";
import { attachmentRepository } from "./attachment.repository.js";
import { serviceConnectionRepository } from "./connection.repository.js";
import { guidanceChoiceRepository } from "./guidance-choice.repository.js";
import { guidanceEvaluationRepository } from "./guidance.repository.js";
import { incidentPublicationRepository } from "./incident-update.repository.js";
import { incidentRepository } from "./incident.repository.js";
import { reportMessageRepository } from "./message.repository.js";
import { pickupSessionRepository } from "./pickup-session.repository.js";
import { reportRepository } from "./report.repository.js";
import { guidanceRuleRepository } from "./rule.repository.js";
import { seedMarkerRepository } from "./seed-marker.repository.js";
import { pickupSiteRepository } from "./site.repository.js";
import { supplierRepository } from "./supplier.repository.js";
import { userRepository } from "./user.repository.js";
import { zoneRepository } from "./zone.repository.js";

export const repositories = {
  supplier: supplierRepository,
  user: userRepository,
  zone: zoneRepository,
  connection: serviceConnectionRepository,
  report: reportRepository,
  message: reportMessageRepository,
  attachment: attachmentRepository,
  incident: incidentRepository,
  incident_update: incidentPublicationRepository,
  advisory: advisoryRepository,
  advisory_revision: advisoryRevisionRepository,
  assistance: assistanceRequestRepository,
  site: pickupSiteRepository,
  pickup_session: pickupSessionRepository,
  approved_guidance: approvedGuidanceRepository,
  rule: guidanceRuleRepository,
  guidance: guidanceEvaluationRepository,
  guidance_choice: guidanceChoiceRepository,
  seed_marker: seedMarkerRepository,
};
export type EntityKind = keyof typeof repositories;
export const repository = (db: DB, kind: string) => {
  if (!(kind in repositories)) throw new Error("Unknown domain entity");
  return repositories[kind as EntityKind](db);
};
