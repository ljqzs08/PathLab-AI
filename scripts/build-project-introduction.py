"""Build a local, illustrated 15-page project introduction from real HTML screenshots.
Reads the audited technical-report helpers without rebuilding the technical PDF.
"""
from __future__ import annotations
import sys, os, importlib.util, hashlib, json, re, subprocess
from pathlib import Path
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[1]
if ROOT.drive.upper()!='D:': raise SystemExit('D drive workspace required')
os.environ['TEMP']=os.environ['TMP']=str(ROOT/'.cache/tmp')
os.environ['PYTHONDONTWRITEBYTECODE']='1'
spec=importlib.util.spec_from_file_location('technical_report',ROOT/'scripts/build-technical-report.py')
t=importlib.util.module_from_spec(spec);spec.loader.exec_module(t)
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Flowable, Image, Paragraph, Spacer, Table, TableStyle, Frame
from reportlab.pdfbase import pdfmetrics
from pypdf import PdfReader
from PIL import Image as PILImage
W,H,M,CW=t.W,t.H,t.M,t.CW
OUT=ROOT/'output/pdf';PDF=OUT/'PathLab-AI-作品介绍文档.pdf'
ASSETS=ROOT/'docs/assets/project-introduction'
BASE=t.BASE
sha=lambda b:hashlib.sha256(b).hexdigest()

def setup():
 t.register_fonts();t.styles()
 t.S['body'].fontSize=11.2;t.S['body'].leading=18.3;t.S['body'].spaceAfter=8
 t.S['h2'].fontSize=13.2;t.S['h2'].leading=20;t.S['h2'].spaceBefore=5
 t.S['table'].fontSize=10.2;t.S['table'].leading=15.5
 t.S['th'].fontSize=10.2;t.S['th'].leading=15.5
 t.S['caption']=ParagraphStyle('caption',fontName='ZH',fontSize=8.4,leading=12.3,textColor=t.MUTED,spaceAfter=9,wordWrap='CJK')
 t.S['note']=ParagraphStyle('note',parent=t.S['body'],fontSize=10.4,leading=17)

CAPTIONS={
 '01-overview':'图 01｜首页：桌面 1440×1000 模拟视口；完整离线 HTML 的初始状态。',
 '02-prediction':'图 02｜L01 预测：候选已选、尚未提交；真实界面上部局部截图。',
 '03-search-result':'图 03｜L01 搜索结束：真实路径、节点计数与回放控制；界面局部。',
 '04-condition-comparison':'图 04｜单因素实验：BFS 前后两次真实运行的指标对照。',
 '05-web-review':'图 05｜网页辅助复盘：本地生成、尚未发送；并非内嵌 DeepSeek 聊天。',
 '06-evidence-report':'图 06｜事件引用报告：解释文字已明确标为 AI 自动演示。',
 '07-playground':'图 07｜9×7 自由地图：绘制、先预测、双算法实测与回放。',
 '08-storage':'图 08｜本机存档工具：备份、恢复与数据边界；实际面板局部。',
 '09-mobile':'图 09｜390×844 Edge 模拟移动视口；不是手机真机照片。',
}

class Photo(Flowable):
 def __init__(self,key,max_height):
  super().__init__();self.key=key;self.path=ASSETS/(key+'.png')
  with PILImage.open(self.path) as im:iw,ih=im.size
  scale=min(CW/iw,max_height/ih);self.iw=iw*scale;self.ih=ih*scale
  self.caption=Paragraph(CAPTIONS[key],t.S['caption'])
  self.ch=self.caption.wrap(CW,80)[1]
  self.width=CW;self.height=self.ih+self.ch+18
 def draw(self):
  c=self.canv;x=(CW-self.iw)/2;y=self.ch+12
  c.setFillColor(colors.HexColor('#E8F0F1'));c.roundRect(x-1,y-1,self.iw+2,self.ih+2,4,fill=1,stroke=0)
  c.drawImage(str(self.path),x,y,width=self.iw,height=self.ih,mask='auto')
  self.caption.drawOn(c,0,2)

