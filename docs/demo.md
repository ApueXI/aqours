# Fictional demonstration walkthrough

Updated 19 October 2026. These are **reproducible walkthrough instructions**, not a claim that all ten scenarios have been executed on Android. The original scenario wording is reproduced below without changes. [Verification](verification.md) records actual API/browser/database/native results and unavailable checks; [traceability](traceability.md) maps every requirement and feature criterion to precise evidence. Follow [setup](setup.md), the [API contract](api.md) and [Android guide](../aqours-app/README.md) first.

All people, addresses, water notices, restoration estimates and stock here are fictional. Do not use these instructions or sample notices as real public-health advice. There is one supplier and three application roles. Academic acceptance of rules/questionnaire/action cards is external; no AI is part of this demonstration.

## Prepare the demonstration

1. Install locked project-local dependencies, configure private server/public client settings yourself and start PostgreSQL, migrate, opt into the development seed, then start Express and the supplier web app using [setup](setup.md). The seed refuses production/nonempty unseeded databases and repeats without resetting data. Do not remove a working database just to replay a scenario; create a separate empty demo/test database deliberately.
2. Open supplier web at the configured web origin, normally `http://localhost:5173`. Supplier navigation uses hashes: `/#/reports`, `/#/map`, `/#/incidents`, `/#/advisories`, `/#/assistance`, `/#/distribution`, `/#/settings`. A report/incident detail URL adds its UUID, for example `/#/reports/<report-id>`.
3. Build/install Android using the [mobile guide](../aqours-app/README.md), and configure a reachable public API URL. An emulator commonly uses `http://10.0.2.2:4000/api/v1`; a physical phone needs the development host's reachable LAN address. Expo Go cannot run native MapLibre. If no native target/build is available, perform the API/browser portion and explicitly record native steps as unavailable.
4. Keep two customer sessions separate: use two Android targets, or sign out completely before switching customers on one target. For shared-zone scenarios use Customer 01 and Customer 04. Open a separate staff browser session; use an independent admin session for official publication/settings. Browser customer logins are rejected by design.
5. Record each new report reference/UUID, incident UUID, request reference, pickup reference and current version from safe UI/API responses. Use a scenario-specific description, such as “Fictional DEMO-001 run”. Refresh before a versioned action. Never record session tokens, cookies, CSRF values or private environment contents in evidence.
6. Before mutating original fixtures, `npm run test:seed` can privately verify all14fixture credential hashes/roles,12owned connections and the documented contexts/stock in an isolated `_test` database. It prints no credentials or hashes and does not prove native login.
7. Seeded session dates are relative to the original seed time, not the current startup. The available/full examples expire after their seeded end. For a later replay, create fresh fictional sessions in Distribution with a future interval and sufficient stock instead of assuming seed availability is current.

## Fictional demo accounts and fixture context

These are intentionally public **development fixture credentials**, defined by [`seed-identities.ts`](../aqours-api/src/seed-identities.ts). They are not production credentials or values obtained from an environment file. Use only an isolated nonproduction dataset.

| Role | Login | Fixture password | Context |
| --- | --- | --- | --- |
| Admin | `admin@demo.aqours.test` | `DemoWater2026!` | All operational actions plus accounts/connections/zones/rules and official advisory publication/lifting |
| Staff | `staff@demo.aqours.test` | `DemoWater2026!` | Reports, incidents, operational updates, assistance, sites/sessions/stock and audit context |
| Customer 01–12 | `customer01@demo.aqours.test` through `customer12@demo.aqours.test` | `DemoWater2026!` | Each individual owns its corresponding fictional connection/history; sign into Android |

