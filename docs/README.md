# Aqours documentation

Baseline: **18 October 2026**, Water Supply Reporting and Customer Assistance brief **v0.4**, supplied by the project owner. This documentation defines the intended system. The repository currently contains an Expo customer starter and empty API/web directories; the domain features, database and integrations below are **unimplemented**.

## Reference documents

| Document | Purpose |
| --- | --- |
| [Architecture](architecture.md) | Verified current structure, confirmed stack, proposed components, trust boundaries, data flows and implementation constraints |
| [Requirements](requirements.md) | Role capabilities, shared rules, stable `REQ-*` identifiers, ten future demo scenarios, deferred scope and open decisions |
| [Schema](schema.md) | No implemented database; separately labeled proposed records, relationships, integrity and transaction requirements |
| [Workflows and workspace](workspace.md) | Step-by-step provisioning, authentication, review, publication, assistance/pickup lifecycles, actual starter commands and future operational setup |

Use these together: requirements define the behavior, architecture defines boundaries, schema describes persistence status/design, and workspace traces the target workflows. [PROGRESS.md](../PROGRESS.md) records completed repository work and verification.

## Role summaries

| Role | Summary |
| --- | --- |
| [Customer](domains/customers.md) | Own service connection, reports, guidance, assistance, notifications and profile |
| [Supplier staff](domains/staff.md) | Operational report review, map, incidents, incident updates and assistance/distribution |
| [Supplier admin](domains/admin.md) | Supplier operations plus proposed account, zone, approved-guidance/rule and official-advisory controls |

The fine-grained staff/admin permission split is a **proposed default** in [requirements](requirements.md), to confirm before authorization implementation. A folder named `admin` describes the supplier workspace; it does not grant every staff account administrative authority.

## Detailed feature specifications

Each feature has its own `docs/features/<role>/<feature>/spec.md`. The specs use the requested [feature-spec](https://github.com/ZieksQ/feature-spec) workflow and `WHAT`, `MUST`, `HOW` format, with testable future acceptance criteria. They are implementation specifications, not additional agent skills or completed software. Proposed interfaces and modules do not imply existing routes/files or approved dependencies.

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

- **Confirmed choices:** Express/React/React Native with TypeScript; Android; standard containerized PostgreSQL; numeric coordinates; MapLibre web/native; Geoapify; all three assistance services; fictional demo data.
- **Proposed implementation defaults:** one supplier, rules/questionnaire/action cards, REST API groups, shared contracts strategy, exact permission split, physical schema and workflow details. Academic acceptance of the decision-support approach remains open.
- **Deferred:** billing/payments/commerce orders, home delivery/fleet/routing, IoT, automated water-safety diagnosis, iOS, multiple suppliers and app-store publication. External notification channels, public registration and AI are optional later decisions.
- **Unimplemented first-release requirements:** reporting, incidents, advisories, assistance, stock, authentication, database and notifications are still required targets; their absence does not make them deferred features.
- **Documentation verification:** check links, requirement/spec coverage, facts against repository evidence, state/role consistency and diff. The future `DEMO-*` scenarios and acceptance checkboxes are not test results from this documentation task.

Implement only when separately requested, follow [root guidance](../AGENTS.md) and [mobile guidance](../aqours-app/AGENTS.md), and update the affected reference/spec documents when behavior becomes real. Exact deadline, demo geography and deployment remain configurable; the seven-day sequence is not a committed delivery date.
