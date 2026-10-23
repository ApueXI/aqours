# Aqours API v1 contract

Implementation contract adopted 2026-10-18. Base `/api/v1`. Public DTOs/enums live in `aqours-contracts/src/`; build that local package before installing/building each app. Database models must never be serialized directly. Structured instants are ISO 8601 UTC; clients display Asia/Manila. Generated human-readable appointment/restoration labels in notification text/incident-card reasons are projected in Asia/Manila; stored history remains unchanged. IDs are UUIDs; public tracking/pickup references do not authorize access. All text is plain text.

## Transport and security

Success: `{data: T, page?: {offset,limit,total}, asOf?: string}`. Lists return `data: T[]`, offset default 0, limit default 30/max 100. Map uses its own cap metadata. Error: `{error:{code,message,details?}}`; HTTP 400 validation, 401 unauthenticated, 403 role/CSRF denial, 404 absent or foreign record, 409 conflict/stale version/idempotency mismatch/stock, 413 upload size, 415 invalid image, 429 rate limit, 503 provider unavailable.

`Idempotency-Key` is required on domain POST/PATCH mutations (not login/logout/guidance evaluation/read-state). Use a stable random UUID per intended action and reuse the key and exact payload on an uncertain response. Keys are scoped to actor+method+path; fingerprint conflicts are 409. Password-bearing account and self-service operations use a slow scrypt fingerprint for every password field before hashing the request; neither plaintext passwords nor a fast password-only verifier are retained in operations. Commit result, domain writes, history and notifications together; retain keys without automatic expiry in this release. PATCH and state-changing commands require `expectedVersion` from the current DTO, returning 409 if stale; idempotency replay precedes version validation. Clients reject malformed success envelopes and retain the original intention after an uncertain response.

`POST /auth/login` body `{email,password,client:"web"|"mobile"}`. Web permits staff/admin; mobile permits customer. Web establishes an HttpOnly SameSite=Lax cookie and returns `{user,csrfToken}`. Mobile returns `{user,token}`; store token using SecureStore. `GET /auth/session` returns `{user,csrfToken?}` for restoring sessions. `GET /me` returns User; `GET /me/connections` returns owned Connection[]. `POST /auth/logout` revokes presented session and clears cookie (repeat safe). Bearer authorization is for mobile; browser uses `credentials:"include"` and `X-CSRF-Token` on mutations. Validate web login origin and cookie mutations against configured exact web origin. Expiry defaults to seven days; role/account changes revoke all that user's sessions. Never expose cookie/bearer credentials in URLs/logs/browser storage. Development allows HTTP only on local environments; production requires HTTPS/secure cookies.

## Customer and shared reads