| Customers | Saved zone | Connection references |
| --- | --- | --- |
| 01, 04, 07, 10 | Demo Riverside (`DEMO-1`) | `DEMO-CON-001`, `004`, `007`, `010` with the same `DEMO-CON-` prefix |
| 02, 05, 08, 11 | Demo Hillcrest (`DEMO-2`) | `DEMO-CON-002`, `005`, `008`, `011` with the same prefix |
| 03, 06, 09 | Demo Lakeside (`DEMO-3`) | `DEMO-CON-003`, `006`, `009` with the same prefix |
| 12 | Unknown/unconfirmed; no coordinates | `DEMO-CON-012`, address retained for review |

There are four published synthetic category incidents, twelve starting reports (including unmatched and a previously resolved/still-affected report), one explicitly unlifted demonstration quality advisory, two pickup sites, and five assistance examples. Initial open-session stock is `1000.00` liters with `20.00` reserved (`980.00` remaining); the full session has `100.00` reserved from `100.00`; the third session is cancelled. These values change when the demo/tests mutate records. Verify current state rather than treating this table as live availability. Customer 01 has seeded accepted water support, Customer 02 a full-session reservation, Customer 03 a requested callback, Customer 04 a scheduled inspection and Customer 12 an unallocated water request requiring support follow-up.

## Actions and state constraints

Reports normally progress `received -> under_review -> in_progress -> resolved`. Resolve with an explicit `restored`, `duplicate` or `invalid` outcome and reason. Reviewed duplicate/invalid closure can happen before the ordinary final step and is not a service-restoration metric. Staff's first customer-visible message, rather than an automatic receipt or internal note, defines first response.

Incidents normally progress `investigating -> confirmed -> work_in_progress -> monitoring -> resolved`. A reasoned corrective review may explicitly return one to investigating. Internal incident edits do not publish automatically: use **Publish update** with customer-visible progress, affected area and a restoration instant or blank/unknown. Linking/reassignment happens on report detail through **Confirm association**, with a reason; it never deletes the personal report.

Assistance starts requested. Staff accepts with an active staff/admin owner, schedules an agreed instant, progresses and completes with outcome plus next steps. Immediate accepted-to-in-progress needs a reason; rescheduling preserves history and requires a reason. Once work starts, customer cancellation is disallowed even after rescheduling. Water completion uses **Record collection**, not the generic completed transition; immediate collection from accepted also needs a reason. Pickup appointments must fall inside session hours. Terminal requests do not reopen arbitrarily.

All guarded writes use the current expected version and operation identity specified in [api.md](api.md). On stale-version conflict, refresh/review before a new action. On uncertain transport, retry the same operation/key/payload. Client intentions persist only in memory; after an application process/browser reload, inspect existing records before deliberately submitting again. No offline synchronization queue is implemented.

## DEMO-001

> Two seeded customers submit reports. Both appear in the authorized staff map/inbox; each customer sees only their own report history.

1. On Customer 01 Android Home choose **Report a water problem**. Select outage, enter a fictional description and category-specific details, a valid noticed time in Asia/Manila, and **Use saved service address**. Submit. Record the received reference/time/status; open the report.
2. Sign out and repeat as Customer 04, or use the second native target. Confirm distinct references and that each My reports list contains only its owner's records.
3. In staff web, open Report inbox, find the two references, then Report map. Open the authorized records and compare saved issue coordinates. If tiles fail, use the list and record map rendering as unavailable rather than claiming point verification.
4. Verify owned detail through `GET /reports/:id` and operational detail through `GET /staff/reports/:id` if using API tooling. See the privacy scenario before any ID substitution.

Existing executable subset: `verification/reports-incidents.test.ts` tests “DEMO-001/010: concurrent same-key report submissions commit one result and reject changed payload” and “DEMO-002/005: shared incident links, publication dedupe, private snapshots and individual follow-up”; `verification/security.test.ts` tests ownership. Native N6/N31/NM2/NM14 separately prove actual owned submissions/receipts and persisted map points; N16–18 prove independent two-owner outcomes. NM14 also opens the native-created GPS point on the real supplier canvas.

## DEMO-002

