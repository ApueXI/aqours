import type { DB } from "../config/database.js";
import type { Prisma } from "../generated/prisma/client.js";
import { makeRepository, type Delegate } from "./entity.repository.js";

export const guidanceEvaluationRepository = (db: DB) =>
  makeRepository(db, db.guidanceEvaluation as unknown as Delegate, {
    kind: "guidance",
    table: "guidance_evaluations",
    fields: {
      customerId: "u",
      reportId: "u",
      evaluatedAt: "t",
      ruleVersion: "i",
      current: "b",
      uncertainty: "j",
      questions: "j",
      cards: "j",
      alternatives: "j",
      sourceSignature: "s",
      evidence: "j",
      answers: "j",
    },
    junctions: [],
    include: {},
    owned: true,
  });

export type GuidanceEvaluationCreate =
  Prisma.GuidanceEvaluationUncheckedCreateInput;
