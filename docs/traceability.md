# Requirement and acceptance traceability

## Supplemental weather feature — 21 October 2026

The original requirement/criterion/test-key inventory below is preserved. [Weather](weather.md) is an additional owner-approved feature, covered by six named weather cases in [normalization/cache tests](../aqours-api/test/weather.test.ts) and [provider tests](../aqours-api/test/weather-provider.test.ts), three real authenticated HTTP/PostgreSQL scenarios in [weather-http.ts](../verification/weather-http.ts), and eight Chromium scenarios in [browser-weather.ts](../verification/browser-weather.ts). Live provider and installed Android evidence is separately scoped in [verification](verification.md) and the [native ledger](native-verification.md).

The 22 October supplier revision keeps those eight weather scenarios on the dedicated `/#/weather` page and adds navigation/history/account-clearing checks. [Leaflet browser checks](../verification/browser-map.ts) now also verify all four category colors/legend labels and priority-independent colors after refresh; [supplier UX checks](../verification/browser-ux.ts) include Weather at all three viewport widths. Original requirement and acceptance identifiers are unchanged.

Updated 20 October 2026. This is an evidence map, not a blanket acceptance certificate. It preserves all **84 REQ identifiers**, **126 original feature acceptance identifiers** and **ten DEMO scenarios**. Their authoritative wording remains in [requirements](requirements.md) and the sixteen linked specifications. Original unchecked boxes remain unchanged.

Source implementation, API assertions, browser interaction and actual Android behavior are separate evidence. The named tests below exist and are executable; their latest run/result belongs in [verification](verification.md), not this inventory. A reference proves only its actual assertions, not every phrase in the associated criterion. Client unit tests exercise helpers; typecheck/lint/build never certify individual UI criteria. The HTTP context and database error-redaction regressions are included in final verification; consult the run ledger for their outcomes.

“Pending” identifies a required missing check. Actual KVM-backed Android workflows now have individually scoped evidence in the [native ledger](native-verification.md), including artifact hashes and real defects/fixes. Live Geoapify still requires private operator configuration; academic acceptance remains externally unverified. Build and helper checks are not substitutes for native interaction. See [setup](setup.md), [demo walkthrough](demo.md), [API contract](api.md) and [Android guide](../aqours-app/README.md).

## Implementation module key

Each module key in a row resolves to these real files; it is not a hypothetical route/table name.

| Key | Implemented modules |
| --- | --- |
| AUTH | [aqours-api/src/middleware/authentication.ts](../aqours-api/src/middleware/authentication.ts); [aqours-api/src/routes/auth.ts](../aqours-api/src/routes/auth.ts); [aqours-web/src/features/auth/hooks/useSession.ts](../aqours-web/src/features/auth/hooks/useSession.ts); [aqours-app/src/features/auth/hooks/session.tsx](../aqours-app/src/features/auth/hooks/session.tsx) |
| REPORT | [aqours-api/src/routes/reports.ts](../aqours-api/src/routes/reports.ts); [aqours-api/src/routes/report-review.ts](../aqours-api/src/routes/report-review.ts); [aqours-api/src/services/reports/report-context.service.ts](../aqours-api/src/services/reports/report-context.service.ts); [aqours-web/src/features/reports/screens/ReportDetail.tsx](../aqours-web/src/features/reports/screens/ReportDetail.tsx); [aqours-app/src/features/reports/screens/report-form.tsx](../aqours-app/src/features/reports/screens/report-form.tsx) |
| FILE | [aqours-api/src/routes/attachments.ts](../aqours-api/src/routes/attachments.ts); [aqours-app/src/features/reports/components/photos.tsx](../aqours-app/src/features/reports/components/photos.tsx); [aqours-web/src/components/AttachmentViewer.tsx](../aqours-web/src/components/AttachmentViewer.tsx) |
| LOCATION | [aqours-api/src/services/location/geocode.service.ts](../aqours-api/src/services/location/geocode.service.ts); [aqours-app/src/features/location/components/location-picker.tsx](../aqours-app/src/features/location/components/location-picker.tsx); [aqours-app/src/features/location/components/map-preview.native.tsx](../aqours-app/src/features/location/components/map-preview.native.tsx) |
| MAP | [aqours-api/src/routes/analytics.ts](../aqours-api/src/routes/analytics.ts); [aqours-web/src/features/map/screens/MapPage.tsx](../aqours-web/src/features/map/screens/MapPage.tsx); [aqours-web/src/features/map/components/MapCanvas.tsx](../aqours-web/src/features/map/components/MapCanvas.tsx); [aqours-web/src/features/map/utils/layers.ts](../aqours-web/src/features/map/utils/layers.ts) |
| INCIDENT | [aqours-api/src/routes/incidents.ts](../aqours-api/src/routes/incidents.ts); [aqours-api/src/routes/incident-publication.ts](../aqours-api/src/routes/incident-publication.ts); [aqours-web/src/features/incidents/screens/IncidentDetail.tsx](../aqours-web/src/features/incidents/screens/IncidentDetail.tsx); [aqours-app/src/features/home/screens/incident-screen.tsx](../aqours-app/src/features/home/screens/incident-screen.tsx) |
| NOTICE | [aqours-api/src/routes/advisories.ts](../aqours-api/src/routes/advisories.ts); [aqours-api/src/services/advisories/advisory-context.service.ts](../aqours-api/src/services/advisories/advisory-context.service.ts); [aqours-web/src/features/advisories/screens/Advisories.tsx](../aqours-web/src/features/advisories/screens/Advisories.tsx); [aqours-web/src/features/advisories/components/AdvisoryEditor.tsx](../aqours-web/src/features/advisories/components/AdvisoryEditor.tsx) |
| GUIDE | [aqours-api/src/services/guidance/evaluation.service.ts](../aqours-api/src/services/guidance/evaluation.service.ts); [aqours-api/src/services/guidance/context.service.ts](../aqours-api/src/services/guidance/context.service.ts); [aqours-api/src/routes/guidance.ts](../aqours-api/src/routes/guidance.ts); [aqours-app/src/features/guidance/screens/guidance-screen.tsx](../aqours-app/src/features/guidance/screens/guidance-screen.tsx); [aqours-app/src/features/guidance/hooks/use-guidance.ts](../aqours-app/src/features/guidance/hooks/use-guidance.ts) |
| ASSIST | [aqours-api/src/routes/assistance.ts](../aqours-api/src/routes/assistance.ts); [aqours-api/src/routes/assistance-workflow.ts](../aqours-api/src/routes/assistance-workflow.ts); [aqours-web/src/features/assistance/screens/AssistanceDetail.tsx](../aqours-web/src/features/assistance/screens/AssistanceDetail.tsx); [aqours-web/src/features/assistance/components/AssistanceActions.tsx](../aqours-web/src/features/assistance/components/AssistanceActions.tsx); [aqours-app/src/features/assistance/screens/assistance-detail.tsx](../aqours-app/src/features/assistance/screens/assistance-detail.tsx) |
| STOCK | [aqours-api/src/services/distribution/stock.service.ts](../aqours-api/src/services/distribution/stock.service.ts); [aqours-api/src/routes/distribution.ts](../aqours-api/src/routes/distribution.ts); [aqours-api/src/routes/collection.ts](../aqours-api/src/routes/collection.ts); [aqours-web/src/features/distribution/screens/Distribution.tsx](../aqours-web/src/features/distribution/screens/Distribution.tsx); [aqours-app/src/features/assistance/components/pickup-options.tsx](../aqours-app/src/features/assistance/components/pickup-options.tsx) |
| SET | [aqours-api/src/routes/settings.ts](../aqours-api/src/routes/settings.ts); [aqours-api/src/routes/settings-accounts.ts](../aqours-api/src/routes/settings-accounts.ts); [aqours-api/src/routes/settings-connections.ts](../aqours-api/src/routes/settings-connections.ts); [aqours-web/src/features/settings/screens/Settings.tsx](../aqours-web/src/features/settings/screens/Settings.tsx) |
| HOME | [aqours-app/src/features/home/screens/home-screen.tsx](../aqours-app/src/features/home/screens/home-screen.tsx); [aqours-app/src/app/(customer)/profile.tsx](../aqours-app/src/app/%28customer%29/%28tabs%29/profile.tsx); [aqours-app/src/features/notifications/screens/notifications-screen.tsx](../aqours-app/src/features/notifications/screens/notifications-screen.tsx); [aqours-app/src/hooks/use-resource.ts](../aqours-app/src/hooks/use-resource.ts) |
| METRIC | [aqours-api/src/routes/analytics.ts](../aqours-api/src/routes/analytics.ts); [aqours-api/src/services/analytics/metrics.service.ts](../aqours-api/src/services/analytics/metrics.service.ts); [aqours-web/src/features/overview/screens/Overview.tsx](../aqours-web/src/features/overview/screens/Overview.tsx) |
| DATA | [Prisma schema](../aqours-api/prisma/schema.prisma); [normalization migration](../aqours-api/prisma/migrations/202610200001_domain_models/migration.sql); [aqours-api/migrations/001_initial.sql](../aqours-api/migrations/001_initial.sql); [aqours-api/migrations/002_stock_and_record_integrity.sql](../aqours-api/migrations/002_stock_and_record_integrity.sql); [aqours-api/migrations/003_location_and_ledger_checks.sql](../aqours-api/migrations/003_location_and_ledger_checks.sql); [aqours-api/migrations/004_typed_stock_sessions.sql](../aqours-api/migrations/004_typed_stock_sessions.sql); [aqours-api/src/repositories/domain.repository.ts](../aqours-api/src/repositories/domain.repository.ts); [aqours-api/src/config/database.ts](../aqours-api/src/config/database.ts) |
| HTTP | [aqours-api/src/middleware/endpoint.ts](../aqours-api/src/middleware/endpoint.ts); [aqours-api/src/validators/common.ts](../aqours-api/src/validators/common.ts); [aqours-api/src/app.ts](../aqours-api/src/app.ts); [aqours-api/src/services/presentation/projection.ts](../aqours-api/src/services/presentation/projection.ts); [aqours-contracts/src/index.ts](../aqours-contracts/src/index.ts) |
| SEED | [aqours-api/src/scripts/seed.ts](../aqours-api/src/scripts/seed.ts); [aqours-api/src/scripts/seed-identities.ts](../aqours-api/src/scripts/seed-identities.ts); [aqours-api/src/scripts/seed-operations.ts](../aqours-api/src/scripts/seed-operations.ts); [aqours-api/src/scripts/seed-services.ts](../aqours-api/src/scripts/seed-services.ts) |
| OPS | [compose.yaml](../compose.yaml); [scripts/backup.sh](../scripts/backup.sh); [scripts/restore.sh](../scripts/restore.sh); [aqours-api/src/scripts/migrate.ts](../aqours-api/src/scripts/migrate.ts); [aqours-app/app.config.ts](../aqours-app/app.config.ts); [aqours-app/eas.json](../aqours-app/eas.json) |

## Exact executable test key

Run HTTP tests with the isolated database/API setup in [setup](setup.md): root `npm run test:api`. `H-*` are real HTTP/database tests; `U-*` run with `npm --prefix aqours-api test`, `W-*` with `npm --prefix aqours-web test`, and `C-*` with `npm --prefix aqours-app test`. Numeric ranges below mean each named test in the range. The test catalog names are exact source titles.

