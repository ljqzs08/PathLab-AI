"""Assemble delivery/PathLab-AI-参赛文件-v3 from the committed v3 tree and already-built media.

Fixes the three v2 packet defects found in E033:
  1. 源码/ is exported from git HEAD with `git archive` (not inherited from an older packet);
  2. the history bundle is created from the real HEAD and re-cloned to prove it restores that HEAD;
  3. every byte count and SHA256 is computed in the last step, after all files are final.

Inputs (all inside D:\\竞赛, read-only):
  - git HEAD (must be clean for tracked files under PathLab-AI/ and docs/)
  - .cache/video-v3/full-v3.mp4         v1 demo (unchanged bytes re-muxed) + 1:14 v3 primer demo
  - .cache/pdfv3/intro.pdf, tech.pdf    2-page v3 addenda rendered from docs/v3-addendum/*.html
  - delivery/PathLab-AI-参赛文件-v2/      previous packet: v2 PDFs and unchanged evidence folders (never modified)
Output: delivery/PathLab-AI-参赛文件-v3/. Nothing is uploaded or pushed.

The sandbox caps one command at ~3 minutes, so run in two steps:
  python scripts/build-delivery-v3.py prepare
  python scripts/build-delivery-v3.py package
"""
from __future__ import annotations

import hashlib
import io
import json
import shutil
import subprocess
import sys
import tarfile
import zipfile
from pathlib import Path

from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parents[1]
V2 = ROOT / "delivery" / "PathLab-AI-参赛文件-v2"
NEW = ROOT / "delivery" / "PathLab-AI-参赛文件-v3"
FULL = NEW / "04-完整材料解压版"
VIDEO = ROOT / ".cache" / "video-v3" / "full-v3.mp4"
ADD = ROOT / ".cache" / "pdfv3"
REPO = "https://github.com/ljqzs08/PathLab-AI"
STORED = {".mp4", ".zip", ".png", ".jpg", ".pdf", ".bundle"}


def sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(ROOT), *args], check=True, capture_output=True, text=True).stdout.strip()


def merge(parts: list[Path], target: Path) -> int:
    writer = PdfWriter()
    for part in parts:
        for page in PdfReader(part).pages:
            writer.add_page(page)
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("wb") as handle:
        writer.write(handle)
    return len(PdfReader(target).pages)


def probe(video: Path) -> dict:
    data = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height", "-of", "json", str(video)],
        check=True, capture_output=True, text=True).stdout)
    seconds = float(data["format"]["duration"])
    return {"seconds": seconds, "duration": f"{int(seconds // 60):02d}:{seconds % 60:06.3f}", "streams": data["streams"]}


