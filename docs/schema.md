# Database schema

Updated 20 October 2026 for the Prisma refactor. Source of truth: [Prisma schema](../aqours-api/prisma/schema.prisma), [legacy baseline](../aqours-api/prisma/migrations/0_legacy_baseline/migration.sql), and [domain migration](../aqours-api/prisma/migrations/202610200001_domain_models/migration.sql). Read [architecture](architecture.md), [requirements](requirements.md), [API contract](api.md) and [upgrade instructions](setup.md#adopting-prisma-on-an-existing-database) together.

## Typed domain models

| Models / tables | Responsibility |
| --- | --- |
| `Supplier`, `User`, `Zone` | Supplier context, individual accounts/roles, service zones and optional display boundaries |
| `ServiceConnection` | Customer-owned address, reference, confirmed zone and optional coordinates |
| `Report` | Owned connection, immutable issue-location snapshot, review/incident associations, priority and service metrics |
| `ReportMessage`, `Attachment` | Immutable customer communication and protected-image metadata; bytes remain private files |
| `Incident`, `IncidentPublication` | Mutable operational incident and separate immutable published updates |
| `Advisory`, `AdvisoryRevision` | Independent notice lifecycle and immutable revision/publication snapshots |
| `AssistanceRequest` | Owned report, service type, workflow, staff owner, appointment, outcome and first-work timestamp |
| `CallbackDetails`, `InspectionDetails`, `WaterSupportDetails` | One-to-one type-specific details; selected pickup session is an explicit foreign key |
| `PickupSite`, `PickupSession`, `StockSession`, `Allocation` | Pickup operations and exact reservation/collection ledger |
| `ApprovedGuidance`, `GuidanceRule`, `GuidanceEvaluation`, `GuidanceChoice` | Immutable supplier configuration, explained evaluations/evidence and customer choices |
| `SeedMarker` | Repeatable explicit fictional seed guard |

Domain models have UUID IDs, positive versions and separate storage creation/update timestamps. Workflow timestamps map to TIMESTAMPTZ columns. Incident, publication, advisory and pickup-session zone targeting use ordered junction rows; advisory connection targeting is also relational. Stored target positions preserve the existing source-signature ordering. JSONB remains for GeoJSON, immutable snapshots, questionnaire answers, evaluation cards/evidence, operation replay and audit metadata. Historical evaluations without evidence retain null rather than invented evidence.

The public API still exposes its original camel-case DTOs, including a nested `details` object for assistance and target ID arrays. Prisma entities are projected through application repositories/services; generated database types do not enter shared public contracts. Flexible internal workflow values remain a compatibility boundary, while stored fields are defined by generated model types.

## Identity, security and history

Ignored migration-only models retain the frozen archive and original ledger in Prisma schema comparisons; they are excluded from Prisma Client.

`entities(id,kind)` is a minimal identity registry for polymorphic event references. It contains no domain payload. Domain tables reference that identity; events target it and reference their actual actor in `users`.

Credentials remain salted scrypt hashes separate from profiles. Sessions retain hashed tokens, user, client kind, CSRF value, expiration and revocation. Operations retain `(actor_id,scope,key)`, fingerprint and committed JSONB response. Notifications retain recipient/source-event uniqueness and read timestamps. No account deletion or session purge behavior was added.

Composite foreign keys ensure reports use a connection belonging to their customer and assistance uses an owned report. Role checks and backend services enforce customer/staff boundaries. Unique constraints preserve email, connection reference, zone code, affected assertions, active assistance and allocation references. SQL triggers preserve immutable events/messages/attachments/publications/configuration/evaluations/choices and prevent allocation deletion or invalid ledger transitions. Publication targets cannot be changed or extended after their publication transaction. Assistance detail rows must match the parent request type.

Publication, report review, assistance and advisory lifecycles remain independent. Quality restrictions still require explicit lifting. Public projections omit private notes, credentials, unpublished state and other households' data. Customer authorization is enforced on the backend for individual records and files.

## Coordinates, time and stock

Reports, service connections and pickup sites use ordinary nullable DOUBLE PRECISION coordinates with paired-null/WGS84 constraints. Confirmed zones require a zone ID. Reports have a numeric viewport index. GPS accuracy stays nullable in meters; report and connection location snapshots remain separate. No PostGIS dependency is introduced.

TIMESTAMPTZ values preserve instants, and Prisma PostgreSQL connections explicitly use UTC. Clients continue displaying Asia/Manila. Immutable event metadata retains appointment changes; public history exposes only validated appointment times.

Stock and requested liters use NUMERIC(14,2). Repository calculations use Prisma Decimal, and DTOs return decimal strings. Session/request/allocation locks keep acceptance, cancellation and collection serialized. Database triggers reject overcommitment and stock reductions below commitments. Collection transfers reserved to collected once; cancellation releases only uncollected reservations.

```text
remaining = total - reserved - collected
```

## Migration and recovery

Fresh databases apply the historical baseline followed by the normalization migration through Prisma Migrate. Existing databases first verify the four original SQL migration checksums and mark the equivalent baseline applied. `_prisma_migrations` owns future migration state; the original `schema_migrations` ledger remains historical evidence.

Normalization runs in one transaction, preserves IDs/versions/timestamps and existing security/ledger rows, and validates domain row counts before commit. `legacy_records` retains the complete original JSONB data and rejects inserts, updates and deletes. `records` is a read-only compatibility view for historical inspection and verification; application queries use dedicated Prisma models. Unknown historical private test fields remain recoverable from the frozen archive.

Same-key retries retain their original response and reject changed content. Services pass transaction-scoped clients into repositories so domain changes, events, notifications and replay results commit together. An uncertain commit preserves attachment bytes for retry resolution; ordinary rollback removes pending files. Abrupt filesystem/database interruption can still leave orphan bytes; automated reconciliation remains unimplemented.

Backup includes the database, private attachments, Prisma schema/migrations/config and original migration files. Rollback after cutover requires the pre-upgrade backup and matching application version. See [setup](setup.md), [verification](verification.md) and [directory navigation](directory-structure.md).
