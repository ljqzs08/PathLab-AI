"""E041: verify the selected formal Release without credentials or browser cookies."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlsplit, unquote
import argparse
import datetime
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
REPO = "ljqzs08/PathLab-AI"
TAG = "formal-submission-20261115"
SOURCE_HEAD = "955df39c5db78bf07614486018d6b52b6ea07b69"
ZIP_NAME = "PathLab-AI-formal-submission-20261115.zip"
LOCAL_ZIP_NAME = "PathLab-AI-正式参赛材料-20261115.zip"
EXPECTED_SHA = "64fbca276df0b35e7e8d10d11d426a2627b440c1ba07d1aa8496acf235207d25"
PACKET = ROOT / "delivery/PathLab-AI-正式参赛文件-20261115"
CACHE = ROOT / ".cache/github-formal-20261115/download"


def fetch(url):
    # Deliberately no auth, credential helper, cookie jar or GH_CONFIG_DIR lookup.
    return urlopen(Request(url, headers={"User-Agent": "PathLab-formal-anonymous-verifier",
                                       "Accept": "application/vnd.github+json"}), timeout=180)


def api(path):
    with fetch("https://api.github.com/repos/" + REPO + ("/" + path if path else "")) as response:
        return json.load(response)


def sha(path):
    h = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(4 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def verify(expected_main):
    assert ROOT.drive.upper() == "D:", "All generated files must stay on D"
    assert CACHE.resolve().is_relative_to(ROOT.resolve())
    CACHE.mkdir(parents=True, exist_ok=True)
    repo = api("")
    assert repo["full_name"] == REPO and repo["private"] is False
    assert repo["default_branch"] == "main"
    main = api("git/ref/heads/main")["object"]["sha"]
    assert main == expected_main, ("remote main mismatch", main, expected_main)
    release = api("releases/tags/" + TAG)
    assert not release["draft"] and not release["prerelease"]
    assert api("releases/latest")["id"] == release["id"]
    tag = api("git/ref/tags/" + TAG)["object"]
    while tag["type"] == "tag":
        tag = api("git/tags/" + tag["sha"])["object"]
    assert tag["type"] == "commit" and tag["sha"] == SOURCE_HEAD
    expected = {
        ZIP_NAME: PACKET / "提交压缩包" / LOCAL_ZIP_NAME,
        ZIP_NAME + ".sha256": PACKET / "提交压缩包" / (LOCAL_ZIP_NAME + ".sha256"),
        "PathLab-AI-formal-verification-20261115.json": PACKET / "最终校验回执.json",
    }
    assets = {a["name"]: a for a in release["assets"]}
    assert set(assets) == set(expected), ("asset set mismatch", list(assets))
    verified = []
    for name, original in expected.items():
        asset = assets[name]
        assert asset["state"] == "uploaded" and asset["size"] == original.stat().st_size
        url = asset["browser_download_url"]
        assert urlsplit(url).scheme == "https" and urlsplit(url).hostname == "github.com"
        assert unquote(urlsplit(url).path).startswith("/" + REPO + "/releases/download/" + TAG + "/")
        downloaded = CACHE / name
        h = hashlib.sha256()
        count = 0
        with fetch(url) as response, downloaded.open("wb") as target:
            assert response.status == 200
            for chunk in iter(lambda: response.read(4 * 1024 * 1024), b""):
                h.update(chunk)
                target.write(chunk)
                count += len(chunk)
        assert count == original.stat().st_size
        assert h.hexdigest() == sha(original), ("download hash mismatch", name)
        digest = asset.get("digest")
        if digest:
            assert digest == "sha256:" + h.hexdigest()
        verified.append({"id": asset["id"], "name": name, "url": url,
                         "bytes": count, "sha256": h.hexdigest(), "serverDigest": digest,
                         "downloadedWithoutCredentials": True, "exactLocalBytes": True})
    downloaded_zip = CACHE / ZIP_NAME
    assert sha(downloaded_zip) == EXPECTED_SHA
    assert (CACHE / (ZIP_NAME + ".sha256")).read_text("utf-8").split()[0] == EXPECTED_SHA
    manifest = json.loads((PACKET / "manifest.json").read_text("utf-8"))
    by = {row["path"]: row for row in manifest["files"]}
    with zipfile.ZipFile(downloaded_zip) as archive:
        names = archive.namelist()
        assert len(names) == len(set(names)) == 775
        assert set(names) == set(by) | {"manifest.json"}
        assert archive.testzip() is None
        for name, row in by.items():
            data = archive.read(name)
            assert len(data) == row["bytes"] and hashlib.sha256(data).hexdigest() == row["sha256"]
        assert archive.read("manifest.json") == (PACKET / "manifest.json").read_bytes()
    result = {
        "schemaVersion": 1,
        "checkedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "executor": "AI",
        "authentication": "None: direct Python HTTPS requests, no Authorization header or browser cookies",
        "repository": REPO, "public": True, "remoteMainAtVerification": main,
        "releaseId": release["id"], "tag": TAG, "tagCommit": tag["sha"],
        "releaseUrl": release["html_url"], "publishedAt": release["published_at"],
        "latestReleaseVerified": True, "draft": False, "prerelease": False,
        "assets": verified,
        "zipBytes": downloaded_zip.stat().st_size, "zipSha256": EXPECTED_SHA,
        "zipEntries": len(names), "manifestContentFiles": len(by),
        "downloadedZipCrcPassed": True, "everyManifestEntrySha256Passed": True,
        "scope": "Exact original E040 formal packet publicly downloaded and verified. Main may later receive this receipt; frozen Release/source/ZIP are not rewritten. Not website deployment, contest submission, product regression, human/device acceptance or teaching-effect validation.",
    }
    output = ROOT / "docs/evidence/github-formal-publication-20261115.json"
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--expected-main", required=True)
    verify(parser.parse_args().expected_main)
