# Supplier incident management

- Status: **unimplemented target**, documented 2026-10-18 from brief v0.4.
- Baseline: no incident records, linking service, publication, or supplier interface exists.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S04, REQ-INCIDENT-01–09, REQ-NOTICE-04, REQ-ACCESS-03–04 and REQ-OPS-04–05.

---

## WHAT

- Let authorized staff/admin manage a shared supplier event while retaining each customer's separate report and outcome.
- Coordinate report associations, incident ownership/state, internal notes, and deliberately published progress updates.
- Give linked customers consistent published updates and notifications without exposing other households' reports or internal discussion.
- Operational incident management and progress publication are proposed staff/admin permissions; official advisory publication/lifting is separate.
- Map clusters, report-count thresholds, or a recommendation must not automatically confirm an incident or publish guidance.
- Bulk deletion/merging of reports, automatic water-safety diagnosis, and automatic advisory lifting are outside scope.

---

## MUST

### Incident record and state

- Record incident category, summary, explicit affected zones/area, assigned staff owner, status, and relevant times.
- Use `investigating`, `confirmed`, `work_in_progress`, `monitoring`, and `resolved`.
- Record every transition with actor/time and relevant reason; preserve corrections rather than overwriting history.
- Finalize the allowed transition/permission matrix before implementation; reject unsupported and stale transitions.
- Keep a restoration estimate or explicit unknown state; never invent an estimate from elapsed time or similar incidents.
- Show estimated affected customers with the estimate's basis/update time, separately from reports and unique reporting connections.
- Keep internal notes separate from draft/published customer-facing progress.
- Show synthetic incidents and restoration estimates prominently as demonstration data.

### Suggested and confirmed associations

- Suggest related reports using category, time, and explicit service-zone/location context.
- Require staff confirmation before linking; a marker cluster is never a confirmed association or actual boundary.
- Allow severe isolated reports to be reviewed and managed without waiting for nearby reports.
- Allow one current incident per report and many reports per incident.
- Preserve report owner, tracking reference, messages, attachments, and individual status when linking.
- Record link, unlink, and reassignment with old/new association, actor, time, and reason.
- Do not overwrite an existing link silently when a second staff member links the same report concurrently.
- Count unique reporting connections separately from reports and estimated affected customers.
- Support deduplicated customer “mark affected” participation through a personal report; retries must not create another assertion/report.
- Staff correction of an association must remain auditable and must not erase the customer's history.

### Publication and audience

- Preview and explicitly publish customer-safe status, affected area, latest progress, and restoration estimate/unknown.
- Include server publication time, stable event identity, and the demonstration label where applicable.
- Publish affected-zone/area summaries and optional approved polygons, not other households' raw report coordinates.
- Never include internal notes, private contact details, or unpublished edits in customer responses.
- Notify linked reporters about one committed incident publication.
- Deduplicate notifications when a customer has multiple linked reports/connections or retries the same publication.
- Independently target area advisories through service connections in [advisories](../advisory/spec.md); a report is not required for those notices.
- Commit publication and notification records or reliable outbox work together; no successful publication with lost notification work.
- Preserve published revisions/corrections and their source event IDs rather than silently editing prior timeline text.
- Make retried publication return the same committed result; reject reuse of an operation key with incompatible input.
- An uncertain network result must lead to operation lookup/retry, not an assumed failure followed by a fresh publication.
- A failed transaction exposes neither a partial publication nor notifications for an unpublished event.

### Independent recovery

- Resolving an incident must not automatically lift a water-quality advisory.
- Completing assistance must not automatically resolve the incident or linked reports.
- Customer “still affected” feedback returns only that individual's report for review.
- Preserve other customers' outcomes and incident state when one customer reports continued impact.
- Retain historic incident resolutions and follow-up evidence; staff may perform a separately authorized corrective transition when justified.
- Trigger invalidation/reevaluation of affected assistance recommendations after relevant incident/publication changes.
- Customers must see current published guidance while historic recommendations remain reviewable as history.

### Acceptance criteria

