# Workflows and workspace

Updated 19 October 2026 against the first-release implementation of brief v0.4. The workflows below describe implemented API/client paths and their required invariants. Installed Android workflows have individually scoped evidence; required live-geocoded-point verification remains external. See [verification](verification.md) and [traceability](traceability.md).

Related documents: [Documentation index](README.md) · [Architecture](architecture.md) · [Requirements](requirements.md) · [Schema](schema.md). Role summaries and detailed feature specifications are linked from the index.

This document covers both role workflows requested by the project owner and local workspace conventions required by [AGENTS.md](../AGENTS.md). “Order” means an assistance request in this project. Water fulfillment uses supplier-managed pickup/distribution points; commerce orders, payments and home delivery are deferred.

## 1. Account provisioning and registration

Required demo access uses individual seeded customers linked to fictional service connections. Supplier-managed provisioning is the adopted default; **public registration is optional**, and no registration approval queue is specified or implemented.

1. Prepare the development-only dataset: one supplier context, three synthetic zones, twelve fictional customer connections, staff/admin accounts and saved service addresses.
2. Link each customer account to the correct connection/address and reviewed zone. Keep unknown coordinates/zones explicitly unconfirmed rather than inventing a map position.
3. Hash passwords and publish a clearly labeled demo account list through [setup](setup.md) and [demo](demo.md). The explicit development seed creates the fictional accounts; never use real credentials in documentation.
4. Under the adopted permission split, admin maintains demo accounts, zones, approved guidance and rule versions; staff handles operational reports, incidents, assistance and distribution. The API enforces this split.
5. A customer signs in with their own seeded account. If public registration is added later, define verification, connection ownership and approval requirements separately before building it; a submitted connection ID cannot establish ownership.

Account creation is separate from staff acceptance of assistance. The required “approvals” below concern service requests, report linking and authorized publication.

## 2. Authentication and session lifecycle

1. Customer opens the Android sign-in screen; staff/admin uses the supplier web sign-in screen.
2. The API validates credentials, account state and intended access, then creates a revocable client-specific session with configured expiry. Browser sessions use HttpOnly cookies plus Origin/CSRF protection; Android uses bearer tokens backed by SecureStore.
3. Android stores authentication material in secure device storage. The browser uses protected authentication and state-changing requests; the implemented cookie approach is described in [architecture](architecture.md).
4. The API derives the actor and role from the session on every request, then checks record ownership or authorized staff access. It rejects a customer's attempt to read another customer's report, file, notification or assistance request.
5. On expiry/revocation, show sign-in recovery without displaying another user's cached private data. Failed requests must not appear to have saved a report or accepted a service.
6. Logout revokes the relevant server session, clears local authentication/private view state and returns to sign-in. Removing a token from the screen alone does not satisfy logout.

Password recovery, MFA and public registration are not implicitly added to the demonstration scope.

## 3. Customer home and service location

Home also offers [Open-Meteo weather](weather.md) for an owned saved connection or a selected Philippine city. Supplier Overview supports the same city search. Weather requests have their own loading/error/refresh state and do not change report locations, service zones or advisories.

1. After sign-in, load the customer's profile, saved connection/address, current applicable published notices and open reports.
2. Match notices through explicit reviewed service-zone/connection associations. An applicable area advisory can reach a customer who has never submitted a report.
3. Present a report shortcut and owned report details. Keep published incident areas separate from other households' private coordinates.
4. View saved connection information in profile. Customer editing or reassignment of supplier-maintained connection ownership/address is not specified; do not assume self-service changes.
5. Refresh notices and notifications in the foreground. Show last-updated time and explicit loading/error/empty states; failure is not evidence that no incident or advisory exists.

The [UI/UX guide](ui-ux.md) describes the current five-tab customer navigation, guided reporting and coordinated supplier inbox/map presentation.

## 4. Submit and follow a report

1. Choose `outage`, `low_pressure`, `leak` or `water_quality`; enter description, time noticed and guided details.
2. Choose the saved service address or an alternate issue location. Keep the saved connection and report-location snapshot separate.
3. If entering an address, request Geoapify candidates through the API and confirm a candidate's address/location. If using GPS, grant optional foreground permission and confirm the device position. GPS denial returns to the saved-address path.
4. Show the location in native MapLibre when coordinates are available. Reuse confirmed coordinates as `[longitude, latitude]`; changing the map zoom must not change the saved position.
5. If geocoding is ambiguous/unavailable, retain the address/report for review with missing/unconfirmed location flags. Review an alternate issue location's zone rather than inheriting the saved address's zone silently. Basemap failure leaves the form usable; no `(0, 0)` fallback.
6. Add optional photos. The API checks type/size and report ownership; bytes go to controlled storage. An upload failure is shown explicitly, and retry must not create another report or falsely mark the photo attached.
7. Submit using the same operation identifier when retrying. On committed success, show a tracking reference, server submission time and initial `received` status.
8. Open My reports/detail to see owned status, messages, incident link, timeline and next action. Reply to clarification requests through the owned report.

