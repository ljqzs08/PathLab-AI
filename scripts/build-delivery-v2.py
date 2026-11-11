"""Assemble delivery/PathLab-AI-参赛文件-v2 from already-built v2 materials.

Inputs (all inside D:\\竞赛, read-only):
  - PathLab-AI/PathLab AI.html            v2 offline site (built and regression-tested)
  - .cache/video-parts/full-v2.mp4        original demo video + 2:27 primer demo
  - .cache/pdfv2/intro.pdf, tech.pdf      2-page v2 addenda (rendered from docs/v2-addendum/*.html)
  - delivery/PathLab-AI-参赛文件/          previous packet (never modified)
Output: delivery/PathLab-AI-参赛文件-v2/ including a new upload ZIP. Nothing is uploaded or pushed.
Run from anywhere:  python scripts/build-delivery-v2.py
  (or in two steps: --copy-only, then --package-only)
"""
from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
OLD = ROOT / "delivery" / "PathLab-AI-参赛文件"
NEW = ROOT / "delivery" / "PathLab-AI-参赛文件-v2"
HTML = ROOT / "PathLab-AI" / "PathLab AI.html"
VIDEO = ROOT / ".cache" / "video-parts" / "full-v2.mp4"
ADD = ROOT / ".cache" / "pdfv2"
EXPECT = {
    "html": "1566c663f160ddc8399ce90c5171896882c575c5a0708c82dd62af88196cd167",
    "video": "597552cade0f8f3b80e89f98e2d920492b9f5462669936ef8b4e0da405f4223c",
}


def sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_sha(path: Path) -> str:
    value = sha(path)
    (path.parent / (path.name + ".sha256")).write_text(f"{value}  {path.name}\n", encoding="utf-8")
    return value


def merge(base: Path, addendum: Path, target: Path) -> int:
    writer = PdfWriter()
    for source in (base, addendum):
        for page in PdfReader(source).pages:
            writer.add_page(page)
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("wb") as handle:
        writer.write(handle)
    return len(PdfReader(target).pages)


