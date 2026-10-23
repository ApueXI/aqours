# Distribution monitoring and early warnings

User approved the detailed plan in this conversation on 2026-10-22 and invoked loop-engineer with a maximum of five delivery cycles. Root coordinates API, web and contracts as components of this repository. No external continuation runner.

## Agreed contract
- Reuse existing sites, sessions, exact-decimal stock, weather normalization/provider, Leaflet and notification storage. No dependencies or mobile redesign.
- Single supplier; fail on ambiguous supplier configuration. Existing staff/admin operate its sites, admin alone edits temperature legend settings. Server verifies scope before record/cache access.
- Available for reservation sums total minus reserved minus collected across open/unexpired sessions, including future sessions. No eligible sessions means unavailable. No physical inventory or consumption prediction.
- Monitoring-first Distribution tabs: Monitoring, Sessions, Sites, Warning history. Reservation lookup available throughout; compact session table with selected editing, existing forms/actions preserved.
- Site setup required; suggest35/38 Celsius but no automatic activation. Require temperature critical>warning, supply0<=critical<low, optional positive capacity. Available/capacity ratio is a planning ratio and may exceed100%.
- Durable seven-day Open-Meteo forecasts; hourly refresh, three-request concurrency, bounded retry, last-attempt/success separately. Stale after failed refresh, unavailable for new temperature evaluation after6h. Coordinates invalidate cache.
- Independent daily maximum temperature and current supply evaluations. Combined warnings when both trigger; highest severity. Trigger equality, deduplicate, retain immutable history, resolve only on fresh normal evidence; distinguish expiry/suspension.
- Persistent work revisions/leases survive restart and multiple API processes. Stock/site/config mutations queue reevaluation transactionally; healthy delay<=5s and minute time sweep. Fetch outside inventory transactions; protect evaluations from concurrent updates.
- Reuse notification storage; all active staff/admin get consolidated per-site trigger/escalation/resolution notifications. Separate supplier-only reads/read state from customer notifications.
- Leaflet sites green normal/yellow warning/red critical/gray unavailable, explicit completeness. Timeline Manila7days changes forecast risk, never predicts supply. Independent site temperature circles/labels and configurable default boundaries25/30/34/37. No regional surface/interpolation.
- Streets osm-bright, Light positron, Dark dark-matter via existing public Geoapify key/attribution; custom configured base remains usable. Independent tile changes preserve map state/markers/overlay.
- Additive migrations, monitoring disabled initially; preserve existing data and workflows. No secret/env value inspection, new package, paid provisioning or ordinary database changes.

## Acceptance
| ID | Observable requirement | Verification method |
| --- | --- | --- |
| AC-001 | Durable site forecasts, retry/freshness/coordinate invalidation | API unit + PostgreSQL/provider fixture tests |
| AC-002 | Exact reservable stock aggregation with correct session eligibility | Decimal/unit + real stock lifecycle tests |
| AC-003 | Versioned site thresholds and admin legend settings, role/scope enforcement | HTTP permission/validation/conflict tests |
| AC-004 | Independent and combined warnings, dedup, lifecycle and immutable history | Unit boundary + PostgreSQL concurrency/repeat/failure tests |
| AC-005 | Durable scheduled work/leases/revisions, restart recovery and shutdown | Real worker integration tests |
| AC-006 | Supplier notifications consolidated/deduplicated/owned | HTTP and persistence tests |
| AC-007 | Monitoring-first accessible UX and preserved distribution operations | Chromium forms/navigation/mobile tests |
| AC-008 | Leaflet status markers/site selection/list fallback and complete popups | Real Leaflet browser tests |
| AC-009 | Seven-date URL state and independent map styles/temperature overlay | Browser timeline/style/legend/toggle tests |
| AC-010 | Existing API/web/contracts/mobile compatibility | Relevant types/lint/build/unit + existing HTTP/browser regressions |
| AC-011 | Accurate docs, migration/setup/demo/progress, feature commit | Docs links/repository/diff review + commit |

## Delivery sequence
Cycle1: contracts; parallel backend/frontend implementation; focused checks. Cycle2: integrated behavior, worker corrections and tests. Cycles3-5 only as necessary for evidence-backed corrections/acceptance. Count complete delivery/review passes, not individual shell commands. Stop by cycle5 with truthful checkpoint if anything remains.
