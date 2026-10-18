"""Local state and result checks for the optional continuation process."""

from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re


def timestamp():
    return datetime.now(timezone.utc).isoformat()


def contained(project, path):
    path = path.resolve()
    if not path.is_relative_to(project):
        raise ValueError(f"Path escapes target project: {path}")
    return path


def state_files(project):
    loop = contained(project, project / ".loop")
    paths = [contained(project, loop / name) for name in ("GOAL.md", "STATE.md", "LOG.md")]
    if any(not path.is_file() or not path.read_text(encoding="utf-8").strip() for path in paths):
        raise ValueError("Invoke $loop-engineer first to populate .loop/GOAL.md, STATE.md, and LOG.md")
    return loop, paths


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def acceptance_ids(goal):
    ids = re.findall(r"^\|\s*(AC-\d+)\s*\|", goal.read_text(encoding="utf-8"), re.MULTILINE)
    if not ids or len(ids) != len(set(ids)):
        raise ValueError("GOAL.md needs a nonempty acceptance table with unique AC-001 style IDs")
    return set(ids)


@contextmanager
def project_lock(loop):
    """An atomic directory also remains locked after an ungraceful runner death."""
    import os

    lock = loop / "runner.lock"
    try:
        lock.mkdir(mode=0o700)
    except FileExistsError:
        raise ValueError("Project locked: inspect .loop/runner.lock; never break a live lock") from None
    owner = lock / "owner.json"
    try:
        owner.write_text(json.dumps({"pid": os.getpid(), "started": timestamp()}), encoding="utf-8")
        yield owner
    finally:
        owner.unlink(missing_ok=True)
        lock.rmdir()


def record(artifacts, outcome, run_id=None, returncode=None):
    event = {"time": timestamp(), "outcome": outcome, "run_id": run_id, "returncode": returncode}
    history = contained(artifacts.parent.parent, artifacts / "history.jsonl")
    with history.open("a", encoding="utf-8") as stream:
        stream.write(json.dumps(event) + "\n")
    print(f"loop-engineer: {outcome}", flush=True)


def read_result(path, criteria, project):
    if not path.is_file() or path.stat().st_size > 1_000_000:
        raise ValueError("Missing or oversized final result; inspect saved state before resuming")
    data = json.loads(path.read_text(encoding="utf-8"))
    fields = {"status", "summary", "acceptance", "docs_updated", "blockers", "next_action"}
    if not isinstance(data, dict) or set(data) != fields:
        raise ValueError("Invalid final result fields")
    statuses = {"CONTINUE", "COMPLETE", "BLOCKED", "NEEDS_PERMISSION", "QUOTA_EXHAUSTED", "CANCELLED"}
    if not isinstance(data["status"], str) or data["status"] not in statuses:
        raise ValueError("Invalid final status")
    if any(not isinstance(data[k], str) for k in ("summary", "next_action")):
        raise ValueError("Invalid final status or text fields")
    if not data["summary"].strip():
        raise ValueError("Final result needs a useful summary")
    for key in ("docs_updated", "blockers"):
        if not isinstance(data[key], list) or any(not isinstance(x, str) or not x.strip() for x in data[key]):
            raise ValueError(f"Invalid {key}")
    for name in data["docs_updated"]:
        if Path(name).is_absolute() or not contained(project, project / name).is_file():
            raise ValueError("docs_updated must name existing files within the target project")
    checks = data["acceptance"]
    if not isinstance(checks, list):
        raise ValueError("Invalid acceptance evidence")
    for check in checks:
        if not isinstance(check, dict) or set(check) != {"id", "result", "evidence"}:
            raise ValueError("Invalid acceptance evidence fields")
        if any(not isinstance(check[k], str) for k in check):
            raise ValueError("Acceptance evidence must be text")
        if check["result"] not in {"PASS", "FAIL", "BLOCKED", "NOT_RUN"}:
            raise ValueError("Invalid acceptance result")
        if check["result"] == "PASS" and not check["evidence"].strip():
            raise ValueError("PASS requires evidence")
    if len(checks) != len(criteria) or {check["id"] for check in checks} != criteria:
        raise ValueError("Final result must cover every original acceptance ID exactly once")
    if data["status"] == "COMPLETE":
        if any(c["result"] != "PASS" for c in checks) or data["blockers"] or data["next_action"].strip():
            raise ValueError("COMPLETE requires all criteria passed, no blockers, and no next action")
    elif not data["next_action"].strip():
        raise ValueError("Unfinished work needs an exact next action")
    if data["status"] in {"BLOCKED", "NEEDS_PERMISSION", "QUOTA_EXHAUSTED"} and not data["blockers"]:
        raise ValueError("Blocked/limited results need the precise external dependency or action")
    return data
