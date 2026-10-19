# Requirement and acceptance traceability

Updated 19 October 2026. This is an evidence map, not a blanket acceptance certificate. It preserves all **84 REQ identifiers**, **126 original feature acceptance identifiers** and **ten DEMO scenarios**. Their authoritative wording remains in [requirements](requirements.md) and the sixteen linked specifications. Original unchecked boxes remain unchanged.

Source implementation, API assertions, browser interaction and actual Android behavior are separate evidence. The named tests below exist and are executable; their latest run/result belongs in [verification](verification.md), not this inventory. A reference proves only its actual assertions, not every phrase in the associated criterion. Client unit tests exercise helpers; typecheck/lint/build never certify individual UI criteria. The HTTP context and database error-redaction regressions are included in final verification; consult the run ledger for their outcomes.

“Pending” identifies a required manual or missing executable check. The lead reports a successful signed dual-architecture debug APK build; standalone release APK also passes; installed emulator/device workflows, live Geoapify and academic approval remain separate pending gates; this file does not preempt the verification ledger if later evidence arrives. See [setup](setup.md), [demo walkthrough](demo.md), [API contract](api.md) and [Android guide](../aqours-app/README.md).

## Implementation module key

Each module key in a row resolves to these real files; it is not a hypothetical route/table name.

| Key | Implemented modules |
| --- | --- |
| AUTH | [aqours-api/src/auth.ts](../aqours-api/src/auth.ts); [aqours-api/src/routes/auth.ts](../aqours-api/src/routes/auth.ts); [aqours-web/src/hooks/useSession.ts](../aqours-web/src/hooks/useSession.ts); [aqours-app/src/auth/session.tsx](../aqours-app/src/auth/session.tsx) |
| REPORT | [aqours-api/src/routes/reports.ts](../aqours-api/src/routes/reports.ts); [aqours-api/src/routes/report-review.ts](../aqours-api/src/routes/report-review.ts); [aqours-api/src/services/reports.ts](../aqours-api/src/services/reports.ts); [aqours-web/src/pages/ReportDetail.tsx](../aqours-web/src/pages/ReportDetail.tsx); [aqours-app/src/features/reports/report-form.tsx](../aqours-app/src/features/reports/report-form.tsx) |
| FILE | [aqours-api/src/routes/attachments.ts](../aqours-api/src/routes/attachments.ts); [aqours-app/src/features/reports/photos.tsx](../aqours-app/src/features/reports/photos.tsx); [aqours-web/src/components/AttachmentViewer.tsx](../aqours-web/src/components/AttachmentViewer.tsx) |
| LOCATION | [aqours-api/src/services/geocode.ts](../aqours-api/src/services/geocode.ts); [aqours-app/src/features/location/location-picker.tsx](../aqours-app/src/features/location/location-picker.tsx); [aqours-app/src/features/location/map-preview.native.tsx](../aqours-app/src/features/location/map-preview.native.tsx) |
| MAP | [aqours-api/src/routes/analytics.ts](../aqours-api/src/routes/analytics.ts); [aqours-web/src/pages/MapPage.tsx](../aqours-web/src/pages/MapPage.tsx); [aqours-web/src/map/MapCanvas.tsx](../aqours-web/src/map/MapCanvas.tsx); [aqours-web/src/map/layers.ts](../aqours-web/src/map/layers.ts) |
| INCIDENT | [aqours-api/src/routes/incidents.ts](../aqours-api/src/routes/incidents.ts); [aqours-api/src/routes/incident-publication.ts](../aqours-api/src/routes/incident-publication.ts); [aqours-web/src/pages/IncidentDetail.tsx](../aqours-web/src/pages/IncidentDetail.tsx); [aqours-app/src/features/home/incident-screen.tsx](../aqours-app/src/features/home/incident-screen.tsx) |
| NOTICE | [aqours-api/src/routes/advisories.ts](../aqours-api/src/routes/advisories.ts); [aqours-api/src/services/advisories.ts](../aqours-api/src/services/advisories.ts); [aqours-web/src/pages/Advisories.tsx](../aqours-web/src/pages/Advisories.tsx); [aqours-web/src/components/AdvisoryEditor.tsx](../aqours-web/src/components/AdvisoryEditor.tsx) |
| GUIDE | [aqours-api/src/services/guidance.ts](../aqours-api/src/services/guidance.ts); [aqours-api/src/services/guidance-context.ts](../aqours-api/src/services/guidance-context.ts); [aqours-api/src/routes/guidance.ts](../aqours-api/src/routes/guidance.ts); [aqours-app/src/features/guidance/guidance-screen.tsx](../aqours-app/src/features/guidance/guidance-screen.tsx); [aqours-app/src/features/guidance/use-guidance.ts](../aqours-app/src/features/guidance/use-guidance.ts) |
| ASSIST | [aqours-api/src/routes/assistance.ts](../aqours-api/src/routes/assistance.ts); [aqours-api/src/routes/assistance-workflow.ts](../aqours-api/src/routes/assistance-workflow.ts); [aqours-web/src/pages/AssistanceDetail.tsx](../aqours-web/src/pages/AssistanceDetail.tsx); [aqours-web/src/components/AssistanceActions.tsx](../aqours-web/src/components/AssistanceActions.tsx); [aqours-app/src/features/assistance/assistance-detail.tsx](../aqours-app/src/features/assistance/assistance-detail.tsx) |
| STOCK | [aqours-api/src/services/stock.ts](../aqours-api/src/services/stock.ts); [aqours-api/src/routes/distribution.ts](../aqours-api/src/routes/distribution.ts); [aqours-api/src/routes/collection.ts](../aqours-api/src/routes/collection.ts); [aqours-web/src/pages/Distribution.tsx](../aqours-web/src/pages/Distribution.tsx); [aqours-app/src/features/assistance/pickup-options.tsx](../aqours-app/src/features/assistance/pickup-options.tsx) |
| SET | [aqours-api/src/routes/settings.ts](../aqours-api/src/routes/settings.ts); [aqours-api/src/routes/settings-accounts.ts](../aqours-api/src/routes/settings-accounts.ts); [aqours-api/src/routes/settings-connections.ts](../aqours-api/src/routes/settings-connections.ts); [aqours-web/src/pages/Settings.tsx](../aqours-web/src/pages/Settings.tsx) |
| HOME | [aqours-app/src/features/home/home-screen.tsx](../aqours-app/src/features/home/home-screen.tsx); [aqours-app/src/app/(customer)/profile.tsx](../aqours-app/src/app/%28customer%29/profile.tsx); [aqours-app/src/features/notifications/notifications-screen.tsx](../aqours-app/src/features/notifications/notifications-screen.tsx); [aqours-app/src/hooks/use-resource.ts](../aqours-app/src/hooks/use-resource.ts) |
| METRIC | [aqours-api/src/routes/analytics.ts](../aqours-api/src/routes/analytics.ts); [aqours-api/src/services/metrics.ts](../aqours-api/src/services/metrics.ts); [aqours-web/src/pages/Overview.tsx](../aqours-web/src/pages/Overview.tsx) |
| DATA | [aqours-api/migrations/001_initial.sql](../aqours-api/migrations/001_initial.sql); [aqours-api/migrations/002_stock_and_record_integrity.sql](../aqours-api/migrations/002_stock_and_record_integrity.sql); [aqours-api/migrations/003_location_and_ledger_checks.sql](../aqours-api/migrations/003_location_and_ledger_checks.sql); [aqours-api/migrations/004_typed_stock_sessions.sql](../aqours-api/migrations/004_typed_stock_sessions.sql); [aqours-api/src/store.ts](../aqours-api/src/store.ts); [aqours-api/src/db.ts](../aqours-api/src/db.ts) |
| HTTP | [aqours-api/src/http.ts](../aqours-api/src/http.ts); [aqours-api/src/validation.ts](../aqours-api/src/validation.ts); [aqours-api/src/app.ts](../aqours-api/src/app.ts); [aqours-api/src/services/projection.ts](../aqours-api/src/services/projection.ts); [aqours-contracts/src/index.ts](../aqours-contracts/src/index.ts) |
| SEED | [aqours-api/src/seed.ts](../aqours-api/src/seed.ts); [aqours-api/src/seed-identities.ts](../aqours-api/src/seed-identities.ts); [aqours-api/src/seed-operations.ts](../aqours-api/src/seed-operations.ts); [aqours-api/src/seed-services.ts](../aqours-api/src/seed-services.ts) |
| OPS | [compose.yaml](../compose.yaml); [scripts/backup.sh](../scripts/backup.sh); [scripts/restore.sh](../scripts/restore.sh); [aqours-api/src/migrate.ts](../aqours-api/src/migrate.ts); [aqours-app/app.config.ts](../aqours-app/app.config.ts); [aqours-app/eas.json](../aqours-app/eas.json) |

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
| H-G2 | [verification/advisories-guidance.test.ts](../verification/advisories-guidance.test.ts) | area notice audiences need no report and publication/read retries never duplicate notifications |
| H-G3 | [verification/advisories-guidance.test.ts](../verification/advisories-guidance.test.ts) | DEMO-003: rules retain evidence, apply safety precedence and choices never create assistance |
| H-G4 | [verification/advisories-guidance.test.ts](../verification/advisories-guidance.test.ts) | guidance source revisions invalidate history and current evaluation includes the latest source |
| H-G5 | [verification/advisories-guidance.test.ts](../verification/advisories-guidance.test.ts) | unconfirmed zones remain uncertain, failed/missing geocoder configuration returns honest error |
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

