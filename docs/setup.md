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
| `aqours-web/.env.example` | `VITE_API_URL`, `VITE_MAP_STYLE_URL`, optional `VITE_MAP_ATTRIBUTION`. All are public browser bundle configuration. |
| `aqours-app/.env.example` | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_MAP_STYLE_URL`. Both are public Android bundle configuration, including the native HTTP-development setting. |

The API reads its process environment; it does not silently load `.env`. The `node --env-file=.env` commands below deliberately load the API's local file. Vite/Expo load their normal public environment files during development; `EXPO_NO_DOTENV=1` disables Expo dotenv when explicit shell/build variables are preferred. Never put database passwords, the Geoapify geocoding key or candidate-signing secrets in a `VITE_*`, `EXPO_PUBLIC_*`, Expo `extra`, style URL or client source field.

## PostgreSQL and attachments

Set `AQOURS_PGDATA_PATH` to the absolute path of this checkout's `.local/container-postgres`. Create it before Compose starts. The named `database` volume uses a local bind driver to keep PostgreSQL files there; Docker still maintains its ordinary image/container/network/volume metadata. The project owner explicitly approved Docker verification; normal setup also requires your Docker permissions.

```sh
mkdir -p .local/container-postgres
docker compose up -d db
docker compose ps
```

Compose pins standard `postgres:18.6-alpine3.23`, publishes the configured port on `127.0.0.1`, checks readiness, and uses a private Compose network. PostgreSQL 18 stores data below the mounted `/var/lib/postgresql`; no PostGIS extension is used. A host API URL uses `127.0.0.1:<POSTGRES_PORT>`; if you separately containerize the API, its private database hostname is `db` and port is `5432`. Database configuration never belongs in either client.

```sh
(cd aqours-api && TSX_DISABLE_CACHE=1 node --env-file=.env --import tsx src/migrate.ts)
(cd aqours-api && SEED_DEMO=1 TSX_DISABLE_CACHE=1 node --env-file=.env --import tsx src/seed.ts)
(cd aqours-api && TSX_DISABLE_CACHE=1 node --env-file=.env --import tsx src/server.ts)
```

Migrations are checksum tracked and transactional; repeated migration/seed commands preserve existing records. The seed refuses production and nonempty unseeded databases. Reset requires deliberately creating a separate empty development database or explicitly removing your own demo database; there is no reset endpoint, startup reset, or automated destructive command. Keep original migration files unchanged after they are applied.

The private attachment directory defaults to `aqours-api/storage/attachments` and must remain inside this repository. Images are decoded/re-encoded and accessed through the authenticated API; the directory has no public static route. Restore its bytes together with database metadata. A crash between file rename and transaction commit may leave an unreferenced UUID file; reconcile against attachment metadata while writes are paused. Never delete referenced files simply because a client timed out.

Container replacement with the same volume preserves data:

```sh
docker compose up -d --force-recreate db
```

Do not use `down -v` as a routine restart. A persistent volume is separate from a backup.

## Provider setup without blocking reporting

Create a Geoapify project/key manually through the [Geoapify dashboard](https://myprojects.geoapify.com/) when you want live typed-address lookup. Review its quotas/terms and restrict the server key appropriately to the server environment. Put it only in API `GEOAPIFY_API_KEY`; generate a separate random `GEOCODE_SIGNING_SECRET` yourself. `GEOAPIFY_BIAS`/`GEOAPIFY_FILTER` select a configurable service region; the fictional demonstration uses Philippine country bias/filter. Upstream requests time out and return real candidates with confidence and signed 15-minute confirmation tokens. A candidate is an address suggestion, not a reviewed water-supply zone.

Until credentials exist, leave provider key/signing secret unset or empty. Missing configuration, invalid credentials, quota failures or timeouts return an honest `503`; the app retains typed address entry and can submit an unlocated report for review. Saved-address reporting, optional GPS, list views, incidents, notices and assistance do not require Geoapify. Adapter unit tests use explicit test mocks; those tests do not establish live provider success. See [Geoapify forward geocoding](https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/) for documented parameters.

MapLibre is the renderer, while styles/tiles are a separate integration. Both apps default/support `https://demotiles.maplibre.org/style.json` as a development demonstration style. It requires no key, retains source attribution and is not a production availability commitment. For real use, manually select a licensed compatible MapLibre style/tile provider. Keep provider/source attribution visible in both clients. Any credential intentionally embedded in a public style URL is public: apply origin/domain restrictions for web and the provider's Android/package/application restrictions and quota limits where supported, and grant only tile/style access. A provider requiring a private secret must use a suitable server integration; do not bundle that secret. Custom supplier-web attribution can be supplied using `VITE_MAP_ATTRIBUTION`; native styles must contain their required attribution. Review the provider's terms before public use. The [MapLibre demo tiles repository](https://github.com/maplibre/demotiles) describes this demonstration source.

No external account, paid resource, provider key or production notice was provisioned during implementation. The academic acceptance of rules/questionnaire/action cards remains a separate manual confirmation; no AI was added.

## Supplier and Android applications

```sh
npm --prefix aqours-web run dev
```

