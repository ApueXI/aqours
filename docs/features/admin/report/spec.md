# Supplier report inbox and review

- Status: **implemented first-release behavior; acceptance evidence remains qualified**, updated 2026-10-19.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S02, REQ-REPORT-01 and 04–08, REQ-INCIDENT-01–04 and 08–09, REQ-ACCESS-03–04, REQ-OPS-01 and 05.

---

## WHAT

- Let authorized supplier staff/admin review individual customer reports, clarify the issue, assign responsibility, and record a reasoned outcome.
- Keep one customer's report distinct from a shared [incident](../incident/spec.md) and from [assistance fulfillment](../assistance/spec.md).
- Provide a usable report list when the [map](../map/spec.md), geocoder, or individual report coordinates are unavailable.
- The operational staff/admin permission split is adopted; customer access remains limited to owned records.
- Automatic outage confirmation, automatic report merging, and diagnosis of household faults/water safety are outside scope.

---

## MUST

### Inbox and detail

- Show tracking reference, category, submitted/notice times, workflow status, owner, priority, and location-review state.
- Provide validated category/status/time filters and pagination; zone/owner/priority filters are implemented.
- Show customer and service-connection details only to authorized operational users.
- Distinguish the saved service address from the report's issue-address/location snapshot.
- Display coordinate source, confirmation state, and missing/ambiguous coordinate or unconfirmed-zone flags.
- Do not silently assign an alternate issue location to the saved connection's zone.
- Keep an unlocated report in the inbox; missing coordinates never imply a fabricated marker or `(0, 0)` location.
- Open protected attachments through report-authorized retrieval rather than public storage links.
- Display customer-visible messages/timeline separately from internal notes and unpublished operational content.
- Escape rendered text and show upload/retrieval failures explicitly without marking failed photos as available.

### Review and communication

- Acknowledge a report using a staff-authored, customer-visible message/event that supports the first-response definition.
- Ask clarification questions and retain the customer's responses in the report timeline.
- Assign an authorized staff owner and record assignment changes.
- Set or change priority only with a recorded reason, actor, and time.
- Allow severe isolated reports to receive priority review without requiring nearby reports or an existing incident.
- Suggest related reports by category, time, and explicit service-zone/location context.
- Require staff confirmation before linking, unlinking, or reassigning a report to an incident.
- Keep at most one current incident association and retain prior link history; never delete/merge the customer's report.
- Show report totals and unique reporting connections separately from any independently sourced affected-customer estimate.
- Adopted default: supplier operational staff/admin can perform these actions; the adopted permission matrix is enforced by the API.

### States, retries, and recovery

- Use report statuses `received`, `under_review`, `in_progress`, `resolved`.
- Reviewed duplicate/invalid closure stores a separate outcome, reason, actor, and time.
- Do not label duplicate/invalid closure as restoration or count it as a substantive service resolution.
- Record every status transition and expose only the intentional customer-visible timeline projection.
- Apply the implemented transition/authorization matrix recorded in workspace; reject invalid or stale changes without overwriting newer work.
- Treat customer “still affected” as review of that report; do not automatically reopen the incident or other reports.
- Assistance completion and incident resolution must not silently resolve this individual report or lift a quality advisory.
- Make messages, priority/status changes, and link actions safe to retry using stable operation/event identities.
- Commit a mutation, required history, and customer notification records/durable work atomically where applicable.
- Never notify the customer about an internal note or expose it through related attachments/timeline payloads.

### Acceptance criteria

- [ ] SUP-REPORT-01: Two customers' reports appear in the authorized inbox; each customer API still returns only its owner's report.
- [ ] SUP-REPORT-02: An ambiguous/unlocated report can be acknowledged and assigned without an invented coordinate or zone.
- [ ] SUP-REPORT-03: An isolated severe report receives a reasoned priority change with actor/time history.
- [ ] SUP-REPORT-04: A clarification appears in the owner's timeline and defines the first response; an internal note remains staff-only.
- [ ] SUP-REPORT-05: Staff confirms and corrects a suggested incident link without deleting the report or losing prior associations.
- [ ] SUP-REPORT-06: Duplicate/invalid closure retains a reason and is excluded from substantive-resolution metrics.
- [ ] SUP-REPORT-07: Repeated operations and stale concurrent edits do not create duplicate messages/events or overwrite a newer review.
- [ ] SUP-REPORT-08: Customer follow-up reopens review of one report while the incident, advisory, and other reports retain independent states.
- [ ] SUP-REPORT-09: Customer ID tampering cannot retrieve another report, attachment, message, or internal note.

---

## HOW

### Implemented behavior and modules

`aqours-web/src/features/reports/screens/Reports.tsx`, `ReportDetail.tsx` and reusable action/history/attachment components implement inbox filters, protected detail, messages, notes, reasoned review and candidate incident linking.

`aqours-api/src/routes/reports.ts`, `report-review.ts`, `incidents.ts` and `services/reports/report-context.service.ts` enforce operational access, expectedVersion conflicts, ownership-safe customer projections and audited transitions. Normal report progression is received to under_review to in_progress to resolved; duplicate/invalid reviewed closure may occur earlier with a reason. Prior first-resolution history survives still-affected review. Messages and internal notes have separate public/private representations.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

Review reports/incidents and security API tests plus browser message/review writes. Exhaustive UI failure/concurrency permutations require additional execution; unchecked criteria below retain their full original scope.

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.
