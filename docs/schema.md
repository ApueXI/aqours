# Database schema

Updated 19 October 2026. The original logical design was documented on 18 October before persistence existed. The first release now uses PostgreSQL with SQL migrations and `pg`; logical entities below are mostly JSONB records, not separate domain tables. Read [architecture](architecture.md), [requirements](requirements.md), [API contract](api.md), [setup](setup.md) and [verification](verification.md) together.

## Physical schema and migrations

Source of truth: [`001_initial.sql`](../aqours-api/migrations/001_initial.sql), [`002_stock_and_record_integrity.sql`](../aqours-api/migrations/002_stock_and_record_integrity.sql), [`003_location_and_ledger_checks.sql`](../aqours-api/migrations/003_location_and_ledger_checks.sql), [`004_typed_stock_sessions.sql`](../aqours-api/migrations/004_typed_stock_sessions.sql), and the migration runner in `aqours-api/src/migrate.ts`. Future migrations must preserve existing history and integrity requirements.

| Table | Implemented fields and responsibility |
| --- | --- |
| `records` | UUID primary key; `kind`, nullable relational `owner_id` and `parent_id`, positive integer `version`, JSONB `data`, `created_at` and `updated_at` TIMESTAMPTZ. Most domain objects live here. |
| `credentials` | One user reference and salted scrypt `password_hash`; separate from profile DTOs. |
| `sessions` | Token hash primary key, user FK, `web`/`mobile` client, CSRF value, expiry and revocation times. |
| `operations` | Primary key `(actor_id, scope, key)`; payload fingerprint and committed JSONB response. Keys are UUIDs scoped by authenticated actor, HTTP method and path. |
| `events` | UUID, target/actor FKs, action/text, previous/next status, private flag, TIMESTAMPTZ creation time and JSONB metadata. Updates/deletes are rejected. |
| `notifications` | UUID, recipient FK, stable `source_event_key`, JSONB customer-safe payload, creation/read times; unique recipient/event pair. |
| `stock_sessions` | Session record FK and exact `NUMERIC(14,2)` total liters. |
| `allocations` | UUID, unique request FK, stock-session FK, exact positive liters, unique pickup reference, reserved/collected/released state and event times. |
| `schema_migrations` | Applied SQL migration names, checksums and application times, maintained by the migration runner. |

`records.owner_id` and `parent_id` reference `records(id)`. Generated `connection_customer`, `report_customer`, `report_connection` and `assistance_customer` columns enable composite ownership foreign keys. Reports must reference a connection belonging to their owner; assistance must reference an owned report. A trigger also checks record-kind references, actual customer owners, operational staff owners, zone/connection targets and selected pickup sessions. These are relational constraints around a document store, not a fully normalized domain schema.

Generated `latitude` and `longitude` are ordinary stored `DOUBLE PRECISION` columns derived from JSONB for report/connection/site kinds. Constraints require both absent or both present within WGS84 ranges. Confirmed zones require a zone ID. The report viewport index covers numeric longitude/latitude; no PostGIS extension is used. GeoJSON boundaries remain validated JSONB display data.

## Logical records stored in `records`

| Kind | Relationships and principal data |
| --- | --- |
| `supplier` | Single fictional supplier context; no multi-tenant membership model. |
| `user` | Normalized unique email, name/phone, active state and `customer`/`staff`/`admin` role. Credentials are separate. |
| `zone` | Unique code, name and optional validated display boundary; explicit associations determine supply-zone applicability. |
| `connection` | Customer owner, unique reference, saved address, optional confirmed zone, coordinates and location provenance/review fields. |
| `report` | Customer owner and connection, category/details, noticed/submitted times, reference, status, issue-location snapshot, optional reviewed incident/zone, owner/priority, first response/resolution fields and reviewed closure outcome. |
| `message` | Parent report, author, text and creation time. Immutable customer-visible communication; private notes use events instead. |
| `attachment` | Parent report/customer owner, original safe filename, detected media type, size/time; private bytes keyed by UUID outside the database. |
| `incident` | Category/summary, owner, status, explicit zones, optional display boundary and affected-customer estimate/source. Current internal state is separate from published updates. |
| `incident_update` | Immutable published incident snapshot with progress, status, area, restoration instant or unknown, publication actor/time and demo label. |
| `advisory` | Kind, source, zones/connections, optional incident/display area, effective times, draft/published/lifted state and current published content/version. |
| `advisory_revision` | Immutable publication/lifting revision preserving content/source/context and actor/time. |
| `assistance` | Customer owner, parent report, optional incident context, service type/status, owner, appointment, outcome/next steps and type-specific JSONB `details`. |
| `site` | Supplier pickup address, optional coordinates, instructions, active/demo state. |
| `pickup_session` | Parent site, explicit served zones, operating interval, status, instructions, demo/version context; total stock lives in `stock_sessions`. |
| `approved_guidance` | Immutable supplier-approved source/text/kind/version used by notices and contextual support. |
| `rule` | Immutable versioned supported rule text/settings; arbitrary executable code is not accepted. |
| `guidance` | Owned report evaluation: answers, action cards/reasons, uncertainties, rule version, source evidence/signature and evaluation time. |
| `guidance_choice` | Immutable chosen service/decline and evaluation reference. Records a choice without submitting assistance. |
| `seed_marker` | Development dataset marker for repeatable nonautomatic seeding. |

Report JSONB snapshots also retain optional nonnegative GPS `accuracy` in meters; legacy/non-GPS projection is null. Alternate point confirmation and supply-zone confirmation are independent: an unknown zone remains reviewable even with confirmed coordinates. No migration rewrites prior location snapshots. Appointment scheduling events retain old/new UTC instants in immutable metadata; public timelines expose only validated `appointmentChange` times. Generated human-readable time labels are formatted on read, preserving stored text/history.

