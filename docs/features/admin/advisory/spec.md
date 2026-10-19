# Supplier advisories and official guidance

- Status: **implemented first-release behavior; acceptance evidence remains qualified**, updated 2026-10-19.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S05, REQ-NOTICE-01–04, REQ-INCIDENT-07 and 09, REQ-DECISION-02 and 09, REQ-ACCESS-03–04 and REQ-OPS-04–05.

---

## WHAT

- Maintain scheduled interruptions and approved supplier guidance for explicitly targeted service connections/zones.
- Publish, revise, and explicitly lift official advisories with traceable content, authority/source, and times.
- Keep safety restrictions independent of outage progress and assistance fulfillment.
- Adopted permission default: admins maintain/publish/lift official advisories; staff can read/use approved content and separately publish incident progress.
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
- Under the adopted split, reject staff/customer publication and lifting attempts without modifying data or notifying anyone.
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

### Implemented behavior and modules

`aqours-web/src/pages/Advisories.tsx` and `components/AdvisoryEditor.tsx` implement draft/target/source editing, explicit publish/lift controls and revision history; administrative controls depend on role.

`aqours-api/src/routes/advisories.ts` and `services/advisories.ts` enforce admin publication/lifting, approved content and explicit zone/connection audiences. Revisions and recipient-deduplicated notifications commit atomically. Quality restrictions stay published until explicit authorized lifting, independently of outage resolution and end times. Guidance freshness uses source signatures; approved-content settings alone do not publish or lift a notice.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

Review advisory/guidance and role-security API tests plus browser advisory rendering. Android current/lifted notice refresh and real approved supplier/public-health content still require independent verification.

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.