Authenticated current weather, seven-day forecasts and Philippine city search are available to all existing roles. See [weather endpoints, DTOs and errors](weather.md#api-contract). Customer connection-ID lookups enforce ownership before accessing cached forecasts. Staff/admin additionally use `GET /weather/psgc-locations` (no query parameters) and exclusive `GET /weather?psgcCode=<ten-digit-city-or-municipality-code>`. The backend resolves the representative point from the bundled catalog; customers receive 403 for these supplier modes. Unknown codes return 400 and missing coordinates return 422/`location_unavailable` without provider access. Existing city-search, coordinate and customer connection contracts remain available.

| Method/path | Body/query | Response `data` / authorization |
| --- | --- | --- |
| GET /zones | — | Active Zone[] (customer-safe boundaries, no households) |
| GET /reports | category/status/from/to, pagination | Owned Report[] |
| POST /reports | `{connectionId,category,description,noticedAt,location?:LocationInput,answers?:{details?:string}}` | Report, initial received; omitted location uses connection snapshot; alternate zone remains unconfirmed |
| GET /reports/:id | — | Owned ReportDetail; published incident fields only |
| POST /reports/:id/messages | `{text}` | Message; owner or staff; staff message sets first-response event |
| POST /reports/:id/still-affected | `{expectedVersion,reason}` | Report; only resolved report returns under_review |
| POST /reports/:id/attachments | multipart `file`, max 5 MiB JPEG/PNG | Attachment; magic/content and decode validation; protected bytes |
| GET /attachments/:id | — | Image bytes, private/no-store; report ownership/staff; no public storage paths |
| GET /incidents | pagination | PublishedIncident[]; published snapshots only |
| GET /incidents/:id | — | PublishedIncident; no private reports/notes |
| POST /incidents/:id/affected | `{connectionId}` | Owned Report; dedupe customer+connection+incident independent of operation key |
| GET /advisories | `includeLifted=true` optional, pagination | Targeted Advisory[] through explicit owned connections or confirmed owned zones; default current. `includeLifted=true` includes upcoming/past published and lifted notices, excludes drafts |
| GET /advisories/:id | — | Applicable published/lifted Advisory history; never drafts |
| POST /locations/geocode | `{address}` | GeocodeCandidate[] with signed expiring confirmation token; server Geoapify key; upstream failures 503 with address fallback |
| GET /pickup-sessions | optional `reportId`, pagination | Eligible PickupSession[], including full/cancelled examples; report must be owned and options use its reviewed zone. Without reportId, options use confirmed owned connection zones. No private allocation data |
| POST /assistance-requests | `{reportId,type,details:AssistanceDetails}` | Requested AssistanceRequest; unique active customer/report/type |
| GET /assistance-requests | type/status/pagination | Owned AssistanceRequest[] |
| GET /assistance-requests/:id | — | Owned AssistanceRequest incl timeline/allocation/session |
| POST /assistance-requests/:id/cancel | `{expectedVersion,reason}` | AssistanceRequest; requested/accepted/scheduled only; releases reservation once |
| POST /reports/:id/guidance | `{answers?:{needsWater?:boolean,hazard?:boolean,persistent?:boolean,nearbyAffected?:"yes"|"no"|"unknown",waterNeededBy?:string}}` | New Guidance with persisted source signature/rule evidence, no fulfillment mutation |
| GET /guidance/:id | — | Owned Guidance; recompute signature and mark current=false if sources changed |
| POST /guidance/:id/choice | `{action:"callback"|"inspection"|"water_support"|"decline"}` | Records choice only; no request |
| GET /notifications | pagination | Owned Notification[] |
| GET /notifications/:id | — | Owned Notification |
| PATCH /notifications/:id/read | `{}` | Notification; repeat-safe, no domain effect |

`Report.accuracy` is nonnegative GPS accuracy in meters, or null for unknown/legacy/non-GPS records. An explicitly confirmed alternate point still needs independent supplier zone review; coordinate confirmation never confirms its supply zone.

Saved location and alternate issue location remain independent. `geocoded_address` confirmed coordinates require the candidate token bound to address+coordinates and expiry. GPS is optional; denied/unavailable GPS, geocoder and map failures allow address-only reporting. Never invent coordinates. Photos upload after report commit: retain report reference on photo failure and retry only the attachment using the same operation key.

Customer advisory `connectionIds` contains only explicitly targeted connections owned by the caller. Other household IDs are excluded; `zoneIds` stays public context, and clients match only their confirmed zones. Planned dates are display context for quality notices and never substitute for explicit lifting.

Public `TimelineEvent.appointmentChange?: {from:string|null,to:string}` is present only on valid scheduling/rescheduling events. Both instants are UTC; arbitrary internal audit metadata is never exposed. Customers and supplier history render old/new agreed Manila times alongside the reason. Notification DTOs use a field allowlist, retain the documented sourceEventKey and exclude arbitrary private metadata.

`answers` accepts only the optional category-specific `details` string, trimmed and limited to 2,000 characters. Report and ReportDetail expose it as `guidedDetails: string | null` to the owner and supplier reviewer; arbitrary internal answer objects are never projected. Guidance cards include `sourceType` (`advisory`, `incident`, `rule`, `guidance` or `pickup`) with source ID/revision, reason and optional supported action. Source type identifies authorized advisory navigation separately from ordinary recommendation actions. A water-support recommendation is a possible next action; it neither accepts a request nor reserves liters.

## Supplier operations (staff or admin)

All `/staff` reads/mutations reject customer sessions. Operational `/staff/users` lists safe staff/admin identities for owner selection; `/staff/connections` reads customer connection context. `GET /staff/zones` returns all zones.

| Method/path | Body/query | Response `data` |
| --- | --- | --- |
| GET /staff/reports, GET /staff/reports/:id | category/status/from/to/zoneId/ownerId/priority/pagination | Report[] / ReportDetail with customer, notes, suggestions |
| PATCH /staff/reports/:id | `{expectedVersion,status?,ownerId?,priority?,reason,closureOutcome?,zoneId?,zoneConfirmed?}` | Report; append history, require reviewed closure reason; priority reason mandatory |
| POST /staff/reports/:id/messages | `{text}` | Message; customer visible |
| POST /staff/reports/:id/notes | `{text}` | Note; staff only |
| POST /staff/reports/:id/link | `{expectedVersion,incidentId:string|null,reason}` | Report; retain old/new link history; suggestions never auto-link |
| GET /staff/map/reports | `west,south,east,north,category?,status?,from?,to?,zoneId?,limit?` | MapResponse; finite ordered non-antimeridian bounds, cap max 1000, unlocated count |
| GET /staff/metrics | `from?,to?,category?,status?` | Metrics, cohort submitted>=from and <to, arithmetic mean seconds and samples, pending/null durations |
| GET /staff/incidents, GET /staff/incidents/:id | pagination | StaffIncident[] / StaffIncident detail |
| POST /staff/incidents | `{category,summary,zoneIds,area,ownerId?,geometry?,restorationAt?,estimatedAffected?,estimateBasis?,demo?}` | StaffIncident investigating |
| PATCH /staff/incidents/:id | `{expectedVersion,reason,status?,ownerId?,summary?,zoneIds?,area?,geometry?,restorationAt?,estimatedAffected?,estimateBasis?}` | StaffIncident |
| POST /staff/incidents/:id/notes | `{text}` | Note |
| POST /staff/incidents/:id/updates | `{expectedVersion,progress,area,restorationAt:string|null,geometry?}` | IncidentUpdate; explicit publish; snapshot current status, fan-out linked owners once |
| GET /staff/assistance-requests, GET /staff/assistance-requests/:id | type/status/ownerId/from/to/pagination | AssistanceRequest[] / detail |
| POST /staff/assistance-requests/:id/transition | `{expectedVersion,status,reason?,ownerId?,appointmentAt?,outcome?,nextSteps?}` | AssistanceRequest; assigns owner at acceptance; water reserves same transaction |
| POST /staff/assistance-requests/:id/notes | `{text}` | Note |
| GET /staff/pickup-sites | pagination | PickupSite[] |
| POST /staff/pickup-sites | `{name,address,instructions,latitude?,longitude?,active?,demo?}` | PickupSite |
| PATCH /staff/pickup-sites/:id | `{expectedVersion,reason,name?,address?,instructions?,active?,latitude?,longitude?}` | PickupSite |
| GET /staff/distribution/sessions | pagination | PickupSession[] with stock breakdown |
| POST /staff/distribution/sessions | `{siteId,zoneIds,startsAt,endsAt,totalLiters,instructions,demo?}` | PickupSession open |
| PATCH /staff/distribution/sessions/:id | `{expectedVersion,reason,totalLiters?,startsAt?,endsAt?,instructions?,status?:"open"|"closed",zoneIds?}` | PickupSession; cannot reduce below commitments |
| POST /staff/distribution/sessions/:id/cancel | `{expectedVersion,reason}` | PickupSession; atomic release/unavailable notifications incl pending requests |
| POST /staff/water-allocations/:id/collect | `{expectedVersion,reason?,outcome,nextSteps}` | AssistanceRequest; expectedVersion refers request; scheduled/in_progress or accepted with reason; unique collection |

## Administration (admin only writes)

Operational staff may read `/staff/advisories` and `/staff/settings/guidance` / `rules`; account administration reads require admin except `/staff/users` safe owner list. All settings/account writes and advisory lifecycle writes are admin only.

| Method/path | Body/query | Response `data` |
| --- | --- | --- |
| GET /staff/advisories, GET /staff/advisories/:id | pagination | Advisory[] / detail incl drafts/revisions |
| POST /staff/advisories | `{kind,title,text,source,zoneIds,connectionIds?,geometry?,startsAt?,endsAt?,demo?}` | Draft Advisory |
| PATCH /staff/advisories/:id | `{expectedVersion,reason,...contentFields}` | Advisory; draft edit or explicit published revision; retain immutable versions and notify; cannot remove/change quality restriction kind/targets without explicit lift |
| POST /staff/advisories/:id/publish | `{expectedVersion}` | Published Advisory; atomic fan-out independent of submitted reports |
| POST /staff/advisories/:id/lift | `{expectedVersion,reason}` | Lifted Advisory; no automatic end-time lift for quality notices |
| GET /staff/settings/accounts | pagination | User[] safe fields |
| POST /staff/settings/accounts | `{email,name,password,role,phone?,connection?}` | User; optional customer connection is created atomically |
| PATCH /staff/settings/accounts/:id | `{expectedVersion,reason,name?,phone?,role?,active?,password?}` | User; security changes revoke all sessions; retain ownership/history; forbid demoting/deactivating last admin |
| GET /staff/settings/connections | pagination | Connection[] |
| POST /staff/settings/connections | `{customerId,reference?,address,zoneId?,zoneConfirmed,latitude?,longitude?}` | Connection; customer role must match |
| PATCH /staff/settings/connections/:id | `{expectedVersion,reason,address?,zoneId?,zoneConfirmed?,latitude?,longitude?}` | Connection; preserve historical report snapshots |
| GET /staff/settings/zones | — | Zone[] |
| POST /staff/settings/zones | `{code,name,boundary?,active?,demo?}` | Zone |
| PATCH /staff/settings/zones/:id | `{expectedVersion,reason,name?,boundary?,active?}` | Zone; refuse deactivation with active references |
| GET /staff/settings/guidance | — | ApprovedGuidance[] immutable versions |
| POST /staff/settings/guidance | `{kind,text,source}` | ApprovedGuidance next version; does not publish advisory |
| GET /staff/settings/rules | — | RuleVersion[] |
| POST /staff/settings/rules | `{contactText,inspectionText,waterText}` | Next immutable activated RuleVersion; server-defined supported actions/safety precedence cannot be overridden |
| GET /staff/audit | pagination | Staff-only audit event[] (never credentials) |

## Workflow and numerical choices

Reports progress received→under_review→in_progress→resolved; reviewed duplicate/invalid can close any unresolved report with outcome/reason. A substantive closure requires in_progress. Customer still-affected is resolved→under_review and retains first resolution. Incidents follow investigating→confirmed→work_in_progress→monitoring→resolved; corrective transition to investigating requires reason, and no incidental report/advisory mutation. All expectedVersion edits reject concurrent stale work.

Assistance requested→accepted→scheduled→in_progress→completed. Accepted→in_progress requires immediate-support reason. Scheduled or in_progress→scheduled records reschedule reason and appointment; a water appointment must fall within its pickup session interval. Requested/accepted/scheduled→cancelled or unavailable require reason; staff can mark in_progress unavailable with reason. Completed requires outcome and nextSteps. Water completion uses collection endpoint, never a generic transition that bypasses allocation. Session cancellation marks pending/uncollected water support unavailable (including in_progress) and preserves collected outcomes. Customer cancellation stops when work first enters in_progress; rescheduling does not erase that start boundary.

Liters are decimal strings with at most two fractional digits, maximum 1,000,000,000.00. Store NUMERIC(14,2), use SQL exact arithmetic for authority. Every stock mutation locks session, then request, then allocation; non-water request mutations lock request. Idempotency locks precede domain locks. Reserve at acceptance, collection transfers reserved→collected, release reserved→released, never delete ledger rows. All publication/transition notifications are direct inserts in the same PostgreSQL transaction, unique recipient+event key.

Quality advisories remain active irrespective of startsAt/endsAt until explicit lift, including on the supplier map; scheduled/general notices respect effective dates. Current guidance is evaluated on demand with a source signature including report version, incident/publication revisions, advisory versions/lift state, rule version, zone/connection context and report-eligible stock versions. Private immutable evidence also contains the `aqours-rules-1` engine discriminator; evaluations made with a different discriminator become stale. Historical GET marks current=false after changes. Clients must hide old cards during failed refresh and show support fallback. Synthetic safety content is a demonstration fixture and never real public guidance.

## PSGC address contract

See [locations and maps](location-and-maps.md) for the bundled PSGC catalog, guided/free-text address behavior, nullable snapshots, detailed basemap configuration, and verification boundaries.


## Distribution monitoring

Staff/admin monitoring endpoints reuse cookie/bearer authentication, record validation, response envelopes and operation-key handling. The single-supplier configuration must resolve unambiguously. Customer access is denied. See [monitoring behavior](distribution-monitoring.md) and [monitoring DTOs](../aqours-contracts/src/monitoring.ts).

| Method/path | Input | Response |
| --- | --- | --- |
| GET /staff/distribution/monitoring | — | MonitoringOverview: supplier, Manila dates, all site forecasts/current supply/configuration/day evaluations/active warnings, temperature bands |
| GET /staff/pickup-sites/:id/forecast | Site UUID | SiteForecast with status, retained forecast, last attempt/success, next refresh and error |
| POST /staff/pickup-sites/:id/forecast/refresh | `{}` | `{queued:boolean}`; respects cache/cooldown and never promises an upstream refresh already completed |
| PATCH /staff/pickup-sites/:id/monitoring | `{expectedVersion,enabled,warningTemperature,criticalTemperature,lowSupplyLiters,criticalSupplyLiters,capacityLiters,reason}` | SiteMonitoringConfig; expectedVersion0 for initial setup; capacity nullable; liter fields exact decimal strings |
| GET /staff/distribution/warnings | Optional siteId, date, state, offset, limit | Paginated MonitoringWarning[]; state active/resolved/expired/suspended |
| GET /staff/distribution/warnings/:id | Warning UUID | `{warning,history}` with immutable evidence revisions |
| GET /staff/distribution/temperature-bands | — | `{version,boundaries}`; four ordered Celsius boundaries |
| PATCH /staff/distribution/temperature-bands | `{expectedVersion,boundaries,reason}` | TemperatureBands; admin only, expectedVersion0 initially |
| GET /staff/distribution/notifications | Pagination | Current actor's supplier monitoring notifications only |
| POST /staff/distribution/notifications/:id/read | `{}` | Owned SupplierMonitoringNotification, retained read timestamp |

Writes require an operation key; versioned edits reject stale state. Missing records return404, invalid inputs400, denied roles403 and ambiguous supplier configuration503. Forecast provider failures are represented in SiteForecast freshness/error metadata while current supply remains separately readable. A read enqueues missing/due site forecasts but does not hold an inventory transaction across a provider request. Existing city/customer weather endpoints retain their earlier contract.

## Workflow update — 23 October 2026

See [account, notification, conversation and customer workflow corrections](workflow-feedback.md) for current account/connection provisioning, optional generated connection numbers, recipient-owned supplier alerts, conversation indexes, customer tabs, question submission and password changes. Existing data is preserved; no schema migration or dependency changes are required.
