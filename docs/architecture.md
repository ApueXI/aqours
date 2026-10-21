# Architecture

Updated 20 October 2026 for the Prisma and client-structure refactor. The 18 October documentation described an Expo starter and empty API/web directories; that is a historical baseline. TypeScript implementations now connect the customer application and supplier workspace to Express and PostgreSQL. Implementation evidence and acceptance evidence are distinct: see [verification](verification.md) and [traceability](traceability.md).

Related: [requirements](requirements.md), [schema](schema.md), [API contract](api.md), [workflows](workspace.md), [setup](setup.md).

## Components and repository boundaries

| Location | Implemented responsibility |
| --- | --- |
| `aqours-api/src/` | Express 5 routes, role/ownership authorization, Zod input validation, sessions, publication, guidance, assistance, uploads and stock transactions |
| `aqours-api/prisma/` | Prisma domain schema, legacy baseline and transactional normalization migration; original SQL remains in `migrations/` for baseline verification |
| `aqours-web/src/` | React/Vite supplier login, overview, inbox/detail, Leaflet map, incidents, advisories, assistance, distribution and admin settings |
| `aqours-app/src/app/` | Expo Router customer navigation and protected route composition |
| `aqours-app/src/features/` | Focused home, report/location/photo, guidance, assistance and notification screens |
| `aqours-contracts/src/` | Shared TypeScript public DTOs, common enums and response contracts; no database or credentials |
| `compose.yaml` | PostgreSQL 18.6 Alpine service, loopback host port, health check and named volume backed by a configured project-local directory |
| `verification/`, component tests | API/database and browser verification plus focused client checks; see the verification ledger for executed results |

The user adopted one supplier, seeded individual accounts, the customer/staff/admin split, rules/questionnaire/action cards, REST contracts, workflows and metrics as first-release defaults. Academic acceptance of decision support remains externally unverified. No AI integration is implemented. Android is the customer target; optional/deferred capabilities remain in [requirements](requirements.md).

## Data flow and trust boundaries

```mermaid
flowchart LR
    Customer[Expo Android customer app] -->|Bearer session| API[Express API]
    Supplier[React supplier app] -->|HttpOnly cookie and CSRF| API
    API -->|Prisma Client and transactions| DB[(PostgreSQL)]
    API -->|Authorized image operations| Files[Private project-local attachments]
    API -->|Private key and signed candidates| Geoapify[Geoapify geocoding]
    API -->|Coordinates / city search| Weather[Open-Meteo weather and city search]
    Customer -->|Configured public style| Tiles[Map tiles]
    Supplier -->|Configured public style| Tiles
    GPS[Optional foreground GPS] --> Customer
```

The API is authoritative for role and record access, transitions, publication, guidance and stock. Customer identity comes from the session. Staff/admin operational reads contain protected operational information; explicit response projections in `services/presentation/projection.ts` construct customer DTOs from allowlisted fields. An incident's internal changes are separate from its immutable published update. Internal notes are private events, excluded from public timelines and notifications.

`app.ts` composes routes and middleware. Routes register endpoints and guards; controllers validate input and translate Express requests into explicit command contexts; services enforce business rules and coordinate transactions; repositories use generated Prisma domain delegates. `middleware/` owns authentication, security headers, upload preparation and operation replay. `validators/`, `config/`, `types/` and `utils/` hold focused shared concerns. See [directory navigation](directory-structure.md).

Prisma 7 uses its PostgreSQL adapter with UTC connections, including when the server default timezone differs. Domain state lives in typed relational tables with explicit ownership and target relationships. JSON remains for immutable snapshots, GeoJSON and structured evidence. `entities` contains only identity/type for polymorphic history. `legacy_records` is a frozen migration archive; the read-only `records` view supports historical inspection tools, and application persistence never uses it. Services still exchange flexible internal workflow values through a domain repository adapter; generated models define stored fields and public contracts remain separately projected.

Transactions retain session/request/stock locks, atomic history/notifications and operation replay. SQL is limited to repository lock queries and custom database safeguards in migrations; a failure after a successful transaction callback is conservatively classified as an uncertain commit unless the driver establishes rollback.

