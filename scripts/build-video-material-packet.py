"""Build a new D-drive submission handoff that includes the author-provided video.

The previous non-video packet is never overwritten. This script only reads the
source video, copies material within the D-drive workspace, writes metadata and
checksums, and creates a new ZIP. It does not upload, publish, submit a form,
or modify the source video.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import struct
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[1]
OLD_MATERIAL = ROOT / "delivery" / "PathLab-AI-参赛整理-20261025"
DEFAULT_OUTPUT = ROOT / "delivery" / "PathLab-AI-参赛整理-20261028"
DEFAULT_VIDEO = Path(r"C:\Users\LJQ\Desktop\视频演示.mp4")
SOURCE_COMMIT = "e438363692762398117756ceb7f72a3fb415e5ad"
SOURCE_HISTORY_COUNT = 38
GITHUB_REPOSITORY = "https://github.com/ljqzs08/PathLab-AI"
GITHUB_PROFILE = "https://github.com/ljqzs08"


def inside_d(path: Path) -> Path:
    resolved = path.resolve()
    if ROOT.drive.upper() != "D:" or not resolved.is_relative_to(ROOT):
        raise ValueError(f"Output must stay inside the D-drive workspace: {resolved}")
    return resolved


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_box(handle, end: int):
    start = handle.tell()
    header = handle.read(8)
    if len(header) < 8:
        return None
    size, kind = struct.unpack(">I4s", header)
    kind = kind.decode("latin1")
    header_size = 8
    if size == 1:
        size = struct.unpack(">Q", handle.read(8))[0]
        header_size = 16
    elif size == 0:
        size = end - start
    if size < header_size or start + size > end:
        return None
    return start, size, kind, header_size


def children(handle, start: int, size: int, wanted: set[str] | None = None):
    output = []
    end = start + size
    handle.seek(start)
    while handle.tell() < end:
        box = read_box(handle, end)
        if not box:
            break
        if wanted is None or box[2] in wanted:
            output.append(box)
        handle.seek(box[0] + box[1])
    return output


def parse_mp4(path: Path) -> dict[str, Any]:
    """Read enough ISO-BMFF metadata to verify container, tracks and dimensions."""
    with path.open("rb") as handle:
        handle.seek(0, 2)
        file_end = handle.tell()
        top = children(handle, 0, file_end)
        moov = next((box for box in top if box[2] == "moov"), None)
        if not moov:
            raise ValueError("MP4 metadata box moov was not found")
        tracks = children(handle, moov[0] + moov[3], moov[1] - moov[3], {"trak"})
        parsed_tracks: list[dict[str, Any]] = []
        for index, track in enumerate(tracks):
            mdia = next((box for box in children(handle, track[0] + track[3], track[1] - track[3]) if box[2] == "mdia"), None)
            if not mdia:
                continue
            mdia_children = children(handle, mdia[0] + mdia[3], mdia[1] - mdia[3])
            hdlr = next((box for box in mdia_children if box[2] == "hdlr"), None)
            handler = None
            if hdlr:
                handle.seek(hdlr[0] + hdlr[3] + 8)
                handler = handle.read(4).decode("latin1")
            mdhd = next((box for box in mdia_children if box[2] == "mdhd"), None)
            timescale = duration_units = 0
            if mdhd:
                handle.seek(mdhd[0] + mdhd[3])
                version = handle.read(1)[0]
                handle.read(3)
                if version == 1:
                    handle.read(16)
                    timescale = struct.unpack(">I", handle.read(4))[0]
                    duration_units = struct.unpack(">Q", handle.read(8))[0]
                else:
                    handle.read(8)
                    timescale = struct.unpack(">I", handle.read(4))[0]
                    duration_units = struct.unpack(">I", handle.read(4))[0]
            codec = width = height = None
            minf = next((box for box in mdia_children if box[2] == "minf"), None)
            if minf:
                stbl = next((box for box in children(handle, minf[0] + minf[3], minf[1] - minf[3]) if box[2] == "stbl"), None)
                if stbl:
                    stsd = next((box for box in children(handle, stbl[0] + stbl[3], stbl[1] - stbl[3]) if box[2] == "stsd"), None)
                    if stsd:
                        handle.seek(stsd[0] + stsd[3] + 4)
                        entry_count = struct.unpack(">I", handle.read(4))[0]
                        if entry_count:
                            entry_start = handle.tell()
                            entry_size = struct.unpack(">I", handle.read(4))[0]
                            codec = handle.read(4).decode("latin1")
                            if handler == "vide":
                                handle.read(6 + 2 + 16)
                                width, height = struct.unpack(">HH", handle.read(4))
            parsed_tracks.append(
                {
                    "track": index,
                    "handler": handler,
                    "codec": codec,
                    "width": width,
                    "height": height,
                    "timescale": timescale,
                    "durationUnits": duration_units,
                    "durationSeconds": (duration_units / timescale) if timescale else None,
                }
            )
    video = next((track for track in parsed_tracks if track["handler"] == "vide"), None)
    audio = next((track for track in parsed_tracks if track["handler"] == "soun"), None)
    if not video:
        raise ValueError("No video track found in MP4")
    duration_seconds = float(video["durationSeconds"] or 0)
    return {
        "container": "MP4",
        "tracks": parsed_tracks,
        "video": video,
        "audio": audio,
        "durationSeconds": duration_seconds,
        "duration": f"{int(duration_seconds // 60):02d}:{duration_seconds % 60:06.3f}",
        "requirements": {
            "duration5To8Minutes": 300 <= duration_seconds <= 480,
            "mp4Container": True,
            "heightAtLeast1080": int(video["height"] or 0) >= 1080,
            "aiCollaborationAtLeast2Minutes": "not_verified_from_metadata_manual_review_required",
        },
    }


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8", newline="\n")


def file_records(root: Path) -> list[dict[str, Any]]:
    records = []
    for path in sorted((item for item in root.rglob("*") if item.is_file() and item.name != "manifest.json"), key=lambda item: item.relative_to(root).as_posix()):
        relative = path.relative_to(root).as_posix()
        records.append({"path": relative, "bytes": path.stat().st_size, "sha256": sha256_file(path)})
    return records


def build_package_zip(package_root: Path, zip_path: Path, manifest: dict[str, Any]) -> dict[str, Any]:
    manifest_path = package_root / "manifest.json"
    write_text(manifest_path, json.dumps(manifest, ensure_ascii=False, indent=2))
    with zipfile.ZipFile(zip_path, "w", allowZip64=True) as archive:
        for path in sorted((item for item in package_root.rglob("*") if item.is_file()), key=lambda item: item.relative_to(package_root).as_posix()):
            relative = path.relative_to(package_root).as_posix()
            compression = zipfile.ZIP_STORED if path.suffix.lower() == ".mp4" else zipfile.ZIP_DEFLATED
            archive.write(path, relative, compress_type=compression)
    with zipfile.ZipFile(zip_path, "r") as archive:
        bad = archive.testzip()
        if bad is not None:
            raise ValueError(f"ZIP CRC check failed for {bad}")
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise ValueError("ZIP contains duplicate entry names")
        expected = {item["path"]: item for item in manifest["files"]}
        for name, record in expected.items():
            info = archive.getinfo(name)
            if info.file_size != record["bytes"]:
                raise ValueError(f"ZIP size mismatch: {name}")
            if hashlib.sha256(archive.read(name)).hexdigest() != record["sha256"]:
                raise ValueError(f"ZIP content mismatch: {name}")
        if "09-演示视频/视频演示.mp4" not in names:
            raise ValueError("Video is missing from the final ZIP")
        return {
            "entries": len(names),
            "filesVerified": len(expected),
            "zipCrcVerified": True,
            "allManifestFilesVerified": True,
        }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--video", type=Path, default=DEFAULT_VIDEO)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    video_source = args.video.expanduser().resolve()
    output_root = inside_d(args.output)
    if not OLD_MATERIAL.is_dir():
        raise FileNotFoundError(f"Existing material root missing: {OLD_MATERIAL}")
    if not video_source.is_file():
        raise FileNotFoundError(f"Video source missing: {video_source}")
    if video_source.suffix.lower() != ".mp4":
        raise ValueError("The supplied video must have an .mp4 extension")
    if output_root.exists():
        raise FileExistsError(f"Refusing to overwrite an existing output root: {output_root}")

    metadata = parse_mp4(video_source)
    video_sha = sha256_file(video_source)
    video_bytes = video_source.stat().st_size
    timestamp = datetime.now(timezone(timedelta(hours=8))).isoformat()
    output_root.mkdir(parents=True)
    package_root = output_root / "04-完整材料解压版"
    standalone_video_root = output_root / "03-视频材料"
    upload_root = output_root / "01-上传网盘"
    form_root = output_root / "02-表单第6项"
    technical_root = output_root / "03-技术文档备用"

    shutil.copytree(OLD_MATERIAL / "04-完整材料解压版", package_root)
    for source_name, target_root in [
        ("GitHub作品仓库地址.txt", output_root),
        ("表单填写草稿.txt", output_root),
    ]:
        shutil.copy2(OLD_MATERIAL / source_name, output_root / source_name)
    for source_name in ["PathLab-AI-作品介绍文档.pdf", "PathLab-AI-作品介绍文档.pdf.sha256"]:
        form_root.mkdir(parents=True, exist_ok=True)
        shutil.copy2(OLD_MATERIAL / "02-表单第6项" / source_name, form_root / source_name)
    for source_name in ["PathLab-AI-技术文档.pdf", "PathLab-AI-技术文档.pdf.sha256"]:
        technical_root.mkdir(parents=True, exist_ok=True)
        shutil.copy2(OLD_MATERIAL / "03-技术文档备用" / source_name, technical_root / source_name)
    standalone_video_root.mkdir(parents=True)
    upload_root.mkdir(parents=True)
    video_copy = standalone_video_root / video_source.name
    shutil.copy2(video_source, video_copy)
    package_video_root = package_root / "09-演示视频"
    package_video_root.mkdir(parents=True)
    package_video = package_video_root / video_source.name
    shutil.copy2(video_source, package_video)

    metadata_common = {
        "generatedAt": timestamp,
        "sourceFileName": video_source.name,
        "storedVideoPath": "03-视频材料/视频演示.mp4",
        "packageVideoPath": "09-演示视频/视频演示.mp4",
        "bytes": video_bytes,
        "sha256": video_sha,
        **metadata,
        "contentReview": {
            "performed": False,
            "aiCollaborationDuration": "not_verified",
            "note": "文件元数据不能证明视频是否包含至少2分钟真实AI协同过程；提交前须由作者人工观看时间线并确认。",
        },
    }
    metadata_bytes = json.dumps(metadata_common, ensure_ascii=False, indent=2).encode("utf-8") + b"\n"
    (standalone_video_root / "视频元数据.json").write_bytes(metadata_bytes)
    (package_video_root / "视频元数据.json").write_bytes(metadata_bytes)
    checksum_line = f"{video_sha} *{video_source.name}\n"
    write_text(standalone_video_root / f"{video_source.name}.sha256", checksum_line.rstrip())
    write_text(package_video_root / f"{video_source.name}.sha256", checksum_line.rstrip())

    video_readme = f"""# 演示视频提交材料

