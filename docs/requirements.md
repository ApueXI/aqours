# Requirements

Source: **Water Supply Reporting and Customer Assistance — Project Brief v0.4**, supplied by the project owner and updated **18 October 2026**. This document retains the original product requirements and stable identifiers, reconciled with the first-release implementation on 19 October 2026. See the [index and feature specs](README.md), [architecture](architecture.md) for boundaries and technology, [schema](schema.md) for the implemented Prisma relational persistence design, and [workspace](workspace.md) for workflows and local setup.

## Status and scope

The 18 October baseline contained an Expo starter and empty API/web directories. The first release now implements the Express/PostgreSQL API, React supplier workspace and connected Expo customer workflows. Source presence is not full acceptance: [traceability](traceability.md) maps requirements to code/evidence, and [verification](verification.md) records executed checks and remaining Android, provider and operational gaps.

The project owner adopted the proposed first-release defaults: one supplier, seeded individual accounts, customer/staff/admin permissions, explainable API rules/questionnaire/action cards, workflows, REST contracts and metric definitions. Academic approval remains externally unverified. Optional/deferred items remain outside this release. No AI is implemented.

Requirement identifiers and the ten DEMO scenarios remain stable; the 126 feature checkboxes remain the original acceptance inventory. An implemented path does not certify every scenario or failure case. Read the [API contract](api.md), [setup](setup.md) and [demo](demo.md) alongside these requirements.

| ID | Requirement |
| --- | --- |
| REQ-SCOPE-01 | Connect a water supplier with customers who report outages, low pressure, leaks, and water-quality concerns, receive incident updates, and choose useful next actions. Success includes a submitted and trackable report, a supplier-managed shared incident, and a contextual recommendation with a reason and a usable action. The adopted rules-based approach is implemented; academic acceptance remains externally unverified. |
| REQ-SCOPE-02 | Use TypeScript, Express in `aqours-api/`, React in `aqours-web/`, and React Native with the existing Expo setup in `aqours-app/`. The customer product targets Android only. Keep the existing directories; a workspace restructure is not required. |
| REQ-SCOPE-03 | Use containerized standard PostgreSQL, ordinary numeric coordinate columns, MapLibre GL JS for supplier maps, MapLibre React Native for Android maps, and Geoapify for typed-address geocoding. These choices are integrated in source/configuration; live Geoapify and installed Android/native map verification remain separate checks. |
| REQ-SCOPE-04 | Use sample customer records and fictional people, accounts, service zones, incidents, notices, restoration estimates, and availability. Visibly label synthetic incidents, notices, and seeded water availability as demonstration data. Do not present fictional safety notices as real public advice. |
| REQ-SCOPE-05 | **Adopted first-release default:** the first release serves one supplier, seeded customer accounts, and supplier staff/admin accounts. A one-week demonstration schedule is an assumption, not a confirmed deadline. |

## Domain vocabulary

| Term | Meaning and boundary |
| --- | --- |
| Customer | A person with an account linked to a sample service connection and saved service address. |
| Service connection | The account-associated water-service location used for customer ownership, zone matching, and deduplicated reporting counts. |
| Service zone | An explicit supplier-managed association used to match reports, incidents, notices, and sessions. A drawn polygon alone does not establish supply connectivity. |
| Report | One customer's record of a problem, with its own tracking reference, history, ownership, and outcome. |
| Incident | A supplier-managed event that may link many reports. Linking does not merge or delete the customers' reports. |
| Advisory | Published supplier guidance or a scheduled interruption notice. Water-quality restrictions have an explicit publication/lifting lifecycle independent of incident resolution. |
| Assistance request | A customer request for callback/support, site inspection, or water pickup/distribution support; it retains its own fulfillment lifecycle. |
| Pickup site / distribution session | A supplier-managed collection location and its operating session, availability, and stock. This is not a commerce order or home-delivery service. |
| Internal note / published update | Staff-only operational information / text deliberately made visible to the intended customers. These must remain separate. |

## Roles, identity, and access

The project owner adopted the following customer, staff and admin split for the first release. Express enforces these roles and record ownership; it introduces no additional roles.

