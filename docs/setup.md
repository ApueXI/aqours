# Setup and operations

Run commands from the repository root unless a working directory is shown. Source and package lockfiles are committed separately for the API, supplier app, customer app and public contracts. There is no global package installation, workspace migration, paid service, deployment or app-store publication step.

## Install and configure

Use Node.js 22.13 or newer; integrated checks were run with Node 26. Native Android additionally needs the JDK/toolchains described in the mobile README and verification report. Install the existing locked dependencies and build public DTOs first:

```sh
./scripts/install.sh
```

That script sets project-local npm/XDG caches and disables Expo telemetry and implicit dotenv reading while installing. Public contracts must be built before each dependent project can resolve their `file:../aqours-contracts` dependency. Later contract changes require `npm --prefix aqours-contracts run build` before client/API checks. A clean checkout should use the lockfiles through `npm ci`, rather than selecting new dependency versions.

Copy examples yourself; do not commit the resulting local files:

```sh
cp .env.example .env
cp aqours-api/.env.example aqours-api/.env
cp aqours-web/.env.example aqours-web/.env.local
cp aqours-app/.env.example aqours-app/.env.local
```

All `.env` and `.env.*` files except `.env.example` are ignored. Fill each placeholder privately in an editor. Generate separate random application/database secrets locally, for example with `openssl rand -hex 32`; do not paste them into chat, logs or `.loop`. The root Compose password and the password component of API `DATABASE_URL` must agree. Hex passwords avoid URL-escaping mistakes. Existing database credentials do not change merely because the environment file changes.

