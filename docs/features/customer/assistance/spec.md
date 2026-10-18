# Customer Assistance Requests

Status: **UNIMPLEMENTED target specification**. Updated: **2026-10-18**.

---

## WHAT

- Let a customer deliberately request callback/support, site inspection, or supplier-managed water pickup/distribution assistance.
- Include request entry, owned request list/detail/timeline, appointment/pickup information, follow-up, and eligible cancellation.
- A linked report provides context; an incident link is optional and does not replace report ownership.
- A [guidance](../guidance/spec.md) card may recommend a service, but customers can choose an appropriate alternative or decline.
- Current evidence: [starter routes](../../../../aqours-app/src/app/) and the empty API have no assistance form, scheduling, pickup, stock, or request persistence.
- Exclude commerce orders/payments, home delivery, fleet tracking, route optimization, and a separate inspector app.
- This feature shows supplier decisions; staff processing, acceptance, schedules, and stock authority remain on the API/supplier side.

---

## MUST

### Ownership and shared request workflow

- Satisfy REQ-UI-C05, REQ-ASSIST-01 through REQ-ASSIST-06, REQ-CALLBACK-01, REQ-INSPECTION-01, and REQ-WATER-01 through REQ-WATER-07 in [requirements](../../../requirements.md).
- Each request belongs to the signed-in customer and one of their reports; its type is `callback`, `inspection`, or `water_support`.
- Keep optional incident context customer-safe; do not permit an arbitrary foreign report/request/session assignment.
- Prevent duplicate active requests of the same customer/report/type; the proposed active set is `requested`, `accepted`, `scheduled`, and `in_progress`.
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
- Validate type-specific required fields server-side; concrete lengths/contact formats remain implementation choices.

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
- Proposed outcome: session cancellation makes pending/uncollected water requests `unavailable`; collected outcomes remain unchanged and customer cancellation uses `cancelled`. Confirm the detailed transition matrix before implementation.
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

### Proposed components and interfaces

- Use focused Expo Router request/list/detail screens; place shared workflow, type-specific forms, appointment/pickup views, hooks, and API code outside `src/app/`.
- Add Express request services that validate ownership, type-specific detail, active-request uniqueness, and allowed transitions.
- Illustrative API groups, not live contracts: `/api/v1/assistance-requests`, owned request details/updates/cancellation, and `/api/v1/pickup-sessions`.
- Finalize request DTOs, supported verbs, pagination, idempotency keys, availability responses, and conflict/error codes before implementation.
- Customer creation payloads include owned report, selected type, relevant detail, preferred window, and water quantity/session where applicable; identity is server-derived.
- Responses expose current status, customer-safe updates, appointment/pickup details, allowed customer actions, and explicit unavailability/review reasons.
- Do not allow client-supplied staff owner, accepted status, stock totals, allocation state, or collection timestamp to become authoritative.

### Data and transaction flow

1. Load [auth](../auth/spec.md), an [owned report](../report/spec.md), and optional recommendation context.
2. Load current pickup options when appropriate; collect type-specific fields and confirm submission explicitly.
3. Create request/detail/history through the API's idempotent operation and return the committed `requested` record.
4. Supplier acceptance assigns an owner and, for water support, reserves liters/issues a reference in the same transaction.
5. Customer reads appointment/progress/outcome through owned updates and [notifications](../notifications/spec.md).
6. An eligible cancellation rechecks current state, records history/reason, and releases only the uncollected allocation transactionally.

- Use proposed `assistance_requests`, type-specific detail records, `assistance_updates`, sessions/sites, `water_allocations`, notifications, and idempotency support from [schema](../../../schema.md).
- Stock acceptance/release/collection and total-stock corrections must use one consistent locking/serialization protocol, with committed results reused on retry.
- A rolled-back acceptance must expose neither a confirmed reservation nor a usable new pickup reference to the customer.
- Notify from a committed service event, not repeated client polling; record relevant actor/time/reason without logging private contact/access details unnecessarily.

### Dependencies, future tests, and open decisions

- Sequence shared request/status persistence after auth/report ownership, then callback/inspection scheduling and pickup session/allocation contracts.
- The guidance method can remain proposed while deliberate manual service requests and their confirmed assistance types are specified.
- Add API tests for type validation, ownership, active uniqueness, transition/cancel races, idempotency, and notification deduplication.
- Test concurrent stock approval, request/session cancellation, repeat release/collection, rollback, and nonnegative remaining-liter invariants against PostgreSQL.
- Exercise Android all-type forms, unavailable/full sessions, staff updates, missed/rescheduled appointments, failed requests, and safe retries.
- Resolve contact validation, preferred/agreed window contracts, liters precision, exact cancellation transitions, and no-session request handling before implementation.
- No dependency or application change is authorized by this spec; use [architecture](../../../architecture.md), [workflows/setup](../../../workspace.md), and [customer role](../../../domains/customers.md) for shared boundaries.
