# Supplier admin domain

Admins also have [current weather, seven-day forecasts and Philippine city search](../weather.md) on the dedicated Weather page (`/#/weather`). Weather is informational and does not publish an advisory or change incident state.

Status: **implemented first-release capabilities**, updated 19 October 2026; acceptance evidence and remaining gaps are in [verification](../verification.md) and [traceability](../traceability.md). Product source: brief v0.4 and [requirements](../requirements.md).

Admin represents supplier administration in the adopted three-role model: `customer`, `staff`, `admin`. The project owner adopted the administrative grants below; Express enforces role and record access. A feature directory named `admin` also contains shared supplier workflows; it does not make staff an admin.

| Feature | Admin capability under the adopted permission split | Detailed specification |
| --- | --- | --- |
| Authentication | Sign in/out with a revocable supplier session and enforce current administrative permissions on the API | [Authentication](../features/admin/auth/spec.md) |
| Overview | View active incidents, unresolved reports, category counts and defined response/resolution metrics | [Dashboard](../features/admin/dashboard/spec.md) |
| Reports | Perform authorized staff review, clarification, assignment, reasoned priority and reviewed closure | [Report inbox](../features/admin/report/spec.md) |
| Map | View authorized report markers/clusters, zones and published areas; use filters and unlocated-report lists | [Operational map](../features/admin/map/spec.md) |
| Incidents | Manage operational incident workflows/links/history and publish customer-facing incident progress | [Incidents](../features/admin/incident/spec.md) |
| Official advisories | Maintain scheduled interruptions and explicitly publish, revise or lift approved guidance/quality notices with history | [Advisories](../features/admin/advisory/spec.md) |
| Assistance | Review all three request types, assign an owner, accept/schedule/progress and record outcomes or reasoned alternatives | [Assistance queue](../features/admin/assistance/spec.md) |
| Distribution | Manage pickup sites/sessions, stock, reservations and one-time collection with transactional safeguards | [Pickup/distribution](../features/admin/distribution/spec.md) |
| Settings | Maintain fictional accounts, service-zone associations, approved guidance and versioned recommendation rules | [Settings](../features/admin/settings/spec.md) |

Admin also has the operational capabilities summarized for [supplier staff](staff.md), subject to backend checks and audit. The same privacy and safety rules apply; administrative access does not justify exposing internal data through customer APIs.

## Administrative workflow summary

1. Prepare or maintain fictional demo accounts, connections and reviewed service zones; the explicit development seed and [demo instructions](../demo.md) supply the fictional dataset.
2. Maintain approved guidance sources and rule versions. Log edits with actor/time and preserve the versions referenced by recommendations.
3. Authorize and publish official notices to explicit zones/connections. Keep boil-water, do-not-drink and do-not-use content distinct and clearly label demo notices.
4. Publish a revision or lift a quality advisory only through an explicit authorized action. Incident resolution and scheduled end times cannot lift a quality restriction.
5. Ensure publication and notifications are reliable and deduplicated; refresh affected recommendations instead of showing superseded guidance as current.
6. Monitor operational workflows, metrics and audit evidence; retain reviewed outcomes, linking corrections, appointment history and stock actions.

## Boundaries

- Enforce role and record access in Express. Do not trust a browser role flag, hidden button, account ID or directory name as authorization.
- Do not create additional inspector, dispatcher, public-health or superadmin roles from this document. Approved public-health guidance may be recorded as a source without a new application role.
- Staff may publish operational incident updates under the adopted policy; official advisory publication/lifting and administrative settings are enforced admin capabilities.
- Maintain independent report, incident, assistance and advisory lifecycles; never infer drinkability from photos, map clustering or outage recovery.
- No commerce order/payment administration, home delivery, multiple suppliers or fleet management is included. Public registration and its approval process are not specified.

See [workspace workflows](../workspace.md), [architecture](../architecture.md), [schema](../schema.md) and the [documentation index](../README.md). Primary requirement groups: `REQ-ACCESS-*`, `REQ-UI-S*`, `REQ-NOTICE-*`, `REQ-METRIC-*`, `REQ-OPS-*`, `REQ-DEMO-*` and rule maintenance in adopted `REQ-DECISION-*`.

Distribution includes [pickup-site forecasts and early warnings](../distribution-monitoring.md). Staff/admin can configure site thresholds; admins additionally maintain temperature-display bands. Warning history and owned supplier notifications remain separate from customer notices and official advisories.
