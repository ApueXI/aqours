# Supplier pickup distribution and stock

- Status: **implemented first-release behavior; acceptance evidence remains qualified**, updated 2026-10-19.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S06, REQ-WATER-01–07, REQ-ASSIST-01–06, REQ-ACCESS-03–04 and REQ-OPS-03–05.

---

## WHAT

- Let authorized operational staff/admin maintain pickup sites/sessions, reserve water through accepted assistance, and record collection once.
- Give customers a clear list of current session options without promising stock before acceptance.
- Use one liters-based stock model and transactional allocation history shared with the [assistance queue](../assistance/spec.md).
- Pickup/distribution is a supplier-managed collection service; it has no commerce order, payment, vehicle, driver, home-delivery, or routing lifecycle.
- Operational staff/admin permissions follow the adopted role matrix enforced by the API.
- Two fictional pickup sites and available/full/cancelled sessions are implemented demo fixtures.

---

## MUST

### Sites and sessions

- Record site name, address, customer instructions, active state, and optional confirmed coordinate pair/provenance.
- Record each session's site, explicitly served zones, operating times, status, total liters, instructions, and update time.
- Validate referenced sites/zones, paired/ranged coordinates where supplied, and start time before end time.
- Use UTC instants and display operating times in `Asia/Manila` initially.
- Present address/time/instructions/availability as a usable list; a map or route must not be required.
- Distinguish available, full, cancelled, unavailable service, and loading states; use open/closed/cancelled session states and computed available/full/unavailable outcomes.
- Clearly label seeded availability and any related notices as demonstration data.
- Keep allocation/customer details restricted to authorized operations and the owning customer.
- A site/session public projection must not reveal other customers' identities, contacts, request references, or allocations.
- A stale availability display or recommendation cannot authorize acceptance; the API transaction rechecks the current session.

### Units and invariant

- Use liters only for requested quantities, session totals, reservations, and collection.
- Use exact positive numeric quantities and nonnegative stock totals; do not rely on browser floating-point arithmetic for inventory authority.
- Use exact NUMERIC(14,2) liters and decimal strings in API responses; positive requests use at most two fractional digits.
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
- Keep at most one allocation per request under the adopted schema; retry must reuse the committed allocation/reference.
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
- Adopted outcome default: a staff-cancelled session makes its pending/uncollected assistance unavailable; customer-initiated cancellation remains cancelled.
- Use that outcome mapping with the implemented shared transition policy; no new status value is introduced.
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

### Implemented behavior and modules

`aqours-web/src/pages/Distribution.tsx`, `components/DistributionForms.tsx` and assistance collection controls implement site/session maintenance, exact stock breakdown, reservation context, collection and reasoned cancellation.

`aqours-api/src/routes/distribution.ts`, `pickup-sites.ts`, `collection.ts` and `services/stock.ts` share one session-before-request locking protocol. SQL NUMERIC(14,2) liters serialize as decimal strings; stock is total minus reserved minus collected. Database constraints/triggers prevent overcommitment, ledger deletion and invalid transitions. Session cancellation makes active uncollected requests unavailable while retaining collected history; stock edits cannot undercut commitments.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

Review real-database concurrent stock tests, decimal arithmetic, cancellation and repeated collection evidence. Browser distribution rendering is separate from a demonstrated Android pickup flow; no real-world availability is certified.

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.
