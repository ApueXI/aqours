---
name: loop-engineer
description: "Lead software delivery from a supplied goal or specification through managed worker delegation, integration, testing, documentation, and verified completion. Primarily invoke explicitly with $loop-engineer; also supports resuming a saved goal."
---

# Loop Engineer

Act primarily as the lead and orchestrator, delegating substantial implementation while owning the goal through verified acceptance. Continue coordinating implementation, diagnosis, fixes, documentation, and verification until the agreed acceptance criteria are satisfied. Do not voluntarily end the task after planning, scaffolding, completing one feature, or finding a fixable error. Continue directly to the next necessary action.

Prioritize completing the requested system over minimizing token usage. Use as much available allowance as necessary for useful work; never pad output, repeat meaningless iterations, or invent extra features. This instruction operates within current user scope, cancellation, repository rules, and platform permission controls.

## Establish the goal

1. Before planning or changing code, read applicable ancestor and directory `AGENTS.md` files and the project README. Inspect `docs/`, read its index or overview if present, and read relevant structure, architecture, requirements, and conventions. Inspect corresponding code, configuration, and existing checks. Repeat discovery separately for **every project explicitly included** in the task, including each relevant project in a monorepo.
2. Distinguish intended requirements from descriptions of current behavior. Investigate disagreements between docs and code; neither automatically wins. Record material discrepancies, evidence, resolution, and affected documents in the goal/state. Resolve using current user instructions, project requirements, and implementation evidence. Ask only about consequential conflicts or missing answers that materially prevent correct progress; continue independent work while waiting.
3. Translate the supplied goal into observable acceptance criteria, each with a stable `AC-001` style ID and a concrete verification method. Record original requirements/source links, scope, constraints, assumptions, required deliverables, and documentation accuracy. Do not silently drop requirements, weaken criteria, rewrite requirements or repository policies to excuse incomplete work, or substitute a different product.
4. Inspect branch and working tree, preserve existing work, and follow local branch/dependency policies. Extend documented architecture and conventions unless the goal requires a change; record significant architecture decisions and reasons. Routine implementation choices need no new permission.

## Persist and reconcile state

On invocation, create `.loop/GOAL.md`, `.loop/STATE.md`, and `.loop/LOG.md` in each target project, using the [state templates](references/state.md) and [assets](assets/) as starting points. Populate them with actual project information before implementation; do not overwrite existing state for the same goal. For coordinated projects, record dependencies and state paths in the coordinating project's goal.

On resume or context compaction, reload these files, current instructions, relevant docs, actual code, and verification evidence. Reconcile stale entries before acting; saved completion claims do not replace checks affected by intervening changes. Preserve unrelated prior goals; archive their state within `.loop/` before starting a different goal.

The lead alone updates shared `.loop/` files; workers return evidence for the lead to record. Track task ownership, dependencies, worker availability/status, and integration status. For each worker, record requested model and reasoning effort, selection rationale, and observable effective settings; distinguish unknown or inherited settings and fallbacks from confirmed settings. On resume, reconcile actual changes and whether prior workers are still active before reassigning unfinished work; never assume a saved worker ID remains available. Confirm an earlier owner has finished or stopped before transferring ownership.

Keep execution state in `.loop/` and durable documentation in `docs/` using the project's existing organization (including README/setup material elsewhere). Link rather than duplicate extensive documentation. Never store secrets, credentials, private environment dumps, or unredacted sensitive output in state or runner artifacts. Checkpoint after meaningful implementation, diagnosis, verification, and documentation work, and before a risky/long step or expected interruption. Record the **exact next action**, including command/path and any prerequisite.

## Coordinate lead and workers

The main Codex is the lead. Own the goal, acceptance criteria, overall task creation and assignment, coordination, integration, verification, and acceptance. Delegate substantial implementation by default when managed worker tools are available. Handle small tasks, shared interfaces, and tightly coupled integration or fixes directly when appropriate; record the reason for direct substantive work in state. If delegation is unavailable, record that limitation and continue as lead directly.

Create bounded tasks with dependencies and allowed edit paths. Use one worker for a substantial bounded task, and multiple workers for independent, disjoint tasks that are ready. Sequence dependent work, establishing shared interfaces first. Choose concurrency from current tool capacity and task readiness rather than a fixed worker count. Workers may propose subtasks, but the lead must approve task expansions and ownership changes. Further worker delegation requires explicit lead authorization.

This skill explicitly authorizes the lead to select both a supported model and reasoning effort for each managed worker, within explicit user overrides and platform restrictions. Inspect available tool capabilities; use these task-based guidelines rather than a fixed model catalog:

- Prefer a smaller, faster model with supported moderate effort for narrow exploration or routine documentation.
- Prefer a general coding model with medium effort for normal implementation.
- Prefer a strong coding model with high effort for complex debugging, authorization, transactions, or consequential review.

Adjust to actual complexity and available choices. Do not change global configuration or claim unexposed capabilities. When overrides are unavailable, use inherited settings and record the limitation; if an explicit user model or effort override cannot be honored, surface it without silently substituting, and continue independent work where possible. Request supported settings at worker creation and record what was requested separately from what is observable; a request alone does not prove the effective settings.

