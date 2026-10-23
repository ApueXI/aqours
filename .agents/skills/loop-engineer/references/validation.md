# Validation scenarios

Validate metadata with the installed skill-creator's `scripts/quick_validate.py`. Run the optional runner's isolated tests without executing a real Codex session:

```sh
python3 -B .agents/skills/loop-engineer/scripts/test_continue_loop.py
```

The test suite uses temporary fixtures, a local simulated CLI, and no network, credentials, package installation, or changes to an application. It checks actual subprocess continuation, evidence/coverage gates, failed CLI outcomes, cancellation, locking, and scope preservation. Temporary files are created in a disposable directory under the current working directory and removed afterward.

Review these decision scenarios when changing the instructions. Record the input, decision, supporting instruction/evidence, and result; prose review is not an executed behavioral test. Do not use wording-match tests as proof that an agent will follow policy. Any live fixture exercise must use the authorized four roles, actual capacity and permissions; an additional evaluation agent requires user permission. Allow writes exclusively inside the fixture and do not supply its expected solution.

| Scenario | Expected observable behavior |
| --- | --- |
| Several unfinished requirements | Preserve all original criteria, complete connected workflows, checkpoint progress, continue directly to remaining tasks. |
| Fixable test/build failure | Tester returns actual failure evidence; lead routes production defects to Implementer and test defects to Tester. Relevant checks rerun after correction; an ordinary defect is not BLOCKED. |
| Structure or API change | Implementer returns final interfaces and behavior; Documentation reconciles architecture/contracts/examples and index links, with Tester verifying important examples and paths. |
| Docs disagree with code | Documentation records discrepancy/evidence and reconciles facts with requirements and current user instructions; lead resolves or surfaces consequential conflicts before acceptance. |
| Interrupted run with saved state | Documentation reloads and reconciles durable facts, decisions, evidence, ownership and exact next action with actual code/docs and available roles before work resumes. Stale completion claims do not pass checks. |
| Genuine external blocker | Continue independent work, then checkpoint BLOCKED with the precise dependency/action; never report COMPLETE or retry indefinitely. |
| Four-role roster | Lead creates only Implementer, Documentation, Tester and UI/UX Tester role agents and reuses them. Main Codex limits itself to orchestration, read-only evidence review and acceptance; it does not edit production/docs/tests or run checks. |
| One bounded task or small fix | Implementer owns production edits, integration and Git operations even when the task is small or tightly coupled. Tester owns test code and checks; Documentation records the outcome; UI/UX Tester performs the applicable review or gives a reasoned N/A. |
| Independent ready tasks | Lead dispatches disjoint ready assignments to the named roles within actual capacity. Briefs give acceptance IDs, relevant facts/contracts/paths, allowed edits, dependencies, deliverables and evidence requirements without relying on inherited chat. |
| Dependent tasks | Implementer establishes interfaces/prerequisites before dependent work; lead sequences assignments without concurrent conflicting contract edits or undefined inputs. |
| Four total concurrency slots | Lead counts itself toward actual capacity and schedules named roles in waves. It does not create a fifth simultaneous agent, rename roles to bypass capacity or perform an absent role's work. |
| Lifecycle cannot release capacity | Lead records the exact tool/lifecycle limitation and surfaces inability to schedule the remaining role. It does not assume an idle or finished agent frees a slot or invent replacement capacity. |
| Default model and effort pairs | Requests use Implementer gpt-6.1-sol medium, Documentation gpt-6-luna medium, Tester gpt-6.1-sol high and UI/UX Tester gpt-6.1-sol high. Requested settings, rationale and observable effective settings or uncertainty remain distinct. |
| Role complexity changes | Complex cross-app/auth/migration/tricky production work uses Implementer high; cross-document requirements/API/architecture reconciliation uses Documentation gpt-6.1-sol medium; a known testing checklist may use Tester medium; especially demanding visual reviews may use UI/UX Tester gpt-6-astra high. Changed settings still obey the replacement-agent permission rule. |
| Explicit user model or effort | Lead honors explicit user settings over defaults; unsupported settings are surfaced before any substitution, with independent work continuing where possible. No global configuration is changed. |
| Overrides unavailable or unconfirmed | Lead records unsupported/unexposed model or effort settings before substitution and does not claim requested settings are effective. Fresh-context mode is used when required by supported override tools; inherited or unknown settings remain labeled honestly. |
| Additional, replacement or descendant agent | Workers report the need to the lead. Only user permission authorizes an agent beyond the four-role roster or a replacement/descendant; lead authorization alone is insufficient, including model escalation by respawning. |
| Conflicting ownership | Lead assigns nonoverlapping allowed edit paths, including test/docs boundaries. A role reports out-of-scope needs; lead confirms the current owner finished/stopped and inspects partial work before an explicit transfer. |
| Documentation and scribe ownership | Documentation alone writes shared .loop state and maintained docs, recording durable facts, decisions, evidence and exact next actions from all roles. Lead and other roles return evidence instead of concurrently editing that state. |
| Scribe interruption or compaction | Lead obtains current-role evidence and routes reconciliation to Documentation; uncertain ownership is resolved before transfer. Durable state helps recovery but does not prevent platform compaction or guarantee freedom from hallucinations. |
| Test ownership | Tester writes meaningful tests and executes relevant build/type/lint/integration checks. It reports production defects to Implementer instead of patching production; main Codex reviews evidence without executing tests itself. |
| Rendered UI review | UI/UX Tester uses relevant available skills and inspects actual rendered browser/device/screenshots for the changed UI, records artifact/context and actionable defects, and routes fixes to Implementer. Code-only aesthetic claims do not replace rendered evidence. |
| No changed UI or unavailable UI tools | UI/UX Tester records a reasoned N/A for a task without UI. A required UI check with missing tools is unavailable/blocked, never a fabricated pass or an unreasoned N/A. |
| Shared environment conflict | Lead serializes tests, browser/device sessions, shared servers/database fixtures or generated outputs when they conflict, records ownership and waits for release before the next role uses them. |
| Failed checks or UI defects | Lead routes production fixes to Implementer, test fixes to Tester and documentation fixes to Documentation; the responsible verifier reruns affected checks/review, and worker completion alone is not acceptance. |
| Integration defect despite passing role checks | Implementer corrects the integrated defect, Tester reruns affected verification and UI/UX Tester revisits affected rendering; lead withholds acceptance until evidence is current. |
| Interrupted delegation | Resume reconciles actual changes, stale evidence and role availability; uncertain owners are confirmed stopped before reassignment. Reuse the existing named roles, and obtain user permission before any necessary replacement. |
| Sub-agent tools unavailable | Lead surfaces the inability to execute the four-role workflow and records the limitation through available authorized means. It does not implement, test, document or review UI directly as a fallback, or add a runner/detached worker. |
| Final verification sequencing | Production/integration edits freeze before final Tester/UI verification. Verifiers may still be active to perform that work; a later affected edit invalidates and reruns the corresponding check. |
| Completion with outstanding role work | Documentation reconciles final docs/state and evidence; all roles are finished/stopped and quiescent before final handoff/acceptance. Pending required work or active editing prevents COMPLETE. |
| Runner and invocation invariants | Skill selection policy remains unchanged; the optional runner starts only when chosen by the user. Existing result schema, project locks, scope/permission checks, stop file, cancellation and executable behavior are preserved, with the child session coordinating the same four roles under its lock. |
| Completed project | Verify every criterion and docs, report COMPLETE with evidence, stop without inventing features. |

Script tests establish mechanical safeguards; an authorized live fixture exercise establishes behavior only on that fixture. Neither proves all future sessions will follow every instruction. Report which scenarios were executed versus reviewed, unavailable checks, and remaining limits accurately. In particular, metadata/link/syntax checks and scenario review do not constitute live proof of model selection, agent lifecycle, four-role scheduling, scribe recovery or UI inspection.
