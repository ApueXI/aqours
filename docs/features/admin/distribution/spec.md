# Supplier pickup distribution and stock

- Status: **unimplemented target**, documented 2026-10-18 from brief v0.4.
- Baseline: no pickup sites, sessions, stock ledger, allocations, or collection endpoints exist.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S06, REQ-WATER-01–07, REQ-ASSIST-01–06, REQ-ACCESS-03–04 and REQ-OPS-03–05.

---

## WHAT

- Let authorized operational staff/admin maintain pickup sites/sessions, reserve water through accepted assistance, and record collection once.
- Give customers a clear list of current session options without promising stock before acceptance.
- Use one liters-based stock model and transactional allocation history shared with the [assistance queue](../assistance/spec.md).
- Pickup/distribution is a supplier-managed collection service; it has no commerce order, payment, vehicle, driver, home-delivery, or routing lifecycle.
- Operational staff/admin permissions are proposed and must be confirmed before API authorization implementation.
- Two fictional pickup sites and available/full/cancelled sessions are required future demo fixtures.

---

## MUST

### Sites and sessions

- Record site name, address, customer instructions, active state, and optional confirmed coordinate pair/provenance.
- Record each session's site, explicitly served zones, operating times, status, total liters, instructions, and update time.
- Validate referenced sites/zones, paired/ranged coordinates where supplied, and start time before end time.
- Use UTC instants and display operating times in `Asia/Manila` initially.
- Present address/time/instructions/availability as a usable list; a map or route must not be required.
- Distinguish available, full, cancelled, unavailable service, and loading states; finalize exact session lifecycle values before implementation.
- Clearly label seeded availability and any related notices as demonstration data.
- Keep allocation/customer details restricted to authorized operations and the owning customer.
- A site/session public projection must not reveal other customers' identities, contacts, request references, or allocations.
- A stale availability display or recommendation cannot authorize acceptance; the API transaction rechecks the current session.

### Units and invariant

- Use liters only for requested quantities, session totals, reservations, and collection.
- Use exact positive numeric quantities and nonnegative stock totals; do not rely on browser floating-point arithmetic for inventory authority.
- Specify a decimal-safe API representation before implementation; scale/minimum increment remain open choices.
- Compute `remaining = total stock - uncollected reserved liters - collected liters`.
- Released reservations count as zero; a collected allocation is no longer included in reserved liters.
- Collection transfers reserved liters to collected liters and leaves remaining availability unchanged.
- Never accept quantities beyond current remaining stock or permit remaining stock to become negative.
- Never reduce a session's total below the sum of its reserved and collected commitments.
- Retain original quantities, reservation/release/collection times, actors, reasons, and stable references.

### Acceptance and reservation

- Water acceptance is an assistance transition, not a separate disconnected reservation action.
- Require a customer-owned linked report, `water_support` type, positive requested liters, eligible session, and assigned staff owner.
- Lock/recheck the session and affected request/allocation within one consistent transaction protocol.
- Verify `remaining >= requested liters` inside that transaction before reserving.
- Atomically accept the request, reserve quantity, issue a unique pickup reference, and record history/audit/customer notification work.
- Keep at most one allocation per request under the proposed schema; retry must reuse the committed allocation/reference.
- If a competing approval or cancellation wins, return a clear conflict/unavailable outcome without partial acceptance or negative stock.
- Do not silently approve a smaller quantity or move the customer to another session.
- Full/no eligible sessions must lead to a clear callback/support alternative rather than an invented appointment or stock estimate.

### Collection and operation identity

- Collect only an eligible, still-reserved allocation at its accepted session; verify the authenticated staff permission.
- Record the actual collection event and related request outcome atomically, not merely because the operating time passed.
- Move reserved to collected once while preserving the reference and history.
- Replay of the **same idempotency key and payload** returns the original committed result without a new collection/event/notification.
- A **new collection attempt** against an already collected or released allocation is rejected.
- Reusing an operation key with a different payload is rejected without mutation.
- A lost network response must offer lookup/retry of the same operation rather than another fresh collection command.
- The pickup reference identifies a reservation; possession of it alone does not grant customer/staff API permissions.

### Request and session cancellation

- Customer cancellation before work/collection begins releases only that request's uncollected reservation once.
- Serialize cancellation and collection using the same session/request lock order; never release already collected liters.
- Session cancellation records a reason, blocks further acceptance, and releases every uncollected reservation.
- Record each affected assistance outcome/history; do not leave a live accepted reservation against a cancelled session.
- Inform all affected customers, including pending/uncollected request holders, with a clear reason and staff-follow-up option.
- Proposed outcome default: a staff-cancelled session makes its pending/uncollected assistance unavailable; customer-initiated cancellation remains cancelled.
- Confirm that outcome mapping with the shared transition policy before implementation; no new status value is introduced.
- Retain collected allocations/requests as completed history when a session is cancelled afterward.
- If collection commits first, cancellation preserves that collected quantity; if cancellation commits first, collection is rejected.
- If acceptance commits first, session cancellation releases it; if cancellation commits first, acceptance is rejected.
- Commit cancellation, releases, assistance history/outcomes, audit, and notification records/durable work reliably together.
- Repeated cancellation never adds stock twice or duplicates customer notifications.