### Actual rendered map checks

Root `npm run test:map` runs [verification/browser-map.ts](../verification/browser-map.ts) against the real keyless public style and production supplier build. All five checks passed.

| Key | Actual checked behavior |
| --- | --- |
| LM1 | Live public demo style loads in real MapLibre/WebGL and requests viewport data |
| LM2 | Zoom changes query bounds without changing report priority, version or incident association |
| LM3 | Rendered point at the persisted longitude/latitude opens its authorized report |
| LM4 | No uncaught JavaScript exceptions during actual map rendering and selection |
| LM5 | Selecting a real two-report cluster expands its viewport without writes, merging or changing either persisted report |

### Manual checks and recorded boundaries

| Key | Required manual procedure and evidence |
| --- | --- |
| M1 | O1 records actual initial isolated seed counts and persistence. O4 checks all 14 salted fixture credentials/roles,12 owned connections,3 zones/2 sites, four categories, unknown/still-affected and available/full/cancelled scenarios/future end dates. API/browser role logins passed; native all-account presentation remains M2/M3. |
| M2 | Installed Android sign-in/cold start/SecureStore/account switch; invalid login, expired/revoked session, offline logout/retry. Supplier login throttling/network failure and production HTTPS cookie checks are separate subchecks. Record each result, not one generic pass. |
| M3 | Installed Android Home/report/detail/profile/notifications links and empty/error/revoked/private states; inspect exact owned fields, all-page data, demo labels, foreground refresh and account isolation. |
| M4 | Present each published quality restriction on actual Android Home and guidance; resolve an outage, complete assistance, pass end time, refresh, then explicitly lift and refresh. Verify old notice history stays distinguishable. |
| M5 | Installed Android GPS allow/deny/timeout, saved/address-only reporting, actual live signed Geoapify candidate, native preview confirmation, identical persisted web/native point, basemap failure, zoom/cluster invariance, map filters/caps/unlocated list. Live candidate success is unavailable without private operator-provided credentials. |
| M6 | Actual web-to-Android callback/inspection/water request lifecycle including owner, agreed appointment, reschedule, reasons, findings/outcome/next steps, notification text and cancellation; inspect no-stock alternative, exact liters, pickup reference and independent report/incident/advisory state. |
| M7 | H-Q1–3 and H-F1–2 execute outage/restoration/needed-by, assessment/hazard/persistence, conflicting quality guidance and changed incident/advisory/stock freshness tables. Remaining actual Android card/refresh/alternative interaction is separate. Get academic acceptance separately; technical tests cannot grant it. |
| M8 | H-M1, H-P1–3 and H-V1–2 directly assert exact cohorts, full documented role matrix, private projections, audit and combined independence. BM1–8 and BR-AUTH/DASH/MAP/SET cover actual supplier maintenance, conflicts, failure recovery, filters and immutable settings. Additional exhaustive permutations are not implied by those assertions; native/device/live-provider/academic boundaries remain separate. H-I1–3, H-N1–2 now directly verify repeated affected, link races, two reports/one connection with one-owner publication, report-free overlapping connection audience and advisory rollback. BO1–7 additionally verify exact two-owner inbox, unlocated review, protected-photo decoding/retry and incident create/edit/link/unlink. Native/device/live-provider checks above remain unexecuted; no exhaustive unlisted permutation is claimed. |
| M9 | Actual client uncertain transport/report/photo retry with the same operation identity and payload; known conflict recovery; inspect persisted IDs/counts after ambiguous results. In-memory intentions do not survive application process/browser reload. |

## Stable requirements

The row note states the scope actually supported and its residual checks. “API covered” is limited to the named assertions. Conditional/deferred requirements remain in the inventory and are never silently marked implemented.

