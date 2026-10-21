import { prisma, transaction } from "../config/database.js";
import { create } from "../repositories/domain.repository.js";
import { advisoryLock } from "../repositories/locks.repository.js";
import { seedIdentities } from "./seed-identities.js";
import { seedOperations } from "./seed-operations.js";
import { seedVersion } from "./seed-locations.js";
import { assertDemoSeedAllowed } from "./seed-safety.js";
export async function seed() {
  assertDemoSeedAllowed();
  await transaction(async (db) => {
    await advisoryLock(db, "aqours-demo-seed");
    const rows = await db.seedMarker.findMany({ select: { id: true } });
    if (rows.length) {
      console.log("Demo seed already applied; existing records preserved.");
      return;
    }
    if (await db.entity.count())
      throw new Error(
        "Seed requires an empty application database; no records were overwritten",
      );
    const identities = await seedIdentities(db);
    await seedOperations(db, identities);
    await create(db, "seed_marker", {
      fixture: seedVersion,
      appliedAt: new Date().toISOString(),
      demo: true,
    });
    console.log(
      "Fictional Aqours demo dataset created. See aqours-api/README.md for demo login identities.",
    );
  });
}
if (
  process.argv[1]?.endsWith("/seed.ts") ||
  process.argv[1]?.endsWith("/seed.js")
) {
  seed()
    .then(() => prisma.$disconnect())
    .catch(() => {
      console.error(
        "Demo seed failed. Verify SEED_DEMO=1, a nonproduction empty database, and applied migrations.",
      );
      process.exitCode = 1;
      void prisma.$disconnect();
    });
}
