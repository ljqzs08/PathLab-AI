"""Read-only end-to-end material validation; temporary extraction stays on D drive.

Does not install dependencies, call an AI API, upload files or claim product regression.
"""
from __future__ import annotations
import argparse
from datetime import datetime
import hashlib
from html.parser import HTMLParser
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote
from uuid import uuid4
import zipfile

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("packet_builder", ROOT / "scripts/build-submission-packet.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def run(*args):
    return subprocess.run(list(args), check=True, capture_output=True).stdout.decode("utf-8-sig").strip()


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.hrefs.extend(v for k, v in attrs if k == "href")


def validate(archive: Path, output: Path) -> dict:
    archive = builder.inside(archive)
    result = builder.verify_zip(archive)
    work = builder.inside(ROOT / ".cache" / ("submission-validation-20261025-" + uuid4().hex[:8]))
    work.mkdir(parents=True)
    extracted = work / "extracted"
    extracted.mkdir()
    with zipfile.ZipFile(archive) as z:
        z.extractall(extracted)
        manifest = json.loads(z.read("manifest.json"))
        committed = zipfile.ZipFile(io.BytesIO(builder.git("archive", "--format=zip", builder.SOURCE)))
        originals = {i.filename: committed.read(i) for i in committed.infolist() if not i.is_dir()}
        actual = {n.removeprefix("04-源码与演进/源码/"): z.read(n) for n in z.namelist() if n.startswith("04-源码与演进/源码/")}
        if originals.keys() != actual.keys() or any(actual[n] != data for n, data in originals.items()):
            raise ValueError("Source export does not match committed archive byte-for-byte")
        result["sourceFilesMatchedGitObjects"] = len(actual)
        pdfs = []
        for title, folder, expected_pages in builder.PDFS:
            filename = f"{folder}/PathLab-AI-{title}.pdf"
            reader = PdfReader(io.BytesIO(z.read(filename)), strict=True)
            if reader.is_encrypted or len(reader.pages) != expected_pages:
                raise ValueError("PDF pages or encryption mismatch")
            if any(key in reader.trailer["/Root"] for key in ("/OpenAction", "/AA", "/JavaScript")):
                raise ValueError("Unexpected PDF action")
            page_chars = []
            for page in reader.pages:
                content = page.extract_text() or ""
                if len(content) < 100 or "\ufffd" in content or "\u25a0" in content:
                    raise ValueError("PDF text extraction issue")
                if abs(float(page.mediabox.width) - 595.276) > 2 or abs(float(page.mediabox.height) - 841.89) > 2:
                    raise ValueError("PDF is not A4")
                page_chars.append(len(content))
            pdfs.append({"title": title, "pages": len(reader.pages), "A4": True, "encrypted": False,
                         "textCharactersEachPage": page_chars, "bytesUnchanged": True, "sha256": sha(z.read(filename)),
                         "newVisualReviewPerformed": False, "visualReviewScope": "Original PDFs had archived AI page-by-page review; unchanged copies checked structurally this round"})
        result["pdfs"] = pdfs
        captures = json.loads(z.read("06-实际截图/capture-manifest.json"))
        for image in captures["screenshots"]:
            data = z.read("06-实际截图/" + Path(image["file"]).name)
            if sha(data) != image["sha256"]:
                raise ValueError("Screenshot hash mismatch")
        if captures["source"]["sha256"] != sha(z.read("03-离线体验/PathLab AI.html")):
            raise ValueError("Screenshot source HTML differs from packet")
        result["officialScreenshotHashesMatched"] = len(captures["screenshots"])
        secret_patterns = [re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
                           re.compile(rb"\bgh[pousr]_[A-Za-z0-9]{30,}\b"), re.compile(rb"\bsk-[A-Za-z0-9_-]{24,}\b")]
        suspicious = []
        scanned = 0
        for name in z.namelist():
            if Path(name).suffix.lower() in (".md", ".json", ".jsonl", ".ts", ".tsx", ".mjs", ".cjs", ".ps1", ".py", ".txt", ".example"):
                scanned += 1
                if any(pattern.search(z.read(name)) for pattern in secret_patterns):
                    suspicious.append(name)
        if suspicious:
            raise ValueError("Potential credential pattern in: " + ", ".join(suspicious))
        result["secretPatternScan"] = {"textFilesScanned": scanned, "matchedFiles": [], "limit": "Heuristic common-token patterns, not a security audit; existing public Git history is retained intact"}
    source = extracted / "04-源码与演进/源码"
    bundle = extracted / "04-源码与演进/PathLab-AI-full-history-e438363.bundle"
    heads = run("git", "bundle", "list-heads", str(bundle))
    if heads != builder.SOURCE + " " + builder.SOURCE_REF:
        raise ValueError("Bundle contains unexpected refs")
    restored = work / "restored-history"
    run("git", "init", "--quiet", str(restored))
    run("git", "-C", str(restored), "bundle", "verify", str(bundle))
    run("git", "-C", str(restored), "-c", "credential.helper=", "fetch", str(bundle), builder.SOURCE_REF + ":refs/heads/main")
    run("git", "-C", str(restored), "checkout", "main")
    expected_history = builder.git("rev-list", "--reverse", builder.SOURCE).decode().strip()
    restored_history = run("git", "-C", str(restored), "rev-list", "--reverse", "HEAD")
    if restored_history != expected_history or run("git", "-C", str(restored), "rev-parse", "HEAD") != builder.SOURCE:
        raise ValueError("Restored history mismatch")
    expected_parents = builder.git("log", "--format=%H %P", builder.SOURCE).decode().strip()
    if run("git", "-C", str(restored), "log", "--format=%H %P", "HEAD") != expected_parents:
        raise ValueError("Restored parent graph mismatch")
    run("git", "-C", str(restored), "fsck", "--full")
    result["bundleRestoration"] = {"fullHistoryCount": len(restored_history.splitlines()), "allCommitsAndParentsMatch": True,
                                  "freshRepositoryFsck": "pass", "requiresNetwork": False, "sourceCommit": builder.SOURCE}
    link_count = 0
    for page in (extracted / "00-评审入口.html", archive.parents[1] / "00-提交说明.html"):
        parser = Links()
        parser.feed(page.read_text(encoding="utf-8"))
        for href in parser.hrefs:
            if "://" in href or href.startswith("#"):
                continue
            target = (page.parent / unquote(href.split("#")[0])).resolve()
            builder.inside(target)
            if not target.is_file():
                raise ValueError("Broken local navigation: " + href)
            link_count += 1
    result["localNavigationLinksResolved"] = link_count
    result["temporaryWorkDirectory"] = str(work)
    result["extractedHtml"] = str(extracted / "03-离线体验/PathLab AI.html")
    result["checkedAt"] = datetime.now().astimezone().isoformat()
    result["executor"] = "AI material integrity validation; not human or physical-device acceptance"
    result["productRegressionSuiteRerun"] = False
    result["newScreenshotGenerated"] = False
    result["publicationPerformed"] = False
    output = builder.inside(output)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, default=ROOT / "delivery" / builder.BASENAME / "01-上传网盘" / builder.PACKET)
    parser.add_argument("--output", type=Path, default=ROOT / "docs/evidence/submission-packet-validation-20261025.json")
    args = parser.parse_args()
    os.environ["TEMP"] = os.environ["TMP"] = str(ROOT / ".cache/tmp")
    print(json.dumps(validate(args.archive, args.output), ensure_ascii=False, indent=2))
