import assert from "node:assert/strict";
import { test } from "node:test";
import type { DB } from "../src/config/database.js";
import type { MonitoringEvidence } from "@aqours/contracts";
import {
  transitionWarning,
  notifyTransitions,
  type WarningTransition,
} from "../src/services/monitoring/warnings.js";

function fixture() {
  const warnings: any[] = [],
    history: any[] = [],
    notifications: any[] = [];
  const db = {
    monitoringWarning: {
      findFirst: async ({ where }: any) =>
        warnings.find((w) =>
          Object.entries(where).every(([key, value]) => w[key] === value),
        ) ?? null,
      create: async ({ data }: any) => {
        warnings.push(data);
        return data;
      },
      update: async ({ where, data }: any) => {
        const row = warnings.find((w) => w.id === where.id);
        Object.assign(row, data);
        return row;
      },
    },
    monitoringHistory: {
      create: async ({ data }: any) => {
        history.push(data);
        return data;
      },
    },
    user: { findMany: async () => [{ id: "admin" }, { id: "staff" }] },
    notification: {
      createMany: async ({ data }: any) => {
        notifications.push(...data);
        return { count: data.length };
      },
    },
  } as unknown as DB;
  return { db, warnings, history, notifications };
}
const evidence: MonitoringEvidence = {
  temperature: 35,
  availableLiters: "100.00",
  warningTemperature: 35,
  criticalTemperature: 38,
  lowSupplyLiters: "100.00",
  criticalSupplyLiters: "0.00",
  configVersion: 1,
  forecastUpdatedAt: "2026-10-22T00:00:00Z",
  supplyObservedAt: "2026-10-22T00:00:00Z",
};
const input: WarningTransition = {
  supplierId: "p",
  siteId: "s",
  siteName: "Site",
  family: "temperature",
  forecastDate: "2026-10-22",
  severity: "warning",
  state: "active",
  evidence,
  reason: null,
  now: new Date("2026-10-22T00:00:00Z"),
};

test("warning evidence deduplicates JSONB key order and observation timestamps", async () => {
  const f = fixture();
  const first = await transitionWarning(f.db, input);
  assert.equal(first?.action, "triggered");
  const reordered = Object.fromEntries(
    Object.entries(evidence).reverse(),
  ) as unknown as MonitoringEvidence;
  assert.equal(
    await transitionWarning(f.db, {
      ...input,
      evidence: { ...reordered, supplyObservedAt: "later" },
    }),
    null,
  );
  assert.equal(f.warnings.length, 1);
  assert.equal(f.history.length, 1);
  const updated = await transitionWarning(f.db, {
    ...input,
    evidence: { ...evidence, temperature: 36, configVersion: 2 },
  });
  assert.equal(updated?.action, "updated");
  assert.equal(f.warnings[0].evidence.temperature, 36);
  assert.equal(f.history.length, 2);
  await notifyTransitions(f.db, "p", "s", "Site", [updated!], input.now);
  assert.equal(f.notifications.length, 0);
});

test("warning transitions escalate, close once, retain history and reopen with new identity", async () => {
  const f = fixture();
  const initial = await transitionWarning(f.db, input);
  const firstId = initial!.row.id;
  const escalated = await transitionWarning(f.db, {
    ...input,
    severity: "critical",
    evidence: { ...evidence, temperature: 38 },
  });
  assert.equal(escalated?.action, "escalated");
  assert.equal(escalated?.row.type, "critical_temperature");
  assert.equal(escalated?.row.id, firstId);
  const resolved = await transitionWarning(f.db, {
    ...input,
    severity: null,
    state: "resolved",
    reason: "Fresh normal",
    evidence: { ...evidence, temperature: 30 },
  });
  assert.equal(resolved?.action, "resolved");
  assert.equal(
    await transitionWarning(f.db, {
      ...input,
      severity: null,
      state: "resolved",
    }),
    null,
  );
  assert.equal(f.history.length, 3);
  assert.deepEqual(
    f.history.map((h) => h.action),
    ["triggered", "escalated", "resolved"],
  );
  const reopened = await transitionWarning(f.db, input);
  assert.notEqual(reopened?.row.id, firstId);
  assert.equal(f.warnings.length, 2);
  assert.equal(f.warnings[0].state, "resolved");
  const suspended = await transitionWarning(f.db, {
    ...input,
    severity: null,
    state: "suspended",
    reason: "Evidence unavailable",
  });
  assert.equal(suspended?.action, "suspended");
  assert.equal(suspended?.row.state, "suspended");
});

test("one consolidated site notification contains all transitions for each active operator", async () => {
  const f = fixture();
  const a = await transitionWarning(f.db, input);
  const b = await transitionWarning(f.db, { ...input, family: "supply" });
  await notifyTransitions(f.db, "p", "s", "Site", [a!, b!], input.now);
  assert.equal(f.notifications.length, 2);
  assert.deepEqual(
    f.notifications.map((n) => n.userId),
    ["admin", "staff"],
  );
  assert.equal(
    f.notifications[0].sourceEventKey,
    f.notifications[1].sourceEventKey,
  );
  assert.match(f.notifications[0].data.text, /temperature.*supply/);
  assert.equal(f.notifications[0].data.targetType, "monitoring");
});
