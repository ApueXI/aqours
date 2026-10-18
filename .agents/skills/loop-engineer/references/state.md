# Persistent state

Use the Markdown templates in `../assets/GOAL.md`, `../assets/STATE.md`, and `../assets/LOG.md`. Copy only missing files and replace template guidance with verified facts. Never reset a checkpoint on resume. No initializer command is required: adapt the templates to the project's policies.

`GOAL.md` is the durable execution contract: preserve the original request/source references and assign stable acceptance IDs. Keep its acceptance table in the form `| AC-001 | Observable requirement | Verification method |` so the optional runner can check coverage. Include docs accuracy and all required deliverables. Change agreed scope only when current user instructions authorize it; record the reason and retain the previous requirement history.

`STATE.md` is a compact snapshot: status, date, completed/remaining work, blockers and precise unblock actions, verification results, discrepancies and decisions, docs needing updates, and one executable next action. Use `IN_PROGRESS`, `COMPLETE`, `BLOCKED`, `INTERRUPTED`, or `CANCELLED`; a script's `CONTINUE` result corresponds to `IN_PROGRESS`. Preserve PASS/FAIL/BLOCKED/NOT_RUN distinctions and record command, working directory, observed outcome, and evidence path where available. Evidence must correspond to the current implementation.

`LOG.md` records meaningful iterations: hypothesis/task, change or attempted fix, check and outcome, useful evidence, documentation changes, and next action. Summarize output rather than copying large logs. Link durable decisions and contracts in `docs/`. If state becomes long, archive older iteration history under `.loop/archive/` with unique dated names and retain links plus a complete current snapshot.

For multiple explicitly included projects, keep these three files in each project and link their criteria/dependencies from the coordinating goal. Mark each project's own verification status accurately; completion requires all required projects. Never replace unrelated saved goals: archive them without overwriting before initializing a distinct goal.

If interrupted before a new checkpoint is possible, reconcile the last checkpoint with working-tree changes and rerun checks affected by those changes. Do not infer that an interrupted command passed.
