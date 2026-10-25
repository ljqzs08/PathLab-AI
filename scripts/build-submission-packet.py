"""Assemble the explicitly non-video handoff, using committed public source bytes.

No network requests, installs, Git pushes, source modifications or PDF rewriting.
All outputs are constrained to this D-drive project. Run --verify on a final ZIP.
"""
from __future__ import annotations
import argparse
import hashlib
import html
import io
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import zipfile
from datetime import datetime
from urllib.parse import quote
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
SOURCE = "e438363692762398117756ceb7f72a3fb415e5ad"
SOURCE_REF = "refs/remotes/origin/main"
STAMP = "20261025"
BASENAME = "PathLab-AI-参赛整理-20261025"
PACKET = "PathLab-AI-完整作品材料-不含视频.zip"
PROMPT_ZIP = "PathLab-AI-Prompt-evidence-20261025-093233.zip"
HTML_FILE = "PathLab-AI/PathLab AI.html"
GITHUB_REPOSITORY = "https://github.com/ljqzs08/PathLab-AI"
GITHUB_PROFILE = "https://github.com/ljqzs08"
GITHUB_LINK_NAME = "GitHub作品仓库地址.txt"
GITHUB_LINK_TEXT = (
    "PathLab AI（路径学习实验室）｜GitHub 作品链接\n\n"
    f"作品仓库（评审主入口）：{GITHUB_REPOSITORY}\n"
    f"作者 GitHub 主页（补充）：{GITHUB_PROFILE}\n\n"
    "请优先打开作品仓库，查看源码、README、真实 Git 演进和已公开 Prompt。\n"
    f"本包源码资料基线：{SOURCE}（完整 38 个提交）。\n"
    "这是代码托管地址，不是在线运行网站；离线体验请打开包内 03-离线体验/PathLab AI.html。\n"
    "两份 PDF 另随本地材料包提供；本轮仅增补链接，没有再次上传或推送 GitHub。\n"
    "GitHub 链接不替代表单第 5 项要求的网盘完整作品分享链接。\n"
).encode("utf-8")
PDFS = (("作品介绍文档", "01-作品介绍", 15), ("技术文档", "02-技术文档", 24))
PHOTO_FOLDER = "05-Prompt证据/历史照片补充"
PHOTO_INDEX = PHOTO_FOLDER + "/00-照片索引.html"
PROMPT_PHOTOS = (
    ("微信图片_20261025175730_443_2.jpg", "初始方案与分阶段协作", "可见赛事链接、用户方案请求及避免一次生成全部代码的建议。"),
    ("微信图片_20261025175730_444_2.jpg", "完整提示词文件与阶段规划", "可见提示词文件生成说明与分阶段开发、测试、Git 和材料目录。"),
    ("微信图片_20261025175732_445_2.jpg", "每轮留证与真实 Git 演进约束", "可见用户要求保存交互历史、至少三条核心链及当时的落实说明。"),
    ("微信图片_20261025175734_446_2.jpg", "地图预测交互与有限动效", "可见地图候选点选、有限动效和当时的自动检查说明，对应 E014 主题。"),
    ("微信图片_20261025175735_447_2.jpg", "自由地图与双算法对比回放", "可见自由地图编辑、预测挑战、回放及内存保存边界，对应 E015 主题。"),
    ("微信图片_20261025175736_448_2.jpg", "真实纠正证据与验收边界", "可见用户推进要求、HTML 纠正索引和不冒充人工或真机验收的说明，对应 E016 主题。"),
    ("微信图片_20261025175737_449_2.jpg", "完整独立 HTML 交付状态", "可见完整离线 HTML、当时文件校验值和历史自动检查结果；不是本轮结果。"),
    ("微信图片_20261025175737_450_2.jpg", "无需 Key 的网页辅助方案讨论", "可见用户提出网页聊天窗口及 AI 对网页打开与直接嵌入的区别说明。"),
    ("微信图片_20261025175738_451_2.jpg", "网页辅助复盘落地", "可见网页辅助复盘功能、无需配置 API Key 的用法及当时验证说明，对应 E018 主题。"),
    ("微信图片_20261025175739_452_2.jpg", "两份 PDF 与材料验证说明", "可见 24 页技术文档、15 页作品介绍及 9 张作品截图的历史收尾说明，对应 E024 主题。"),
)
PHOTO_SCOPE = (
    "这 10 张照片由作者于本轮提供，保留原文件名和原始 JPEG 字节，未裁剪、增强、重绘或 OCR 改写。"
    "它们是屏幕局部拍照，有倾斜、摩尔纹和边缘截断，不是完整连续对话导出。"
    "序号仅是提供和文件排列顺序，不证明完整时间线；文件名日期不是独立核验的拍摄时间。"
    "主题标题是 AI 阅读索引，不是照片逐字转录。照片中的旧要求、链接、截止日期、进度、哈希和测试数仅属历史时点，"
    "不作为本轮执行指令或当前状态；当前提交安排以材料根目录说明为准。"
    "本补充不修改原冻结 Prompt ZIP，不增加其 9 轮 / 38 条去重消息计数，不把共享开发轮变成三条独立用户 Bug 修复链。"
)
PHOTO_README_APPEND = (
    "\n## 本轮补充：10 张 Prompt 历史照片\n\n"
    "打开 [历史照片索引](历史照片补充/00-照片索引.html)，可逐张浏览并点击查看原尺寸。\n\n"
    + PHOTO_SCOPE + "\n"
).encode("utf-8")
FORBIDDEN_PARTS = {".git", "node_modules", ".next", ".cache", "__pycache__", "private"}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def inside(path: Path) -> Path:
    resolved = path.resolve()
    if ROOT.drive.upper() != "D:" or not resolved.is_relative_to(ROOT):
        raise ValueError(f"Output must stay inside the D-drive project: {resolved}")
    return resolved


