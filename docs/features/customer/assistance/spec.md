# Customer Assistance Requests

Status: **implemented first-release behavior; acceptance evidence remains qualified**. Updated: **2026-10-19**.

---

## WHAT

- Let a customer deliberately request callback/support, site inspection, or supplier-managed water pickup/distribution assistance.
- Include request entry, owned request list/detail/timeline, appointment/pickup information, follow-up, and eligible cancellation.
- A linked report provides context; an incident link is optional and does not replace report ownership.
- A [guidance](../guidance/spec.md) card may recommend a service, but customers can choose an appropriate alternative or decline.
- Exclude commerce orders/payments, home delivery, fleet tracking, route optimization, and a separate inspector app.
- This feature shows supplier decisions; staff processing, acceptance, schedules, and stock authority remain on the API/supplier side.

---

## MUST

### Ownership and shared request workflow

- Satisfy REQ-UI-C05, REQ-ASSIST-01 through REQ-ASSIST-06, REQ-CALLBACK-01, REQ-INSPECTION-01, and REQ-WATER-01 through REQ-WATER-07 in [requirements](../../../requirements.md).
- Each request belongs to the signed-in customer and one of their reports; its type is `callback`, `inspection`, or `water_support`.
- Keep optional incident context customer-safe; do not permit an arbitrary foreign report/request/session assignment.
- Prevent duplicate active requests of the same customer/report/type; the adopted active set is `requested`, `accepted`, `scheduled`, and `in_progress`.
- Submit only after explicit customer confirmation; guidance evaluation and opening a form must not create a request.
- Show `requested -> accepted -> scheduled -> in_progress -> completed` with `unavailable` and `cancelled` alternate outcomes.
- Staff acceptance assigns an owner; customers cannot self-accept, schedule supplier work, mark collection, or complete requests.
- Immediate support may skip scheduling only when staff records a reason; show the resulting customer-visible history.
- A submitted request guarantees neither an appointment nor water stock; distinguish requested, accepted, and scheduled clearly.
- Keep current status, assigned service context, customer-visible updates, server timestamps, and agreed appointment/pickup details accessible.
- Paginate the owned request list; distinguish no requests from a failed lookup and preserve access to existing request details.
- Do not expose internal notes, another customer's requests, or another household's contact/location details.

### Callback and inspection forms

- Callback collects the question, preferred contact method/number, and preferred time window.
- Show the agreed callback appointment, staff contact outcome, and any missed-callback reschedule with reason/time history.
- Inspection collects issue details, site address, preferred visit window, and access instructions.
- Keep the inspection site snapshot separate from the saved supplier service address and report location.
- Show the agreed visit, progress, findings, and next steps; staff records them in the supplier application.
- Preferred windows are requests, not confirmed appointments; display scheduling times in `Asia/Manila` initially.
- Validate type-specific required fields server-side; concrete field validation is defined in the API contract and server schemas.

### Water support and pickup availability

- Collect a positive requested quantity in liters and a selected listed session when an option is available.
- Show pickup site address, operating times, instructions, current session status/availability, and demonstration-data labels in a usable list.
- Availability shown before acceptance is informational; the API must recheck it when staff accepts.
- If no session is available, retain the request/context appropriately and offer callback/support; do not invent a session or guarantee water.
- Staff acceptance reserves stock transactionally and issues a pickup reference; show it only after confirmed acceptance.
- Show that confirmed reference, operating details, and the later collection outcome together; a pickup reference alone grants no API access.
- Calculate `remaining liters = total liters - uncollected reserved liters - collected liters`.
- Collection converts the allocation from reserved to collected once; it must not subtract the same liters twice.
- Concurrent approvals cannot reserve more than remaining stock; a stale client display cannot override current capacity.
- A repeated acceptance/collection cannot allocate or collect twice; collected stock remains collected after session cancellation.
- Water fulfillment is pickup/distribution at supplier-managed points, without route calculation or home-delivery promises.

### Cancellation, updates, and independent outcomes

