"""Small E040 packaging tests; no product or historical delivery writes."""
from pathlib import Path
import importlib.util,tempfile,unittest,os
ROOT=Path(__file__).resolve().parents[1]
TMP=ROOT/'.cache/formal-submission-20261115'; TMP.mkdir(parents=True,exist_ok=True)
os.environ['TEMP']=os.environ['TMP']=str(TMP)
spec=importlib.util.spec_from_file_location('formal_builder',ROOT/'scripts/build-formal-submission.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class PackagingTests(unittest.TestCase):
 def test_relative_member(self): self.assertEqual(str(m.safe_member('prompts/sessions/a.md')),'prompts/sessions/a.md')
 def test_unsafe_members(self):
  for name in ['../a','/a','a/../../b','C:/a','a\\b','a:b']:
   with self.subTest(name=name),self.assertRaises(ValueError): m.safe_member(name)
 def test_manifest_coverage_and_external_receipt(self):
  with tempfile.TemporaryDirectory(dir=TMP) as d:
   base=Path(d)
   for name in ['manifest.json','a.txt','最终校验回执.json','nested/manifest.json','nested/最终校验回执.json','提交压缩包/a.zip','nested/提交压缩包/evidence.txt']:
    p=base/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('test',encoding='utf-8')
   selected={p.relative_to(base).as_posix() for p in m.manifest_files(base)}
   self.assertEqual(selected,{'a.txt','nested/manifest.json','nested/最终校验回执.json','nested/提交压缩包/evidence.txt'})
   self.assertEqual({p.relative_to(base).as_posix() for p in m.content_files(base)},selected|{'manifest.json'})
 def test_page_replace_is_bounded(self):
  raw='<!-- page: a -->\nold\n<!-- page: b -->\nkeep\n'
  self.assertIn('<!-- page: a -->\nnew\n',m.replace_page(raw,'a','new'))
  self.assertTrue(m.replace_page(raw,'a','new').endswith('<!-- page: b -->\nkeep\n'))
 def test_page_missing_or_repeated_rejected(self):
  for raw in ['nothing','<!-- page: a -->x<!-- page: a -->y']:
   with self.assertRaises(AssertionError):m.replace_page(raw,'a','new')
 def test_distinct_output_paths(self):
  self.assertNotEqual(m.ARCHIVE,m.NEW);self.assertNotEqual(m.FULL,m.NEW)
  self.assertTrue(m.NEW.is_relative_to(ROOT/'delivery'))
 def test_final_html_hash(self): self.assertEqual(m.sha(ROOT/'PathLab_AI_v4_optimized_final.html'),m.EXPECTED)
 def test_no_packet_self_inclusion(self): self.assertEqual(m.ZIPNAME,'PathLab-AI-正式参赛材料-20261115.zip')
if __name__=='__main__':unittest.main(verbosity=2)
