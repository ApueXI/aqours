import { prisma, transaction, type DB } from "../config/database.js";
import { all } from "../repositories/domain.repository.js";
import { advisoryLock } from "../repositories/locks.repository.js";
import { legacyVersion } from "./seed-legacy-locations.js";
import { seedVersion } from "./seed-locations.js";
import { assertDemoSeedAllowed } from "./seed-safety.js";
import { applySeedLocationUpgrade } from "./seed-upgrade-apply.js";
import {
  planSeedLocationUpgrade,
  SeedUpgradeConflict,
  type SeedUpgradeRows,
} from "./seed-upgrade-plan.js";

export async function upgradeLagunaFixtures(db: DB) {
  assertDemoSeedAllowed();
  await db.$executeRaw`SET LOCAL lock_timeout = '5s'`;
  await advisoryLock(db, "aqours-demo-seed");
  // Table locks block concurrent inserts/updates/deletes during preflight and
  // writing, including report candidates, publication ordering and junctions.
  // Lock acquisition failure aborts the transaction; the command is retryable.
  await db.$executeRaw`LOCK TABLE entities, suppliers, users, zones,
      service_connections, reports, incidents, incidents_zone_ids,
      incident_publications, incident_publications_zone_ids, pickup_sites,
      assistance_requests, inspection_details, pickup_sessions,
      pickup_sessions_zone_ids, seed_markers IN SHARE ROW EXCLUSIVE MODE`;
  const markers = await db.seedMarker.findMany();
  if (
    markers.some(
      (row) => !row.demo || ![legacyVersion, seedVersion].includes(row.fixture),
    ) ||
    markers.filter((row) => row.fixture === seedVersion).length > 1 ||
    markers.filter((row) => row.fixture === legacyVersion).length > 1
  )
    throw new SeedUpgradeConflict(
      "Demo upgrade requires a recognized, unambiguous demonstration seed marker; no changes committed.",
    );
  if (markers.some((row) => row.fixture === seedVersion))
    return { upgraded: false, fixture: seedVersion };
  if (markers.length !== 1 || markers[0]!.fixture !== legacyVersion)
    throw new SeedUpgradeConflict(
      "Demo upgrade requires the original aqours-demo-v1 marker; use normal seed for an empty database. No changes committed.",
    );
  const kinds = [
    "supplier",
    "user",
    "zone",
    "connection",
    "report",
    "site",
    "incident",
    "incident_update",
    "assistance",
    "pickup_session",
  ] as const;
  const rows = Object.fromEntries(
    await Promise.all(kinds.map(async (kind) => [kind, await all(db, kind)])),
  ) as unknown as SeedUpgradeRows;
  const plan = planSeedLocationUpgrade(rows);
  await applySeedLocationUpgrade(db, plan);
  return { upgraded: true, fixture: seedVersion };
}

export async function upgradeSeedLocations() {
  assertDemoSeedAllowed();
  return transaction(upgradeLagunaFixtures);
}
if (
  process.argv[1]?.endsWith("/seed-upgrade-laguna.ts") ||
  process.argv[1]?.endsWith("/seed-upgrade-laguna.js")
) {
  upgradeSeedLocations()
    .then((result) => {
      console.log(
        result.upgraded
          ? "Original demo locations upgraded to Laguna; history and unrelated records preserved."
          : "Laguna demo seed already present; existing records preserved.",
      );
    })
    .catch((error: unknown) => {
      console.error(
        error instanceof SeedUpgradeConflict
          ? error.message
          : "Demo location upgrade failed; no partial changes committed. Verify SEED_DEMO=1, nonproduction database, migrations and stopped writers, then retry. An uncertain commit is safe to retry using the version marker.",
      );
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
