# Aqours API

Authenticated [Open-Meteo weather endpoints](../docs/weather.md) serve current conditions, seven-day forecasts and Philippine city search for customers/staff/admin. Customer connection lookups enforce ownership; bounded process-local caching requires no migration, new dependency or demonstration API key.

TypeScript Express API implementing [the shared v1 contract](../docs/api.md). Requires Node 22.13+ and PostgreSQL 18. Runtime npm scripts automatically load the optional `aqours-api/.env`; existing process environment variables take precedence. Database and geocoding credentials stay on the server. Build the sibling `aqours-contracts` package first, then install with the existing npm lockfile. All commands below run in `aqours-api/`.

```sh
npm ci --cache ../.cache/npm
npm run build
npm run typecheck
npm run lint
npm test
# Configure .env privately and start PostgreSQL first; see setup below.
npm run migrate
SEED_DEMO=1 npm run seed
npm run dev
# Production/build execution:
npm start
```

## Environment loading and future deployment

`dev`, `start`, `migrate`, `migrate:adopt`, `seed`, and `seed:upgrade-laguna` use Node's built-in `--env-file-if-exists=.env`. Run them here or from the repository root with `npm --prefix aqours-api run <script>` (`npm --prefix aqours-api start` for production startup). No extra environment flags or dotenv dependency are needed. Copy `.env.example` to `.env` once and replace its placeholders privately; see [setup](../docs/setup.md). The API uses its own file, separate from the root Compose `.env`.

`npm run dev` generates Prisma and watches source changes. Restart the command after editing `.env`. `npm start` runs the compiled API and requires `npm run build` first. PostgreSQL must already be running; migrations and demo seeds remain explicit commands. Tests, builds, typecheck, Prisma generation and validation do not automatically load `.env`.

For future deployment, supply secrets through the hosting environment and omit the local `.env`; a missing file is allowed. Externally supplied variables override matching file entries. Set `NODE_ENV=production`, use an HTTPS `WEB_ORIGIN`, and keep demo seeding disabled. Keep `.env` private and uncommitted; neither flags nor this file replace the existing configuration checks. Direct `node` invocations still require explicit environment configuration.

`migrate` deploys the checked-in Prisma migration history. Existing databases must first run `migrate:adopt` after stopping writers and backing up; see the adoption guide below. Repeated deploy/seed commands preserve state. Keep both applied migration histories unchanged. The demo seed requires `SEED_DEMO=1`, rejects production and nonempty unseeded databases, runs atomically, and preserves existing records on repeated runs. Startup never migrates, seeds, resets or clears data. `createApp()` in `src/app.ts` supports HTTP integration tests. `/health` confirms HTTP process health; it does not claim database readiness. Default API port is 4000 and exact browser origin is `http://localhost:5173`. Configuration names/defaults are in `.env.example`; placeholder values are not working credentials. `TSX_DISABLE_CACHE=1` prevents development transform caches outside this project.