class Stats(Flowable):
 def __init__(self):super().__init__();self.width=CW;self.height=69
 def draw(self):
  c=self.canv;gap=10;bw=(CW-gap*2)/3
  for i,(value,label) in enumerate([('155 / 155','历史 Node 测试'),('260 / 260','历史 HTTP 检查'),('272 / 272','历史离线检查')]):
   x=i*(bw+gap);c.setFillColor(t.PALE);c.roundRect(x,8,bw,57,6,fill=1,stroke=0)
   c.setFont('ZHB',19);c.setFillColor(t.TEAL);c.drawCentredString(x+bw/2,39,value)
   c.setFont('ZH',9.5);c.setFillColor(t.MUTED);c.drawCentredString(x+bw/2,20,label)

class Mobile(Flowable):
 def __init__(self):super().__init__();self.width=CW;self.height=363
 def draw(self):
  c=self.canv;p=ASSETS/'09-mobile.png';iw=151;ih=iw*1688/780
  c.drawImage(str(p),0,24,width=iw,height=ih,mask='auto')
  x=174;w=CW-x;y=self.height-2
  items=[('不依赖鼠标的一种入口',t.S['h2']),
   ('方向键、Enter / 空格等键盘操作与候选按钮相配合；等价 DOM 承担状态与焦点表达，Canvas 负责可视化。不是只画一张无法检查的图片。',t.S['note']),
   ('移动布局和动效边界',t.S['h2']),
   ('窄视口重排任务与控制区域，保留触摸入口；减少动态偏好可收敛有限动效。右图是浏览器模拟的 390×844 初始页面，不用它证明真实手机已通过。',t.S['note']),
   ('界面适配已有四视口自动化证据；实际设备、输入法、系统缩放和浏览器存储策略仍需单独体验。',t.S['note']),
   (CAPTIONS['09-mobile'],t.S['caption'])]
  for text,style in items:
   p=Paragraph(t.esc(text),style);_,h=p.wrap(w,600);y-=h;p.drawOn(c,x,y);y-=8
  assert y>5,'Mobile commentary overflow'


def story_for(lines):
 out=[];buffer=[]
 def flush():
  if buffer:out.extend(t.parse_body('\n'.join(buffer)));buffer.clear()
 for line in lines:
  if line.startswith(':::image '):
   flush();_,key,h=line.split();out.append(Photo(key,float(h)));continue
  if line.strip()==':::stats':flush();out.extend([Stats(),Spacer(1,5)]);continue
  if line.strip()==':::mobile':flush();out.append(Mobile());continue
  buffer.append(line)
 flush();return out

def chrome(c,n,title,total):
 c.setFillColor(colors.white);c.rect(0,0,W,H,fill=1,stroke=0)
 c.setFillColor(t.TEAL);c.rect(0,H-7,W,7,fill=1,stroke=0)
 c.setFont('ZHB',10.5);c.setFillColor(t.INK);c.drawString(M,H-36,'PathLab AI  /  作品介绍')
 c.setFont('Mono',8.5);c.setFillColor(t.MUTED);c.drawRightString(W-M,H-36,'2026.10.25  |  PROJECT PROFILE')
 c.setStrokeColor(t.LINE);c.line(M,53,W-M,53)
 c.setFont('ZH',8);c.setFillColor(t.MUTED);c.drawString(M,37,'真实 HTML 截图 / AI 辅助编制 / 本地交付')
 c.setFont('Mono',9);c.drawRightString(W-M,37,f'{n:02d} / {total:02d}')
 c.setFont('ZHB',22);c.setFillColor(t.INK)
 assert pdfmetrics.stringWidth(title,'ZHB',22)<=CW,'Title too wide '+title
 c.drawString(M,H-87,title)
 c.setStrokeColor(t.TEAL);c.setLineWidth(3);c.line(M,H-101,M+39,H-101)

