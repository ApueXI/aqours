# Persistent state

Use the Markdown templates in `../assets/GOAL.md`, `../assets/STATE.md`, and `../assets/LOG.md`. Copy only missing files and replace template guidance with verified facts. Never reset a checkpoint on resume. No initializer command is required: adapt the templates to the project's policies.

`GOAL.md` is the durable execution contract: preserve the original request/source references and assign stable acceptance IDs. Keep its acceptance table in the form `| AC-001 | Observable requirement | Verification method |` so the optional runner can check coverage. Include docs accuracy and all required deliverables. Change agreed scope only when current user instructions authorize it; record the reason and retain the previous requirement history.

`STATE.md` is a compact snapshot: status, date, completed/remaining work, blockers and precise unblock actions, verification results, discrepancies and decisions, docs needing updates, and one executable next action. Use `IN_PROGRESS`, `COMPLETE`, `BLOCKED`, `INTERRUPTED`, or `CANCELLED`; a script's `CONTINUE` result corresponds to `IN_PROGRESS`. Preserve PASS/FAIL/BLOCKED/NOT_RUN distinctions and record command, working directory, observed outcome, and evidence path where available. Evidence must correspond to the current implementation.

## Four-role managed delivery

Exactly four dedicated roles are approved for managed delivery: Implementer, Documentation/scribe, Tester, and UI/UX Tester. The lead coordinates, makes and approves decisions, reviews evidence, coordinates integration, and owns final acceptance. The lead never implements, edits documents/state/tests, runs verification commands, or performs Git mutations. Implementer owns production and integration changes plus Git changes/commit, but does not edit tests/docs or run checks. Documentation/scribe owns shared `.loop/` state and assigned project documentation; it records verified facts and never claims tests or behavior it did not observe. Tester owns tests and check execution/evidence, but never patches production code. UI/UX Tester inspects actual rendered product behavior using relevant skills and reports findings; for work without applicable UI, record a reasoned N/A. UI/UX Tester does not fix code, docs, or tests. Dedicated agents do not switch roles.

No worker descendants, additional agents, or replacement agents may be created without USER permission. This applies even if the lead approves it, a role is blocked, capacity changes, or a requested model is unavailable. Do not silently replace unavailable workers with the lead's production work. Report the actual limitation and identify the user decision needed. Reuse the four authorized agents across bounded waves, checking actual capacity and dependencies; do not infer a freed slot or assume idle status makes an agent available. Keep role ownership across waves.

| Role | Default requested model / effort | Escalation |
| --- | --- | --- |
| Implementer | `gpt-6.1-sol` / medium | high for complex cross-app, authorization, migration, or tricky bug work |
| Documentation/scribe | `gpt-6-luna` / medium | `gpt-6.1-sol` / medium when reconciling requirements, API contracts, or architecture across documents |
| Tester | `gpt-6.1-sol` / high | medium for a known, bounded checklist |
| UI/UX Tester | `gpt-6.1-sol` / high | `gpt-6-astra` / high for especially demanding visual reviews |

Choose from currently available settings based on task needs and user overrides. Requested model/effort and observed effective settings are separate facts. A spawn request does not prove the effective model. If an explicit user-requested setting cannot be honored, surface that limitation before substituting. Escalation or replacement must never bypass the user-permission rule above.

The lead assigns bounded tasks with stable acceptance IDs, exact owned paths, dependencies/readiness, and expected evidence. Parallelize only independent ready tasks and only within actual tool capacity. Freeze production changes before final Tester and UI/UX checks. Keep Tester engaged through final check execution; then scribe reconciles documentation and the lead reviews evidence. All workers must be quiescent before handoff or acceptance. Record owner IDs, requested/observed settings, statuses, evidence, blockers, and exact next actions. Checkpoint meaningful changes and before handoffs or interruptions.

Persist verified source facts, criteria, decisions, task ownership/path boundaries, dependencies/status, settings, evidence, blockers, and exact next actions. Documentation supports recovery after compaction but cannot prevent compaction or guarantee against hallucination. On every resume, reload the actual files and reconcile them with evidence; do not trust stale summaries. Confirm former owners have finished before transferring paths. Never report a check as PASS without its actual result.

## General recovery and evidence

For each worker, record the requested model and reasoning effort, task rationale, user overrides, and any effective settings exposed by the tool with evidence. Distinguish requested, confirmed, inherited, and unknown values. Record unsupported overrides or fallback explicitly. If forced interruption prevents confirming shutdown, record uncertainty and resolve it before reassignment. Before handoff or acceptance, finish or stop all workers and checkpoint remaining tasks and integration status. Outstanding required work prevents COMPLETE.

`LOG.md` records meaningful iterations: task, change or attempt, check and outcome, evidence, documentation changes, and next action. Summarize output rather than copying large logs. Link durable decisions and contracts in `docs/`. If state becomes long, archive older iteration history under `.loop/archive/` with unique dated names and retain links plus a complete current snapshot.

For multiple explicitly included projects, keep these three files in each project and link their criteria/dependencies from the coordinating goal. Mark each project's own verification status accurately; completion requires all required projects. Never replace unrelated saved goals: archive them without overwriting before initializing a distinct goal.

If interrupted before a new checkpoint is possible, reconcile the last checkpoint with working-tree changes and rerun checks affected by those changes. Do not infer that an interrupted command passed.
