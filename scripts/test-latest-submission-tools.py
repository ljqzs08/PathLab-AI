"""Synthetic tool tests only: not product tests or submission conversation evidence."""
from pathlib import Path
import importlib.util,sys,tempfile,unittest,hashlib,os
ROOT=Path(__file__).resolve().parents[1]
TMP=ROOT/'.cache/submission-latest-20261115';TMP.mkdir(parents=True,exist_ok=True)
os.environ['TEMP']=os.environ['TMP']=str(TMP);sys.dont_write_bytecode=True
def module(name,file):
 s=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
v=module('verify_latest','verify-latest-submission-artifacts.py')
b=module('build_latest','build-delivery-latest.py')
class Tools(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory(dir=TMP,prefix='tools-test-');self.root=Path(self.tmp.name)
 def tearDown(self):self.tmp.cleanup()
 def file(self,name,data=b''):
  p=self.root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data);return p
 def test_hash_streaming(self):
  data=b'accurate preserved bytes\x00\xff'*(100000);p=self.file('data',data);self.assertEqual(v.sha(p),hashlib.sha256(data).hexdigest())
 def test_contained_relative(self):self.assertEqual(v.contained(self.root,'a/b'),self.root/'a/b')
 def test_contained_parent_escape(self):
  with self.assertRaises(ValueError):v.contained(self.root,'../escaped')
 def test_contained_absolute(self):
  with self.assertRaises(ValueError):v.contained(self.root,str(self.root/'absolute'))
 def test_encoded_link(self):
  self.file('中文 文件.pdf');p=self.file('index.html',b'<a href="%E4%B8%AD%E6%96%87%20%E6%96%87%E4%BB%B6.pdf">x</a>');self.assertEqual(v.local_links(p,self.root),['中文 文件.pdf'])
 def test_external_links_not_fetched(self):
  p=self.file('index.html',b'<a href="https://example.invalid/a">x</a><img src="data:image/png;base64,AAAA">');self.assertEqual(v.local_links(p,self.root),[])
 def test_anchor_and_query(self):
  self.file('note.md');p=self.file('index.html',b'<a href="#part">x</a><a href="note.md?x=1#part">x</a>');self.assertEqual(v.local_links(p,self.root),['note.md'])
 def test_missing_link_fails(self):
  p=self.file('index.html',b'<img src="missing.png">')
  with self.assertRaises(FileNotFoundError):v.local_links(p,self.root)
 def test_link_escape_fails(self):
  p=self.file('index.html',b'<a href="../outside">bad</a>')
  with self.assertRaises(ValueError):v.local_links(p,self.root)
 def test_historical_manifest_preserved(self):
  self.file('manifest.json');self.file('12-history/manifest.json');self.file('current.txt')
  self.assertEqual([p.relative_to(self.root).as_posix() for p in b.manifest_files(self.root)],['12-history/manifest.json','current.txt'])
if __name__=='__main__':unittest.main()
