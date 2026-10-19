import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CommitUncertain,
  withTransaction,
  type DB,
} from "../src/config/database.js";
import { resolutionSummary } from "../src/services/analytics/metrics.service.js";
import { validateFilters } from "../src/middleware/endpoint.js";
import type { ActorRequest } from "../src/middleware/authentication.js";
import { reportSafe } from "../src/services/reports/report-context.service.js";
import { guidanceSafe } from "../src/services/presentation/projection.js";
test("prior substantive resolution remains sampled after reopening and reviewed duplicate closure", () => {
  const summary = resolutionSummary([
    {
      id: "prior",
      version: 5,
      submittedAt: "2026-10-18T00:00:00Z",
      firstResolvedAt: "2026-10-18T00:10:00Z",
      closureOutcome: "duplicate",
    },
    {
      id: "reviewed",
      version: 2,
      submittedAt: "2026-10-18T00:00:00Z",
      firstResolvedAt: null,
      closureOutcome: "invalid",
    },
    {
      id: "pending",
      version: 1,
      submittedAt: "2026-10-18T00:00:00Z",
      firstResolvedAt: null,
      closureOutcome: null,
    },
  ]);
  assert.deepEqual(summary, {
    meanSeconds: 600,
    sampleCount: 1,
    excludedCount: 1,
    pendingCount: 1,
  });
});
test("filter parsing rejects invalid enum values and malformed UUIDs across list and map reads", () => {
  for (const query of [
    { category: "unknown" },
    { status: "accepted" },
    { priority: "critical" },
    { ownerId: "someone" },
    { zoneId: "other" },
    { type: "delivery" },
  ]) {
    assert.throws(() =>
      validateFilters({
        path: "/api/v1/staff/reports",
        query,
      } as unknown as ActorRequest),
    );
  }
  assert.doesNotThrow(() =>
    validateFilters({
      path: "/api/v1/staff/assistance-requests",
      query: { status: "accepted", type: "callback" },
    } as unknown as ActorRequest),
  );
});
test("public projections suppress future internal fields, questionnaire evidence and first-work markers", () => {
  const doc = {
    id: "private",
    version: 2,
    privateNotes: "PRIVATE",
    evidence: { private: "hidden" },
    answers: { hazard: true },
    assertedIncidentId: "hidden",
  };
  assert.equal("privateNotes" in reportSafe(doc), false);
  assert.equal("assertedIncidentId" in reportSafe(doc), false);
  assert.equal("answers" in reportSafe(doc), false);
  assert.equal("evidence" in guidanceSafe(doc), false);
  assert.equal(reportSafe(doc).accuracy, null);
});
test("transaction outcomes distinguish known rollback from lost COMMIT acknowledgment", async () => {
  const db = {} as DB;
  const client = {
    $transaction: async (fn: (db: DB) => Promise<unknown>) => fn(db),
  };
  await assert.rejects(
    () =>
      withTransaction(client as never, async () => {
        throw new Error("Precommit failure");
      }),
    /Precommit failure/,
  );
  client.$transaction = async (fn) => {
    await fn(db);
    throw new Error("Acknowledgment lost");
  };
  await assert.rejects(
    () => withTransaction(client as never, async () => "committed"),
    CommitUncertain,
  );
  for (const code of ["P2034", "P2028"]) {
    client.$transaction = async (fn) => {
      await fn(db);
      throw Object.assign(new Error("Rolled back"), { code });
    };
    await assert.rejects(
      () => withTransaction(client as never, async () => "rolled back"),
      { code },
    );
  }
});
