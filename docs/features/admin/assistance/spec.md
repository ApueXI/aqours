# Supplier assistance queue

- Status: **unimplemented target**, documented 2026-10-18 from brief v0.4.
- Baseline: no assistance records, staff queue, scheduling, notifications, or fulfillment services exist.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S06, REQ-ASSIST-01–06, REQ-CALLBACK-01, REQ-INSPECTION-01, REQ-WATER-01–07, REQ-ACCESS-03–04 and REQ-OPS-04–05.

---

## WHAT

- Let authorized staff/admin fulfill customer requests for callback/support, site inspection, and water pickup/distribution assistance.
- Use one request workflow and shared queue while retaining type-specific details and outcomes.
- Give each customer an accurate owned timeline, agreed appointment/pickup information, and permitted follow-up/cancellation actions.
- Staff/admin operational access is proposed; exact permissions must be confirmed before backend implementation.
- [Distribution](../distribution/spec.md) owns pickup sites/session inventory and stock protocol; acceptance here invokes that same transactional service.
- Separate inspector apps, home delivery, fleet tracking, commerce orders, and automatic approval are outside scope.

---

## MUST

### Queue and ownership

- Display all three types: `callback`, `inspection`, and `water_support`.
- Show customer/report reference, request time, type, status, assigned owner, and relevant appointment/session information.
- Provide pagination and useful type/status/owner/time filters; zone filters use explicit reviewed associations.
- Every request belongs to a customer and linked report; an incident link is optional.
- Verify that the linked report belongs to the request's customer, including when staff accesses related records.
- Assign an authorized staff owner at acceptance and retain ownership history as it changes.
- Prevent duplicate active requests of the same type for the same customer/report.
- Proposed active states: `requested`, `accepted`, `scheduled`, `in_progress`; terminal history remains retained.
- Keep customer-visible updates separate from supplier-only notes/contact discussion.
- Restrict question/contact/access instructions to the owning customer and authorized supplier operations.

### Shared lifecycle

- Follow `requested -> accepted -> scheduled -> in_progress -> completed`.
- Support `unavailable` and `cancelled` alternate outcomes with a recorded reason and customer notification.
- Finalize the detailed transition/permission matrix before implementation; do not allow arbitrary client-selected transitions.
- A submitted request is neither an accepted service nor a guaranteed appointment/water allocation.
- Immediate support may move from accepted to in progress without scheduling only with a recorded reason.
- Preserve requested windows separately from the agreed appointment; a preference is not a confirmed booking.
- Rescheduling records old/new appointment, actor/time/reason, and a customer-visible update.
- Allow customer cancellation before work or collection begins; recheck the current state inside the transaction.
- Deny customer cancellation after the applicable start boundary and explain the conflict/current state.
- Retain cancelled/unavailable/completed requests and their updates; no destructive replacement of earlier history.
- Record a completion outcome and usable next steps without automatically resolving the linked report/incident/advisory.
- A customer follow-up requiring further review must remain distinct from an automatic incident reopening.

### Callback/support details

- Show the customer's question, preferred contact method/number, and preferred time window.
- Record a staff-agreed appointment and the contact outcome, including a missed callback when applicable.
- Let staff reschedule a missed callback with reason/history and customer notification.
- Keep contact attempts/outcomes accurate; an appointment or attempted contact must not imply successful assistance completion.
- Do not add automatic SMS/email/push delivery to the first-release workflow.

### Inspection details

- Show issue details, site-address snapshot, preferred visit window, and access instructions.
- Distinguish the inspection site from the connection's saved address and any other report location.
- Schedule a staff-agreed visit and record findings and next steps in the supplier application.
- Publish only intentional customer-safe findings/outcomes; internal notes never leak through the timeline.
- An inspection result does not constitute automatic water-safety diagnosis or close a report without its separate review.

### Water-support integration

- Show requested liters, selected session, site address, operating times, availability, and collection instructions.
- At acceptance, reserve the requested positive liters and issue one pickup reference using the distribution transaction.
- If stock/session eligibility changed, leave no partial acceptance/allocation and show an unavailable/conflict result.
- Keep accepted, scheduled/session details, in-progress handling, and completed collection distinguishable.
- Record actual collection exactly once; this is not an automatic completion on the scheduled date.
- Release only uncollected reservations on eligible request cancellation; retain the allocation/history.
- Serialize cancellation with acceptance/collection so a stale customer cancellation cannot release collected stock.
- Session cancellation informs every affected customer, releases uncollected stock, and records the resulting request outcome/follow-up.
- When no pickup option exists, explain unavailability and offer callback/support; do not silently create another request.
- Recommendations or displayed session availability never reserve stock or promise acceptance.