> Staff links those reports to one incident and publishes one update. Both customer timelines and in-app notifications receive it, and repeating the publication does not duplicate updates or notification deliveries.

1. Create a fictional outage incident in staff web Incidents, or use a matching existing published incident. Ensure it explicitly serves the customers' reviewed zones and has a demo label; leave restoration unknown unless a fictional estimate is intentionally entered.
2. Open each report's supplier detail, choose that incident under Incident association, enter a reviewed reason, then **Confirm association**. Verify both reports remain separate in Linked reports.
3. Open incident detail, add a private note, then publish customer progress using **Publish update**. Enter explicit progress/area and unknown restoration. Refresh each customer's report and Notifications; compare update/publication identity and exclude the private note.
4. Replaying a publication requires the exact original operation UUID and payload, including expectedVersion. Use the named HTTP test below to automate this rather than clicking a newly prepared publication, which is a new operation. Confirm one notification per recipient/source event, including an additional manual case with two linked reports belonging to the same customer.

Existing executable subset: `verification/reports-incidents.test.ts`, “DEMO-002/005: shared incident links, publication dedupe, private snapshots and individual follow-up”; `verification/database.test.ts`, “publication failure rolls back both incident update and all notification work; same key then succeeds”. The dedicated tests in `verification/acceptance-incidents.test.ts` also exercise two reports/one owner with one persisted notification; native N7/N10/N16–18 independently verify timeline/notification rendering and independent follow-up.

## DEMO-003

> Assistance matches the selected scenario, explains why, offers a working next action, and uses a safe callback/support fallback when no relevant incident/advisory exists. The decision-support approach still needs academic confirmation.

1. Open an owned report and its guidance screen. Answer the questionnaire explicitly: needs water, hazard, persistence, nearby affected/unknown and optional water-needed time. Evaluate current answers.
2. For a linked published outage with unknown restoration, request water before restoration. Inspect the incident source/update, eligible available pickup card, reason and source time. For unmatched low pressure/persistence inspect inspection guidance; for a hazard inspect escalation without repair instructions.
3. Repeat with an unconfirmed-zone report and with no eligible available sessions. Confirm uncertainty/callback support is available and no invented incident, point, restoration or water guarantee appears. To construct the no-stock case, close/cancel only freshly created demo sessions in a disposable scenario or use a dedicated reviewed zone with no sessions.
4. Choose an alternative or decline and inspect the request list before explicit form submission: no service should be created. Then submit the form deliberately and observe requested, not accepted/scheduled.
5. Change a rule version as admin, or publish/lift a relevant notice, and check that older cards become historical/non-current before reevaluation. Record academic review separately; passing technical checks cannot establish it.

Existing executable subsets: all five tests in `verification/advisories-guidance.test.ts`, report-zone/card checks in `verification/context.test.ts`, and immutable/private history in `verification/database.test.ts`. Decision/freshness tables in `verification/guidance-rules-decisions.test.ts` and `guidance-rules-freshness.test.ts` execute outage/needs, assessment/hazard, quality conflicts and source changes. Native N8–9/N27–29/N31–32 verify actual answers/current explanations, historical hiding, decline and uncertainty/no-stock callback alternatives. Academic review remains external.

## DEMO-004

> Resolve an outage with an applicable quality advisory. The advisory remains visible/current until an authorized user explicitly lifts it.

1. As admin, use Official advisories to create/publish a synthetic quality notice targeted to the customer's reviewed zone or connection, with explicit source and demo text. Test boil-water, do-not-drink and do-not-use as distinct kinds; these are display fixtures, not real safety instructions.
2. As staff, advance a separate outage incident through its valid statuses to resolved and publish that progress explicitly. Refresh customer Home and guidance. The quality restriction must remain current even after its planned end time or after completing a separate assistance request.
3. As staff, attempt official publication/lifting through the API: it must be denied. As admin, explicitly lift with current version and a reason. Refresh Home/guidance; the notice disappears from current applicability but remains distinguishable in historical detail/revisions.

