# Execution state

Status: IN_PROGRESS
Updated: Record date/time and current revision or working-tree context.
Goal: [GOAL.md](GOAL.md)

## Completed and remaining work

Record completed behavior and an ordered list of remaining tasks/criteria.

## Task ownership and integration

The lead creates and assigns tasks and alone updates shared `.loop/` files. Record delegation unavailability or why substantial work stays with the lead when applicable. Workers propose subtasks and ownership changes for lead approval.

| Task / acceptance IDs | Owner / worker ID | Allowed edit paths | Dependencies / readiness | Worker status / availability | Integration status / evidence / unresolved issues |
| --- | --- | --- | --- | --- | --- |
| Record bounded task and criteria | Lead or managed worker ID | Explicit files or disjoint directories | Task IDs and prerequisites | Planned / running / finished / stopped / unknown | Pending / reviewed / integrated / needs fixes; link results and checks |

### Worker model and reasoning selection

| Task / worker ID | Requested model / reasoning effort | Selection rationale / user overrides | Observed effective settings / evidence | Limitations / fallback |
| --- | --- | --- | --- | --- |
| Assigned task and worker ID | Explicit supported pair, or inherited when overrides are unavailable | Match task complexity; record applicable user choices | Confirmed values with tool evidence, inherited, or unknown; distinguish from requested values | Unsupported capability, surfaced user-setting conflict, or actual fallback and reason |

Before reassignment, reconcile actual edits and confirm the former owner has finished or stopped. Record ownership transfers and partial work. Recheck current capabilities before selecting replacement worker settings. Before handoff or final verification, record that all workers have finished or stopped; uncertain shutdown requires reconciliation on resume. Outstanding required work prevents COMPLETE.

## Verification

| ID | Result (PASS / FAIL / BLOCKED / NOT_RUN) | Evidence |
| --- | --- | --- |
| AC-001 | NOT_RUN | Record working directory, command or inspection, observed result, and evidence path. |
| AC-002 | NOT_RUN | Record documentation consistency checks and affected paths. |

## Blockers and decisions

Record each external dependency or consequential question, exact unblock action, independent work still possible, and resolved discrepancies with evidence. Write "None" when verified clear.

## Documentation updates

Record updated documents and those still needing changes, linked to the affected behavior.

## Exact next action

Record one concrete next command or edit, its working directory/path, expected result, and prerequisites. On completion, write "None — all acceptance criteria verified"; on interruption, preserve the actual next step.