- 文件：`视频演示.mp4`
- 时长：`{metadata['duration']}`（容器解析值约 {metadata['durationSeconds']:.3f} 秒）
- 分辨率：`{metadata['video']['width']}×{metadata['video']['height']}`
- 视频编码：`{metadata['video']['codec']}`（H.264/AVC 轨道）
- 音频编码：`{metadata['audio']['codec'] if metadata.get('audio') else '未发现音频轨道'}`
- 文件大小：`{video_bytes:,}` 字节
- SHA256：`{video_sha}`

## 已核对

- MP4 容器：通过 ISO-BMFF 结构读取；
- 5–8 分钟：按元数据通过；
- 1080p：高度为 {metadata['video']['height']}，按元数据通过；
- ZIP / 独立副本：已核对 CRC、大小与 SHA256。

## 仍需本人确认

文件元数据无法证明视频里是否有至少 2 分钟真实“AI 协同过程复现展示”。请人工观看时间线确认后，再把视频上传到可公开访问的视频平台，并将真实 `https` 视频地址填写到表单第 7 项。D 盘路径、GitHub 仓库地址和网盘 ZIP 不能直接替代表单第 7 项的视频地址。

本轮只做本地整理；未上传视频、未填写表单、未正式提交。原始桌面文件未移动或删除。
"""
    write_text(standalone_video_root / "视频提交说明.md", video_readme)
    write_text(package_video_root / "视频提交说明.md", video_readme.replace("03-视频材料/视频演示.mp4", "09-演示视频/视频演示.mp4"))

    top_md = f"""# PathLab AI：参赛材料（含演示视频）

