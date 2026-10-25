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

    def test_html_navigation_is_local_and_scriptless(self):
        data = builder.page("作品", "说明", [("文档", "打开", "01-作品介绍/a.pdf")], "视频待补").decode()
        self.assertNotIn("<script", data)
        self.assertNotIn("https://", data)
        self.assertIn("lang=\"zh-CN\"", data)
        self.assertIn("%E4%BD%9C", data)

    def test_digest_is_sha256(self):
        self.assertEqual(builder.digest(b"PathLab"), hashlib.sha256(b"PathLab").hexdigest())

    def test_generated_page_escapes_untrusted_text(self):
        data = builder.page("<title>", "&subtitle", [("<b>", "&desc", "a.pdf")], "<warning>").decode()
        self.assertNotIn("<warning>", data)
        self.assertIn("&lt;warning&gt;", data)
        self.assertIn("&lt;title&gt;", data)


if __name__ == "__main__":
    unittest.main(verbosity=2)