| Key | Test source | Exact test name |
| --- | --- | --- |
| H-S1 | [verification/security.test.ts](../verification/security.test.ts) | DEMO-006: owner guards cover reports, messages, files, guidance, notifications and assistance |
| H-S2 | [verification/security.test.ts](../verification/security.test.ts) | revocable sessions: logout replay and revoked bearer cannot access private data |
| H-S3 | [verification/security.test.ts](../verification/security.test.ts) | browser cookie requires CSRF and exact origin; customer cannot enter supplier session |
| H-S4 | [verification/security.test.ts](../verification/security.test.ts) | controlled images validate contents, authenticate downloads and replay upload retry |
| H-S5 | [verification/security.test.ts](../verification/security.test.ts) | profile and connection lookups derive identity; alternate report leaves saved address unchanged |
| H-R1 | [verification/reports-incidents.test.ts](../verification/reports-incidents.test.ts) | DEMO-001/010: concurrent same-key report submissions commit one result and reject changed payload |
| H-R2 | [verification/reports-incidents.test.ts](../verification/reports-incidents.test.ts) | DEMO-002/005: shared incident links, publication dedupe, private snapshots and individual follow-up |
| H-R3 | [verification/reports-incidents.test.ts](../verification/reports-incidents.test.ts) | review operations require reasons, prevent stale overwrite, separate clarification and staff notes |
| H-R4 | [verification/reports-incidents.test.ts](../verification/reports-incidents.test.ts) | map queries enforce bounds, cap disclosure and persisted point ordering without invented coordinates |
| H-G1 | [verification/advisories-guidance.test.ts](../verification/advisories-guidance.test.ts) | DEMO-004: quality restrictions are distinct, independently published and persist past end or outage resolution |
| H-G2 | [verification/advisories-guidance.test.ts](../verification/advisories-guidance.test.ts) | area notice audiences need no report and publication/lift/read retries never duplicate notifications |
| H-G3 | [verification/advisories-guidance.test.ts](../verification/advisories-guidance.test.ts) | DEMO-003: rules retain evidence, apply safety precedence and choices never create assistance |
| H-G4 | [verification/advisories-guidance.test.ts](../verification/advisories-guidance.test.ts) | guidance source revisions invalidate history and current evaluation includes the latest source |
| H-G5 | [verification/advisories-guidance.test.ts](../verification/advisories-guidance.test.ts) | unconfirmed zones remain uncertain, failed/missing geocoder configuration returns honest error |
| H-G6 | [verification/advisories-guidance.test.ts](../verification/advisories-guidance.test.ts) | scheduled interruptions respect their published time window without ending independent quality restrictions |
| H-A1 | [verification/assistance-admin.test.ts](../verification/assistance-admin.test.ts) | DEMO-008: callback and inspection lifecycles retain details, appointments, outcomes and independent report status |
| H-A2 | [verification/assistance-admin.test.ts](../verification/assistance-admin.test.ts) | immediate support needs reason; unavailable/reschedule/cancel preserve coherent timeline |
| H-A3 | [verification/assistance-admin.test.ts](../verification/assistance-admin.test.ts) | administration validates roles/login uniqueness, revokes deactivated sessions and retains ownership |
| H-A4 | [verification/assistance-admin.test.ts](../verification/assistance-admin.test.ts) | reviewed zone changes are audited and never move historical report snapshots |
| H-A5 | [verification/assistance-admin.test.ts](../verification/assistance-admin.test.ts) | metric events exclude internal notes and reviewed invalid/duplicate closures and preserve prior resolution |
| H-D7 | [verification/database.test.ts](../verification/database.test.ts) | database command failures never expose a private connection URL in reported errors |
| H-D1 | [verification/database.test.ts](../verification/database.test.ts) | stock acceptance rollback preserves request, allocation, history, notification and operation atomicity |
| H-D2 | [verification/database.test.ts](../verification/database.test.ts) | publication failure rolls back both incident update and all notification work; same key then succeeds |
| H-D3 | [verification/database.test.ts](../verification/database.test.ts) | expired database sessions are denied and no-cookie hostile browser logout is rejected |
| H-D4 | [verification/database.test.ts](../verification/database.test.ts) | null zone review and invalid filters cannot silently become confirmed or valid empty results |
| H-D5 | [verification/database.test.ts](../verification/database.test.ts) | historic genuine resolution and later reviewed closure form disjoint metric cohorts |
| H-D6 | [verification/database.test.ts](../verification/database.test.ts) | inactive draft targets cannot publish and guidance evidence remains immutable and private |
| H-W1 | [verification/stock.test.ts](../verification/stock.test.ts) | DEMO-009: concurrent 80-liter approvals against 100 liters accept at most one |
| H-W2 | [verification/stock.test.ts](../verification/stock.test.ts) | 60+40 liters: collect once transfers ledger, cancellation releases only reserved stock |
| H-W3 | [verification/stock.test.ts](../verification/stock.test.ts) | exact decimals and stock edits cannot reduce below existing commitments |
| H-W4 | [verification/stock.test.ts](../verification/stock.test.ts) | request cancellation races with collection without double release or collection |
| H-W5 | [verification/stock.test.ts](../verification/stock.test.ts) | session cancellation handles accepted and pending requests, preserves collected history and dedupes retries |
| H-W6 | [verification/stock.test.ts](../verification/stock.test.ts) | session-cancel versus acceptance serializes and never leaves a live reservation in cancelled session |
| H-C1 | [verification/context.test.ts](../verification/context.test.ts) | pickup options use the owned report zone across multiple connections and reviewed alternate locations |
| H-C2 | [verification/context.test.ts](../verification/context.test.ts) | category-specific report details reach both customer and staff review without arbitrary answer projection |
| H-C3 | [verification/context.test.ts](../verification/context.test.ts) | confirmed GPS retains measured accuracy and requires separate supplier zone review |
| H-I1 | [verification/acceptance-incidents.test.ts](../verification/acceptance-incidents.test.ts) | concurrent and repeated affected assertions reuse one owned report without merging independent reports |
| H-I2 | [verification/acceptance-incidents.test.ts](../verification/acceptance-incidents.test.ts) | simultaneous corrective incident links have one version winner and preserve exact old/new history |
| H-I3 | [verification/acceptance-incidents.test.ts](../verification/acceptance-incidents.test.ts) | two reports at one connection stay separate from unique connections and independent affected estimates |
| H-N1 | [verification/acceptance-advisories.test.ts](../verification/acceptance-advisories.test.ts) | a report-free zone-only audience with two matching connections receives one persisted publication notification |
| H-N2 | [verification/acceptance-advisories.test.ts](../verification/acceptance-advisories.test.ts) | advisory fan-out failure rolls back state, revisions, events, operation and notifications before same-key recovery |
| H-L1 | [verification/acceptance-allocation-access.test.ts](../verification/acceptance-allocation-access.test.ts) | customers cannot collect allocations and tampered allocation IDs cannot complete another request |
| H-Q1 | [verification/guidance-rules-decisions.test.ts](../verification/guidance-rules-decisions.test.ts) | known-outage decision table distinguishes unknown, earlier/later water need, no need and unavailable stock |
| H-Q2 | [verification/guidance-rules-decisions.test.ts](../verification/guidance-rules-decisions.test.ts) | low pressure, leak hazards and post-resolution persistence lead to assessment without automatic report changes |
| H-Q3 | [verification/guidance-rules-decisions.test.ts](../verification/guidance-rules-decisions.test.ts) | conflicting published quality restrictions retain all notices in precedence order alongside escalation |
| H-F1 | [verification/guidance-rules-freshness.test.ts](../verification/guidance-rules-freshness.test.ts) | incident publication, advisory revision/lift and stock changes invalidate immutable guidance; stale choices never submit assistance |
| H-F2 | [verification/guidance-rules-freshness.test.ts](../verification/guidance-rules-freshness.test.ts) | reservation and release change stock evidence without changing earlier guidance or claiming fulfillment |
| H-E1 | [verification/acceptance-workflow-edges.test.ts](../verification/acceptance-workflow-edges.test.ts) | unsupported and terminal assistance transitions preserve history while later same-type requests remain legitimate |
| H-E2 | [verification/acceptance-workflow-edges.test.ts](../verification/acceptance-workflow-edges.test.ts) | customer cancellation racing first work start commits one transition and one notification |
| H-E3 | [verification/acceptance-workflow-edges.test.ts](../verification/acceptance-workflow-edges.test.ts) | session cancellation racing collection retains exactly one irreversible allocation outcome |
| H-M1 | [verification/acceptance-metrics.test.ts](../verification/acceptance-metrics.test.ts) | dashboard exact cohorts separate unresolved categories, pending responses, reviewed closures and historic resolutions |
| H-P1 | [verification/acceptance-permissions.test.ts](../verification/acceptance-permissions.test.ts) | all 49 documented supplier endpoints reject unauthenticated and customer callers before data or commands |
| H-P2 | [verification/acceptance-permissions.test.ts](../verification/acceptance-permissions.test.ts) | staff can read all 18 operational endpoints but cannot use any of 12 admin writes or 3 private settings reads |
| H-P3 | [verification/acceptance-permissions.test.ts](../verification/acceptance-permissions.test.ts) | isolated production auth emits secure cookies, generic invalid credentials and exact throttling without affecting main API |
| H-V1 | [verification/acceptance-privacy.test.ts](../verification/acceptance-privacy.test.ts) | public incident, advisory and owned-report projections exclude private sentinels and retain exact publication revision/lift audit |
| H-V2 | [verification/acceptance-privacy.test.ts](../verification/acceptance-privacy.test.ts) | individual still-affected preserves a resolved incident, another resolved report, expired-date quality restriction and completed assistance |
| U-S1 | [aqours-api/test/security.test.ts](../aqours-api/test/security.test.ts) | scrypt uses independent salts and rejects incorrect credentials |
| U-S2 | [aqours-api/test/security.test.ts](../aqours-api/test/security.test.ts) | coordinates reject half-pairs, nonfinite values and range errors |
| U-S3 | [aqours-api/test/security.test.ts](../aqours-api/test/security.test.ts) | exact-liter inputs reject exponents, excess scale, negatives and over-limit stock |
| U-S4 | [aqours-api/test/security.test.ts](../aqours-api/test/security.test.ts) | geometry requires WGS84 closed polygon rings |
| U-S5 | [aqours-api/test/security.test.ts](../aqours-api/test/security.test.ts) | optimistic versions reject stale state and missing versions |
| U-S6 | [aqours-api/test/security.test.ts](../aqours-api/test/security.test.ts) | quality notices require explicit lifting and zone matching requires confirmation |
| U-T1 | [aqours-api/test/transactions-metrics.test.ts](../aqours-api/test/transactions-metrics.test.ts) | prior substantive resolution remains sampled after reopening and reviewed duplicate closure |
| U-T2 | [aqours-api/test/transactions-metrics.test.ts](../aqours-api/test/transactions-metrics.test.ts) | filter parsing rejects invalid enum values and malformed UUIDs across list and map reads |
| U-T3 | [aqours-api/test/transactions-metrics.test.ts](../aqours-api/test/transactions-metrics.test.ts) | public projections suppress future internal fields, questionnaire evidence and first-work markers |
| U-T4 | [aqours-api/test/transactions-metrics.test.ts](../aqours-api/test/transactions-metrics.test.ts) | transaction outcomes distinguish known rollback from lost COMMIT acknowledgment |
| U-T5 | [aqours-api/test/timeline.test.ts](../aqours-api/test/timeline.test.ts) | public appointment history preserves agreed times without exposing arbitrary audit metadata |
| U-T6 | [aqours-api/test/presentation.test.ts](../aqours-api/test/presentation.test.ts) | generated appointment and restoration text uses Manila time while retaining immutable UTC records |
| U-G1 | [aqours-api/test/geocode.test.ts](../aqours-api/test/geocode.test.ts) | disabled geocoder fails honestly and candidates bind address, point and expiry |
| U-G2 | [aqours-api/test/geocode.test.ts](../aqours-api/test/geocode.test.ts) | provider adapter preserves real confidence/coordinates and converts transport failures to503 |
| U-O1 | [aqours-api/test/operation-fingerprint.test.ts](../aqours-api/test/operation-fingerprint.test.ts) | account operation retries match while changed passwords and operation scopes differ |
| U-O2 | [aqours-api/test/operation-fingerprint.test.ts](../aqours-api/test/operation-fingerprint.test.ts) | persisted password fingerprints require scrypt and cannot match fast request digests |
| U-V1 | [aqours-api/test/advisory-validation.test.ts](../aqours-api/test/advisory-validation.test.ts) | publication rechecks current administrator and session while holding the user lock |
| U-V2 | [aqours-api/test/advisory-validation.test.ts](../aqours-api/test/advisory-validation.test.ts) | publication locks current targets and rejects a zone deactivated after draft creation |
| W-C1 | [aqours-web/tests/client.test.ts](../aqours-web/tests/client.test.ts) | cookie mutations send CSRF and freeze key/body across uncertain transport retry |
| W-C2 | [aqours-web/tests/client.test.ts](../aqours-web/tests/client.test.ts) | a known version conflict clears the old intention for reviewed resubmission |
| W-C3 | [aqours-web/tests/client.test.ts](../aqours-web/tests/client.test.ts) | server failure retains operation identity and never returns a fake success |
| W-C4 | [aqours-web/tests/client.test.ts](../aqours-web/tests/client.test.ts) | unauthorized responses immediately broadcast session revocation |
| W-C5 | [aqours-web/tests/client.test.ts](../aqours-web/tests/client.test.ts) | unreadable success remains uncertain for safe same-key recovery |
| W-C6 | [aqours-web/tests/client.test.ts](../aqours-web/tests/client.test.ts) | filters omit missing values, preserve zero, and escape text |
| W-C7 | [aqours-web/tests/client.test.ts](../aqours-web/tests/client.test.ts) | malformed JSON success envelopes preserve the original mutation for recovery |
| W-F1 | [aqours-web/tests/forms.test.ts](../aqours-web/tests/forms.test.ts) | exact liter amounts remain strings and missing optional coordinates remain null |
| W-F2 | [aqours-web/tests/forms.test.ts](../aqours-web/tests/forms.test.ts) | Manila appointment input becomes the intended UTC instant |
| W-F3 | [aqours-web/tests/forms.test.ts](../aqours-web/tests/forms.test.ts) | multi-targets, boolean review, optional empty fields and unknown estimates retain their meaning |
| W-F4 | [aqours-web/tests/forms.test.ts](../aqours-web/tests/forms.test.ts) | invalid polygon JSON is rejected before any mutation can be created |
| W-F5 | [aqours-web/tests/forms.test.ts](../aqours-web/tests/forms.test.ts) | water completion is offered only through the dedicated collection action |
| W-M1 | [aqours-web/tests/map.test.ts](../aqours-web/tests/map.test.ts) | map areas use published snapshots, exclude drafts, and preserve explicit quality restrictions after end time |
| W-P1 | [aqours-web/tests/pagination.test.ts](../aqours-web/tests/pagination.test.ts) | reference selectors and pickup lookup retrieve every page instead of silently truncating records |
| W-P2 | [aqours-web/tests/pagination.test.ts](../aqours-web/tests/pagination.test.ts) | a failed subsequent page never produces a partial successful lookup |
| C-B1 | [aqours-app/tests/customer-boundaries.test.cjs](../aqours-app/tests/customer-boundaries.test.cjs) | mobile API uses bearer header, envelope, and stable operation key without URL credentials |
| C-B2 | [aqours-app/tests/customer-boundaries.test.cjs](../aqours-app/tests/customer-boundaries.test.cjs) | network failure and invalid success body remain uncertain, never synthetic success |
| C-B3 | [aqours-app/tests/customer-boundaries.test.cjs](../aqours-app/tests/customer-boundaries.test.cjs) | ownership and stale version errors retain server status and safe explanation |
| C-B4 | [aqours-app/tests/customer-boundaries.test.cjs](../aqours-app/tests/customer-boundaries.test.cjs) | multipart uploads leave boundary header to fetch and retain the file body |
| C-B5 | [aqours-app/tests/customer-boundaries.test.cjs](../aqours-app/tests/customer-boundaries.test.cjs) | uncertain report retry preserves exact intention across route remounts |
| C-B6 | [aqours-app/tests/customer-boundaries.test.cjs](../aqours-app/tests/customer-boundaries.test.cjs) | intention isolation covers customers, action paths, payload versions, and cleared sessions |
| C-B7 | [aqours-app/tests/customer-boundaries.test.cjs](../aqours-app/tests/customer-boundaries.test.cjs) | photo retries preserve original multipart body independently of report creation |
| C-B8 | [aqours-app/tests/customer-boundaries.test.cjs](../aqours-app/tests/customer-boundaries.test.cjs) | observed times use Manila and reject normalized invalid dates |
| C-P1 | [aqours-app/tests/pagination.test.cjs](../aqours-app/tests/pagination.test.cjs) | home obtains an older active restriction and incident beyond the first hundred records |
| C-P2 | [aqours-app/tests/pagination.test.cjs](../aqours-app/tests/pagination.test.cjs) | failed or incomplete later pages never become a partial successful home list |
| C-U1 | [aqours-app/tests/photo-upload.test.cjs](../aqours-app/tests/photo-upload.test.cjs) | installed Expo 57 converter rejects the previous React Native URI descriptor |
| C-U2 | [aqours-app/tests/photo-upload.test.cjs](../aqours-app/tests/photo-upload.test.cjs) | production photo builder passes file bytes, name and type through installed Expo multipart conversion |
| C-U3 | [aqours-app/tests/photo-upload.test.cjs](../aqours-app/tests/photo-upload.test.cjs) | uncertain photo retry retains its original file body and key with repeatable Expo multipart bytes |
| C-U4 | [aqours-app/tests/photo-upload.test.cjs](../aqours-app/tests/photo-upload.test.cjs) | native file preparation failure is raised before an upload body is returned |
| C-I1 | [aqours-app/tests/protected-image.test.cjs](../aqours-app/tests/protected-image.test.cjs) | installed RN Android object-image branch drops the old source authorization header |
| C-I2 | [aqours-app/tests/protected-image.test.cjs](../aqours-app/tests/protected-image.test.cjs) | protected image builder forwards credentials and reload policy through installed RN Android image branch |
| C-I3 | [aqours-app/tests/protected-image.test.cjs](../aqours-app/tests/protected-image.test.cjs) | missing mobile session never creates a literal null bearer credential for an image |
| C-N1 | [aqours-app/tests/notice-context.test.cjs](../aqours-app/tests/notice-context.test.cjs) | advisory context identifies only owned explicit or confirmed-zone connections without duplicates |

