# Source directory navigation

The API uses layers grouped by domain; clients group UI by feature. Existing URLs, public DTOs and Expo Router navigation remain stable.

## API

```text
aqours-api/
├── prisma/
│   ├── schema.prisma       # Domain models and relationships
│   └── migrations/         # Baseline and future migration history
├── migrations/             # Original SQL retained for baseline verification
└── src/
    ├── routes/             # HTTP endpoints, access guards and controller wiring
    ├── controllers/        # HTTP boundary, input validation, response handling
    ├── services/           # Business rules and transaction coordination
    │   └── <domain>/       # Named workflow operations
    ├── repositories/       # Prisma model access, locks, persistence projections
    ├── middleware/         # Authentication, security, uploads, operation replay
    ├── validators/         # Shared and domain-specific Zod input schemas
    ├── config/             # Environment and UTC Prisma connection
    ├── utils/              # Errors, passwords, filtering and shared helpers
    ├── types/              # Internal workflow and command context types
    ├── scripts/            # Migration adoption/deploy and repeatable seeds
    ├── generated/prisma/   # Generated; ignored and never edited
    ├── app.ts
    └── server.ts
```

Start with the matching route module, follow its controller to a named service, then inspect the domain repository and Prisma model. Controllers translate Express input into a request-independent command context; services do not use Express methods. Repositories accept the service's transaction client. Domain persistence adapters share serialization, ordered targeting and optimistic-version mechanics; security/history/stock/map repositories handle their specialized queries.

## Supplier web

```text
src/
├── app/                    # Shell, routing, navigation
├── features/<domain>/
│   ├── screens/            # Overview, reports, incidents, advisories, assistance…
│   ├── components/         # Feature-only reusable UI
│   ├── hooks/              # Feature state, including supplier session
│   ├── validators/         # Existing client validation helpers
│   └── utils/              # Feature helpers such as map layers
├── components/             # Shared forms, tables, history and resource states
├── hooks/                  # Shared resource/reference/command state
├── services/               # Cookie/CSRF HTTP transport and frozen retries
├── styles/                 # Tailwind entry, existing base rules, vendor overrides
└── utils/                  # Explicit utilities for dynamic class names
```

Tailwind 4 is integrated through Vite. Preserve class markers used by browser checks when changing utility classes. Keep dynamic utility strings explicit so the Tailwind scanner can discover them. Leaflet and markercluster retain their vendor stylesheets in the map feature. Native form defaults remain intact because Preflight is not imported.

## Customer app

```text
src/
├── app/                    # Expo Router wrappers and navigator layouts only
├── features/<domain>/
│   ├── screens/            # Home, reports, assistance, profile, notices…
│   ├── components/         # Photos, location picker, map preview, action panels
│   ├── hooks/              # Session and guidance state
│   ├── services/           # Feature request work such as multipart photo upload
│   └── utils/              # Notice matching and protected-image helpers
├── components/             # Shared native UI, timeline and resource states
├── hooks/                  # Shared resource and mutation hooks
├── services/               # Bearer HTTP transport and operation intentions
└── utils/                  # Manila time and complete pagination
```

Mobile keeps React Native styling. Do not introduce non-route modules into `app/`. Platform variants such as `map-preview.native.tsx` stay beside their fallback. Create optional folders only when they contain a real responsibility; clients do not need HTTP controllers, database repositories or Prisma types.

Shared public contracts remain in `aqours-contracts`. See [architecture](architecture.md), [schema](schema.md), [setup](setup.md) and [verification](verification.md).

## Location modules

See [locations and maps](location-and-maps.md) for the bundled PSGC catalog, guided/free-text address behavior, nullable snapshots, detailed basemap configuration, and verification boundaries.


Distribution monitoring uses shared public types in `aqours-contracts/src/monitoring.ts`; supplier components/utilities remain under `aqours-web/src/features/distribution/`. API monitoring controllers and focused services under `src/services/monitoring/` separate forecast caching/claims, stock aggregation, threshold evaluation, warning transitions/history, reads and settings. A startup worker processes durable database work; additive SQL triggers enqueue stock/site changes within their original transactions. See [monitoring architecture](distribution-monitoring.md).
