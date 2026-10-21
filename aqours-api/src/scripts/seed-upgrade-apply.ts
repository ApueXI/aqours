import type { DB } from "../config/database.js";
import { create, event } from "../repositories/domain.repository.js";
import { fixtureId } from "./seed-legacy-locations.js";
import { seedVersion } from "./seed-locations.js";
import type {
  SeedLocationChange,
  SeedUpgradePlan,
} from "./seed-upgrade-plan.js";

async function changeLocation(db: DB, change: SeedLocationChange) {
  const where = { id: change.id };
  const data = { ...change.fields, version: { increment: 1 } };
  // Deliberately update only location fields and the optimistic version. Preserve
  // domain/stored/changed timestamps, statuses, references and all other values.
  switch (change.kind) {
    case "zone":
      return db.zone.update({ where, data });
    case "connection":
      return db.serviceConnection.update({ where, data });
    case "report":
      return db.report.update({ where, data });
    case "site":
      return db.pickupSite.update({ where, data });
    case "incident":
      return db.incident.update({ where, data });
  }
}

export async function applySeedLocationUpgrade(db: DB, plan: SeedUpgradePlan) {
  const actor = fixtureId(10);
  for (const change of plan.changes) {
    await changeLocation(db, change);
    await event(
      db,
      actor,
      change.id,
      "demo_location_upgraded",
      "Synthetic demonstration location corrected to Laguna PSGC fixtures.",
      undefined,
      undefined,
      true,
      { fixture: seedVersion, fields: Object.keys(change.fields) },
    );
  }
  await db.inspectionDetails.update({
    where: { requestId: plan.inspection.id },
    data: { siteAddress: plan.inspection.siteAddress },
  });
  await db.assistanceRequest.update({
    where: { id: plan.inspection.id },
    data: { version: { increment: 1 } },
  });
  await event(
    db,
    actor,
    plan.inspection.id,
    "demo_location_upgraded",
    "Synthetic inspection address corrected to the Laguna saved service address.",
    undefined,
    undefined,
    true,
    { fixture: seedVersion, fields: ["siteAddress"] },
  );
  for (const snapshot of plan.publications) {
    const previousPublishedAt = snapshot.publishedAt;
    const publishedAt = new Date(
      Math.max(Date.now(), Date.parse(previousPublishedAt) + 1),
    ).toISOString();
    const correction = await create(db, "incident_update", {
      ...snapshot,
      publishedAt,
    });
    await event(
      db,
      actor,
      snapshot.incidentId,
      "demo_location_upgraded",
      "Synthetic demonstration publication area corrected to Laguna; earlier publications remain in history.",
      undefined,
      undefined,
      false,
      { fixture: seedVersion, publicationId: correction.id },
    );
  }
  // This administrative fixture correction intentionally sends no notifications.
  // It appends immutable public snapshots/events without replaying status changes.
  await create(db, "seed_marker", {
    fixture: seedVersion,
    appliedAt: new Date().toISOString(),
    demo: true,
  });
}