Type-specific callback question/contact/window, inspection issue/site/window/access, and water requested liters/session live in `assistance.data.details`. The earlier proposed one-to-one detail tables were not adopted. Likewise, zone/connection target arrays are validated JSONB references rather than separate junction tables. Histories and private notes use events, while immutable publications/rules/evaluations use record kinds. Public DTO names do not imply physical table names.

## Values, ownership and history

| Record | Required values and implemented enforcement |
| --- | --- |
| Report | `outage`, `low_pressure`, `leak`, `water_quality`; `received`, `under_review`, `in_progress`, `resolved`. Duplicate/invalid reviewed closures retain a separate reason/outcome and do not establish successful restoration. |
| Incident | `investigating`, `confirmed`, `work_in_progress`, `monitoring`, `resolved`; one current association on each report with immutable link-change events. |
| Advisory | `scheduled_interruption`, `boil_water`, `do_not_drink`, `do_not_use`, `general`; `draft`, `published`, `lifted`. Quality restrictions require explicit lifting. |
| Assistance | `callback`, `inspection`, `water_support`; `requested`, `accepted`, `scheduled`, `in_progress`, `completed`, `unavailable`, `cancelled`. Partial unique index prevents duplicate active customer/report/type requests. |
| Pickup session | `open`, `closed`, `cancelled`, valid start/end interval. Available/full/unavailable are computed using status, site, end time and remaining stock. |
| Allocation | `reserved`, `collected`, `released`; positive liters, valid event times and immutable request/session/quantity/reference after reservation. |

Database indexes also enforce email, connection reference, zone code and affected-assertion uniqueness. Mark-affected assertions deduplicate customer/connection/incident participation without merging reports. Database triggers reject changes to immutable domain history including messages, attachments, publications, guidance evaluations/choices, approved guidance and rule versions. Events retain actor/time/reason and relevant before/after metadata. Account deactivation retains referenced history; no destructive customer-facing deletion workflow is implemented.

API authorization remains necessary even with these constraints. All customer reads/mutations scope to their authenticated identity; protected attachment reads derive access through the report. Customer response projections omit internal notes, credentials, unpublished incident state and other households' coordinates/contact details. Backend guards enforce the adopted role matrix in [requirements](requirements.md).

Domain event instants inside JSONB are validated ISO UTC strings; physical event/session/notification/ledger timestamps use TIMESTAMPTZ. Clients display `Asia/Manila`. Saved connection edits do not move historical report or inspection addresses. GeoJSON point order is `[longitude, latitude]`; unknown coordinates stay null rather than fabricated values.

## Transactions and retries

Authenticated mutations use a transaction, scoped UUID operation key and body fingerprint unless explicitly documented otherwise in [API contract](api.md). An advisory transaction lock serializes replay of the same key; matching retries return the committed result and mismatched payload reuse returns conflict. A version field plus required `expectedVersion` prevents stale writes. Report creation, publications, assistance and stock operations commit their history/required notification rows together. Notification uniqueness prevents fan-out duplicates when audiences overlap.

Guidance evaluation intentionally creates a new historical evaluation each time; read-state updates are naturally idempotent. Authentication has its own session rules. Refer to the contract for route-specific exceptions. A connection loss during COMMIT returns `commit_uncertain`; the client must retry the same operation key instead of assuming rollback. Operations currently have no automated expiration/purge policy.

## Stock ledger protocol

All quantities use liters, exact SQL arithmetic and decimal string responses with up to two fractional digits. Totals and allocations are bounded by one billion liters. Binary floating-point arithmetic is not used to determine available stock.

```text
remaining liters = total liters - reserved liters - collected liters
```

Acceptance locks the session record/stock row before request/allocation records, validates the report's confirmed zone and current session eligibility, then checks remaining stock and reserves the quantity. It assigns an owner and creates a pickup reference/history/notification atomically. Database stock-commitment triggers provide an additional aggregate guard.

Collection permits only an eligible reserved allocation and completes water assistance through the collection endpoint. It changes reserved to collected once; remaining stock is unchanged by that conversion. A replay returns its earlier result; another collection attempt conflicts. Customer cancellation before work/collection releases a reservation once. Session cancellation serializes against allocation work, releases active uncollected reservations, marks affected requests unavailable with a reason/support follow-up and notifies customers. Collected outcomes remain unchanged. Corrections cannot lower total below reserved plus collected; ledger deletion is rejected.

## Private files, fixtures and limits

Attachment bytes are private project-local files, with metadata in immutable attachment records. The API decodes/reencodes allowed still images, validates size/pixels, removes pending files on ordinary transaction failure and protects downloads with session/report authorization. Filesystem writes cannot share PostgreSQL atomicity: an abrupt crash or uncertain commit may leave an orphan. Backup/restore must include bytes as well as database/migration state; see [setup](setup.md).

The development seed implements one supplier, three zones, twelve fictional customer connections/accounts, four-category incidents/reports, two pickup sites, available/full/cancelled session examples, assistance examples and unknown/still-affected contexts. Demo notices, estimates and availability must remain visibly fictional. Seed/reset is explicit; normal startup does not reset records. [Demo instructions](demo.md) describe scenario execution; [verification](verification.md) records actual results.

Billing/payments, commerce orders, home delivery/fleet/routing, multi-supplier tenancy, IoT, automated water-safety diagnosis, external notification channels and AI infrastructure are outside this release. Academic acceptance and live provider checks remain external verification gates; individually executed native workflows are recorded in the native ledger. Production retention/redaction, orphan reconciliation, high-volume pagination/query tuning and operational monitoring are not implemented services.
