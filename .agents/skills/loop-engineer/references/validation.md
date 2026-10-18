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
| Completed project | Verify every criterion and docs, report COMPLETE with evidence, stop without inventing features. |

Script tests establish mechanical safeguards; an agent's isolated forward-test establishes behavior on that fixture. Neither proves all future sessions will follow every instruction. Report which scenarios were executed versus reviewed, unavailable checks, and remaining limits accurately.
