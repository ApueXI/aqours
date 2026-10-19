# Customer Notifications

Status: **implemented first-release behavior; acceptance evidence remains qualified**. Updated: **2026-10-19**.

---

## WHAT

- Let a customer read persisted in-app updates about their reports, linked incident publications, applicable area advisories, and assistance requests.
- First-release delivery uses foreground polling/refetch; SMS, email, push, and WebSockets are optional later work.
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
- Refresh while foregrounded and on deliberate refresh; the polling interval and pagination contract are documented below.
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

### Implemented behavior and modules

`aqours-app/src/features/notifications/screens/notifications-screen.tsx` and `src/app/(customer)/notifications.tsx` implement owned pagination, read updates and authorized destination navigation.

`aqours-api/src/routes/guidance.ts` implements notification list/detail/read routes; publication and fulfillment services create rows transactionally. SQL uniqueness on recipient/source event deduplicates audience overlap. Read updates preserve the first read time and do not republish anything. Foreground refetch/polling uses `src/hooks/use-resource.ts`; external channels are outside this release.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

Notification DTOs use an explicit allowlist. Generated appointment labels display Asia/Manila while immutable stored UTC text remains untouched. A failed open/read request keeps the confirmed unread state and offers retry; destination reads remain independently authorized.

Actual installed N10/N21/N34/N37/N40 verify persisted read state/owned destination, empty/stale recovery, generated Manila appointment text, offline open remaining unread and successful real-network retry, plus notice receipt with zero reports. Backend audiences/deduplication/private destination guards/rollback are separately verified in the [native ledger](../../../native-verification.md) and traceability.

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.