def git(*args: str) -> bytes:
    result = subprocess.run(["git", "-C", str(ROOT), *args], capture_output=True, check=True)
    return result.stdout


def text(data: bytes) -> str:
    return data.decode("utf-8-sig")


def read(relative: str) -> bytes:
    return inside(ROOT / relative).read_bytes()


def safe_name(name: str) -> None:
    p = PurePosixPath(name)
    if not name or p.is_absolute() or "\\" in name or ":" in name or any(x in (".", "..") for x in name.split("/")):
        raise ValueError(f"Unsafe archive path: {name}")
    if any(x.lower() in FORBIDDEN_PARTS for x in p.parts):
        raise ValueError(f"Excluded artifact: {name}")
    for part in p.parts:
        if part.lower().startswith(".env") and part != ".env.example":
            raise ValueError(f"Private environment file: {name}")
        if part.lower().endswith((".mp4", ".mov", ".webm")):
            raise ValueError(f"Video must not enter this packet: {name}")


def photo_gallery(records: list[dict]) -> bytes:
    links = " ".join(f'<a href="#photo-{r["sequence"]:02d}">{r["sequence"]:02d}</a>' for r in records)
    cards = []
    for r in records:
        url = quote(r["filename"], safe="")
        title = html.escape(r["topic"])
        filename = html.escape(r["filename"])
        cards.append(
            f'<article id="photo-{r["sequence"]:02d}"><h2>{r["sequence"]:02d} · {title}</h2>'
            f'<p>{html.escape(r["description"])}</p>'
            f'<a class="image" href="{url}" target="_blank" rel="noopener noreferrer" aria-label="查看原图：{title}">'
            f'<img src="{url}" width="{r["width"]}" height="{r["height"]}" alt="Prompt 历史拍屏照片 {r["sequence"]:02d}：{title}"></a>'
            f'<p><a href="{url}" target="_blank" rel="noopener noreferrer">查看原尺寸照片</a> · {r["width"]} × {r["height"]} · {r["bytes"]:,} 字节</p>'
            f'<p class="filename">{filename}</p>'
            f'<details><summary>SHA256 校验值</summary><code>{html.escape(r["sha256"])}</code></details></article>'
        )
    return (
        '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>Prompt 历史照片补充 · PathLab AI</title><style>'
        'body{font:16px/1.7 system-ui,"Microsoft YaHei",sans-serif;margin:0;background:#f0f4f8;color:#182c43}'
        'main{max-width:1180px;margin:32px auto;padding:24px}h1{line-height:1.3;font-size:32px}h2{font-size:21px;margin-top:0}'
        'a{color:#165cb5;text-underline-offset:3px}a:focus-visible,summary:focus-visible{outline:3px solid #2364cc;outline-offset:4px}'
        '.note{padding:20px;background:#fff4d5;border-left:5px solid #b66d00;border-radius:8px}'
        'nav{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0}nav a{padding:8px 14px;background:white;border:1px solid #b4c9e1;border-radius:6px}'
        '.photos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}'
        'article{min-width:0;padding:22px;background:white;border:1px solid #d6e0ec;border-radius:12px;scroll-margin-top:20px}'
        '.image{display:block}img{width:100%;height:auto;display:block;border-radius:5px}'
        '.filename,code{overflow-wrap:anywhere;font-size:13px}summary{cursor:pointer}footer{margin:28px 0}'
        '@media(max-width:760px){main{margin:0;padding:18px}.photos{grid-template-columns:1fr}h1{font-size:27px}article{padding:18px}}'
        '</style><main><p><a href="../../00-%E8%AF%84%E5%AE%A1%E5%85%A5%E5%8F%A3.html">返回评审材料入口</a></p>'
        '<h1>Prompt 历史照片补充</h1><p>10 张作者提供的原始照片 · 本地查看 · 点击照片可查看原尺寸</p>'
        f'<div class="note">{html.escape(PHOTO_SCOPE)}</div><nav aria-label="照片序号跳转">{links}</nav>'
        f'<div class="photos">{"".join(cards)}</div>'
        '<footer><a href="00-%E9%98%85%E8%AF%BB%E8%AF%B4%E6%98%8E.md">阅读说明</a> · '
        '<a href="%E7%85%A7%E7%89%87%E6%B8%85%E5%8D%95.json">原图尺寸与 SHA256 清单</a><p>纯本地静态页，无脚本、无自动联网或上传。</p></footer></main></html>\n'
    ).encode("utf-8")


