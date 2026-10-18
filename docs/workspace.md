# Workflows and workspace

Baseline: 18 October 2026, supplied project brief v0.4. **These are target workflows, not working features.** The repository currently contains only an Expo customer starter; the API, supplier web application, database, authentication, reports and fulfillment are unimplemented.

Related documents: [Documentation index](README.md) · [Architecture](architecture.md) · [Requirements](requirements.md) · [Schema](schema.md). Role summaries and detailed feature specifications are linked from the index.

This document covers both role workflows requested by the project owner and local workspace conventions required by [AGENTS.md](../AGENTS.md). “Order” means an assistance request in this project. Water fulfillment uses supplier-managed pickup/distribution points; commerce orders, payments and home delivery are deferred.

## 1. Account provisioning and registration

Required demo access uses individual seeded customers linked to fictional service connections. Supplier-managed provisioning is the proposed default; **public registration is optional**, and no registration approval queue is specified or implemented.

1. Prepare the development-only dataset: one supplier context, three synthetic zones, twelve fictional customer connections, staff/admin accounts and saved service addresses.
2. Link each customer account to the correct connection/address and reviewed zone. Keep unknown coordinates/zones explicitly unconfirmed rather than inventing a map position.
3. Hash passwords and publish a clearly labeled demo account list through the future setup/demo documentation. There is currently no seed command or usable login list.
4. Under the proposed permission split, admin maintains demo accounts, zones, approved guidance and rule versions; staff handles operational reports, incidents, assistance and distribution. Confirm this split before implementing authorization.
5. A customer signs in with their own seeded account. If public registration is added later, define verification, connection ownership and approval requirements separately before building it; a submitted connection ID cannot establish ownership.

Account creation is separate from staff acceptance of assistance. The required “approvals” below concern service requests, report linking and authorized publication.

## 2. Authentication and session lifecycle

1. Customer opens the Android sign-in screen; staff/admin uses the supplier web sign-in screen.
2. The API validates credentials, account state and intended access, then creates the chosen revocable session. The exact token/cookie mechanism and expiry policy remain proposed implementation choices.
3. Android stores authentication material in secure device storage. The browser uses protected authentication and state-changing requests; the proposed cookie approach is described in [architecture](architecture.md).
4. The API derives the actor and role from the session on every request, then checks record ownership or authorized staff access. It rejects a customer's attempt to read another customer's report, file, notification or assistance request.
5. On expiry/revocation, show sign-in recovery without displaying another user's cached private data. Failed requests must not appear to have saved a report or accepted a service.
6. Logout revokes the relevant server session, clears local authentication/private view state and returns to sign-in. Removing a token from the screen alone does not satisfy logout.

No real authentication flow is available in the starter. Password recovery, MFA and public registration are not implicitly added to the demonstration scope.

## 3. Customer home and service location

1. After sign-in, load the customer's profile, saved connection/address, current applicable published notices and open reports.
2. Match notices through explicit reviewed service-zone/connection associations. An applicable area advisory can reach a customer who has never submitted a report.
3. Present a report shortcut and owned report details. Keep published incident areas separate from other households' private coordinates.
4. View saved connection information in profile. Customer editing or reassignment of supplier-maintained connection ownership/address is not specified; do not assume self-service changes.
5. Refresh notices and notifications in the foreground. Show last-updated time and explicit loading/error/empty states; failure is not evidence that no incident or advisory exists.

## 4. Submit and follow a report

