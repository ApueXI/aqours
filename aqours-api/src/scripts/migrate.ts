import { spawnSync } from "node:child_process";
import path from "node:path";

/** Deploy checked-in migrations. Existing legacy databases must first run adopt-baseline. */
export async function migrate() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const directory = path.resolve(import.meta.dirname, "../..");
  const result = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
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
  if (result.status !== 0)
    throw new Error(
      "Migration failed; inspect migration consistency privately",
    );
}
if (
  process.argv[1]?.endsWith("/migrate.ts") ||
  process.argv[1]?.endsWith("/migrate.js")
)
  migrate().catch(() => {
    process.exitCode = 1;
  });
