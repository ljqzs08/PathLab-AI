"""Boundary and failure checks for the non-video submission packet builder."""
from pathlib import Path
import hashlib
import importlib.util
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("packet_builder", ROOT / "scripts/build-submission-packet.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class PacketSafetyTests(unittest.TestCase):
    def test_project_path_accepted(self):
        self.assertEqual(builder.inside(ROOT / "delivery/example.zip"), ROOT / "delivery/example.zip")

    def test_c_drive_output_rejected(self):
        with self.assertRaises(ValueError):
            builder.inside(Path("C:/temp/example.zip"))

    def test_outside_project_rejected(self):
        with self.assertRaises(ValueError):
            builder.inside(ROOT.parent / "outside.zip")

    def test_valid_unicode_names(self):
        builder.safe_name("01-作品介绍/PathLab-AI-作品介绍文档.pdf")

    def test_only_env_template_is_allowed(self):
        builder.safe_name("source/PathLab-AI/.env.example")
        with self.assertRaises(ValueError):
            builder.safe_name("source/PathLab-AI/.env.local")

    def test_unsafe_and_private_paths_rejected(self):
        for name in ("../escape", "/absolute", "a/../b", "a\\b", "C:/x", "a/.git/config", "a/node_modules/pkg.js", "a/.cache/log", "a/private/original.jsonl", "a/.env", "a/movie.mp4", "a/movie.webm"):
            with self.subTest(name=name):
                with self.assertRaises(ValueError):
                    builder.safe_name(name)

    def test_existing_output_is_not_overwritten(self):
        with self.assertRaises(FileExistsError):
            builder.build(ROOT / "delivery")

    def test_html_navigation_links_github_without_automatic_requests(self):
        data = builder.page("作品", "说明", [("文档", "打开", "01-作品介绍/a.pdf")], "视频待补").decode()
        self.assertNotIn("<script", data)
        self.assertEqual(data.count('href="' + builder.GITHUB_REPOSITORY + '"'), 1)
        self.assertEqual(data.count('href="' + builder.GITHUB_PROFILE + '"'), 1)
        self.assertEqual(data.count('rel="noopener noreferrer"'), 2)
        self.assertNotIn("<iframe", data)
        self.assertNotIn("<img", data)
        self.assertIn("本页不会自动联网", data)
        self.assertIn("lang=\"zh-CN\"", data)
        self.assertIn("%E4%BD%9C", data)

    def test_copyable_link_file_distinguishes_repository_and_profile(self):
        data = builder.GITHUB_LINK_TEXT.decode("utf-8")
        self.assertIn("作品仓库（评审主入口）：" + builder.GITHUB_REPOSITORY, data)
        self.assertIn("作者 GitHub 主页（补充）：" + builder.GITHUB_PROFILE, data)
        self.assertIn(builder.SOURCE, data)
        self.assertIn("不是在线运行网站", data)
        self.assertIn("没有再次上传或推送", data)

    def test_photo_allowlist_and_original_bytes(self):
        payload, metadata = builder.photo_payload()
        self.assertEqual(len(builder.PROMPT_PHOTOS), 10)
        self.assertEqual(metadata["count"], 10)
        self.assertEqual(len(payload), 13)
        self.assertEqual(len({r["filename"] for r in metadata["photos"]}), 10)
        for r in metadata["photos"]:
            original = (ROOT / r["source"]).read_bytes()
            self.assertEqual(payload[builder.PHOTO_FOLDER + "/" + r["filename"]], original)
            self.assertEqual(r["sha256"], builder.digest(original))
            self.assertEqual(r["format"], "JPEG")
            self.assertGreater(r["width"], 1600)
            self.assertGreater(r["height"], 1200)
        for name in payload:
            builder.safe_name(name)

    def test_photo_scope_does_not_inflate_core_evidence(self):
        payload, metadata = builder.photo_payload()
        self.assertFalse(metadata["completeConversationExport"])
        self.assertFalse(metadata["addsCoreSnapshotOrMessageCount"])
        self.assertTrue(metadata["originalBytesPreserved"])
        self.assertIn("9 轮 / 38 条", metadata["scope"])
        self.assertIn("旧要求", metadata["scope"])
        page = payload[builder.PHOTO_INDEX].decode("utf-8")
        self.assertEqual(page.count("<img "), 10)
        self.assertNotIn("<script", page)
        self.assertNotIn("<iframe", page)
        self.assertNotIn('src="http', page)

    def test_photo_gallery_escapes_titles_and_filenames(self):
        data = builder.photo_gallery([{"sequence": 1, "filename": '<file>".jpg',
            "topic": "<unsafe>", "description": "a & b", "width": 1702,
            "height": 1276, "bytes": 100, "sha256": "a" * 64}]).decode("utf-8")
        self.assertNotIn("<unsafe>", data)
        self.assertIn("&lt;unsafe&gt;", data)
        self.assertIn("a &amp; b", data)
        self.assertIn("%3Cfile%3E%22.jpg", data)
        self.assertNotIn('href="<file>', data)

    def test_digest_is_sha256(self):
        self.assertEqual(builder.digest(b"PathLab"), hashlib.sha256(b"PathLab").hexdigest())

    def test_generated_page_escapes_untrusted_text(self):
        data = builder.page("<title>", "&subtitle", [("<b>", "&desc", "a.pdf")], "<warning>").decode()
        self.assertNotIn("<warning>", data)
        self.assertIn("&lt;warning&gt;", data)
        self.assertIn("&lt;title&gt;", data)


if __name__ == "__main__":
    unittest.main(verbosity=2)
