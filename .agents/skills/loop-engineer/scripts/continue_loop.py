#!/usr/bin/env python3
"""Explicit, bounded continuation of a saved loop-engineer goal (Python 3.10+, POSIX)."""

import argparse
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time
import uuid

from runner_support import (
    acceptance_ids, contained, digest, project_lock, read_result, record, state_files,
)

SKILL = Path(__file__).resolve().parent.parent


def positive(value):
    value = int(value)
    if value < 1:
        raise argparse.ArgumentTypeError("must be a positive integer")
    return value


def preflight(codex, project):
    for args, flags in [
        (["--help"], ["--ask-for-approval"]),
        (["exec", "--help"], ["--sandbox", "--ephemeral", "--cd", "--output-schema", "--output-last-message"]),
    ]:
        result = subprocess.run([codex, *args], cwd=project, capture_output=True, text=True, timeout=15)
        if result.returncode or any(flag not in result.stdout for flag in flags):
            raise ValueError("Installed Codex lacks required documented flags; inspect codex exec --help")


def prompt(project):
    return f"""Use $loop-engineer at {SKILL / 'SKILL.md'} to resume the existing goal in {project}.
Read applicable AGENTS.md, README, docs, .loop/GOAL.md, STATE.md, and LOG.md;
reconcile actual changes and tool evidence before assigning work. The parent runner
owns .loop/runner.lock. This child session is solely the lead/orchestrator; work only
on this target project within the same authorization and lock.
Use exactly four dedicated worker roles: Implementer, Documentation/scribe, Tester,
and UI/UX Tester. Lead only creates tasks, coordinates, approves decisions, reviews
changes/evidence read-only, and accepts. Lead never implements, edits docs/state/tests,
runs checks or mutates Git, including small tasks and integration fixes.
Implementer owns production/integration/fixes and Git mutations; Tester owns test
files and all technical checks, never production fixes. Scribe exclusively writes
.loop/ and project documentation using verified evidence and lead-approved decisions.
UI/UX Tester uses relevant available skills for read-only rendered browser/device/
screenshot review and reports issues without fixes; require actual rendered evidence
or a reasoned lead-approved N/A when this work has no applicable UI.
Reuse one identity per role. No descendants, extra or replacement agents without
explicit USER permission; lead cannot authorize them alone. Do not combine or rebrand
roles. Run the four roles in supported waves when capacity requires it; an idle agent
may still occupy a slot. Never bypass capacity or fall back to direct lead work.
Surface actual inability to schedule and finish independent authorized work first.
Use the skill's exact model/effort table: Implementer gpt-6.1-sol medium, high for
complex cross-app/auth/migrations/tricky bugs; scribe gpt-6-luna medium, gpt-6.1-sol
medium for reconciling requirements/API contracts/architecture across multiple docs;
Tester gpt-6.1-sol high, medium for known checklists; UI/UX gpt-6.1-sol high,
gpt-6-astra high for especially demanding visual reviews. Respect explicit user overrides; surface
unsupported user-selected settings before substitution. Use fresh-context complete
briefs when overrides require them. Scribe records requested versus observed model/
effort honestly, including rationale, inherited/unknown settings and authorized fallback.
Assign disjoint allowed edit paths and serialize shared environments/dependencies.
Reconcile active owners and actual partial changes before reassignment. Scribe
bootstraps/reconciles durable original goal, criterion IDs, decisions/evidence,
owner/status/settings, histories and exact next actions under lead direction.
Saved state cannot disable compaction, guarantee no hallucination or prove completion.
Continue coordinating useful authorized implementation, diagnosis, fixes, docs and
verification until acceptance; a finished task or fixable failure is not a stop reason.
Do not alter GOAL.md during this unattended run: a necessary contract change requires
NEEDS_PERMISSION with the proposed change for user review. No elevated permissions
can be granted here. If permission is required, checkpoint through scribe and return
NEEDS_PERMISSION; never work around denial. Finish independent work before BLOCKED.
Honor .loop/STOP and cancellation. No additional runners or detached workers.
Freeze production before final Tester/UI checks. Verifiers may remain active while
checking. Route production failures to Implementer, then repeat affected final checks.
Wait for all required verification and scribe reconciliation before acceptance/handoff.
At final session handoff no worker may still be editing; confirm finished/stopped
status and checkpoint partial work and uncertain ownership when interruption prevents it.
Outstanding required work prevents COMPLETE. If an external session limit forces a
return while useful work remains, save state and return CONTINUE with progress evidence
and the exact next action. Return QUOTA_EXHAUSTED only on actual quota/allowance evidence;
never infer a balance. Follow the provided JSON schema. Include every acceptance ID
from GOAL.md once with PASS/FAIL/BLOCKED/NOT_RUN and evidence (working directory,
command or inspection, observed result). COMPLETE requires every criterion verified,
docs consistent, no blockers and empty next_action; otherwise preserve exact next_action.
docs_updated contains project-relative existing paths. Never include secrets or raw
sensitive output in state, final report or artifacts.
"""