1. Choose `outage`, `low_pressure`, `leak` or `water_quality`; enter description, time noticed and guided details.
2. Choose the saved service address or an alternate issue location. Keep the saved connection and report-location snapshot separate.
3. If entering an address, request Geoapify candidates through the API and confirm a candidate's address/location. If using GPS, grant optional foreground permission and confirm the device position. GPS denial returns to the saved-address path.
4. Show the location in native MapLibre when coordinates are available. Reuse confirmed coordinates as `[longitude, latitude]`; changing the map zoom must not change the saved position.
5. If geocoding is ambiguous/unavailable, retain the address/report for review with missing/unconfirmed location flags. Review an alternate issue location's zone rather than inheriting the saved address's zone silently. Basemap failure leaves the form usable; no `(0, 0)` fallback.
6. Add optional photos. The API checks type/size and report ownership; bytes go to controlled storage. An upload failure is shown explicitly, and retry must not create another report or falsely mark the photo attached.
7. Submit using the same operation identifier when retrying. On committed success, show a tracking reference, server submission time and initial `received` status.
8. Open My reports/detail to see owned status, messages, incident link, timeline and next action. Reply to clarification requests through the owned report.

The brief does not prescribe atomic report-plus-photo submission. Before implementation, decide how to recover a committed report with a failed attachment while retaining an honest report reference and an idempotent attachment retry. Offline queueing/synchronization is not required.

## 5. Supplier review and incident management

1. Staff opens the inbox or map, filters reports, and reviews customer/connection details and unlocated reports. The list remains usable if map tiles fail.
2. Acknowledge or send a customer-visible clarification, assign an owner and set priority with a reason. Severe isolated reports remain eligible for review without a surrounding cluster.
3. Progress the report through `received -> under_review -> in_progress -> resolved` as appropriate. This is the ordinary target path; the exact authorization/transition matrix remains a proposed implementation detail.
4. For duplicate/invalid submissions, perform reviewed closure with actor/time/reason and retain the record. The proposed model uses a separate closure outcome; do not count this as restored service.
5. Review suggested relationships based on category, time and zone/location. Confirm a link to one current incident or create an incident; preserve link/unlink/reassignment history.
6. Maintain incident owner, internal notes and transitions through `investigating -> confirmed -> work_in_progress -> monitoring -> resolved`. A link or incident state must not blindly copy a status into every customer's report.
7. Distinguish unique reporting connections from estimated affected customers. Report counts and zoom-dependent map clusters cannot establish an outage or its actual boundary.
8. Prepare a customer-facing update containing status, affected area, publication time, latest progress and restoration estimate or explicit unknown. Publish it separately from internal notes.
9. Commit one publication with deduplicated notifications to linked reporters atomically or through a reliable outbox. Polling, double-clicking or retrying must not create duplicate publications/deliveries.

A customer selecting “I am affected” on a published incident reuses or creates a deduplicated personal report. It does not grant access to other reporters. Staff can correct incident associations without deleting customer histories.

## 6. Official advisories and recovery

1. An authorized user prepares scheduled interruption or quality guidance with its source, applicable zones/area, demo label and publication details. Proposed default: admin publishes/lifts official advisories; staff publishes operational incident updates.
2. Publish the approved notice and notify matching service connections independently of incident-report linkage. Deduplicate per recipient and publication even if several connections/reports match.
3. Show applicable guidance on Home and Assistance. Keep boil-water, do-not-drink and do-not-use restrictions distinct; do not generate local safety advice from a photo or an outage status.
4. When an outage is resolved, review the incident and individual report outcomes. A quality advisory remains current until an authorized user explicitly lifts it; a restoration estimate or scheduled end time cannot lift it automatically.
5. Record authorized correction/lifting history and notify the relevant customers. Reevaluate affected recommendations so superseded instructions are not displayed as current.
6. If a customer selects “still affected,” record feedback and return **that report** to review. Preserve its earlier resolution event; leave the incident and other customers' outcomes unchanged unless staff separately reviews them.

## 7. Contextual guidance and customer choice

Rules, a short questionnaire and explained action cards are the **proposed** approach pending the professor's rubric; AI is not a confirmed requirement.

