# Optional continuation runner

The skill continues within the active session. Restarting after that session ends requires an external process that the user deliberately starts. This optional runner uses Python 3.10+ standard library on POSIX (Linux/macOS/WSL), an authenticated installed Codex CLI, and an existing project goal. It is never started by installation or normal skill invocation.

## Start, stop, and resume

First invoke `$loop-engineer <goal or specification>` in the target project. Let it populate `.loop/GOAL.md`, `STATE.md`, and `LOG.md`. To resume through subsequent sessions, run from that project's root:

```sh
python3 -B .agents/skills/loop-engineer/scripts/continue_loop.py --project . --max-runs 10
```

Use the actual skill path if it is installed elsewhere. `--max-runs` is a positive bound on sessions, not a token budget. Each session may continue through many development iterations. `--session-timeout 3600` sets the per-session wall-clock bound in seconds; both options may be raised deliberately. The runner does not configure the lead session's model or reasoning effort, or change account, billing, or capacity settings. The lead may select supported worker model/effort pairs through managed tools under the skill's adaptive policy and user overrides. `--codex /path/to/codex` selects the installed executable without invoking a shell.

From another terminal, request cancellation with:

```sh
python3 -B .agents/skills/loop-engineer/scripts/continue_loop.py --project . --stop
```

Alternatively press Ctrl-C in the runner terminal. Both methods terminate the worker process group and preserve the last available checkpoint. The `--stop` command creates `.loop/STOP`, which remains until explicitly removed and prevents restart. Ctrl-C stops the current invocation without creating that file. After reviewing saved state and resolving the stop reason, resume deliberately:

```sh
rm .loop/STOP
python3 -B .agents/skills/loop-engineer/scripts/continue_loop.py --project . --max-runs 10
```

Remove the stop file only if it exists and you intend to resume. Interactive resumption requires no runner:

```text
$loop-engineer Resume the goal in .loop/GOAL.md; reconcile .loop/STATE.md and continue from its next action.
```

## Controls and outcomes

The runner preflights installed `codex --help` and `codex exec --help` for required flags on every launch. Its command uses the documented capability set verified against installed `codex-cli 0.163.0` on 2026-10-18:

```text
codex --ask-for-approval never exec --sandbox workspace-write --ephemeral --cd PROJECT --output-schema SCHEMA --output-last-message RESULT -
```

`never` **denies requests for elevated approval** in this unattended lead session; it does not approve actions, disable the sandbox, ignore repository policy, or authorize external writes. The lead must checkpoint and return NEEDS_PERMISSION when authorization is required. The runner does not pass bypass flags, ignore rules/configuration, grant extra directories, or retry denied/nonzero CLI commands. Use an interactive session to obtain required permission and reassess the saved action. Existing managed restrictions remain authoritative.

Each fresh session reads the skill and saved state; no “latest session” selector can accidentally resume another project. `--ephemeral` avoids session rollout persistence, while `.loop/` holds cross-session state. It does **not** suppress all native Codex runtime/cache/auth writes. The runner leaves installed CLI configuration/authentication untouched. Before launching, check applicable project restrictions and local CLI side effects; project-only filesystem policies may require supported local runtime paths or explicit permission. This runner was not launched against the real CLI during skill creation.

Continuation requires all of these: zero CLI exit code, a valid structured CONTINUE report covering the original acceptance IDs, useful evidence, a changed `STATE.md`, an exact next action, an unchanged `GOAL.md`, and another available session in the configured bound. A changed goal stops for review rather than permitting unattended weakening of acceptance. The next user-authorized run can reconcile legitimate changes.

COMPLETE requires every original acceptance ID reported PASS with nonempty evidence, no blockers, and no next action. The lead must have performed the acceptance checks and documentation review. These structural checks cannot independently establish that evidence is truthful or tests are sufficient; inspect the report and project checks. A saved COMPLETE label by itself is insufficient: a new invocation reconciles the actual project before stopping.

The runner also stops on BLOCKED, NEEDS_PERMISSION, QUOTA_EXHAUSTED, CANCELLED, a stop file/signal, a time/session bound, missing/invalid output, changed contract, unchanged state/no evidence, and **any** CLI failure (including credential/quota/permission failures without a final report). It never retries an unknown failure or waits for quota resets. CLI diagnostics remain visible in the terminal; raw stdout/stderr and credentials are not copied into state files.

Artifacts live in `.loop/runner/`: one `result.json` per session and a compact `history.jsonl` containing timestamps, outcome codes, run IDs, and CLI exit codes. Human recovery details belong in `STATE.md`/`LOG.md`. Reports must not contain secrets. Exit code `0` means validated COMPLETE (or a successful `--stop` request); `130` means cancellation; `2` means incomplete, stopped, or runner/configuration error. Inspect the outcome rather than interpreting a stop request as project completion.

## Exclusive ownership and recovery

Atomic creation of `.loop/runner.lock/` prevents simultaneous runner instances on the same canonical project path. `owner.json` records runner/worker PIDs. Manual editing sessions must also respect that ownership. The runner's child session acts as lead/orchestrator and delegates substantial implementation by default under the same lock and authorization. It assigns one worker for a bounded task or several for independent ready tasks, respecting current concurrency and dependencies. Small tasks, shared interfaces, and tightly coupled integration fixes can stay with the lead. It owns overall task assignment and shared `.loop/` updates, prevents overlapping edits, reviews worker evidence, and integrates results. Workers need explicit lead approval for expanded ownership or further delegation. No additional runners or detached background workers are permitted. If managed sub-agent tools are unavailable, the lead records the limitation and continues directly.

The lead records worker model/effort requests, selection rationale, applicable user overrides, observable effective settings or uncertainty, and fallback in state. An accepted spawn request alone does not confirm the actual model used. Use self-contained briefs when selecting a model requires a fresh worker context. If per-worker overrides are unavailable, record inherited settings and the limitation; surface an unfulfillable explicit user choice before substituting it. Recheck capabilities on resume. The runner does not independently enforce model selection or add flags/configuration to enable it.

Before session handoff or final verification, the lead ensures all workers have finished or stopped, reconciles partial changes and remaining tasks, and checkpoints ownership, dependencies, worker status, and integration status. Final checks run against the integrated state; outstanding required worker work or workers still editing prevents COMPLETE. The JSON result schema is unchanged: the lead reports aggregate acceptance evidence and unresolved work using its existing fields. These are agent workflow requirements, not an independent runner inspection of managed sub-agent lifecycle. This implementation supports **one target project**; use interactive continuation for multi-project tasks requiring coordination across writable roots and locks.

Graceful exit removes its lock. A crash or SIGKILL can leave a lock deliberately in place. Check the recorded processes and confirm that neither the lead nor any managed worker still owns the project before manually deleting `owner.json` and the empty lock directory; never automatically break stale locks or delete a live lock. Inspect working-tree changes, reconcile saved state and worker availability, and confirm old owners have finished or stopped before reassigning work. Process-group cleanup does not independently prove that every managed sub-agent has stopped. Hard interruption may occur between checkpoints, so fresh checkpoints and process cleanup cannot be guaranteed after SIGKILL or machine shutdown.

Official capability references: [noninteractive mode](https://developers.openai.com/codex/noninteractive), [CLI flags](https://developers.openai.com/codex/cli/reference), [repository skill discovery](https://developers.openai.com/codex/skills), and [subagents and model selection](https://learn.chatgpt.com/docs/agent-configuration/subagents). Always recheck the installed help and managed-tool capabilities before adapting commands.