| Requirement | Modules | Executable evidence / manual check | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| REQ-SCOPE-01 | REPORT, INCIDENT, GUIDE | H-R1, H-R2, H-G3 | API behavior covered; integrated native actions and academic acceptance pending. |
| REQ-SCOPE-02 | HTTP, AUTH, HOME | B1; project typecheck/build commands | Structure/static/build evidence; installed Android acceptance pending. |
| REQ-SCOPE-03 | OPS, DATA, MAP, LOCATION | H-R4, U-G1–2; O1 | Database/map adapter covered; live Geoapify and native map pending. |
| REQ-SCOPE-04 | SEED, NOTICE, STOCK | H-G1, W-M1; M4 | Fictional fixture/source labels implemented; inspect every native presentation manually. |
| REQ-SCOPE-05 | SEED, AUTH | H-A3; O1 | One supplier/three roles implemented; no deadline acceptance inferred. |
| REQ-ACCESS-01 | SEED | H-A3; O1, O4; BW6, BR-SET-01–02 | All14fictional credentials/roles and12 connection owners checked; browser provision/maintenance passed. Native login/account switching remains M2. |
| REQ-ACCESS-02 | AUTH, SET | U-S1, H-S2, H-S3, H-A3; B1, B8 | Backend/browser covered; native secure restoration/logout pending. |
| REQ-ACCESS-03 | AUTH, HTTP, FILE | H-S1, H-S4, H-C1 | API ownership assertions; native deep-link UX pending. |
| REQ-ACCESS-04 | HTTP, REPORT, INCIDENT | H-S1, H-R2, U-T3, H-D6 | API public projection assertions; whole-client display review remains manual. |
| REQ-ACCESS-05 | AUTH | H-S3, W-C1; B6, B8; M2 | Cookie/CSRF covered; actual SecureStore/device failure states pending. |
| REQ-UI-C01 | HOME, NOTICE | C-P1–2, H-G1–2; M3 | Home data pagination/targeting covered; Android Home display/refresh pending. |
| REQ-UI-C02 | REPORT, LOCATION, FILE | H-R1, H-C2, H-S4, C-B5, C-B7; M3, M5 | API/client helpers covered; native form/GPS/map/photo interaction pending. |
| REQ-UI-C03 | REPORT, INCIDENT | H-S1, H-R2–3; M3 | Owned list/detail/messages API covered; native navigation/history pending. |
| REQ-UI-C04 | GUIDE | H-G3–5, H-C1; M3, M7 | Rules/API covered partly; Android action cards and academic acceptance pending. |
| REQ-UI-C05 | ASSIST, STOCK | H-A1–2, H-W1–6; M6 | API services covered; native request/timeline screens pending. |
| REQ-UI-C06 | HOME, AUTH | H-S1, H-S5, H-G2; M2–3 | Owned profile/notification API covered; Android presentation/account switching pending. |
| REQ-UI-S01 | METRIC | H-A5, H-D5, H-M1, U-T1; B1, BR-DASH-01–02 | Exact API cohorts and actual browser combined filters/null samples/drill-down/stale refresh passed. |
| REQ-UI-S02 | REPORT, FILE | H-R3, H-C2, H-S4, H-V1; B2–3, BM8, BO1–4, BR-MAP-01–02 | Actual two-owner inbox, unlocated urgent review, clarification, authenticated photo decode/failure/retry, link correction and filter retention passed. |
| REQ-UI-S03 | MAP | H-R4, W-M1; B5, LM1–5 | Real production map renders, expands a two-report cluster and opens a persisted authorized point; basemap-failure list and zoom invariance passed. |
| REQ-UI-S04 | INCIDENT | H-R2, H-I2–3, H-V1–2; BW5, BM8, BO5–7 | Actual browser incident create/edit/publication/link/unlink preserve audit/counts and unknown restoration; API snapshot/privacy/combined independence passed. |
| REQ-UI-S05 | NOTICE, SET | H-G1–2, H-A3–4; B4, BW6–9 | Account provision and advisory publish/revise/lift passed in the browser; other settings maintenance/native reception still needs its stated checks. |
| REQ-UI-S06 | ASSIST, STOCK | H-A1–2, H-W1–6; B4, BW1–4 | API workflows and actual browser callback scheduling/rescheduling/completion and reference-based collection passed; Android request/timeline remains pending. |
| REQ-REPORT-01 | REPORT, FILE | H-R1, H-C2, H-S4–5 | API category/details/location/image assertions; native entry/picker M3 pending. |
| REQ-REPORT-02 | LOCATION, REPORT | M5; H-S5 | Saved/unlocated API covered; actual Android denied GPS/fallback not yet executed. |
| REQ-REPORT-03 | LOCATION | U-G1–2; M5 | Signed adapter/candidate checks use mocks; live successful geocoding and GPS pending. |
| REQ-REPORT-04 | LOCATION, REPORT | H-G5, H-S5, H-D4, U-G2; M5 | Unlocated/provider failure assertions; full live quota/ambiguity and Android recovery pending. |
| REQ-REPORT-05 | DATA, LOCATION, MAP | U-S2, H-R4; LM3, M5 | Coordinate validation/order and actual web point selection passed; equal native preview and live geocoded point remain M5. |
| REQ-REPORT-06 | HTTP, FILE | H-S4, H-C2; BO3–4 | API validates controlled still images and ownership; actual supplier protected PNG retrieval/decode and aborted-download retry pass. Native picker/upload errors remain M3/M9. |
| REQ-REPORT-07 | HTTP, REPORT | H-R1, C-B5–6 | Concurrent same-key creation and client intention helpers covered; native timeout UX M9 pending. |
| REQ-REPORT-08 | REPORT, FILE, HTTP | H-R3, H-S1, C-B7, W-C1–5; B2, BO3–4 | Message privacy/replay and actual protected-photo failure/retry pass; native upload/transport recovery remains M9. |
| REQ-INCIDENT-01 | REPORT | H-R3; B3 | Isolated unlocated severe leak can be assigned/acknowledged without invented coordinates/zone; urgent reason, actor/time audit and stale rejection are asserted. |
| REQ-INCIDENT-02 | REPORT, INCIDENT | H-R2, H-I2; BM8, BO7 | Actual confirmed/corrected/unlinked associations retain reports/history; concurrent corrective links have one version winner and exact old/new audit. |
| REQ-INCIDENT-03 | MAP, INCIDENT | LM2 | Actual web zoom leaves report version, priority and association unchanged; native point/zoom remains M5. |
| REQ-INCIDENT-04 | INCIDENT, METRIC | H-I3, H-R2 | Exact two reports/one connection versus independent137-customer estimate and unknown estimate are asserted. |
| REQ-INCIDENT-05 | REPORT, INCIDENT, DATA | H-I1 | Concurrent and repeated affected assertions reuse one owned report, retain independent reports and one affected event. |
| REQ-INCIDENT-06 | INCIDENT, HTTP | H-R2, U-T3 | Published DTO/unknown restoration asserted; native update display M3 pending. |
| REQ-INCIDENT-07 | INCIDENT, NOTICE, DATA | H-I3, H-R2, H-N1–2, H-D2 | One-owner multiple linked reports, overlap-free zone audience, replay and publication rollback asserted; native polling receipt remains M3. |
| REQ-INCIDENT-08 | REPORT, INCIDENT | H-R2 | Individual follow-up and retained first resolution asserted; Android action M3 pending. |
| REQ-INCIDENT-09 | REPORT, INCIDENT, NOTICE, ASSIST | H-R2, H-G1, H-A1, H-W2 | Independent API outcomes asserted across scenarios; full combined native walkthrough M6 pending. |
| REQ-NOTICE-01 | NOTICE, HOME, SET | H-G1–2, W-M1, C-P1 | Targeted/current sources and old-page restrictions covered; scheduled-notice/native presentation M4 pending. |
| REQ-NOTICE-02 | NOTICE, GUIDE | H-G1, H-G3, W-M1 | Distinct restriction kinds/precedence asserted; real local content approval and native presentations M4 pending. |
| REQ-NOTICE-03 | NOTICE, AUTH | H-P2, H-V1, U-V1–2; BW7–9 | Every documented admin write denies staff; exact revision/lift actor/reason/time and immutable published history passed alongside browser publish/revise/lift. |
| REQ-NOTICE-04 | NOTICE, DATA, HOME | H-N1–2, H-G2 | True report-free two-connection zone audience deduplication and advisory-specific state/history/notification/operation rollback asserted; native receipt M3. |
| REQ-ASSIST-01 | ASSIST, DATA | H-A1, H-S1, H-C1 | Owner/duplicate active/owned report assertions; native history display M6 pending. |
| REQ-ASSIST-02 | ASSIST | H-A1–2, H-W2, H-E1–2 | Ordinary/immediate/reschedule paths, unsupported shortcuts, terminal reopening denial and first-work cancellation races passed; native interaction remains M6. |
| REQ-ASSIST-03 | ASSIST, GUIDE | H-A1, H-G3, H-C1 | Requested has no appointment/allocation; choices create no service. Native wording M6 pending. |
| REQ-ASSIST-04 | ASSIST, STOCK | H-A1–2, H-W2, H-W4–6 | Reasons/history and cancellation races asserted; all notification contents/native receipt M6 pending. |
| REQ-ASSIST-05 | ASSIST | H-A1–2; BW1–4, BM1–2 | Actual browser callback/inspection acceptance, appointments and completion passed; Android request/timeline remains M6. |
| REQ-ASSIST-06 | ASSIST, REPORT, NOTICE | H-A1, H-W2, H-V2 | Combined API fixture preserves completed assistance, resolved shared incident/other report and unlifted quality notice when only one report reopens; native presentation remains M6. |
| REQ-CALLBACK-01 | ASSIST | H-A1–2; BW1–3 | Contact details/reschedule API checked; native missed-call display and exact old/new event review M6 pending. |
| REQ-INSPECTION-01 | ASSIST | H-A1, H-S1; BM1–2 | Alternate site/access details, appointment, private-note exclusion, findings/next steps and independent report outcome passed in browser/API; native display remains M6. |
| REQ-WATER-01 | STOCK, ASSIST | H-C1, H-W1, W-F1; M6 | Report-zone options/exact liters covered; Android list/address/time/instructions interaction pending. |
| REQ-WATER-02 | STOCK, SEED | H-W1–6; BM6–7; M1/M6 | Browser site/session creation, versioned edits, exact availability and confirmed cancellation passed. Fresh two-site native maintenance walkthrough remains M1/M6. |
| REQ-WATER-03 | STOCK, DATA | H-W1, H-W3, H-D1, U-S3 | Concurrent reservation/exact quantity/rollback assertions; Android reference display M6 pending. |
| REQ-WATER-04 | STOCK, DATA | H-W2–3; BW4 | Exact ledger transfer and repeat collection asserted; native fulfillment display M6 pending. |
| REQ-WATER-05 | STOCK, DATA | H-W2, H-W4–6, H-E3; BM7 | Request/session cancellation versus acceptance/collection preserve exact stock; browser cancellation notifies both reserved and pending owners once. Native receipt remains M6. |
| REQ-WATER-06 | STOCK, GUIDE | H-G5, H-W1, H-W5; M6 | Unavailable/race paths covered partly; every full/no-session callback-card presentation pending. |
| REQ-WATER-07 | ASSIST, STOCK | M6; source review | Pickup-only implementation; no delivery/commerce scope is claimed. |
| REQ-DECISION-01 | GUIDE | H-Q1–3, H-F1–2, H-G3–4, H-C1 | Outage/needs/time/stock and assessment/conflicting-restriction tables plus immutable freshness sources asserted; Android cards/academic approval remain M7. |
| REQ-DECISION-02 | GUIDE, NOTICE | H-G3 | Official guidance first, escalation, reasons/sources asserted; native card buttons M3 pending. |
| REQ-DECISION-03 | GUIDE, STOCK | H-Q1, H-C1 | Five-row known-outage table covers unknown/earlier/later need, no need, unavailable stock and callback fallback. |
| REQ-DECISION-04 | GUIDE | H-Q2 | Low pressure, leak hazard and post-restoration persistence offer assessment with no automatic report change. |
| REQ-DECISION-05 | GUIDE, REPORT | H-Q2–3, H-C2 | Hazard details reach staff; safe explained assessment/escalation and official instruction precedence asserted. Android CTA interaction remains M7. |
| REQ-DECISION-06 | GUIDE, NOTICE, REPORT | H-G1, H-G3; M7 | Published quality guidance covered; manual staff prioritization/native review and real-content approval pending. |
| REQ-DECISION-07 | GUIDE, LOCATION | H-Q3, H-G5 | Conflicting official notices are retained in safety order with escalation/uncertainty; unknown-zone support asserted. |
| REQ-DECISION-08 | GUIDE, ASSIST | H-G3 | Decline/inspection choice causes no request; native explicit assistance submission M6 pending. |
| REQ-DECISION-09 | GUIDE, SET | H-F1–2, H-G4 | Incident publication, advisory publication/revision/lift, stock reserve/release/total and rule changes invalidate immutable history; Android refresh remains M7. |
| REQ-DECISION-10 | GUIDE | M7; source/scope review | Conditional future AI requirement: not applicable to implemented no-AI release; academic approval external. |
| REQ-OPS-01 | AUTH, HTTP, FILE | H-P1–3, H-V1–2, H-S3–4, U-S1–6, U-O1–2, H-D7; BR-AUTH-01–06 | Full supplier role matrix, exact throttle/generic-error/cookie attributes, browser auth failure/recovery and private-field sentinels passed. Actual HTTPS deployment is outside implemented local verification. |
| REQ-OPS-02 | LOCATION, MAP, REPORT | B5, C-B2, C-B7, U-G2; M5, M9 | Browser map fallback and helper failures covered; native denied-GPS/upload/tiles recovery pending. |
| REQ-OPS-03 | OPS, DATA, SEED | O1, O2 | Docker persistence and isolated backup/restore recorded in verification; repeat on target environment. |
| REQ-OPS-04 | DATA, ASSIST | W-F2, C-B8, H-A5 | Manila conversion/invalid dates and API timezone asserted; all native/audit rendering M3/M6 pending. |
| REQ-OPS-05 | DATA, REPORT, INCIDENT, SET | H-R3, H-V1–2, H-A4, H-G4, H-D1–2; BM3, BM8, BO2, BO5–7 | Transactional histories/rollback and exact actor/time/reason audit verified for report review, incident create/edit/link, advisory revision/lift, zone and settings; broader permutations are not implied. |
| REQ-OPS-06 | MAP, HTTP | H-R4, H-D4, U-T2, H-S1; LM2, LM5 | Bounds/filter/cap/privacy API and real rendered cluster/zoom without writes passed; complete combined-filter UI fixture remains M5. |
| REQ-OPS-07 | LOCATION, MAP, OPS | U-G1–2; M5 | Mock provider success/failure covered; live provider credentials/attribution/device map pending. |
| REQ-OPS-08 | HTTP, DATA | H-P1–3, H-V1, U-T2–3, W-P1–2, C-P1–2, C-B1 | Documented endpoint role inventory and literal customer DTO key sets are directly asserted; pagination/validation/transport checks remain distinct from native presentation. |
| REQ-OPS-09 | OPS, LOCATION | O3 | Actual debug and standalone release native APKs pass with MapLibre, ARM64+x86_64, v2 signatures and embedded release JS; installed target checks remain M2–6. |
| REQ-METRIC-01 | METRIC, REPORT | H-M1, H-A5, H-R2, H-D5 | Exact unresolved/category counts, reviewed invalid/duplicate exclusions and reopened reports asserted in an isolated historical cohort. |
| REQ-METRIC-02 | METRIC, INCIDENT | H-M1, H-I3 | Six-report/two-connection exact category cohort and separate two-report/one-connection/137 affected-estimate incident assertions passed. |
| REQ-METRIC-03 | METRIC, REPORT | H-M1, H-A5, H-R3 | First public response ignores notes/customer messages/later responses; exact pending/sample/mean and null empty/unanswered cohorts asserted. |
| REQ-METRIC-04 | METRIC, REPORT | H-M1, H-A5, H-D5, U-T1, H-R2 | Exact disjoint sampled/excluded/pending resolution cohorts retain genuine first resolution after reopening; API filters and read-only behavior asserted. |
| REQ-DEMO-01 | SEED | O1, O4; BW6, BR-SET-01–02 | All original fixture credentials/roles/owned connections and coherent categories/stock checked; not an all-account native login claim. |
| REQ-DEMO-02 | SEED, INCIDENT, REPORT | O1, O4; M3 | All four categories and unknown/still-affected fixture records checked; actual native presentation remains M3. |
| REQ-DEMO-03 | SEED, STOCK, ASSIST | O1, O4; H-A1, H-W1–6, H-E1–3; BW1–4, BM1–2, BM6–7 | Seed freshness/available/full/cancelled stock and API/browser assistance paths checked. Complete native scenario remains M6. |

