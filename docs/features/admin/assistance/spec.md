# Supplier assistance queue

- Status: **implemented first-release behavior; acceptance evidence remains qualified**, updated 2026-10-19.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S06, REQ-ASSIST-01–06, REQ-CALLBACK-01, REQ-INSPECTION-01, REQ-WATER-01–07, REQ-ACCESS-03–04 and REQ-OPS-04–05.

---

## WHAT

- Let authorized staff/admin fulfill customer requests for callback/support, site inspection, and water pickup/distribution assistance.
- Use one request workflow and shared queue while retaining type-specific details and outcomes.
- Give each customer an accurate owned timeline, agreed appointment/pickup information, and permitted follow-up/cancellation actions.
- Staff/admin operational access follows the adopted role matrix enforced by the backend.
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
- Active states: `requested`, `accepted`, `scheduled`, `in_progress`; terminal history remains retained.
- Keep customer-visible updates separate from supplier-only notes/contact discussion.
- Restrict question/contact/access instructions to the owning customer and authorized supplier operations.

### Shared lifecycle

- Follow `requested -> accepted -> scheduled -> in_progress -> completed`.
- Support `unavailable` and `cancelled` alternate outcomes with a recorded reason and customer notification.
- Enforce the implemented transition/permission matrix; do not allow arbitrary client-selected transitions.
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

### Implemented behavior and modules

`aqours-web/src/pages/Assistance.tsx`, `AssistanceDetail.tsx` and `components/AssistanceActions.tsx` implement filtered queue/detail, ownership, scheduling, progress, reasons, outcomes and notes for all three services.

`aqours-api/src/routes/assistance.ts`, `assistance-workflow.ts`, `collection.ts` and `services/stock.ts` enforce the transition matrix, staff owners and immutable event/appointment history. Scheduling needs an agreed instant; rescheduling/immediate support/unavailability require reasons. Callback/inspection completion requires outcome and next steps; water completes only via collection. Cancellation is disallowed after work begins; session cancellation releases uncollected stock and supplies follow-up.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

Public timeline events expose only validated old/new appointment instants as appointmentChange; both clients show agreed Manila times and the reason. Private arbitrary audit metadata remains excluded.

Assistance/admin/stock HTTP tests and actual supplier browser actions cover fulfillment, exact old/new appointments, ownership and races. N11–13/N15/N21/N30/N32/N35 independently verify native submissions, supplier fulfillment/outcomes, old/new appointments/reasons, pickup collection/cancellation and unavailable alternatives. See the [native ledger](../../../native-verification.md) for bounded evidence; no exhaustive failure-permutation claim is made.

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.
