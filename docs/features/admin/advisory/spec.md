# Supplier advisories and official guidance

- Status: **unimplemented target**, documented 2026-10-18 from brief v0.4.
- Baseline: no advisory storage, publication UI, targeting, or recommendation reevaluation exists.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S05, REQ-NOTICE-01–04, REQ-INCIDENT-07 and 09, REQ-DECISION-02 and 09, REQ-ACCESS-03–04 and REQ-OPS-04–05.

---

## WHAT

- Maintain scheduled interruptions and approved supplier guidance for explicitly targeted service connections/zones.
- Publish, revise, and explicitly lift official advisories with traceable content, authority/source, and times.
- Keep safety restrictions independent of outage progress and assistance fulfillment.
- Proposed permission default: admins maintain/publish/lift official advisories; staff can read/use approved content and separately publish incident progress.
- Confirm that split before authorization implementation; this supplier directory does not grant staff admin capabilities.
- Generating water-safety diagnoses or new public-health instructions from report photos/text is outside scope.
- No extra public-health account role, external approval application, or mandatory multi-person approval queue is introduced.

---

## MUST

### Content and review

- Distinguish scheduled interruption notices from official water-quality restrictions.
- Keep `boil_water`, `do_not_drink`, and `do_not_use` quality notices separate in data, labels, and presented instructions.
- Use only supplier/public-health-approved guidance with a recorded source/reference and last-updated time.
- Do not infer the applicable restriction from photos, absent reports, service restoration, or an AI-generated explanation.
- Capture title/text, affected zone/area, publication information, effective period where appropriate, source, and demonstration marker.
- Validate targets and preview the intended customer-facing content before an explicit publication action.
- Keep working drafts/internal discussion outside customer DTOs and published timelines.
- Preserve the exact published revision and source used by customer guidance/recommendations.
- Clearly label every synthetic notice, restriction, and restoration statement as demonstration data.

### Authorization, targeting, and publication

- Enforce the confirmed publishing/lifting permission at the API, including direct requests.
- Under the proposed split, reject staff/customer publication and lifting attempts without modifying data or notifying anyone.
- Target notices through explicit reviewed service-zone/connection associations rather than marker clusters or inferred hydraulic boundaries.
- Notify applicable service connections independently of whether their customers filed a report.
- Deduplicate per recipient/source event when customers own multiple matched connections or audience rules overlap.
- Publish customer-safe zone/area summaries and optional validated polygons; do not expose raw household locations/contact details.
- Commit each publication/revision/lifting event and notification rows/durable work atomically or with a reliable outbox.
- Use stable operation/event IDs; retries do not create another notice revision or duplicate notification delivery.
- Record publisher, time, target/revision, and relevant reason in immutable lifecycle/audit history.
- Keep publication time distinct from a scheduled interruption's operating interval.
- Use UTC instants and display `Asia/Manila` initially.

### Lifting, corrections, and guidance refresh

- Keep an applicable quality restriction current until explicitly lifted by an authorized user.
- Incident resolution, assistance completion, and a planned end time must not automatically lift the restriction.
- Lifting records actor, server time, reason, and the exact affected advisory/revision.
- Preserve the lifted notice in history while marking its current applicability accurately.
- Correcting text, targets, type, or dates must retain revision history; a restriction cannot disappear through a silent field edit.
- Any replacement that removes a quality restriction must record the corresponding explicit authorized lifting action.
- Reevaluate/invalidate relevant recommendations when an advisory is published, revised, or lifted.
- Both clients must receive current official guidance before contextual incident guidance; escalation remains visible alongside both.
- Historic evaluations retain the version they used but cannot appear as current after a relevant source change.
- On missing/conflicting approved content, identify uncertainty and offer supplier support rather than fabricating instructions.
- A publication failure must show an error/retry state and must not claim that customers received a notice.

### Acceptance criteria

- [ ] SUP-ADV-01: An authorized admin publishes a notice with explicit targets/source/time; a matched customer with no report receives it.
- [ ] SUP-ADV-02: Direct staff/customer publish or lift requests fail under the proposed permission split with no partial changes.
- [ ] SUP-ADV-03: Boil-water, do-not-drink, and do-not-use fixtures remain distinct in storage and both customer-facing presentations.
- [ ] SUP-ADV-04: Resolving an outage, completing assistance, or passing a planned end time leaves its quality restriction applicable.
- [ ] SUP-ADV-05: Explicit authorized lifting records reason/actor/time, updates current applicability, and preserves the prior published revision.
- [ ] SUP-ADV-06: Overlapping connections/audiences and repeated publication/lifting yield one notification per recipient/source event.
- [ ] SUP-ADV-07: Failed publication commits neither a partial customer-visible notice nor orphaned notification work.
- [ ] SUP-ADV-08: Revised/lifted advice refreshes affected recommendations without deleting their historic input/source references.
- [ ] SUP-ADV-09: Customer DTOs exclude drafts, staff notes, private household coordinates, and contact details.

---

## HOW

### Proposed components and interfaces

- Proposed React responsibilities: notice list/detail, type/target editor, approved-guidance selector, customer preview, publication/lifting controls, and revision history in `aqours-web/`.
- Proposed Express responsibilities: administrative permission checks, notice validation/lifecycle, explicit audience matching, notification transactions, and recommendation invalidation in `aqours-api/`.
- Proposed data: advisories, approved-guidance references, advisory revisions/targets/lifecycle events, service connections/zones, notifications/outbox, recommendation history, and audit events.
- Proposed `GET /api/v1/staff/advisories`: authorized list/detail including operational publication state.
- Proposed advisory create/edit interface: validated draft fields, target IDs, approved source reference, and expected revision.
- Proposed `POST /api/v1/staff/advisories/:id/publish`: explicit authorized publication using an operation key.
- Proposed `POST /api/v1/staff/advisories/:id/lift`: explicit authorized lifting with reason/expected revision/operation key.
- Proposed customer published-advisory interface: current applicable projection plus authorized history links, never a raw staff record.
- Endpoints/module boundaries are proposals; exact contracts and filenames are not implemented.

### Consistency and data flow

- Validate enum values, required source/text, reviewed target existence, sensible interruption intervals, and full GeoJSON before committing.
- Match connection audiences from explicit confirmed associations; retain enough event/audience identity for reliable deduplicated fan-out.
- Detect stale edits/lifts against the expected revision and return a conflict instead of overwriting another authorized action.
- Persist publication/lifting, revision history, audit, and notification work in the same reliable commit boundary.
- Revalidate current applicability/source versions when serving contextual assistance; do not trust a cached historical card.
- Follow [schema](../../../schema.md) for immutable references and [settings](../settings/spec.md) for approved guidance/rule administration.

### Verification and operation

- Test all three restriction types, scheduled notices, explicit targeting, no-report recipients, overlap dedupe, and private-field exclusion.
- Test outage/assistance/end-time independence, revision conflicts, failed transactions, and repeat-safe publication/lifting.
- Exercise current/home/assistance views after publication and lifting on Android and supplier web when implemented.
- Audit publishing/lifting and observe failed fan-out/reevaluation work without logging private customer data or rendering draft content as public.
- Dependencies: [authentication](../auth/spec.md), [settings](../settings/spec.md), [incidents](../incident/spec.md), and customer contextual guidance.
- Open choices: exact authorized publisher policy, locally approved instruction content/sources, revision representation, and targeting-change notification policy.
- External terminology reference: [CDC advisory overview](https://www.cdc.gov/water-emergency/about/drinking-water-advisories-an-overview.html); it does not replace locally approved content.
- No official notice or recommendation is published by creating this specification.