| Capability | Customer | Staff | Admin |
| --- | --- | --- | --- |
| Sign in, sign out, view own profile | Own account | Own account | Own account |
| View saved service connections | Own connections | Operational access needed to handle reports and requests | Same operational access |
| Submit reports, reply, view photos and timelines | Own reports and permitted published content | Review operational reports; respond and manage them | Same operational access |
| View reports on the supplier map | No other customers' household locations | Yes | Yes |
| Acknowledge, assign, prioritize, link, and transition reports/incidents | Customer follow-up actions only | Yes, with audit history | Yes, with audit history |
| Publish incident progress updates | No | Yes | Yes |
| Request or cancel assistance | Own requests, subject to lifecycle limits | Process requests | Process requests |
| Manage pickup sites, sessions, stock, and collection | View listed options and own allocations | Yes | Yes |
| Publish or lift official advisories; maintain approved guidance and recommendation rules | Read applicable published content | Read/use approved content | Yes, explicitly authorized |
| Maintain demo accounts and service zones | No | Read operational information | Yes |
| Read internal notes and operational audit history | No | Authorized operational access | Authorized administrative access |

| ID | Requirement |
| --- | --- |
| REQ-ACCESS-01 | Seed individual customer accounts linked to sample service connections and saved addresses, and supply a documented demo account list. Development seed and demo instructions supply fictional accounts; no real credentials are included in these requirements. |
| REQ-ACCESS-02 | Support login, logout, profile viewing, and session revocation. Hash passwords on the server. Public self-registration is optional for the demo; no account-approval queue is required by the brief. Supplier-managed provisioning is the adopted default. |
| REQ-ACCESS-03 | Enforce roles and individual-record ownership in the API on every applicable read and mutation, including reports, attachments, messages, notifications, assistance requests, and their linked records. Changing an identifier must not reveal another customer's data. UI visibility alone is insufficient. |
| REQ-ACCESS-04 | Customer responses may expose owned report locations and published affected areas, incidents, and notices. They must not expose other households' raw coordinates, contact information, reports, or internal notes. Staff access remains restricted to authorized operations. |
| REQ-ACCESS-05 | Store mobile credentials in secure device storage. Browser authentication must protect credentials and state-changing requests. The API uses revocable hashed sessions; Android uses bearer sessions in SecureStore and the browser uses HttpOnly cookies plus Origin/CSRF checks. |

## Required screens

The first-release screens implement these capabilities; exact paths and layouts are in source and the feature specs. Full native acceptance remains subject to the verification ledger.

| ID | Customer screen | Required capability |
| --- | --- | --- |
| REQ-UI-C01 | Home | Current published notices applicable to the saved service address, a report shortcut, and open reports. |
| REQ-UI-C02 | Report form | Category, guided details, time noticed, saved address or optional GPS/alternate issue location, native MapLibre preview and confirmation, optional photos, and explicit submission/retry feedback. |
| REQ-UI-C03 | My reports and report detail | Owner-only list and detail with tracking reference, status, messages, linked incident, timeline, and a follow-up action. |
| REQ-UI-C04 | Assistance | Recommended action, explanation, supporting notice, last-updated time, and usable inspection, callback, or water-support request actions. The adopted method is API-evaluated explainable rules; academic acceptance is unverified. |
| REQ-UI-C05 | My assistance requests | Selected service, linked report, request status, appointment or pickup details, timeline, and permitted follow-up/cancellation actions. |
| REQ-UI-C06 | Notifications and profile | Persisted in-app updates, profile, and saved connection details. |

| ID | Supplier screen | Required capability |
| --- | --- | --- |
| REQ-UI-S01 | Overview | Active incidents, unresolved reports, category counts, and first-response/resolution metrics with explicit start/end events. |
| REQ-UI-S02 | Report inbox/detail | Filters, customer/connection details, acknowledgment, clarification messages, owner assignment, and priority with a recorded reason. |
| REQ-UI-S03 | Map dashboard | MapLibre report markers and display clusters, filters, service zones, and published affected-area polygons. Provide a usable list when the basemap fails. |
| REQ-UI-S04 | Incident detail | Linked reports, workflow/history, assigned staff member, internal notes, and deliberately published customer updates. |
| REQ-UI-S05 | Advisories/settings | Scheduled interruptions, approved guidance, service zones, and demo-account administration subject to the confirmed permission policy. |
| REQ-UI-S06 | Assistance queue/distribution | All three assistance types; owner assignment, acceptance/unavailability reasons, scheduling, progress, completion, pickup sites, and distribution sessions. |

