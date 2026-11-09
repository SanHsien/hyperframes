"""What the upstream checker must not be allowed to do.

Every test here names a way the check could go quiet without anybody deciding
to stop watching upstream.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "tools"))

import check_upstream_updates as checker

BASELINE = {
    "repo": "https://github.com/example/product.git",
    "branch": "main",
    "reviewed_through": "a" * 40,
    "reviewed_date": "2026-09-12",
}


def fake_gh(payload: object, returncode: int = 0):
    """Stand in for `gh`, so no test reaches the network."""

    def runner(args, **kwargs):
        assert args[0] == "gh"
        assert "--state" in args and args[args.index("--state") + 1] == "all"
        return subprocess.CompletedProcess(
            args, returncode, stdout=json.dumps(payload), stderr=""
        )

    return runner


def test_ticket_titles_survive_undecodable_bytes(monkeypatch):
    """Titles are written by strangers and the console is not always UTF-8."""
    captured = {}

    def runner(args, **kwargs):
        captured.update(kwargs)
        return subprocess.CompletedProcess(args, 0, stdout="[]", stderr="")

    monkeypatch.setattr(checker.subprocess, "run", runner)
    checker.collect_new_tickets(BASELINE, "pr")

    assert captured["errors"] == "replace"


def test_gh_failure_reports_unchecked_rather_than_empty(monkeypatch):
    """`None`, not `[]`: "not checked" must never render as "nothing to review"."""
    monkeypatch.setattr(checker.subprocess, "run", fake_gh([], returncode=1))
    assert checker.collect_new_tickets(BASELINE, "issue") is None


def test_gh_missing_executable_reports_none(monkeypatch):
    """When `gh` executable is not installed or raises OSError, return None instead of crashing."""
    def missing_runner(*args, **kwargs):
        raise FileNotFoundError("No such file or directory: 'gh'")

    monkeypatch.setattr(checker.subprocess, "run", missing_runner)
    assert checker.collect_new_tickets(BASELINE, "issue") is None


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        ("https://github.com/example/product.git", "example/product"),
        ("https://github.com/example/product", "example/product"),
        ("git@github.com:example/product.git", "example/product"),
        ("https://gitlab.com/example/product.git", None),
    ],
)
def test_upstream_slug(url, expected):
    assert checker.upstream_slug(url) == expected


def test_shipped_baseline_matches_the_documented_upstream():
    baseline = checker.load_baseline()
    assert checker.upstream_slug(baseline["repo"]) is not None


PINNED_OLD = "8a67eeb088e07e03bda786244184c272a1cac4a3"
PINNED_NEW = "e414818398f57deaaa5939633ee1cfc5e2998390"


def fake_pr_view(live: dict[int, dict | None], returncode: int = 0):
    """`gh pr view <n>` answering from ``live``; ``None`` means the PR does not exist."""

    def runner(args, **kwargs):
        assert args[:3] == ["gh", "pr", "view"]
        number = int(args[3])
        payload = live[number]
        if payload is None:
            return subprocess.CompletedProcess(
                args, 1, stdout="", stderr="Could not resolve to a PullRequest"
            )
        return subprocess.CompletedProcess(
            args, returncode, stdout=json.dumps(payload), stderr=""
        )

    return runner


def monitored(*entries: tuple[int, str, str]) -> dict:
    return {
        **BASELINE,
        "monitored": [
            {"item": f"pr#{number}", "head": head, "state": state}
            for number, head, state in entries
        ],
    }


def live_pr(head: str, state: str = "OPEN", draft: bool = False) -> dict:
    return {"headRefOid": head, "state": state, "isDraft": draft}


def test_a_force_pushed_head_is_reported_even_when_a_sibling_pin_also_moved(monkeypatch):
    """A pinned open PR whose head moved must show up beside another pin that merged."""
    monkeypatch.setattr(
        checker.subprocess,
        "run",
        fake_pr_view(
            {
                7269: live_pr(PINNED_NEW),
                7338: live_pr(PINNED_OLD, state="MERGED"),
            }
        ),
    )
    stale = checker.collect_stale_monitored(
        monitored((7269, PINNED_OLD, "open"), (7338, PINNED_OLD, "open"))
    )

    assert stale is not None
    assert [entry["item"] for entry in stale] == ["pr#7269", "pr#7338"]
    assert stale[0]["now"] == "e414818 / open"


def test_a_pin_that_still_matches_head_and_state_is_not_reported(monkeypatch):
    monkeypatch.setattr(
        checker.subprocess, "run", fake_pr_view({1: live_pr(PINNED_OLD), 2: live_pr(PINNED_OLD, draft=True)})
    )
    # A 7-character pin matches the full SHA; state is compared as well as head.
    stale = checker.collect_stale_monitored(
        monitored((1, PINNED_OLD[:7], "open"), (2, PINNED_OLD, "draft"))
    )

    assert stale == []


def test_an_empty_or_too_short_pin_counts_as_drift_not_as_a_match(monkeypatch):
    monkeypatch.setattr(
        checker.subprocess, "run", fake_pr_view({1: live_pr(PINNED_OLD), 2: live_pr(PINNED_OLD)})
    )
    stale = checker.collect_stale_monitored(monitored((1, "", "open"), (2, PINNED_OLD[:6], "open")))

    assert stale is not None
    assert [entry["item"] for entry in stale] == ["pr#1", "pr#2"]


def test_a_vanished_pull_request_is_reported_not_skipped(monkeypatch):
    monkeypatch.setattr(checker.subprocess, "run", fake_pr_view({1: None}))
    stale = checker.collect_stale_monitored(monitored((1, PINNED_OLD, "open")))

    assert stale is not None and stale[0]["now"] == "not found"


def test_monitored_gh_failure_reports_unchecked_rather_than_nothing_moved(monkeypatch):
    def runner(args, **kwargs):
        return subprocess.CompletedProcess(args, 1, stdout="", stderr="HTTP 502")

    monkeypatch.setattr(checker.subprocess, "run", runner)

    assert checker.collect_stale_monitored(monitored((1, PINNED_OLD, "open"))) is None