## Authentication and permissions

Passwords are salted scrypt hashes in `credentials`, separate from public profile records. Sessions store a SHA-256 token digest, expiry, client kind, CSRF token and revocation time. Browser login establishes an HttpOnly, SameSite=Lax cookie scoped to `/api/v1`, with Secure enabled in production; mutations require the configured Origin and `X-CSRF-Token`. The web client keeps CSRF state in memory and restores identity from the session endpoint. Android uses a bearer token in Expo SecureStore, verifies the server identity before mounting private routes and retains a pending-revocation state when server logout cannot be confirmed.

Operational staff/admin can review reports/incidents, publish incident updates and fulfill assistance/distribution. Admin alone provisions accounts/connections/zones, versions approved guidance/rules and publishes/lifts official advisories. Account security changes revoke sessions. Customer lookups verify ownership of reports, photos, messages, guidance, requests and notifications; published data is separately scoped. Navigation visibility is supplemental to backend checks. See the full matrix in [requirements](requirements.md).

## Location and maps

Saved service connections and report issue-location snapshots remain separate. Optional GPS uses foreground permission without geocoding; denied permission leaves saved-address entry available. Typed addresses use the authenticated Geoapify adapter with configured region bias/filter, a timeout, a limited candidate list and expiring signed candidate tokens. Missing credentials/provider failure returns an explicit unavailable result; unresolved addresses can be submitted for review. Alternate issue zones require review rather than inheriting a saved zone. GPS accuracy is retained in meters, with null for unknown/legacy records. High-accuracy one-shot acquisition avoids a forced Google network-accuracy prompt; the bounded timeout retains address fallback. Confirming a coordinate never confirms a service zone.

Report, service-connection and pickup-site coordinates are ordinary nullable `DOUBLE PRECISION` columns, with paired-null/range checks and a report viewport index. Map responses use `[longitude, latitude]`. Optional Polygon/MultiPolygon GeoJSON is validated for display; explicit zone/connection associations establish applicability. Map clusters never establish outages or supply connectivity. Staff viewport queries apply numeric bounds, filters, limits and truncation/unlocated counts. Antimeridian-spanning bounds are rejected.

Direct Leaflet 1.9.4 with markercluster is implemented in `aqours-web/src/features/map/`. The native preview entry point `aqours-app/src/features/location/components/map-preview.native.tsx` uses Expo's `isRunningInExpoGo()` to show supplied coordinates in Expo Go. It loads the separate `maplibre-preview.native.tsx` renderer and its street-map configuration only in Aqours native builds; importing report routes in Expo Go therefore does not require MapLibre native modules. Lists/forms remain usable when basemaps fail. Geoapify, map rendering and style/tile provisioning are independent integrations. Actual native basemap/circle/picker/protected-image checks are recorded in the [native ledger](native-verification.md); controlled GPS/native-supplier coordinate equality passed; live Geoapify equality still requires private operator configuration.

## Publication and independent lifecycles

Report review, incident status, published incident updates, advisory state and assistance outcomes remain independent. Explicit publication saves an immutable snapshot, relevant history and deduplicated notification rows in one database transaction. Notifications use `(user_id, source_event_key)` uniqueness, including overlapping report/connection audiences. In-app foreground refetch/polling reads persisted notifications; no external delivery worker or outbox is required by this implementation.

Customer advisory projections retain only explicitly targeted owned connection IDs; matching public zones uses confirmed owned connections. Native Home/detail display planned dates and matching own references/address without disclosing other households.

Only explicit authorized lifting ends a published quality restriction. Incident resolution and scheduled end times do not lift it. Still-affected feedback returns one report to review while retaining earlier substantive-resolution history. Guidance evaluation uses current published sources, approved rule versions, answers and pickup availability; historical evaluations keep input/source references and a source signature so a changed source marks them non-current. The customer chooses an action or declines; evaluation/choice never creates or accepts assistance.

## Assistance and stock

