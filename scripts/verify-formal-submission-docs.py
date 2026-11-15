"""Reopen Word-exported PDFs, inspect text/fonts, and render every page with Poppler."""
from pathlib import Path
import os,json,subprocess,shutil,hashlib,zipfile,re
from PIL import Image,ImageDraw
from pypdf import PdfReader
import pdfplumber
ROOT=Path(__file__).resolve().parents[1];TMP=ROOT/'.cache/formal-submission-20261115';os.environ['TEMP']=os.environ['TMP']=str(TMP)
records=json.loads((TMP/'word-render.json').read_text(encoding='utf-8-sig'))
for n,row in enumerate(records,1):
 pdf=Path(row['pdf']);folder=TMP/f'pages-{n}';folder.mkdir(exist_ok=True)
 subprocess.run([shutil.which('pdftoppm'),'-scale-to','1500','-png',str(pdf),str(folder/'page')],check=True,capture_output=True)
 reader=PdfReader(pdf);assert len(reader.pages)==row['pages'];pageInfo=[]
 assert row['pages']==[12,16][n-1]
 md=ROOT/'docs'/['formal-project-introduction.md','formal-technical-report.md'][n-1]
 refs=re.findall(r'^:::image ([^ ]+)',md.read_text(encoding='utf-8'),flags=re.M)
 expected={hashlib.sha256((ROOT/'docs/assets/submission-20261115'/(v+'.png')).read_bytes()).hexdigest() for v in refs}
 with zipfile.ZipFile(row['docx']) as dz:
  actual={hashlib.sha256(dz.read(name)).hexdigest() for name in dz.namelist() if name.startswith('word/media/')}
 assert actual==expected,(n,'embedded screenshot bytes')
 fonts={}
 for page in reader.pages:
  for font in (page['/Resources'].get('/Font') or {}).values():
   font=font.get_object(); name=str(font.get('/BaseFont',''))
   descendants=font.get('/DescendantFonts')
   f=descendants[0].get_object() if descendants else font
   descriptor=f.get('/FontDescriptor')
   descriptor=descriptor.get_object() if descriptor else {}
   fonts[name]=any(k in descriptor for k in ['/FontFile','/FontFile2','/FontFile3'])
 assert fonts and all(fonts.values()),(n,fonts)
 row.update({'embeddedScreenshotsByteVerified':len(expected),'allFontsEmbedded':True})
 with pdfplumber.open(pdf) as p:
  for i,page in enumerate(p.pages,1):
   chars=page.chars;outside=[{'text':c['text'],'x0':c['x0'],'top':c['top']} for c in chars if c['x0']<12 or c['x1']>page.width-12 or c['top']<7 or c['bottom']>page.height-7]
   assert not outside,(n,i,outside[:3]);text=page.extract_text() or '';assert len(text)>100,(n,i,'too little text');assert '\ufffd' not in text
   pageInfo.append({'page':i,'characters':len(text),'firstLines':text.splitlines()[:3],'textWithinPage':True})
 row.update({'pdfBytes':pdf.stat().st_size,'pdfSha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'pageInfo':pageInfo,'popplerRenderedPages':len(list(folder.glob('page-*.png')))})
 files=sorted(folder.glob('page-*.png'))
 for start in range(0,len(files),4):
  out=Image.new('RGB',(1500,1990),'#d7d7d7');d=ImageDraw.Draw(out)
  for j,file in enumerate(files[start:start+4]):
   im=Image.open(file);im.thumbnail((740,963));x=(j%2)*750+5;y=(j//2)*995+24;out.paste(im,(x,y));d.text((x,y-20),f'Document {n} Page {start+j+1}',fill='black')
  out.save(TMP/f'qa-doc{n}-{start//4+1}.jpg',quality=91)
result={'date':'2026-11-15','executor':'AI','rendererAttempt':'Skill render_docx.py attempted; unavailable because LibreOffice soffice.exe missing; actual Microsoft Word 16 COM export, all pages Poppler rendered','files':records,'visualInspection':{'status':'pending AI inspection of all rendered pages','notHumanAcceptance':True}}
(ROOT/'docs/evidence/formal-submission-document-qa-20261115.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps([{'pages':r['pages'],'sha':r['pdfSha256']} for r in records]))