1. Evaluate issue category, location/zone, time noticed, customer needs/answers, current advisories, incident state and session availability on the API.
2. Apply current official safety guidance first, then contextual incident guidance, while keeping escalation visible. Show the action, explanation, supporting source/update time and a usable next-step button.
3. For a known outage, show its latest update. When the customer needs water before restoration or the estimate is unknown, offer an available pickup session/water-support request; offer callback/support if there is no available option.
4. For low pressure without a known incident, a leak or a problem persisting after resolution, ask targeted questions and offer inspection for assessment. Surface relevant supplier contact for a reported hazard; avoid risky repair instructions or an automatic household-fault diagnosis.
5. For water-quality concerns, show applicable approved guidance and prioritize staff review. Unknown/missing/conflicting information remains explicit and offers support follow-up.
6. Let the customer select an appropriate alternative or decline. Only an explicit customer action submits an assistance request; recommendation, request submission, staff acceptance and scheduling are distinct events.
7. Retain rule version and relevant input/source revisions. Reevaluate when incident/advisory context changes and refresh availability before staff accepts water support.

## 8. Shared assistance approval and fulfillment

Each request has a customer, linked owned report, type, timestamps and customer-visible history; incident linkage is optional. Proposed active states are `requested`, `accepted`, `scheduled` and `in_progress`, with at most one active request of each type per customer/report.

| Stage | Actor and target behavior |
| --- | --- |
| `requested` | Customer chooses `callback`, `inspection` or `water_support`, supplies the relevant details, and submits once safely on retry. Show that appointments/stock are not guaranteed. |
| `accepted` | Staff reviews eligibility and assigns a staff owner. Water acceptance also reserves liters and issues a pickup reference in the same transaction. Acceptance alone is not an agreed appointment. |
| `scheduled` | Staff records the agreed callback/visit time or pickup/session arrangements and notifies the customer. Preserve the originally requested window separately. |
| `in_progress` | Staff records that contact, site work or collection has begun. Immediate support may progress from accepted without scheduling only with a recorded reason. |
| `completed` | Staff records service outcome, findings/contact or collection details and next steps. Retain all history. |
| `unavailable` | Staff records why fulfillment cannot be offered and notifies the customer, with an appropriate support alternative. Final allowed transitions require an implementation matrix. |
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

Proposed request-outcome default: session cancellation marks pending/uncollected water requests `unavailable` with a reason and support follow-up; collected requests retain their outcome. Customer cancellation remains `cancelled`. The exact allowed transition matrix must be confirmed before implementation.

```text
remaining liters = total liters - uncollected reserved liters - collected liters
```

Example: 100 total, 20 reserved and 30 collected leaves 50 liters. Accepting another 40 leaves 10; a concurrent 30-liter approval must then fail. Cancelling the new uncollected 40-liter reservation restores 50. Collecting the original 20 changes reserved/collected totals but leaves those 50 liters unchanged. Stock corrections must also respect existing commitments.

## 9. Notifications, audit and supplier metrics

Customers see only their persisted in-app notifications and owned linked records. Foreground polling/refetch delivers current records; a read-state change does not republish an event. External email/SMS/push/WebSocket delivery is optional later work. Internal notes never enter customer notifications or timelines.

Audit publication/lifting, priority changes, associations, status transitions, rule edits and stock actions with actor/time and relevant reason. Avoid credentials or unnecessary personal information in logs.

Proposed overview metrics follow [requirements](requirements.md): report creation to first staff-authored, customer-visible acknowledgment/clarification for response time; report creation to substantive reviewed resolution for first-resolution time. Exclude duplicate/invalid closure from service-resolution durations. Preserve prior resolution events after still-affected review, label current unresolved/follow-up state, and show period, sample count and `Asia/Manila` display timezone. Automatic receipts/internal notes do not count as first responses.

## 10. Current local workspace

| Location | What can currently be inspected or run |
| --- | --- |
| Repository root | Guidance, progress, documentation and loop state; no root package/workspace scripts |
| `aqours-app/` | Expo starter, npm lockfile, TypeScript configuration and installed dependencies in this checkout |
| `aqours-api/`, `aqours-web/` | Empty directories; no start/build/test commands |
| Database/integrations | No Compose, migration/seed tooling, environment examples, server configuration or native MapLibre build |