| Example | Consumers and visibility |
| --- | --- |
| Root `.env.example` | Compose database user/password/name/host port and absolute project-local data path; optional private backup/restore/test tooling configuration. Server/operator only. |
| `aqours-api/.env.example` | PostgreSQL URL, server port, exact browser origin, environment, session duration, private Geoapify key/candidate-signing secret, geographical bias/filter, upstream timeout, controlled attachment directory, deliberate demo seed opt-in. Server only. |
| `aqours-web/.env.example` | `VITE_API_URL`, public `VITE_GEOAPIFY_MAPS_API_KEY`, optional raster `VITE_MAP_TILE_URL` and `VITE_MAP_ATTRIBUTION`. All are public browser bundle configuration. |
| `aqours-app/.env.example` | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_MAP_STYLE_URL`. Both are public Android bundle configuration, including the native HTTP-development setting. |

The API's `dev`, `start`, `migrate`, `migrate:adopt`, `seed`, and `seed:upgrade-laguna` npm scripts automatically load optional `aqours-api/.env` using Node's built-in `--env-file-if-exists=.env`. Existing process environment variables override file values; a missing file is allowed when configuration is supplied externally. Run scripts inside `aqours-api/` or use `npm --prefix aqours-api run <script>` from the repository root. The root Compose `.env` is separate. Tests, builds, typecheck, Prisma generation and validation do not automatically load the API file; direct `node` invocations still need explicit configuration.

Photo processing uses Jimp 1.6 (JavaScript) so API startup does not load Sharp's CPU-specific native binaries or SIMD-dependent WebAssembly. Install normally with the documented API `npm ci`; no special architecture flags, global image tools or extra runtime flags are needed. New uploads accept still JPEG/PNG only; WebP is rejected with a format message. Existing stored WebP downloads remain supported. Header checks enforce the 25-million-pixel bound before decoding; input and reencoded output remain limited to 5 MiB. JPEG decoding also has a 256 MiB allocation budget. Jimp can take longer for large photos on older machines.

For everyday development, start the API, supplier web server, and Expo Metro together from the repository root:

```sh
npm run dev
```

This uses the root `concurrently` dependency and stops all three processes when one exits or you press Ctrl-C. It does not start PostgreSQL, apply migrations, seed data, or launch an Android emulator. Start the database and complete required migration/seed setup first. To build/install and launch Android separately, run `npm --prefix aqours-app run android` with the required native toolchain and an emulator/device available. The individual API/web/Expo scripts remain available when developing one project at a time. Restart the affected command after changing environment files. For future deployment, build with `npm run build`, supply secrets through the hosting environment, omit the local file, then use `npm start`. Set `NODE_ENV=production`, use an HTTPS `WEB_ORIGIN`, and keep demo seeding disabled.

Vite/Expo load their normal public environment files during development; `EXPO_NO_DOTENV=1` disables Expo dotenv when explicit shell/build variables are preferred. Never put database passwords, the Geoapify geocoding key or candidate-signing secrets in a `VITE_*`, `EXPO_PUBLIC_*`, Expo `extra`, style URL or client source field.

## PostgreSQL and attachments

Set `AQOURS_PGDATA_PATH` to the absolute path of this checkout's `.local/container-postgres`. Create it before Compose starts. The named `database` volume uses a local bind driver to keep PostgreSQL files there; Docker still maintains its ordinary image/container/network/volume metadata. The project owner explicitly approved Docker verification; normal setup also requires your Docker permissions.

```sh
mkdir -p .local/container-postgres
docker compose up -d db
docker compose ps
```

Compose pins standard `postgres:18.6-alpine3.23`, publishes the configured port on `127.0.0.1`, checks readiness, and uses a private Compose network. PostgreSQL 18 stores data below the mounted `/var/lib/postgresql`; no PostGIS extension is used. A host API URL uses `127.0.0.1:<POSTGRES_PORT>`; if you separately containerize the API, its private database hostname is `db` and port is `5432`. Database configuration never belongs in either client.

```sh
(cd aqours-api && npm run migrate)
(cd aqours-api && SEED_DEMO=1 npm run seed)
(cd aqours-api && npm run dev)
```

Prisma migrations are versioned and transactional; repeated migration/seed commands preserve existing records. Existing databases must follow the adoption steps below before their first Prisma migration. The seed refuses production and nonempty unseeded databases. Reset requires deliberately creating a separate empty development database or explicitly removing your own demo database; there is no reset endpoint, startup reset, or automated destructive command. Keep original migration files unchanged after they are applied.

The private attachment directory defaults to `aqours-api/storage/attachments` and must remain inside this repository. Images are decoded/re-encoded and accessed through the authenticated API; the directory has no public static route. Restore its bytes together with database metadata. A crash between file rename and transaction commit may leave an unreferenced UUID file; reconcile against attachment metadata while writes are paused. Never delete referenced files simply because a client timed out.

Container replacement with the same volume preserves data:

```sh
docker compose up -d --force-recreate db
```

Do not use `down -v` as a routine restart. A persistent volume is separate from a backup.

## Upgrading original demo locations to Laguna

Fresh seeding writes `aqours-demo-laguna-v2` with canonical Laguna PSGC addresses. Existing `aqours-demo-v1` databases are preserved by ordinary seed repeats. To deliberately move their original mutable demo fixtures, stop API writers and back up the database first, then run:

```sh
(cd aqours-api && SEED_DEMO=1 npm run seed:upgrade-laguna)
```

From the repository root, `SEED_DEMO=1 npm --prefix aqours-api run seed:upgrade-laguna` is equivalent and loads the same optional API `.env`. Production and missing opt-in are refused. The command takes the seed advisory lock and bounded table locks, checks every original fixture identity/geographic signature, and writes in one transaction. Missing/ambiguous/edited fixture locations abort before changes with a record/field conflict. Do not overwrite reviewed locations to force an upgrade; use a separate fresh demo database if those fixtures have been maintained.

The upgrade changes original connections, reports, zones, pickup sites, inspection addresses and incident area labels. Existing operational states, timestamps, credentials, stock and unrelated records remain intact. Original report locations change only through this explicit fixture correction; ordinary connection edits still preserve report snapshots. Published history is immutable: four corrected incident publications are appended, with audit events and no notification replay. Earlier publications retain their old labels. The v1 marker remains and v2 is recorded atomically; repeated upgrades and upgrades against fresh v2 seeds are no-ops. No schema migration or new dependency is needed.

## Provider setup without blocking reporting

Create a Geoapify project/key manually through the [Geoapify dashboard](https://myprojects.geoapify.com/) when you want live typed-address lookup. Review its quotas/terms and restrict the server key appropriately to the server environment. Put it only in API `GEOAPIFY_API_KEY`; generate a separate random `GEOCODE_SIGNING_SECRET` yourself. `GEOAPIFY_BIAS`/`GEOAPIFY_FILTER` select a configurable service region; the fictional demonstration uses Philippine country bias/filter. Upstream requests time out and return real candidates with confidence and signed 15-minute confirmation tokens. A candidate is an address suggestion, not a reviewed water-supply zone.

Until credentials exist, leave provider key/signing secret unset or empty. Missing configuration, invalid credentials, quota failures or timeouts return an honest `503`; the app retains typed address entry and can submit an unlocated report for review. Saved-address reporting, optional GPS, list views, incidents, notices and assistance do not require Geoapify. Adapter unit tests use explicit test mocks; those tests do not establish live provider success. See [Geoapify forward geocoding](https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/) for documented parameters.

Web uses direct Leaflet 1.9.4/markercluster with Geoapify OSM Bright raster tiles. Supply a separate intentionally public, tile-only `VITE_GEOAPIFY_MAPS_API_KEY` restricted to browser origins and quotas; it must never be the private server geocoding key. Required Geoapify/OpenStreetMap/OpenMapTiles attribution stays visible. A custom raster template uses `VITE_MAP_TILE_URL` with provider credit through `VITE_MAP_ATTRIBUTION`. Web `VITE_MAP_STYLE_URL` is retired; migrate JSON styles to raster configuration. Missing key/template or failed tiles leaves report/list access available with an explicit notice. Native MapLibre remains on its existing style/tile configuration. See [locations and maps](location-and-maps.md) for migration and attribution. No provider account or key is provisioned automatically.

No external account, paid resource, provider key or production notice was provisioned during implementation. The academic acceptance of rules/questionnaire/action cards remains a separate manual confirmation; no AI was added.

## Supplier and Android applications

Weather uses the public Open-Meteo forecast and city-search endpoints for the noncommercial demonstration, without new environment variables or dependencies. Permit outbound HTTPS to `api.open-meteo.com` and `geocoding-api.open-meteo.com`; Geoapify configuration is independent. See [weather setup, limits, attribution and check commands](weather.md).

```sh
npm --prefix aqours-web run dev
```

Use `http://localhost:5173`, matching API `WEB_ORIGIN` exactly. Supplier sessions use HttpOnly cookies and a CSRF token in memory; credentials are not saved in browser storage. API production mode requires an HTTPS origin and secure cookies. Configure HTTPS and a trusted reverse proxy separately for any later deployment; no deployment has been performed.

