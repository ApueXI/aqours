# Customer Notifications

Status: **UNIMPLEMENTED target specification**. Updated: **2026-10-18**.

---

## WHAT

- Let a customer read persisted in-app updates about their reports, linked incident publications, applicable area advisories, and assistance requests.
- First-release delivery uses foreground polling/refetch; SMS, email, push, and WebSockets are optional later work.
- Current evidence: the [starter routes](../../../../aqours-app/src/app/) provide no notification list, persistence, or polling behavior.
- Notification visibility does not grant access to an otherwise unauthorized linked record.

---

## MUST

### Owned updates and publication integrity

- Satisfy REQ-ACCESS-03, REQ-UI-C06, REQ-INCIDENT-07, REQ-NOTICE-04, and REQ-ASSIST-04 in [requirements](../../../requirements.md).
- List only the authenticated customer's notifications and authorize each read-state mutation on the API.
- Notify linked reporters of a published incident update; independently notify matching service connections for an area advisory.
- Deduplicate per customer and source event, including multiple matching owned reports/connections and repeated publication requests.
- Commit publication and notification records atomically or through reliable durable outbox work; polling must not create delivery records repeatedly.
- Include customer-safe text, event time, read state, and an authorized destination; exclude staff notes and another customer's contact/location data.
- Reflect assistance acceptance, scheduling, progress, rescheduling, unavailability, cancellation, and completion through customer-visible updates.
- Preserve distinct advisory types and demonstration labels rather than recasting a notification as a water-safety determination.

### List, read, and failure behavior

- Present ordered, paginated results with clear empty, loading, and retry states.
- Refresh while foregrounded and on deliberate refresh; the polling interval and pagination contract remain proposed.
- Marking a notification read must be safe to repeat and must not publish, acknowledge, resolve, or cancel its underlying record.
- Opening a link must recheck destination ownership/publication permissions; handle an inaccessible or no-longer-current destination explicitly.
- After a network/read-state error, show the confirmed server state or a clear pending/error indicator; do not silently claim a successful change.
- On session expiry or account switch, clear the prior customer's notification view and stop requests under the old identity.
- Preserve publication time and latest relevant revision; an old notification must not cause superseded guidance to appear current.

### Acceptance

- [ ] NOTIFY-C-01: One incident publication reaches two linked customers once each, including a customer with multiple linked reports.
- [ ] NOTIFY-C-02: A matching area advisory reaches a connection even without a submitted report; an unmatched connection receives none.
- [ ] NOTIFY-C-03: Customer A cannot list, fetch, or mark customer B's notification read by substituting its ID.
- [ ] NOTIFY-C-04: Polling, refresh, repeated read requests, and publication retries create no duplicate notifications or domain mutations.
- [ ] NOTIFY-C-05: Assistance reschedule/cancellation explains its reason; links open the customer's current authorized record.
- [ ] NOTIFY-C-06: Empty, failed network, expired session, stale guidance, and inaccessible destination cases have accurate recovery states.

---

## HOW

### Proposed interfaces and records

- Add an Expo Router list/detail entry with request/polling hooks outside the route directory; keep any badge derived from the owned response.
- Illustrative contracts, not live endpoints: `GET /api/v1/notifications` and an idempotent read-state update for one owned notification.
- Resolve the exact read method, pagination fields, and unread-count behavior in the shared API contract before coding.
- Use the [schema](../../../schema.md) notification proposal: recipient user, source-event key, safe text/type, relevant link, creation/read timestamps, and recipient/event uniqueness.
- Supplier publication/assistance services create notification rows or durable work; customer notification reads do not recreate them.
- On destination open, fetch the current [report](../report/spec.md), [assistance request](../assistance/spec.md), or published notice using its normal authorized API.
- Use current source revisions for [guidance](../guidance/spec.md); historical notification text is not an instruction to ignore later approved notices.

### Sequencing and future verification

1. Establish [auth](../auth/spec.md), recipient-scoped persistence, and an owned list/read contract.
2. Implement publication and assistance fan-out with stable event identifiers and transactional/durable guarantees.
3. Add foreground refresh and authorized navigation, then exercise retries and account switching.

- Test API ownership, duplicate event/audience matching, pagination, repeated read-state changes, and transaction rollback around publication.
- Test Android foreground refresh, failed refresh/read updates, expired sessions, old notice links, and navigation back to the list.
- Log publication/event correlation and delivery failures without credentials or private message bodies.
- Sources and broader constraints: [architecture](../../../architecture.md), [workflows/setup](../../../workspace.md), and [customer role](../../../domains/customers.md).