## Reporting and location

| ID | Requirement |
| --- | --- |
| REQ-REPORT-01 | Accept categories `outage`, `low_pressure`, `leak`, and `water_quality`; capture description, time noticed, service connection or issue location, and optional photos. Keep the saved service address separate from the reported issue location. |
| REQ-REPORT-02 | Let the customer choose the saved address or foreground GPS; location permission denial must not prevent reporting. Collect no continuous background location. Show the location source and a native MapLibre preview/confirmation when coordinates are available. |
| REQ-REPORT-03 | Resolve typed addresses through server-side Geoapify lookup and require confirmation of a returned candidate. GPS provides device coordinates directly and does not require forward geocoding. Persist confirmed coordinates and reuse them in both clients. |
| REQ-REPORT-04 | Handle no result, ambiguous matches, quota limits, provider failure, and missing coordinates without inventing a location or falling back to `(0, 0)`. Retain the address/report for staff review. Flag missing/ambiguous coordinates and unconfirmed service zones; an alternate issue location must not silently inherit the saved address's zone. |
| REQ-REPORT-05 | Use WGS84 longitude/latitude, both present or both absent, with latitude in `-90..90` and longitude in `-180..180`. Convert to GeoJSON as `[longitude, latitude]` for web and native rendering. |
| REQ-REPORT-06 | The API validates required fields, accepted values, attachment type, and attachment size. Store uploads in controlled file/object storage with database metadata and ownership relationships. The API accepts decoded still JPEG/PNG/WebP images up to 5 MiB with a 25-million-input-pixel limit, reencodes them and stores protected bytes separately from report creation. |
| REQ-REPORT-07 | Make report creation safe to retry: repeated submission of the same operation must not create duplicate reports. On success, immediately show a tracking reference, submission timestamp, and initial `received` status. |
| REQ-REPORT-08 | Support customer/staff clarification messages and an owner-visible timeline. Keep staff-only notes outside customer messages and customer API responses. Failed network or photo upload operations need an explicit retry state rather than a false success. |

## Reports, incidents, and recovery

| Record | Required statuses | Additional rule |
| --- | --- | --- |
| Report | `received`, `under_review`, `in_progress`, `resolved` | Allow a reviewed closure outcome for duplicate or invalid reports. **Adopted first-release default:** retain the four status values and record a separate outcome/reason; duplicate/invalid closure is not successful service restoration. |
| Incident | `investigating`, `confirmed`, `work_in_progress`, `monitoring`, `resolved` | Record every transition with actor and time. Review and record corrective transitions rather than silently overwriting history. |
| Assistance request | `requested`, `accepted`, `scheduled`, `in_progress`, `completed`, `unavailable`, `cancelled` | Governed separately below. |

The report and incident status lists are confirmed; a complete transition/authorization matrix is to be finalized before workflow implementation. The ordinary incident progression follows the order shown. Required exceptions include individual follow-up review and reviewed duplicate/invalid closure.

| ID | Requirement |
| --- | --- |
| REQ-INCIDENT-01 | Staff acknowledges, assigns, reviews, and prioritizes reports, recording the reason for priority changes. A severe individual report remains eligible for priority review without nearby reports. |
| REQ-INCIDENT-02 | Suggest related reports using category, time, and service-zone/location context. Staff confirms links and can correct mistakes. A report has at most one current incident; retain link-change history. Linking must preserve each customer's report and ownership. |
| REQ-INCIDENT-03 | Map clusters are a display aid. Zoom-dependent clustering must not establish an outage, severity, actual boundary, supply connectivity, or an automatic report link. Use explicit service-zone associations and staff-confirmed relationships for matching. |
| REQ-INCIDENT-04 | Show unique reporting service connections separately from estimated affected customers. Never present report count, marker count, or cluster size as an estimate of all affected customers without a separate basis. |
| REQ-INCIDENT-05 | Let a customer mark themselves affected by a published incident while retaining a deduplicated personal report. A retry or repeated action must not create additional personal reports for the same affected assertion. |
| REQ-INCIDENT-06 | Customer-facing incident updates include status, affected area, publication time, latest progress, and a restoration estimate or an explicit unknown value. Distinguish published text from internal notes. |
| REQ-INCIDENT-07 | Publish an incident update once and notify linked reporters. Match area advisories independently to service connections; customers do not need to have submitted a report to receive an applicable area notice. Prevent duplicate notification deliveries when audiences overlap or an operation is retried. |
| REQ-INCIDENT-08 | Customer “still affected” feedback returns that individual's report for review and records a follow-up event. It does not automatically reopen the whole incident or change other customers' reports. |
| REQ-INCIDENT-09 | Resolve reports, incidents, assistance requests, and advisories through their own authorized review processes. Completing assistance must not resolve a report/incident, and resolving an outage must not lift a quality advisory. |

