# Documentation checks during implementation

Identify the affected documents for each meaningful change. Use the existing `docs/` index/overview and README links; preserve organization and writing style. Add new documentation only when existing documents cannot cover the change coherently, and link it from the relevant index.

| Change | Documentation to reconcile and verify |
| --- | --- |
| Directory/module structure | Directory descriptions, module responsibilities, architecture diagrams, imports and paths in examples |
| Architecture/integration | Component boundaries, data flow, integration configuration, significant decisions and their reasons |
| API | Endpoints, methods, schemas/contracts, request examples, authorization, error responses |
| Persistence | Entities, relationships, constraints, migrations, seed instructions, data lifecycle |
| Feature/workflow | Actual user workflow, feature limits, roles and backend permissions |
| Configuration/setup | Environment names, placeholder values, prerequisites, local/deployment commands |
| Checks/tooling | Testing commands, meaningful coverage, troubleshooting and observed failure remedies |
| Agent delivery workflow | Role ownership, supported role count, scheduling, model requests versus observed settings, checkpoint/recovery limits, and skill/runner/template consistency |

For this skill, keep its entrypoint, metadata, state/documentation/runner references, templates, and active `.loop/` records consistent. The lead coordinates and approves decisions; role boundaries and the prohibition on additional or replacement agents without USER permission must not be weakened in one surface. Do not describe documentation as preventing compaction or guaranteeing truthful recovery: it supports recovery, while each resume must reload and reconcile actual files and evidence.

Verify documented commands and important examples when practical, and inspect local links and named paths/configuration keys. Record unavailable verification truthfully in state. Describe what is implemented; label future plans, known limitations, and external blockers distinctly. Do not rewrite requirements or policies to justify unfinished implementation, and avoid unrelated documentation rewrites.