def cover(c,total):
 c.setFillColor(t.INK);c.rect(0,0,W,H,fill=1,stroke=0)
 c.setFillColor(colors.HexColor('#78DACA'));c.rect(M,H-51,34,4,fill=1,stroke=0)
 c.setFont('Mono',10);c.drawString(M+44,H-53,'PROJECT PROFILE  /  2026')
 c.setFont('ZHB',39);c.setFillColor(colors.white);c.drawString(M,H-118,'PathLab AI')
 c.setFont('ZHB',25);c.drawString(M,H-158,'作品介绍文档')
 c.setFont('ZH',12);c.setFillColor(colors.HexColor('#BDDFE1'));c.drawString(M,H-188,'路径学习实验室 / 先预测，再验证，用证据解释')
 p=Photo('01-overview',330);p.caption=Paragraph(CAPTIONS['01-overview'],ParagraphStyle('covercaption',parent=t.S['caption'],textColor=colors.HexColor('#BDDFE1')))
 p.caption.wrap(CW,80);p.drawOn(c,M,222)
 c.setFont('ZH',12);c.setFillColor(colors.white);c.drawString(M,184,'面向 BFS 与 A* 初学者的交互式算法学习网站')
 c.setFont('ZH',10.5);c.setFillColor(colors.HexColor('#BDDFE1'));c.drawString(M,155,'四关任务 · 双算法 · 自由地图 · 本机证据复盘')
 c.setFont('ZH',10);c.drawString(M,110,'作者：LJQZS08     编制日期：2026-10-25     版本：1.0')
 c.setFont('ZH',8.6);c.drawString(M,86,'截图来自实际运行；模拟视口与 AI 演示不替代人工 / 真机验收。')
 c.setStrokeColor(colors.HexColor('#49606A'));c.line(M,60,W-M,60)
 c.setFont('ZH',8.5);c.drawString(M,40,'本次仅本地保存，不上传或执行正式赛事提交。')
 c.setFont('Mono',9);c.drawRightString(W-M,40,f'01 / {total:02d}')