## Advisories and publication

| ID | Requirement |
| --- | --- |
| REQ-NOTICE-01 | Maintain scheduled interruptions and approved supplier guidance with applicable service-zone/affected-area information, publication/source information, and last-updated times. Present current applicable published notices on the customer home and assistance views. |
| REQ-NOTICE-02 | Keep boil-water, do-not-drink, and do-not-use notices distinct. Only authorized supplier/public-health guidance determines which restriction applies. The system must not diagnose water safety or infer drinkability from report text, photos, absent reports, or outage resolution. |
| REQ-NOTICE-03 | Publishing and lifting an advisory are explicit authorized actions with actor/time audit history. Under the adopted permission split, admin performs official advisory publication/lifting. A quality restriction remains applicable until explicitly lifted by an authorized user; new incident status alone cannot remove it. |
| REQ-NOTICE-04 | Commit a publication and its notification records atomically or through a reliable outbox, with stable operation/delivery identifiers. Retries must not publish duplicate updates or create duplicate notification deliveries. First-release delivery is persisted in-app notifications with foreground polling/refetch. |

## Assistance fulfillment

### Shared workflow

All three assistance services are confirmed scope: `callback` (callback/support follow-up), `inspection` (site visit), and `water_support` (supplier-managed pickup/distribution support).

| ID | Requirement |
| --- | --- |
| REQ-ASSIST-01 | Every request has a customer, service type, linked report, status, customer-visible updates, and timestamps. Incident linkage is optional. On acceptance, assign a staff owner. Prevent duplicate active requests of the same type for the same customer/report. |
| REQ-ASSIST-02 | Follow `requested -> accepted -> scheduled -> in_progress -> completed`, with `unavailable` and `cancelled` as alternate outcomes. Immediate support may skip scheduling only with a recorded reason. Detailed allowed transitions and the definition of active requests are adopted persistence/workflow defaults in [schema](schema.md) and [workspace](workspace.md). |
| REQ-ASSIST-03 | A submitted request does not guarantee an appointment or water availability. Clearly distinguish submitted, accepted, and scheduled states. Recommendations never automatically submit, accept, or schedule a request. |
| REQ-ASSIST-04 | Record and notify the customer of unavailability, cancellation, or rescheduling, including the reason. Allow customer cancellation before work or collection begins and retain history. Staff must not erase earlier appointment details or updates when rescheduling. |
| REQ-ASSIST-05 | Staff can review the queue, assign owners, accept, mark unavailable with a reason, schedule, update progress, and record completion. Customers can see their own request timeline and permitted follow-up/cancellation actions. |
| REQ-ASSIST-06 | Assistance completion records the service outcome and next steps; the underlying report, incident, and quality advisory retain independent status and review. |

### Callback and inspection

| ID | Requirement |
| --- | --- |
| REQ-CALLBACK-01 | Collect the question, preferred contact method/number, and preferred time window. Staff records the agreed appointment and contact outcome. A missed callback may be rescheduled with a recorded reason and customer notification. |
| REQ-INSPECTION-01 | Collect issue details, site address, preferred visit window, and access instructions. Staff schedules the visit and records findings and next steps in the supplier application; no separate inspector application is required. |

### Water pickup and stock

