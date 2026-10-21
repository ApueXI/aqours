# Aqours

Aqours connects a water supplier and its customers through reporting, incident updates, independent advisories and three assistance services. This repository contains a TypeScript Express/PostgreSQL API, an Expo Android customer app and a React supplier workspace with direct Leaflet.

The first-release implementation is connected across these applications. Verification is still in progress; [the verification report](docs/verification.md) records executed API/database/browser/native checks and outstanding live-provider work. Fictional fixtures and quality notices are demonstration data, never real water-safety advice. Rules-based decision support is implemented; academic acceptance remains externally unverified.

## Start locally

Requirements: Node.js 22.13+ (Node 26 used for verification), npm, Docker Compose, and an Android development environment for the customer app. All package installations and caches stay in this repository.

```sh
./scripts/install.sh
```

Copy the environment examples into ignored local files yourself, generate your database password and signing secret, and set your paths/API addresses as described in [setup](docs/setup.md). No real credentials are committed or required from you during implementation.

```sh
mkdir -p .local/container-postgres
# After configuring your root .env, including its absolute project-local data path:
docker compose up -d db
# After configuring aqours-api/.env:
(cd aqours-api && npm run migrate)
(cd aqours-api && SEED_DEMO=1 npm run seed)
(cd aqours-api && npm run dev)
```

In separate terminals:

```sh
npm --prefix aqours-web run dev
# Configure public Android API/style variables first; see aqours-app/README.md.
cd aqours-app
npm run android
```

Supplier web: `http://localhost:5173`. API: `http://localhost:4000/api/v1`. Android emulator API: `http://10.0.2.2:4000/api/v1`; phones need the development computer's LAN address. Native MapLibre requires a development/native build and does not run in Expo Go.

The demo uses canonical Laguna PSGC addresses with fictional street details and synthetic service geometry. Existing demo databases can use the [explicit location upgrade](docs/setup.md#upgrading-original-demo-locations-to-laguna). Admin Overview and customer Home show current conditions and seven-day [Open-Meteo forecasts](docs/weather.md).

The fictional seed provides `admin@demo.aqours.test`, `staff@demo.aqours.test`, and `customer01@demo.aqours.test` through `customer12@demo.aqours.test`. The fixture password is `DemoWater2026!`; it is exclusively for the development seed. Staff/admin use the supplier app and customers use Android. Starting the API never resets data or automatically runs the seed.

## Read and verify

- [Setup, configuration, providers and backups](docs/setup.md)
- [API contract](docs/api.md) and [public TypeScript DTOs](aqours-contracts/src/index.ts)
- [UI/UX design and navigation](docs/ui-ux.md)
- [Open-Meteo weather for customers, staff and admins](docs/weather.md)
- [Demo walkthrough](docs/demo.md)
- [Requirements and feature index](docs/README.md)
- [Verification evidence and remaining checks](docs/verification.md), including the [installed Android ledger](docs/native-verification.md)
- [Every requirement, feature criterion and demo mapping](docs/traceability.md)
- [API details](aqours-api/README.md), [Android build guide](aqours-app/README.md), [supplier app guide](aqours-web/README.md)

```sh
npm run typecheck
npm run lint
npm run build
npm --prefix aqours-api test
npm --prefix aqours-web test
npm --prefix aqours-app test
# With the isolated seeded API and PostgreSQL test database running:
npm run test:api
npm run test:browser
npm run test:maintenance
npm run test:operations
npm run test:quality
npm run test:recovery
npm run test:map
npm run test:ux
npm run test:seed
npm run check:repository
```

Root integration tests use an isolated database ending `_test`; fault-injection tests deliberately create temporary database triggers and must never target real customer data. Run login-heavy HTTP/browser suites serially and allow at least a minute between suites so the normal login limit remains active. The [setup guide](docs/setup.md) describes their configuration and prerequisites.

The source now uses Prisma domain models, layered API modules, feature-based clients and Tailwind for the supplier web. Start with [directory navigation](docs/directory-structure.md). Existing databases require [verified baseline adoption](docs/setup.md#adopting-prisma-on-an-existing-database) before running the new migration command; the ordinary local database is not automatically upgraded.
