import type { Doc } from "../src/types/domain.js";
import type { SeedUpgradeRows } from "../src/scripts/seed-upgrade-plan.js";
import {
  fixtureId,
  legacyConnection,
  legacyReport,
  legacySite,
  legacyZone,
  seedCategories,
} from "../src/scripts/seed-legacy-locations.js";
export function originalSeedRows(): SeedUpgradeRows {
  const doc = (id: string, fields: Record<string, any>): Doc => ({
    id,
    version: 1,
    ...fields,
  });
  const report = Array.from({ length: 12 }, (_, n) =>
    doc(`report-${n}`, {
      ...legacyReport(n),
      status: n === 3 ? "under_review" : "received",
      firstResolvedAt: n === 3 ? "2026-10-20T01:00:00.000Z" : null,
    }),
  );
  return {
    supplier: [
      doc(fixtureId(1), {
        name: "Aqours Demonstration Water Cooperative",
        demo: true,
      }),
    ],
    user: Array.from({ length: 14 }, (_, n) => {
      const role = n === 0 ? "admin" : n === 1 ? "staff" : "customer";
      return doc(fixtureId(10 + n), {
        role,
        email:
          n < 2
            ? `${role}@demo.aqours.test`
            : `customer${String(n - 1).padStart(2, "0")}@demo.aqours.test`,
      });
    }),
    zone: Array.from({ length: 3 }, (_, n) =>
      doc(fixtureId(100 + n), { ...legacyZone(n), demo: true }),
    ),
    connection: Array.from({ length: 12 }, (_, n) =>
      doc(fixtureId(200 + n), legacyConnection(n)),
    ),
    report,
    site: Array.from({ length: 2 }, (_, n) =>
      doc(fixtureId(600 + n), legacySite(n)),
    ),
    incident: Array.from({ length: 4 }, (_, n) =>
      doc(fixtureId(400 + n), {
        area: legacyZone(n % 3).name,
        zoneIds: [fixtureId(100 + (n % 3))],
        geometry: null,
        category: seedCategories[n],
        demo: true,
        status: "investigating",
      }),
    ),
    incident_update: Array.from({ length: 4 }, (_, n) =>
      doc(fixtureId(410 + n), {
        incidentId: fixtureId(400 + n),
        area: legacyZone(n % 3).name,
        zoneIds: [fixtureId(100 + (n % 3))],
        geometry: null,
        category: seedCategories[n],
        demo: true,
        status: "investigating",
        progress: "Original public progress",
        publishedAt: "2026-10-20T00:00:00.000Z",
      }),
    ),
    pickup_session: Array.from({ length: 3 }, (_, n) =>
      doc(fixtureId(700 + n), {
        siteId: fixtureId(600 + (n % 2)),
        zoneIds: [fixtureId(100), fixtureId(101), fixtureId(102)],
        demo: true,
      }),
    ),
    assistance: [0, 1, 2, 3, 11].map((index, n) =>
      doc(fixtureId(800 + n), {
        customerId: fixtureId(12 + index),
        reportId: report[index]!.id,
        reference: `DEMO-HELP-${n + 1}`,
        type: [
          "water_support",
          "water_support",
          "callback",
          "inspection",
          "water_support",
        ][n],
        details: n === 3 ? { siteAddress: legacyConnection(3).address } : {},
      }),
    ),
  };
}
