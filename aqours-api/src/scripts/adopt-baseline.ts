import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../config/database.js";

/** Verify the old migration ledger before signing the equivalent Prisma baseline. */
async function adopt() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const directory = path.resolve(import.meta.dirname, "../..");
  const rows = await prisma.$queryRaw<{ name: string; checksum: string }[]>`
    SELECT name,checksum FROM schema_migrations ORDER BY name`;
  const files = (await readdir(path.join(directory, "migrations")))
    .filter((name) => /^\d+_.*\.sql$/.test(name))
    .sort();
  if (rows.length !== files.length)
    throw new Error("Legacy migration inventory mismatch");
  for (const name of files) {
    const checksum = createHash("sha256")
      .update(await readFile(path.join(directory, "migrations", name)))
      .digest("hex");
    if (rows.find((row) => row.name === name)?.checksum !== checksum)
      throw new Error("Legacy migration checksum mismatch");
  }
  // Each legacy row must have a supported kind before this schema can be adopted.
  const unsupported = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT count(*) FROM records WHERE kind NOT IN
    ('supplier','user','zone','connection','report','message','attachment','incident',
     'incident_update','advisory','advisory_revision','assistance','site','pickup_session',
     'approved_guidance','rule','guidance','guidance_choice','seed_marker')`;
  if (Number(unsupported[0]?.count))
    throw new Error("Unsupported legacy record kind");
  const result = spawnSync(
    process.execPath,
    [
      "node_modules/prisma/build/index.js",
      "migrate",
      "resolve",
      "--applied",
      "0_legacy_baseline",
    ],
    {
      cwd: directory,
      stdio: "inherit",
      env: {
        ...process.env,
        XDG_CACHE_HOME: path.resolve(directory, "../.cache"),
        PRISMA_HIDE_UPDATE_MESSAGE: "1",
      },
    },
  );
  if (result.status !== 0) throw new Error("Baseline adoption failed");
}
adopt()
  .catch(() => {
    console.error(
      "Baseline adoption failed; verify the legacy ledger and database privately.",
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
