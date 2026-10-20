import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const reportRepository = (db: DB) =>
  makeRepository(db, db.report as unknown as Delegate, {
    kind: "report",
    table: "reports",
    fields: {
      customerId: "u",
      connectionId: "u",
      reference: "s",
      category: "s",
      description: "s",
      noticedAt: "t",
      submittedAt: "t",
      status: "s",
      address: "s",
      structuredAddress: "j?",
      locationSource: "s",
      latitude: "f?",
      longitude: "f?",
      accuracy: "f?",
      locationConfirmed: "b",
      zoneId: "u?",
      zoneConfirmed: "b",
      locationReview: "b",
      priority: "s",
      priorityReason: "s?",
      ownerId: "u?",
      incidentId: "u?",
      assertedIncidentId: "u?",
      closureOutcome: "s?",
      closureReason: "s?",
      firstRespondedAt: "t?",
      firstResolvedAt: "t?",
      answers: "j",
    },
    junctions: [],
    include: {},
    owned: true,
  });

export type ReportCreate = Prisma.ReportUncheckedCreateInput;
