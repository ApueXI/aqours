# Aqours first-release implementation goal

Original request: implement the complete documented first release (2026-10-18), not scaffolding or mock screens. Read PROGRESS first, all instructions, docs index, four references, three role summaries, sixteen feature specs; this discovery is complete. Original sources remain [requirements](../docs/requirements.md), [feature index](../docs/README.md), [architecture](../docs/architecture.md), [schema](../docs/schema.md), [workspace](../docs/workspace.md). Prior completed documentation state is preserved in [archive](archive/docs-goal-2026-10-18/GOAL.md).

## Scope and constraints

Express TypeScript/PostgreSQL + Expo 57 Android + React/MapLibre supplier app; every required documented first-release workflow. User adopts proposed one-supplier/accounts/roles/transitions/metrics/rules defaults and explicitly authorizes necessary local dependencies. No AI, public registration, paid provisioning, deployment, global installs, external edits or secret collection. Academic acceptance is externally unverified. Missing provider credentials must not block unrelated work. Preserve existing Expo setup and unrelated work; branch feature/aqours-first-release; commit verified features. TS physical line limits API 200/web 250/mobile 300. All generated files/caches stay project-local; .env files/secret-bearing values must not be read or altered.

Shared contracts: [API](../docs/api.md), [DTOs](../aqours-contracts/src/index.ts). Independent package/lockfile per project plus local file dependency for public contracts; avoids changing existing Expo workspace resolution. Direct transactional notification insertion, UUIDs, SQL migrations and pg data access, cookie+CSRF web and opaque bearer mobile sessions, image-only uploads, exact 0.01 liter precision, on-demand source-signature freshness. No mock success in production paths.

## Acceptance criteria

| ID | Observable requirement | Verification method |
| --- | --- | --- |
| AC-001 | Repository/contracts: Shared DTOs, adopted defaults, configuration and isolated dependencies | Build contracts; compare clients and API; configuration inventory |
| AC-002 | Persistence: PostgreSQL migrations, FK/check/unique constraints, seed and volume/backup restore | Apply twice; exercise constraints; restart/recreate volume; restore backup |
| AC-003 | Identity/security: Hashed passwords, revocable sessions, browser CSRF/origin and secure Android storage | API authentication/role/expiry/revocation tests; Android restoration/logout |
| AC-004 | Ownership: Customer record/file/message/notification/guidance/assistance access is owner-scoped | Cross-account HTTP ID tampering and response projection checks |
| AC-005 | Reports/locations: All categories, clarification, images, address/GPS/geocoding with honest fallbacks | API behavior + web/Android paths, provider mock tests, live check pending credentials |
| AC-006 | Incidents: Confirmed links, histories, published-only snapshots, mark/still affected | Link/version/retry/independence integration tests and UI walkthrough |
| AC-007 | Advisories: Independent quality notices, explicit admin revision/lift, zone targets | Publish/rollback/deduplication/lift/staff-denial tests; client visibility |
| AC-008 | Guidance: API questionnaire/rules, explanations, alternatives, fresh source versions | Rule table + changed-source/history tests; no fulfillment side effects |
| AC-009 | Assistance: All three services, scheduling/rescheduling/assignment/outcomes/follow-up | Lifecycle/version/ownership tests; connected client walkthrough |
| AC-010 | Stock: Exact liters, transactional reservation/collection/release/cancellation | Real PostgreSQL concurrent approve/cancel/collect/stock edit + rollback tests |
| AC-011 | Notifications/profile: Persisted notifications, recipient dedupe, foreground refresh and profiles | Read/link/targeting/privacy API tests; account switch and polling UI |
| AC-012 | Supplier UI: Connected dashboard/inbox/map/incidents/advisories/queue/stock/settings | Type/lint/build/browser behavioral and rendered review |
| AC-013 | Android UI/native: Connected Expo Android screens, SecureStore, GPS/photos and native MapLibre APK | Type/lint/export; native Gradle build + emulator/device workflows when available |
| AC-014 | Administration: Accounts/connections/zones/guidance/rules with audit/version/session controls | API admin denial/conflict/change tests; connected forms |
| AC-015 | Resilience: Idempotency, conflicts, transaction rollback, errors and no false integration success | Concurrent same-key/payload mismatch/network/provider/rollback tests |
| AC-016 | Configuration/docs: Every consumed env documented, examples only, runnable setup/API/demo/native docs | Environment/source inventory; reproduce commands and links; secret scan |
| AC-017 | Requirement coverage: All 84 REQ IDs, 126 feature criteria and DEMO-001..010 traced to evidence | Traceability matrix, original requirements audit, explicit blocked required checks |
| AC-018 | Release discipline: Feature commits, accurate progress, stopped workers and integrated final review | Git commits/diff/status, line caps, final tests after integration |

## Coordinated projects and evidence

Root lead owns shared contracts, infrastructure, cross-project tests/docs, integration and all .loop writes. Project states: [API](../aqours-api/.loop/STATE.md), [mobile](../aqours-app/.loop/STATE.md), [web](../aqours-web/.loop/STATE.md). Full source criteria and demo mappings will be maintained in [traceability](../docs/traceability.md). A blocked required native/provider/persistence check prevents COMPLETE; skipped is never PASS.