The mobile manifest declares Expo `~57.0.30`, React Native `0.86.3`, React `19.2.3` and TypeScript `~6.0.3`. Use [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/), which lists Node.js 22.13.x as its minimum. These facts do not prove a successful Android build. Keep the npm lockfile and existing package-manager convention; package additions require approval.

The following commands are references for the **current starter**, run from `aqours-app/`; they were inspected rather than executed during this documentation-only task:

| Command | Actual behavior or limitation |
| --- | --- |
| `npm run start` | Runs the existing `expo start` script; starts Metro for the starter. |
| `npm run android` | Runs `expo start --android`; opens an Android target through the dev server. It does **not** build an APK or install native MapLibre. |
| `./node_modules/.bin/tsc --noEmit --incremental false` | Invokes installed TypeScript without emitted application files or incremental build metadata. Application typechecking was not required for this documentation-only change. |
| `npm run lint` | Runs `expo lint`, but the baseline has neither ESLint/config packages nor an ESLint configuration. Expo can propose installation/configuration; do not accept new dependencies without approval. No lint pass is claimed. |

Routes live in `aqours-app/src/app/`, not root `app/` as the generic starter README suggests. iOS/web scripts and starter UI examples do not expand the confirmed Android product scope. The reset-project script moves starter files; it is not required for documentation or ordinary development.

Under root guidance, keep generated files, tool configuration, caches and temporary outputs inside this repository. Configure tools before invoking commands that would otherwise write outside it; do not change global settings or repurpose `HOME`. SDK installation, device/emulator changes and Docker-managed host storage require the applicable project-policy consent before execution. This pass performs none of those operations.

## 11. Future implementation and operational setup

These are prerequisites and future deliverables, **not commands available today**:

1. Establish API/web package manifests, the approved shared-contract strategy, environment examples, and a versioned API contract. Keep the current `aqours-*` layout unless a later task explicitly changes it.
2. Select database tooling and a pinned supported standard PostgreSQL image. Add Compose health checks, private connectivity, a named volume and separate host/container connection configuration. The host API connects through the published host address/port; a containerized API uses the database service hostname/container port.
3. Add migrations and repeatable development-only seeds, with an explicit nonautomatic reset step. Supply the documented fictional demo logins and scenario data. Starting a container must not silently reset records.
4. Choose a client API address reachable from the actual Android phone/emulator. A physical phone's `localhost` points to the phone, not the development computer. Exact hostname/port variables remain to be defined in the future environment examples.
5. Keep database credentials and Geoapify key on the API. Choose web/native map styles, tile credentials and attribution separately; only appropriately restricted public map configuration belongs in client bundles.
6. Add approved native MapLibre dependencies/configuration and test an Android development/native build early; pin compatible versions after device verification. Expo Go cannot host MapLibre React Native. An installable demo APK and exact build instructions remain unimplemented. [MapLibre Expo setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/).
7. Add controlled upload storage and retention/retry handling, session revocation, rate/input limits and the required transactional notification/stock behaviors.
8. Verify persistence by recreating the database container with the same data volume and checking retained accounts/reports. A persistent volume and a backup are different safeguards. [Docker volume lifecycle](https://docs.docker.com/engine/storage/volumes/).
9. Add a separate backup/restore runbook: create a database-consistent backup plus attachment metadata/bytes, retain the migration version, restore into an isolated target, and verify records/ownership and representative attachments before use. Exact backup/restore commands depend on absent infrastructure/tooling and cannot yet be claimed as verified.
10. Run the ten integration scenarios in [requirements](requirements.md), including ownership denial, GPS denial, ambiguous geocoding, coordinate order, isolated severity, advisory independence, idempotency, concurrent stock, session cancellation and restoration of persisted data. Prepare a demo script with synthetic labels.

The suggested seven-day implementation sequence is conditional planning. Exact deadline, geography, deployment, academic decision-support acceptance and fine-grained permission details remain open; these do not block writing the documentation.