### Browser and operational checks

`B*` are explicit checks in [`verification/browser.ts`](../verification/browser.ts), run with root `npm run test:browser` against live API/web services and Chromium. Page rendering does not establish that every form was submitted.

| Key | Exact checked behavior |
| --- | --- |
| B1 | “Supplier cookie login opens overview with live metrics” |
| B2 | “Staff clarification persists and appears in customer-owned report” |
| B3 | “Review form sends versioned priority/status command successfully” |
| B4 | Named “renders connected records without runtime error” checks for Report inbox, Incidents, Official advisories, Assistance queue, Water distribution, Settings and audit |
| B5 | “Map tile failure leaves live report list and navigation usable” |
| B6 | “Browser reload restores valid supplier session” |
| B7 | “Narrow viewport preserves navigation and report table access” |
| B8 | “Browser logout revokes session and reload remains signed out” |
| B9 | “No uncaught browser exceptions” |
| O1 | Operator persistence check: migrations/seed, retain counts, `docker compose up -d --force-recreate db`, reconnect and compare counts. Executed evidence is in [verification](verification.md); this is not a unit-test title. |
| O3 | Actual dual-architecture debug and standalone release APK builds, signature/manifest/library/bundle inspection; see [verification](verification.md). |
| O4 | `npm run test:seed` runs [verification/seed.ts](../verification/seed.ts): read-only checks for all 14 fixture credentials/roles,12 owned connections,3 zones/2 sites, four report categories, unlocated/still-affected context and exact available/full/cancelled stock. This is not an all-account native login claim. |
| O2 | Operator backup/restore check using [`backup.sh`](../scripts/backup.sh)/[`restore.sh`](../scripts/restore.sh): restore into a separate empty target, compare application/migration counts and SHA-256 of two restored image files. Results belong in [verification](verification.md). |

### Expanded browser workflow checks

All nine expanded checks passed in the completed 23-check Chromium run. The following are executable assertions in [`verification/browser-workflows.ts`](../verification/browser-workflows.ts), called by the browser script. Check [verification](verification.md) for the latest actual run. These checks cover supplier writes and customer API results, not actual Android interaction.

| Key | Exact checked behavior |
| --- | --- |
| BW1 | “Callback acceptance assigns a staff owner through the browser” |
| BW2 | “Browser scheduling and reasoned rescheduling persist Manila appointment instants” |
| BW3 | “Browser callback completion exposes outcome without resolving its report” |
| BW4 | “Pickup-reference lookup and explicit browser collection persist exact stock ledger changes” |
| BW5 | “Incident publication preview commits a customer-visible snapshot with unknown restoration” |
| BW6 | “Administrator account form provisions a persisted customer without public registration” |
| BW7 | “Administrator previews and publishes an independent quality restriction” |
| BW8 | “Explicit advisory revision updates customer content while preserving publication history” |
| BW9 | “Explicit administrator lifting ends the restriction independently” |

### Supplier maintenance browser checks

Root `npm run test:maintenance` runs [verification/browser-maintenance.ts](../verification/browser-maintenance.ts). All eight checks passed against the production supplier build and real API. These assertions inspect customer API results separately from native presentation.

| Key | Actual checked behavior |
| --- | --- |
| BM1 | Inspection browser acceptance and Manila scheduling preserve alternate site/access details |
| BM2 | Inspection browser completion exposes findings/next steps, excludes private notes, and leaves report unresolved |
| BM3 | Administrator browser creates and version-edits an isolated display zone with actor/time audit |
| BM4 | Stale browser administrative edit shows conflict and preserves the newer zone |
| BM5 | Aborted browser write shows uncertain result and retries its frozen body/key successfully |
| BM6 | Browser creates/edits isolated pickup site/session and customer sees labeled exact-decimal availability |
| BM7 | Confirmed browser session cancellation releases exactly 25.50 liters and informs reserved/pending owners once |
| BM8 | Browser reviews suggestions then confirms/corrects association while retaining customer history and old/new audit |

### Supplier recovery and administration browser checks

Root `npm run test:recovery` runs [verification/browser-recovery.ts](../verification/browser-recovery.ts) with [settings flows](../verification/browser-settings.ts). All fifteen actual production-browser checks passed. Aborts simulate explicit transport failure; successful recovery always uses the real API. Original guidance/rule text is restored by appending new immutable versions.

| Key | Actual checked behavior |
| --- | --- |
| BR-AUTH-01 | Unavailable session restore shows retry and never exposes protected workspace |
| BR-AUTH-02 | Existing/absent invalid logins show identical generic errors without password disclosure |
| BR-AUTH-03 | Aborted login remains signed out and subsequent actual login recovers |
| BR-SET-01 | Browser account maintenance persists safe fictional identity fields |
| BR-SET-02 | Browser connection create/edit preserves unknown zones and old report snapshots |
| BR-SET-03 | Browser rule activation preserves history and invalidates prior API recommendations |
| BR-SET-04 | Browser guidance creation preserves exact versions/audit without publishing notices |
| BR-DASH-01 | Combined dashboard filters show genuine zero/null samples and retain drill-down filters |
| BR-DASH-02 | Aborted metrics refresh preserves labeled stale counts/as-of and recovers |
| BR-MAP-01 | Unlocated reports remain reviewable without invented features under combined viewport filters |
| BR-MAP-02 | Map/detail/inbox navigation retains applied category/status/period filters |
| BR-MAP-03 | Failed map query shows an error with usable list and recovers to actual results |
| BR-AUTH-04 | Aborted logout retains protected state and live server session without claiming success |
| BR-AUTH-05 | Own server-revoked session cannot restore protected data and repeat logout stays safe |
| BR-AUTH-06 | Actual login throttling shows actionable generic browser feedback |