def prepare() -> None:
    if not str(ROOT).upper().startswith(("D:", "/SESSIONS/")):
        sys.exit("Workspace must stay on the D drive.")
    dirty = git("status", "--porcelain", "--untracked-files=no")
    if dirty:
        sys.exit("Tracked files have uncommitted changes; commit first so 源码/ equals HEAD:\n" + dirty)
    for path in (VIDEO, ADD / "intro.pdf", ADD / "tech.pdf"):
        if not path.exists():
            sys.exit(f"Missing input: {path}")
    head = git("rev-parse", "HEAD")
    count = int(git("rev-list", "--count", "HEAD"))
    html = ROOT / "PathLab-AI" / "PathLab AI.html"
    committed_html = subprocess.run(["git", "-C", str(ROOT), "show", "HEAD:PathLab-AI/PathLab AI.html"], check=True, capture_output=True).stdout
    if hashlib.sha256(committed_html).hexdigest() != sha(html):
        sys.exit("Working HTML differs from HEAD; rebuild/commit before packaging.")

    if NEW.exists():
        shutil.rmtree(NEW)
    FULL.mkdir(parents=True)

    # PDFs: v2 editions (v1 body + v2 addendum) + the new v3 addendum.
    intro = NEW / "02-表单第6项" / "PathLab-AI-作品介绍文档-v3.pdf"
    tech = NEW / "03-技术文档备用" / "PathLab-AI-技术文档-v3.pdf"
    pages = {"intro": merge([V2 / "02-表单第6项" / "PathLab-AI-作品介绍文档-v2.pdf", ADD / "intro.pdf"], intro),
             "tech": merge([V2 / "03-技术文档备用" / "PathLab-AI-技术文档-v2.pdf", ADD / "tech.pdf"], tech)}
    assert pages == {"intro": 19, "tech": 28}, pages
    for folder, file in (("01-作品介绍", intro), ("02-技术文档", tech)):
        (FULL / folder).mkdir()
        shutil.copy2(file, FULL / folder / file.name)

    # Offline site straight from HEAD.
    (FULL / "03-离线体验").mkdir()
    (FULL / "03-离线体验" / "PathLab AI.html").write_bytes(committed_html)
    (FULL / "03-离线体验" / "使用说明.md").write_text(
        "# 离线体验\n\n双击同目录的 `PathLab AI.html`（建议用 Edge 或 Chrome），无需联网、localhost、Node 或模型密钥。\n\n"
        "第一次学：点首屏“第一次学？先测再学，10 分钟 A* 入门”。顺序为学前测 → 5 章入门（第 6 章可看 A* 的思考过程逐条浮现）→ 学后测与掌握度报告。报告可展开“导出这份记录”复制文字。\n\n"
        "已经会了：直接进入任务工作台，L01 开始预测 → 选择候选 → 显式提交 → 单步或播放 → 单因素实验 → 引用事件解释。\n\n"
        "本机存档可能受路径或浏览器影响，转移前请先导出 JSON。入门的前后测记录只保存在当前页面，刷新即清空。\n", encoding="utf-8")

    # Source and history from the real HEAD.
    source_dir = FULL / "04-源码与演进"
    tree = source_dir / "源码"
    tree.mkdir(parents=True)
    archive = subprocess.run(["git", "-C", str(ROOT), "archive", "--format=tar", "HEAD"], check=True, capture_output=True).stdout
    with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
        tar.extractall(tree, filter="data")
    tracked = git("ls-files").splitlines()
    exported = sorted(p.relative_to(tree).as_posix() for p in tree.rglob("*") if p.is_file())
    assert exported == sorted(tracked), "git archive export differs from git ls-files"
    bundle = source_dir / f"PathLab-AI-full-history-v3.0.0-{head[:7]}.bundle"
    git("bundle", "create", str(bundle), "HEAD", "main")
    check = ROOT / ".cache" / "bundle-check-v3"
    shutil.rmtree(check, ignore_errors=True)
    subprocess.run(["git", "clone", "-q", "--branch", "main", str(bundle), str(check)], check=True, capture_output=True)
    restored = subprocess.run(["git", "-C", str(check), "rev-parse", "HEAD"], check=True, capture_output=True, text=True).stdout.strip()
    restored_count = int(subprocess.run(["git", "-C", str(check), "rev-list", "--count", "HEAD"], check=True, capture_output=True, text=True).stdout)
    shutil.rmtree(check)
    assert (restored, restored_count) == (head, count), (restored, restored_count)
    (source_dir / "git-log.txt").write_text(git("log", "--format=%h %ad %s", "--date=short") + "\n", encoding="utf-8")
    commits = [dict(zip(("hash", "date", "subject"), line.split("\x1f"))) for line in git("log", "--format=%H\x1f%aI\x1f%s").splitlines()]
    (source_dir / "git-commits.json").write_text(json.dumps(commits, ensure_ascii=False, indent=2), encoding="utf-8")
    (source_dir / "恢复完整历史.md").write_text(f"""# 源码与完整 Git 历史（v3.0.0）

`源码/` 由 `git archive HEAD` 直接导出，与提交 `{head}` 的跟踪文件逐一一致（{len(tracked)} 个文件）。

`{bundle.name}` 含 `main` 分支到该提交为止的全部 {count} 个提交。打包脚本已把它重新克隆一次，核对 HEAD 与提交数一致。

在一个尚不存在的 D 盘目录恢复：

```powershell
$bundle = (Resolve-Path -LiteralPath '.\\{bundle.name}').Path
$target = 'D:\\竞赛\\.cache\\review-restored-v3'
if (Test-Path -LiteralPath $target) {{ throw '请选择尚不存在的目标目录' }}
git clone --branch main $bundle $target
git -C $target rev-parse HEAD      # 预期 {head}
git -C $target rev-list --count HEAD  # 预期 {count}
```

之后按 `源码/README.md` 的「10 分钟源码复现」安装依赖并运行。v3 尚未推送 GitHub；公开仓库 {REPO} 目前停在 v2.0.0（`dc3f334`），本 bundle 是它的直接后继，不改写任何已公开的历史。
""", encoding="utf-8")

    # Unchanged evidence folders, byte-for-byte from the v2 packet.
    for name in ("05-Prompt证据", "06-实际截图", "07-文档源稿与来源", "08-规则与提交说明"):
        shutil.copytree(V2 / "04-完整材料解压版" / name, FULL / name)
    history = FULL / "历史版本"
    history.mkdir()
    shutil.copy2(V2 / "04-完整材料解压版" / "历史v1" / "PathLab AI-v1.html", history / "PathLab AI-v1.html")
    shutil.copy2(V2 / "04-完整材料解压版" / "03-离线体验" / "PathLab AI.html", history / "PathLab AI-v2.html")

    # Video.
    video_dir = NEW / "03-视频材料"
    video_dir.mkdir()
    video = video_dir / "视频演示-v3.mp4"
    shutil.copy2(VIDEO, video)
    (FULL / "09-演示视频").mkdir()
    shutil.copy2(video, FULL / "09-演示视频" / video.name)

    # v3 notes.
    notes = FULL / "10-v3更新说明"
    notes.mkdir()
    shutil.copy2(ROOT / "docs" / "verification-v3-mastery.md", notes / "v3验证记录.md")
    shutil.copytree(ROOT / "docs" / "assets" / "astar-primer-v3", notes / "截图")
    shutil.copy2(ROOT / "prompts" / "sessions" / "2026-11-11-v3-mastery.md", notes / "本轮Prompt记录.md")
    shutil.copy2(ROOT / "docs" / "review-upgrade-plan-20261111.md", notes / "E033规则核对与升级方案.md")

    state = {"head": head, "commits": count, "trackedFiles": len(tracked), "pages": pages, "bundle": bundle.name}
    (ROOT / ".cache" / "delivery-v3-state.json").write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(state, ensure_ascii=False, indent=2))