- [ ] SUP-INC-01: Staff links two customers' reports to one incident; both reports retain owner/reference/history and one current link each.
- [ ] SUP-INC-02: A suggested association is not applied until staff confirms it; correcting the link retains old/new association history.
- [ ] SUP-INC-03: Two concurrent link changes cannot silently replace each other or leave a report with two current incidents.
- [ ] SUP-INC-04: A published update appears in both owners' timelines with required fields and only one notification per recipient/event.
- [ ] SUP-INC-05: Retrying publication and recovering from a failed transaction create no duplicate publication or lost/duplicate notification work.
- [ ] SUP-INC-06: Customer APIs contain only authorized published content and exclude staff notes, contact details, and other households' coordinates.
- [ ] SUP-INC-07: Incident resolution leaves a quality advisory current until explicit authorized lifting.
- [ ] SUP-INC-08: One “still affected” response changes only that report's review state; incident and other reports retain their existing outcomes.
- [ ] SUP-INC-09: Report count, unique reporting connections, and estimated affected customers remain distinguishable with unknown estimates explicit.
- [ ] SUP-INC-10: Incident changes cause refreshed contextual assistance without presenting superseded output as current.

---

## HOW

### Proposed components and interfaces

- Proposed React responsibilities: incident list/detail, workflow controls, report-link review, internal notes, publication preview, and published history in `aqours-web/`.
- Proposed Express responsibilities: authorized incident/link services, publication/audience service, history repositories, and customer-safe response mapping in `aqours-api/`.
- Proposed data: incidents, reports/current incident FK, immutable link/status events, internal notes, incident updates, notifications/outbox, recommendation input references, and audit events.
- Proposed `GET /api/v1/staff/incidents` and `GET /api/v1/staff/incidents/:id`: paginated authorized list/detail.
- Proposed incident create/assign/transition interfaces: validated fields, expected version, actor-derived identity, and operation key.
- Proposed `POST /api/v1/staff/incidents/:id/report-links`: staff-confirmed link/reassignment command with reason and conflict detection.
- Proposed `POST /api/v1/staff/incidents/:id/updates`: validated publication command producing one canonical publication event.
- Proposed published-incident read interface: intentional customer-safe DTO without linked customers' private records.
- The exact routes/DTOs and module filenames remain proposals, not existing code or contracts.

### Transaction and validation approach

- Authorize before loading/mutating restricted records and recheck transition/link invariants within the write transaction.
- Validate IDs, allowed enum values, staff assignment, text lengths, coordinate/GeoJSON format, explicit zone targets, and estimate/unknown fields.
- Use a version/compare-and-set or equivalent locking strategy for conflicting edits; select and document the mechanism before implementation.
- Persist link/status changes and their history atomically; do not derive history from mutable current state later.
- Resolve one deterministic publication audience or persist the audience inputs/version for reliable asynchronous fan-out.
- Use a unique recipient/source-event key so overlapping reporter memberships do not duplicate notifications.
- Keep current published projection and historic revisions separate; notification links must recheck recipient/record access.
- Store times as UTC instants and display `Asia/Manila`; keep publication time distinct from the event's reported/estimated times.
- Reevaluate relevant recommendation inputs after the committed event, with reliable work/state so stale guidance cannot be treated as current.

### Verification and operation

- Integration-test link correction/concurrency, every allowed transition, publication rollback/retry, recipient dedupe, and published DTO privacy.
- Exercise two customers, one shared incident, an isolated severe report, unknown restoration, and an unmatched report.
- Verify advisory independence and one-customer follow-up across web, API, database, and Android customer views when implemented.
- Observe publication/link conflicts, failed fan-out work, and stale recommendation invalidation; audit actor/time/target without logging private notes.
- Dependencies: [authentication](../auth/spec.md), [reports](../report/spec.md), [map](../map/spec.md), [advisories](../advisory/spec.md), and [assistance](../assistance/spec.md).
- Open choices: detailed transition permissions, publication revision representation, notification transaction/outbox choice, and incident-estimate input policy.
- All acceptance checks are future implementation checks; this document creates no running incident workflow.