### Supplier report and incident browser checks

Root `npm run test:operations` runs [verification/browser-operations.ts](../verification/browser-operations.ts). All seven checks passed against production assets and the real API, including actual protected-image decoding. Every mutation uses new fictional records.

| Key | Actual checked behavior |
| --- | --- |
| BO1 | Supplier inbox displays both new customer references while customer lists/details enforce ownership |
| BO2 | Staff acknowledges/assigns urgent unlocated report with reason/time history and no invented zone or coordinates |
| BO3 | Aborted protected-photo download shows an honest error with no displayed image and a usable retry |
| BO4 | Staff browser retrieves/decodes the real protected fictional PNG; foreign and anonymous access remain denied |
| BO5 | Staff browser creates a real demo incident with reviewed zone, unknown restoration and persisted creation history |
| BO6 | Staff browser edits incident status/owner/estimate with reason/time history while restoration remains explicitly unknown |
| BO7 | Browser links both owners then deliberately unlinks one while retaining report content/history and distinct counts/estimate |

### Supplier quality-review browser checks

Root `npm run test:quality` runs [verification/browser-quality.ts](../verification/browser-quality.ts). All seven checks passed against production assets and the real API. Supplier actions use Chromium; the customer guidance assertions use HTTP and do not substitute for Android presentation.

| Key | Actual checked behavior |
| --- | --- |
| BQ1 | Water-quality inbox/detail expose the isolated category and customer-reported hazard for staff review |
| BQ2 | Staff opens the protected quality photo as an observation without a generated safety diagnosis |
| BQ3 | Browser requires a reason then acknowledges, assigns and prioritizes quality review with persisted actor/time history |
| BQ4 | Customer-safe quality detail/timeline retain acknowledgement and attachment without invented location or automatic resolution |
| BQ5 | Customer API guidance retains exact approved source/version, callback and hazard escalation with explicit safety/location/availability uncertainty |
| BQ6 | Quality review and callback choice neither publish official notices nor submit assistance or transition the report automatically |
| BQ7 | Quality browser run has no uncaught exceptions and staff explicitly signs out |

### Actual rendered map checks