| ID | Requirement |
| --- | --- |
| REQ-WATER-01 | Let the customer request a quantity in **liters** and choose a listed pickup/distribution session. Show site address, operating times, instructions, and current availability in a list. Do not require a route or map to choose support. |
| REQ-WATER-02 | Staff maintains supplier-managed pickup sites and sessions, including service zones, times, status, total stock, and availability. Seeded availability and related water notices must be marked as demonstration data. |
| REQ-WATER-03 | Acceptance reserves the requested quantity and issues a pickup reference. Reserve stock transactionally: concurrent approvals must not make remaining stock negative. Requested quantity and all stock amounts must be valid positive/nonnegative values as appropriate, using the same liters unit. |
| REQ-WATER-04 | Calculate `remaining liters = total liters - uncollected reserved liters - collected liters`. Collection moves the allocation from reserved to collected; it must not count the same quantity twice. Record collection once and reject a repeat collection. |
| REQ-WATER-05 | Cancellation releases an uncollected reservation exactly once. Session cancellation releases uncollected reservations, informs every affected customer, preserves request/allocation history, and offers staff follow-up. Allocation acceptance, release, and collection must be transactional and safe to retry. |
| REQ-WATER-06 | If no pickup session is available, communicate unavailability and offer callback/support. Availability shown before acceptance is not a guarantee. Do not promise stock or appointment fulfillment until the relevant acceptance/scheduling steps succeed. |
| REQ-WATER-07 | First-release fulfillment is pickup/distribution at supplier-managed points. Home delivery, fleet tracking, and route optimization are deferred. “Order” or “delivery” wording in general workflow requests refers here to assistance and collection, not a separate commerce lifecycle. |

## Customer decision support

**Adopted and implemented first-release approach:** API-evaluated explainable rules, a short guided questionnaire and action cards. The professor's required form of decision support remains externally unverified. Implementation does not establish academic acceptance; AI is outside this release.

| ID | Requirement |
| --- | --- |
| REQ-DECISION-01 | Evaluate category, service location/zone, report time, customer-stated needs, targeted answers, active applicable advisories, incident status, and current pickup-session availability. Retain relevant input references and rule version for review. |
| REQ-DECISION-02 | Apply applicable official safety guidance before contextual incident guidance. Keep escalation conditions visible alongside both. Show the action, why it applies, source/supporting notice, last-updated time, and a working action button. |
| REQ-DECISION-03 | For a known outage, show the incident update. If water is needed before restoration or restoration is unknown, offer available pickup sessions or a water-support request; offer callback/support when no pickup option exists. |
| REQ-DECISION-04 | For low pressure without a known incident, a leak, or a problem persisting after resolution, ask targeted questions and offer inspection for staff assessment. Absence of nearby reports proves neither a household fault nor safe water. |
| REQ-DECISION-05 | For a leak, use the reported location and hazard information to surface the relevant supplier contact or assessment request. Do not give risky repair instructions. |
| REQ-DECISION-06 | For a water-quality concern, surface applicable approved guidance and prioritize staff review. Never infer contamination or drinkability from a photo. Keep the three quality-advisory restrictions distinct. |
| REQ-DECISION-07 | For missing, unknown, or conflicting information, identify what is unconfirmed, retain the report, and offer callback/support follow-up. Do not invent an incident, coordinate, diagnosis, restoration time, or current availability. |
| REQ-DECISION-08 | Let the customer choose an appropriate alternative or decline the recommendation. A recommendation does not submit, accept, or schedule assistance. Distinguish a request sent to staff from an accepted service. |
| REQ-DECISION-09 | Evaluate rules on the API so both clients receive consistent results. Reevaluate when incidents/advisories change; historical recommendations retain their review context, but superseded guidance must not be presented as current. Log rule changes with actor/time. |
| REQ-DECISION-10 | If AI is later required, constrain it to explaining approved records/rules with sources. It cannot publish notices, invent restoration estimates, or decide water safety. AI implementation is optional future scope and requires a separate decision. |

## Operations, data integrity, and resilience

