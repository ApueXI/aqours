import { isDeepStrictEqual } from "node:util";
import type { Doc } from "../types/domain.js";
import {
  fixtureId,
  legacyConnection,
  legacyReport,
  legacySite,
  legacyZone,
  seedCategories,
} from "./seed-legacy-locations.js";
import {
  seedConnectionLocation,
  seedSiteLocation,
  seedZone,
} from "./seed-locations.js";

export class SeedUpgradeConflict extends Error {}
export interface SeedUpgradeRows {
  supplier: Doc[];
  user: Doc[];
  zone: Doc[];
  connection: Doc[];
  report: Doc[];
  site: Doc[];
  incident: Doc[];
  incident_update: Doc[];
  assistance: Doc[];
  pickup_session: Doc[];
}
export interface SeedLocationChange {
  kind: "zone" | "connection" | "report" | "site" | "incident";
  id: string;
  fields: Record<string, any>;
}
export interface SeedUpgradePlan {
  changes: SeedLocationChange[];
  inspection: { id: string; siteAddress: string };
  publications: Record<string, any>[];
}
function conflict(id: string, field: string): never {
  throw new SeedUpgradeConflict(
    `Demo upgrade conflict: ${id} (${field}). No changes committed; restore the original v1 fixture geography or use a separate freshly seeded database.`,
  );
}
function required(rows: Doc[], id: string) {
  const matches = rows.filter((row) => row.id === id);
  if (matches.length !== 1)
    conflict(id, "missing or ambiguous fixture identity");
  return matches[0]!;
}
function expect(row: Doc, fields: Record<string, any>) {
  for (const [key, value] of Object.entries(fields))
    if (!isDeepStrictEqual(row[key], value)) conflict(row.id, key);
}

/** Read-only planning: validate every original fixture before returning any writes. */
export function planSeedLocationUpgrade(
  rows: SeedUpgradeRows,
): SeedUpgradePlan {
  expect(required(rows.supplier, fixtureId(1)), {
    name: "Aqours Demonstration Water Cooperative",
    demo: true,
  });
  for (let n = 0; n < 14; n++) {
    const role = n === 0 ? "admin" : n === 1 ? "staff" : "customer";
    const email =
      n < 2
        ? `${role}@demo.aqours.test`
        : `customer${String(n - 1).padStart(2, "0")}@demo.aqours.test`;
    expect(required(rows.user, fixtureId(10 + n)), { email, role });
  }
  const changes: SeedLocationChange[] = [];
  for (let n = 0; n < 3; n++) {
    const id = fixtureId(100 + n);
    expect(required(rows.zone, id), { ...legacyZone(n), demo: true });
    changes.push({ kind: "zone", id, fields: seedZone(n) });
  }
  const reports: Doc[] = [];
  for (let n = 0; n < 12; n++) {
    const id = fixtureId(200 + n),
      expected = legacyReport(n);
    expect(required(rows.connection, id), legacyConnection(n));
    // Random report IDs are identified by the original owned connection AND
    // customer AND unique fixture description, then every location field checks.
    const candidates = rows.report.filter(
      (row) =>
        row.connectionId === id &&
        row.customerId === expected.customerId &&
        row.description === expected.description,
    );
    if (candidates.length !== 1)
      conflict(id, "missing or ambiguous original report");
    const report = candidates[0]!;
    expect(report, expected);
    reports.push(report);
    const fields = seedConnectionLocation(n);
    changes.push({ kind: "connection", id, fields });
    changes.push({ kind: "report", id: report.id, fields });
  }
  for (let n = 0; n < 2; n++) {
    const id = fixtureId(600 + n);
    expect(required(rows.site, id), legacySite(n));
    changes.push({ kind: "site", id, fields: seedSiteLocation(n) });
  }
  const publications: Record<string, any>[] = [];
  for (let n = 0; n < 4; n++) {
    const id = fixtureId(400 + n),
      zone = n % 3;
    const geography = {
      area: legacyZone(zone).name,
      zoneIds: [fixtureId(100 + zone)],
      geometry: null,
    };
    expect(required(rows.incident, id), {
      ...geography,
      category: seedCategories[n],
      demo: true,
    });
    const original = required(rows.incident_update, fixtureId(410 + n));
    expect(original, {
      ...geography,
      incidentId: id,
      category: seedCategories[n],
      demo: true,
    });
    const history = rows.incident_update
      .filter((row) => row.incidentId === id)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const latest = history[0]!;
    expect(latest, { ...geography, category: seedCategories[n], demo: true });
    if (history[1]?.publishedAt === latest.publishedAt)
      conflict(id, "ambiguous latest publication timestamp");
    changes.push({
      kind: "incident",
      id,
      fields: { area: seedZone(zone).name },
    });
    const { id: _id, version: _version, ...snapshot } = latest;
    publications.push({ ...snapshot, area: seedZone(zone).name });
  }
  for (let n = 0; n < 3; n++)
    expect(required(rows.pickup_session, fixtureId(700 + n)), {
      siteId: fixtureId(600 + (n % 2)),
      zoneIds: [fixtureId(100), fixtureId(101), fixtureId(102)],
      demo: true,
    });
  for (const [n, index] of [0, 1, 2, 3, 11].entries()) {
    const request = required(rows.assistance, fixtureId(800 + n));
    expect(request, {
      customerId: fixtureId(12 + index),
      reportId: reports[index]!.id,
      reference: `DEMO-HELP-${n + 1}`,
      type: [
        "water_support",
        "water_support",
        "callback",
        "inspection",
        "water_support",
      ][n],
    });
    if (n === 3 && request.details.siteAddress !== legacyConnection(3).address)
      conflict(request.id, "inspection siteAddress");
  }
  return {
    changes,
    publications,
    inspection: {
      id: fixtureId(803),
      siteAddress: seedConnectionLocation(3).address,
    },
  };
}
