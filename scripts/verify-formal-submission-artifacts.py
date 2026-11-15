"""Independently validate E040 manifest/ZIP/provenance and selected old archives."""
from pathlib import Path,PurePosixPath
import hashlib,json,zipfile,sys,re,subprocess
from html.parser import HTMLParser
from urllib.parse import unquote,urlsplit
ROOT=Path(__file__).resolve().parents[1]
NEW=ROOT/'delivery/PathLab-AI-正式参赛文件-20261115'
FULL=ROOT/'delivery/PathLab-AI-参赛文件-最新版-20261115/04-完整材料解压版'
TMP=ROOT/'.cache/formal-submission-20261115';EVIDENCE=ROOT/'docs/evidence'
checks=[]
def check(name,value):
 if not value:raise AssertionError(name)
 checks.append({'name':name,'passed':True})
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4194304),b''):h.update(b)
 return h.hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def safe(name):
 p=PurePosixPath(name)
 check('safe ZIP path '+name,not p.is_absolute() and '..' not in p.parts and '\\' not in name and ':' not in name)
 return p
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k in ['href','src'] and v:self.links.append(v)
def verify():
 manifest=load(NEW/'manifest.json');rows=manifest['files'];by={r['path']:r for r in rows}
 actual={p.relative_to(NEW).as_posix():p for p in NEW.rglob('*') if p.is_file() and p.relative_to(NEW).parts[0]!='提交压缩包' and p!=NEW/'最终校验回执.json'}
 check('manifest paths unique',len(by)==len(rows))
 check('manifest covers nested manifests and every content path',set(by)==set(actual)-{'manifest.json'})
 for rel,r in by.items():
  p=actual[rel];check('content bytes '+rel,p.stat().st_size==r['bytes'] and sha(p)==r['sha256'])
 check('no symlinks in packet',not any(p.is_symlink() for p in NEW.rglob('*')))
 zp=NEW/'提交压缩包/PathLab-AI-正式参赛材料-20261115.zip';zh=sha(zp)
 check('ZIP SHA sidecar',zp.with_suffix('.zip.sha256').read_text(encoding='utf-8').split()[0]==zh)
 with zipfile.ZipFile(zp) as z:
  names=z.namelist();check('ZIP unique names',len(names)==len(set(names)))
  check('ZIP names exactly match directory content',set(names)==set(actual))
  check('ZIP CRC all entries',z.testzip() is None)
  check('no nested delivery ZIPs or QA images',not any(n.lower().endswith('.zip') or '/.cache/' in n or '/qa-doc' in n or 'submission-latest-20261115/' in n for n in names))
  for name in names:
   safe(name);check('ZIP bytes '+name,hashlib.sha256(z.read(name)).hexdigest()==sha(actual[name]))
  if '--extract' in sys.argv:
   dest=TMP/'zip-extracted';check('extract into new D folder',not dest.exists());dest.mkdir()
   for name in names:
    p=dest/PurePosixPath(name);p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(name))
 selection=load(NEW/'09-核验与边界/材料取舍清单.json')
 for r in selection['copiedUnchanged']:
  check('selected original unchanged '+r['path'],sha(ROOT/r['source'])==sha(NEW/r['path'])==r['sha256'])
 frozen=next((FULL/'05-Prompt证据').glob('*.zip'));core=NEW/'05-开发证据/核心链证据'
 with zipfile.ZipFile(frozen) as z:
  names=[i.filename for i in z.infolist() if not i.is_dir()]
  check('all frozen Prompt entries selected exactly',set(names)=={p.relative_to(core).as_posix() for p in core.rglob('*') if p.is_file()} and len(names)==selection['frozenPromptEntries'])
  for name in names:check('frozen Prompt bytes '+name,z.read(name)==(core/name).read_bytes())
 portals=[NEW/'00-打开最新参赛材料.html',NEW/'05-开发证据/00-证据导航.html',NEW/'05-开发证据/20261115原始拍屏/00-原图索引.html']
 local=[]
 for p in portals:
  h=Links();h.feed(p.read_text(encoding='utf-8'))
  for link in h.links:
   parsed=urlsplit(link)
   if parsed.scheme or link.startswith('#'):continue
   target=(p.parent/unquote(parsed.path)).resolve()
   check('portal target in packet '+link,target.is_relative_to(NEW.resolve()) and target.is_file())
   local.append({'page':p.relative_to(NEW).as_posix(),'link':link})
 src=load(NEW/'04-源码与演进/源码清单.json'); source=NEW/'04-源码与演进/源码'
 actualSrc={p.relative_to(source).as_posix():p for p in source.rglob('*') if p.is_file()}
 check('source exact path set',set(actualSrc)=={r['path'] for r in src['files']})
 for r in src['files']:check('frozen source bytes '+r['path'],sha(actualSrc[r['path']])==r['sha256'])
 check('bundle hash',sha(NEW/'04-源码与演进'/src['bundle'])==src['bundleSha256'])
 check('current selected HTML exact',sha(NEW/'03-离线体验/PathLab_AI_v4_optimized_final.html')==sha(ROOT/'PathLab_AI_v4_optimized_final.html')==manifest['selectedHtmlSha256'])
 old=load(EVIDENCE/'formal-submission-inputs-20261115.json')
 archiveResults={}
 for key,base in [('fullArchive',FULL.parent),('v3',ROOT/'delivery/PathLab-AI-参赛文件-v3')]:
  before={r['path']:r for r in old[key]};after={p.relative_to(base).as_posix():p for p in base.rglob('*') if p.is_file()}
  check(key+' unchanged path set',set(before)==set(after))
  for name,r in before.items():check(key+' unchanged bytes '+name,after[name].stat().st_size==r['bytes'] and sha(after[name])==r['sha256'])
  archiveResults[key]={'files':len(before),'bytes':sum(r['bytes'] for r in before.values()),'everyPathSizeAndSha256Unchanged':True}
 result={'date':'2026-11-15','executor':'AI','kind':'independent formal packet validation','passed':len(checks),'zipBytes':zp.stat().st_size,'zipSha256':zh,'zipEntries':len(actual),'manifestContentFiles':len(rows),'htmlSha256':manifest['selectedHtmlSha256'],'sourceHead':src['head'],'sourceTrackedFiles':src['trackedFiles'],'sourceCommitCount':src['commitCount'],'localNavigationLinks':len(local),'archivesUnchanged':archiveResults,'checks':checks,'scope':'File/ZIP/provenance checks only. Browser and document rendering receipts are separate; not human, device, rule or teaching-effect acceptance.'}
 if '--extract' in sys.argv:
  dest=EVIDENCE/'formal-submission-first-package-20261115.json'
 else:
  dest=EVIDENCE/'formal-submission-final-20261115.json'
 dest.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 if '--extract' not in sys.argv:(NEW/'最终校验回执.json').write_bytes(dest.read_bytes())
 print(json.dumps({k:v for k,v in result.items() if k not in ['checks','scope','archivesUnchanged']},ensure_ascii=True))
if __name__=='__main__':verify()