## Original feature acceptance criteria

These identifiers and criteria remain unchanged in their source specs. The descriptions below focus on test scope/gaps; they do not replace or weaken original acceptance wording. No criterion receives a blanket PASS from this table.

### [admin/advisory](features/admin/advisory/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| SUP-ADV-01 | NOTICE, SET | H-N1, BW7 | True report-free zone-only audience with two matching connections receives one notice; browser publication passed. Android reception remains M4. |
| SUP-ADV-02 | NOTICE, SET | H-P1–2, H-G1, H-N2, U-V1–2 | All documented role-denied advisory mutations and target/session locks are asserted; advisory-specific rollback/recovery preserves all recipients/state. |
| SUP-ADV-03 | NOTICE, SET | H-G1, W-M1 | API kinds/layer filtering; both native presentations M4 pending. |
| SUP-ADV-04 | NOTICE, SET | H-G1, H-A1 | Separate outcome assertions; complete combined-state native scenario M4 pending. |
| SUP-ADV-05 | NOTICE, SET | H-V1; BW9 | Explicit lift actor/reason/time, exact published/revised/lifted immutable history and same-key replay are directly asserted; actual browser lift passed. |
| SUP-ADV-06 | NOTICE, SET | H-N1–2, H-G2 | Two matching connections produce one recipient notification; same-key publication replay remains deduplicated. Lift replay/native reception require stated follow-up. |
| SUP-ADV-07 | NOTICE, SET | H-N2 | Advisory-specific injected fan-out failure leaves state/version/revisions/events/operation/notifications unchanged; same-key recovery commits once. |
| SUP-ADV-08 | NOTICE, SET | H-F1, BW8 | Actual browser revision and API-specific publication/revision/lift freshness asserted; Android stale-card polling remains M7. |
| SUP-ADV-09 | NOTICE, SET | H-V1, H-S1, U-T3 | Literal public incident/advisory/report key sets and private sentinels exclude draft text/notes, other-household details, coordinates/contact and future private fields. |

