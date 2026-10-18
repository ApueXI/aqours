# Supplier report inbox and review

- Status: **unimplemented target**, documented 2026-10-18 from brief v0.4.
- Baseline: no inbox, report endpoints, attachment store, or database records exist.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S02, REQ-REPORT-01 and 04–08, REQ-INCIDENT-01–04 and 08–09, REQ-ACCESS-03–04, REQ-OPS-01 and 05.

---

## WHAT

- Let authorized supplier staff/admin review individual customer reports, clarify the issue, assign responsibility, and record a reasoned outcome.
- Keep one customer's report distinct from a shared [incident](../incident/spec.md) and from [assistance fulfillment](../assistance/spec.md).
- Provide a usable report list when the [map](../map/spec.md), geocoder, or individual report coordinates are unavailable.
- The operational staff/admin permission split is proposed; customer access remains limited to owned records.
- Automatic outage confirmation, automatic report merging, and diagnosis of household faults/water safety are outside scope.

---

## MUST

### Inbox and detail

- Show tracking reference, category, submitted/notice times, workflow status, owner, priority, and location-review state.
- Provide validated category/status/time filters and pagination; zone/owner/priority filters are proposed useful additions.
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
- Proposed default: supplier operational staff/admin can perform these actions; fine-grained permissions need confirmation before implementation.

### States, retries, and recovery

- Use report statuses `received`, `under_review`, `in_progress`, `resolved`.
- Proposed reviewed duplicate/invalid closure stores a separate outcome, reason, actor, and time.
- Do not label duplicate/invalid closure as restoration or count it as a substantive service resolution.
- Record every status transition and expose only the intentional customer-visible timeline projection.
- Apply the transition/authorization matrix to be finalized before implementation and recorded in workspace; reject invalid or stale changes without overwriting newer work.
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

### Proposed implementation and contracts

- Proposed React responsibilities: paginated/filterable inbox, report detail, message composer, internal-note UI, assignment/priority controls, and timeline in `aqours-web/`.
- Proposed API responsibilities: authenticated queries, operational permission checks, report workflow services, and transactional repositories in `aqours-api/`.
- Proposed data: reports, owned service connections, messages, attachment metadata, internal notes, status/assignment/priority audit, and incident-link events.
- Proposed `GET /api/v1/staff/reports` and `GET /api/v1/staff/reports/:id`: paginated summaries and authorized detail.
- Proposed `POST /api/v1/staff/reports/:id/messages`: validated customer-visible acknowledgment/clarification.
- Proposed separate internal-note interface: supplier-only storage and DTO, never a message with a client-supplied visibility flag.
- Proposed assignment/priority/status mutation interfaces: reason, expected version, and operation key with a committed result.
- Proposed incident-link interface delegates the same association/history rules as [incident management](../incident/spec.md).
- Validate IDs, enum values, text length, owner eligibility, reasons, file access, and state transitions server-side.
- Proposed optimistic concurrency uses an expected version or equivalent compare-and-set; the precise contract remains open.
- Return clear validation, forbidden, stale-transition, and unavailable-service errors through the common error contract.
- On an uncertain network result, retry/query the original operation rather than issuing a fresh mutation.

### Verification and operation

- Test authorization at every report/message/file/note boundary and verify response fields, not only HTTP status codes.
- Test isolated severity, missing location/zone, assignment changes, link correction, duplicate/invalid closure, and still-affected review.
- Test retry and concurrent-edit behavior against real database transactions when implementation exists.
- Exercise inbox filtering/pagination, protected attachment failure, map failure, and readable customer-visible/internal history separation.
- Observe operation failures/conflicts and audit actor/time/target/reason; avoid logging customer contact details or private message bodies.
- Dependencies: [authentication](../auth/spec.md), [incidents](../incident/spec.md), [map](../map/spec.md), and [dashboard metrics](../dashboard/spec.md).
- Open choices: priority values, detailed transition matrix, concrete validation/upload limits, and concurrency token design.
- No live inbox, endpoints, or behavioral checks are delivered by documentation alone.
