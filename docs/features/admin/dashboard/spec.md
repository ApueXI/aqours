# Supplier overview and metrics

- Status: **unimplemented target**, documented 2026-10-18 from brief v0.4.
- Baseline: the supplier application, domain API, database, and reporting metrics do not exist.
- References: [requirements](../../../requirements.md), [architecture](../../../architecture.md), [schema](../../../schema.md), [workflows/workspace](../../../workspace.md), [supplier domain](../../../domains/admin.md).
- Requirement coverage: REQ-UI-S01, REQ-METRIC-01–04, REQ-INCIDENT-04, REQ-OPS-04 and REQ-ACCESS-03–04.

---

## WHAT

- Give authorized staff/admin a shared overview of active incidents and reports requiring attention.
- Show category counts, first-response times, and resolution times with definitions that a reviewer can reproduce.
- Link summaries to [reports](../report/spec.md), [incidents](../incident/spec.md), and [map](../map/spec.md) using the same relevant filters.
- Exact metric definitions below are proposed defaults from requirements, pending confirmation before implementation.
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

### Proposed implementation and interfaces

- Proposed React responsibilities: summary views, period/status filters, definition text, and drill-down links in `aqours-web/`.
- Proposed Express responsibilities: authorized aggregate reads and duration calculation from immutable event history in `aqours-api/`.
- Proposed data: reports, acknowledgment/messages, report status/closure history, incident status, and explicit service connections from schema.
- Proposed `GET /api/v1/staff/metrics`: validated reporting interval/filters; aggregates, definitions, sample/exclusion counts, and as-of time.
- Proposed metric period default: select the report cohort by submission time; expose the cohort rule explicitly with the result.
- Proposed interval boundary: inclusive UTC start and exclusive UTC end derived from the displayed local period.
- Validate dates, enum filters, and interval bounds server-side; use parameterized aggregate queries.
- Choose and document the summary statistic before implementation; do not label an unspecified aggregate simply “average.”
- Keep business definitions in one API service shared by the dashboard and its drill-down counts.
- Do not infer event times from mutable `updated_at` values or use map viewport/cluster calculations as source data.

### Verification and operation

- Test exact event fixtures spanning midnight in `Asia/Manila`, unanswered reports, duplicate/invalid closures, and follow-up review.
- Compare dashboard aggregates to paginated filtered records under the documented cohort rule.
- Exercise authorized/unauthorized reads and unavailable/empty/stale UI states.
- Observe aggregate-query errors and duration without logging household contacts or private report text.
- Dependencies: [authentication](../auth/spec.md), [report](../report/spec.md) event capture, and [incident](../incident/spec.md) status history.
- Open choices: reporting-period defaults, summary statistic, refresh cadence, and confirmed metric policy.
- No analytics code or tests are implemented by this documentation task.