Report creation and optional photo upload are separate operations. A photo failure preserves the committed report reference and offers an attachment retry using the same upload operation key. Offline queueing/synchronization is not required.

## 5. Supplier review and incident management

1. Staff opens the inbox or map, filters reports, and reviews customer/connection details and unlocated reports. The list remains usable if map tiles fail.
2. Acknowledge or send a customer-visible clarification, assign an owner and set priority with a reason. Severe isolated reports remain eligible for review without a surrounding cluster.
3. Progress the report through `received -> under_review -> in_progress -> resolved` as appropriate. The API enforces this ordinary path; reviewed duplicate/invalid closure can end review earlier with an explicit outcome and reason.
4. For duplicate/invalid submissions, perform reviewed closure with actor/time/reason and retain the record. The implemented model uses a separate closure outcome; do not count this as restored service.
5. Review suggested relationships based on category, time and zone/location. Confirm a link to one current incident or create an incident; preserve link/unlink/reassignment history.
6. Maintain incident owner, internal notes and transitions through `investigating -> confirmed -> work_in_progress -> monitoring -> resolved`. A link or incident state must not blindly copy a status into every customer's report.
7. Distinguish unique reporting connections from estimated affected customers. Report counts and zoom-dependent map clusters cannot establish an outage or its actual boundary.
8. Prepare a customer-facing update containing status, affected area, publication time, latest progress and restoration estimate or explicit unknown. Publish it separately from internal notes.
9. Commit one publication with deduplicated notifications to linked reporters atomically or through a reliable outbox. Polling, double-clicking or retrying must not create duplicate publications/deliveries.

A customer selecting “I am affected” on a published incident reuses or creates a deduplicated personal report. It does not grant access to other reporters. Staff can correct incident associations without deleting customer histories.

## 6. Official advisories and recovery

1. An authorized user prepares scheduled interruption or quality guidance with its source, applicable zones/area, demo label and publication details. Adopted default: admin publishes/lifts official advisories; staff publishes operational incident updates.
2. Publish the approved notice and notify matching service connections independently of incident-report linkage. Deduplicate per recipient and publication even if several connections/reports match.
3. Show applicable guidance on Home and Assistance. Keep boil-water, do-not-drink and do-not-use restrictions distinct; do not generate local safety advice from a photo or an outage status.
4. When an outage is resolved, review the incident and individual report outcomes. A quality advisory remains current until an authorized user explicitly lifts it; a restoration estimate or scheduled end time cannot lift it automatically.
5. Record authorized correction/lifting history and notify the relevant customers. Reevaluate affected recommendations so superseded instructions are not displayed as current.
6. If a customer selects “still affected,” record feedback and return **that report** to review. Preserve its earlier resolution event; leave the incident and other customers' outcomes unchanged unless staff separately reviews them.

## 7. Contextual guidance and customer choice

Rules, a short questionnaire and explained action cards are the adopted and implemented approach. Academic acceptance remains externally unverified; AI is outside this release.

1. Evaluate issue category, location/zone, time noticed, customer needs/answers, current advisories, incident state and session availability on the API.
2. Apply current official safety guidance first, then contextual incident guidance, while keeping escalation visible. Show the action, explanation, supporting source/update time and a usable next-step button.
3. For a known outage, show its latest update. When the customer needs water before restoration or the estimate is unknown, offer an available pickup session/water-support request; offer callback/support if there is no available option.
4. For low pressure without a known incident, a leak or a problem persisting after resolution, ask targeted questions and offer inspection for assessment. Surface relevant supplier contact for a reported hazard; avoid risky repair instructions or an automatic household-fault diagnosis.
5. For water-quality concerns, show applicable approved guidance and prioritize staff review. Unknown/missing/conflicting information remains explicit and offers support follow-up.
6. Let the customer select an appropriate alternative or decline. Only an explicit customer action submits an assistance request; recommendation, request submission, staff acceptance and scheduling are distinct events.
7. Retain rule version and relevant input/source revisions. Reevaluate when incident/advisory context changes and refresh availability before staff accepts water support.

## 8. Shared assistance approval and fulfillment

Each request has a customer, linked owned report, type, timestamps and customer-visible history; incident linkage is optional. Active states are `requested`, `accepted`, `scheduled` and `in_progress`, with at most one active request of each type per customer/report.