def photo_payload() -> tuple[dict[str, bytes], dict]:
    # Pillow is provided by the existing document runtime; no dependency is installed.
    from PIL import Image
    payload = {}
    records = []
    for sequence, (filename, topic, description) in enumerate(PROMPT_PHOTOS, 1):
        source = "Prompt历史快照/" + filename
        data = read(source)
        with Image.open(io.BytesIO(data)) as image:
            if image.format != "JPEG":
                raise ValueError(f"Expected original JPEG: {filename}")
            image.load()
            width, height = image.size
        records.append({"sequence": sequence, "filename": filename, "source": source, "topic": topic,
                        "description": description, "format": "JPEG", "width": width, "height": height,
                        "bytes": len(data), "sha256": digest(data)})
        payload[PHOTO_FOLDER + "/" + filename] = data
    metadata = {"format": "pathlab-prompt-photo-supplement/v1", "count": len(records), "index": PHOTO_INDEX,
                "originalBytesPreserved": True, "completeConversationExport": False,
                "addsCoreSnapshotOrMessageCount": False, "scope": PHOTO_SCOPE, "photos": records}
    payload[PHOTO_INDEX] = photo_gallery(records)
    payload[PHOTO_FOLDER + "/照片清单.json"] = (json.dumps(metadata, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    payload[PHOTO_FOLDER + "/00-阅读说明.md"] = (
        "# Prompt 历史照片补充\n\n" + PHOTO_SCOPE + "\n\n"
        "先打开 `00-照片索引.html` 浏览；点击照片查看原尺寸。`照片清单.json` 保存逐图原文件名、字节、尺寸和 SHA256。\n\n"
        "原始完整可见消息与链索引仍以 `../阅读说明.md` 指向的原冻结 Prompt 包为准；本文件不宣称照片覆盖了全部交互。\n\n"
        "AI 已目视检查这 10 张照片，未发现明显密钥或账号凭证；这是限定范围的目视复核，不是彻底隐私或安全审计。"
        "原图按作者授权本地纳包，未上传 GitHub、网盘或提交赛事。\n"
    ).encode("utf-8")
    return payload, metadata


def verify_zip(path: Path) -> dict:
    path = inside(path)
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        if len(set(names)) != len(names):
            raise ValueError("Duplicate ZIP entries")
        for name in names:
            safe_name(name)
        manifest = json.loads(z.read("manifest.json"))
        if manifest["format"] != "pathlab-submission-nonvideo/v1" or manifest["containsVideo"]:
            raise ValueError("Incorrect packet format or video claim")
        expected = {"manifest.json"} | {f["path"] for f in manifest["files"]}
        if expected != set(names) or len(expected) != len(manifest["files"]) + 1:
            raise ValueError("Manifest coverage mismatch")
        for f in manifest["files"]:
            data = z.read(f["path"])
            if len(data) != f["bytes"] or digest(data) != f["sha256"]:
                raise ValueError(f"File hash mismatch: {f['path']}")
        if z.testzip() is not None:
            raise ValueError("ZIP CRC failure")
        if manifest["sourceCommit"] != SOURCE or manifest["sourceHistoryCount"] != 38:
            raise ValueError("Unexpected source baseline")
        for title, folder, _ in PDFS:
            name = f"{folder}/PathLab-AI-{title}.pdf"
            if z.read(name) != read(f"output/pdf/PathLab-AI-{title}.pdf"):
                raise ValueError(f"PDF copy changed: {title}")
        if "github" in manifest:
            expected_links = {"repository": GITHUB_REPOSITORY, "profile": GITHUB_PROFILE, "linkFile": GITHUB_LINK_NAME}
            if manifest["github"] != expected_links or z.read(GITHUB_LINK_NAME) != GITHUB_LINK_TEXT:
                raise ValueError("GitHub repository/profile link mismatch")
            for name in ("00-评审入口.html", "00-评审入口.md"):
                content = text(z.read(name))
                if GITHUB_REPOSITORY not in content or GITHUB_PROFILE not in content:
                    raise ValueError(f"Missing visible GitHub links: {name}")
        if "promptPhotos" in manifest:
            photos, photo_metadata = photo_payload()
            if manifest["promptPhotos"] != photo_metadata:
                raise ValueError("Prompt photo metadata differs from original files")
            for name, original in photos.items():
                if z.read(name) != original:
                    raise ValueError(f"Prompt photo supplement changed: {name}")
        if z.read("03-离线体验/PathLab AI.html") != git("show", f"{SOURCE}:{HTML_FILE}"):
            raise ValueError("Offline HTML differs from source commit")
    return {"archive": str(path), "bytes": path.stat().st_size, "sha256": digest(path.read_bytes()),
            "entries": len(names), "filesVerified": len(manifest["files"]), "sourceCommit": SOURCE,
            "sourceHistoryCount": 38, "containsVideo": False, "verified": True}


def page(title: str, subtitle: str, cards: list[tuple[str, str, str]], note: str) -> bytes:
    sections = "".join(f'<a class="card" href="{quote(url, safe="/:#")}"><b>{html.escape(label)}</b><span>{html.escape(desc)}</span></a>'
                       for label, desc, url in cards)
    return (f'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{html.escape(title)}</title><style>body{{font:16px/1.7 system-ui,"Microsoft YaHei",sans-serif;background:#f0f4f8;color:#182c43;margin:0}}'
            'main{max-width:980px;margin:40px auto;padding:28px}h1{font-size:32px;line-height:1.3}p{color:#40546b}.alert{background:#fff4d5;border-left:5px solid #b66d00;padding:18px;border-radius:8px}'
            '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px;margin:24px 0}.card{background:white;padding:22px;border-radius:12px;border:1px solid #d6e0ec;text-decoration:none;color:inherit;display:block}'
            '.github{background:#fff;border:2px solid #2364cc;border-radius:12px;padding:20px;margin-top:24px}.github h2{font-size:22px;margin:0}.github a{overflow-wrap:anywhere}.card:hover{border-color:#2364cc}.card:focus-visible{outline:3px solid #2364cc;outline-offset:3px}.card b{display:block;font-size:20px}.card span{display:block;color:#4e6176;margin-top:8px}small{color:#52677f}code{overflow-wrap:anywhere}'
            '@media(max-width:600px){main{margin:0;padding:20px}h1{font-size:27px}}</style><main>'
            f'<small>PathLab AI · 本地材料导航 · 2026-10-25</small><h1>{html.escape(title)}</h1><p>{html.escape(subtitle)}</p>'
            f'<div class="alert">{html.escape(note)}</div>'
            '<section class="github" aria-labelledby="github-title"><h2 id="github-title">GitHub：已上传的作品</h2>'
            f'<p><strong>作品仓库 · 评审主入口（源码与真实演进）</strong><br><a href="{GITHUB_REPOSITORY}" target="_blank" rel="noopener noreferrer">{GITHUB_REPOSITORY}</a></p>'
            f'<p>作者个人主页（补充）：<a href="{GITHUB_PROFILE}" target="_blank" rel="noopener noreferrer">{GITHUB_PROFILE}</a></p>'
            '<small>仓库是代码托管地址，不是在线演示网站；两份 PDF 另随本地材料提供，本轮未重新上传。</small></section>'
            f'<div class="grid">{sections}</div>'
            '<p>本页不会自动联网、上传、填表或提交。只有点击 GitHub 外链时才访问 GitHub；所有发送操作由本人决定。</p></main></html>\n').encode("utf-8")


def build(output: Path) -> dict:
    output = inside(output)
    if output.exists():
        raise FileExistsError("Output already exists; preserve it and select a new --output directory.")
    source = text(git("rev-parse", "--verify", f"{SOURCE}^{{commit}}")).strip()
    if source != SOURCE or text(git("rev-parse", SOURCE_REF)).strip() != SOURCE:
        raise ValueError("The recorded public source ref moved; review source/PDF baselines before rebuilding.")
    history = text(git("rev-list", "--reverse", SOURCE)).splitlines()
    if len(history) != 38:
        raise ValueError("Unexpected baseline history")
    remote = json.loads(read("docs/evidence/submission-github-readonly-20261025.json"))
    if remote["private"] or remote["remoteMain"] != SOURCE or remote["credentialsUsed"]:
        raise ValueError("Missing matching anonymous public-source verification")
    source_zip = zipfile.ZipFile(io.BytesIO(git("archive", "--format=zip", SOURCE)))
    payload: dict[str, bytes] = {}
    for info in source_zip.infolist():
        if info.is_dir():
            continue
        safe_name(info.filename)
        payload["04-源码与演进/源码/" + info.filename] = source_zip.read(info)
    source_zip.close()
    for required in ("README.md", "PathLab-AI/.env.example", "PathLab-AI/package-lock.json", "prompts/submission/README.md"):
        if "04-源码与演进/源码/" + required not in payload:
            raise ValueError(f"Required source missing: {required}")
    html_bytes = git("show", f"{SOURCE}:{HTML_FILE}")
    if read(HTML_FILE) != html_bytes:
        raise ValueError("Working HTML changed; do not silently replace committed source bytes")
    payload["03-离线体验/PathLab AI.html"] = html_bytes
    payload["03-离线体验/使用说明.md"] = (
        "# 离线体验\n\n在 Edge 中直接打开同目录的 `PathLab AI.html`，无需 localhost、Node 或模型密钥。\n\n"
        "建议：L01 开始预测 → 选择候选 → 显式提交 → 单步或播放至结果 → 单因素实验 → 引用事件解释。\n\n"
        "本机存档可能受路径 / 浏览器影响，转移前导出 JSON，目标位置预览确认恢复。自由地图不计入关卡 / 备份。\n\n"
        "完整 HTML 没有站内服务端 API；网页辅助在本机准备文本，外部 DeepSeek 需要本人主动打开并发送。\n"
    ).encode("utf-8")
    for title, folder, _ in PDFS:
        path = f"output/pdf/PathLab-AI-{title}.pdf"
        data = read(path)
        checksum = text(read(path + ".sha256")).split()[0].lower()
        if digest(data) != checksum:
            raise ValueError(f"Original PDF checksum failure: {title}")
        payload[f"{folder}/PathLab-AI-{title}.pdf"] = data
        payload[f"{folder}/PathLab-AI-{title}.pdf.sha256"] = read(path + ".sha256")
    prompt = read("delivery/" + PROMPT_ZIP)
    prompt_hash = text(read("delivery/" + PROMPT_ZIP + ".sha256")).split()[0].lower()
    if digest(prompt) != prompt_hash:
        raise ValueError("Frozen Prompt archive changed")
    with zipfile.ZipFile(io.BytesIO(prompt)) as z:
        pm = json.loads(z.read("manifest.json"))
        if pm["snapshotCount"] != 9 or pm["uniqueMessages"] != 38:
            raise ValueError("Unexpected core Prompt scope")
        for f in pm["files"]:
            if digest(z.read(f["path"])) != f["sha256"]:
                raise ValueError("Prompt payload hash failure")
    payload["05-Prompt证据/" + PROMPT_ZIP] = prompt
    payload["05-Prompt证据/" + PROMPT_ZIP + ".sha256"] = read("delivery/" + PROMPT_ZIP + ".sha256")
    payload["05-Prompt证据/阅读说明.md"] = (
        "# 真实 Prompt 证据\n\n先读 `../04-源码与演进/源码/prompts/submission/README.md`；也可解压本目录原已公开 ZIP。\n\n"
        "9 份完成轮、38 条去重真实可见消息、10 个真实历史提交；C01/C02/C03 为算法 / 预测回放 / 复盘，"
        "U01 为真实用户 HTML 纠正，S02 为网页辅助的真实需求调整。共享会话不复制计数。\n\n"
        "不是工具原生全量导出。AI 自测不冒充用户 Bug，不补造三条独立人类引导修复；是否满足赛事认定由评审判断。\n"
    ).encode("utf-8")
    photo_files, photo_metadata = photo_payload()
    payload.update(photo_files)
    payload["05-Prompt证据/阅读说明.md"] += PHOTO_README_APPEND
    captures = json.loads(read("docs/assets/project-introduction/capture-manifest.json"))
    records = captures.get("images", captures.get("screenshots", captures.get("captures", [])))
    if not records:
        records = captures.get("records", [])
    if len(records) != 9:
        raise ValueError(f"Expected nine actual screenshots, got {len(records)}")
    for record in records:
        data = read(record["file"])
        if digest(data) != record["sha256"]:
            raise ValueError("Screenshot source changed")
        payload["06-实际截图/" + Path(record["file"]).name] = data
    payload["06-实际截图/capture-manifest.json"] = read("docs/assets/project-introduction/capture-manifest.json")
    for name in ("docs/project-introduction.md", "docs/technical-report.md", "scripts/build-project-introduction.py", "scripts/build-technical-report.py",
                 "scripts/capture-project-introduction.cjs", "docs/verification-project-introduction.md", "docs/verification-technical-report.md"):
        payload["07-文档源稿与来源/" + name] = read(name)
    for title, _, _ in PDFS:
        for suffix in ("-来源清单.json", "-校验记录.json"):
            name = f"output/pdf/PathLab-AI-{title}{suffix}"
            payload["07-文档源稿与来源/" + name] = read(name)
    payload["07-文档源稿与来源/README.md"] = (
        "# 文档源稿与既有验证\n\n两份 PDF 原字节复制，未重排。本目录保存源稿 / 来源 / 既有校验与生成脚本，不是本轮产品回归。\n\n"
        "需要重建文档时，在独立的 D 盘源码工作副本，把本目录的 docs、scripts、output 按原层级复制到根目录，"
        "把 `06-实际截图` 的正式截图与清单复制到 `docs/assets/project-introduction/`，再按对应构建脚本环境执行。"
        "源码基线不包含后续 PDF 文档提交；两份成品在本包单独提供，不能宣称已上传到 GitHub。\n"
    ).encode("utf-8")
    for name in ("docs/submission-handoff-20261025.md", "docs/evidence/submission-rules-20261025.json", "docs/evidence/submission-github-readonly-20261025.json"):
        payload["08-规则与提交说明/" + Path(name).name] = read(name)
    history_log = git("log", "--reverse", "--date=iso-strict", "--format=%H%nParents: %P%nAuthor: %an%nDate: %aI%nSubject: %s%n", SOURCE)
    payload["04-源码与演进/git-log.txt"] = history_log
    payload["04-源码与演进/git-commits.json"] = (json.dumps({"sourceCommit": SOURCE, "commitCount": len(history), "commitsOldestFirst": history}, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    payload["04-源码与演进/恢复完整历史.md"] = (
        "# 源码与完整 Git 历史\n\n`源码/` 可直接查看；`.bundle` 保留本次公开资料基线及全部 38 个祖先提交，不是一次性初始提交。\n\n"
        f"资料基线：`{SOURCE}`，与两份 PDF 一致。GitHub 已公开： https://github.com/ljqzs08/PathLab-AI 。\n\n"
        "在一个尚不存在的 D 盘目录恢复（把下面 bundle 路径替换为解压后的实际绝对路径）：\n\n"
        "```powershell\n$bundle = (Resolve-Path -LiteralPath '.\\PathLab-AI-full-history-e438363.bundle').Path\n"
        "$target = 'D:\\竞赛\\.cache\\review-restored'\nif (Test-Path -LiteralPath $target) { throw '请选择尚不存在的目标目录' }\n"
        "git init $target\ngit -C $target fetch $bundle refs/remotes/origin/main:refs/heads/main\n"
        "git -C $target checkout main\ngit -C $target rev-list --count HEAD\ngit -C $target rev-parse HEAD\n```\n\n"
        "预期计数 38、HEAD 等于上述完整哈希；然后按 `README.md` 执行环境安装和学习闭环。"
        "首次安装依赖需联网，bundle 本身恢复历史不需要 GitHub 登录。没有携带 node_modules、.next、私人 env、凭证或浏览器缓存。\n"
    ).encode("utf-8")
    payload[GITHUB_LINK_NAME] = GITHUB_LINK_TEXT
    payload["00-评审入口.md"] = (
        "# PathLab AI：作品材料（不含视频）\n\n"
        f"**GitHub 作品仓库（评审主入口）：[{GITHUB_REPOSITORY}]({GITHUB_REPOSITORY})**\n\n"
        f"作者主页（补充）：[{GITHUB_PROFILE}]({GITHUB_PROFILE})。仓库是源码托管地址，不是在线运行网站；两份 PDF 另随本地材料提供，本轮未再次上传。\n\n"
        "1. 读 `01-作品介绍/PathLab-AI-作品介绍文档.pdf`（15 页，七项介绍）。\n"
        "2. 直接打开 `03-离线体验/PathLab AI.html`，完成一轮 L01。\n"
        "3. 读 `02-技术文档/PathLab-AI-技术文档.pdf`（24 页，三项技术论证）。\n"
        "4. 查看 `04-源码与演进/源码/README.md` 和 `prompts/submission/README.md`。完整历史由同目录 bundle 保留。\n"
        "5. 浏览 `05-Prompt证据/历史照片补充/00-照片索引.html`：10 张作者提供的原图，属于局部拍屏补充，不改变原 Prompt 包计数。\n"
        "6. 需要正式截图 / 源稿 / 来源时读 06、07；规则与表单说明在 08。\n\n"
        "视频由作者后补；本包不含视频，也不等于已经提交预指导或正式省赛。"
        "AI 自动检查不等于人工 / 真机通过，DeepSeek 没有真实付费联调，C 链人工修复证据边界见 Prompt 导引。\n"
    ).encode("utf-8")
    payload["00-评审入口.html"] = page("PathLab AI：评审材料入口", "先体验，再核对技术与真实演进。源码和 PDF 使用同一公开资料基线。", [
        ("作品介绍 · 15 页", "项目、使用、亮点、AI测试、技术与9张实际截图。", "01-作品介绍/PathLab-AI-作品介绍文档.pdf"),
        ("立即离线体验", "Edge 打开，不需安装、localhost 或模型密钥。", "03-离线体验/PathLab AI.html"),
        ("技术文档 · 24 页", "意图控制、架构设计和可复现性论证。", "02-技术文档/PathLab-AI-技术文档.pdf"),
        ("源码与复现指南", "锁定依赖、环境模板、默认零密钥闭环。", "04-源码与演进/源码/README.md"),
        ("核心 Prompt 阅读入口", "C01/C02/C03 + U01/S02；不重复计数共享会话。", "04-源码与演进/源码/prompts/submission/README.md"),
        ("Prompt 历史照片 · 10 张", "作者提供的局部拍屏原图；保留原字节，不冒充完整对话。", PHOTO_INDEX),
        ("恢复完整 Git 历史", "38个真实历史提交，不是一次性初始提交。", "04-源码与演进/恢复完整历史.md"),
    ], "本包明确不含视频；不是预指导或正式赛事提交回执，也不是人工 / 真机验收。")
    for name in payload:
        safe_name(name)
    output.mkdir(parents=True)
    unpacked = output / "04-完整材料解压版"
    bundle_rel = "04-源码与演进/PathLab-AI-full-history-e438363.bundle"
    bundle = inside(unpacked / bundle_rel)
    bundle.parent.mkdir(parents=True)
    git("bundle", "create", str(bundle), SOURCE_REF)
    git("bundle", "verify", str(bundle))
    payload[bundle_rel] = bundle.read_bytes()
    manifest = {"format": "pathlab-submission-nonvideo/v1", "generatedAt": datetime.now(ZoneInfo("Asia/Shanghai")).isoformat(),
                "sourceCommit": SOURCE, "sourceHistoryCount": len(history), "bundleRef": SOURCE_REF,
                "documentSourceLocalHead": text(git("rev-parse", "HEAD")).strip(), "containsVideo": False,
                "promptPhotos": photo_metadata,
                "prompt": {"frozenArchive": PROMPT_ZIP, "snapshots": 9, "uniqueVisibleMessages": 38, "sha256": prompt_hash},
                "pdfs": [{"title": title, "pages": pages, "rewritten": False} for title, _, pages in PDFS],
                "screenshots": {"count": 9, "newCaptureThisRound": False, "physicalDevice": False},
                "publicationPerformed": False, "formSubmitted": False,
                "github": {"repository": GITHUB_REPOSITORY, "profile": GITHUB_PROFILE, "linkFile": GITHUB_LINK_NAME},
                "files": [{"path": name, "bytes": len(data), "sha256": digest(data)} for name, data in sorted(payload.items())]}
    payload["manifest.json"] = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    for name, data in payload.items():
        dest = inside(unpacked / name)
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.exists() and dest != bundle:
            raise FileExistsError(dest)
        dest.write_bytes(data)
    archive = inside(output / "01-上传网盘" / PACKET)
    archive.parent.mkdir(parents=True)
    with zipfile.ZipFile(archive, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=7) as z:
        for name, data in sorted(payload.items()):
            z.writestr(name, data)
    (archive.parent / (PACKET + ".sha256")).write_text(f"{digest(archive.read_bytes())}  {PACKET}\n", encoding="utf-8")
    for title, folder in (("作品介绍文档", "02-表单第6项"), ("技术文档", "03-技术文档备用")):
        dst = output / folder
        dst.mkdir()
        for suffix in (".pdf", ".pdf.sha256"):
            filename = "PathLab-AI-" + title + suffix
            (dst / filename).write_bytes(read("output/pdf/" + filename))
    (output / GITHUB_LINK_NAME).write_bytes(GITHUB_LINK_TEXT)
    (output / "00-提交说明.md").write_bytes(read("docs/submission-handoff-20261025.md"))
    (output / "表单填写草稿.txt").write_text(
        "仅本人填写，不要把私人报名信息放入公开作品包。\n\n1. UID：\n2. 姓名：\n3. 学校：\n4. 联系手机号：\n\n"
        "5. 完整作品文件链接：〔网盘分享链接；附提取码；长期有效；未登录可下载〕\n"
        "   上传文件：01-上传网盘/PathLab-AI-完整作品材料-不含视频.zip\n"
        "   GitHub补充：https://github.com/ljqzs08/PathLab-AI\n\n"
        "6. 作品介绍附件：02-表单第6项/PathLab-AI-作品介绍文档.pdf\n\n"
        "7. 视频地址：〔录制后上传B站/抖音等公开视频平台，填写真实https链接；本轮待补〕\n\n"
        "预指导表显示截止：2026-10-31 15:00:00。视频项必填，不能承诺先交后补。\n"
        "本轮未上传网盘、未代填表、未提交比赛。\n", encoding="utf-8")
    (output / "00-提交说明.html").write_bytes(page("准备发送：只需选对文件", "GitHub 已上传，本次只整理非视频材料。两份 PDF 不合并，避免技术文档超过30页。", [
        ("第5项：上传这个ZIP至网盘", "网盘生成长期有效分享链接和提取码，再填入表单。", "01-上传网盘/" + PACKET),
        ("第6项：直接上传介绍PDF", "15页，约2.43MB；表单允许1份、不超过100MB。", "02-表单第6项/PathLab-AI-作品介绍文档.pdf"),
        ("技术文档备用PDF", "24页，约0.30MB；完整包中也已包含。", "03-技术文档备用/PathLab-AI-技术文档.pdf"),
        ("检查完整材料解压版", "评审导航、离线HTML、源码、完整历史、Prompt与截图。", "04-完整材料解压版/00-评审入口.html"),
        ("Prompt 历史照片 · 10 张", "已纳入完整 ZIP；可逐张浏览、点击查看原尺寸。", "04-完整材料解压版/" + PHOTO_INDEX),
        ("逐栏填写说明", "入口区别、七项材料映射、真实边界与提交前检查。", "00-提交说明.md"),
        ("填写草稿", "个人信息本人填写；无虚构UID或假视频链接。", "表单填写草稿.txt"),
    ], "预指导截止 2026-10-31 15:00:00。视频地址是必填：本轮不含视频，不等于现在可以提交后再补。此链接不是最终省赛提交。"))
    result = verify_zip(archive)
    result["outputDirectory"] = str(output)
    result["unpackedDirectory"] = str(unpacked)
    result["pdfsCopiedWithoutRewrite"] = True
    result["promptPhotoCount"] = photo_metadata["count"]
    result["sourceArchiveFileCount"] = sum(name.startswith("04-源码与演进/源码/") for name in payload)
    result["publicationPerformed"] = False
    result["github"] = {"repository": GITHUB_REPOSITORY, "profile": GITHUB_PROFILE, "linkFile": GITHUB_LINK_NAME}
    (output / "packet-build-verification.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "delivery" / BASENAME)
    parser.add_argument("--verify", type=Path)
    args = parser.parse_args()
    os.environ["PYTHONDONTWRITEBYTECODE"] = "1"
    os.environ["TEMP"] = os.environ["TMP"] = str(inside(ROOT / ".cache/tmp"))
    result = verify_zip(args.verify) if args.verify else build(args.output)
    print(json.dumps(result, ensure_ascii=False, indent=2))
