# Supplier staff domain

Staff also have [current weather, seven-day forecasts and Philippine city search](../weather.md) on the dedicated Weather page (`/#/weather`), using the same authenticated weather access as admins.

Status: **implemented first-release capabilities**, updated 19 October 2026; acceptance evidence and remaining gaps are in [verification](../verification.md) and [traceability](../traceability.md). Product source: brief v0.4 and [requirements](../requirements.md).

Staff handles supplier operations for reports, incidents and assistance. Distribution also provides [pickup-site weather and early warnings](../distribution-monitoring.md), with explicit per-site threshold setup and current reservable-stock context. The project owner adopted the detailed staff/admin split below and the API enforces it. Feature specs live under `features/admin/` because that directory represents the supplier workspace, not universal administrative access.

| Feature | What staff can do under the adopted policy | Detailed specification |
| --- | --- | --- |
| Authentication | Sign in/out and use a revocable supplier session | [Authentication](../features/admin/auth/spec.md) |
| Overview | Review active incidents, unresolved reports, category counts and explicitly defined response/resolution metrics | [Dashboard](../features/admin/dashboard/spec.md) |
| Reports | Filter the inbox, inspect operational customer/connection details, acknowledge, clarify, assign and prioritize with a reason; perform reviewed duplicate/invalid closure | [Report inbox](../features/admin/report/spec.md) |
| Map | Review authorized markers/clusters, service zones and published areas; filter and find reports without coordinates | [Operational map](../features/admin/map/spec.md) |
| Incidents | Confirm/correct report links, maintain owner/status/internal notes and publish customer-facing progress updates | [Incidents](../features/admin/incident/spec.md) |
| Advisories | Read and apply approved current notices; publication/lifting of official advisories is admin-only | [Advisories](../features/admin/advisory/spec.md) |
| Assistance | Review all three service types; accept with owner, schedule/reschedule, update progress and record findings/contact outcome/completion | [Assistance queue](../features/admin/assistance/spec.md) |
| Distribution | Maintain pickup sites/sessions, record stock, accept reservations, collect once and handle cancellation/follow-up | [Pickup/distribution](../features/admin/distribution/spec.md) |
| Settings context | Use operational zone/connection and approved guidance information; account, zone and rule administration remains admin-only | [Settings](../features/admin/settings/spec.md) |

## Operational workflow summary

1. Sign in and review unresolved reports and active incidents on the overview, inbox and map/list.
2. Acknowledge a report, ask for clarification, assign an owner and record a priority reason. Do not require nearby reports before reviewing an isolated severe concern.
3. Confirm related reports using category/time and explicit zone/location context. Preserve each customer's record and link-change history.
4. Progress the incident and publish updates separately from internal notes, with affected area, publication time and restoration estimate or explicit unknown.
5. Process assistance independently: accept and assign, agree a schedule, record progress and complete with outcome/next steps. Record reasons and notify on unavailability, cancellation or rescheduling.
6. For water support, reserve liters transactionally at acceptance, issue the pickup reference, and record collection once. Release uncollected reservations on cancellation and follow up after session cancellation.
7. Review an individual customer's still-affected feedback without automatically reopening the entire incident or changing other reports.

## Access and business boundaries

- The API restricts operational access and every state change. No customer may call staff endpoints or retrieve staff notes by changing an ID.
- Keep internal notes, contact information and raw household coordinates out of customer-facing updates/notifications.
- Under the adopted split, staff does not administer accounts/zones/rules or publish/lift official advisories. Any later grant requires an explicit requirements change.
- Clusters are visual aids; explicit reviewed associations establish incident/notice matching. Staff cannot infer an outage boundary or water safety from cluster size or photos.
- Request acceptance/scheduling, report resolution, incident resolution and advisory lifting are separate authorized actions. Assistance completion does not resolve the underlying water problem automatically.
- No separate inspector app, delivery fleet or commerce order workflow is required.

See [admin responsibilities](admin.md), [customer capabilities](customers.md), [workspace workflows](../workspace.md) and the [documentation index](../README.md). Primary requirement groups: `REQ-UI-S*`, `REQ-REPORT-*`, `REQ-INCIDENT-*`, `REQ-ASSIST-*`, `REQ-CALLBACK-*`, `REQ-INSPECTION-*`, `REQ-WATER-*` and `REQ-METRIC-*`.