核对日期：2026-10-28。执行者：AI。GitHub 已公开上传；本轮只在 D 盘整理视频材料，不上传、不代填或提交表单。

## 直接使用

- **完整作品材料（含视频）**：`01-上传网盘/PathLab-AI-完整作品材料-含视频.zip`
- **演示视频单独文件**：`03-视频材料/视频演示.mp4`
- **作品介绍 PDF（表单第 6 项）**：`02-表单第6项/PathLab-AI-作品介绍文档.pdf`
- **技术文档备用**：`03-技术文档备用/PathLab-AI-技术文档.pdf`
- **GitHub 作品仓库**：{GITHUB_REPOSITORY}
- **GitHub 作者主页**：{GITHUB_PROFILE}

## 视频已核对的文件事实

- 时长：{metadata['duration']}（约 {metadata['durationSeconds']:.3f} 秒）
- 分辨率：{metadata['video']['width']}×{metadata['video']['height']}
- 容器 / 编码：MP4 / {metadata['video']['codec']}（H.264/AVC）
- 文件大小：{video_bytes:,} 字节
- SHA256：`{video_sha}`

文件元数据不能证明是否包含至少 2 分钟真实 AI 协同过程展示；该项必须由本人观看视频内容后确认。本轮未上传视频或填写表单。旧版 `20261025` 不含视频材料包保留不变，仅供历史对照。
"""
    write_text(output_root / "00-提交说明.md", top_md)
    top_html = f"""<!doctype html><html lang=\"zh-CN\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>PathLab AI：含视频参赛材料</title><style>body{{font:16px/1.7 system-ui,\"Microsoft YaHei\",sans-serif;background:#f0f4f8;color:#182c43;margin:0}}main{{max-width:980px;margin:40px auto;padding:28px}}h1{{font-size:32px;line-height:1.3}}p{{color:#40546b}}.alert{{background:#fff4d5;border-left:5px solid #b66d00;padding:18px;border-radius:8px}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px;margin:24px 0}}.card{{background:white;padding:22px;border-radius:12px;border:1px solid #d6e0ec;text-decoration:none;color:inherit;display:block}}.github{{background:#fff;border:2px solid #2364cc;border-radius:12px;padding:20px;margin-top:24px}}.github a{{overflow-wrap:anywhere}}.card:hover{{border-color:#2364cc}}.card:focus-visible{{outline:3px solid #2364cc;outline-offset:3px}}.card b{{display:block;font-size:20px}}.card span{{display:block;color:#4e6176;margin-top:8px}}small{{color:#52677f}}code{{overflow-wrap:anywhere}}@media(max-width:600px){{main{{margin:0;padding:20px}}h1{{font-size:27px}}}}</style><main><small>PathLab AI · 本地材料导航 · 2026-10-28</small><h1>PathLab AI：含演示视频参赛材料</h1><p>完整包保留源码、Prompt、PDF、离线体验、实际截图，并新增作者提供的演示视频。</p><div class=\"alert\">视频文件已在 D 盘本地归档；尚未上传公开视频平台、填写表单或正式提交。AI 协同过程是否达到至少 2 分钟，须本人观看内容确认。</div><section class=\"github\"><h2>GitHub：已上传的作品</h2><p><a href=\"{GITHUB_REPOSITORY}\" target=\"_blank\" rel=\"noopener noreferrer\">{GITHUB_REPOSITORY}</a></p><p>作者主页：<a href=\"{GITHUB_PROFILE}\" target=\"_blank\" rel=\"noopener noreferrer\">{GITHUB_PROFILE}</a></p></section><div class=grid><a class=card href=\"01-%E4%B8%8A%E4%BC%A0%E7%BD%91%E7%9B%98/PathLab-AI-%E5%AE%8C%E6%95%B4%E4%BD%9C%E5%93%81%E6%9D%90%E6%96%99-%E5%90%AB%E8%A7%86%E9%A2%91.zip\"><b>含视频完整 ZIP</b><span>适合上传网盘；同时保留 .sha256 校验文件。</span></a><a class=card href=\"03-%E8%A7%86%E9%A2%91%E6%9D%90%E6%96%99/%E8%A7%86%E9%A2%91%E6%BC%94%E7%A4%BA.mp4\"><b>播放 / 复制演示视频</b><span>{metadata['duration']} · {metadata['video']['width']}×{metadata['video']['height']} · {video_bytes:,} 字节</span></a><a class=card href=\"02-%E8%A1%A8%E5%8D%95%E7%AC%AC6%E9%A1%B9/PathLab-AI-%E4%BD%9C%E5%93%81%E4%BB%8B%E7%BB%8D%E6%96%87%E6%A1%A3.pdf\"><b>作品介绍 · 15 页</b><span>表单第 6 项使用。</span></a><a class=card href=\"04-%E5%AE%8C%E6%95%B4%E6%9D%90%E6%96%99%E8%A7%A3%E5%8E%8B%E7%89%88/00-%E8%AF%84%E5%AE%A1%E5%85%A5%E5%8F%A3.html\"><b>解压后评审入口</b><span>含视频包内的导航与 GitHub 链接。</span></a></div></main></html>"""
    write_text(output_root / "00-提交说明.html", top_html)
    form_draft = f"""仅本人填写，不要把私人报名信息放入公开作品包。

1. UID：
2. 姓名：
3. 学校：
4. 联系手机号：

5. 完整作品文件链接：〔网盘分享链接；附提取码；长期有效；未登录可下载〕
   上传文件：01-上传网盘/PathLab-AI-完整作品材料-含视频.zip
   GitHub补充：{GITHUB_REPOSITORY}

6. 作品介绍附件：02-表单第6项/PathLab-AI-作品介绍文档.pdf

7. 视频地址：〔先将 03-视频材料/视频演示.mp4 上传至可公开访问的视频平台，再填写真实 https 链接〕
   本地文件：03-视频材料/视频演示.mp4
   文件事实：{metadata['duration']}，{metadata['video']['width']}×{metadata['video']['height']}，SHA256 {video_sha}
   AI协同过程至少2分钟：〔本人观看确认后填写〕

预指导表显示截止：2026-10-31 15:00:00。视频项仍需填写公开视频地址；本轮只完成本地整理，未上传网盘、未上传视频、未代填表、未提交比赛。
"""
    write_text(output_root / "表单填写草稿.txt", form_draft)

    package_entry_md = f"""# PathLab AI：作品材料（含演示视频）

**GitHub 作品仓库（评审主入口）：[{GITHUB_REPOSITORY}]({GITHUB_REPOSITORY})**

作者主页（补充）：[{GITHUB_PROFILE}]({GITHUB_PROFILE})。仓库是源码托管地址，不是在线运行网站；两份 PDF 与演示视频另随本包提供。

1. 读 `01-作品介绍/PathLab-AI-作品介绍文档.pdf`（15 页，七项介绍）。
2. 直接打开 `03-离线体验/PathLab AI.html`，完成一轮 L01。
3. 读 `02-技术文档/PathLab-AI-技术文档.pdf`（24 页，三项技术论证）。
4. 查看 `04-源码与演进/源码/README.md` 和 `prompts/submission/README.md`。完整历史由同目录 bundle 保留。
5. 浏览 `05-Prompt证据/历史照片补充/00-照片索引.html`：10 张作者提供的原图，属于局部拍屏补充，不改变原 Prompt 包计数。
6. 播放 `09-演示视频/视频演示.mp4`；文件事实见同目录 `视频元数据.json` 与 `.sha256`。
7. 需要正式截图 / 源稿 / 来源时读 06、07；规则与表单说明在 08。

视频文件已本地归档，元数据显示 `{metadata['duration']}`、`{metadata['video']['width']}×{metadata['video']['height']}`、MP4 / {metadata['video']['codec']}。文件元数据不能证明视频是否包含至少 2 分钟真实 AI 协同过程展示；需由作者人工观看确认。该材料包不等于已经提交预指导或正式省赛，AI 自动检查不等于人工 / 真机通过。
"""
    write_text(package_root / "00-评审入口.md", package_entry_md)
    package_entry_html = f"""<!doctype html><html lang=\"zh-CN\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>PathLab AI：含视频评审材料入口</title><style>body{{font:16px/1.7 system-ui,\"Microsoft YaHei\",sans-serif;background:#f0f4f8;color:#182c43;margin:0}}main{{max-width:980px;margin:40px auto;padding:28px}}h1{{font-size:32px;line-height:1.3}}.alert{{background:#fff4d5;border-left:5px solid #b66d00;padding:18px;border-radius:8px}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px;margin:24px 0}}.card{{background:white;padding:22px;border-radius:12px;border:1px solid #d6e0ec;text-decoration:none;color:inherit;display:block}}.card:hover{{border-color:#2364cc}}.card:focus-visible{{outline:3px solid #2364cc;outline-offset:3px}}.card b{{display:block;font-size:20px}}.card span{{display:block;color:#4e6176;margin-top:8px}}a{{color:#2364cc;overflow-wrap:anywhere}}small{{color:#52677f}}@media(max-width:600px){{main{{margin:0;padding:20px}}h1{{font-size:27px}}}}</style><main><small>PathLab AI · 材料包入口 · 2026-10-28</small><h1>PathLab AI：含演示视频评审材料入口</h1><p>先体验，再核对技术、真实演进与演示视频。</p><div class=alert>视频已随本包归档，但尚未上传公开视频平台或正式提交；AI 协同过程是否达到至少 2 分钟，须人工观看确认。</div><p><strong>GitHub 作品仓库：</strong><a href=\"{GITHUB_REPOSITORY}\" target=\"_blank\" rel=\"noopener noreferrer\">{GITHUB_REPOSITORY}</a><br>作者主页：<a href=\"{GITHUB_PROFILE}\" target=\"_blank\" rel=\"noopener noreferrer\">{GITHUB_PROFILE}</a></p><div class=grid><a class=card href=\"01-%E4%BD%9C%E5%93%81%E4%BB%8B%E7%BB%8D/PathLab-AI-%E4%BD%9C%E5%93%81%E4%BB%8B%E7%BB%8D%E6%96%87%E6%A1%A3.pdf\"><b>作品介绍 · 15 页</b><span>项目、使用、亮点、AI测试、技术与实际截图。</span></a><a class=card href=\"09-%E6%BC%94%E7%A4%BA%E8%A7%86%E9%A2%91/%E8%A7%86%E9%A2%91%E6%BC%94%E7%A4%BA.mp4\"><b>演示视频 · {metadata['duration']}</b><span>{metadata['video']['width']}×{metadata['video']['height']} · MP4 / H.264</span></a><a class=card href=\"03-%E7%A6%BB%E7%BA%BF%E4%BD%93%E9%AA%8C/PathLab%20AI.html\"><b>立即离线体验</b><span>Edge 打开，不需安装、localhost 或模型密钥。</span></a><a class=card href=\"02-%E6%8A%80%E6%9C%AF%E6%96%87%E6%A1%A3/PathLab-AI-%E6%8A%80%E6%9C%AF%E6%96%87%E6%A1%A3.pdf\"><b>技术文档 · 24 页</b><span>意图控制、架构设计和可复现性论证。</span></a><a class=card href=\"04-%E6%BA%90%E7%A0%81%E4%B8%8E%E6%BC%94%E8%BF%9B/%E6%BA%90%E7%A0%81/README.md\"><b>源码与复现指南</b><span>锁定依赖、环境模板、默认零密钥闭环。</span></a><a class=card href=\"05-Prompt%E8%AF%81%E6%8D%AE/%E5%8E%86%E5%8F%B2%E7%85%A7%E7%89%87%E8%A1%A5%E5%85%85/00-%E7%85%A7%E7%89%87%E7%B4%A2%E5%BC%95.html\"><b>Prompt 历史照片 · 10 张</b><span>作者提供的局部拍屏原图；保留原字节，不冒充完整对话。</span></a></div></main></html>"""
    write_text(package_root / "00-评审入口.html", package_entry_html)

    handoff = f"""# PathLab AI：提交材料与表单填写说明（含视频版）

核对日期：2026-10-28。执行者：AI。GitHub 已公开上传；本轮只在 D 盘整理作者提供的视频，不再次上传、不代填或提交表单。

## 文件对应关系

| 位置 | 用途 | 本版材料 |
| --- | --- | --- |
| WPS 第 5 项 | 上传到主流网盘，填写长期有效分享链接和提取码 | `01-上传网盘/PathLab-AI-完整作品材料-含视频.zip` |
| WPS 第 6 项 | 作品介绍附件 | `02-表单第6项/PathLab-AI-作品介绍文档.pdf` |
| WPS 第 7 项 | 上传到公开视频平台后填写真实 `https` 地址 | `09-演示视频/视频演示.mp4`；视频文件本身已随本包归档 |
| 代码仓库 | 评审查看源码与真实演进 | {GITHUB_REPOSITORY} |

## 视频文件事实

- 时长：`{metadata['duration']}`（约 {metadata['durationSeconds']:.3f} 秒）
- 分辨率：`{metadata['video']['width']}×{metadata['video']['height']}`
- 容器 / 编码：MP4 / {metadata['video']['codec']}（H.264/AVC）
- 文件大小：`{video_bytes:,}` 字节
- SHA256：`{video_sha}`

时长、MP4 容器和 1080p 高度已由文件结构读取核对。文件元数据不能证明是否有至少 2 分钟真实 AI 协同过程展示，须作者人工观看视频后确认；本轮不把 AI 自动检查或文件归档冒充人工 / 真机验收。

## 提交前动作

1. 人工从头观看 `09-演示视频/视频演示.mp4`，确认功能演示与至少 2 分钟 AI 协同过程复现均真实存在。
2. 将视频上传到可公开访问的平台，复制直接可访问的 `https` 视频地址，填写 WPS 第 7 项；D 盘路径、GitHub 仓库地址和网盘 ZIP 不能替代该字段。
3. 将 `PathLab-AI-完整作品材料-含视频.zip` 上传到主流网盘，未登录窗口确认能下载，并按 `.sha256` 校验。
4. 本轮没有上传、填表或正式提交；旧的 20261025 不含视频包保持不变。
"""
    write_text(package_root / "08-规则与提交说明" / "submission-handoff-20261025.md", handoff)

    manifest = {
        "format": "pathlab-submission-video/v1",
        "generatedAt": timestamp,
        "sourceCommit": SOURCE_COMMIT,
        "sourceHistoryCount": SOURCE_HISTORY_COUNT,
        "bundleRef": "refs/remotes/origin/main",
        "containsVideo": True,
        "video": metadata_common,
        "prompt": {"frozenArchive": "PathLab-AI-Prompt-evidence-20261025-093233.zip", "snapshots": 9, "uniqueVisibleMessages": 38},
        "pdfs": [{"title": "作品介绍文档", "pages": 15, "rewritten": False}, {"title": "技术文档", "pages": 24, "rewritten": False}],
        "screenshots": {"count": 9, "newCaptureThisRound": False, "physicalDevice": False},
        "publicationPerformed": False,
        "formSubmitted": False,
        "files": file_records(package_root),
    }
    zip_path = upload_root / "PathLab-AI-完整作品材料-含视频.zip"
    zip_result = build_package_zip(package_root, zip_path, manifest)
    zip_sha = sha256_file(zip_path)
    write_text(upload_root / f"{zip_path.name}.sha256", f"{zip_sha} *{zip_path.name}")

    verification = {
        "archive": str(zip_path),
        "bytes": zip_path.stat().st_size,
        "sha256": zip_sha,
        **zip_result,
        "containsVideo": True,
        "video": {"path": str(video_copy), "packagePath": "09-演示视频/视频演示.mp4", "bytes": video_bytes, "sha256": video_sha, "duration": metadata["duration"], "durationSeconds": metadata["durationSeconds"], "width": metadata["video"]["width"], "height": metadata["video"]["height"], "codec": metadata["video"]["codec"], "contentReviewPerformed": False},
        "sourceVideoNotModified": True,
        "sourceArchivePreserved": str(OLD_MATERIAL / "01-上传网盘" / "PathLab-AI-完整作品材料-不含视频.zip"),
        "sourceArchiveSha256": sha256_file(OLD_MATERIAL / "01-上传网盘" / "PathLab-AI-完整作品材料-不含视频.zip"),
        "sourceCommit": SOURCE_COMMIT,
        "publicationPerformed": False,
        "formSubmitted": False,
        "manualAcceptance": False,
        "notes": ["ZIP was built locally on D: from the previous non-video material plus the copied video.", "The 2-minute AI-collaboration requirement remains a manual content check; metadata cannot prove it.", "No upload, push, form entry or official submission was performed."],
    }
    write_text(output_root / "packet-build-verification.json", json.dumps(verification, ensure_ascii=False, indent=2))
    print(json.dumps({"outputRoot": str(output_root), "videoSha256": video_sha, "zip": str(zip_path), "zipBytes": zip_path.stat().st_size, "zipSha256": zip_sha, "duration": metadata["duration"], "resolution": f"{metadata['video']['width']}x{metadata['video']['height']}", **zip_result}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
