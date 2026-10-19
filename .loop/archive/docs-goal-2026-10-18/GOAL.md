# Goal

## Original request and sources

On 2026-10-18, the user invoked `$loop-engineer` to fill the four root reference documents using the supplied **Water Supply Reporting and Customer Assistance — Project Brief v0.4 (18 October 2026)**. The user explicitly limited this task to documentation first.

Required documents: [architecture](../docs/architecture.md), [requirements](../docs/requirements.md), [schema](../docs/schema.md), and [workspace](../docs/workspace.md). The brief in the conversation is the product source; repository files are the source for implemented behavior. Official technical references are recorded beside the claims they support in the resulting documents.

On 2026-10-18 the user expanded the documentation scope: fill role summaries in `docs/domains/` and detailed `docs/features/<role>/<feature>/spec.md` documents using [feature-spec](https://github.com/ZieksQ/feature-spec). The already installed skill at `/home/cred/.agents/skills/feature-spec/SKILL.md` is used during execution; it is not installed or modified in this repository. The referenced remote repository was unavailable to the web fetcher; the available local skill supplies the research-first WHAT/MUST/HOW format. No application implementation was requested.

## Scope and deliverables

- Target project: the repository's root documentation set. Inspect `aqours-api/`, `aqours-web/`, and `aqours-app/` for evidence; none is an implementation or editing target in this task. Shared execution state lives here in root `.loop/`.
- Explain structure, technology, component boundaries, data flows, roles, permissions, shared rules, deferred scope, database status, proposed entities and constraints, and step-by-step customer/supplier workflows.
- `workspace.md` must cover registration/provisioning, authentication, approvals, assistance and pickup fulfillment, plus actual local setup conventions required by root guidance.
- Retain the existing `aqours-*` directories. Distinguish confirmed product choices, proposed implementation defaults, implemented facts, and unresolved academic/planning decisions.
- Fill the existing `docs/domains/admin.md` and `docs/domains/customers.md`, add a staff summary, and provide a documentation index with links to the four references, role summaries and feature specs.
- Use `docs/features/admin/` for supplier-workspace features, recording actual staff/admin permissions per feature; use `docs/features/customer/` for customer features. Administrative directory naming does not introduce a role or grant staff admin capabilities.
- Feature specs cover customer auth, dashboard, reports, contextual guidance, assistance, notifications and profile; supplier auth, dashboard, report inbox, map, incidents, advisories, assistance, distribution and settings. Use the feature-spec skill's WHAT/MUST/HOW structure and testable acceptance criteria, with source/dependency links.
- Update `PROGRESS.md`, verify documentation, and make a scoped commit on `feature/project-docs`.
- Excluded: application code, dependency installation, configuration/Compose/migration/seed creation, infrastructure, real credentials/accounts, home delivery, publication, external messages and optional continuation runner.

## Constraints and assumptions

- Follow root [AGENTS.md](../AGENTS.md) and preserve [mobile guidance](../aqours-app/AGENTS.md). No root/ancestor README or additional API/web guidance exists at discovery.
- Use root documentation-only verification: content/diff review and checks of paths, local links, code/configuration evidence, references, and workflow consistency. Application checks are not required because mobile/application files remain untouched.
- Baseline `887b285` on `feature/loop-engineer` had a clean working tree; the four requested documents and two domain documents were empty.
- The mobile starter declares Expo `~57.0.30`, React Native `0.86.3`, React `19.2.3`, and TypeScript `~6.0.3`; API/web directories are empty. There is no implemented database, auth, domain API, Compose configuration, migration, seed, or native MapLibre integration.
- Interpret order/delivery terminology through the brief's assistance-request and pickup/distribution lifecycle. There is no commerce order or home-delivery feature.
- Role capabilities beyond the brief and precise persistence designs are proposed defaults, not newly approved requirements or implemented controls. Academic acceptance of rules-based assistance and exact deadline remain open.
- Only root `.loop/`, documentation under `docs/`, and `PROGRESS.md` may be edited. No dependency or environment changes.

## Acceptance criteria

| ID | Observable requirement | Verification method |
| --- | --- | --- |
| AC-001 | Architecture describes the verified repository, confirmed target stack, proposed boundaries/data flows, security, location, persistence and notification constraints, without claiming they are built. | Compare `docs/architecture.md` to inspected code/configuration and the supplied brief; review technical claims against official references. |
| AC-002 | Requirements cover each role, required screens/workflows, common rules, decision support, operational constraints, demo acceptance scenarios, deferred capabilities and open decisions. | Manual coverage review against every WHAT/MUST/HOW topic in brief v0.4; verify proposed permission defaults are labeled. |
| AC-003 | Schema states that no database is implemented and separately documents proposed first-release entities, relationships, integrity/concurrency requirements and genuinely deferred structures. | Inspect API/web/root inventory for migrations/configuration; cross-check proposed schema against requirements and workflows without inventing existing tables or commands. |
| AC-004 | Workspace explains step-by-step role workflows, provisioning/login/logout, staff acceptance/scheduling, all three assistance services, pickup stock/cancellation/collection, recovery, and current versus future setup. | Trace each lifecycle against brief and other docs; compare actual commands, versions and paths to mobile package/configuration and missing infrastructure. |
| AC-005 | Documents are navigable and consistent; changes remain documentation-only and preserve unrelated work. | Check relative links/anchors, Markdown formatting, file scope and `git diff --check`; inspect final integrated diff and working tree. |
| AC-006 | Progress and loop state accurately record verification and limitations, workers have stopped, and a feature-branch commit succeeds. | Review `PROGRESS.md` and `.loop/`, count progress lines, inspect worker status and successful scoped `git commit` plus final clean `git status`. |
| AC-007 | Domain summaries explain customer, staff and admin capabilities and link each to its detailed feature specs without broadening permissions. | Trace every required screen/capability to a role summary and feature spec; compare the proposed permission split with requirements. |
| AC-008 | Detailed feature specs exist at the requested role/feature/spec.md paths, follow feature-spec WHAT/MUST/HOW, and include specific acceptance, failure, authorization, data-flow and verification requirements. | Inspect every spec against the installed feature-spec skill, brief and reference docs; check structure, size, links, requirement references and role/feature coverage. |

## Documentation and discrepancies

1. Root guidance describes the intended stack, while code contains only an Expo starter. Resolution: label current state and future target separately in all docs; proposed schema is not implemented schema.
2. The brief proposes `apps/*` and `packages/contracts`; the repository uses `aqours-*`. Resolution: keep existing paths and label shared contracts/workspace tooling as proposed without restructuring.
3. Root guidance calls `workspace.md` a setup document; the latest request calls it a role workflow document. Resolution: cover workflows first and append verified local setup and future operational prerequisites.
4. The latest request mentions orders/delivery; the detailed brief explicitly excludes home delivery and commerce. Resolution: describe assistance requests and supplier-managed pickup; state no order/payment/delivery tables exist or are in first-release scope.
5. Starter README suggests root `app/` and cross-platform support; actual routes are `aqours-app/src/app/`, and the confirmed product target is Android. Resolution: document actual route paths and distinguish starter capabilities from product scope.

## Authorized scope changes

- 2026-10-18: user added role summaries and detailed feature specs using feature-spec, with the role/feature/spec.md hierarchy. This extends AC-005–006 and adds AC-007–008. It removes the earlier exclusion of domain documents; application implementation remains excluded.