Fresh fixtures use canonical Laguna PSGC addresses and synthetic local geometry. Existing v1 fixtures require the explicit guarded `SEED_DEMO=1 npm run seed:upgrade-laguna` command with database configuration supplied. See [upgrade safeguards and setup](../docs/setup.md#upgrading-original-demo-locations-to-laguna); normal seeding never upgrades stored locations. Admin Overview and customer Home retain the existing seven-day [Open-Meteo forecasts](../docs/weather.md).

## Distribution monitoring

The additive `202610220001_distribution_monitoring` migration retains existing distribution data and adds durable site configuration, forecasts, work leases/revisions, warning summaries and immutable warning history. Monitoring thresholds remain disabled until staff/admin explicitly configure a site. Admins alone change the temperature legend. All monitoring routes verify the single configured supplier; ambiguous or absent supplier configuration returns a clear configuration error. Customer notification routes remain separate from supplier monitoring reads.

The API process starts a four-second work scheduler, sweeps time-dependent eligibility at least each minute, and refreshes site forecasts hourly with at most three concurrent provider leases across API processes. Failed refreshes retain prior forecasts and retry after one minute, then two minutes, then hourly; temperature evidence becomes unavailable at six hours. Provider requests reuse the existing fixed-host Open-Meteo adapter, normalization and cache and run outside inventory transactions. Stopping the API stops further claims, waits for in-flight work, and disconnects Prisma. Expired leases recover after sixty seconds.

Available supply sums exact remaining liters across open, unexpired sessions, including future sessions. No eligible sessions means unavailable evidence. Capacity percentages describe configured planning capacity and may exceed 100%; forecasts never predict future liters. Database triggers queue site, session and allocation changes in the same transaction. Independent temperature warnings use each Manila date's maximum; supply warnings use current supply, with combined warnings for dates where both risks apply. Repeated evidence does not add history; changed evidence does, and per-site lifecycle notifications consolidate transitions for every active staff/admin. Stale normal forecasts cannot resolve temperature or combined warnings; disabled/missing evidence suspends warnings and elapsed dates expire them.

The supplier endpoints live under `/api/v1/staff/distribution/{monitoring,warnings,temperature-bands,notifications}` and `/api/v1/staff/pickup-sites/:id/{monitoring,forecast,forecast/refresh}`. Configuration writes retain existing idempotency/version requirements and immutable audit snapshots. `createApp()` does not start background jobs, allowing isolated HTTP tests; `runMonitoringTick({now,forecastLoader})`, `refreshSiteForecast(siteId,options)` and `evaluateSiteMonitoring(siteId,now)` expose controlled verification entrypoints without changing production provider behavior.

## Fictional demonstration logins

Every listed account uses the fixture password **`DemoWater2026!`**, exclusively for synthetic local demonstration data. Admin and staff sign in through the supplier web client; customers through the mobile client. There is no public signup.

| Login | Role |
| --- | --- |
| `admin@demo.aqours.test` | admin |
| `staff@demo.aqours.test` | staff |
| `customer01@demo.aqours.test` through `customer12@demo.aqours.test` | customer |

The dataset has one fictional supplier, three zones, twelve customer connections/reports, four category-specific published incidents, a synthetic quality advisory, two pickup sites, available/full/cancelled sessions, callback/inspection/water-support requests, a reopened report with first-resolution history, and an unmatched customer connection without coordinates/confirmed zone. All incident/advisory/pickup examples carry demonstration flags. Synthetic quality text is not real public-health advice.

## Physical model and transaction boundaries

`records` stores focused typed domain documents in JSONB plus UUID identity, kind, relational owner/parent, optimistic version, creation/update times and generated numeric latitude/longitude. The API uses deliberate public projections: passwords live only in `credentials`; sessions store hashed opaque verifiers; internal notes live only in private immutable events; incident public reads use immutable publication snapshots. A numeric coordinate index supports SQL viewport filtering/count/capping without PostGIS. Missing locations remain null and count separately.

Migrations enforce composite report-to-connection ownership and assistance-to-report ownership, unique active assistance/affected assertions, unique normalized account emails/connection references/zone codes, valid statuses/categories, coordinate pairs/ranges and customer ownership. Reference triggers validate zone/connection arrays and typed incident/report/site/owner/session references. `events` and historical domain rows reject mutation; water ledger rows reject deletion. Immutable rule rows derive their current active flag from the highest domain revision. The application additionally enforces actor roles, record ownership, transition/required-field rules, candidate token confirmation and active target eligibility.

`operations` retains actor+method/path+UUID operation keys and request fingerprints indefinitely. Password-bearing requests first apply a slow, operation-scoped scrypt fingerprint; operations never retain plaintext passwords or a fast password-only verifier. The advisory lock on an operation precedes all domain locks, and committed response replay precedes stale-version validation. Domain data, immutable history, notifications and operation result commit together. Different payloads with the same key return 409. Notification uniqueness is recipient+source event. Browser sessions use HttpOnly SameSite=Lax cookies, exact origin checks and CSRF headers; mobile uses bearer tokens. Logout and account security changes revoke sessions. Passwords use independently salted scrypt; login and general API traffic have rate limits.

Water stock is authoritative PostgreSQL `NUMERIC(14,2)` with SQL exact sums. Every stock workflow locks session, request, then allocation, including acceptance, collection, cancellation and session cancellation. Reservations/collections are retained ledger rows; reservation-to-collection keeps remaining liters constant. Triggers also prevent aggregate overcommit, shrinking totals below commitments and invalid allocation state/identity changes. Cancellation releases an uncollected reservation once and blocks later collection. Session cancellation serializes with creation/acceptance/collection, marks pending/uncollected requests unavailable, preserves collected results and inserts follow-up notifications atomically. A persistent first-work timestamp prevents customer cancellation after work has begun, including after rescheduling.

## Protected photos and external adapters

Photos are accepted only after authenticated report ownership, then limited to 5 MiB, decoded with sharp (JPEG/PNG/WebP, still image, at most 25 million pixels), rotated/re-encoded to remove metadata and checked again for size. The server writes a random UUID-named file with restrictive permissions through an atomic temporary-file rename, then commits metadata; request rollback removes the staged final file. `ATTACHMENT_DIR` must resolve inside the project (default `aqours-api/storage/attachments`); it is never served statically. Download rechecks report ownership/staff authorization and returns private/no-store bytes. Attachment idempotency fingerprints file content/name. Failed upload retries do not create a second report. A process crash between file rename and DB commit can leave an unreferenced file; such files grant no API access and should be reconciled against attachment metadata during operational maintenance. Backups must include both PostgreSQL metadata and the attachment directory.

Geoapify forward search is server-only, times out after 5 seconds by default and returns genuine provider candidates with confidence when supplied. Candidate HMAC tokens bind address/coordinates and expire after 15 minutes. Both provider key and signing secret must be configured. Region bias/filter default to `countrycode:ph` and can be explicitly configured or disabled with empty values. Missing configuration, upstream errors/timeouts return 503; address-only reporting stays usable. GPS remains optional and coordinates never default to zero. Live provider success requires a real configured provider account and is not implied by unit tests.

## Scope and verification

All API routes in the v1 contract are registered, including supplier map/metrics, owner-only reporting/attachments/guidance, assistance/stock, advisories, account/connection/zone/rule settings and persisted in-app notifications. No push/SMS/email delivery, offline queue, automatic advisory lifting, automated diagnosis, or home delivery is implemented. The trusted reverse proxy/deployment must enforce HTTPS in production and provide the configured web origin; secure cookies are enabled in production. Rate limits are process-local for this single-server release.

Run the API unit suite for cryptographic/input/advisory invariants. Root verification exercises real HTTP/PostgreSQL behavior and concurrency; see the repository's verification evidence for executed checks and deployment limitations. Local unit tests alone do not prove Android device behavior, live Geoapify availability, external TLS deployment or backup restoration.

The API uses Prisma domain models and layered routes/controllers/services/repositories. See [directory navigation](../docs/directory-structure.md), [schema](../docs/schema.md), and [existing-database adoption](../docs/setup.md#adopting-prisma-on-an-existing-database) before upgrading a populated installation.
