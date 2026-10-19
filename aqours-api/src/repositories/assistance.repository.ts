import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const assistanceRequestRepository = (db: DB) =>
  makeRepository(db, db.assistanceRequest as unknown as Delegate, {
    kind: "assistance",
    table: "assistance_requests",
    fields: {
      customerId: "u",
      reportId: "u",
      incidentId: "u?",
      reference: "s",
      type: "s",
      status: "s",
      ownerId: "u?",
      appointmentAt: "t?",
      outcome: "s?",
      nextSteps: "s?",
      reason: "s?",
      startedAt: "t?",
      createdAt: "t",
      updatedAt: "t",
    },
    junctions: [],
    include: {
      callback: true,
      inspection: true,
      waterSupport: true,
    },
    owned: true,
  });

export type AssistanceRequestCreate =
  Prisma.AssistanceRequestUncheckedCreateInput;
