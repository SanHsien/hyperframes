"""連結檢查器不得在 Windows 上放過 Linux/GitHub 會 404 的連結。"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import check_links


def _doc(tmp_path: Path, body: str) -> Path:
    (tmp_path / "Real.md").write_text("x", encoding="utf-8")
    doc = tmp_path / "doc.md"
    doc.write_text(body, encoding="utf-8")
    return doc


def test_link_with_wrong_case_is_reported(tmp_path: Path, monkeypatch) -> None:
    """Windows 檔案系統不分大小寫，但 GitHub 分；`real.md` 指不到 `Real.md`。"""
    monkeypatch.setattr(check_links, "ROOT", tmp_path)
    doc = _doc(tmp_path, "[a](real.md)")
    assert check_links.check_document(doc)


def test_link_with_exact_case_passes(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(check_links, "ROOT", tmp_path)
    doc = _doc(tmp_path, "[a](Real.md) [b](./Real.md#frag)")
    assert check_links.check_document(doc) == []


def test_link_title_is_not_part_of_the_path(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(check_links, "ROOT", tmp_path)
    doc = _doc(tmp_path, '[a](Real.md "a title") [b](Real.md \'t\')')
    assert check_links.check_document(doc) == []