### Acceptance criteria

- [ ] SUP-DIST-01: Authorized staff creates two demo sites/sessions with valid address/zones/times/liters; customers see labeled list options.
- [ ] SUP-DIST-02: With 100 liters, concurrent 80-liter approvals accept at most one request and leave 20 liters available.
- [ ] SUP-DIST-03: Accepting 60 and 40 liters leaves zero; collecting 60 leaves zero; cancelling the remaining 40 releases exactly 40.
- [ ] SUP-DIST-04: Acceptance rollback leaves no accepted request without its unique reservation/reference/history/notification work.
- [ ] SUP-DIST-05: Same-key collection replay creates no new event; a new collect attempt on collected/released stock is rejected.
- [ ] SUP-DIST-06: Request cancellation and collection races preserve stock/history under either commit order.
- [ ] SUP-DIST-07: Session cancellation races with acceptance/collection safely, releases only uncollected commitments, and informs affected customers once.
- [ ] SUP-DIST-08: Stock corrections below reserved plus collected liters are rejected; valid exact-decimal amounts preserve the invariant.
- [ ] SUP-DIST-09: Full/cancelled/no sessions provide a support alternative and never promise acceptance from a stale list.
- [ ] SUP-DIST-10: Customers cannot access other allocations or staff inventory writes; collected assistance does not resolve reports/incidents/advisories.

---

## HOW

### Proposed components and interfaces

- Proposed React responsibilities: site/session list/detail, operating/zone forms, inventory breakdown, allocation lookup, cancellation preview, and collection confirmation in `aqours-web/`.
- Proposed Express responsibilities: authorized session management and one allocation/stock transaction service shared with assistance in `aqours-api/`.
- Proposed data: pickup sites, distribution sessions, served-zone associations, assistance requests/updates, water allocations, idempotency records, notifications/outbox, and audit/history.
- Proposed `GET /api/v1/staff/distribution/sessions`: authorized sessions and total/reserved/collected/remaining breakdown with as-of time.
- Proposed site/session create/edit interfaces: validated address/zones/operating times/status/total liters and expected version.
- Proposed assistance acceptance interface invokes reservation; do not create an independent unlinked “approve stock” workflow.
- Proposed `POST /api/v1/staff/water-allocations/:id/collect`: expected state, operation key, and server-authorized collection result.
- Proposed `POST /api/v1/staff/distribution/sessions/:id/cancel`: reason, expected state/version, and repeat-safe cancellation result.
- Proposed customer session-list interface exposes options/availability; owned request detail exposes only that customer's allocation/reference.
- Interfaces/modules are proposals; final endpoint contracts and filenames do not exist.

### Transaction approach

- Choose a documented consistent lock order for the session, request, and allocation used by every stock-changing path.
- Recompute/check commitments under the session lock, or use an equivalently verified serializable/database operation.
- A row check on nonnegative total stock cannot enforce cross-row reservation sums; use transactions/locking plus uniqueness.
- Include acceptance, collection, request/session cancellation, and stock-total edits in that same concurrency protocol.
- Persist idempotency input fingerprint/result in the commit boundary; stable event IDs deduplicate notification work.
- Keep released allocation rows and collection history; do not reconstruct the ledger from mutable request status alone.
- Refresh published availability and current contextual guidance after committed changes; recommendations cannot reserve stock.
- Use transactional fault injection tests before claiming stock or notification reliability.

### Verification and operation

- Run real PostgreSQL concurrent acceptance/collection/cancellation/stock-edit tests, including both race commit orders and retries.
- Verify exact-liter arithmetic, allocation uniqueness, reference stability, rollback, customer privacy, and the shared assistance timeline.
- Exercise list-only operation, failed refresh, unknown network result, full/cancelled states, and staff follow-up on web/Android when implemented.
- Audit stock actions with actor/time/target/reason; observe invariant breaches, lock/transaction errors, conflicts, and failed notification work without logging customer contacts.
- Dependencies: [authentication](../auth/spec.md), [assistance](../assistance/spec.md), and zone administration in [settings](../settings/spec.md).
- Open choices: quantity scale, precise session eligibility/closure policy, exception transition mapping, and outbox/transaction implementation.
- Technical reference: [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html); the chosen transaction protocol still requires project-specific tests.
- This specification changes no stock, accepts no request, and provides no running distribution service.