def write_texts(state: dict, video_facts: dict) -> None:
    head, count = state["head"], state["commits"]
    entry = f"""# PathLab AI v3.0.0：参赛材料（2026-11-11）

## 这一版改了什么

v3 的目标是让“学会了没有”看得见。入门从 6 章扩为 7 章：

- **学前测 → 5 章入门 → 学后测**：前后两套平行卷，考同样 5 个知识点、换了数字。选格子的题不给 f，要自己算 g+h。前测不公布答案。
- **A* 的思考过程逐条浮现**：每轮揭晓时依次显示“比 f → f 打平比 h → 都平比加入先后”，被淘汰的格子在地图上同步变灰。
- **按出错原因诊断**：每次猜错都归到被跳过的那条规则（只看 h、只看 g、f 打平没比 h……），并提示回看第几章。
- **掌握度报告**：给出前测、后测、逐轮预测三项分数和逐知识点对比，薄弱项可以一键回看，还能导出文字记录。

所有正确答案都由站内引擎的 `comparePriority` 算出，没有手写答案。

## 建议评审顺序

1. 打开 `03-离线体验/PathLab AI.html`（双击即可，无需联网），点首屏“第一次学？先测再学，10 分钟 A* 入门”。
2. 播放 `09-演示视频/视频演示-v3.mp4`：总长 {video_facts['duration'][:5]}，前 05:24 为原演示，之后约 1:14 为 v3 入门演示。
3. 阅读 `01-作品介绍/PathLab-AI-作品介绍文档-v3.pdf`（{state['pages']['intro']} 页，最后 2 页为 v3 增补）。
4. 阅读 `02-技术文档/PathLab-AI-技术文档-v3.pdf`（{state['pages']['tech']} 页，最后 2 页为 v3 增补）。
5. 查看 `10-v3更新说明/`：验证记录、截图、本轮 Prompt 记录。
6. 源码与完整演进见 `04-源码与演进/`：`源码/` 与提交 `{head[:7]}` 完全一致，bundle 含全部 {count} 个提交。

## 验证（AI 执行）

- 单元测试：Node 165/165。
- 离线 HTML 回归：四种视口共 284/284，各状态 axe 检查 0 违规。
- 交付包：源码导出与 `git ls-files` 逐一比对；bundle 重新克隆后 HEAD 与提交数一致；ZIP 全条目 CRC 校验；manifest 与解压目录哈希一致。

## 提交前还需本人完成

- **真人新手测试**：找一位没学过算法的同学，从学前测开始做到掌握度报告，全程不讲解；完成后展开报告里的“导出这份记录”并保存。
- **核对视频**：确认原演示部分包含至少 2 分钟真实的 AI 协同过程。v3 演示段是产品演示，不计入这 2 分钟。
- **上传与提交**：上传网盘和视频平台、填写表单、正式提交，都需要本人操作。
- **GitHub**：v3 尚未推送。公开仓库 {REPO} 目前是 v2.0.0；是否推送 v3 由你决定。

`历史版本/` 保留了 v1、v2 的离线 HTML，便于对照。
"""
    (FULL / "00-评审入口.md").write_text(entry, encoding="utf-8")
    (NEW / "00-提交说明.md").write_text(entry, encoding="utf-8")
    seconds = video_facts["seconds"]
    (FULL / "09-演示视频" / "视频提交说明.md").write_text(f"""# 演示视频（v3）

- 文件：`视频演示-v3.mp4`，时长 `{video_facts['duration']}`（{seconds:.3f} 秒），1906×1080，H.264 + AAC。
- `00:00–05:24`：v1 原演示视频，原字节流无损拼接（v1 包 `视频演示.mp4`，SHA256 `abe1403d…3845`）。
- `05:24–{video_facts['duration'][:5]}`：v3 入门演示，约 1:14，带屏幕字幕、无旁白。由 Playwright 脚本 `PathLab-AI/scripts/demo/record-primer-v3.spec.ts` 自动操作离线 HTML 录制，是产品演示，不是学习者观察。
- v2 中 2:27 的入门演示展示的是旧界面，已经被 v3 段替换。

已核对（AI 执行）：MP4 容器、时长在 5–8 分钟之间、高度 1080；接缝前后 16 秒和片尾逐帧解码无错误。

仍需本人确认：原演示部分是否包含至少 2 分钟 AI 协同过程。确认后上传到公开视频平台，把 https 地址填到表单第 7 项。
""", encoding="utf-8")
    shutil.copy2(FULL / "09-演示视频" / "视频提交说明.md", NEW / "03-视频材料" / "视频提交说明.md")
    (NEW / "GitHub作品仓库地址.txt").write_text(f"""PathLab AI（路径学习实验室）｜GitHub 作品链接

作品仓库：{REPO}
作者主页：https://github.com/ljqzs08

注意：本包是 v3.0.0（本地提交 {head[:7]}），尚未推送。GitHub 上当前公开的是 v2.0.0。
若要让仓库与本包一致，需要作者确认后再推送；推送前请勿在表单里写“仓库即本包内容”。
这是代码托管地址，不是在线运行网站；离线体验请打开包内 03-离线体验/PathLab AI.html。
""", encoding="utf-8")
    shutil.copy2(NEW / "GitHub作品仓库地址.txt", FULL / "GitHub作品仓库地址.txt")
    (NEW / "表单填写草稿.txt").write_text(f"""仅本人填写，不要把私人报名信息放入公开作品包。（v3，2026-11-11）

1. UID：
2. 姓名：
3. 学校：
4. 联系手机号：

5. 完整作品文件链接：〔网盘分享链接；附提取码；长期有效；未登录可下载〕
   上传文件：01-上传网盘/PathLab-AI-完整作品材料-v3.zip
   GitHub补充：{REPO}（v3 未推送前，仓库内容为 v2.0.0）

6. 作品介绍附件：02-表单第6项/PathLab-AI-作品介绍文档-v3.pdf

7. 视频地址：〔先将 03-视频材料/视频演示-v3.mp4 上传至可公开访问的视频平台，再填写真实 https 链接〕
   文件事实：{video_facts['duration'][:5]}（{seconds:.3f} 秒），1906×1080，H.264 + AAC
   AI 协同过程至少 2 分钟：〔本人观看原演示部分确认后填写；v3 入门演示段不计入〕

v3 改进说明（可用于“作品更新/补充说明”栏）：
入门改为“学前测 → 5 章 → 学后测”：两套平行卷考同样 5 个知识点，生成逐知识点的前后对比掌握度报告；逐轮演示中，A* 的筛选过程（比 f → 比 h → 比加入顺序）逐条浮现，被淘汰的格子同步变灰；每次错选都按跳过的规则归类误区，并提示回看哪一章。所有答案由站内真实 A* 优先规则算出。
""", encoding="utf-8")


