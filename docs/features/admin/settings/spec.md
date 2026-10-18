# Supplier accounts, zones, guidance, and rules

- Status: **unimplemented target**, documented 2026-10-18 from brief v0.4.
- Baseline: no account administration, zones, approved guidance, rule storage, seeds, or settings UI exists.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S05, REQ-ACCESS-01–05, REQ-REPORT-04, REQ-NOTICE-01–03, REQ-DECISION-01–02 and 09–10, REQ-OPS-01, 03–05 and REQ-DEMO-01–03.

---

## WHAT

- Maintain demo accounts/service connections, explicit service zones, approved guidance, and versioned contextual-assistance rules.
- Proposed split: admin performs these administrative writes; staff reads operational information and uses approved content without receiving admin privileges.
- Confirm fine-grained permissions before implementation; no role beyond customer/staff/admin is introduced.
- Authentication belongs to [auth](../auth/spec.md), notice publication/lifting to [advisory](../advisory/spec.md), and sites/stock to [distribution](../distribution/spec.md).
- Rules-based decision support is a proposed academic approach; the professor's rubric remains unresolved and AI is not confirmed.
- Public registration approvals, live customer-data imports, billing settings, multi-supplier tenancy, and autonomous AI actions are outside scope.

---

## MUST

### Demo accounts and connections

- Seed individual fictional customer accounts linked to sample connections/saved addresses and provide a documented demo login list when implemented.
- Support supplier-managed demo-account maintenance as the proposed default; do not presume a public-registration approval queue.
- Validate known role values, normalized login uniqueness, account state, and customer/connection ownership server-side.
- Hash passwords on the server and never return stored hashes or expose real credentials through settings/logs/source control.
- Show only safe account information; credential provisioning must use the authentication design chosen before implementation.
- Keep account/role changes behind confirmed admin permission checks; navigation visibility alone is insufficient.
- Revoke relevant sessions after deactivation or security-relevant permission changes according to the confirmed session policy.
- Preserve referential history instead of deleting accounts/connections that own reports/requests.
- Use twelve fictional customer connections and clearly separate demo data from any future real deployment.
- A demo reset requires deliberate local operational action; no unprotected or implicit destructive settings action is required.

### Service zones and saved-location relationships

- Maintain explicit zone identifiers/names and optional validated display boundaries for three fictional demo zones.
- Review connection/report zone associations; geometry or a geocoder confidence score does not establish supply connectivity.
- Keep unknown zones flagged for review instead of assigning a fabricated match.
- Require review of alternate issue-location zones rather than silently inheriting the saved connection's zone.
- Validate optional coordinate pairs/ranges and full GeoJSON before storage; use ordinary PostgreSQL columns/JSONB.
- Do not silently rewrite old report/inspection location snapshots when a saved address or connection zone changes.
- Record administrative association/boundary changes with actor/time and relevant reason.
- Preserve linked notice/incident/session integrity when deactivating or changing a zone; do not orphan targets.
- Reevaluate applicable contextual guidance after relevant connection/zone changes; define any new-area notification policy before implementation.

### Approved guidance and rule versions

- Store approved source/reference, text, last-updated time, and version for supplier guidance.
- Keep boil-water, do-not-drink, and do-not-use content distinct; settings edits must not silently publish/lift a notice.
- Preserve earlier guidance/rule versions referenced by published advisories or recommendation history.
- Proposed rules use issue category, reviewed location/zone, report time, stated needs/answers, active advisories, incident status, and current pickup availability.
- Apply applicable official safety guidance before contextual incident guidance; escalation remains visible alongside both.
- Require explanation/source/update time and a usable next action, with explicit uncertainty/support fallback.
- Recommendations never submit, accept, schedule, reserve water, invent restoration times, or diagnose drinkability.
- Evaluate rules on the API for consistent clients and retain rule version plus relevant input/source references.
- Audit rule edits/activation with actor/time; invalidate/reevaluate affected current recommendations after a relevant change.
- Keep superseded guidance reviewable as history but prevent it from appearing current.
- Validate rules against supported inputs/actions; do not accept arbitrary executable code from a settings form.
- Adding an AI layer or new dependency requires separate scope/approval; this documentation installs neither.

### Failure, access, and acceptance

- Reject unauthorized direct account/zone/guidance/rule writes under the proposed admin-only split.
- Use input validation, expected-version conflict detection, and idempotent mutation identities for administrative changes.
- Show explicit invalid input, stale edit, unavailable service, and uncertain-result states without claiming a failed save succeeded.
- Do not log passwords, session material, or full private account/contact data.
- [ ] SUP-SET-01: Admin provisions/maintains fictional demo accounts/connections; staff/customer direct administrative writes are denied.
- [ ] SUP-SET-02: Duplicate login identifiers and invalid role/ownership assignments are rejected without exposing credential material.
- [ ] SUP-SET-03: Deactivation prevents subsequent authorized session use according to policy while retaining report/request ownership history.
- [ ] SUP-SET-04: A zone/boundary change is audited and does not move historical report locations or infer supply connectivity.
- [ ] SUP-SET-05: Unknown/alternate issue zones remain reviewable and never receive an invented association from coordinates alone.
- [ ] SUP-SET-06: Guidance/rule edits preserve exact historical versions and refresh current recommendations consistently across clients.
- [ ] SUP-SET-07: Official-guidance precedence and uncertainty fallback survive rule edits; settings edits cannot publish/lift an advisory implicitly.
- [ ] SUP-SET-08: Retried/stale administrative writes do not duplicate records, erase history, or overwrite a newer authorized change.

---

## HOW

### Proposed components and interfaces

- Proposed React responsibilities: focused account/connection, zone, approved-guidance, and rule-version forms/history in `aqours-web/`.
- Proposed Express responsibilities: administrative permission guard, validated maintenance services, session revocation integration, and transactional repositories in `aqours-api/`.
- Proposed data: users, service connections/zones, reviewed target associations, approved guidance/rule versions, recommendation input history, and audit events.
- Proposed administrative account/connection read/write interfaces expose safe profile/link fields, not password hashes.
- Proposed zone read/write interfaces validate identifiers, reviewed associations, and optional display geometry.
- Proposed approved-guidance/rule version interfaces create immutable versions and explicit activation/history events.
- Proposed route group: `/api/v1/staff/settings/*`, protected by the confirmed administrative permissions despite the shared supplier namespace.
- All route/module boundaries are proposals; no maintenance endpoints, rule editor, or physical tables exist.
- Keep administrative guidance editing separate from the explicit publication/lifting commands in [advisories](../advisory/spec.md).

### Verification and operation

- Test permission/field boundaries, login uniqueness, ownership links, deactivation/revocation, and restricted deletion with real API/database state.
- Test unknown-zone review, geometry validation, changed saved-address snapshots, and immutable old guidance/rule references.
- Test representative rule precedence/fallback scenarios and verify no rule automatically submits/approves assistance.
- Test concurrent/stale edits, idempotent retry, administrative audit evidence, and failed recommendation invalidation/recovery.
- Seed/reset tooling and demo login documentation are later implementation deliverables, not new commands promised here.
- Observe failed administrative writes, conflicts, and reevaluation failures with actor/time/target; keep logs free of secrets and personal payload dumps.
- Dependencies: [authentication](../auth/spec.md), [advisories](../advisory/spec.md), [incidents](../incident/spec.md), and contextual assistance.
- Open choices: exact admin permissions, credential-provisioning mechanism, approved local content, rule representation/activation policy, and academic acceptance.
- No account, zone, rule, dependency, or environment setting is changed by creating this specification.
