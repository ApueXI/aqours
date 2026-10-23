# Execution state

Status: IN_PROGRESS
Updated: Record date/time and current revision or working-tree context.
Goal: [GOAL.md](GOAL.md)

## Completed and remaining work

Record completed behavior and an ordered list of remaining tasks/criteria.

## Task ownership and integration

The lead assigns bounded tasks and approves decisions. Documentation/scribe alone edits shared `.loop/` files and assigned project documentation, recording verified facts at the lead's direction. Record delegation unavailability or why work remains with a role when applicable. Workers report subtasks and proposed ownership changes; only the user may authorize additional/replacement agents.

Exactly four dedicated roles are approved: Implementer (production/integration and Git changes/commit), Documentation/scribe (project documentation and shared `.loop/` records), Tester (tests, check execution and evidence), and UI/UX Tester (read-only actual rendered review, no product fixes). The lead coordinates, approves decisions, reviews evidence, coordinates integration, and owns final acceptance; it never implements, edits docs/state/tests, runs checks, or performs Git mutations. Agents do not switch roles.

| Task / acceptance IDs | Owner / worker ID | Allowed edit paths | Dependencies / readiness | Worker status / availability | Integration status / evidence / unresolved issues |
| --- | --- | --- | --- | --- | --- |
| Record bounded task and criteria | Role and worker ID | Explicit files or disjoint directories | Task IDs and prerequisites | Planned / running / finished / stopped / unknown | Pending / reviewed / integrated / needs fixes; link results and checks |

### Worker model and reasoning selection

| Task / worker ID | Requested model / reasoning effort | Selection rationale / user overrides | Observed effective settings / evidence | Limitations / fallback |
| --- | --- | --- | --- | --- |
| Assigned task and worker ID | Implementer gpt-6.1-sol/medium; Documentation gpt-6-luna/medium; Tester gpt-6.1-sol/high; UI/UX Tester gpt-6.1-sol/high; apply documented escalation as needed | Match task complexity; record applicable user choices | Confirmed values with tool evidence, inherited, or unknown; distinct from requested values | Unsupported capability, surfaced user-setting conflict, or actual fallback and reason |

No worker descendants, additional agents, or replacement agents without USER permission, even with lead approval. Schedule independent ready work in bounded waves within actual tool capacity; don't infer a freed slot from idle status. Before final checks freeze production changes; keep Tester active through final check execution. Then scribe reconciles docs and lead reviews evidence. All workers must be quiescent before handoff/completion. On resume, confirm former owners have finished before transferring paths and reconcile partial work. Outstanding required work prevents COMPLETE.

## Verification

| ID | Result (PASS / FAIL / BLOCKED / NOT_RUN) | Evidence |
| --- | --- | --- |
| AC-001 | NOT_RUN | Record working directory, command or inspection, observed result, and evidence path. |
| AC-002 | NOT_RUN | Record documentation consistency checks and affected paths. |

## Blockers and decisions

Record each external dependency or consequential question, exact unblock action, independent work still possible, and resolved discrepancies with evidence. Write "None" when verified clear.

## Documentation updates

Record updated documents and those still needing changes, linked to affected behavior.

## Exact next action

Record one concrete next command or edit, its working directory/path, expected result, and prerequisites. On completion, write "None — all acceptance criteria verified"; on interruption, preserve the actual next step.