| Stage | Actor and target behavior |
| --- | --- |
| `requested` | Customer chooses `callback`, `inspection` or `water_support`, supplies the relevant details, and submits once safely on retry. Show that appointments/stock are not guaranteed. |
| `accepted` | Staff reviews eligibility and assigns a staff owner. Water acceptance also reserves liters and issues a pickup reference in the same transaction. Acceptance alone is not an agreed appointment. |
| `scheduled` | Staff records the agreed callback/visit time or pickup/session arrangements and notifies the customer. Preserve the originally requested window separately. |
| `in_progress` | Staff records that contact, site work or collection has begun. Immediate support may progress from accepted without scheduling only with a recorded reason. |
| `completed` | Staff records service outcome, findings/contact or collection details and next steps. Retain all history. |
| `unavailable` | Staff records why fulfillment cannot be offered and notifies the customer, with an appropriate support alternative. The transition matrix below is enforced by the API. |
| `cancelled` | Customer may cancel before work/collection begins, supplying/recording a reason. Staff records session/service cancellation and follow-up. Release any uncollected water reservation atomically. |

Rescheduling records the old/new arrangement, actor/time and reason, then notifies the customer. A missed callback can be rescheduled. A stale action after another user changes the request must return the current state or a clear conflict rather than overwriting history. Staff validates every transition on the API.

Completing or cancelling assistance does not resolve the underlying report, incident or water-quality advisory. Customer cancellation is no longer available once work/collection has begun; exceptional operational handling requires staff review with history.

### Callback/support follow-up

1. Customer submits their question, preferred contact method/number and time window, linked to their report.
2. Staff accepts with an owner, agrees/records an appointment and provides customer-visible details.
3. Staff records contact in progress and its outcome/next steps. If contact is missed, preserve the attempt and reschedule with a reason and notification.
4. Complete the assistance record after the recorded service outcome. Review the report separately if additional operational action is needed.

### Site inspection

1. Customer submits issue details, the inspection site address, preferred visit window and access instructions.
2. Staff reviews the site information, accepts with an owner and records the agreed visit.
3. Staff records visit progress, findings and next steps in the supplier web application. No separate inspector app/role is required.
4. Notify the customer of the allowed customer-facing outcome and complete assistance independently of any subsequent report/incident resolution.

### Water pickup/distribution

1. Staff creates a pickup site and a session with explicit served zones, operating times, status, instructions and total liters. Clearly label seeded availability as demonstration data.
2. Customer sees a **list** of eligible sites/sessions with address, time, instructions and current availability, requests positive liters and selects a session. Offer callback/support when no suitable pickup option exists; do not imply home delivery.
3. On staff acceptance, lock and recheck request/session/stock in a transaction, reserve quantity, assign owner, issue a unique pickup reference, and record history/notification. Concurrent requests cannot each consume the same stock.
4. Staff schedules/confirms pickup arrangements. Customer sees accepted/scheduled details separately from the initial submission.
5. Staff validates the reference and records collection exactly once. Move the allocation from reserved to collected rather than deducting it twice. Immediate collection can use the recorded scheduling exception.
6. Before work/collection begins, customer cancellation releases the reservation and preserves history. A released allocation cannot later be collected.
7. Session cancellation blocks further acceptance and serializes against collection/approval, releases all uncollected reservations, notifies every affected customer, and offers staff follow-up. Already collected quantities remain recorded.

Implemented request-outcome policy: session cancellation marks pending/uncollected water requests `unavailable` with a reason and support follow-up; collected requests retain their outcome. Customer cancellation remains `cancelled`. The API enforces allowed transitions and expected-version checks.

```text
remaining liters = total liters - uncollected reserved liters - collected liters
```

Example: 100 total, 20 reserved and 30 collected leaves 50 liters. Accepting another 40 leaves 10; a concurrent 30-liter approval must then fail. Cancelling the new uncollected 40-liter reservation restores 50. Collecting the original 20 changes reserved/collected totals but leaves those 50 liters unchanged. Stock corrections must also respect existing commitments.

## 9. Notifications, audit and supplier metrics

Customers see only their persisted in-app notifications and owned linked records. Foreground polling/refetch delivers current records; a read-state change does not republish an event. External email/SMS/push/WebSocket delivery is optional later work. Internal notes never enter customer notifications or timelines.

Audit publication/lifting, priority changes, associations, status transitions, rule edits and stock actions with actor/time and relevant reason. Avoid credentials or unnecessary personal information in logs.

Implemented overview metrics follow [requirements](requirements.md): report creation to first staff-authored, customer-visible acknowledgment/clarification for response time; report creation to substantive reviewed resolution for first-resolution time. Exclude duplicate/invalid closure from service-resolution durations. Preserve prior resolution events after still-affected review, label current unresolved/follow-up state, and show period, sample count and `Asia/Manila` display timezone. Automatic receipts/internal notes do not count as first responses.

## 10. Local workspace and operational commands