Existing executable subset: `verification/advisories-guidance.test.ts`, “DEMO-004: quality restrictions are distinct, independently published and persist past end or outage resolution”; `aqours-web/tests/map.test.ts` checks current layer filtering. `verification/acceptance-privacy.test.ts` additionally combines resolved incident/other report, expired-date quality restriction and completed assistance without coupling their outcomes. Native N17/N27 prove all three restrictions past planned end and resolved outage/completed services, then actual current removal after explicit admin lifts with historical details retained. N39 verifies the final APK end-does-not-lift warning.

## DEMO-005

> A customer reports “still affected.” Only that individual report returns for review; the incident and other customers' outcomes do not automatically reopen.

1. Use one of the new linked reports. Staff reviews received to under_review, then in_progress, then resolved with restored outcome and a reason. Record its first-resolution time and the incident/other report states.
2. In that owner's Android report detail, enter **What is still happening?** and choose **Request another review**. Refresh staff detail. Only that report returns to under_review; prior first-resolution history remains.
3. Confirm the incident, another customer's report and any active quality advisory retain their states. Review Overview: current unresolved state and historical first-resolution duration are distinct; no assistance action should have been submitted automatically.

Existing executable subset: `verification/reports-incidents.test.ts`, “DEMO-002/005: shared incident links, publication dedupe, private snapshots and individual follow-up”; metric-history tests in `verification/database.test.ts` and `aqours-api/test/transactions-metrics.test.ts`. Native N18 performs the action and independently compares the unchanged incident/other report/notices/services; its first-resolution history stays retained.

## DEMO-006

> Customer A changes identifiers to attempt access to customer B's reports, photos, notifications, and assistance requests, and to staff notes. Every prohibited read/mutation is denied without leaking record content.

1. Create an owned report, image, guidance evaluation and assistance request as Customer 01; create a customer-visible staff message/notification and a separate private note. Record safe record UUIDs only.
2. Using Customer 04's session, change request IDs to attempt report get/message/follow-up/guidance, protected attachment get, assistance get/cancel, and notification get/read. Request staff inbox/map/transition routes as a customer and private records without authentication.
3. Expect ownership-safe denial, usually 404 for a foreign owned object; unauthenticated access is 401 and role denial is 403 as specified by the route. Do not demand one status for every endpoint; verify no record contents/private notes/contact/other-household coordinates leak in any response.
4. On Android try a foreign report deep link and notification destination, then sign out and switch accounts. Verify private screen/state recovery and secure session lifecycle; never include tokens/cookies/private request headers in screenshots or evidence.

Existing executable subsets: `verification/security.test.ts` owner guards, controlled images, profile/connection and session tests; guidance private-evidence test in `verification/database.test.ts`. Native N1–5/N14/N22–26 verify account isolation, foreign report denial, revocation/expiry and offline logout/restart/retry. Backend ID-tampering assertions cover the other protected record types.

## DEMO-007

> Deny Android GPS permission and submit using the saved address. Confirm a typed/geocoded address and verify identical coordinates on web/native maps with `[longitude, latitude]`. Failed or ambiguous geocoding retains the report for review and never invents coordinates.

1. On installed Android choose **Use foreground GPS**, deny the foreground permission, then **Use saved service address** and submit successfully. Repeat GPS-unavailable/timeout recovery if possible. No background tracking is required.
2. Enter an alternate address and choose **Find address**. When the operator has privately configured Geoapify credentials, choose a real returned candidate, inspect its native preview, and **Confirm this issue location** before submission. A candidate expires after 15 minutes; refresh if stale. Compare the returned/persisted numeric longitude/latitude with the supplier point and native preview; GeoJSON order is longitude then latitude.
3. Without credentials, or on provider/no-result/ambiguous failure, record that live lookup is unavailable. Choose **Use this address without coordinates** to retain the address as reviewable, or return to saved address. Inspect staff detail/unlocated list; do not infer a service zone or fabricate a point. A forged candidate must fail server validation.
4. Block map style/tiles on each actual client while retaining API access. Verify fields, list navigation and address-only/saved reporting still work. Compare cluster zoom changes against unchanged persisted incident links/priority/boundaries.