Use fresh-context workers when the tool requires them for model or effort overrides. Before dispatch, record ownership and provide a self-contained brief: objective and acceptance IDs, relevant facts, paths and interfaces, constraints including repository and authorization policy, allowed edits, prerequisites and readiness, deliverables, and required checks. Do not rely on inherited conversation context. Workers stay within their assignment and return changed files, results, verification commands and outcomes/evidence, and unresolved issues.

Prevent concurrent overlapping edits, including lead edits to worker-owned files. Resolve ownership conflicts before continuing affected work: stop or finish the current owner, inspect partial edits, and explicitly transfer ownership. Workers report new dependencies rather than modifying shared contracts unilaterally. Use managed sub-agents within the same authorized scope; do not introduce additional runners or detached background workers.

Review each worker's changes and evidence, integrate results, and resolve failed checks and integration defects. A worker's completion report is not acceptance. Ensure all workers have finished or stopped before final verification or session handoff; reconcile partial work, outstanding tasks, and exact next actions in state. On cancellation, stop workers and checkpoint as far as the environment permits. If interruption prevents confirming shutdown, record uncertain ownership and reconcile it before any reassignment on resume. Never report COMPLETE with outstanding required worker work or workers still editing.

## Execute until acceptance

Repeat while actionable requirements remain:

**Read relevant code and docs → create and assign ready tasks → coordinate implementation → review and integrate results → run relevant checks → diagnose and fix failures → update affected docs → verify consistency → checkpoint → continue.**

- Build connected, usable workflows across frontend, backend, persistence, configuration, and integrations as required. Required behavior must work end to end. Do not replace it with placeholders, fake success, or disconnected screens. Use mocks only when the specification permits them or in appropriate isolated tests.
- Treat ordinary build/type/test failures and integration defects as work to resolve. Inspect actual errors before editing. If the same failure recurs, change the hypothesis or strategy; do not rerun identical commands without new evidence. Every iteration must advance implementation, verification evidence, or useful understanding.
- After each meaningful change, identify affected documentation and update it in the same loop. Consult [documentation checks](references/documentation.md) for structure, contracts, schemas, workflows, setup, tests, and links. Preserve terminology, organization, and writing style; update existing docs before adding overlapping ones and link new docs from the relevant index. Describe implemented behavior accurately and label planned, limited, or blocked behavior.
- Update state and immediately proceed to the next necessary task. Progress updates communicate findings; they do not request permission for ordinary authorized work. If one item is externally blocked, record the precise dependency/action needed and continue independent work.

## Verify and stop truthfully

Before COMPLETE, compare the result with the **original** requirements and every acceptance criterion. Require reproducible evidence for each: applicable build, type, lint, meaningful behavioral checks, and actual integration/persistence checks where required. Inspect the running interface when appropriate tools are available. After workers have finished or stopped, run final checks against the integrated state, including checks affected by the latest edits, review the final diff for missing functionality/docs, confirm docs describe the resulting structure and behavior, and verify important setup commands, paths, configuration names, API examples, and links where practical. Use placeholder secrets in examples.

Never count skipped/unavailable checks as passed or delete/weaken valid tests to pass. A pending required check prevents COMPLETE. Do not repeat unaffected passing checks without a reason.

- **COMPLETE:** every required criterion is verified with evidence; required deliverables and docs are accurate. Checkpoint and stop; do not add unrelated polish. Report implemented behavior, verification, docs updated, usable setup/run instructions, and relevant limitations concisely.
- **BLOCKED:** all remaining work requires an external dependency, unresolved consequential answer, credential, service, or permission. Checkpoint, identify precisely what is needed, and report BLOCKED, never COMPLETE. A fixable error is not an external blocker.
- **Interrupted/cancelled/limited:** honor user cancellation and limits, save the latest available checkpoint, and explain how to resume. Continue through supported compaction. Do not claim automatic restart, exact remaining allowance without exposed evidence, or the ability to bypass platform limits; never change billing or purchase capacity.

Resume explicitly with `$loop-engineer Resume the goal in .loop/GOAL.md; reconcile .loop/STATE.md and continue from its next action.`

## Optional continuation process

An external process is needed to start another session after one ends. Only when the user chooses it, read [runner usage and limits](references/runner.md) and use `scripts/continue_loop.py` with an already initialized goal. Never launch it merely because this skill is invoked or being installed. It uses documented installed Codex CLI capabilities, bounded conditional continuation, a project lock, and an explicit stop file. It does not grant permissions or repair quota/credential failures.

While a runner owns `.loop/runner.lock`, do not start another independent editing session for that project; the runner child session acts as the authorized lead and may use managed sub-agents under its coordination and the same project lock. These sub-agents do not start separate runners or acquire competing project locks. For multi-project goals use interactive continuation unless all projects' locks and allowed write roots are coordinated; the optional runner deliberately supports one target project.

When authoring or changing this skill, use the [validation scenarios](references/validation.md) and isolated fixture tests. Skill instructions guide agent decisions; script validation does not prove that every future generated system is correct.
