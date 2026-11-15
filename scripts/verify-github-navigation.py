"""E042: read-only navigation, immutable-artifact and optional public GitHub checks."""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, quote, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "docs/github-navigation.json").read_text(encoding="utf-8-sig"))
BEFORE = json.loads((ROOT / "docs/evidence/github-organization-before-20261115.json").read_text(encoding="utf-8-sig"))
API = "https://api.github.com/repos/ljqzs08/PathLab-AI"
CHECKS: list[dict] = []

def check(name, actual, expected=True):
    ok = actual == expected
    CHECKS.append({"name": name, "ok": ok})
    if not ok:
        raise AssertionError(f"{name}: got {actual!r}, expected {expected!r}")

def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)

def digest(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()

def api(suffix=""):
    request = Request(API + suffix, headers={"User-Agent": "PathLab-navigation-public-verifier", "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"})
    with urlopen(request, timeout=60) as response:
        return json.load(response)

def lf(text):
    return text.replace("\r\n", "\n").rstrip() + "\n"

def assets(release):
    return sorted((item["id"], item["name"], item["size"], item.get("digest")) for item in release["assets"])

def local_checks():
    check("workspace stays on D", ROOT.drive.upper(), "D:")
    for name in CONFIG["navigationFiles"]:
        file = ROOT / name
        check(f"navigation exists {name}", file.is_file())
        text = file.read_text(encoding="utf-8-sig")
        check(f"UTF8 valid {name}", "\ufffd" not in text)
        # Check links outside fenced command examples. Remote resources are checked separately.
        clean = re.sub(r"(?ms)^(```|~~~).*?^\1[^\n]*$", "", text)
        for target in re.findall(r"\]\(([^)]+)\)", clean):
            target = target.strip().split(' "', 1)[0]
            if target.startswith(("https:", "http:", "mailto:", "#", "codex:")):
                continue
            path = unquote(urlsplit(target).path)
            check(f"local link {name} -> {target}", (file.parent / path).exists())
    readme = (ROOT / "README.md").read_text(encoding="utf-8-sig")
    for phrase in ["formal-submission-20261115", "00-打开最新参赛材料.html", "Source code (zip)", "历史版本", "E037", "E038", "不是已部署", "PathLab_AI_v4_optimized_final.html"]:
        check(f"readme identifies {phrase}", phrase in readme)
    check("no competing full v2/v3 section on landing page", not re.search(r"^## v[23]", readme, re.M))
    check("formal ZIP bytes", (ROOT / CONFIG["formalZip"]).stat().st_size, CONFIG["formalZipBytes"])
    check("formal ZIP SHA256", digest(ROOT / CONFIG["formalZip"]), CONFIG["formalZipSha256"])
    check("current HTML SHA256", digest(ROOT / "PathLab_AI_v4_optimized_final.html"), CONFIG["currentHtmlSha256"])
    protected = git("-c", "core.quotepath=false", "diff", "--name-only", CONFIG["baselineMainSha"], "--", "PathLab-AI", "output", "Prompt历史快照", "PathLab_AI_v4_optimized_final.html").decode("utf-8").splitlines()
    check("product/code/original output unaffected", set(protected).issubset({"PathLab-AI/README.md", "output/README.md", "Prompt历史快照/README.md"}))
    check("no tracked deletion", not git("diff", "--name-only", "--diff-filter=D", CONFIG["baselineMainSha"]).strip())
    originals = {item["tag_name"]: item for item in BEFORE["releases"]}
    for release in CONFIG["releases"]:
        note = (ROOT / release["bodyPath"]).read_text(encoding="utf-8-sig")
        check(f"release current pointer {release['tag']}", "formal-submission-20261115" in note or release["latest"])
        if not release["latest"]:
            check(f"original historical body preserved {release['tag']}", lf(originals[release["tag"]]["body"]) in lf(note))
            check(f"historical title {release['tag']}", "历史" in release["title"])
    # Authentic visible text only, compared to read-only original session rows.
    source = Path(r"C:\Users\LJQ\.codex\sessions\2026\11\15\rollout-2026-11-15T10-27-26-01a1dd07-eb8f-7d00-b249-b50750f5234d.jsonl")
    raw = source.read_text(encoding="utf-8-sig").splitlines()
    for stem in ["formal-submission-github-scope", "github-history-scope", "github-reorganization"]:
        name = f"prompts/sessions/2026-11-15-{stem}.jsonl"
        rows = [json.loads(line) for line in (ROOT / name).read_text(encoding="utf-8-sig").splitlines() if line.strip()]
        for row in rows:
            original = json.loads(raw[row["sourceLine"] - 1])["payload"]
            text = "\n".join(item["text"] for item in original["content"] if item["type"] in {"input_text", "output_text", "text"})
            check(f"prompt original text {stem}:{row['sourceLine']}", row["text"], text)
            check(f"prompt text SHA {stem}:{row['sourceLine']}", row["textSha256"], hashlib.sha256(text.encode("utf-8")).hexdigest())
            check(f"prompt role {stem}:{row['sourceLine']}", row["role"], original["role"])
        if stem != "github-reorganization":
            check(f"real final captured {stem}", any(row["role"] == "assistant" and row["phase"] in {"final", "final_answer"} for row in rows))
    return {"zipSha256": CONFIG["formalZipSha256"], "htmlSha256": CONFIG["currentHtmlSha256"], "scope": "Navigation and original-byte checks, not product regression; current final reply captured only after persistence."}

def public_checks(expected_main):
    repo = api()
    for field in ["description", "homepage"]:
        check(f"public About {field}", repo[field], CONFIG[field])
    check("public topics", sorted(repo["topics"]), sorted(CONFIG["topics"]))
    check("public visibility unchanged", repo["visibility"], BEFORE["repository"]["visibility"])
    check("public default branch unchanged", repo["default_branch"], BEFORE["repository"]["default_branch"])
    main = api("/git/ref/heads/main")["object"]["sha"]
    check("expected public main", main, expected_main)
    check("latest stays formal", api("/releases/latest")["tag_name"], CONFIG["formalTag"])
    remote_releases = {item["tag_name"]: item for item in api("/releases?per_page=100")}
    old_releases = {item["tag_name"]: item for item in BEFORE["releases"]}
    check("same release set; none deleted", sorted(remote_releases), sorted(old_releases))
    for release in CONFIG["releases"]:
        remote = remote_releases[release["tag"]]
        check(f"release ID unchanged {release['tag']}", remote["id"], release["id"])
        check(f"release title {release['tag']}", remote["name"], release["title"])
        check(f"release notes {release['tag']} (LF normalized)", lf(remote["body"]), lf((ROOT / release["bodyPath"]).read_text(encoding="utf-8-sig")))
        check(f"assets unchanged {release['tag']}", assets(remote), assets(old_releases[release["tag"]]))
        for flag in ["draft", "prerelease"]:
            check(f"release {flag} unchanged {release['tag']}", remote[flag], old_releases[release["tag"]][flag])
    for tag in ["v2.0.0", "v3.0.0", "prompt-evidence-20261025", CONFIG["formalTag"]]:
        remote = api("/git/ref/tags/" + quote(tag, safe=""))["object"]["sha"]
        local = git("rev-parse", "refs/tags/" + tag).decode().strip()
        check(f"tag local original {tag}", local, CONFIG["expectedTagObjects"][tag])
        check(f"tag object unchanged {tag}", remote, CONFIG["expectedTagObjects"][tag])
    # Verify every file changed in the publication commit, plus all navigation/note files.
    changed = git("-c", "core.quotepath=false", "diff-tree", "--no-commit-id", "--name-only", "-r", expected_main).decode("utf-8").splitlines()
    names = sorted(set(changed + CONFIG["navigationFiles"] + [rel["bodyPath"] for rel in CONFIG["releases"]]))
    tree = api("/git/trees/" + expected_main + "?recursive=1")
    check("public Git tree not truncated", not tree.get("truncated", False))
    remote_blobs = {entry["path"]: entry["sha"] for entry in tree["tree"] if entry["type"] == "blob"}
    for name in names:
        local_blob = git("rev-parse", expected_main + ":" + name).decode().strip()
        check(f"published Git blob {name}", remote_blobs.get(name), local_blob)
    # Raw readme is fetched by commit without cookies or Authorization.
    raw_url = f"https://raw.githubusercontent.com/ljqzs08/PathLab-AI/{expected_main}/README.md"
    with urlopen(Request(raw_url, headers={"User-Agent": "PathLab-navigation-public-verifier"}), timeout=60) as response:
        check("anonymous README exact Git bytes", response.read(), git("show", expected_main + ":README.md"))
    return {"mainSha": main, "releaseCount": len(remote_releases), "allReleaseAssetFingerprintsUnchanged": True, "oldTagObjectsUnchanged": True, "sameVisibility": True, "authenticated": False, "fullAssetRedownload": False, "publishedFileCount": len(names)}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--public", action="store_true")
    parser.add_argument("--expected-main")
    args = parser.parse_args()
    if args.public and not args.expected_main:
        parser.error("--public requires an actual --expected-main commit")
    label = "public" if args.public else "local"
    result = {"checkedAt": datetime.now(timezone.utc).isoformat(), "executor": "AI", "mode": label, "productRegressionRerun": False}
    error = None
    try:
        result["local"] = local_checks()
        if args.public:
            result["public"] = public_checks(args.expected_main)
    except Exception as exc:
        error = exc
        result["failure"] = str(exc)
    result["checks"] = CHECKS
    result["passed"] = sum(item["ok"] for item in CHECKS)
    result["failed"] = sum(not item["ok"] for item in CHECKS)
    result["ok"] = error is None
    output = ROOT / f"docs/evidence/github-navigation-{label}-20261115.json"
    # Keep any real failed attempts rather than overwriting them with a success.
    if error is not None:
        output = output.with_name(output.stem + "-failure-" + datetime.now(timezone.utc).strftime("%H%M%S") + ".json")
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"ok": result["ok"], "passed": result["passed"], "failed": result["failed"], "receipt": str(output), "failure": str(error) if error else None}, ensure_ascii=False))
    return 1 if error else 0

if __name__ == "__main__":
    sys.exit(main())
