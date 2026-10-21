# Aqours documentation

Updated **19 October 2026** against the first-release implementation of Water Supply Reporting and Customer Assistance brief **v0.4**. Express/PostgreSQL, the React supplier workspace and connected Expo customer workflows now exist. The earlier Expo-starter baseline is historical. Source implementation and full acceptance are distinct: [verification](verification.md) records executed evidence and gaps, and [traceability](traceability.md) maps the original requirements and criteria.

[UI/UX design and navigation](ui-ux.md) describes the shared teal components, customer navigation/reporting and supplier map workspace.

## Reference documents

| Document | Purpose |
| --- | --- |
| [Architecture](architecture.md) | Implemented components, trust boundaries, data flows and limitations |
| [Requirements](requirements.md) | Role capabilities, shared rules, stable `REQ-*` identifiers, ten demo scenarios, adopted defaults, deferred scope and open decisions |
| [Schema](schema.md) | Prisma domain models, relational ownership/history/stock constraints, migration adoption and frozen legacy archive |
| [Workflows and workspace](workspace.md) | Step-by-step provisioning, authentication, review, publication, assistance/pickup lifecycles, actual workspace tooling and operational setup references |

Additional execution references: [API contract](api.md), [setup and backup/restore](setup.md), [demo](demo.md), [verification](verification.md), and [traceability](traceability.md).

[Weather](weather.md) documents the 21 October addition: Open-Meteo current conditions, seven-day forecasts, saved customer locations and Philippine city search for all three roles.

Use these together: requirements define the behavior, architecture defines boundaries, schema describes persistence status/design, and workspace traces the target workflows. [PROGRESS.md](../PROGRESS.md) records completed repository work and verification.

## Role summaries

| Role | Summary |
| --- | --- |
| [Customer](domains/customers.md) | Own service connection, reports, guidance, assistance, notifications and profile |
| [Supplier staff](domains/staff.md) | Operational report review, map, incidents, incident updates and assistance/distribution |
| [Supplier admin](domains/admin.md) | Supplier operations plus account, zone, approved-guidance/rule and official-advisory controls |

The project owner adopted the staff/admin permission split in [requirements](requirements.md); the API enforces it. A folder named `admin` describes the supplier workspace; it does not grant every staff account administrative authority.

## Detailed feature specifications

Each feature has its own `docs/features/<role>/<feature>/spec.md`. The specs use the requested [feature-spec](https://github.com/ZieksQ/feature-spec) workflow and `WHAT`, `MUST`, `HOW` format, with the original 126 acceptance criteria. The WHAT/MUST sections preserve required behavior and HOW links actual modules and limitations. Unchecked criteria are an acceptance inventory, not a blanket failure or pass; consult verification and traceability for exact evidence. These documents are not additional agent skills.

| Customer feature | Specification | Main requirement groups |
| --- | --- | --- |
| Authentication | [auth/spec.md](features/customer/auth/spec.md) | ACCESS, OPS |
| Home/dashboard | [dashboard/spec.md](features/customer/dashboard/spec.md) | UI-C01, NOTICE, INCIDENT |
| Reports and follow-up | [report/spec.md](features/customer/report/spec.md) | UI-C02/C03, REPORT, INCIDENT |
| Contextual guidance | [guidance/spec.md](features/customer/guidance/spec.md) | UI-C04, DECISION, NOTICE |
| Assistance requests | [assistance/spec.md](features/customer/assistance/spec.md) | UI-C05, ASSIST, CALLBACK, INSPECTION, WATER |
| Notifications | [notifications/spec.md](features/customer/notifications/spec.md) | UI-C06, ACCESS, NOTICE |
| Profile and saved connection | [profile/spec.md](features/customer/profile/spec.md) | UI-C06, ACCESS, REPORT |

| Supplier workspace feature | Specification | Main requirement groups |
| --- | --- | --- |
| Authentication | [auth/spec.md](features/admin/auth/spec.md) | ACCESS, OPS |
| Overview/dashboard | [dashboard/spec.md](features/admin/dashboard/spec.md) | UI-S01, METRIC |
| Report inbox/review | [report/spec.md](features/admin/report/spec.md) | UI-S02, REPORT, INCIDENT |
| Operational map | [map/spec.md](features/admin/map/spec.md) | UI-S03, INCIDENT, OPS |
| Incident management | [incident/spec.md](features/admin/incident/spec.md) | UI-S04, INCIDENT, NOTICE |
| Advisories | [advisory/spec.md](features/admin/advisory/spec.md) | UI-S05, NOTICE, DECISION |
| Assistance queue | [assistance/spec.md](features/admin/assistance/spec.md) | UI-S06, ASSIST, CALLBACK, INSPECTION |
| Pickup/distribution | [distribution/spec.md](features/admin/distribution/spec.md) | UI-S06, WATER |
| Settings, accounts, zones and guidance/rules | [settings/spec.md](features/admin/settings/spec.md) | UI-S05, ACCESS, DECISION, OPS, DEMO |

Keep detailed feature behavior in its spec and shared invariants in the reference documents. Cross-feature boundaries matter: recommendations never submit a service request, accepting water support reserves stock, collection happens once, assistance completion does not resolve a report, and outage resolution does not lift a quality advisory.

## Status, scope and open decisions

- **Implemented:** one supplier, seeded individual customer/staff/admin accounts, owned reporting/location/photo workflows, supplier map/review/incidents, independent advisories/publication, API rules/action cards, all three assistance services, transactional pickup stock, persisted in-app notifications, settings/audit, migrations and demo seed.
- **Adopted release defaults:** the role matrix, workflows, REST contracts/public DTOs, exact liters and metric definitions. Academic decision-support approval remains externally unverified.
- **Verification limits:** browser/API/database checks and client static/build checks cover subsets of the original requirements. Actual installed Android workflow evidence, artifact hashes and remaining device checks are in the [native ledger](native-verification.md). Build/type/helper checks are kept separate from on-device interaction. Live Geoapify depends on provider configuration. Use the current verification ledger for release status.
- **Deferred/optional:** billing/payments/commerce, home delivery/fleet/routing, IoT, automated water-safety diagnosis, iOS, multiple suppliers, app-store publication, external notification channels, public registration and AI.

Follow [root guidance](../AGENTS.md) and [mobile guidance](../aqours-app/AGENTS.md) for future changes. Keep synthetic notices/availability clearly labeled, preserve independent report/incident/advisory/assistance outcomes and update affected documentation with source and verification changes. Exact deadline, deployment destination and demonstration geography remain configurable.

- [Directory navigation](directory-structure.md): API layers, Prisma models and client feature folders.

- [Locations and maps](location-and-maps.md): PSGC catalog, guided addresses, snapshots, street basemaps, and provider settings.