| ID | Requirement |
| --- | --- |
| REQ-OPS-01 | Validate inputs server-side, sanitize rendered text, limit upload types/sizes, rate-limit sensitive endpoints, and avoid logging credentials. Keep database/provider secrets out of source control and web/mobile bundles. Concrete input/upload limits, process-local rate limits, protected images and session mechanisms are implemented; deployment limitations are recorded in architecture and verification. |
| REQ-OPS-02 | Keep report entry usable when the basemap is unavailable. Provide list views and explicit network/upload failure and retry states. Address-based reporting remains available after GPS denial; map/provider failure must not generate invented coordinates. This does not require an offline synchronization system. |
| REQ-OPS-03 | Persist PostgreSQL data through container replacement using a named data volume. Document backup and restore separately: a persistent volume is not a backup procedure. Use migrations and a repeatable development-only seed; require deliberate action before resetting demo data. |
| REQ-OPS-04 | Store report/advisory times in UTC and display them in the service timezone, initially `Asia/Manila`. Apply the same explicit timezone handling to appointments, session times, updates, and audit history. |
| REQ-OPS-05 | Audit publication/lifting, priority changes, report linking/reassignment, status transitions, and rule edits with actor/time. Retain the history needed to explain changes without exposing staff notes or credentials to customers. |
| REQ-OPS-06 | Scope staff map queries by numeric viewport bounds and category/status/time filters; preserve ownership rules in customer responses. GeoJSON polygons and visual clusters support rendering rather than supply-network inference. |
| REQ-OPS-07 | Geoapify requests use a server-side key, service-region bias/filter, request limits, and timeouts. Select compatible map styles/tiles and attribution separately; any required client-visible tile credentials must have appropriate restrictions. Provider credentials and installed-device/native compatibility remain verification gates; MapLibre and configurable styles are integrated in source. |
| REQ-OPS-08 | **Adopted API default:** Express REST under `/api/v1`, shared DTOs/enums/validation contracts, pagination, consistent errors, and server-side validation/authorization. Shared contracts must not expose database credentials or server-only code. The implemented endpoint contract is in [api.md](api.md); public DTOs/enums live in `aqours-contracts/src/`, with runtime validation on the API. |
| REQ-OPS-09 | Produce an installable Android APK when implementation is requested. Verify Expo/React Native/native MapLibre compatibility early with a development/native Android build, configure the native plugin/style, and pin tested versions. The native map is not an Expo Go feature; CNG prebuild/Hermes export do not prove an installable APK or device compatibility. |

### Metric definitions

The following metric definitions were adopted for the first release and are implemented by the API. Display the reporting period, sample count, excluded outcomes, and timezone; do not present absent data as zero-duration service.

| ID | Metric | Adopted definition |
| --- | --- | --- |
| REQ-METRIC-01 | Active incidents / unresolved reports | Active incidents have status other than `resolved`. Unresolved reports remain `received`, `under_review`, or `in_progress`; include a report returned for “still affected” review. Reviewed duplicate/invalid closures are shown separately from successful resolutions. |
| REQ-METRIC-02 | Counts by category | Count the underlying report records by category for the selected period/status filter. Identify duplicate/invalid outcomes separately; display unique reporting connections independently of report totals and estimated affected customers. |
| REQ-METRIC-03 | First-response time | Start at successful report creation; end at the first staff-authored, customer-visible acknowledgment or clarification message. An automatic receipt or an internal-only status/note is not a first response. Pending reports have no completed response duration. |
| REQ-METRIC-04 | Resolution time | Start at successful report creation; end at staff-recorded substantive resolution. Exclude duplicate/invalid closures from service-resolution durations. Retain prior resolution events after follow-up; flag reopened individual reports and do not count them as currently resolved. Show first-resolution duration separately from current unresolved/follow-up state. |

## Demo fixtures

The repeatable demo seed is implemented and remains development-only with fictional data. Its reset is deliberate; normal startup does not reset state.

| ID | Required fixture coverage |
| --- | --- |
| REQ-DEMO-01 | One supplier, three synthetic service zones, twelve fictional customer connections with accounts/addresses, and a documented demo login list. |
| REQ-DEMO-02 | Incidents representing all four report categories, plus unmatched reports, unknown/conflicting information, and a “still affected” case. Clearly mark synthetic restoration estimates and notices. |
| REQ-DEMO-03 | Two pickup sites; distribution sessions demonstrating available, full, and cancelled outcomes; and examples of callback, inspection, and water-support requests. Label seeded stock/availability as demo data. |

## Acceptance scenarios