def package() -> None:
    state = json.loads((ROOT / ".cache" / "delivery-v3-state.json").read_text(encoding="utf-8"))
    video = NEW / "03-视频材料" / "视频演示-v3.mp4"
    facts = probe(video)
    assert 300 <= facts["seconds"] <= 480, facts
    assert all(s.get("height", 1080) >= 1080 for s in facts["streams"]), facts
    write_texts(state, facts)

    # Hashes are computed only now, after every file is final.
    sidecars = [NEW / "02-表单第6项" / "PathLab-AI-作品介绍文档-v3.pdf", NEW / "03-技术文档备用" / "PathLab-AI-技术文档-v3.pdf", video,
                FULL / "01-作品介绍" / "PathLab-AI-作品介绍文档-v3.pdf", FULL / "02-技术文档" / "PathLab-AI-技术文档-v3.pdf",
                FULL / "09-演示视频" / video.name, FULL / "04-源码与演进" / state["bundle"]]
    hashes = {}
    for path in sidecars:
        hashes[path.relative_to(NEW).as_posix()] = value = sha(path)
        (path.parent / (path.name + ".sha256")).write_text(f"{value}  {path.name}\n", encoding="utf-8")
    meta = {"fileName": video.name, "bytes": video.stat().st_size, "sha256": hashes[video.relative_to(NEW).as_posix()],
            "durationSeconds": facts["seconds"], "duration": facts["duration"], "streams": facts["streams"],
            "segments": [{"from": "00:00", "to": "05:24", "content": "v1 原演示视频（原字节流拼接）"},
                         {"from": "05:24", "to": facts["duration"][:5], "content": "v3 入门产品演示（Playwright 自动录制，带字幕）"}],
            "aiCollaborationAtLeast2Minutes": "not_verified_from_metadata_manual_review_required"}
    for folder in (NEW / "03-视频材料", FULL / "09-演示视频"):
        (folder / "视频元数据.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    files = sorted(p for p in FULL.rglob("*") if p.is_file() and p.name != "manifest.json")
    manifest = {"format": "pathlab-submission-v3", "date": "2026-11-11", "gitHead": state["head"], "commits": state["commits"],
                "files": [{"path": p.relative_to(FULL).as_posix(), "bytes": p.stat().st_size, "sha256": sha(p)} for p in files]}
    (FULL / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    upload = NEW / "01-上传网盘"
    upload.mkdir(exist_ok=True)
    archive = upload / "PathLab-AI-完整作品材料-v3.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED, allowZip64=True) as out:
        for path in sorted(FULL.rglob("*")):
            if path.is_file():
                out.write(path, path.relative_to(FULL).as_posix(), compress_type=zipfile.ZIP_STORED if path.suffix.lower() in STORED else zipfile.ZIP_DEFLATED)
    with zipfile.ZipFile(archive) as check:
        assert check.testzip() is None
        names = sorted(check.namelist())
        expected = sorted(p.relative_to(FULL).as_posix() for p in FULL.rglob("*") if p.is_file())
        assert names == expected, "ZIP entries differ from 04-完整材料解压版"
        info = {item.filename: item.file_size for item in check.infolist()}
        for entry in manifest["files"]:
            assert info[entry["path"]] == entry["bytes"], entry["path"]
    zip_sha = sha(archive)
    (upload / (archive.name + ".sha256")).write_text(f"{zip_sha}  {archive.name}\n", encoding="utf-8")
    report = {"executor": "scripts/build-delivery-v3.py (AI-run)", "gitHead": state["head"], "commits": state["commits"],
              "sourceFilesFromGitArchive": state["trackedFiles"], "bundle": state["bundle"], "bundleRecloneVerified": True,
              "pages": state["pages"], "video": {"duration": facts["duration"], "bytes": video.stat().st_size},
              "zip": {"bytes": archive.stat().st_size, "entries": len(names), "sha256": zip_sha, "crcVerified": True},
              "sha256": hashes, "uploaded": False, "githubPushed": False}
    (NEW / "packet-build-verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    {"prepare": prepare, "package": package}[sys.argv[1] if len(sys.argv) > 1 else "prepare"]()