Use `http://localhost:5173`, matching API `WEB_ORIGIN` exactly. Supplier sessions use HttpOnly cookies and a CSRF token in memory; credentials are not saved in browser storage. API production mode requires an HTTPS origin and secure cookies. Configure HTTPS and a trusted reverse proxy separately for any later deployment; no deployment has been performed.

For Android set `EXPO_PUBLIC_API_URL` to `http://10.0.2.2:4000/api/v1` for the standard emulator, or a reachable LAN host for a physical phone. Set the public style URL, rebuild native configuration when changing cleartext policy, and follow [the Android guide](../aqours-app/README.md). Native MapLibre cannot run in Expo Go. The API may listen on the development computer's interfaces; use an appropriate development network/firewall. The current release has no offline synchronization queue. After application process/browser reload loses an uncertain in-memory operation, inspect the existing report/request history before deliberately submitting a new action.

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

`npm run test:seed` reads only the original fictional fixtures in the isolated `_test` database and checks all fourteen salted credentials/roles, twelve connection owners, three zones/two sites, report contexts and exact available/full/cancelled stock. It prints no credentials or hashes. Run it before deliberately altering original fixture accounts/stock; stale session dates or intentional fixture maintenance may cause it to fail. Create a separate fresh isolated seed when needed; never reset unrelated records to force a pass.

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
| `VITE_API_URL`, `VITE_MAP_STYLE_URL`, `VITE_MAP_ATTRIBUTION` | Optional public supplier defaults `http://localhost:4000/api/v1`, MapLibre demo style, no additional attribution. Select licensed alternate tile/style configuration manually |
| `EXPO_PUBLIC_API_URL` | Required public Android API URL; no implicit localhost default. Use emulator/LAN/HTTPS address as appropriate; changing HTTP/HTTPS native policy requires rebuilding |
| `EXPO_PUBLIC_MAP_STYLE_URL` | Optional public Android style URL; absent/failed configuration shows the address-based fallback. The example intentionally requires you to select a real development/licensed URL |
| `AQOURS_TEST_API`, `AQOURS_TEST_WEB`, `AQOURS_TEST_DATABASE_URL` | Optional operator test overrides; local test API, browser origin and isolated `_test` PostgreSQL database. Database URL is private; default test values are documented above |
| `AQOURS_BACKUP_DIR`, `AQOURS_RESTORE_DATABASE_URL` | Required only for the respective explicit backup/restore command; private project-local new archive directory and an isolated empty restore target |

Normal Node/Expo/Android tooling also uses the explicitly configured project-local cache/toolchain variables shown in the install script and Android guide. They are operator paths and tool switches, not additional application credentials. Root browser scripts use explicit Node22-compatible TypeScript/test-isolation flags; the executed environment was Node26. A successful newer-runtime check does not claim a separate Node22 execution.

## Dependency and implementation choices

| Choice | Reason and record |
| --- | --- |
| Independent npm packages plus local public DTO package | Preserves the existing Expo project and avoids a workspace/module-resolution migration. Build contracts first; each application and root toolset has its own committed lockfile |
| Express5, `pg`8, Zod4 | Small TypeScript HTTP/validation layer with explicit SQL transactions and backend permission checks. SQL migrations enforce typed references/ownership/history instead of relying on UI or a new ORM |
| PostgreSQL18.6 with numeric coordinates and exact NUMERIC liters | Container version is pinned; viewport filtering needs no PostGIS. Session/request/allocation locks and exact sums enforce stock authority; four checksummed migrations are committed |
| Multer2 and sharp0.34 | Bounded multipart still-image uploads plus actual decode/reencode/metadata stripping; private bytes remain authenticated. Hashing/password/session primitives use Node crypto rather than an external identity service |
| Existing Expo57/RN0.86.3/React19.2.3, SDK-matched SecureStore/location/image-picker and MapLibre RN11.5 | Keeps the approved Android stack. Compatible native modules are in the mobile lockfile; real dual-architecture APK builds verify native compilation |
| Explicit expo-file-system57.0.7 | Expo57 installs its fetch globally; multipart uploads use the SDK's byte-capable `File`, as described in the [versioned FileSystem guide](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/#uploading-files-using-expofetch). This package was already an Expo dependency; direct application use is now recorded in package/lockfile. Offline Expo installation used the SDK's bundled version list; the unavailable remote compatibility check was skipped, not counted as passed |
| React19, Vite7, MapLibre GL JS6.15 | Supplier UI and actual map renderer use TypeScript; an explicit Vite worker import is required and verified in production assets. No backend map secret enters the browser |
| TypeScript6, ESLint9, Node tests/tsx, Playwright | Local type/lint/build/behavioral checks. Browser verification uses the existing Chromium executable and a project profile rather than installing a browser globally |

Project `.npmrc` files keep ordinary npm caches under the invoking project directory's `.cache/npm`; the install script explicitly shares the root cache. Expo telemetry is disabled by its local scripts, and lint disables implicit dotenv reads. Android generated directories/toolchains/build caches and evidence are ignored. No global installation, new paid account, production deployment or AI dependency was introduced.
