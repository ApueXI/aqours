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
| Independent delegation | Lead records bounded tasks, dependencies, and disjoint edit ownership; assignments include context, constraints, deliverables, and checks. Workers return changed files, results, evidence, and unresolved issues; lead reviews and integrates them. |
| Small or tightly coupled work | Lead keeps the task or shared contract locally, records the decision, and proceeds without unnecessary delegation. |
| Conflicting ownership | Worker reports a needed out-of-scope edit; neither lead nor another worker edits the owned file concurrently. Lead confirms the owner has finished or stopped, inspects partial changes, and records transfer before work continues. |
| Failed worker checks | Worker returns failure evidence and unresolved issues; lead arranges diagnosis and correction within explicit ownership, reruns affected checks, and does not accept the worker report as completion. |
| Integration defect despite passing worker checks | Lead tests integrated changes, fixes the defect, reruns affected verification, and withholds COMPLETE until acceptance passes. |
| Interrupted delegation | Resume reconciles actual edits, stale evidence, and worker availability; uncertain owners are confirmed stopped before reassignment. Lead preserves partial work and updates shared state. |
| Sub-agent tools unavailable | Lead records the limitation and completes authorized work directly without adding a scheduler, runner, dependencies, or detached workers. |
| Completion with outstanding worker work | Lead withholds COMPLETE, finishes or stops workers before final verification/handoff, records remaining required work, and verifies the integrated state before acceptance. |
| Completed project | Verify every criterion and docs, report COMPLETE with evidence, stop without inventing features. |

Script tests establish mechanical safeguards; an agent's isolated forward-test establishes behavior on that fixture. Neither proves all future sessions will follow every instruction. Report which scenarios were executed versus reviewed, unavailable checks, and remaining limits accurately.