These ten scenarios retain their original required scope. API/database, actual supplier-browser and installed Android checks have individually scoped evidence in [verification](verification.md). Required live Geoapify candidate/confirmation/geocoded-point checks remain unverified; controlled GPS equality does not replace them. Each scenario must be demonstrable against the integrated Android app, supplier web app, API and database where applicable. These scenario IDs are separate from `.loop/` execution criteria.

| ID | Scenario and passing evidence |
| --- | --- |
| DEMO-001 | Two seeded customers submit reports. Both appear in the authorized staff map/inbox; each customer sees only their own report history. |
| DEMO-002 | Staff links those reports to one incident and publishes one update. Both customer timelines and in-app notifications receive it, and repeating the publication does not duplicate updates or notification deliveries. |
| DEMO-003 | Assistance matches the selected scenario, explains why, offers a working next action, and uses a safe callback/support fallback when no relevant incident/advisory exists. The decision-support approach still needs academic confirmation. |
| DEMO-004 | Resolve an outage with an applicable quality advisory. The advisory remains visible/current until an authorized user explicitly lifts it. |
| DEMO-005 | A customer reports “still affected.” Only that individual report returns for review; the incident and other customers' outcomes do not automatically reopen. |
| DEMO-006 | Customer A changes identifiers to attempt access to customer B's reports, photos, notifications, and assistance requests, and to staff notes. Every prohibited read/mutation is denied without leaking record content. |
| DEMO-007 | Deny Android GPS permission and submit using the saved address. Confirm a typed/geocoded address and verify identical coordinates on web/native maps with `[longitude, latitude]`. Failed or ambiguous geocoding retains the report for review and never invents coordinates. |
| DEMO-008 | A seeded customer requests each assistance type. Staff accepts, schedules, progresses, and completes it; the customer sees the corresponding timeline, service details, and outcomes. |
| DEMO-009 | Concurrent pickup approvals cannot exceed stock. Cancellation releases the reservation, collection cannot occur twice, and unavailable sessions lead to a clear support alternative. Verify history and remaining-liter calculations after every operation. |
| DEMO-010 | Retry report/update/fulfillment operations and verify no duplicate records, notification deliveries, allocations, or collection. Recreate the database container with its data volume and verify reports/accounts remain; document a separate backup/restore check. |

## Deferred capabilities and open decisions

| Item | Status and boundary |
| --- | --- |
| Billing, payments, commerce orders | Deferred; no first-release order/payment lifecycle. |
| IoT sensors, automatic contamination/drinkability diagnosis | Deferred; reported data and approved guidance do not constitute automatic water-safety diagnosis. |
| iOS, app-store publication | Deferred; Android APK demonstration is the confirmed customer target. |
| Vehicle/repair routing, home delivery, fleet tracking, route optimization | Deferred; first-release water assistance uses staff-managed pickup/distribution. |
| Multiple suppliers | Deferred; one supplier is the adopted first-release default. |
| SMS, email, push notifications, WebSockets | Optional later work; first release uses persisted in-app records and foreground polling/refetch. |
| Public registration | Optional for the demo; required access is seeded individual accounts. No registration approval process is presumed. |
| AI chatbot | Optional future work; confirm the academic requirement before adding it. |
| Decision-support rubric | Open: confirm whether contextual rules, explanations, and actionable alternatives satisfy the professor's expectations. |
| Detailed permissions and workflow transitions | Adopted and implemented for this release; ownership, audit, advisory and stock invariants remain mandatory. |
| Authentication mechanism, upload limits, tile/style provider, native compatibility | Sessions, upload limits and configurable map styles are implemented; actual provider credentials, production deployment and installed-device native compatibility remain verification/deployment work. |
| Working title, demonstration geography, deployment destination, exact deadline | Configurable planning details; the supplied one-week sequence is conditional, not a committed schedule. Do not reopen the confirmed Android, location, or assistance choices. |

Application source, environment examples, Compose, migrations/seeds, contracts and setup/demo/build guidance now exist. The user authorized necessary project-local dependencies for this implementation. Release completion still requires the evidence and outstanding checks recorded in [verification](verification.md), including the Android deliverable; do not infer completion from this requirement inventory.

## Map and address implementation

See [locations and maps](location-and-maps.md) for the bundled PSGC catalog, guided/free-text address behavior, nullable snapshots, detailed basemap configuration, and verification boundaries.
