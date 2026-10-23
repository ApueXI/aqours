# Update Loop Engineer to a four-role delivery workflow

User-approved goal, 2026-10-22. Update the existing repository skill `.agents/skills/loop-engineer/` for exactly four dedicated managed roles: Implementer, Documentation/scribe, Tester, and UI/UX Tester, coordinated by the lead. The lead is not a fifth worker role. Keep the skill's explicit invocation policy, runner behavior/schema/locks/permissions/cancellation, and existing application documents intact. No worker descendants, extra roles, or replacement agents without USER permission.

The prior completed distribution goal was preserved before starting this goal in [`archive/pre-loop-engineer-four-roles-2026-10-22/`](archive/pre-loop-engineer-four-roles-2026-10-22/), including its `INTERFACES.md`.

## Acceptance

| ID | Observable requirement | Verification method |
| --- | --- | --- |
| AC-001 | Exactly the four dedicated roles and lead coordination are consistently defined, with exclusive ownership and no role switching | Cross-surface content review |
| AC-002 | Additional agents, worker descendants, and replacements require USER permission; lead approval alone is insufficient | Policy scenario review |
| AC-003 | Bounded wave scheduling respects dependencies and actual tool capacity; no assumed slot release, silent substitution, or direct-lead takeover of unavailable role work | Workflow scenario review |
| AC-004 | Exact role-specific default model/effort table and escalation rules are documented; requested and observed settings are distinct and unavailable explicit settings are surfaced before substitution | Model table consistency review |
| AC-005 | Scribe owns shared `.loop` records and project documentation; checkpoint facts, IDs, paths, owners, status, evidence, blockers, and next actions | State/template review and populated current records |
| AC-006 | Compaction recovery reloads and reconciles actual files/evidence without claiming it prevents compaction or guarantees truth | Recovery wording review |
| AC-007 | Final checks freeze production first, Tester remains active through final check execution, UI/UX Tester reviews rendered behavior without code fixes, then scribe reconciles and lead reviews; all workers quiesce before handoff/completion | Sequence review |
| AC-008 | Skill references, templates, and runner guidance are consistent while explicit invocation policy and executable runner behavior/schema/locks/permissions/cancel remain intact | Diff review; metadata/script checks by owning roles |
| AC-009 | Prior active goal preserved without overwrite, current status is truthful, and COMPLETE is recorded only after verified checks and successful feature commit | Archive integrity and final evidence/commit review |