Existing executable subsets: both `aqours-api/test/geocode.test.ts` tests use explicit adapter mocks/signatures, `verification/reports-incidents.test.ts` checks persisted point order/bounds, and provider/unlocated tests cover failure paths. Chromium tile-failure fallback is separate from native map behavior. Native NM2/NM3/NM14/NM16 verify denied GPS/saved reporting, genuine503/address-only fallback, controlled GPS accuracy/native-supplier equality and native style404 fallback. Live signed Geoapify candidate/confidence/confirmation/ambiguity/quota/restriction checks still require private operator credentials; GPS does not close that geocoded substep.

## DEMO-008

> A seeded customer requests each assistance type. Staff accepts, schedules, progresses, and completes it; the customer sees the corresponding timeline, service details, and outcomes.

1. Create a fresh owned report for each new request to avoid seeded active same-type duplicates. From guidance or report assistance navigation, deliberately submit callback with question/phone/window; inspection with issue/site/window/access; water support with positive decimal liters and an eligible listed session.
2. Staff opens Assistance queue/detail. Select accepted, assign the active staff owner, and submit. Observe the customer-visible update; water support now has a stable reservation/reference, while initial requested had neither stock guarantee nor appointment.
3. Schedule an agreed Manila time. For water, stay within the session interval. Reschedule with a reason and retain prior appointment history; simulate a missed callback without claiming earlier successful contact. Move to in_progress, with a reason if scheduling was skipped.
4. Complete callback with contact outcome/next steps; inspection with findings/next steps. Water uses **Record collection**, after verifying the issued reference and quantity, then outcome/next steps. Generic water completed is rejected.
5. Refresh customer detail/timeline/notifications after every step. In another eligible unstarted request, cancel with a reason; after work starts, cancellation must fail even if later rescheduled. Inspect independent report/incident/advisory states.

Existing executable subsets: both lifecycle tests in `verification/assistance-admin.test.ts`, `verification/stock.test.ts` collection/release paths and `verification/context.test.ts` report-zone eligibility. Native N11–13/N21/N30/N37 actually verify all three submissions with supplier-browser fulfillment reflected on Android, exact old/new agreed appointments/reasons, outcomes/next steps, reference/collection and generated Manila notification time.

## DEMO-009

> Concurrent pickup approvals cannot exceed stock. Cancellation releases the reservation, collection cannot occur twice, and unavailable sessions lead to a clear support alternative. Verify history and remaining-liter calculations after every operation.

1. In a disposable scenario create a fresh active demo site/session serving the reports' confirmed zone, future operating hours and total `100.00` liters. Submit two separate customer/report water requests for `80.00` each. An initial request does not reserve stock.
2. Accept both concurrently using the API test below, with independent operation keys and current request versions. At most one accepts; remaining stock is `20.00`. Browser double-clicking one action is an idempotency check, not a concurrency test between two different requests.
3. In another fresh 100-liter session accept `60.00` and `40.00`: remaining becomes zero. Collect 60 once: reserved becomes 40, collected 60, remaining remains zero. Cancel the unstarted 40 request: remaining becomes 40. Same-key collect replay returns its original result; a new collect of collected/released allocation conflicts.
4. Exercise request cancel versus collect and session cancel versus acceptance. Session cancellation releases only uncollected stock, makes pending/active uncollected requests unavailable with support follow-up and preserves collected outcomes. Verify every affected customer notification and unchanged independent reports/advisories.
5. Try lowering total below reserved plus collected and reject it. Repeat with exact two-decimal liters. Show full/cancelled/no-option state and callback support on Android; a stale list cannot force acceptance.