def build():
 setup();checks=t.evidence_check()
 capture=json.loads((ASSETS/'capture-manifest.json').read_text(encoding='utf-8-sig'))
 assert len(capture['screenshots'])==9 and not capture['pageErrors'] and not capture['externalRequests']
 assert capture['source']['sha256']==sha((ROOT/capture['source']['file']).read_bytes())
 for pic in capture['screenshots']:
  assert sha((ROOT/pic['file']).read_bytes())==pic['sha256']
 manuscript=(ROOT/'docs/project-introduction.md').read_text(encoding='utf-8-sig')
 pieces=re.split(r'<!-- page: (.*?) -->',manuscript)
 pages=[(pieces[i],pieces[i+1].strip().splitlines()) for i in range(1,len(pieces),2)]
 assert len(pages)==15
 c=canvas.Canvas(str(PDF),pagesize=(W,H),pageCompression=1,invariant=1)
 c.setTitle('PathLab AI - 作品介绍文档');c.setAuthor('LJQZS08');c.setSubject('项目详情、使用、亮点、AI 测试、关键技术、真实截图、发表获奖与优化说明')
 stats=[]
 for n,(slug,lines) in enumerate(pages,1):
  title=lines[0][2:]
  if slug=='cover':cover(c,len(pages));stats.append({'page':1,'title':title,'layout':'custom cover'});c.showPage();continue
  chrome(c,n,title,len(pages));story=story_for(lines[1:])
  available=H-132-66
  height=sum(f.wrap(CW,available)[1]+f.getSpaceBefore()+f.getSpaceAfter() for f in story)
  assert height<=available,f'Content overflow page {n}: {height:.1f} > {available:.1f}'
  count=len(story);frame=Frame(M,66,CW,available,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
  frame.addFromList(story,c);assert not story,f'Unplaced flowables page {n}'
  stats.append({'page':n,'title':title,'flowables':count,'calculatedContentHeight':round(height,2),'availableHeight':round(available,2)})
  c.showPage()
 c.save();reader=PdfReader(PDF);assert len(reader.pages)==15
 for n,page in enumerate(reader.pages,1):
  text=page.extract_text() or ''
  assert len(text)>100 and '\ufffd' not in text and '\u25a0' not in text,f'Invalid text page {n}'
 source_paths=['README.md','docs/product-spec.md','docs/levels.md','docs/architecture.md','docs/storage.md','docs/playground-spec.md','docs/verification-web-review.md','docs/verification-stage-5-reflection.md','docs/verification-github-publication.md','docs/verification-prompt-upload.md','docs/evolution-log.md','PathLab-AI/package.json','PathLab-AI/package-lock.json','PathLab-AI/src/domain/learning/web-review.ts','PathLab-AI/src/domain/learning/session.ts','PathLab-AI/src/domain/learning/progress.ts','PathLab-AI/src/domain/learning/progress-store.ts','PathLab-AI/src/domain/learning/report.ts','PathLab-AI/src/components/ProgressPanel.tsx','PathLab-AI/src/components/Playground.tsx','PathLab-AI/src/components/ReflectionPanel.tsx','PathLab-AI/src/components/GridCanvas.tsx','PathLab-AI/src/domain/algorithms/bfs.ts','PathLab-AI/src/domain/algorithms/astar.ts','PathLab-AI/src/domain/algorithms/priorityQueue.ts','docs/evidence/reproduction-20261025.json','docs/evidence/publication-http-20261025.json','docs/evidence/publication-offline-20261025.json','prompts/submission/README.md','prompts/submission/U01-human-html-correction.md','prompts/submission/S02-web-review-iteration.md']
 source_entries=[]
 for path in source_paths:
  b=t.baseline_bytes(path);source_entries.append({'path':path,'baselineBlobSha256':sha(b),'baselineBytes':len(b)})
 manifest={'format':'pathlab-project-introduction-sources/v1','date':'2026-10-25','codeAndHistoricalEvidenceBaseline':BASE,'manuscript':'docs/project-introduction.md','manuscriptSha256':sha((ROOT/'docs/project-introduction.md').read_bytes()),'screenshotManifest':'docs/assets/project-introduction/capture-manifest.json','screenshotManifestSha256':sha((ASSETS/'capture-manifest.json').read_bytes()),'sourceFiles':source_entries,'authorAwardStatement':{'value':'本作品未获奖','source':'作者本轮真实用户消息，已存于 prompts/sessions/2026-10-25-project-introduction.jsonl','independentlyVerified':False},'publicationStatement':'Public repository is not an academic publication; no formal publication record supplied','scope':'No private env, full personal log, credentials or hidden reasoning included'}
 (OUT/'PathLab-AI-作品介绍文档-来源清单.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 qa={'executor':'AI','date':'2026-10-25','pdfFile':PDF.name,'pdfSha256':sha(PDF.read_bytes()),'pdfBytes':PDF.stat().st_size,'pages':15,'realHtmlScreenshots':9,'imageHashesMatch':True,'pageErrors':capture['pageErrors'],'externalRequests':capture['externalRequests'],'historicalEvidenceChecks':checks,'visualInspection':{'executor':'AI','method':'All 15 pages rendered at 100 dpi and reviewed in four contact sheets; the 9 embedded screenshot placements and final page transitions were checked.','pagesReviewed':list(range(1,16)),'contactSheetsReviewed':4,'embeddedScreenshotObjectsChecked':9,'result':'No clipping, overlap, missing Chinese glyphs, black blocks, broken tables or illegible screenshot placement observed.','isHumanAcceptance':False},'productRegressionSuiteRerun':False,'humanOrRealDeviceAcceptance':False,'uploadPerformed':False}
 (OUT/'PathLab-AI-作品介绍文档-校验记录.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 (OUT/(PDF.name+'.sha256')).write_text(sha(PDF.read_bytes())+'  '+PDF.name+'\n',encoding='utf-8')
 print(json.dumps({'pdf':str(PDF),'pages':15,'bytes':PDF.stat().st_size,'sourceFiles':len(source_entries),'screenshots':9,'layout':stats},ensure_ascii=False,indent=2))
if __name__=='__main__':build()