### Retry, publication, and time

- Validate input and authorize every queue/detail/transition request on the API.
- Use stable operation keys for acceptance, scheduling, rescheduling, progression, cancellation, and completion.
- Atomically commit state, appointment/allocation changes, history, and customer notification rows/durable work.
- A replay of the same committed operation must not repeat a transition or create another notification/allocation.
- Reject stale/invalid operations and incompatible key reuse without overwriting another staff member's work.
- Show explicit uncertain-result/retry states; do not assume a failed response means the server rejected the action.
- Store UTC instants and display `Asia/Manila`; validate agreed time windows and applicable session intervals.

### Acceptance criteria

- [ ] SUP-ASSIST-01: Staff accepts, schedules, progresses, and completes one request of each type; the owner sees every intended update.
- [ ] SUP-ASSIST-02: Acceptance assigns an owner; duplicate active same-type requests for one customer/report are rejected/deduplicated.
- [ ] SUP-ASSIST-03: A missed callback is rescheduled with old/new times and reason preserved, without claiming a successful prior contact.
- [ ] SUP-ASSIST-04: An inspection retains site/access details and records findings/next steps without exposing internal notes.
- [ ] SUP-ASSIST-05: Immediate support skips scheduling only with a reason; ordinary unsupported transitions are denied.
- [ ] SUP-ASSIST-06: Eligible customer cancellation releases an uncollected reservation once; cancellation after work/collection begins fails safely.
- [ ] SUP-ASSIST-07: Water acceptance cannot over-reserve stock or succeed without its allocation/reference; no option leads to a clear support alternative.
- [ ] SUP-ASSIST-08: Retry/concurrent schedule/accept/cancel operations preserve one coherent history and one notification per event/recipient.
- [ ] SUP-ASSIST-09: Customer A cannot read/change customer B's request or linked report by altering an ID.
- [ ] SUP-ASSIST-10: Completion changes only the assistance outcome; report, incident, and quality advisory retain independent review/state.

---

## HOW

### Proposed components and interfaces

- Proposed React responsibilities: filtered queue, request detail, type-specific information, owner/appointment controls, separate internal notes, and customer-update preview in `aqours-web/`.
- Proposed Express responsibilities: assistance workflow service, type-specific validation, appointment history, and shared notification/stock services in `aqours-api/`.
- Proposed data: assistance requests/updates, one-to-one type details, transition/appointment history, reports/customer ownership, internal notes, and audit events.
- Proposed water dependencies: distribution sessions and unique request-linked allocations; no separate order model.
- Proposed `GET /api/v1/staff/assistance-requests` and `GET /api/v1/staff/assistance-requests/:id`: paginated authorized queue/detail.
- Proposed acceptance interface: request ID, eligible owner/session context, expected version, and operation key; invokes stock allocation for water support.
- Proposed scheduling/rescheduling interface: agreed times, reason where required, expected version, and operation key.
- Proposed progress/completion/unavailability interfaces: validated transition, outcome/reason, customer-visible update, and operation key.
- Proposed customer cancellation interface shares the workflow service and enforces ownership plus start-boundary checks.
- These interfaces and module responsibilities are proposals; no route files or completed contracts exist.

### Implementation and verification

- Guard row ownership/type/active-request invariants with foreign-key/integrity design and a partial unique active-request index as proposed in schema.
- Use expected-version checks/locking for appointment and state conflicts; serialize water operations through the distribution lock protocol.
- Validate contact/time/site fields without logging their private contents; render text safely and expose only deliberate customer updates.
- Test every service lifecycle, missed callback, reschedule, unavailable outcome, immediate-support reason, and cancellation boundary.
- Test direct unauthorized reads/mutations, duplicate active requests, retried actions, concurrent staff edits, and notification rollback/deduplication.
- Run real transaction tests for water acceptance/cancellation/collection races; client-only tests cannot verify inventory correctness.
- Exercise customer timelines on Android and staff queue on web when implementation is requested.
- Observe failed/conflicting transitions and notification failures; audit actor/time/target/reason without private contact content.
- Dependencies: [authentication](../auth/spec.md), [reports](../report/spec.md), [distribution](../distribution/spec.md), and contextual recommendation interfaces.
- Open choices: detailed exception transitions, start-boundary event representation, time-window defaults, and notification transaction/outbox implementation.
- No fulfillment, outbound contact, or acceptance test is executed by creating this specification.