### [admin/assistance](features/admin/assistance/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| SUP-ASSIST-01 | ASSIST, STOCK | H-A1, H-W2; BW1–4 | API lifecycles; all owner notification contents and native receipt M6 pending. |
| SUP-ASSIST-02 | ASSIST, STOCK | H-A1; BW1 | Owner and active duplicate API assertions; browser/native display M6 pending. |
| SUP-ASSIST-03 | ASSIST, STOCK | H-A1–2, H-E1; BW2 | Reasoned reschedule/immediate-support and first-work cancellation boundary survive later appointments; native missed-contact/history wording remains M6. |
| SUP-ASSIST-04 | ASSIST, STOCK | H-A1, H-S1; BM1–2 | Actual browser inspection preserves site/access details and findings/next steps while hiding private notes from owned API results; native display remains M6. |
| SUP-ASSIST-05 | ASSIST, STOCK | H-A2, H-E1 | Immediate support requires a reason; unsupported shortcuts and terminal reopening fail without changing history; native presentation remains M6. |
| SUP-ASSIST-06 | ASSIST, STOCK | H-A1–2, H-W2, H-W4, H-E1–3 | Cancellation stops at first work even after reschedule, and cancel/start/collect races have one authoritative outcome; native recovery remains M6. |
| SUP-ASSIST-07 | ASSIST, STOCK | H-W1, H-D1, H-C1 | Overspend/rollback/session eligibility covered; no-option UI alternative M6 pending. |
| SUP-ASSIST-08 | ASSIST, STOCK | H-W4–6, H-A2, H-E2–3 | Cancel-versus-first-start and session-cancel-versus-collection preserve one winner/event/notification; complete native concurrency UX remains M6. |
| SUP-ASSIST-09 | ASSIST, STOCK | H-S1 | Foreign request/read/cancel denied; full linked-record/native deep-link matrix M6 pending. |
| SUP-ASSIST-10 | ASSIST, STOCK | H-A1, H-W2, H-V2; BW3, BM2 | Completed callback/inspection and combined API report/incident/advisory outcomes remain independent; native presentation remains M6. |

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
| SUP-DIST-01 | STOCK, ASSIST, DATA | H-W1–6, H-C1; BM6–7 | Browser creates/edits site/session and verifies exact labeled customer availability/cancellation. Native labeled options and two-site walkthrough remain M6. |
| SUP-DIST-02 | STOCK, ASSIST, DATA | H-W1 | Direct concurrent 80/100-liter assertion. |
| SUP-DIST-03 | STOCK, ASSIST, DATA | H-W2; BW4 | Direct 60/40 reservation, collection and release assertion. |
| SUP-DIST-04 | STOCK, ASSIST, DATA | H-D1 | Injected notification failure asserts request/allocation/history/operation rollback. |
| SUP-DIST-05 | STOCK, ASSIST, DATA | H-W2 | Same-key collection replay/new-key duplicate/released collection covered. |
| SUP-DIST-06 | STOCK, ASSIST, DATA | H-W4 | Direct customer cancel versus collection race. |
| SUP-DIST-07 | STOCK, ASSIST, DATA | H-W5–6, H-W4, H-E3; BM7 | Session cancellation versus collection has one irreversible collected/released result; reserved/pending browser cancellation also passes. |
| SUP-DIST-08 | STOCK, ASSIST, DATA | H-W3, U-S3 | Exact decimals and commitments guard asserted. |
| SUP-DIST-09 | STOCK, ASSIST, DATA | H-G5, H-W1, H-W5 | Related unavailable/race assertions; full/cancelled/no-option customer UI M6 pending. |
| SUP-DIST-10 | STOCK, ASSIST, DATA | H-S1, H-L1, H-A1, H-W2 | Direct foreign allocation tampering, customer collection denial and independent report outcome are asserted; combined native states remain M6. |

