# Supplier accounts, zones, guidance, and rules

- Status: **implemented first-release behavior; acceptance evidence remains qualified**, updated 2026-10-19.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S05, REQ-ACCESS-01–05, REQ-REPORT-04, REQ-NOTICE-01–03, REQ-DECISION-01–02 and 09–10, REQ-OPS-01, 03–05 and REQ-DEMO-01–03.

---

## WHAT

- Maintain demo accounts/service connections, explicit service zones, approved guidance, and versioned contextual-assistance rules.
- Adopted split: admin performs these administrative writes; staff reads operational information and uses approved content without receiving admin privileges.
- Enforce the adopted fine-grained permissions; no role beyond customer/staff/admin is introduced.
- Authentication belongs to [auth](../auth/spec.md), notice publication/lifting to [advisory](../advisory/spec.md), and sites/stock to [distribution](../distribution/spec.md).
- Rules-based decision support is implemented; the professor's academic acceptance remains externally unverified and AI is outside this release.
- Public registration approvals, live customer-data imports, billing settings, multi-supplier tenancy, and autonomous AI actions are outside scope.

---

## MUST

### Demo accounts and connections

- Seed individual fictional customer accounts linked to sample connections/saved addresses and provide a documented demo login list when implemented.
- Support supplier-managed demo-account maintenance as the adopted default; do not presume a public-registration approval queue.
- Validate known role values, normalized login uniqueness, account state, and customer/connection ownership server-side.
- Hash passwords on the server and never return stored hashes or expose real credentials through settings/logs/source control.
- Show only safe account information; credential provisioning must use the implemented authenticated administrative design.
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
- Reevaluate applicable contextual guidance after relevant connection/zone changes; do not imply that editing a connection republishes existing advisories or sends retrospective notifications.

### Approved guidance and rule versions

- Store approved source/reference, text, last-updated time, and version for supplier guidance.
- Keep boil-water, do-not-drink, and do-not-use content distinct; settings edits must not silently publish/lift a notice.
- Preserve earlier guidance/rule versions referenced by published advisories or recommendation history.
- Implemented rules use issue category, reviewed location/zone, report time, stated needs/answers, active advisories, incident status, and current pickup availability.
- Apply applicable official safety guidance before contextual incident guidance; escalation remains visible alongside both.
- Require explanation/source/update time and a usable next action, with explicit uncertainty/support fallback.
- Recommendations never submit, accept, schedule, reserve water, invent restoration times, or diagnose drinkability.
- Evaluate rules on the API for consistent clients and retain rule version plus relevant input/source references.
- Audit rule edits/activation with actor/time; invalidate/reevaluate affected current recommendations after a relevant change.
- Keep superseded guidance reviewable as history but prevent it from appearing current.
- Validate rules against supported inputs/actions; do not accept arbitrary executable code from a settings form.
- Adding an AI layer or new dependency requires separate scope/approval; this documentation installs neither.

### Failure, access, and acceptance

- Reject unauthorized direct account/zone/guidance/rule writes under the adopted admin-only split.
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

### Implemented behavior and modules

`aqours-web/src/features/settings/screens/Settings.tsx` and `SettingsAccounts.tsx`, `SettingsConnections.tsx`, `SettingsZones.tsx`, `SettingsGuidance.tsx`, `SettingsAudit.tsx` implement focused account/connection/zone/version/audit workflows.

`aqours-api/src/routes/settings.ts`, `settings-accounts.ts` and `settings-connections.ts` enforce admin-only maintenance, safe account DTOs, session revocation, last-active-admin protection and expected-version conflicts. Approved guidance/rules are immutable records; a new rule version becomes current without executing arbitrary user code. Staff can read operational guidance/rules and audit context. Reviewed connection changes preserve old report locations and change subsequent applicability/freshness checks; settings cannot lift/publish advisories implicitly.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

Review assistance/admin, advisory/guidance and security API tests plus browser settings rendering. Connection edits update matching on subsequent reads and invalidate guidance signatures; they do not fan out retrospective notice notifications. Academic approval and approval of any real supplier safety wording remain external; this release uses fictional demonstration content.

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.

Implementation update: [PSGC addresses and detailed maps](../../../location-and-maps.md) documents guided supplier-managed addresses, free-text fallback, snapshots, and deployment settings.
