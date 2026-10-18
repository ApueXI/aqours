#!/usr/bin/env python3
"""Exercise runner behavior with disposable projects and a simulated CLI; no model calls."""

import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
import unittest

RUNNER = Path(__file__).resolve().with_name("continue_loop.py")
FAKE_CLI = r'''#!/usr/bin/env python3
import json
import os
from pathlib import Path
import subprocess
import sys
import time

root = Path.cwd()
plan = json.loads((root / "scenario.json").read_text())
if "--help" in sys.argv:
    print("" if plan.get("unsupported") else "--ask-for-approval --sandbox --ephemeral --cd --output-schema --output-last-message")
    sys.exit(0)
assert sys.argv[1:7] == ["--ask-for-approval", "never", "exec", "--sandbox", "workspace-write", "--ephemeral"]
assert not any("bypass" in arg or "ignore" in arg for arg in sys.argv)
assert "--add-dir" not in sys.argv and "danger-full-access" not in sys.argv
assert Path(sys.argv[sys.argv.index("--cd") + 1]) == root
assert sys.argv[-1] == "-"
prompt = sys.stdin.read()
assert "$loop-engineer" in prompt and ".loop/GOAL.md" in prompt
counter = root / "count.txt"
index = int(counter.read_text()) if counter.exists() else 0
counter.write_text(str(index + 1))
item = plan["steps"][min(index, len(plan["steps"]) - 1)]
state = root / ".loop/STATE.md"
if item.get("require_state"):
    assert item["require_state"] in state.read_text()
if item.get("checkpoint", True):
    state.write_text(state.read_text() + "\ncheckpoint step " + str(index + 1))
if item.get("change_goal"):
    goal = root / ".loop/GOAL.md"
    goal.write_text(goal.read_text() + "\nUnattended scope edit\n")
if item.get("delay"):
    if item.get("descendant"):
        code = ("import signal,time\nfrom pathlib import Path\n"
                "signal.signal(signal.SIGTERM, signal.SIG_IGN)\n"
                "Path('descendant-ready').touch()\n"
                "while True:\n Path('heartbeat').write_text(str(time.time_ns()))\n time.sleep(0.02)\n")
        subprocess.Popen([sys.executable, "-B", "-c", code], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        while not (root / "descendant-ready").exists():
            time.sleep(0.02)
        (root / "worker-group").write_text(str(os.getpgrp()))
    (root / "worker-ready").touch()
    time.sleep(item["delay"])
if item.get("exit"):
    print("Simulated CLI failure; no automatic retry permitted", file=sys.stderr)
    sys.exit(item["exit"])
status = item.get("status", "COMPLETE")
report = {
    "status": status, "summary": "Implemented and verified the next required behavior",
    "acceptance": [{"id": key, "result": "PASS", "evidence": "Fixture behavioral check passed"}
                   for key in ("AC-001", "AC-002")],
    "docs_updated": [], "blockers": [],
    "next_action": "" if status == "COMPLETE" else "Run the remaining integration check in project root"
}
if status in ("BLOCKED", "NEEDS_PERMISSION", "QUOTA_EXHAUSTED"):
    report["blockers"] = ["Operator must resolve the simulated external dependency"]
report.update(item.get("report", {}))
output = Path(sys.argv[sys.argv.index("--output-last-message") + 1])
if not item.get("no_report"):
    output.write_text(item.get("raw_report", json.dumps(report)))
'''