The root npm manifest coordinates contract build, typecheck, lint, API/web build, repository checks and integrated API/browser verification. Each application has its own manifest/lockfile; `aqours-contracts/` is a local file dependency. Follow [setup](setup.md) for exact install, environment, Compose, migration/seed, start and verification commands. [API contract](api.md) defines actual endpoints; [demo](demo.md) describes fictional accounts/scenarios.

| Location | Implemented local tooling |
| --- | --- |
| Root | `npm run contracts`, `typecheck`, `lint`, `build`, `test:api`, `test:browser`, `check:repository` |
| `aqours-api/` | `npm run dev`, `build`, `start`, `migrate`, `seed`, `typecheck`, `lint`, `test` |
| `aqours-web/` | Vite `dev`, `build`, `preview`, plus `typecheck`, `lint`, `test` |
| `aqours-app/` | Expo `start`, native `android`, `export:android`, `typecheck`, `lint`, `test`; EAS/build configuration is present |
| Database | Compose PostgreSQL 18.6, project-local persistent data, Prisma migrations with verified legacy adoption, explicit development seed |

The mobile `android` script runs `expo run:android`, which requires the native toolchain; Metro alone does not produce an APK. Expo 57 / React Native 0.86.3 / MapLibre React Native 11.5.0 are configured. For an SDK-compatible Expo Go, run `npm --prefix aqours-app run start -- --go --clear` and scan the QR code; report screens display coordinates because Expo Go lacks MapLibre's native modules. Interactive maps require an Aqours native build. Signed standalone dual-architecture APKs and actual KVM-backed Android29/36 workflows are recorded in the [native ledger](native-verification.md), with exact artifact boundaries. CNG/export/type checks remain distinct evidence. Refer to the current [verification ledger](verification.md) before claiming compatibility.

All tool caches, generated outputs, native build work and temporary verification artifacts must remain project-local under the user-authorized setup. Do not repurpose HOME, change global settings, read secret files or install global tooling. Environment examples contain placeholders; database/Geoapify secrets remain on the API. A phone's localhost is the phone: configure a reachable development API address and keep published ports/access deliberate.

## 11. Transition matrices and operational verification

Report review normally advances `received -> under_review -> in_progress -> resolved`. A reviewed duplicate/invalid closure may resolve earlier with outcome and reason; restored closure records a substantive first-resolution timestamp. A customer still-affected action returns a resolved report to review without reopening its incident or other reports. Incident transitions normally follow `investigating -> confirmed -> work_in_progress -> monitoring -> resolved`; an authorized reasoned review can explicitly return an incident to investigating. Published snapshots remain deliberate separate actions.

| Assistance from | Permitted staff destinations |
| --- | --- |
| `requested` | `accepted`, `cancelled`, `unavailable` |
| `accepted` | `scheduled`, `in_progress` with immediate-support reason, `cancelled`, `unavailable` |
| `scheduled` | `scheduled` with reschedule reason, `in_progress`, `cancelled`, `unavailable` |
| `in_progress` | `scheduled` with reschedule reason, `completed`, `unavailable` |
| Terminal states | No arbitrary reopening; prior history remains retained |

Acceptance requires an eligible active staff/admin owner. Scheduling needs an agreed appointment; completion needs outcome and next steps. Once work started, cancellation is rejected even after a reschedule. Water completes only through the allocation collection command, after scheduling/progress or a recorded immediate-collection reason. Pickup appointments must fall within the session interval. Customer cancellation is restricted to unstarted requested/accepted/scheduled requests; session cancellation independently handles active uncollected allocations.

Compose recreation must retain accounts/reports using the same persistent volume. A volume is not a backup: [setup](setup.md) documents database/migration and attachment backup/restore; executed restore evidence belongs in [verification](verification.md). Reset is an explicit development operation and must never run as startup behavior.

The ten [DEMO scenarios](requirements.md#acceptance-scenarios) remain the integrated acceptance target. API/database, supplier browser and installed Android checks have separately scoped evidence in the native and verification ledgers, including secure-storage lifecycle, GPS denial/controlled acquisition, photo picker/protected decoding, real native map failure and all three fulfillment paths. Live signed typed-address lookup still requires private Geoapify configuration. Academic approval and approved real supplier/public-health content cannot be established by technical tests. Deployment destination and exact demonstration deadline remain configurable.

## Source navigation

See [directory navigation](directory-structure.md) for API layers and feature-based client folders. Prisma generates backend-only database types; shared public DTOs remain in `aqours-contracts`. Tailwind applies only to the supplier web, preserving native mobile styles. Existing-database adoption is explicit and must precede the first Prisma deployment.

## Guided addresses and detailed maps

See [locations and maps](location-and-maps.md) for the bundled PSGC catalog, guided/free-text address behavior, nullable snapshots, detailed basemap configuration, and verification boundaries.
