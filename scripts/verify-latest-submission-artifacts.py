"""Verify retained inputs, document/media assets, and the finished complete packet.
All generated data stays in the D workspace. No account or network operations.
assets: finalize actual document/asset audits (after AI viewed all rendered pages).
final: independently verify the already-built ZIP; write receipts outside the ZIP.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import sys,os,json,hashlib,subprocess,zipfile,importlib.util,re
ROOT=Path(__file__).resolve().parents[1]
TMP=ROOT/'.cache/submission-latest-20261115'
NEW=ROOT/'delivery/PathLab-AI-参赛文件-最新版-20261115'
FULL=NEW/'04-完整材料解压版'
EVID=ROOT/'docs/evidence'
os.environ['TEMP']=os.environ['TMP']=str(TMP);sys.dont_write_bytecode=True
assert ROOT.drive.upper()=='D:'
def sha(p):
 with p.open('rb') as f:return stream_sha(f)
def stream_sha(f):
 h=hashlib.sha256()
 for b in iter(lambda:f.read(1<<20),b''):h.update(b)
 return h.hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def contained(base,relative):
 rel=Path(relative)
 if rel.is_absolute() or '..' in rel.parts or rel.drive:raise ValueError('Unsafe relative path')
 p=(base/rel).resolve()
 if not p.is_relative_to(base.resolve()):raise ValueError('Path escapes root')
 return p
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if v and ((tag=='a' and k=='href') or (tag in ['img','video','source','script'] and k=='src') or (tag=='link' and k=='href')):self.links.append(v)
def local_links(file,boundary):
 parser=Links();parser.feed(file.read_text(encoding='utf-8'));rows=[]
 for link in parser.links:
  u=urlsplit(link)
  if u.scheme in ['http','https','mailto','data','blob'] or not u.path:continue
  if u.scheme:raise ValueError('Unexpected URL scheme')
  p=(file.parent/unquote(u.path)).resolve()
  if not p.is_relative_to(boundary.resolve()):raise ValueError('Link outside packet')
  if not p.is_file():raise FileNotFoundError(p)
  rows.append(p.relative_to(boundary).as_posix())
 return rows
def assets():
 from PIL import Image
 from pypdf import PdfReader
 spec=importlib.util.spec_from_file_location('media',ROOT/'scripts/build-video-material-packet.py')
 media=importlib.util.module_from_spec(spec);spec.loader.exec_module(media)
 inputs=load(EVID/'latest-submission-inputs-20261115.json')
 photos=[]
 for x in inputs['photos']:
  original=ROOT/x['path'];p=FULL/'05-Prompt证据/20261115新增拍屏原图'/original.name
  assert sha(original)==sha(p)==x['sha256']
  with Image.open(p) as im:dims=list(im.size)
  photos.append({'name':p.name,'bytes':p.stat().st_size,'sha256':x['sha256'],'dimensions':dims,'scope':'author-supplied partial photographed conversation, not native complete export'})
 save(EVID/'latest-submission-photos-20261115.json',{'date':'2026-11-15','executor':'AI','files':photos})
 screenshots=[]
 for p in sorted((ROOT/'docs/assets/submission-20261115').glob('*.png')):
  with Image.open(p) as im:dims=list(im.size)
  screenshots.append({'name':p.name,'bytes':p.stat().st_size,'sha256':sha(p),'dimensions':dims,'formalEvidence':True,'visualInspection':'AI viewed rendered image; not human or physical device'})
 assert len(screenshots)==11
 save(EVID/'latest-submission-screenshots-20261115.json',{'date':'2026-11-15','executor':'AI','files':screenshots})
 h264=load(EVID/'latest-submission-h264-20261115.json');originals=load(EVID/'latest-submission-media-20261115.json')['videos']
 for x,original in zip(h264['files'],originals):
  p=FULL/x['derivative'];actual=media.parse_mp4(p)
  assert sha(p)==x['sha256']
  assert actual['video']['codec']=='avc1' and actual['audio']['codec']=='mp4a'
  assert all(actual['video'][k]==original['video'][k] for k in ['width','height'])
  assert abs(actual['durationSeconds']-original['durationSeconds'])<.05
  x['actualContainerMetadata']=actual;x['originalDimensionsAndDurationVerified']=True
 save(EVID/'latest-submission-h264-20261115.json',h264)
 qa=load(EVID/'latest-submission-document-qa-20261115.json');docs=load(EVID/'latest-submission-documents-20261115.json')
 for r,creation in zip(qa['files'],docs['files']):
  pdf=Path(r['pdf']);docx=Path(r['docx']);assert sha(pdf)==r['pdfSha256'];assert sha(docx)==creation['sha256']
  fonts={}
  for page in PdfReader(pdf).pages:
   for font in page['/Resources'].get('/Font',{}).values():
    f=font.get_object();name=str(f.get('/BaseFont',''));children=f.get('/DescendantFonts',[f])
    embedded=[]
    for item in children:
     descriptor=item.get_object().get('/FontDescriptor');descriptor=descriptor.get_object() if descriptor else {}
     embedded.append(any(k in descriptor for k in ['/FontFile','/FontFile2','/FontFile3']))
    fonts[name]=all(embedded)
  assert fonts and all(fonts.values()),fonts
  with zipfile.ZipFile(docx) as z:
   embedded=[hashlib.sha256(z.read(n)).hexdigest() for n in z.namelist() if n.startswith('word/media/')]
   from xml.etree import ElementTree as ET
   drawing=ET.fromstring(z.read('word/document.xml'))
   placements=len(drawing.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}inline'))
   assert placements==creation['embeddedScreenshots']
   required=re.findall(r'^:::image (\S+)',(ROOT/'docs'/creation['source']).read_text(encoding='utf-8'),re.M)
   assert set(embedded)==set(sha(ROOT/'docs/assets/submission-20261115'/(name+'.png')) for name in required)
   assert all(h in [s['sha256'] for s in screenshots] for h in embedded)
  r['fonts']=[{'font':k,'embedded':v} for k,v in sorted(fonts.items())]
  r['embeddedScreenshotHashesVerified']=True
 qa['visualInspection']={'status':'completed','executor':'AI','scope':'all 28 final pages viewed via 7 four-page contact sheets; 12 introduction pages and 16 technical pages','result':'readable headers/body/tables/screenshots, consistent page numbering; no observed clipping/overlap','iterations':[{'issue':'first render collapsed inline screenshots due to exact paragraph spacing','fix':'image paragraphs changed to automatic single line spacing; both documents rebuilt, re-exported and all final pages viewed'}],'notHumanAcceptance':True}
 docs['rendering']='Microsoft Word 16 COM export; 12/16 pages, all 28 pages Poppler rendered and AI visually inspected; PDF fonts embedded, source screenshot hashes matched'
 save(EVID/'latest-submission-document-qa-20261115.json',qa);save(EVID/'latest-submission-documents-20261115.json',docs)
 print(json.dumps({'photos':len(photos),'screenshots':len(screenshots),'documentPages':[r['pages'] for r in qa['files']],'videosMetadata':len(h264['files'])}))
def final():
 inputs=load(EVID/'latest-submission-inputs-20261115.json');old=ROOT/'delivery/PathLab-AI-参赛文件-v3'
 assert sorted(x['oldRelative'] for x in inputs['v3Files'])==sorted(p.relative_to(old).as_posix() for p in old.rglob('*') if p.is_file())
 for row in inputs['v3Files']:
  p=contained(old,row['oldRelative']);assert p.stat().st_size==row['bytes'] and sha(p)==row['sha256']
 mapping=load(FULL/'10-最新版更新说明/v3迁移映射.json')
 assert len(mapping['files'])==len(inputs['v3Files'])==622
 assert sorted(x['oldPath'] for x in mapping['files'])==sorted(x['oldRelative'] for x in inputs['v3Files'])
 for x in mapping['files']:
  p=contained(NEW,x['newPath']);assert p.stat().st_size==x['bytes'] and sha(p)==x['sha256']
 main=inputs['authoritativeHtml'];assert sha(ROOT/main['path'])==sha(FULL/'03-离线体验'/Path(main['path']).name)==main['sha256']
 for row in inputs['photos']+inputs['videos']:
  p=ROOT/row['path'];assert sha(p)==row['sha256']
  folder='05-Prompt证据/20261115新增拍屏原图' if p.suffix=='.jpg' else '09-演示视频/作者视频原件'
  assert sha(FULL/folder/p.name)==row['sha256']
 proof=load(FULL/'04-源码与演进/source-export-verification.json');tree=FULL/'04-源码与演进/源码'
 def git(*args):return subprocess.run(['git','-C',str(ROOT),*args],check=True,capture_output=True).stdout
 names=[x for x in git('ls-tree','-r','--name-only','-z',proof['gitHead']).decode('utf-8').split('\0') if x]
 assert sorted(p.relative_to(tree).as_posix() for p in tree.rglob('*') if p.is_file())==sorted(names)
 for name in names:assert hashlib.sha256(git('show',proof['gitHead']+':'+name)).hexdigest()==sha(tree/name)
 bundle=FULL/'04-源码与演进'/proof['bundle'];git('bundle','verify',str(bundle))
 expected_manifest=load(FULL/'manifest.json');rows=expected_manifest['files'];actual=sorted(p.relative_to(FULL).as_posix() for p in FULL.rglob('*') if p.is_file() and p!=FULL/'manifest.json')
 assert sorted(x['path'] for x in rows)==actual and len(rows)==expected_manifest['fileCount']
 for x in rows:
  p=contained(FULL,x['path']);assert p.stat().st_size==x['bytes'] and sha(p)==x['sha256']
 built=load(NEW/'packet-build-verification.json');archive=NEW/built['zip']['path'];assert sha(archive)==built['zip']['sha256']
 assert archive.with_suffix('.zip.sha256').read_text(encoding='utf-8').split()[0]==sha(archive)
 with zipfile.ZipFile(archive) as z:
  assert z.testzip() is None
  assert sorted(z.namelist())==sorted(actual+['manifest.json'])
  for x in rows:
   with z.open(x['path']) as stream:assert stream_sha(stream)==x['sha256']
  assert z.read('manifest.json')==(FULL/'manifest.json').read_bytes()
 links={}
 for p in [NEW/'00-打开最新参赛材料.html',FULL/'00-评审入口.html',FULL/'00-打开最新参赛材料.html',FULL/'10-最新版更新说明/材料验收报告.html',FULL/'05-Prompt证据/20261115新增拍屏原图/00-原图索引.html']:
  links[p.relative_to(NEW).as_posix()]=local_links(p,NEW)
 for sub,out in [('01-作品介绍','02-表单第6项'),('02-技术文档','03-技术文档备用')]:
  for p in (FULL/sub).glob('*'):
   if p.suffix in ['.pdf','.docx']:assert sha(p)==sha(NEW/out/p.name)
 assert sha(FULL/'09-演示视频/H264兼容播放/新版本mp4-H264.mp4')==sha(NEW/'03-视频材料/新版本产品演示-H264.mp4')
 result={'date':'2026-11-15','executor':'AI independent file/archive verification','originalV3PathsUnchanged':622,'v3PathsMapped':622,'uniqueRetainedV3Files':len(set(x['newPath'] for x in mapping['files'])),'newOriginalPhotos':7,'newOriginalVideos':3,'selectedHtmlUnchanged':True,'source':proof,'sourceFilesRecheckedAgainstGitBlobs':len(names),'manifestFiles':len(rows),'zip':dict(built['zip'],entries=len(rows)+1,allEntriesRechecked=True),'entryLinks':links,'submissionCopiesIdentical':True,'notHumanOrRealDeviceAcceptance':True,'githubPushed':False,'uploadedOrSubmitted':False,'scope':'Independent SHA/CRC/migration/source/link audit. Browser/video playback results are in separate JSON. This external receipt is intentionally not hashed into its own ZIP.'}
 save(NEW/'packet-final-verification.json',result);save(EVID/'latest-submission-final-20261115.json',result)
 print(json.dumps({k:result[k] for k in ['v3PathsMapped','sourceFilesRecheckedAgainstGitBlobs','manifestFiles','zip']},ensure_ascii=True))
if __name__=='__main__':{'assets':assets,'final':final}[sys.argv[1]]()
