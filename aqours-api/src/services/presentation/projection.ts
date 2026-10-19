import type { Doc } from "../../repositories/domain.repository.js";
import { generatedTimeText } from "./time.js";
export function project(doc: Record<string, any>, fields: readonly string[]) {
  return Object.fromEntries(fields.map((field) => [field, doc[field]]));
}
export const reportFields = [
  "id",
  "reference",
  "customerId",
  "connectionId",
  "category",
  "description",
  "noticedAt",
  "submittedAt",
  "status",
  "address",
  "locationSource",
  "latitude",
  "longitude",
  "accuracy",
  "locationConfirmed",
  "zoneId",
  "zoneConfirmed",
  "locationReview",
  "priority",
  "priorityReason",
  "ownerId",
  "incidentId",
  "closureOutcome",
  "closureReason",
  "version",
  "firstRespondedAt",
  "firstResolvedAt",
];
export const assistanceFields = [
  "id",
  "reference",
  "customerId",
  "reportId",
  "incidentId",
  "type",
  "status",
  "ownerId",
  "details",
  "appointmentAt",
  "outcome",
  "nextSteps",
  "reason",
  "createdAt",
  "updatedAt",
  "version",
];
export const advisoryFields = [
  "id",
  "kind",
  "title",
  "text",
  "source",
  "zoneIds",
  "geometry",
  "startsAt",
  "endsAt",
  "state",
  "publishedAt",
  "liftedAt",
  "liftReason",
  "version",
  "demo",
  "updatedAt",
];
export const messageSafe = (doc: Doc) =>
  project(doc, ["id", "text", "authorId", "authorRole", "createdAt"]);
export const attachmentSafe = (doc: Doc) =>
  project(doc, ["id", "filename", "mediaType", "byteSize", "createdAt"]);
export const siteSafe = (doc: Doc) =>
  project(doc, [
    "id",
    "name",
    "address",
    "instructions",
    "active",
    "demo",
    "latitude",
    "longitude",
    "version",
  ]);
export const sessionSafe = (doc: Doc) =>
  project(doc, [
    "id",
    "siteId",
    "zoneIds",
    "startsAt",
    "endsAt",
    "status",
    "instructions",
    "version",
    "demo",
    "updatedAt",
  ]);
export const zoneSafe = (doc: Doc) =>
  project(doc, ["id", "code", "name", "boundary", "active", "version", "demo"]);
export const connectionSafe = (doc: Doc) =>
  project(doc, [
    "id",
    "customerId",
    "reference",
    "address",
    "zoneId",
    "latitude",
    "longitude",
    "zoneConfirmed",
    "version",
  ]);
export const guidanceSafe = (doc: Doc) => {
  const result = project(doc, [
    "id",
    "reportId",
    "evaluatedAt",
    "ruleVersion",
    "current",
    "uncertainty",
    "questions",
    "cards",
    "alternatives",
    "sourceSignature",
  ]);
  if (Array.isArray(result.cards))
    result.cards = result.cards.map((card) =>
      card.action === "incident"
        ? { ...card, reason: generatedTimeText(card.reason, "Restoration") }
        : card,
    );
  return result;
};
