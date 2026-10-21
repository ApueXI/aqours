import assert from "node:assert/strict";
import { test } from "node:test";
import { originalSeedRows } from "./seed-upgrade-fixture.js";
import {
  planSeedLocationUpgrade,
  SeedUpgradeConflict,
} from "../src/scripts/seed-upgrade-plan.js";
import { seedConnectionLocation } from "../src/scripts/seed-locations.js";

test("v1 plans targeted locations without mutating status, history or unrelated rows", () => {
  const rows = originalSeedRows();
  rows.report.push({
    ...rows.report[0]!,
    id: "unrelated",
    connectionId: "other-connection",
  });
  rows.report[3]!.status = "resolved";
  const before = structuredClone(rows),
    plan = planSeedLocationUpgrade(rows);
  assert.deepEqual(rows, before);
  assert.equal(plan.changes.length, 33);
  assert.equal(plan.publications.length, 4);
  assert.equal(plan.inspection.siteAddress, seedConnectionLocation(3).address);
  assert.ok(plan.changes.every((change) => change.id !== "unrelated"));
  for (const change of plan.changes)
    for (const field of [
      "status",
      "reference",
      "firstResolvedAt",
      "updatedAt",
      "changedAt",
    ])
      assert.ok(!(field in change.fields));
  const missing = plan.changes.find((change) => change.id === "report-11")!;
  assert.equal(missing.fields.latitude, null);
  assert.equal(missing.fields.longitude, null);
});
test("v1 refuses missing, ambiguous, owned-elsewhere or geographically edited reports", () => {
  const mutations = [
    (r: ReturnType<typeof originalSeedRows>) => {
      r.report.shift();
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.report.push({ ...r.report[0]!, id: "duplicate" });
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.report[0]!.customerId = "other-owner";
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.report[0]!.locationSource = "gps";
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.report[0]!.address += " edited";
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.report[0]!.latitude += 0.001;
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.report[0]!.zoneConfirmed = false;
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.report[0]!.structuredAddress = {};
    },
  ];
  for (const mutate of mutations) {
    const rows = originalSeedRows();
    mutate(rows);
    const before = structuredClone(rows);
    assert.throws(() => planSeedLocationUpgrade(rows), SeedUpgradeConflict);
    assert.deepEqual(rows, before);
  }
});
test("v1 validates fixed identities, geography and inspection relationship", () => {
  const mutations = [
    (r: ReturnType<typeof originalSeedRows>) => {
      r.user[0]!.email = "other@example.test";
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.zone[0]!.boundary = null;
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.connection[1]!.reference = "custom";
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.site[0]!.longitude = 121.3;
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.incident[0]!.area = "Edited area";
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.incident_update[0]!.zoneIds = [];
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.pickup_session[0]!.siteId = "other-site";
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.assistance[3]!.reportId = r.report[2]!.id;
    },
    (r: ReturnType<typeof originalSeedRows>) => {
      r.assistance[3]!.details.siteAddress = "custom";
    },
  ];
  for (const mutate of mutations) {
    const rows = originalSeedRows();
    mutate(rows);
    assert.throws(() => planSeedLocationUpgrade(rows), /No changes committed/);
  }
});
test("correction retains latest public state and refuses ambiguous/customized publication geography", () => {
  const rows = originalSeedRows();
  rows.incident_update.push({
    ...rows.incident_update[0]!,
    id: "later",
    publishedAt: "2026-10-21T00:00:00.000Z",
    status: "resolved",
    progress: "Later progress",
  });
  const plan = planSeedLocationUpgrade(rows);
  assert.equal(plan.publications[0]!.status, "resolved");
  assert.equal(plan.publications[0]!.progress, "Later progress");
  assert.equal(plan.publications[0]!.area, "Demo Calamba");
  assert.equal(rows.incident_update[0]!.area, "Demo Riverside");
  rows.incident_update.push({
    ...rows.incident_update.at(-1)!,
    id: "same-time",
  });
  assert.throws(
    () => planSeedLocationUpgrade(rows),
    /ambiguous latest publication/,
  );
  rows.incident_update.pop();
  rows.incident_update.at(-1)!.area = "Custom public area";
  assert.throws(() => planSeedLocationUpgrade(rows), /\(area\)/);
});