### [admin/incident](features/admin/incident/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| SUP-INC-01 | INCIDENT, REPORT | H-R2; BO5–7 | Actual browser creates/edits incident, links two distinct owners and later unlinks one without deleting either personal report or history. |
| SUP-INC-02 | INCIDENT, REPORT | H-R2; BM8 | Browser suggestions leave report unlinked until confirmation; confirmation/correction preserve reference and exact old/new association audit. |
| SUP-INC-03 | INCIDENT, REPORT | H-I2 | Two simultaneous corrective links yield exactly one version winner and one409; exact old/new association history retained. |
| SUP-INC-04 | INCIDENT, REPORT | H-R2; BW5 | Published owned context and one notification per owner; native timelines M3 pending. |
| SUP-INC-05 | INCIDENT, REPORT | H-R2, H-D2 | Same-key update replay and fault rollback/recovery asserted. |
| SUP-INC-06 | INCIDENT, REPORT | H-V1, H-S1, U-T3 | Literal published DTO fields and private sentinels exclude draft/internal geometry, notes, contacts and other-household report/answer/address/coordinate data. |
| SUP-INC-07 | INCIDENT, REPORT | H-G1 | Direct resolved incident leaves quality restriction current. |
| SUP-INC-08 | INCIDENT, REPORT | H-R2 | Direct single-report follow-up preserves incident/other report status. |
| SUP-INC-09 | INCIDENT, REPORT | H-I3; BO6–7 | Exact two-reports/one-connection independent estimate fixture and actual browser two-owner/connection counts versus17-customer estimate remain distinct after unlink. |
| SUP-INC-10 | INCIDENT, REPORT | H-F1 | An incident publication invalidates prior immutable guidance and current evaluation uses the new progress; Android refresh remains M7. |

### [admin/map](features/admin/map/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| SUP-MAP-01 | MAP, LOCATION | H-R4, U-G2; LM1, LM3 | Actual web selection uses persisted longitude/latitude; live Geoapify and matching native preview remain M5. |
| SUP-MAP-02 | MAP, LOCATION | H-S5, H-D4; BR-MAP-01 | Actual browser unlocated-only list retains unknown report while API features omit it; no fabricated point or inferred zone. |
| SUP-MAP-03 | MAP, LOCATION | H-R4, U-T2; BR-MAP-01–02, LM2 | Actual combined category/status/period/viewport records and map/detail/inbox filter retention pass; invalid/cap filters and real zoom tested separately. |
| SUP-MAP-04 | MAP, LOCATION | LM2, LM5 | Actual web cluster expansion/zoom send no writes and preserve both independent reports, versions, priorities and incident links; native comparison remains M5. |
| SUP-MAP-05 | MAP, LOCATION | H-R3, B3, LM3 | Urgent isolated review and actual rendered point selection open authorized report; native preview remains M5. |
| SUP-MAP-06 | MAP, LOCATION | H-P1 | All49 supplier endpoints, including household markers and staff detail, reject unauthenticated and customer requests before data or commands. |
| SUP-MAP-07 | MAP, LOCATION | B5, BR-MAP-03 | Actual tile-failure list/navigation and query-failure error/list recovery pass; failed queries never show an empty successful map. |
| SUP-MAP-08 | MAP, LOCATION | H-R4 | Invalid/NaN bounds and visible response cap/truncation asserted. |

