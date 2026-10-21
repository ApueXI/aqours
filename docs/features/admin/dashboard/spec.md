# Supplier overview and metrics

- Status: **implemented first-release behavior; acceptance evidence remains qualified**, updated 2026-10-19.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S01, REQ-METRIC-01–04, REQ-INCIDENT-04, REQ-OPS-04 and REQ-ACCESS-03–04.

---

## WHAT

- Give authorized staff/admin a shared overview of active incidents and reports requiring attention.
- Show category counts, first-response times, and resolution times with definitions that a reviewer can reproduce.
- Link summaries to [reports](../report/spec.md), [incidents](../incident/spec.md), and [map](../map/spec.md) using the same relevant filters.
- Exact metric definitions below are adopted from requirements and implemented for this release.
- Predictive outage detection, supplier rankings, billing metrics, and inferred safety assessments are outside scope.

---

## MUST

### Counts and time measurements

- Count active incidents as incidents whose status is not `resolved`.
- Count unresolved reports in `received`, `under_review`, or `in_progress`, including reports returned for individual follow-up review.
- Show reviewed duplicate/invalid closures separately from substantive service resolutions.
- Count category totals from report records under the selected period/status filters; explain exclusions.
- Display unique reporting connections separately from report totals and estimated affected customers.
- Do not substitute marker/cluster counts or reporting connections for an affected-customer estimate.
- First response starts at successful server report creation and ends at the first staff-authored, customer-visible acknowledgment or clarification.
- Automatic receipts, internal notes, and internal-only status changes do not count as the first response.
- A pending first response has no completed duration; do not assign zero.
- Resolution starts at successful report creation and ends at staff-recorded substantive resolution.
- Exclude duplicate/invalid closure from service-resolution durations.
- Retain first-resolution duration after follow-up while showing the individual report as currently unresolved.
- Display first-resolution measurement separately from current status; do not hide a still-affected report behind a historic resolution.

### Read behavior and access

- Show reporting period, service timezone, sample size, excluded outcomes, and data/as-of time beside metrics.
- Use UTC event instants and display the period in `Asia/Manila` initially.
- Make empty data, zero counts, unavailable data, and loading states visibly different.
- Preserve the last successful as-of time when showing stale data after a failed refresh.
- Limit responses to authorized supplier data; never expose supplier summaries through customer APIs.
- Drill-down links must retain applicable category/status/period filters and enforce permissions again.
- Mark all synthetic incidents and demonstration counts/estimates clearly.
- Reading the dashboard must not change report/incident status, assignment, publication, or assistance state.

### Acceptance criteria

- [ ] SUP-DASH-01: Known fixture reports produce the expected unresolved/category counts and separate duplicate/invalid outcomes.
- [ ] SUP-DASH-02: A staff clarification after an automatic receipt defines the first-response end; an internal note does not.
- [ ] SUP-DASH-03: Unanswered reports contribute no completed response duration and are never shown as zero-minute responses.
- [ ] SUP-DASH-04: Duplicate/invalid closures are excluded from service-resolution durations.
- [ ] SUP-DASH-05: A resolved report returned as still affected appears unresolved while its first-resolution event remains auditable.
- [ ] SUP-DASH-06: Two reports from one connection remain two reports and one unique reporting connection; estimated affected customers stay separate.
- [ ] SUP-DASH-07: Unauthorized API access fails; refresh failure shows unavailable/stale data rather than fabricated counts.

---

## HOW

### Weather addition — 21 October 2026

Overview includes an independent weather section for both staff and admins. Users explicitly search/select a Philippine city to see current model conditions and seven daily forecasts, Manila times, retrieval time, provider attribution and manual refresh. Failed weather requests retain labeled stale data and retry without blocking metrics. Location changes clear old forecasts; sign-out/dashboard unmount clears selection. See [weather contract and checks](../../../weather.md).

### Implemented behavior and modules

`aqours-web/src/features/overview/screens/Overview.tsx` implements period/status filtering, counts, definitions and drill-down navigation.

`aqours-api/src/routes/analytics.ts` and `services/analytics/metrics.service.ts` calculate report cohorts with inclusive UTC from/exclusive to boundaries and arithmetic mean elapsed seconds. First response is the first staff-authored public message; first substantive resolution excludes duplicate/invalid closures. Follow-up retains first-resolution history while unresolved counts use current status. Responses include timezone/as-of, sample/pending/excluded context; missing durations are null. Active incidents are a current total, not a count of the selected report cohort.

Exact endpoint methods, payloads, errors, pagination and operation-key exceptions are defined in the [API contract](../../../api.md). Logical entities map to the physical JSONB/relational design in [schema](../../../schema.md); shared public DTOs live in `aqours-contracts/src/`.

### Verification and limits

Review metrics unit/API tests and browser overview rendering. Broader production-load behavior is unmeasured; first-resolution history remains distinct from current reopened state.

The original acceptance checkboxes are intentionally preserved as an acceptance inventory. They are not all certified by source presence or focused tests; use [traceability](../../../traceability.md) and [verification](../../../verification.md) for evidence and gaps. Android CNG prebuild/Hermes export do not prove an installed APK or real-device workflows. See [setup](../../../setup.md) and [demo](../../../demo.md) for execution.
