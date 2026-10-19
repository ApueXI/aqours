import type { DB } from "../../config/database.js";
import {
  all,
  create,
  get,
  now,
  own,
  reference,
  timeline,
  type Doc,
} from "../../repositories/domain.repository.js";
import { fail } from "../../utils/errors.js";
import { coordinates } from "../../validators/common.js";
import { verifyCandidate } from "../location/geocode.service.js";
import {
  attachmentSafe,
  messageSafe,
  project,
  reportFields,
} from "../presentation/projection.js";
export async function reportCreate(
  db: DB,
  actor: Doc,
  input: Record<string, any>,
  assertedIncidentId?: string,
) {
  const connection = await get(db, "connection", input.connectionId);
  own(connection, actor);
  const location = input.location;
  if (location) {
    coordinates(location);
    if (location.source === "saved_address")
      fail(400, "Omit alternate location to use saved address");
    if (
      location.confirmed &&
      location.source === "geocoded_address" &&
      location.latitude != null
    )
      verifyCandidate(location);
    if (location.confirmed && location.latitude == null)
      fail(400, "Confirmed location requires coordinates");
  }
  const data = {
    customerId: actor.id,
    connectionId: connection.id,
    reference: reference("AQ"),
    category: input.category,
    description: input.description,
    noticedAt: input.noticedAt,
    submittedAt: now(),
    status: "received",
    address: location?.address ?? connection.address,
    locationSource: location?.source ?? "saved_address",
    latitude: location ? (location.latitude ?? null) : connection.latitude,
    longitude: location ? (location.longitude ?? null) : connection.longitude,
    accuracy: location?.source === "gps" ? (location.accuracy ?? null) : null,
    locationConfirmed: location
      ? location.confirmed
      : connection.latitude != null,
    zoneId: location ? null : connection.zoneId,
    zoneConfirmed: location ? false : connection.zoneConfirmed,
    locationReview: location
      ? true
      : !connection.zoneConfirmed || connection.latitude == null,
    priority: "normal",
    priorityReason: null,
    ownerId: null,
    incidentId: assertedIncidentId ?? null,
    closureOutcome: null,
    closureReason: null,
    firstRespondedAt: null,
    firstResolvedAt: null,
    answers: input.answers ?? {},
    ...(assertedIncidentId ? { assertedIncidentId } : {}),
  };
  return create(db, "report", data, actor.id, connection.id);
}
export function reportSafe(doc: Doc) {
  return {
    ...project(doc, reportFields),
    accuracy: typeof doc.accuracy === "number" ? doc.accuracy : null,
    locationReview:
      !!doc.locationReview || !doc.zoneConfirmed || doc.latitude == null,
    guidedDetails:
      typeof doc.answers?.details === "string" ? doc.answers.details : null,
  };
}
export async function published(db: DB, incident: Doc) {
  const updates = (await all(db, "incident_update"))
    .filter((v) => v.incidentId === incident.id)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  if (!updates.length) return null;
  const latest = updates[0]!;
  return {
    id: incident.id,
    category: latest.category,
    summary: latest.summary,
    status: latest.status,
    zoneIds: latest.zoneIds,
    demo: latest.demo,
    latestUpdate: updateSafe(latest),
    updates: updates.map(updateSafe),
  };
}
export function updateSafe(doc: Doc) {
  return {
    id: doc.id,
    incidentId: doc.incidentId,
    status: doc.status,
    progress: doc.progress,
    area: doc.area,
    restorationAt: doc.restorationAt,
    publishedAt: doc.publishedAt,
    demo: doc.demo,
    geometry: doc.geometry,
  };
}
export async function reportDetail(db: DB, report: Doc, staff: boolean) {
  const children = await all(db, "message");
  const attachments = (await all(db, "attachment"))
    .filter((v) => v.reportId === report.id)
    .map(attachmentSafe);
  const incident = report.incidentId
    ? await published(db, await get(db, "incident", report.incidentId))
    : null;
  const result: Record<string, any> = {
    ...reportSafe(report),
    messages: children.filter((v) => v.reportId === report.id).map(messageSafe),
    attachments,
    timeline: await timeline(db, report.id),
    incident,
  };
  if (staff) {
    const customer = await get(db, "user", report.customerId),
      connection = await get(db, "connection", report.connectionId);
    result.customer = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      connectionReference: connection.reference,
      savedAddress: connection.address,
    };
    result.notes = (await timeline(db, report.id, true)).map((v) => ({
      ...v,
      authorId: v.actorId,
    }));
    result.suggestions = (await all(db, "incident"))
      .filter(
        (v) =>
          v.status !== "resolved" &&
          v.category === report.category &&
          report.zoneConfirmed &&
          v.zoneIds.includes(report.zoneId) &&
          Math.abs(
            new Date(v.createdAt).getTime() -
              new Date(report.noticedAt).getTime(),
          ) <=
            7 * 86400000,
      )
      .map((v) => ({
        id: v.id,
        summary: v.summary,
        reason:
          "Matching category, confirmed service zone and incident creation within seven days of the noticed time; staff review required",
      }));
  }
  return result;
}