Existing executable subsets: all six tests in `verification/stock.test.ts` and acceptance fault rollback in `verification/database.test.ts`. `verification/acceptance-workflow-edges.test.ts` also exercises session-cancel versus collection and cancel versus first work with one irreversible outcome. Native N13/N32/N35 independently verify reference/reserved→collected presentation, exact12.50-liter fulfillment, disabled full/cancelled selections and no-session callback support.

## DEMO-010

> Retry report/update/fulfillment operations and verify no duplicate records, notification deliveries, allocations, or collection. Recreate the database container with its data volume and verify reports/accounts remain; document a separate backup/restore check.

1. Use named HTTP tests to retry report creation, incident publication, acceptance, cancellation and collection with the same actor/method/path/operation UUID and exact original body. Confirm stable IDs/results and one history/notification/allocation. Reusing a key with a changed body must conflict. Do not create a fresh key to resolve an uncertain earlier result.
2. During a disposable client scenario interrupt transport after submitting, then retry the frozen intention while the same process remains open. Repeat for an optional photo after the report receipt: retrying a photo must not create a second report. After process/browser reload, inspect owned history before deliberate new submission because intentions are not durable.
3. Record database/application counts, recreate the database container with the same configured volume using the setup runbook, reconnect and compare retained accounts/reports. Do not run `down -v` for this check.
4. Follow the separate [backup/restore runbook](setup.md#backup-and-restore): pause writers, back up database/migrations plus controlled attachment bytes, restore into a different empty target, compare counts and two image SHA-256 values, then start an isolated API on the restore and verify owner image retrieval, foreign denial and anonymous denial. Container persistence is not backup/restore.

Existing executable subsets: report/publication/stock replay tests and injected transaction rollback tests; operator persistence/restore evidence is recorded in [verification](verification.md). Actual frozen browser administrative retry and isolated restored-image authorization passed; Native NM13 actually retries report/photo requests after a test-only503 following each real commit, with matching operation/canonical-body digests and exactly one report/attachment/upload event. The ordinary API was restored afterward.

## Run the executable subset and record outcomes

Configure an isolated nonproduction API/database according to [setup](setup.md). Fault-injection tests require a dedicated database ending `_test`; they are not appropriate for a live/demo database containing unrelated work. Test helpers create records and may change seeded state. Use the existing project-local commands, not copied session material:

```sh
npm run test:api
npm run test:browser
npm run test:maintenance
npm run test:operations
npm run test:quality
npm run test:recovery
npm run test:map
npm run test:seed
npm --prefix aqours-api test
npm --prefix aqours-web test
npm --prefix aqours-app test
```

For selected original DEMO-labelled HTTP tests, with the same prepared isolated services:

```sh
node --experimental-strip-types --experimental-test-isolation=none --test --test-concurrency=1 --test-name-pattern='DEMO-' verification/*.test.ts
```

That selector intentionally omits supporting tests without DEMO in their titles; run the full suite for ownership, rollback, exact decimals, administration and helper coverage. Browser scripts include connected supplier navigation, messages, review, map rendering/failure/filter retention, auth recovery/throttling, dashboard stale/empty states, callback/inspection/stock fulfillment, link corrections, account/connection maintenance, immutable guidance/rules and advisory publication/revision/lifting assertions. Allow at least a minute between login-heavy suites. Consult verification for the expanded run result; source presence is not execution, and customer API assertions do not establish native interaction. A rendered queue/page alone is not a completed assistance/advisory workflow.

For each walkthrough record scenario ID, date, commit/revision, client/platform/version, fixture references, safe screenshots or assertions, actual result and any unavailable substep. Attach no secrets. Record native permission/SecureStore/photo/map and external provider/academic checks individually. Update [verification](verification.md) and relevant traceability notes only when concrete evidence exists; leaving an unavailable step visible is more accurate than turning the original acceptance checklist into generic PASS.