Callback, inspection and water-support requests share a versioned workflow and owned report context. Acceptance requires an active staff/admin owner; scheduling, rescheduling, immediate-support exceptions, unavailability and completion have explicit field/reason checks. Water completion goes through collection rather than the generic transition endpoint. Appointment and transition events retain prior context. Public history projects only validated old/new appointment instants from event metadata; arbitrary audit metadata stays private. Generated appointment/restoration text is localized on read without rewriting immutable UTC records.

Stock uses relational `stock_sessions` and `allocations`, with `NUMERIC(14,2)` liters and decimal string DTOs. Acceptance serializes on session/request locks, rechecks eligibility and stock and creates a reserved allocation plus reference atomically. Collection changes reserved to collected once; cancellation releases an uncollected allocation. Session cancellation makes active uncollected requests unavailable with support follow-up and retains collected outcomes. Database triggers additionally prevent overcommitment, reducing totals below commitments, invalid ledger transitions and deleting allocation history. The invariant is `remaining = total - reserved - collected`.

## Operations and verification limits

Prisma Migrate maintains `_prisma_migrations`; adoption first verifies the preserved legacy SQL migration checksums. Fresh installations apply the baseline and normalization migrations. Existing installations must stop writers, back up and adopt the baseline before deployment. Development-only seeding is explicit and repeatable; reset requires deliberate confirmation. Compose storage survives container replacement; backup/restore also includes private attachment bytes and migration state. See [setup](setup.md) for commands and backup instructions and [demo](demo.md) for fictional fixtures.

Uploads are separate from report creation. The API decodes still JPEG/PNG/WebP with sharp, enforces 5 MiB and pixel limits, strips metadata by reencoding, writes private random filenames under a project-local directory and returns metadata only after database success. Ordinary rollback removes pending files; uncertain commit preserves them for retry resolution. A crash between filesystem and database operations can leave an orphan; no automated retention/orphan-reconciliation service is implemented.

UTC event instants are displayed in `Asia/Manila`. First-response and first-resolution fields derive from qualifying review events, with sample/pending/excluded counts and retained earlier resolution history. No-data duration is null. General collection reads currently load domain rows before pagination; this is a demonstration-scale implementation, not a measured large-deployment architecture. Rate limits are process-local. HTTPS deployment, real provider credentials, production retention/monitoring and real-water-safety content approval are deployment concerns.

Native MapLibre 11.5.0 is pinned with Expo 57 / React Native 0.86.3 configuration; Expo Go cannot run that native map. Actual signed standalone APKs run on KVM-backed Android29/36; [native evidence](native-verification.md) distinguishes each verified workflow and build. Expo57 uploads use FileSystem File bytes, and RN0.86 Android protected images use the array-source branch to retain authorization headers. Same-identity foreground resource refresh preserves mounted draft/upload state with explicit stale labels; identity changes and denied results clear it. Do not mark the release complete from source, typechecking or browser tests alone; consult the current [verification ledger](verification.md).

## Client organization and styling

Weather components live under each client's `features/weather/` and mount independently on Home/Overview. Express weather routes/controllers/services validate Open-Meteo data behind existing authentication, enforce customer connection ownership, and use bounded process-local caches. There is no weather persistence or domain automation. See [weather behavior and provider boundaries](weather.md).

Both clients group screens, feature-only components, hooks and request operations under `features/<domain>/`. Shared UI, hooks, HTTP transport, configuration and utilities stay outside those feature folders. The web `app/` contains bootstrap, routing and navigation. Expo `app/` contains route wrappers and navigator layouts only. Native styles are retained.

The supplier app uses Tailwind 4 through its Vite plugin. Utility classes replace application class selectors while original class markers remain available to browser checks. Shared element defaults, design tokens and semantic component styles live in the Tailwind entry stylesheet; Preflight is deliberately omitted. Leaflet vendor and map-specific styles live with the map feature. See [UI/UX design](ui-ux.md) for navigation and workflow presentation.

## Location architecture

The authenticated API loads the sibling bundled PSGC region index and caches its hierarchy. Both clients request catalog entries without bundling all barangays. Administrative selections provide names/codes; coordinate and service-zone confirmation remain separate.

See [locations and maps](location-and-maps.md) for the bundled PSGC catalog, guided/free-text address behavior, nullable snapshots, detailed basemap configuration, and verification boundaries.