Historical first-release evidence below used the keyless public MapLibre style. The current `npm run test:map` runner in [verification/browser-map.ts](../verification/browser-map.ts) now verifies direct Leaflet/markercluster with intercepted raster tiles. See [current UI/UX evidence](verification.md#uiux-overhaul--21-october-2026) for its source boundary and current results; earlier LM1–5 do not certify the new renderer.

| Key | Actual checked behavior |
| --- | --- |
| LM1 | Live public demo style loads in real MapLibre/WebGL and requests viewport data |
| LM2 | Zoom changes query bounds without changing report priority, version or incident association |
| LM3 | Rendered point at the persisted longitude/latitude opens its authorized report |
| LM4 | No uncaught JavaScript exceptions during actual map rendering and selection |
| LM5 | Selecting a real two-report cluster expands its viewport without writes, merging or changing either persisted report |

### Installed Android check key

These are actual device checks, not additional Node test titles. Exact captures, actions and APK boundaries are in the [native ledger](native-verification.md). A range means only its listed individual checks.

| Key | Executed scope |
| --- | --- |
| N1–5, N20 | Native sign-in, SecureStore cold start, owned profile/history, logout, account isolation and foreground restoration |
| N6–7, N14 | Native report receipt/history/clarification/private-note exclusion and foreign-record deep-link denial |
| N8–10 | Questionnaire/current explained cards, stale-source hiding, persisted notification read and authorized navigation |
| N11–13, N15, N21 | All three native submissions with actual supplier-browser fulfillment, exact pickup reference/collection, cancellation and reloaded outcomes |
| N16–19 | Published unknown/restored incident history, three past-end independent restrictions, individual still-affected and repeated affected deduplication |
| N22–26 | Invalid/revoked/expired sessions; online logout; guest-offline private clearing, persisted pending revocation and real-network retry/server revocation |
| N27–30 | Explicit three-notice lifts/current removal/history; unverifiable guidance hidden; native decline without assistance; exact callback/inspection old/new agreed times |
| N31–32 | Unknown-zone/null-coordinate customer profile/report/quality guidance; no pickup availability and working callback alternative without automatic submission |
| N33–36 | Reviewed duplicate label without restoration claim; actual empty lists/Home and stale last-loaded/recovery; available/full/cancelled pickup selection states; distinct current scheduled notice |
| N37–40 | Final G generated Manila appointment/restoration text, offline unread/open recovery, planned windows/own matching context, published quality end-does-not-lift warning and actual report-free Home/notification receipt |
| N41 | Two actual native owners’ distinct report features in one real supplier viewport; each isolated rendered point opens its reference, full records unchanged/no writes/errors |
| NM1–3, NM7–11 | Denied GPS/saved-address and real geocoder503/address-only reports; system picker, byte upload, foreground retention, native point and authenticated photo decoding |
| NM13–14 | Actual committed-response503 report/photo retries with one record/event; final stored GPS accuracy, unconfirmed zone, confirmed native preview and identical real supplier-map point selection |
| NM16–17 | Real native style404/error/retry with successful saved-address report using a labeled configuration-fault APK; normal source APK restored; reviewed-closure presentation |

### Manual checks and recorded boundaries

| Key | Required manual procedure and evidence |
| --- | --- |
| M1 | O1/O4 verify the fourteen salted fixture credentials/roles, twelve owners and coherent original contexts/stock. N1–5/N31 additionally exercise selected native accounts; this is not an all-fourteen-account native login claim. |
| M2 | N1–5/N20/N22–26 verify actual native sign-in/restoration/logout/account isolation, generic invalid credentials, expiry/revocation and offline logout/restart/retry. Supplier browser throttling and production cookie checks remain separate named evidence. |
| M3 | N3/N5–7/N10/N14/N20–21/N31/N33–34 cover actual owned profile/history/messages/links, denied foreign records, unknown/empty contexts, reviewed closure, notification state and stale/error recovery. All-page helpers and exact private DTO/role tests remain separate backend evidence. |
| M4 | N17/N27 verify all three restrictions after planned end/resolved outage/completed services, explicit admin lifting, native current removal and historical lifted details. N36/N38–40 and H-G6 cover scheduled windows, owned connection context, explicit quality end warning and actual report-free notice reception. |
| M5 | NM1–3/NM10/NM14/NM16 cover actual denied/unavailable/controlled GPS, address-only503 fallback, native confirmation/point/attribution, real native style404 recovery and equal persisted GPS point selection on the supplier map. LM1–5/BR-MAP cover supplier clusters/filters/caps. Successful live signed Geoapify candidate/confidence/restriction/quota/timeout checks still require private operator credentials; GPS equality does not close the geocoded-point criterion. |
| M6 | N11–13/N15/N21/N30/N32/N35 cover actual three-service submissions and supplier-browser fulfillment reflected on Android, old/new appointments/reasons/outcomes/next steps, pickup reference/12.50-liter collection, cancellation and unavailable alternatives. PostgreSQL concurrent reservation/cancel/collection guarantees remain H-W/H-E assertions. |
| M7 | H-Q/H-F cover decision/freshness tables. N8–9/N17/N27–29/N31–32 verify actual questionnaire/explanation/source, precedence, stale hiding, independent restrictions, decline and unknown/no-stock alternatives. External academic acceptance is recorded separately and is not inferred from tests. |
| M8 | H-M/H-P/H-V and H-I/H-N verify exact cohorts, endpoint roles/private projections, audience/link races, rollback and combined independence. Supplier BM/BR/BO/BQ and native N18 independently cover their named client paths. No unlisted exhaustive permutation is implied. |
| M9 | NM13 verifies actual native report and photo retry after a test-only503 following the real commit, with identical operation/payload digests and one report/attachment/event. NM7–11/F-source image checks cover picker retention/decoding; BM5 covers frozen browser write recovery. Operation intentions remain memory-only and are not a durable offline queue. |

## Stable requirements

The row note states the scope actually supported and its residual checks. “API covered” is limited to the named assertions. Conditional/deferred requirements remain in the inventory and are never silently marked implemented.

| Requirement | Modules | Executable evidence / manual check | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| REQ-SCOPE-01 | REPORT, INCIDENT, GUIDE | H-R1, H-R2, H-G3; N6–9, N16–19, N31–32 | Connected native report/incident/guidance actions and source explanations passed; academic acceptance remains externally unverified. |
| REQ-SCOPE-02 | HTTP, AUTH, HOME | B1; project typecheck/build commands; N1–40, NM1–17 | The documented TypeScript stack builds and actual Android workflows run; exact build/check boundaries are in the native ledger. |
| REQ-SCOPE-03 | OPS, DATA, MAP, LOCATION | H-R4, U-G1–2; O1; NM10, NM14, NM16 | Approved Docker/PostgreSQL persistence and real web/native MapLibre passed. Live signed Geoapify remains pending private configuration. |
| REQ-SCOPE-04 | SEED, NOTICE, STOCK | H-G1, W-M1; M4; N17, N31, N35–36 | Actual native notice/incident/pickup fixtures retain demonstration labels and uncertainty; no real-water-safety approval is implied. |
| REQ-SCOPE-05 | SEED, AUTH | H-A3; O1 | One supplier/three roles implemented; no deadline acceptance inferred. |
| REQ-ACCESS-01 | SEED | H-A3; O1, O4; BW6, BR-SET-01–02; N1–5, N20, N31 | Fourteen original fixture identities/owners are audited; selected native accounts restore distinct histories and connections. No all-fourteen native-login claim. |
| REQ-ACCESS-02 | AUTH, SET | U-S1, H-S2, H-S3, H-A3; B1, B8; N1–5, N22–26 | Backend/browser authentication and actual native restoration, owned profile, logout/revocation/expiry and offline sign-out recovery passed. |
| REQ-ACCESS-03 | AUTH, HTTP, FILE | H-S1, H-S4, H-C1; N14, N20, N31 | API ownership covers all record/file operations; actual foreign-report deep links are denied and native account changes clear prior views. |
| REQ-ACCESS-04 | HTTP, REPORT, INCIDENT | H-S1, H-R2, U-T3, H-D6; N7, N14, N16, N18 | Exact public projections and role guards pass; native messages/public incident/history exclude the tested private fields and foreign body. |
| REQ-ACCESS-05 | AUTH | H-S3, W-C1; B6, B8; M2; N2, N4–5, N20, N22–26 | Actual server-verified SecureStore cold starts, revocation/expiry and interrupted logout/restart/retry pass; browser cookie/CSRF remains separate evidence. |
| REQ-UI-C01 | HOME, NOTICE | C-P1–2, H-G1–2; M3; N1, N5, N17, N27, N31, N34–36 | Actual owned Home, demo labels, current/lifted notices, unknown/empty contexts and stale timestamp/recovery are recorded individually. |
| REQ-UI-C02 | REPORT, LOCATION, FILE | H-R1, H-C2, H-S4, C-B5, C-B7; M3, M5; N6, N31, NM1–3, NM7–17 | Actual Android forms/receipts, permission denial, address-only503 fallback, controlled GPS/confirmation, images and committed retry pass. Live Geoapify candidates remain pending. |
| REQ-UI-C03 | REPORT, INCIDENT | H-S1, H-R2–3; M3; N6–7, N14, N16, N18–20, N33 | Native owned history/detail/messages, published incident context, affected/follow-up and reviewed-closure labels pass. |
| REQ-UI-C04 | GUIDE | H-G3–5, H-C1; M3, M7; N8–9, N17, N27–32 | Actual explained cards/questionnaire/alternatives, independent restrictions and stale/unverifiable hiding pass. Academic acceptance remains external. |
| REQ-UI-C05 | ASSIST, STOCK | H-A1–2, H-W1–6; M6; N11–13, N15, N21, N30, N32, N35 | All three native request/fulfillment/history paths, appointments, exact pickup/collection, cancellation and unavailable alternatives pass. |
| REQ-UI-C06 | HOME, AUTH | H-S1, H-S5, H-G2; M2–3; N3, N5, N10, N21, N31, N34 | Owned native profiles, persisted notification read/navigation, account clearing, empty and failed-refresh recovery pass. |
| REQ-UI-S01 | METRIC | H-A5, H-D5, H-M1, U-T1; B1, BR-DASH-01–02 | Exact API cohorts and actual browser combined filters/null samples/drill-down/stale refresh passed. |
| REQ-UI-S02 | REPORT, FILE | H-R3, H-C2, H-S4, H-V1; B2–3, BM8, BO1–4, BR-MAP-01–02 | Actual two-owner inbox, unlocated urgent review, clarification, authenticated photo decode/failure/retry, link correction and filter retention passed. |
| REQ-UI-S03 | MAP | H-R4, W-M1; B5, LM1–5 | Real production map renders, expands a two-report cluster and opens a persisted authorized point; basemap-failure list and zoom invariance passed. |
| REQ-UI-S04 | INCIDENT | H-R2, H-I2–3, H-V1–2; BW5, BM8, BO5–7 | Actual browser incident create/edit/publication/link/unlink preserve audit/counts and unknown restoration; API snapshot/privacy/combined independence passed. |
| REQ-UI-S05 | NOTICE, SET | H-G1–2, H-A3–4; B4, BW6–9; N17, N27, N36 | Browser account/settings/advisory administration and exact permission tests pass; native quality/scheduled reception and explicit lift/current removal are recorded. |
| REQ-UI-S06 | ASSIST, STOCK | H-A1–2, H-W1–6; B4, BW1–4; N11–13, N21, N30, N35 | Real supplier fulfillment is reflected on Android for every type; preserved old/new appointments, pickup references and outcomes pass. |
| REQ-REPORT-01 | REPORT, FILE | H-R1, H-C2, H-S4–5; N6, N31, NM1–3, NM7–14 | API covers four categories; actual native outage/quality reports, guided details, saved/alternate locations and controlled images pass. |
| REQ-REPORT-02 | LOCATION, REPORT | M5; H-S5; NM1–2, NM14 | Actual denied-GPS saved-address and granted controlled-GPS confirmation/native point pass. Injected emulator locations are explicitly test data. |
| REQ-REPORT-03 | LOCATION | U-G1–2; M5; NM14 | Real adapter/signature behavior has unit evidence and GPS coordinates persist/render identically. Live confirmed Geoapify candidates remain pending. |
| REQ-REPORT-04 | LOCATION, REPORT | H-G5, H-S5, H-D4, U-G2; M5; H-C3, N31–32, NM3, NM14 | Actual real503/null-coordinate and unknown-zone recovery pass; confirmed GPS retains accuracy and separate review. Live quota/ambiguity/provider restrictions remain pending. |
| REQ-REPORT-05 | DATA, LOCATION, MAP | U-S2, H-R4; LM3, M5; H-C3, NM14 | Paired/range validation and real supplier/native GPS point use identical persisted longitude/latitude; live geocoded equality remains pending. |
| REQ-REPORT-06 | HTTP, FILE | H-S4, H-C2; BO3–4; C-U1–4, C-I1–3, NM7–11, NM13–14 | API content/ownership/replay and actual native picker/File-byte upload/protected image decode pass. No production mock substitutes for these requests. |
| REQ-REPORT-07 | HTTP, REPORT | H-R1, C-B5–6; N6, NM13 | Actual receipt fields and committed-response503 retry return one identical report/key/body; exact persisted count is one. |
| REQ-REPORT-08 | REPORT, FILE, HTTP | H-R3, H-S1, C-B7, W-C1–5; B2, BO3–4; N7, NM9–11, NM13 | Native two-way clarification/private-note exclusion and explicit committed photo retry pass with one attachment/event; protected image decodes. |
| REQ-INCIDENT-01 | REPORT | H-R3; B3 | Isolated unlocated severe leak can be assigned/acknowledged without invented coordinates/zone; urgent reason, actor/time audit and stale rejection are asserted. |
| REQ-INCIDENT-02 | REPORT, INCIDENT | H-R2, H-I2; BM8, BO7 | Actual confirmed/corrected/unlinked associations retain reports/history; concurrent corrective links have one version winner and exact old/new audit. |
| REQ-INCIDENT-03 | MAP, INCIDENT | LM2; NM14 | Actual supplier zoom/cluster invariance passes; native uses a read-only single-point preview and makes no clustering/domain inference. |
| REQ-INCIDENT-04 | INCIDENT, METRIC | H-I3, H-R2 | Exact two reports/one connection versus independent137-customer estimate and unknown estimate are asserted. |
| REQ-INCIDENT-05 | REPORT, INCIDENT, DATA | H-I1; N19 | Concurrent API assertions and two actual native affected taps return the same separate personal assertion; database count is one. |
| REQ-INCIDENT-06 | INCIDENT, HTTP | H-R2, U-T3; N16 | Actual native published investigating/unknown-restoration and resolved updates retain the historical timeline; exact private projection also passes. |
| REQ-INCIDENT-07 | INCIDENT, NOTICE, DATA | H-I3, H-R2, H-N1–2, H-D2; N10, N16, N21 | Backend deduplication/audiences/rollback and actual native notification read/public timeline receipt pass; no external delivery channel is claimed. |
| REQ-INCIDENT-08 | REPORT, INCIDENT | H-R2; N18 | Actual native still-affected reason returns only the individual report to review; independent snapshots preserve other state and first resolution. |
| REQ-INCIDENT-09 | REPORT, INCIDENT, NOTICE, ASSIST | H-R2, H-G1, H-A1, H-W2; N11–13, N17–18, N27 | Combined API and native scenario preserve independent assistance, report, incident and quality outcomes through explicit lifting. |
| REQ-NOTICE-01 | NOTICE, HOME, SET | H-G1–2, W-M1, C-P1; H-G6, N17, N27, N36 | Scheduled active/future/ended windows are tested separately from enduring quality restrictions; actual native current notices/history are recorded. |
| REQ-NOTICE-02 | NOTICE, GUIDE | H-G1, H-G3, W-M1; N17, N27, N31 | All three restrictions remain distinct on native Home/guidance and after independent restoration; unknown quality retains approved information and safety uncertainty. |
| REQ-NOTICE-03 | NOTICE, AUTH | H-P2, H-V1, U-V1–2; BW7–9 | Every documented admin write denies staff; exact revision/lift actor/reason/time and immutable published history passed alongside browser publish/revise/lift. |
| REQ-NOTICE-04 | NOTICE, DATA, HOME | H-N1–2, H-G2; N10, N21, N34, N37, N40 | Publication/lift/read replay and transactional fan-out pass; actual native persisted state, current authorized destination and empty/error recovery are separate checks. |
| REQ-ASSIST-01 | ASSIST, DATA | H-A1, H-S1, H-C1; N11–13, N21 | Actual three-type submissions/history/owner fulfillment pass; backend active-duplicate and ownership constraints remain directly asserted. |
| REQ-ASSIST-02 | ASSIST | H-A1–2, H-W2, H-E1–2; N11–13, N15, N30 | Actual ordinary transitions/rescheduling/completion/cancellation pass; backend tests separately deny shortcuts/terminal reopening and serialize races. |
| REQ-ASSIST-03 | ASSIST, GUIDE | H-A1, H-G3, H-C1; N11–13, N29, N32 | Native requested wording makes no appointment/allocation promise; decline and callback alternative do not create assistance before explicit submission. |
| REQ-ASSIST-04 | ASSIST, STOCK | H-A1–2, H-W2, H-W4–6; U-T5, N11–15, N30 | Reasons/history/notifications and cancellation races pass. Actual callback/inspection history now shows the retained old and new agreed times. |
| REQ-ASSIST-05 | ASSIST | H-A1–2; BW1–4, BM1–2; N11–13, N15, N21 | Actual supplier-browser operations and corresponding native timelines/outcomes pass for every type. |
| REQ-ASSIST-06 | ASSIST, REPORT, NOTICE | H-A1, H-W2, H-V2; N11–13, N17–18 | Actual combined native follow-up preserves completed services and independent incident/other-report/quality state; full API snapshots also pass. |
| REQ-CALLBACK-01 | ASSIST | H-A1–2; BW1–3; U-T5, N11, N30 | API missed-callback/reason paths and actual native agreed/rescheduled appointment history, outcome and next steps pass. |
| REQ-INSPECTION-01 | ASSIST | H-A1, H-S1; BM1–2; U-T5, N12, N30 | Actual inspection site/access/appointment/findings/next steps and old/new agreed times pass; private staff notes remain excluded. |
| REQ-WATER-01 | STOCK, ASSIST | H-C1, H-W1, W-F1; M6; N13, N32, N35 | Native exact-liter/session/address/time/instructions, unavailable/full/cancelled states and callback fallback pass without routing or delivery. |
| REQ-WATER-02 | STOCK, SEED | H-W1–6; BM6–7; M1/M6; N13, N35 | Original two-site seed, browser maintenance and actual native labeled available/full/cancelled options pass; fixture aging remains documented. |
| REQ-WATER-03 | STOCK, DATA | H-W1, H-W3, H-D1, U-S3; N13 | Concurrent exact stock/rollback and native12.50-liter reservation/reference pass; displayed availability is not acceptance. |
| REQ-WATER-04 | STOCK, DATA | H-W2–3; BW4; N13, N21 | Exact transactional transfer/repeat rejection and actual native Reserved→Collected/reference/time/outcome pass. |
| REQ-WATER-05 | STOCK, DATA | H-W2, H-W4–6, H-E3; BM7; N15, N32 | Database races and supplier cancellation/follow-up are directly asserted; native eligible cancellation and unavailable support alternative pass. |
| REQ-WATER-06 | STOCK, GUIDE | H-G5, H-W1, H-W5; M6; N32, N35 | Actual native full/cancelled selections are disabled; no eligible options explicitly offers callback and creates no request automatically. |
| REQ-WATER-07 | ASSIST, STOCK | M6; source review; N13, N32, N35 | Actual list/pickup/reference/collection and no-delivery wording match the scoped implementation; commerce/fleet remains deferred. |
| REQ-DECISION-01 | GUIDE | H-Q1–3, H-F1–2, H-G3–4, H-C1; N8–9, N17, N31–32 | Decision/freshness tables and actual native answers/cards/current-source behavior pass; academic acceptance remains externally unverified. |
| REQ-DECISION-02 | GUIDE, NOTICE | H-G3; N8, N17, N27, N31 | Actual official precedence, explanation/source/revision, escalation and callback controls pass without inferred safety/restoration. |
| REQ-DECISION-03 | GUIDE, STOCK | H-Q1, H-C1; N8, N13, N32 | Five-row API outage/need/stock table and actual native available/no-session alternatives pass. |
| REQ-DECISION-04 | GUIDE | H-Q2; N8, N18, N31 | API covers low pressure, hazards and post-restoration persistence; native assessment/explanation and independent follow-up are recorded. |
| REQ-DECISION-05 | GUIDE, REPORT | H-Q2–3, H-C2; N31–32 | Hazard/assessment API tables and actual unknown-quality escalation/support pass; no risky repair or safety diagnosis is introduced. |
| REQ-DECISION-06 | GUIDE, NOTICE, REPORT | H-G1, H-G3; BQ1–6, M7; N17, N31 | Supplier quality review/photo boundaries and actual native approved information, distinct restrictions and uncertainty pass. Real safety-content approval remains external. |
| REQ-DECISION-07 | GUIDE, LOCATION | H-Q3, H-G5; BQ4–5 | Conflicting official notices are retained in safety order with escalation/uncertainty; unknown-zone/location/availability support asserted. |
| REQ-DECISION-08 | GUIDE, ASSIST | H-G3; BQ6; N11–13, N29, N32 | Actual decline/alternative and explicit three-service submission pass; choosing alone creates no assistance. |
| REQ-DECISION-09 | GUIDE, SET | H-F1–2, H-G4; N9, N27–29 | Immutable source invalidation and actual native stale/unverifiable hiding/current refresh after lifting pass. |
| REQ-DECISION-10 | GUIDE | M7; source/scope review | Conditional future AI requirement: not applicable to implemented no-AI release; academic approval external. |
| REQ-OPS-01 | AUTH, HTTP, FILE | H-P1–3, H-V1–2, H-S3–4, U-S1–6, U-O1–2, H-D7; BR-AUTH-01–06 | Full supplier role matrix, exact throttle/generic-error/cookie attributes, browser auth failure/recovery and private-field sentinels passed. Actual HTTPS deployment is outside implemented local verification. |
| REQ-OPS-02 | LOCATION, MAP, REPORT | B5, C-B2, C-B7, U-G2; M5, M9; NM1–3, NM13, NM16, N34 | Actual denied GPS,503 address-only, committed report/photo retry, native style404 fallback and stale/empty recovery pass. |
| REQ-OPS-03 | OPS, DATA, SEED | O1, O2 | Docker persistence and isolated backup/restore recorded in verification; repeat on target environment. |
| REQ-OPS-04 | DATA, ASSIST | W-F2, C-B8, H-A5; U-T5–6, N11–13, N30, N34 | Structured instants stay UTC; clients render Manila dates, public appointment history preserves both times, and generated appointment/restoration sentences are localized without changing stored history. |
| REQ-OPS-05 | DATA, REPORT, INCIDENT, SET | H-R3, H-V1–2, H-A4, H-G4, H-D1–2; BM3, BM8, BO2, BO5–7 | Transactional histories/rollback and exact actor/time/reason audit verified for report review, incident create/edit/link, advisory revision/lift, zone and settings; broader permutations are not implied. |
| REQ-OPS-06 | MAP, HTTP | H-R4, H-D4, U-T2, H-S1; LM2, LM5, BR-MAP01–03 | Bounds/filter/cap/privacy API, real clusters/zoom without writes and combined category/status/period/viewport/unlocated recovery pass. |
| REQ-OPS-07 | LOCATION, MAP, OPS | U-G1–2; M5; NM10, NM14, NM16 | Real web/native MapLibre and attribution/fallback pass. Geoapify adapter/signature tests are isolated; live provider checks still require private credentials. |
| REQ-OPS-08 | HTTP, DATA | H-P1–3, H-V1, U-T2–3, W-P1–2, C-P1–2, C-B1 | Documented endpoint role inventory and literal customer DTO key sets are directly asserted; pagination/validation/transport checks remain distinct from native presentation. |
| REQ-OPS-09 | OPS, LOCATION | O3; N1–40, NM1–17 | Actual signed ARM64/x86_64 native APKs build; KVM Android29/36 execute the individually documented workflows. No all-device/ARM64-runtime claim. |
| REQ-METRIC-01 | METRIC, REPORT | H-M1, H-A5, H-R2, H-D5 | Exact unresolved/category counts, reviewed invalid/duplicate exclusions and reopened reports asserted in an isolated historical cohort. |
| REQ-METRIC-02 | METRIC, INCIDENT | H-M1, H-I3 | Six-report/two-connection exact category cohort and separate two-report/one-connection/137 affected-estimate incident assertions passed. |
| REQ-METRIC-03 | METRIC, REPORT | H-M1, H-A5, H-R3 | First public response ignores notes/customer messages/later responses; exact pending/sample/mean and null empty/unanswered cohorts asserted. |
| REQ-METRIC-04 | METRIC, REPORT | H-M1, H-A5, H-D5, U-T1, H-R2 | Exact disjoint sampled/excluded/pending resolution cohorts retain genuine first resolution after reopening; API filters and read-only behavior asserted. |
| REQ-DEMO-01 | SEED | O1, O4; BW6, BR-SET-01–02 | All original fixture credentials/roles/owned connections and coherent categories/stock checked; not an all-account native login claim. |
| REQ-DEMO-02 | SEED, INCIDENT, REPORT | O1, O4; M3; N6, N18, N31 | Four-category original fixture audit, actual native outage/quality and still-affected/unknown-location contexts pass. |
| REQ-DEMO-03 | SEED, STOCK, ASSIST | O1, O4; H-A1, H-W1–6, H-E1–3; BW1–4, BM1–2, BM6–7; N11–13, N15, N30, N32, N35 | Actual native services/appointments/reference/collection/unavailability and supplier maintenance pass with original seed coherence separately audited. |

## Original feature acceptance criteria

These identifiers and criteria remain unchanged in their source specs. The descriptions below focus on test scope/gaps; they do not replace or weaken original acceptance wording. No criterion receives a blanket PASS from this table.

### [admin/advisory](features/admin/advisory/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| SUP-ADV-01 | NOTICE, SET | H-N1, BW7; N40 | Report-free zone-only/two-connection fan-out passes API; actual native zero-report customer receives a separate connection-targeted notice on Home/Updates. Browser publication passes. |
| SUP-ADV-02 | NOTICE, SET | H-P1–2, H-G1, H-N2, U-V1–2 | All documented role-denied advisory mutations and target/session locks are asserted; advisory-specific rollback/recovery preserves all recipients/state. |
| SUP-ADV-03 | NOTICE, SET | H-G1, W-M1; N17, N27 | All three actual native restriction details/Home/guidance retain distinct kinds and source revisions. |
| SUP-ADV-04 | NOTICE, SET | H-G1, H-A1; N17 | Actual native restrictions remain after planned end, resolved outage/both reports and completed services. |
| SUP-ADV-05 | NOTICE, SET | H-V1; BW9; N27 | Real admin-browser lifts and native current removal/historical lifted revisions supplement exact actor/reason/time and immutable revision assertions. |
| SUP-ADV-06 | NOTICE, SET | H-N1–2, H-G2; N10, N27 | Overlapping audience publication and same-key lift/read retries are directly asserted, with one notification per recipient/source event. |
| SUP-ADV-07 | NOTICE, SET | H-N2 | Advisory-specific injected fan-out failure leaves state/version/revisions/events/operation/notifications unchanged; same-key recovery commits once. |
| SUP-ADV-08 | NOTICE, SET | H-F1, BW8; N9, N27–29 | Native current refresh/stale hiding and explicit lift removal preserve historical source evidence; API source revisions are immutable. |
| SUP-ADV-09 | NOTICE, SET | H-V1, H-S1, U-T3 | Literal public incident/advisory/report key sets and private sentinels exclude draft text/notes, other-household details, coordinates/contact and future private fields. |

### [admin/assistance](features/admin/assistance/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| SUP-ASSIST-01 | ASSIST, STOCK | H-A1, H-W2; BW1–4; N11–13, N21 | Actual supplier-to-native acceptance/scheduling/rescheduling/progress/completion and owner outcomes pass for every type. |
| SUP-ASSIST-02 | ASSIST, STOCK | H-A1; BW1; N11–13, N21 | Active staff ownership/duplicate API guards and actual supplier/native three-service details pass. |
| SUP-ASSIST-03 | ASSIST, STOCK | H-A1–2, H-E1; BW2; U-T5, N11, N30 | Missed-callback API path preserves reason/old/new time; browser/native histories now visibly show both agreed appointments. |
| SUP-ASSIST-04 | ASSIST, STOCK | H-A1, H-S1; BM1–2; N12, N30 | Actual browser/native inspection site/access/findings/next steps and rescheduled appointment history pass without private-note exposure. |
| SUP-ASSIST-05 | ASSIST, STOCK | H-A2, H-E1; N11–13 | Immediate support needs reason; unsupported shortcuts and terminal reopening fail without history mutation. Actual native standard lifecycles are separately recorded. |
| SUP-ASSIST-06 | ASSIST, STOCK | H-A1–2, H-W2, H-W4, H-E1–3; N15 | Exact cancellation/start/collect races have one authoritative outcome; actual native reasoned prework cancellation passes. |
| SUP-ASSIST-07 | ASSIST, STOCK | H-W1, H-D1, H-C1; N13, N32, N35 | PostgreSQL exact stock/reference guarantees and actual native reservation/collection/unavailability alternatives pass. |
| SUP-ASSIST-08 | ASSIST, STOCK | H-W4–6, H-A2, H-E2–3; NM13, N15 | Concurrent backend operations and actual frozen browser/native command retries preserve one operation/history; native cancellation also passes. |
| SUP-ASSIST-09 | ASSIST, STOCK | H-S1, H-L1; N14 | Backend foreign linked-report/request read/cancel and allocation guards pass. Native foreign report denial passes; no claim of every tampered route being opened in the UI. |
| SUP-ASSIST-10 | ASSIST, STOCK | H-A1, H-W2, H-V2; BW3, BM2; N11–13, N17–18 | Actual three-service native outcomes and combined API/native independent report/incident/quality outcomes pass. |

### [admin/auth](features/admin/auth/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| SUP-AUTH-01 | AUTH | H-P2; B1 | All18 documented staff operational reads succeed; actual seeded staff browser login and operational writes passed in B/BW. |
| SUP-AUTH-02 | AUTH | H-S1, H-S3 | Customer/no-session denied API assertions. |
| SUP-AUTH-03 | AUTH | H-P2 | All12 documented administrative writes and3 private-settings reads reject staff directly with403/no payload. |
| SUP-AUTH-04 | AUTH | H-P3, H-S2; B8, BR-AUTH-04–05 | Repeated browser-session logout revokes server use; aborted logout keeps workspace/session active until confirmation; signed-out reload remains protected. |
| SUP-AUTH-05 | AUTH | H-P3; BR-AUTH-02, BR-AUTH-06 | Unknown/existing wrong credentials have identical generic errors, exact13th-attempt server throttling and actual actionable browser429 feedback; no password shown. |
| SUP-AUTH-06 | AUTH | H-D3, H-P3; B6, BR-AUTH-01, BR-AUTH-03–05 | Expired/revoked API sessions, valid reload, unavailable restore/login and failed logout all retain honest states; actual browser revoked reload denies workspace. |
| SUP-AUTH-07 | AUTH | H-S3, H-P3, W-C1 | Exact Origin/CSRF and HttpOnly/SameSite/production Secure/path flags are verified. Actual HTTPS infrastructure/deployment is out of scope and unverified. |

### [admin/dashboard](features/admin/dashboard/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| SUP-DASH-01 | METRIC | H-M1 | Exact six-report cohort asserts two outage/two quality/one pressure/one leak, three unresolved, two connections and inclusive/exclusive period bounds. |
| SUP-DASH-02 | METRIC | H-M1, H-A5, H-R3 | Actual first public staff message defines first response; automatic receipts, customer replies, internal notes and later staff messages do not replace it. |
| SUP-DASH-03 | METRIC | H-M1, U-T1 | Exact empty/unanswered cohorts return null durations, zero samples and correct pending counts; browser overview rendering also B1. |
| SUP-DASH-04 | METRIC | H-M1, H-A5, H-D5 | Response/resolution arithmetic means, sample/pending/excluded counts and reopened historical resolution are directly asserted. |
| SUP-DASH-05 | METRIC | H-M1, H-R2, H-D5, H-V2, U-T1 | Reopening changes exact current unresolved count and retains first resolution; independent shared outcomes remain unchanged. |
| SUP-DASH-06 | METRIC | H-I3 | Exact two-report/one-connection independent estimate fixture asserted; broader dashboard cohorts retain their own evidence. |
| SUP-DASH-07 | METRIC | H-P1; BR-DASH-02 | Direct unauthorized metric reads fail; actual aborted refresh preserves labeled stale counts/as-of and retries to real results. |

### [admin/distribution](features/admin/distribution/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| SUP-DIST-01 | STOCK, ASSIST, DATA | H-W1–6, H-C1; BM6–7; N13, N35 | Two original demo sites plus browser-created sessions and actual native labeled availability/options are verified. |
| SUP-DIST-02 | STOCK, ASSIST, DATA | H-W1 | Direct concurrent 80/100-liter assertion. |
| SUP-DIST-03 | STOCK, ASSIST, DATA | H-W2; BW4 | Direct 60/40 reservation, collection and release assertion. |
| SUP-DIST-04 | STOCK, ASSIST, DATA | H-D1 | Injected notification failure asserts request/allocation/history/operation rollback. |
| SUP-DIST-05 | STOCK, ASSIST, DATA | H-W2 | Same-key collection replay/new-key duplicate/released collection covered. |
| SUP-DIST-06 | STOCK, ASSIST, DATA | H-W4 | Direct customer cancel versus collection race. |
| SUP-DIST-07 | STOCK, ASSIST, DATA | H-W5–6, H-W4, H-E3; BM7 | Session cancellation versus collection has one irreversible collected/released result; reserved/pending browser cancellation also passes. |
| SUP-DIST-08 | STOCK, ASSIST, DATA | H-W3, U-S3 | Exact decimals and commitments guard asserted. |
| SUP-DIST-09 | STOCK, ASSIST, DATA | H-G5, H-W1, H-W5; N32, N35 | Actual native full/cancelled selections are disabled and no-session callback opens a form without submitting/guaranteeing fulfillment. |
| SUP-DIST-10 | STOCK, ASSIST, DATA | H-S1, H-L1, H-A1, H-W2 | Direct foreign allocation tampering, customer collection denial and independent report outcome are asserted; combined native states remain M6. |

### [admin/incident](features/admin/incident/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| SUP-INC-01 | INCIDENT, REPORT | H-R2; BO5–7 | Actual browser creates/edits incident, links two distinct owners and later unlinks one without deleting either personal report or history. |
| SUP-INC-02 | INCIDENT, REPORT | H-R2; BM8 | Browser suggestions leave report unlinked until confirmation; confirmation/correction preserve reference and exact old/new association audit. |
| SUP-INC-03 | INCIDENT, REPORT | H-I2 | Two simultaneous corrective links yield exactly one version winner and one409; exact old/new association history retained. |
| SUP-INC-04 | INCIDENT, REPORT | H-R2; BW5; N10, N16 | Backend distinct-owner/overlap notification and actual native published timeline/read receipt pass; no private note is published. |
| SUP-INC-05 | INCIDENT, REPORT | H-R2, H-D2 | Same-key update replay and fault rollback/recovery asserted. |
| SUP-INC-06 | INCIDENT, REPORT | H-V1, H-S1, U-T3 | Literal published DTO fields and private sentinels exclude draft/internal geometry, notes, contacts and other-household report/answer/address/coordinate data. |
| SUP-INC-07 | INCIDENT, REPORT | H-G1; N17, N27 | Actual native quality restrictions survive incident resolution and change only after explicit admin lifting. |
| SUP-INC-08 | INCIDENT, REPORT | H-R2; N18 | Actual native still-affected changes only one report; independent persisted/public snapshots retain all other outcomes. |
| SUP-INC-09 | INCIDENT, REPORT | H-I3; BO6–7 | Exact two-reports/one-connection independent estimate fixture and actual browser two-owner/connection counts versus17-customer estimate remain distinct after unlink. |
| SUP-INC-10 | INCIDENT, REPORT | H-F1; N9, N28 | Exact incident-publication invalidation passes API; actual native changed-source and unverifiable-source checks hide historical cards and recover. These are distinct fixtures. |

### [admin/map](features/admin/map/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| SUP-MAP-01 | MAP, LOCATION | H-R4, U-G2; LM1, LM3; NM14 | Real GPS native/web point equality passed. This criterion specifically requires a confirmed live geocoded point, still pending private Geoapify setup. |
| SUP-MAP-02 | MAP, LOCATION | H-S5, H-D4; BR-MAP-01 | Actual browser unlocated-only list retains unknown report while API features omit it; no fabricated point or inferred zone. |
| SUP-MAP-03 | MAP, LOCATION | H-R4, U-T2; BR-MAP-01–02, LM2 | Actual combined category/status/period/viewport records and map/detail/inbox filter retention pass; invalid/cap filters and real zoom tested separately. |
| SUP-MAP-04 | MAP, LOCATION | LM2, LM5; NM14 | Actual web cluster expansion/zoom send no writes and preserve independent reports, versions, priorities and links. Native is an individual-point preview with no operational clustering. |
| SUP-MAP-05 | MAP, LOCATION | H-R3, B3, LM3; NM14 | Urgent isolated review and actual rendered supplier-point selection open the authorized report; native confirmed preview displays the same persisted GPS point. |
| SUP-MAP-06 | MAP, LOCATION | H-P1 | All49 supplier endpoints, including household markers and staff detail, reject unauthenticated and customer requests before data or commands. |
| SUP-MAP-07 | MAP, LOCATION | B5, BR-MAP-03 | Actual tile-failure list/navigation and query-failure error/list recovery pass; failed queries never show an empty successful map. |
| SUP-MAP-08 | MAP, LOCATION | H-R4 | Invalid/NaN bounds and visible response cap/truncation asserted. |

### [admin/report](features/admin/report/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| SUP-REPORT-01 | REPORT, FILE | H-R2, H-S1; BO1 | Two exact new customer references visibly appear in supplier inbox; each customer list/detail includes only its owner and denies the other ID. |
| SUP-REPORT-02 | REPORT, FILE | H-R3; BO2, BQ3–4 | Actual browser acknowledges/assigns urgent unlocated leak and quality reports without invented zone/coordinates, preserving message and reason/time history. |
| SUP-REPORT-03 | REPORT, FILE | H-R3; B3, BO2, BQ3 | Reason-required urgent isolated leak/quality review retains exact actor/time API audit and visible reason/time UI; stale writes cannot overwrite it. |
| SUP-REPORT-04 | REPORT, FILE | H-A5, H-S1; B2 | Public clarification/first response/private note boundaries covered. |
| SUP-REPORT-05 | REPORT, INCIDENT | H-R2, H-I2; BM8, BO7 | Actual suggestion confirmation/correction and deliberate unlink preserve personal contents/references/history; concurrent corrections retain exact old/new audit. |
| SUP-REPORT-06 | REPORT, FILE | H-A5, H-D5, U-T1 | Reviewed duplicate/excluded durations and historical first resolution asserted. |
| SUP-REPORT-07 | REPORT, FILE | H-R1, H-R3, H-I2; BM4–5 | Concurrent same-key creation, message replay, corrective-link races, stale two-editor conflict and frozen browser retry preserve identities/history without overwriting newer changes. |
| SUP-REPORT-08 | REPORT, FILE | H-V2 | One combined fixture reopens only the individual report; resolved incident/other report, unlifted past-end quality notice and completed assistance stay byte-equivalent in public responses and persisted records. |
| SUP-REPORT-09 | REPORT, FILE | H-S1, H-S4 | Foreign report/message/follow-up/file and private-note exclusion assertions. |

### [admin/settings](features/admin/settings/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| SUP-SET-01 | SET, AUTH, GUIDE | H-P1–2, H-A3–4; BW6, BR-SET-01–02 | Actual browser account/connection create/maintenance passed; every documented admin write rejects staff/customer and safe identity projection excludes credentials. |
| SUP-SET-02 | SET, AUTH, GUIDE | H-A3, H-S5 | Normalized email uniqueness, invalid role and foreign connection rejected. |
| SUP-SET-03 | SET, AUTH, GUIDE | H-A3 | Account deactivation denies current session and retains report ownership. |
| SUP-SET-04 | SET, AUTH, GUIDE | H-A4; BM3 | Saved-connection history remains a report snapshot; actual display-boundary zone edit records actor/time/reason and a new version. |
| SUP-SET-05 | SET, AUTH, GUIDE | H-C1, H-S5; BR-SET-02 | Actual unknown connection/report and later explicit coordinates preserve null/unconfirmed zone and old report snapshot; coordinates alone never confirm connectivity. |
| SUP-SET-06 | SET, AUTH, GUIDE | H-G4, H-D6; BR-SET-03–04; N9, N27–29 | Browser immutable edits and API source checks pass; native historical/stale hiding and current refresh are separately observed. |
| SUP-SET-07 | SET, AUTH, GUIDE | H-Q1–3, H-F1–2; BR-SET-03–04 | Safety precedence/uncertainty/freshness tables pass; browser settings edits do not publish/lift notices and original content is restored by appended versions. Academic acceptance remains external. |
| SUP-SET-08 | SET, AUTH, GUIDE | U-S5, U-O1, H-A3; BM4–5 | Two browser editors produce visible409 without overwrite; aborted administrative write retries the identical original key/body. |

### [customer/assistance](features/customer/assistance/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| ASSIST-C-01 | ASSIST, STOCK | H-A1, H-C1; N11–13 | All three actual native forms return requested with no automatic acceptance/appointment/allocation. |
| ASSIST-C-02 | ASSIST, STOCK | H-A1, H-W2; BW1–4; N11–13, N21 | Real supplier-browser fulfillment is reflected in native owner timelines/outcomes/next steps for every type. |
| ASSIST-C-03 | ASSIST, STOCK | H-A1, H-E1 | Active same-type duplicates fail; distinct later same-type requests are accepted after cancelled/unavailable/completed history, which remains intact. |
| ASSIST-C-04 | ASSIST, STOCK | H-L1, H-S1, H-C1; N14 | Full backend request/report/allocation denial tests pass; native foreign report path visibly denies access. |
| ASSIST-C-05 | ASSIST, STOCK | H-W1, H-W3; N13, N21 | Concurrent stock assertions and actual stable12.50-liter pickup reference/reserved/collected display pass. |
| ASSIST-C-06 | ASSIST, STOCK | H-W2, H-W4, H-E3; N15 | Backend release/collection/cancel races pass; native eligible reasoned cancellation/history pass. |
| ASSIST-C-07 | ASSIST, STOCK | H-W5, H-G5; N32, N35 | Actual no-session callback alternative and disabled full/cancelled options pass; supplier session-cancellation recipient/reason guarantees remain API/browser assertions. |
| ASSIST-C-08 | ASSIST, STOCK | H-A1–2; BW2; U-T5, N11–12, N30 | API missed-contact/reschedule paths and actual native old/new callback/inspection appointments, reasons and next steps pass. |
| ASSIST-C-09 | ASSIST, STOCK | H-W4–6, H-E2–3, H-A1–2, C-B2; BM5; NM13, N17–18 | Actual committed report/photo recovery and combined native independent outcomes pass; database cancel/start/collect races remain separately asserted. |

### [customer/auth](features/customer/auth/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| AUTH-C-01 | AUTH, HOME | H-S1, H-S5; N1–5, N20, N31, N34 | Distinct native accounts restore owned identities/connections/history; switching to unknown/empty customers clears prior context. |
| AUTH-C-02 | AUTH, HOME | H-S3, C-B2; N23, N26, N34 | Actual invalid credentials/throttling and unavailable/recovered session/notification states never expose an unverified private screen. |
| AUTH-C-03 | AUTH, HOME | H-S1, H-S4; N14 | Full API ownership and actual native foreign report deep-link denial pass without foreign content. |
| AUTH-C-04 | AUTH, HOME | H-S2, C-B6; N4–5, N26, N31, N34 | Actual sign-out/restart/account switch and offline pending revocation pass; exact session revocation is independently confirmed. |
| AUTH-C-05 | AUTH, HOME | H-D3, H-S2; N22–26 | Actual expired/revoked cold starts and interrupted logout/offline restart/real-network retry pass. |

### [customer/dashboard](features/customer/dashboard/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| HOME-C-01 | HOME, NOTICE | H-S1, H-G2, C-P1; N1, N5, N17, N31, N34 | Actual owned Home/targeted notices and unknown/empty account contexts pass; backend audience/all-page guarantees are separate evidence. |
| HOME-C-02 | HOME, NOTICE | H-G1, C-P1; N17, N27 | Actual past-end/resolved-outage/completed-service restrictions remain; explicit admin lifts remove only those sources from native Home/fresh guidance. |
| HOME-C-03 | HOME, NOTICE | H-G5, C-P2; N31, N34 | Actual unknown zone, no matching notices/no open reports/empty notifications and failed-refresh timestamp/recovery are distinct and usable. |
| HOME-C-04 | HOME, NOTICE | H-S1; N6, N10, N14, N16–19, N27, N36 | Native report, notification, incident/affected, guidance and advisory shortcuts use authorized detail paths; foreign report deep link denies. |
| HOME-C-05 | HOME, NOTICE | C-B6; N5, N20, N31, N34 | Actual customer changes clear prior connection/report/notice context and preserve synthetic labels. |

### [customer/guidance](features/customer/guidance/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| GUIDE-C-01 | GUIDE, STOCK | H-Q1, H-C1; N8, N13 | API need/restoration table and native available150.00-liter explained pickup context/request pass. |
| GUIDE-C-02 | GUIDE, STOCK | H-Q1, H-F1; N32, N35 | Actual unknown/no-session callback alternative and full/cancelled unavailable selections pass without a stock promise. |
| GUIDE-C-03 | GUIDE, STOCK | H-Q2; N8, N18, N31 | API low-pressure/leak/post-resolution table and actual native assessment/escalation/source displays pass. |
| GUIDE-C-04 | GUIDE, STOCK | H-G3, H-G1; N17, N27 | Actual native safety precedence persists independently through end/restoration/completion and changes only on explicit lift. |
| GUIDE-C-05 | GUIDE, STOCK | H-Q3, H-G5; BQ5; N31–32 | Actual missing-zone/coordinate/availability uncertainty retains quality report and usable supplier support; API covers conflicting restrictions. |
| GUIDE-C-06 | GUIDE, STOCK | H-G3; BQ6; N11–13, N29, N32 | Actual decline and unavailable callback alternative create no assistance until a deliberate service-form submission. |
| GUIDE-C-07 | GUIDE, STOCK | H-F1–2, H-G4; N9, N27–29 | Native changed/unverifiable cards are hidden; real refresh and explicit lifts produce current sources without deleting historical evidence. |
| GUIDE-C-08 | GUIDE, STOCK | H-S1, H-G3, H-D6, U-T3; N14 | API foreign evaluation/history and literal public-field projections pass; native shared unauthorized-record handling denies the tested deep link. |
| GUIDE-C-09 | GUIDE, STOCK | H-G3–4, H-D6; N8, N17, N31 | Actual explanations/source/revisions are visible and API retains exact immutable context. Academic acceptance remains externally unverified. |

### [customer/notifications](features/customer/notifications/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| NOTIFY-C-01 | HOME, NOTICE, INCIDENT, ASSIST | H-I3, H-R2 | Two linked reports for one connection/owner receive one publication notice; two distinct owners also receive their own updates. |
| NOTIFY-C-02 | HOME, NOTICE, INCIDENT, ASSIST | H-N1 | A brand-new customer with no reports and two matching connections receives one zone-only publication; unrelated customer cannot read it. |
| NOTIFY-C-03 | HOME, NOTICE, INCIDENT, ASSIST | H-S1; N10, N21 | API owner-only list/detail/read and private projection guards pass; actual native list/read/destination use current authorized records. |
| NOTIFY-C-04 | HOME, NOTICE, INCIDENT, ASSIST | H-G2, H-R2; N10, N21, N34 | Actual foreground/read persistence and error recovery supplement backend read/publication/lift deduplication; no duplicate domain action is inferred from polling. |
| NOTIFY-C-05 | HOME, NOTICE, INCIDENT, ASSIST | H-A2, H-W5; N10–13, N15, N30 | Reasoned assistance events and current native authorized destinations pass; old/new appointments remain visible in the linked request. |
| NOTIFY-C-06 | HOME, NOTICE, INCIDENT, ASSIST | H-D3, C-B2, H-G4; N9, N14, N22–26, N34 | Actual empty/network/stale/expired/foreign-record recovery states pass; backend recipient and publication guarantees remain separately scoped. |

### [customer/profile](features/customer/profile/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| PROFILE-C-01 | HOME, AUTH, REPORT | H-S5; N3, N5, N31, N34 | Actual native profiles show only the selected customer and owned connection reference/address. |
| PROFILE-C-02 | HOME, AUTH, REPORT | H-S5, H-S1; N14, N31 | Profile identity is session-derived; API rejects foreign connection use and native foreign-record navigation denies without prior-owner data. |
| PROFILE-C-03 | HOME, AUTH, REPORT | H-S5, H-A4; NM3, NM14, H-C3 | Actual alternate address/GPS reports preserve saved connection details; exact API snapshot/equality assertions pass. |
| PROFILE-C-04 | HOME, AUTH, REPORT | H-S5, H-D4; N31, NM3, NM14 | Native null-coordinate/unconfirmed profile and usable address reporting pass; confirmed GPS still requires separate supplier zone review. |
| PROFILE-C-05 | HOME, AUTH, REPORT | H-S2, C-B2, C-B6; N5, N20, N22–26, N31, N34 | Actual identity switching, revoked/expired cold starts and stale/error recovery prevent another customer seeing retained private views. |

### [customer/report](features/customer/report/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| REPORT-C-01 | REPORT, LOCATION, FILE, INCIDENT | H-R1–2, H-S1; N6, N31, NM2–3, NM14 | Multiple actual Android customers receive distinct references/times/received states and owned histories; supplier/native map linkage is separately recorded. |
| REPORT-C-02 | REPORT, LOCATION, FILE, INCIDENT | H-S1, H-S4 | Foreign report/message/photo/follow-up API denied. |
| REPORT-C-03 | REPORT, LOCATION, FILE, INCIDENT | H-R4, U-G1–2; NM1–2, NM14 | Actual denied-GPS saved reporting and equal confirmed GPS native/web point pass. Required live signed geocoded-point equality remains pending credentials. |
| REPORT-C-04 | REPORT, LOCATION, FILE, INCIDENT | H-G5, H-S5, U-G2; N31, NM3, H-C3 | Actual provider503/null-coordinate/unknown-zone reports stay reviewable. Adapter unit cases cover more failures; live ambiguity/quota checks remain pending. |
| REPORT-C-05 | REPORT, LOCATION, FILE, INCIDENT | H-S4, C-B7; B5; NM7–11, NM13, NM16 | Actual native map404/error/retry leaves reporting usable; committed report/photo503 recovery preserves one attachment/event and reference. |
| REPORT-C-06 | REPORT, LOCATION, FILE, INCIDENT | H-R2, H-S1, U-T3; N7, N16 | Actual native published incident history/messages omit tested internal notes and foreign records; exact API projections also pass. |
| REPORT-C-07 | REPORT, LOCATION, FILE, INCIDENT | H-I1; N19 | Two actual native taps and database count confirm one affected assertion, separate from the existing legitimate manual report. |
| REPORT-C-08 | REPORT, LOCATION, FILE, INCIDENT | H-R2, H-G1; N18 | Actual native individual follow-up plus independent full snapshots preserve resolved incident/other report, active restrictions and completed services. |
| REPORT-C-09 | REPORT, LOCATION, FILE, INCIDENT | H-A5, H-D5; M3; N33, NM17 | Actual supplier/browser and native reviewed Duplicate label retain reason and no substantive restoration timestamp; invalid/duplicate metric handling is separately asserted. |

## Ten original demonstration scenarios

[demo.md](demo.md) preserves the exact original scenario wording and gives reproducible instructions. API scenario names identify covered subsets; a name containing DEMO does not prove an installed Android walkthrough.

| Scenario | Modules | Existing executable/operator evidence | Remaining acceptance |
| --- | --- | --- | --- |
| DEMO-001 | REPORT, MAP, AUTH | H-R1–2, H-S1; BO1, LM1–5; N5–6, N31, NM2–3, NM14; N41 | Actual native submissions/receipts are separate owned records; two native owners’ report features share a real supplier viewport and each isolated rendered point opens its own reference. Full records remain unchanged/no writes/errors. |
| DEMO-002 | INCIDENT, DATA, HOME | H-R2, H-D2, H-I3; BW5; N7, N10, N16 | Actual native published unknown/resolved timeline, private-note exclusion and persisted notification/read navigation pass alongside audience/rollback API checks. |
| DEMO-003 | GUIDE, ASSIST | H-G3–5, H-C1, H-Q1–3, H-F1–2; N8–9, N11–13, N29, N31–32 | Actual native questionnaire, explained current cards, choices/no-stock alternatives and explicit service submissions pass. Academic acceptance remains externally unverified. |
| DEMO-004 | NOTICE, INCIDENT, ASSIST | H-G1, H-V1–2; BW7–9; N17, N27 | Actual native three-restriction past-end/resolved-outage/completed-service scenario and explicit lift/current/history passed; API full independence also passes. |
| DEMO-005 | REPORT, INCIDENT | H-R2, H-V2; N18 | Actual native still-affected action and independent whole snapshots preserve incident, other report, notices and completed services. |
| DEMO-006 | AUTH, HTTP, FILE | H-S1, H-S4, H-G3, H-D6; N5, N14, N22–26, N31, N34 | Full API role/record/file/field checks and actual native foreign denial/account clearing/session failure recovery pass. |
| DEMO-007 | LOCATION, MAP, DATA | U-G1–2, U-S2, H-R4, H-S5, H-G5; NM1–3, NM14, NM16 | Actual denied GPS/address fallback, stored GPS accuracy/native-web equality and native map failure pass. Live signed Geoapify success/ambiguity/quota/restrictions remain pending credentials. |
| DEMO-008 | ASSIST, STOCK | H-A1–2, H-W2; N11–13, N15, N21, N30 | Actual native three-service requests, supplier-browser fulfillment, reschedules/outcomes/next steps and pickup collection pass. |
| DEMO-009 | STOCK, DATA, ASSIST | H-W1–6, H-E3, H-D1; BW4, BM6–7; N13, N32, N35 | Actual native reference/collection/unavailable states supplement real concurrent PostgreSQL reservation/release/collect and browser stock/cancellation checks. |
| DEMO-010 | HTTP, DATA, OPS | H-R1–2, H-W2/5, H-D1–2, O1, O2; BM5; NM13, N26, N34 | Actual post-commit report/photo retry uniqueness, interrupted logout and stale refresh recovery pass; Docker recreation/isolated restore remain independently recorded. |

## Coverage gaps that must remain visible

Previously missing repeated affected assertions, corrective-link races, two-reports/one-connection counts, report-free zone audiences and advisory fan-out rollback are now directly exercised by H-I1–3 and H-N1–2. H-Q1–3/H-F1–2 cover rule decisions/source invalidation, and H-E1–3/H-M1 cover remaining workflow races and exact metric cohorts. The native ledger now supplies the named installed-device proofs; required live Geoapify checks remain open and every row retains its exact boundary. H-P1–3/H-V1–2 and BR-AUTH/DASH/MAP/SET now cover those additional supplier/security boundaries. No API/browser evidence substitutes for the remaining native walkthrough, live Geoapify or external academic review.

The rules include category/zone/time in retained context and use category, published sources, answers and current availability for decisions; not every input has a dedicated independent branch assertion, and exhaustive combinations are not claimed. BQ1–7 directly verify actual supplier water-quality prioritization and API safety boundaries. Many acceptance criteria intentionally combine API correctness and actual customer presentation; API helper tests cannot close the latter. Actual native APK/runtime evidence is separately recorded; live provider and external academic evidence remain explicitly distinguished.