### [admin/report](features/admin/report/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| SUP-REPORT-01 | REPORT, FILE | H-R2, H-S1; BO1 | Two exact new customer references visibly appear in supplier inbox; each customer list/detail includes only its owner and denies the other ID. |
| SUP-REPORT-02 | REPORT, FILE | H-R3; BO2 | Actual browser acknowledges/assigns urgent unlocated report without invented zone/coordinates, preserving message and reason/time history. |
| SUP-REPORT-03 | REPORT, FILE | H-R3; B3, BO2 | Reason-required urgent isolated review retains exact actor/time API audit and visible reason/time UI; stale writes cannot overwrite it. |
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
| SUP-SET-06 | SET, AUTH, GUIDE | H-G4, H-D6; BR-SET-03–04 | Browser immutable rule/guidance creation preserves exact historical versions and actual API stale/current evaluations. Android refresh remains M7. |
| SUP-SET-07 | SET, AUTH, GUIDE | H-Q1–3, H-F1–2; BR-SET-03–04 | Safety precedence/uncertainty/freshness tables pass; browser settings edits do not publish/lift notices and original content is restored by appended versions. Academic acceptance remains external. |
| SUP-SET-08 | SET, AUTH, GUIDE | U-S5, U-O1, H-A3; BM4–5 | Two browser editors produce visible409 without overwrite; aborted administrative write retries the identical original key/body. |

### [customer/assistance](features/customer/assistance/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| ASSIST-C-01 | ASSIST, STOCK | H-A1, H-C1 | Requested callback/inspection/water have no appointment/allocation; native forms M6 pending. |
| ASSIST-C-02 | ASSIST, STOCK | H-A1, H-W2; BW1–4 | API fulfillment; owner Android timeline/outcome interaction M6 pending. |
| ASSIST-C-03 | ASSIST, STOCK | H-A1, H-E1 | Active same-type duplicates fail; distinct later same-type requests are accepted after cancelled/unavailable/completed history, which remains intact. |
| ASSIST-C-04 | ASSIST, STOCK | H-L1, H-S1, H-C1 | Customers cannot collect or create supplier pickup sites; foreign request access and tampered allocation IDs fail without stock/state changes. Native UX remains M6. |
| ASSIST-C-05 | ASSIST, STOCK | H-W1, H-W3 | Concurrent approvals/reference/liters asserted; native display M6 pending. |
| ASSIST-C-06 | ASSIST, STOCK | H-W2, H-W4, H-E3 | Release occurs once, repeat collection fails and session-cancel/collect has one exact irreversible outcome; native cancellation remains M6. |
| ASSIST-C-07 | ASSIST, STOCK | H-W5, H-G5 | Session cancellation outcomes covered; every affected-customer reason/alternative UI M6 pending. |
| ASSIST-C-08 | ASSIST, STOCK | H-A1–2; BW2 | Reschedule and missed callback API paths; exact appointment metadata/native history M6 pending. |
| ASSIST-C-09 | ASSIST, STOCK | H-W4–6, H-E2–3, H-A1–2, C-B2; BM5 | Cancel/start/collect races and frozen browser uncertain-write retries pass. Actual native report/photo ambiguous transport recovery remains M9. |

### [customer/auth](features/customer/auth/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| AUTH-C-01 | AUTH, HOME | H-S1, H-S5 | Distinct owned API contexts; actual two-account Android restore/history clearing M2 pending. |
| AUTH-C-02 | AUTH, HOME | H-S3, C-B2 | Credential/network helper errors; actual Android protected-screen recovery M2 pending. |
| AUTH-C-03 | AUTH, HOME | H-S1, H-S4 | API ownership covered; native foreign deep-link response M2 pending. |
| AUTH-C-04 | AUTH, HOME | H-S2, C-B6 | Server logout and intention isolation covered; actual next-account SecureStore/cache M2 pending. |
| AUTH-C-05 | AUTH, HOME | H-D3, H-S2 | Expiry/revocation API portions; interrupted native logout/retry M2 pending. |

### [customer/dashboard](features/customer/dashboard/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| HOME-C-01 | HOME, NOTICE | H-S1, H-G2, C-P1 | Owned/targeted API and all-page reads; actual Home presentation M3 pending. |
| HOME-C-02 | HOME, NOTICE | H-G1, C-P1 | Restriction/lift API and old-page read covered; Android refresh M4 pending. |
| HOME-C-03 | HOME, NOTICE | H-G5, C-P2 | Unknown zone and failed-page helpers; empty/error Android views M3 pending. |
| HOME-C-04 | HOME, NOTICE | H-S1 | Foreign detail denied; every native shortcut navigation M3 pending. |
| HOME-C-05 | HOME, NOTICE | C-B6 | Intention isolation only; actual account/context clearing and all native demo labels M2/M3 pending. |

### [customer/guidance](features/customer/guidance/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| GUIDE-C-01 | GUIDE, STOCK | H-Q1, H-C1 | Five-row outage/restoration/needed-by/no-need/stock table and report-zone pickup options asserted; Android presentation remains M7. |
| GUIDE-C-02 | GUIDE, STOCK | H-Q1, H-F1 | No eligible stock yields uncertainty and callback, no water-support card; native fallback action remains M7. |
| GUIDE-C-03 | GUIDE, STOCK | H-Q2 | Low pressure, leak hazard and post-resolution persistence offer assessment; escalation matches hazard and report state remains independent. |
| GUIDE-C-04 | GUIDE, STOCK | H-G3, H-G1 | API precedence and independent quality lifecycle; Android card freshness M4 pending. |
| GUIDE-C-05 | GUIDE, STOCK | H-Q3, H-G5 | All conflicting quality notices remain in safety order with explicit uncertainty/escalation; unknown-zone support asserted. |
| GUIDE-C-06 | GUIDE, STOCK | H-G3 | Decline/inspection choice has zero assistance side effects; native explicit form handoff M6 pending. |
| GUIDE-C-07 | GUIDE, STOCK | H-F1–2, H-G4 | Changed incident/advisory/rule/stock evidence makes old evaluation noncurrent while retaining exact historical cards; native hiding remains M7. |
| GUIDE-C-08 | GUIDE, STOCK | H-S1, H-G3, H-D6, U-T3 | Foreign evaluation/history and projection portions; complete field matrix M7 pending. |
| GUIDE-C-09 | GUIDE, STOCK | H-G3–4, H-D6 | Source/version/evidence persistence asserted; exhaustive scenario explanations/academic approval M7 pending. |

### [customer/notifications](features/customer/notifications/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| NOTIFY-C-01 | HOME, NOTICE, INCIDENT, ASSIST | H-I3, H-R2 | Two linked reports for one connection/owner receive one publication notice; two distinct owners also receive their own updates. |
| NOTIFY-C-02 | HOME, NOTICE, INCIDENT, ASSIST | H-N1 | A brand-new customer with no reports and two matching connections receives one zone-only publication; unrelated customer cannot read it. |
| NOTIFY-C-03 | HOME, NOTICE, INCIDENT, ASSIST | H-S1 | Foreign get/read denied and list owner-scoped; direct all-notification-list payload audit M3 pending. |
| NOTIFY-C-04 | HOME, NOTICE, INCIDENT, ASSIST | H-G2, H-R2 | Repeated reads/publication do not duplicate; actual foreground polling/domain invariance M3 pending. |
| NOTIFY-C-05 | HOME, NOTICE, INCIDENT, ASSIST | H-A2, H-W5 | Related reasoned transitions/cancel outcomes; exact notification text/Android current link M6 pending. |
| NOTIFY-C-06 | HOME, NOTICE, INCIDENT, ASSIST | H-D3, C-B2, H-G4 | API/helper failure/freshness portions; full native recovery matrix M3 pending. |