def write_video_notes(video: Path, folders: tuple[Path, ...]) -> None:
    """Replace v1 video metadata/notes with facts measured from the v2 file."""
    probe = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height", "-of", "json", str(video)],
        check=True, capture_output=True, text=True).stdout)
    seconds = float(probe["format"]["duration"])
    duration = f"{int(seconds // 60):02d}:{seconds % 60:06.3f}"
    value = sha(video)
    meta = {"generatedAt": "2026-11-11", "fileName": video.name, "bytes": video.stat().st_size, "sha256": value,
            "durationSeconds": seconds, "duration": duration, "streams": probe["streams"],
            "segments": [{"from": "00:00", "to": "05:24", "content": "v1 原演示视频"},
                         {"from": "05:24", "to": duration[:5], "content": "v2 A* 零基础入门产品演示"}],
            "requirements": {"duration5To8Minutes": 300 <= seconds <= 480, "mp4Container": True,
                             "heightAtLeast1080": all(s.get("height", 1080) >= 1080 for s in probe["streams"]),
                             "aiCollaborationAtLeast2Minutes": "not_verified_from_metadata_manual_review_required"}}
    notes = (ROOT / "docs" / "v2-addendum" / "视频提交说明-v2.md").read_text(encoding="utf-8")
    notes = notes.replace("{DURATION}", duration).replace("{SECONDS}", f"{seconds:.3f}") \
                 .replace("{BYTES}", f"{video.stat().st_size:,}").replace("{SHA}", value)
    for folder in folders:
        (folder / "视频元数据.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        (folder / "视频提交说明.md").write_text(notes, encoding="utf-8")


def main() -> None:
    if not str(ROOT).upper().startswith(("D:", "/SESSIONS/")):
        sys.exit("Workspace must stay on the D drive.")
    for name, path in (("html", HTML), ("video", VIDEO)):
        if not path.exists():
            sys.exit(f"Missing input: {path}")
        if sha(path) != EXPECT[name]:
            sys.exit(f"Unexpected hash for {path}; rebuild/verify before packaging.")
    if NEW.exists():
        shutil.rmtree(NEW)
    full = NEW / "04-完整材料解压版"
    shutil.copytree(OLD / "04-完整材料解压版", full)

    intro_old = OLD / "02-表单第6项" / "PathLab-AI-作品介绍文档.pdf"
    tech_old = OLD / "03-技术文档备用" / "PathLab-AI-技术文档.pdf"
    intro = NEW / "02-表单第6项" / "PathLab-AI-作品介绍文档-v2.pdf"
    tech = NEW / "03-技术文档备用" / "PathLab-AI-技术文档-v2.pdf"
    pages = {"intro": merge(intro_old, ADD / "intro.pdf", intro), "tech": merge(tech_old, ADD / "tech.pdf", tech)}
    assert pages == {"intro": 17, "tech": 26}, pages
    assert pages["tech"] <= 30
    hashes = {"intro": write_sha(intro), "tech": write_sha(tech)}

    video_dir = NEW / "03-视频材料"
    video_dir.mkdir(parents=True)
    video = video_dir / "视频演示-v2.mp4"
    shutil.copy2(VIDEO, video)
    hashes["video"] = write_sha(video)

    # Replace superseded files inside the full packet; keep v1 copies under 历史v1 for comparison.
    history = full / "历史v1"
    history.mkdir()
    for folder, old_name, new_file in (
        ("01-作品介绍", "PathLab-AI-作品介绍文档.pdf", intro),
        ("02-技术文档", "PathLab-AI-技术文档.pdf", tech),
    ):
        old_path = full / folder / old_name
        shutil.move(str(old_path), history / old_name)
        (full / folder / (old_name + ".sha256")).unlink(missing_ok=True)
        shutil.copy2(new_file, full / folder / new_file.name)
        write_sha(full / folder / new_file.name)
    shutil.move(str(full / "03-离线体验" / "PathLab AI.html"), history / "PathLab AI-v1.html")
    shutil.copy2(HTML, full / "03-离线体验" / "PathLab AI.html")
    old_video = full / "09-演示视频" / "视频演示.mp4"
    old_video.unlink()  # identical bytes remain in delivery/PathLab-AI-参赛文件/03-视频材料
    (full / "09-演示视频" / "视频演示.mp4.sha256").unlink(missing_ok=True)
    shutil.copy2(video, full / "09-演示视频" / video.name)
    write_sha(full / "09-演示视频" / video.name)
    write_video_notes(video, (video_dir, full / "09-演示视频"))
    guide = full / "03-离线体验" / "使用说明.md"
    guide.write_text(guide.read_text(encoding="utf-8").replace(
        "建议：", "v2：首屏点击“第一次学？先上 6 分钟 A* 入门”，零基础可先完成入门再进关卡。\n\n建议：", 1), encoding="utf-8")

    update = full / "10-v2更新说明"
    update.mkdir()
    shutil.copy2(ROOT / "docs" / "verification-astar-primer.md", update / "v2验证与改进记录.md")
    shutil.copytree(ROOT / "docs" / "assets" / "astar-primer", update / "截图")
    shutil.copy2(ROOT / "prompts" / "sessions" / "2026-11-10-reviewer-feedback-astar-primer.md", update / "本轮Prompt记录.md")
    source = update / "v2源码增量"
    for relative in (
        "src/domain/learning/astar-primer.ts", "src/components/AstarPrimer.tsx", "src/components/PathLabShell.tsx",
        "src/components/LearningWorkbench.tsx", "src/app/learning.css", "tests/astar-primer.test.mjs", "tests/browser/primer.spec.ts",
    ):
        target = source / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / "PathLab-AI" / relative, target)
    try:
        bundle = full / "04-源码与演进" / "PathLab-AI-full-history-v2.0.0.bundle"
        subprocess.run(["git", "-C", str(ROOT), "bundle", "create", str(bundle), "main"], check=True, capture_output=True)
        head = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "HEAD"], check=True, capture_output=True, text=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        head = "（本机未找到 git，v2 完整历史 bundle 未生成；源码增量见 10-v2更新说明/v2源码增量）"

    for path in (full / "00-评审入口.md", NEW / "00-提交说明.md"):
        path.write_text((ROOT / "docs" / "v2-addendum" / "评审入口-v2.md").read_text(encoding="utf-8").replace("{HEAD}", head), encoding="utf-8")
    restore = full / "04-源码与演进" / "恢复完整历史.md"
    restore.write_text(restore.read_text(encoding="utf-8").rstrip() + "\n"
                       + (ROOT / "docs" / "v2-addendum" / "恢复完整历史-v2.md").read_text(encoding="utf-8").replace("{HEAD}", head), encoding="utf-8")
    (full / "00-评审入口.html").unlink(missing_ok=True)
    for name in ("表单填写草稿.txt", "GitHub作品仓库地址.txt"):
        shutil.copy2(ROOT / "docs" / "v2-addendum" / name, NEW / name)
    shutil.copy2(NEW / "GitHub作品仓库地址.txt", full / "GitHub作品仓库地址.txt")

    files = sorted(p for p in full.rglob("*") if p.is_file() and p.name != "manifest.json")
    manifest = {"format": "pathlab-submission-v2", "date": "2026-11-11", "gitHead": head,
                "files": [{"path": p.relative_to(full).as_posix(), "bytes": p.stat().st_size, "sha256": sha(p)} for p in files]}
    (full / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    if "--copy-only" not in sys.argv:  # sandbox runs cap at ~3 min: run --copy-only, then --package-only
        package(pages, hashes, head)


def package(pages: dict, hashes: dict, head: str) -> None:
    """Zip 04-完整材料解压版 into 01-上传网盘 and write the verification report (re-runnable via --package-only)."""
    full = NEW / "04-完整材料解压版"
    upload = NEW / "01-上传网盘"
    upload.mkdir(exist_ok=True)
    archive = upload / "PathLab-AI-完整作品材料-v2.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED, allowZip64=True) as bundle_zip:
        for path in sorted(full.rglob("*")):
            if path.is_file():
                method = zipfile.ZIP_STORED if path.suffix.lower() in {".mp4", ".zip", ".png", ".jpg", ".pdf", ".bundle"} else zipfile.ZIP_DEFLATED
                bundle_zip.write(path, path.relative_to(full).as_posix(), compress_type=method)
    with zipfile.ZipFile(archive) as check:
        assert check.testzip() is None
        entries = len(check.namelist())
    hashes["zip"] = write_sha(archive)

    report = {"executor": "build-delivery-v2.py", "pages": pages, "zipEntries": entries, "zipBytes": archive.stat().st_size,
              "sha256": hashes, "htmlSha256": EXPECT["html"], "gitHead": head, "uploaded": False, "githubPushed": False}
    (NEW / "packet-build-verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


def package_only() -> None:
    """Resume after the copy stage finished but ZIP creation was interrupted."""
    read = lambda p: p.read_text(encoding="utf-8").split()[0]
    intro = NEW / "02-表单第6项" / "PathLab-AI-作品介绍文档-v2.pdf"
    tech = NEW / "03-技术文档备用" / "PathLab-AI-技术文档-v2.pdf"
    video = NEW / "03-视频材料" / "视频演示-v2.mp4"
    pages = {"intro": len(PdfReader(intro).pages), "tech": len(PdfReader(tech).pages)}
    assert pages == {"intro": 17, "tech": 26}, pages
    hashes = {k: read(p.parent / (p.name + ".sha256")) for k, p in (("intro", intro), ("tech", tech), ("video", video))}
    head = json.loads((NEW / "04-完整材料解压版" / "manifest.json").read_text(encoding="utf-8"))["gitHead"]
    package(pages, hashes, head)


if __name__ == "__main__":
    package_only() if "--package-only" in sys.argv else main()