def stop_child(child):
    try:
        os.killpg(child.pid, signal.SIGTERM)
    except ProcessLookupError:
        return
    deadline = time.monotonic() + 5
    while True:
        child.poll()
        try:
            os.killpg(child.pid, 0)
        except ProcessLookupError:
            break
        if time.monotonic() >= deadline:
            try:
                os.killpg(child.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            break
        time.sleep(0.05)
    child.wait(timeout=5)


def worker(command, project, text, stop, cancelled, timeout, owner):
    started = time.monotonic()
    child = subprocess.Popen(command, cwd=project, stdin=subprocess.PIPE, text=True, start_new_session=True)
    try:
        metadata = json.loads(owner.read_text(encoding="utf-8"))
        metadata["child_pid"] = child.pid
        owner.write_text(json.dumps(metadata), encoding="utf-8")
        try:
            child.stdin.write(text)
            child.stdin.close()
        except BrokenPipeError:
            pass
        while True:
            if cancelled() or stop.exists():
                return None, "CANCELLED"
            if time.monotonic() - started >= timeout:
                return None, "TIME_LIMIT"
            try:
                return child.wait(timeout=0.25), None
            except subprocess.TimeoutExpired:
                pass
    finally:
        stop_child(child)


def run(args, project, loop, paths, artifacts, owner, cancelled):
    goal, state, _ = paths
    criteria, contract = acceptance_ids(goal), digest(goal)
    stop = contained(project, loop / "STOP")
    preflight(args.codex, project)
    for _ in range(args.max_runs):
        if stop.exists() or cancelled():
            record(artifacts, "CANCELLED")
            return 130
        if digest(goal) != contract:
            record(artifacts, "CONTRACT_CHANGED")
            return 2
        previous = digest(state)
        run_id = uuid.uuid4().hex
        folder = artifacts / run_id
        folder.mkdir(mode=0o700)
        result_file = folder / "result.json"
        command = [
            args.codex, "--ask-for-approval", "never", "exec", "--sandbox", "workspace-write",
            "--ephemeral", "--cd", str(project), "--output-schema", str(SKILL / "references/run-result.schema.json"),
            "--output-last-message", str(result_file), "-",
        ]
        code, interrupted = worker(command, project, prompt(project), stop, cancelled, args.session_timeout, owner)
        if interrupted:
            record(artifacts, interrupted, run_id, code)
            return 130 if interrupted == "CANCELLED" else 2
        if code:
            record(artifacts, "CLI_ERROR", run_id, code)
            return 2
        if digest(goal) != contract:
            record(artifacts, "CONTRACT_CHANGED", run_id, code)
            return 2
        try:
            data = read_result(result_file, criteria, project)
        except (ValueError, OSError) as error:
            print(f"loop-engineer: {error}", file=sys.stderr)
            record(artifacts, "INVALID_REPORT", run_id, code)
            return 2
        status = data["status"]
        record(artifacts, status, run_id, code)
        if status != "CONTINUE":
            return 0 if status == "COMPLETE" else 130 if status == "CANCELLED" else 2
        if digest(state) == previous or not any(c["evidence"].strip() for c in data["acceptance"]):
            record(artifacts, "NO_PROGRESS", run_id, code)
            return 2
    record(artifacts, "RUN_LIMIT")
    return 2


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", type=Path, default=Path.cwd())
    parser.add_argument("--codex", default="codex", help="installed Codex executable (no shell command)")
    parser.add_argument("--max-runs", type=positive, default=10)
    parser.add_argument("--session-timeout", type=positive, default=3600, help="seconds per session")
    parser.add_argument("--stop", action="store_true", help="request cancellation via .loop/STOP")
    args = parser.parse_args(argv)
    artifacts = None
    cancelled = False

    def cancel(_signal, _frame):
        nonlocal cancelled
        cancelled = True

    try:
        if os.name != "posix":
            raise ValueError("Use interactive $loop-engineer continuation on non-POSIX systems")
        project = args.project.resolve(strict=True)
        loop, paths = state_files(project)
        stop = contained(project, loop / "STOP")
        if args.stop:
            stop.touch(mode=0o600, exist_ok=True)
            print("loop-engineer: stop requested; .loop/STOP remains until explicitly removed")
            return 0
        if stop.exists():
            print("loop-engineer: CANCELLED (.loop/STOP exists)")
            return 130
        with project_lock(loop) as owner:
            artifacts = contained(project, loop / "runner")
            artifacts.mkdir(mode=0o700, exist_ok=True)
            for sig in (signal.SIGINT, signal.SIGTERM):
                signal.signal(sig, cancel)
            return run(args, project, loop, paths, artifacts, owner, lambda: cancelled)
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        print(f"loop-engineer: stopped: {error}; reconcile .loop/STATE.md before resuming", file=sys.stderr)
        if artifacts:
            record(artifacts, "RUNNER_ERROR")
        return 2


if __name__ == "__main__":
    sys.exit(main())