### [customer/profile](features/customer/profile/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| PROFILE-C-01 | HOME, AUTH, REPORT | H-S5 | Owned API connection context; native profile fields M3 pending. |
| PROFILE-C-02 | HOME, AUTH, REPORT | H-S5, H-S1 | Foreign connection use/record denied; modified/deep-link profile UI M3 pending. |
| PROFILE-C-03 | HOME, AUTH, REPORT | H-S5, H-A4 | Alternate issue/saved address/history snapshot assertions. |
| PROFILE-C-04 | HOME, AUTH, REPORT | H-S5, H-D4 | Null/unconfirmed data retained; native reporting/profile state M3/M5 pending. |
| PROFILE-C-05 | HOME, AUTH, REPORT | H-S2, C-B2, C-B6 | Revocation/network/intention helpers; actual Android account switch stale-profile prevention M2 pending. |

### [customer/report](features/customer/report/spec.md)

| Criterion | Modules | Exact test/check key | Evidence boundary and outstanding work |
| --- | --- | --- | --- |
| REPORT-C-01 | REPORT, LOCATION, FILE, INCIDENT | H-R1–2, H-S1 | Report received/reference/time and distinct owners; two actual Android submissions M3 pending. |
| REPORT-C-02 | REPORT, LOCATION, FILE, INCIDENT | H-S1, H-S4 | Foreign report/message/photo/follow-up API denied. |
| REPORT-C-03 | REPORT, LOCATION, FILE, INCIDENT | H-R4, U-G1–2 | API point/mock candidate portions; actual denied GPS and matching native/web map M5 pending. |
| REPORT-C-04 | REPORT, LOCATION, FILE, INCIDENT | H-G5, H-S5, U-G2 | Unknown zone/missing provider/forged candidate assertions; all live ambiguity/quota cases M5 pending. |
| REPORT-C-05 | REPORT, LOCATION, FILE, INCIDENT | H-S4, C-B7; B5 | API upload replay/client photo intention and web fallback; actual native tiles/upload recovery M5/M9 pending. |
| REPORT-C-06 | REPORT, LOCATION, FILE, INCIDENT | H-R2, H-S1, U-T3 | Published owned incident/private fields API; actual native history M3 pending. |
| REPORT-C-07 | REPORT, LOCATION, FILE, INCIDENT | H-I1 | Five concurrent independent-key assertions and repeated affected action return the same owned personal report/event and preserve an unrelated report. |
| REPORT-C-08 | REPORT, LOCATION, FILE, INCIDENT | H-R2, H-G1 | Individual follow-up and quality independence separately tested; combined Android action M3 pending. |
| REPORT-C-09 | REPORT, LOCATION, FILE, INCIDENT | H-A5, H-D5; M3 | Reviewed closure/metric API; native reviewed-outcome labels pending. |

## Ten original demonstration scenarios

[demo.md](demo.md) preserves the exact original scenario wording and gives reproducible instructions. API scenario names identify covered subsets; a name containing DEMO does not prove an installed Android walkthrough.

| Scenario | Modules | Existing executable/operator evidence | Remaining acceptance |
| --- | --- | --- | --- |
| DEMO-001 | REPORT, MAP, AUTH | H-R1–2, H-S1; BO1, LM1–5 | Exact two-owner supplier inbox and real rendered web map passed separately; two actual Android submissions/owned native history remain M3/M5. |
| DEMO-002 | INCIDENT, DATA, HOME | H-R2, H-D2, H-I3; BW5 | Two-owner and one-owner/two-report publication dedupe passed; actual Android timeline/notification rendering remains M3. |
| DEMO-003 | GUIDE, ASSIST | H-G3–5, H-C1, H-Q1–3, H-F1–2 | Rule decision/source freshness tables passed; actual native actions and academic acceptance remain M7. |
| DEMO-004 | NOTICE, INCIDENT, ASSIST | H-G1, H-V1–2; BW7–9 | Combined API state/quality independence and actual browser explicit lift passed; Android Home/guidance presentations remain M4. |
| DEMO-005 | REPORT, INCIDENT | H-R2, H-V2 | Combined API still-affected independence passed; native action and related display remain M3/M4. |
| DEMO-006 | AUTH, HTTP, FILE | H-S1, H-S4, H-G3, H-D6 | Native deep links, every field/destination and account switching: M2/M3. |
| DEMO-007 | LOCATION, MAP, DATA | U-G1–2, U-S2, H-R4, H-S5, H-G5 | Actual denied GPS, live successful Geoapify and equal native/web rendering: M5; unavailable without device/provider setup. |
| DEMO-008 | ASSIST, STOCK | H-A1–2, H-W2 | Each full supplier-to-native service/timeline/appointment/outcome flow: M6. |
| DEMO-009 | STOCK, DATA, ASSIST | H-W1–6, H-E3, H-D1; BW4, BM6–7 | Concurrent acceptance/cancel/collect and exact browser stock/collection passed; native reference/unavailability/notification display remains M6. |
| DEMO-010 | HTTP, DATA, OPS | H-R1–2, H-W2/5, H-D1–2, O1, O2; BM5 | Actual frozen browser retry and isolated restore/private-image access passed; native report/photo ambiguous retry remains M9. |

## Coverage gaps that must remain visible

Previously missing repeated affected assertions, corrective-link races, two-reports/one-connection counts, report-free zone audiences and advisory fan-out rollback are now directly exercised by H-I1–3 and H-N1–2. H-Q1–3/H-F1–2 cover rule decisions/source invalidation, and H-E1–3/H-M1 cover remaining workflow races and exact metric cohorts. Required native and live-provider checks remain open; each row retains its actual proof boundary. H-P1–3/H-V1–2 and BR-AUTH/DASH/MAP/SET now cover those additional supplier/security boundaries. No API/browser evidence substitutes for the remaining native walkthrough, live Geoapify or external academic review.

The rules include category/zone/time in retained context and use category, published sources, answers and current availability for decisions; not every input has a dedicated independent branch assertion. No exhaustive rule-table or water-quality staff-prioritization UI check has run. Many acceptance criteria intentionally combine API correctness and actual customer presentation; API helper tests cannot close the latter. Native APK/emulator/device, live provider and external academic evidence must be recorded separately when available.