For Android set `EXPO_PUBLIC_API_URL` to `http://10.0.2.2:4000/api/v1` for the standard emulator, or a reachable LAN host for a physical phone. Set the public style URL, rebuild native configuration when changing cleartext policy, and follow [the Android guide](../aqours-app/README.md). SDK-compatible Expo Go can open report screens with a coordinates-only preview; interactive MapLibre requires an installed Aqours native build. Start Expo Go with `npm --prefix aqours-app run start -- --go --clear` and scan the QR code, following the [phone setup instructions](../aqours-app/README.md#run-in-expo-go). The API may listen on the development computer's interfaces; use an appropriate development network/firewall. The current release has no offline synchronization queue. After application process/browser reload loses an uncertain in-memory operation, inspect the existing report/request history before deliberately submitting a new action.

## Backup and restore

Stop/pause API writers before capturing database and attachment bytes together. Privately load `DATABASE_URL`, `ATTACHMENT_DIR` and a new project-local `AQOURS_BACKUP_DIR`; create its parent directory first. The script refuses to overwrite an existing backup:

```sh
mkdir -p .local/backups
./scripts/backup.sh
```

Create an isolated empty PostgreSQL database with the appropriate local administrative tools. Set private `AQOURS_RESTORE_DATABASE_URL` to that database, set `ATTACHMENT_DIR` to a new project-local restored-files directory, and keep `AQOURS_BACKUP_DIR` pointing at the selected backup:

```sh
./scripts/restore.sh
```

The backup includes a custom-format database dump, private image archive and migration SQL. Restore refuses an existing files directory and uses `pg_restore --exit-on-error` without `--clean`. Verify counts, ownership/role denial, representative gated image bytes and migration version before use. Restored sessions remain revoked/expired as stored; a real operational restore should review active sessions and access separately. Never restore over live customer data to run a demonstration. Backup paths and archive contents are private and ignored by Git. [Verification](verification.md) records the actual isolated restore test, rather than treating the script's existence as proof.

## Reproduce checks

Build/type/lint commands are in the root README. Start an API against a separate seeded test database ending `_test`. Root HTTP tests default to `http://127.0.0.1:4000/api/v1` and `postgresql://cred@127.0.0.1:55432/aqours_test`; override using `AQOURS_TEST_API` and private `AQOURS_TEST_DATABASE_URL` for your own isolated database. The database tests install temporary notification-failure triggers to check transaction rollback. Do not target real customer data.

```sh
npm run test:api
npm run test:browser
npm run test:maintenance
npm run test:operations
npm run test:recovery
npm run test:map
npm run test:seed
```

The browser runners use locally installed `/usr/bin/chromium` and write profiles/screenshots/results only under `.local/`. Set `AQOURS_TEST_WEB` for another local supplier URL; configure the API origin consistently. They do not install a browser globally. Logins are rate limited; run login-heavy suites serially and allow at least a minute between suites. Tests retain existing records and add fictional fixtures rather than silently clearing the seed. Final evidence and all unexecuted checks are recorded in [verification](verification.md) and [traceability](traceability.md).

`npm run test:seed` reads only the original fictional fixtures in the isolated `_test` database and checks canonical Laguna snapshots/formatting and inherited report locations, all fourteen salted credentials/roles, twelve connection owners, three zones/two sites, report contexts and exact available/full/cancelled stock. PSGC snapshots are read from domain tables because the legacy inspection view omits those newer columns. It prints no credentials or hashes. Run it before deliberately altering original fixture accounts/stock; stale session dates or intentional fixture maintenance may cause it to fail. Create a separate fresh isolated seed when needed; never reset unrelated records to force a pass.

## Configuration reference

Values below refer to the four `.env.example` files. An optional variable can be omitted; a placeholder is not a credential. Application secrets are server/operator-only. The public client variables are intentionally compiled into bundles.

| Variables | Required/default and source |
| --- | --- |
| `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PORT` | Optional Compose defaults `aqours`, `aqours`, `5432`; choose isolated local names/port. Server/operator configuration |
| `POSTGRES_PASSWORD` | Required Compose secret; generate locally. API database URL must use the same password |
| `AQOURS_PGDATA_PATH` | Required absolute path inside this project to an existing database-data directory |
| `DATABASE_URL` | Required for database operations; construct from your local PostgreSQL user/password/host/port/database. Never expose it in clients or logs |
| `PORT`, `WEB_ORIGIN`, `NODE_ENV`, `SESSION_DAYS` | Optional API defaults4000, `http://localhost:5173`, nonproduction,7days. Session duration must be positive and at most30days; production requires an HTTPS web origin |
| `ATTACHMENT_DIR` | Optional API default `aqours-api/storage/attachments`; override only to another project-local private directory. Also consumed by backup/restore tools |
| `SEED_DEMO` | Explicit value1 required only when intentionally seeding a nonproduction database; not a startup seed switch |
| `GEOAPIFY_API_KEY`, `GEOCODE_SIGNING_SECRET` | Optional integration pair; both needed for geocoding. Manually obtain the first from Geoapify and generate the second locally. Leave both empty/unset to use address-only reporting without geocoding |
| `GEOAPIFY_BIAS`, `GEOAPIFY_FILTER`, `GEOAPIFY_TIMEOUT_MS` | Optional geocoding defaults `countrycode:ph`, `countrycode:ph`,5000ms; explicit empty bias/filter disables it. Timeout accepts100–30000ms |
| `VITE_API_URL`, `VITE_GEOAPIFY_MAPS_API_KEY`, `VITE_MAP_TILE_URL`, `VITE_MAP_ATTRIBUTION` | Public supplier API base, separate Geoapify browser tile key, optional raster override/provider credit. Missing tile configuration displays an explicit notice; web style JSON is retired |
| `AQOURS_NO_DOTENV` | Set to `1` for isolated supplier builds/dev/preview checks using explicit process variables; prevents Vite loading local environment files |
| `EXPO_PUBLIC_API_URL` | Required public Android API URL; no implicit localhost default. Use emulator/LAN/HTTPS address as appropriate; changing HTTP/HTTPS native policy requires rebuilding |
| `EXPO_PUBLIC_MAP_STYLE_URL` | Optional public Android style URL; empty/unset selects OpenStreetMap standard raster tiles; failures retain address-based fallback |
| `AQOURS_TEST_API`, `AQOURS_TEST_WEB`, `AQOURS_TEST_DATABASE_URL` | Optional operator test overrides; local test API, browser origin and isolated `_test` PostgreSQL database. Database URL is private; default test values are documented above |
| `AQOURS_BACKUP_DIR`, `AQOURS_RESTORE_DATABASE_URL` | Required only for the respective explicit backup/restore command; private project-local new archive directory and an isolated empty restore target |

Normal Node/Expo/Android tooling also uses the explicitly configured project-local cache/toolchain variables shown in the install script and Android guide. They are operator paths and tool switches, not additional application credentials. Root browser scripts use explicit Node22-compatible TypeScript/test-isolation flags; the executed environment was Node26. A successful newer-runtime check does not claim a separate Node22 execution.

## Dependency and implementation choices

| Choice | Reason and record |
| --- | --- |
| Independent npm packages plus local public DTO package | Preserves the existing Expo project and avoids a workspace/module-resolution migration. Build contracts first; each application and root toolset has its own committed lockfile |
| Express5, Prisma7 with PostgreSQL adapter, Zod4 | Layered TypeScript API with generated Prisma models, transaction-scoped repositories and backend permissions. Migration SQL retains ownership, history, stock and lock safeguards. |
| PostgreSQL18.6 with numeric coordinates and exact NUMERIC liters | Container version is pinned; viewport filtering needs no PostGIS. Session/request/allocation locks and exact sums enforce stock authority; Prisma baseline and normalization migrations preserve the original four SQL migrations |
| Multer2 and Jimp1.6 | Bounded multipart still-image uploads plus actual decode/reencode/metadata stripping; private bytes remain authenticated. Hashing/password/session primitives use Node crypto rather than an external identity service |
| Existing Expo57/RN0.86.3/React19.2.3, SDK-matched SecureStore/location/image-picker and MapLibre RN11.5 | Keeps the approved Android stack. Compatible native modules are in the mobile lockfile; real dual-architecture APK builds verify native compilation |
| Explicit expo-file-system57.0.7 | Expo57 installs its fetch globally; multipart uploads use the SDK's byte-capable `File`, as described in the [versioned FileSystem guide](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/#uploading-files-using-expofetch). This package was already an Expo dependency; direct application use is now recorded in package/lockfile. Offline Expo installation used the SDK's bundled version list; the unavailable remote compatibility check was skipped, not counted as passed |
| React19, Vite7, MapLibre GL JS6.15 | Supplier UI and actual map renderer use TypeScript; an explicit Vite worker import is required and verified in production assets. No backend map secret enters the browser |
| TypeScript6, ESLint9, Node tests/tsx, Playwright | Local type/lint/build/behavioral checks. Browser verification uses the existing Chromium executable and a project profile rather than installing a browser globally |

Project `.npmrc` files keep ordinary npm caches under the invoking project directory's `.cache/npm`; the install script explicitly shares the root cache. Expo telemetry is disabled by its local scripts, and lint disables implicit dotenv reads. Android generated directories/toolchains/build caches and evidence are ignored. No global installation, new paid account, production deployment or AI dependency was introduced.

## Adopting Prisma on an existing database

Stop API writers and take a verified database/attachment backup. Do not run the baseline SQL directly against existing tables. Configure the existing private database through API `.env` or the process environment:

```sh
(cd aqours-api && npm run migrate:adopt)
(cd aqours-api && npm run migrate)
```

Adoption verifies all four legacy migration checksums and supported record types, then marks `0_legacy_baseline` applied in Prisma's ledger. Deployment transactionally creates and backfills domain tables, moves target arrays into junctions, separates assistance details, reattaches foreign keys and preserves database safeguards. IDs, timestamps, versions, sessions, password hashes, replay responses and attachment references remain preserved. Historical guidance without recorded evidence remains nullable. The original records remain in frozen `legacy_records`; `records` becomes a read-only inspection view. Future migrations belong in `aqours-api/prisma/migrations/`; preserve both applied migration histories.

The root installation script generates the client after installing API dependencies. Generate it explicitly with `npm --prefix aqours-api run generate` after a standalone API installation or schema changes. Development startup, build and typecheck generate it automatically. Generated code and CLI cache remain project-local and untracked. Use a separately supplied disposable shadow database when developing migrations; never use the ordinary application database as a shadow database.

Rehearse the upgrade on a restored database ending `_test`, then run `AQOURS_MIGRATION_DATABASE_URL=<private-upgraded-test-url> AQOURS_MIGRATION_SOURCE_DATABASE_URL=<matching-frozen-source-test-url> npm run test:migration`. Migration failure rolls back the normalization transaction; correct and resolve that failed migration before retrying. After a successful cutover, rollback requires restoring the pre-upgrade backup with the matching previous application version; the frozen archive alone is not a rollback procedure. Resume API writers only after migration, ownership, stock and gated-image checks pass. The ordinary local database was not upgraded automatically during development of this refactor.

Backup now includes the Prisma schema/migrations/config and historical migration files. Keep the whole backup private. [Directory navigation](directory-structure.md) explains the new source layout.

Technical references: [Prisma existing-database baselining](https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining), [custom migration SQL for database safeguards](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/unsupported-database-features), and [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite).

The refactor Android smoke test used the existing project-local SDK/JDK/Gradle caches in offline mode and an isolated ADB server. Its emulator initially logged native map allocation errors; `-feature -Vulkan` produced a visible style/point on retry. Keep `ANDROID_TMP`, `ANDROID_EMULATOR_HOME`, Android user/AVD paths and caches project-local. See the [bounded native result](native-verification.md#prisma-refactor-native-smoke--20-october-2026).

## PSGC and street maps

Deploy the additive PSGC migration and include the sibling `psgc-address-data/data/` directory with the API. Supplier PSGC Weather also requires `psgc-address-data/weather/` (coordinate mapping plus retained attribution/provenance); that addition needs no migration or provider key. Guided addresses need no provider key. Supplier Geoapify tiles require the separate public browser tile key or an explicit raster override. Native `EXPO_PUBLIC_MAP_TILE_URL` overrides its street template unless a native style URL is set. See [configuration, provenance, and update instructions](location-and-maps.md). Browser checks include `npm run test:addresses`; run login-heavy suites serially with the documented throttle interval.

### Laguna upgrade verification

`npm run test:seed-upgrade` requires a **separate original v1-seeded** database ending `_test`, supplied through `DATABASE_URL`, with `SEED_DEMO=1`. It adds an unrelated historical report, tests modified/ambiguous fixture refusal and rollback via a temporary failure trigger, then races two concurrent upgrade calls, commits the fixture correction once and verifies complete repeat-run stability. It refuses a fresh v2 database. Never run this mutating verification on the ordinary demo database. Fresh-seed acceptance uses `AQOURS_TEST_DATABASE_URL` and `npm run test:seed` separately. See [verification evidence](verification.md).

`npm run test:laguna:browser` reads an otherwise fresh Laguna seed through the supplier UI, checks eleven located reports/three clusters plus the unlocated scenario, and selects a report from each locality. Supply `AQOURS_TEST_API`/`AQOURS_TEST_WEB` matching the built web client and run it before suites that add map fixtures. Build with `VITE_MAP_TILE_URL=https://tiles.example.test/{z}/{x}/{y}.png` so raster bytes stay local to the test. Optional `AQOURS_LIVE_WEATHER=1` also checks actual Open-Meteo Calamba search/forecast availability; provider failure is a failed live check rather than a mock pass.


## Distribution monitoring deployment and checks

Deploy additive migration `202610220001_distribution_monitoring` before starting the updated API. Existing configured API scripts load the operator's optional local environment as already documented:

```sh
(cd aqours-api && npm run migrate)
(cd aqours-api && npm run build)
(cd aqours-api && npm start)
```

API startup starts the monitoring scheduler; no cron service, package or additional environment variable is required. Each healthy tick runs every four seconds, while a minute sweep checks time-based eligibility and hourly refreshes update active located sites. Durable database work and expiring claims recover after restarts and coordinate multiple API instances. Apply migrations once before starting those instances. Shutdown waits for owned monitoring work before disconnecting Prisma.

Staff/admin enable monitoring explicitly per site in Distribution. No threshold activation or inventory reset occurs on deployment. Current reservation availability is computed from existing sessions. Existing public `VITE_GEOAPIFY_MAPS_API_KEY` enables Streets/Light/Dark styles; a custom raster URL exposes only the configured basemap, and missing configuration retains lists/markers with a notice. See [monitoring behavior, quotas and limits](distribution-monitoring.md).

New checks require seeded isolated databases ending `_test`. They start/stop their own API; supply a free API port. Use separate databases/ports when running HTTP and browser checks concurrently:

```sh
DATABASE_URL='postgresql://<user>@127.0.0.1:<port>/aqours_distribution_test' \
WEB_ORIGIN=http://127.0.0.1:5190 AQOURS_TEST_WEB=http://127.0.0.1:5190 \
AQOURS_TEST_API=http://127.0.0.1:4021/api/v1 npm run test:distribution

# Build/serve the supplier client with VITE_API_URL=http://127.0.0.1:4020/api/v1.
# For style checks set a nonsecret fixture-only VITE_GEOAPIFY_MAPS_API_KEY and clear
# VITE_MAP_TILE_URL; the browser runner intercepts all Geoapify raster bytes.
DATABASE_URL='postgresql://<user>@127.0.0.1:<port>/aqours_distribution_browser_test' \
WEB_ORIGIN=http://127.0.0.1:5190 AQOURS_TEST_WEB=http://127.0.0.1:5190 \
AQOURS_TEST_API=http://127.0.0.1:4020/api/v1 npm run test:distribution:browser
```

Fixtures control only external weather/tile responses. Authentication, inventory transactions, persistence, warning generation, notification ownership, job claims and browser interactions use the real application. Provider uptime/licensing and ordinary-data deployment are separate operator checks; these suites do not access the ordinary database or private configuration.

## Workflow update — 23 October 2026

See [account, notification, conversation and customer workflow corrections](workflow-feedback.md) for current account/connection provisioning, optional generated connection numbers, recipient-owned supplier alerts, conversation indexes, customer tabs, question submission and password changes. Existing data is preserved; no schema migration or dependency changes are required.

The focused workflow HTTP and browser regressions use a deliberately isolated API on `localhost:4049`, supplier preview on `localhost:5179` built with `VITE_API_URL=http://localhost:4049/api/v1`, and a project-local disposable PostgreSQL cluster on port 55439. Run the scripts documented in [workflow verification](verification.md#account-and-customer-workflow-corrections--23-october-2026) serially to avoid sharing login throttles and transaction-failure triggers. `verification/workflow-feedback-seed.ts` requires matching `DATABASE_URL`/`AQOURS_TEST_DATABASE_URL` ending `workflow_test` or `workflow_seed_test` on that cluster plus `SEED_DEMO=1`; it never authorizes an ordinary database reset. Set `AQOURS_CHROMIUM` to an existing compatible browser for `verification/browser-workflow-feedback.ts`; no browser is installed by the runner.