- Allow the customer to cancel before work or collection begins, with a recorded reason and retained timeline.
- The API decides cancellation eligibility from current state, not from a cached button; reject stale conflicting changes clearly.
- Cancellation releases an uncollected reservation once; a released allocation cannot later be collected.
- Session cancellation releases uncollected reservations, informs affected customers with a reason, and offers staff follow-up.
- Adopted outcome: session cancellation makes pending/uncollected water requests `unavailable`; collected outcomes remain unchanged and customer cancellation uses `cancelled`. Enforce the implemented transition matrix documented in workspace.
- Show reasons for unavailability, cancellation, or rescheduling and notify the customer; preserve earlier appointment/update history.
- Completion records the assistance outcome/next steps and does not resolve the linked report, incident, or advisory.
- Quality guidance remains applicable until explicitly lifted by an authorized supplier user.
- Failed submit/cancel/refresh operations need explicit retry states; safe retries must not duplicate requests, reservations, releases, or notifications.
- After an ambiguous timeout, retrieve the committed result/current state before offering a conflicting action or claiming acceptance failed.

### Acceptance

- [ ] ASSIST-C-01: A seeded customer submits each of the three types and sees `requested`, without an automatic acceptance or appointment claim.
- [ ] ASSIST-C-02: Staff accepts, schedules, progresses, and completes each type; the owner sees the corresponding timeline and service outcome.
- [ ] ASSIST-C-03: Two active same-type requests for one customer/report are prevented, while different types or later legitimate requests retain independent history.
- [ ] ASSIST-C-04: Foreign request/report IDs and customer attempts to accept/schedule/collect are denied by the API.
- [ ] ASSIST-C-05: Concurrent water approvals cannot overspend stock; accepted support has a stable pickup reference and accurate liters.
- [ ] ASSIST-C-06: Eligible cancellation releases stock once; repeated collection is rejected and a released allocation cannot be collected.
- [ ] ASSIST-C-07: A full/cancelled/no-session case shows accurate unavailability and callback/support; session cancellation explains follow-up to every affected customer.
- [ ] ASSIST-C-08: Rescheduled/missed callbacks and inspections preserve agreed appointment history, reasons, and next steps.
- [ ] ASSIST-C-09: Retry/timeout and cancel-versus-start/collect races cannot corrupt state; assistance completion leaves report/incident/advisory status independent.

---

## HOW

### Implemented behavior and modules

`aqours-app/src/features/assistance/screens/assistance-form.tsx`, `pickup-options.tsx` and `assistance-detail.tsx` implement all three request types, listed pickup options, owned detail/history and eligible cancellation. Routes live under `src/app/(customer)/assistance/`.

`aqours-api/src/routes/assistance.ts`, `assistance-workflow.ts`, `collection.ts` and `services/distribution/stock.service.ts` own validation, deduplication, appointment history, reservation and completion. Callback/inspection/water details are JSONB in one assistance record, not separate detail tables. Water acceptance reserves exact liters and issues a reference; collection is separate. Uncollected session cancellation produces unavailable plus support follow-up. Neither completion nor cancellation resolves a report, incident or advisory.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

Actual installed N11–13/N15/N21/N30/N32/N35 cover all three native submissions, real supplier-browser acceptance/scheduling/rescheduling/completion, exact12.50-liter pickup/reference/collection, outcomes/next steps and eligible reasoned cancellation. Native old/new agreed appointments, disabled full/cancelled options and no-session callback fallback are verified. API PostgreSQL races establish stock/cancellation concurrency separately. See the [native ledger](../../../native-verification.md).

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.

Presentation update: [UI/UX design and navigation](../../../ui-ux.md) documents the shared components and revised customer/supplier workflows. Existing acceptance criteria and domain permissions remain unchanged.

## Reference-led presentation — 22 October 2026

All three existing assistance forms retain details → review/change → deliberate submission and now display a “Request received” reference with Track this request/Return to report actions. The receipt explicitly states supplier review is pending: it does not confirm an appointment or pickup allocation. Existing uncertain-operation locking/retry, exact liters and supplier transitions are unchanged. See [UI/UX](../../../ui-ux.md) for executed native verification and artifact boundaries.
