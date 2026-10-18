# Validation scenarios

Validate metadata with the installed skill-creator's `scripts/quick_validate.py`. Run the optional runner's isolated tests without executing a real Codex session:

```sh
python3 -B .agents/skills/loop-engineer/scripts/test_continue_loop.py
```

The test suite uses temporary fixtures, a local simulated CLI, and no network, credentials, package installation, or changes to an application. It checks actual subprocess continuation, evidence/coverage gates, failed CLI outcomes, cancellation, locking, and scope preservation. Temporary files are created in a disposable directory under the current working directory and removed afterward.

Review these decision scenarios when changing the instructions. For behavioral forward-testing, give an independent agent only the skill, a realistic goal, and raw fixture artifacts; allow writes exclusively inside the fixture. Do not supply the expected solution.

| Scenario | Expected observable behavior |
| --- | --- |
| Several unfinished requirements | Preserve all original criteria, complete connected workflows, checkpoint progress, continue directly to remaining tasks. |
| Fixable test/build failure | Read actual failure evidence, diagnose and fix, rerun affected checks, continue; do not label an ordinary defect BLOCKED. |
| Structure or API change | Reconcile architecture/contracts/examples and relevant index links in the implementation loop; verify important examples and paths. |
| Docs disagree with code | Record the discrepancy and evidence; resolve using current instructions and requirements, ask only about unresolved consequential conflicts. |
| Interrupted run with saved state | Reconcile saved next action and stale evidence with actual code/docs; preserve completed work and continue. |
| Genuine external blocker | Continue independent work, then checkpoint BLOCKED with the precise dependency/action; never report COMPLETE or retry indefinitely. |
| One substantial bounded task | Lead assigns implementation to one worker with a complete brief, retains coordination/review/acceptance, and records the selected model/effort and rationale. It does not require multiple workers to delegate. |
| Independent delegation | Lead dispatches independent ready tasks to multiple workers within available concurrency, with disjoint ownership and self-contained briefs. Workers return changed files, results, evidence, and unresolved issues; lead reviews and integrates them. |
| Dependent tasks | Lead establishes shared interfaces and completes prerequisites before dependent implementation starts; no concurrent conflicting contract edits or workers waiting on undefined inputs. |
| Small or tightly coupled work | Lead handles small tasks, shared interfaces, or tightly coupled integration fixes directly; records the reason for any substantive direct work. |
| Adaptive worker selection | Lead selects supported model/effort pairs by actual task complexity, uses explicit settings when supported, and distinguishes requests from confirmed or unknown effective settings. No fixed model catalog or global configuration edits are introduced. |
| Explicit user model or effort | Lead honors the user's chosen settings over adaptive defaults; if unsupported, it surfaces the precise limitation before substitution and continues independent work. |
| Fresh context for model overrides | Lead uses the supported spawn mode and supplies objective, acceptance IDs, relevant paths/facts/contracts, constraints, allowed edits, dependencies, deliverables, and verification without relying on inherited chat history. |
| Worker overrides unavailable | Lead delegates with supported inherited settings, records the limitation and observable settings or uncertainty, and never claims an unsupported override was applied. Explicit user-setting conflicts are surfaced. |
| Worker proposes subtasks or delegation | Lead approves ownership changes and explicitly authorizes any further delegation before workers expand scope or spawn descendants. Overall task assignment remains with the lead. |
| Conflicting ownership | Worker reports a needed out-of-scope edit; neither lead nor another worker edits the owned file concurrently. Lead confirms the owner has finished or stopped, inspects partial changes, and records transfer before work continues. |
| Failed worker checks | Worker returns failure evidence and unresolved issues; lead arranges diagnosis and correction within explicit ownership, reruns affected checks, and does not accept the worker report as completion. |
| Integration defect despite passing worker checks | Lead tests integrated changes, fixes the defect, reruns affected verification, and withholds COMPLETE until acceptance passes. |
| Interrupted delegation | Resume reconciles actual edits, stale evidence, and worker availability; uncertain owners are confirmed stopped before reassignment. Lead preserves partial work, rechecks current concurrency/model/effort capabilities, and records replacement settings. |
| Sub-agent tools unavailable | Lead records the limitation and completes authorized work directly without adding a scheduler, runner, dependencies, or detached workers. |
| Completion with outstanding worker work | Lead withholds COMPLETE, finishes or stops workers before final verification/handoff, records remaining required work, and verifies the integrated state before acceptance. |
| Completed project | Verify every criterion and docs, report COMPLETE with evidence, stop without inventing features. |

Script tests establish mechanical safeguards; an agent's isolated forward-test establishes behavior on that fixture. Neither proves all future sessions will follow every instruction. Report which scenarios were executed versus reviewed, unavailable checks, and remaining limits accurately.