class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix=".loop-fixture-", dir=Path.cwd())
        self.addCleanup(self.temp.cleanup)
        self.project = Path(self.temp.name) / "project with spaces"
        self.project.mkdir()
        self.loop = self.project / ".loop"
        self.loop.mkdir()
        (self.loop / "GOAL.md").write_text(
            "# Goal\n| ID | Observable behavior | Verification |\n"
            "| AC-001 | Real workflow | behavioral check |\n"
            "| AC-002 | Accurate docs | example check |\n", encoding="utf-8"
        )
        (self.loop / "STATE.md").write_text("Status: IN_PROGRESS\nNext: implement workflow", encoding="utf-8")
        (self.loop / "LOG.md").write_text("# Prior iterations\n", encoding="utf-8")
        self.fake = self.project / "simulated codex"
        self.fake.write_text(FAKE_CLI, encoding="utf-8")
        self.fake.chmod(0o700)

    def configure(self, steps, **options):
        (self.project / "scenario.json").write_text(json.dumps({"steps": steps, **options}), encoding="utf-8")

    def command(self, *extra):
        return [sys.executable, "-B", str(RUNNER), "--project", str(self.project), "--codex", str(self.fake), *extra]

    def invoke(self, *extra):
        return subprocess.run(self.command(*extra), cwd=self.project, capture_output=True, text=True, timeout=12)

    def count(self):
        file = self.project / "count.txt"
        return int(file.read_text()) if file.exists() else 0

    def outcomes(self):
        return [json.loads(line)["outcome"] for line in (self.loop / "runner/history.jsonl").read_text().splitlines()]

    def test_continues_multiple_unfinished_tasks_then_stops(self):
        self.configure([{"status": "CONTINUE"}, {"status": "CONTINUE"}, {"status": "COMPLETE"}])
        result = self.invoke()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.count(), 3)
        self.assertEqual(self.outcomes(), ["CONTINUE", "CONTINUE", "COMPLETE"])
        self.assertFalse((self.loop / "runner.lock").exists())

    def test_already_complete_stops_after_reconciliation(self):
        (self.loop / "STATE.md").write_text("Status: COMPLETE\nReconcile evidence before claiming completion")
        self.configure([{"status": "COMPLETE"}])
        self.assertEqual(self.invoke().returncode, 0)
        self.assertEqual(self.count(), 1)

    def test_fixable_failure_can_make_progress_then_complete(self):
        failed = [{"id": "AC-001", "result": "FAIL", "evidence": "Actual assertion failure diagnosed"},
                  {"id": "AC-002", "result": "NOT_RUN", "evidence": "Docs pending"}]
        self.configure([{"status": "CONTINUE", "report": {"acceptance": failed}}, {"status": "COMPLETE"}])
        self.assertEqual(self.invoke().returncode, 0)
        self.assertEqual(self.count(), 2)

    def test_cli_failure_never_retries_even_with_checkpoint(self):
        self.configure([{"exit": 1}, {"status": "COMPLETE"}])
        self.assertEqual(self.invoke().returncode, 2)
        self.assertEqual(self.count(), 1)
        self.assertEqual(self.outcomes(), ["CLI_ERROR"])

    def test_external_stop_statuses_do_not_continue(self):
        for status, code in [("BLOCKED", 2), ("NEEDS_PERMISSION", 2), ("QUOTA_EXHAUSTED", 2), ("CANCELLED", 130)]:
            with self.subTest(status=status):
                self.configure([{"status": status}, {"status": "COMPLETE"}])
                previous = self.count()
                self.assertEqual(self.invoke().returncode, code)
                self.assertEqual(self.count(), previous + 1)
                (self.project / "count.txt").unlink()

    def test_unavailable_or_failed_checks_cannot_complete(self):
        for result in ("FAIL", "NOT_RUN", "BLOCKED"):
            with self.subTest(result=result):
                checks = [{"id": "AC-001", "result": result, "evidence": "Check unavailable or failed"},
                          {"id": "AC-002", "result": "PASS", "evidence": "Docs inspected"}]
                self.configure([{"report": {"acceptance": checks}}])
                self.assertEqual(self.invoke().returncode, 2)
                self.assertEqual(self.outcomes()[-1], "INVALID_REPORT")

    def test_missing_or_duplicate_criteria_cannot_complete(self):
        for ids in [("AC-001",), ("AC-001", "AC-001"), ("AC-001", "AC-003")]:
            with self.subTest(ids=ids):
                checks = [{"id": key, "result": "PASS", "evidence": "Check passed"} for key in ids]
                self.configure([{"report": {"acceptance": checks}}])
                self.assertEqual(self.invoke().returncode, 2)
                self.assertEqual(self.outcomes()[-1], "INVALID_REPORT")

    def test_blank_pass_evidence_cannot_complete(self):
        checks = [{"id": key, "result": "PASS", "evidence": ""} for key in ("AC-001", "AC-002")]
        self.configure([{"report": {"acceptance": checks}}])
        self.assertEqual(self.invoke().returncode, 2)
        self.assertEqual(self.outcomes()[-1], "INVALID_REPORT")

    def test_pending_action_or_blocker_cannot_complete(self):
        for fields in ({"next_action": "Still deploy required feature"}, {"blockers": ["Missing credential"]}):
            with self.subTest(fields=fields):
                self.configure([{"report": fields}])
                self.assertEqual(self.invoke().returncode, 2)
                self.assertEqual(self.outcomes()[-1], "INVALID_REPORT")

    def test_scope_edit_stops_for_review(self):
        self.configure([{"status": "CONTINUE", "change_goal": True}, {"status": "COMPLETE"}])
        self.assertEqual(self.invoke().returncode, 2)
        self.assertEqual(self.count(), 1)
        self.assertEqual(self.outcomes()[-1], "CONTRACT_CHANGED")

    def test_unchanged_state_stops(self):
        self.configure([{"status": "CONTINUE", "checkpoint": False}, {"status": "COMPLETE"}])
        self.assertEqual(self.invoke().returncode, 2)
        self.assertEqual(self.count(), 1)
        self.assertEqual(self.outcomes()[-1], "NO_PROGRESS")

    def test_interrupted_run_resumes_without_resetting_checkpoint(self):
        self.configure([{"status": "CONTINUE"}, {"status": "COMPLETE", "require_state": "checkpoint step 1"}])
        goal = (self.loop / "GOAL.md").read_bytes()
        self.assertEqual(self.invoke("--max-runs", "1").returncode, 2)
        self.assertEqual(self.outcomes()[-1], "RUN_LIMIT")
        self.assertEqual(self.invoke().returncode, 0)
        self.assertEqual(self.count(), 2)
        self.assertEqual((self.loop / "GOAL.md").read_bytes(), goal)
        self.assertIn("checkpoint step 1", (self.loop / "STATE.md").read_text())

    def test_malformed_missing_and_wrong_type_output_stop(self):
        for step in ({"raw_report": "not json"}, {"no_report": True}, {"report": {"status": []}}):
            with self.subTest(step=step):
                self.configure([step])
                self.assertEqual(self.invoke().returncode, 2)
                self.assertEqual(self.outcomes()[-1], "INVALID_REPORT")

    def test_unsupported_cli_stops_before_worker(self):
        self.configure([{}], unsupported=True)
        self.assertEqual(self.invoke().returncode, 2)
        self.assertEqual(self.count(), 0)

    def test_missing_state_refuses_worker(self):
        (self.loop / "LOG.md").unlink()
        self.configure([{}])
        self.assertEqual(self.invoke().returncode, 2)
        self.assertEqual(self.count(), 0)

    def test_stale_or_live_lock_never_auto_removed(self):
        lock = self.loop / "runner.lock"
        lock.mkdir()
        (lock / "owner.json").write_text('{"pid": 99999999}')
        self.configure([{}])
        self.assertEqual(self.invoke().returncode, 2)
        self.assertTrue(lock.exists())
        self.assertEqual(self.count(), 0)

    def test_stop_file_prevents_launch(self):
        self.configure([{}])
        self.assertEqual(self.invoke("--stop").returncode, 0)
        self.assertEqual(self.invoke().returncode, 130)
        self.assertEqual(self.count(), 0)

    def wait_ready(self, process):
        deadline = time.monotonic() + 5
        while not (self.project / "worker-ready").exists() and time.monotonic() < deadline:
            if process.poll() is not None:
                self.fail("Fixture runner exited before ready")
            time.sleep(0.02)
        self.assertTrue((self.project / "worker-ready").exists())

    def launch(self):
        process = subprocess.Popen(self.command(), cwd=self.project, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        def cleanup():
            if process.poll() is None:
                process.terminate()
            process.communicate(timeout=8)

        self.addCleanup(cleanup)
        self.wait_ready(process)
        return process

    def test_running_lock_and_stop_command(self):
        self.configure([{"delay": 20}])
        process = self.launch()
        second = self.invoke()
        self.assertEqual(second.returncode, 2)
        self.assertEqual(self.count(), 1)
        self.assertEqual(self.invoke("--stop").returncode, 0)
        process.communicate(timeout=8)
        self.assertEqual(process.returncode, 130)
        self.assertFalse((self.loop / "runner.lock").exists())

    def test_user_signal_stops_worker(self):
        self.configure([{"delay": 20}])
        process = self.launch()
        process.send_signal(signal.SIGINT)
        process.communicate(timeout=8)
        self.assertEqual(process.returncode, 130)
        self.assertEqual(self.outcomes()[-1], "CANCELLED")

    def test_descendant_cannot_keep_editing_after_lock_release(self):
        self.configure([{"delay": 20, "descendant": True}])
        process = self.launch()
        group = int((self.project / "worker-group").read_text())

        def cleanup_group():
            try:
                os.killpg(group, signal.SIGKILL)
            except ProcessLookupError:
                pass

        self.addCleanup(cleanup_group)
        self.assertEqual(self.invoke("--stop").returncode, 0)
        process.communicate(timeout=8)
        self.assertEqual(process.returncode, 130)
        self.assertFalse((self.loop / "runner.lock").exists())
        heartbeat = (self.project / "heartbeat").read_bytes()
        time.sleep(0.15)
        self.assertEqual((self.project / "heartbeat").read_bytes(), heartbeat)

    def test_time_limit_stops_without_retry(self):
        self.configure([{"delay": 20}, {"status": "COMPLETE"}])
        self.assertEqual(self.invoke("--session-timeout", "1").returncode, 2)
        self.assertEqual(self.count(), 1)
        self.assertEqual(self.outcomes()[-1], "TIME_LIMIT")

    def test_documentation_paths_must_exist_inside_project(self):
        self.configure([{"report": {"docs_updated": ["../outside.md"]}}])
        self.assertEqual(self.invoke().returncode, 2)
        self.assertEqual(self.outcomes()[-1], "INVALID_REPORT")

    def test_loop_symlink_cannot_escape_project(self):
        outside = Path(self.temp.name) / "external-state"
        self.loop.rename(outside)
        self.loop.symlink_to(outside, target_is_directory=True)
        self.configure([{}])
        self.assertEqual(self.invoke().returncode, 2)
        self.assertEqual(self.count(), 0)

    def test_invalid_contract_and_zero_bound_do_not_launch(self):
        self.configure([{}])
        self.assertEqual(self.invoke("--max-runs", "0").returncode, 2)
        (self.loop / "GOAL.md").write_text("# Goal without acceptance criteria")
        self.assertEqual(self.invoke().returncode, 2)
        self.assertEqual(self.count(), 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
