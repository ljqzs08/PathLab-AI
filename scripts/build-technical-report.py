"""Build the local, evidence-bounded PathLab AI technical report (24 A4 pages).
Only project-contained output paths are written. System fonts/runtime are read-only.
Run: python -B scripts/build-technical-report.py
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import html
import json
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
if ROOT.drive.upper() != 'D:':
    raise SystemExit('This project must remain on the D drive.')
sys.dont_write_bytecode = True
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
os.environ['TEMP'] = str(ROOT / '.cache' / 'tmp')
os.environ['TMP'] = os.environ['TEMP']
# Reproducible metadata dated to this edition, rather than ReportLab's year-2000 default.
os.environ['SOURCE_DATE_EPOCH'] = str(int(datetime(2026, 10, 25, tzinfo=timezone.utc).timestamp()))
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Flowable, Frame, Paragraph, Spacer, Table, TableStyle, XPreformatted
from pypdf import PdfReader

OUT = ROOT / 'output' / 'pdf'
PDF = OUT / 'PathLab-AI-技术文档.pdf'
W, H = 595.2756, 841.8898
M = 48
CW = W - 2*M
INK = colors.HexColor('#152E3B')
TEAL = colors.HexColor('#007F7A')
GOLD = colors.HexColor('#BA7030')
MUTED = colors.HexColor('#526873')
PALE = colors.HexColor('#EDF5F4')
LINE = colors.HexColor('#D8E5E7')
BASE = 'e438363692762398117756ceb7f72a3fb415e5ad'
SOURCES = {
 'R01': ['AGENTS.md', 'docs/progress-status.md'],
 'R02': ['docs/product-spec.md', 'docs/levels.md'],
 'R03': ['docs/architecture.md'],
 'R04': ['docs/events.md', 'docs/state-machine.md', 'PathLab-AI/contracts/types.ts'],
 'R05': ['PathLab-AI/src/domain/learning/session.ts', 'PathLab-AI/src/domain/learning/progress-store.ts', 'PathLab-AI/src/components/PathLabShell.tsx', 'PathLab-AI/src/components/LearningWorkbench.tsx', 'PathLab-AI/src/components/GridCanvas.tsx', 'PathLab-AI/src/components/EvidenceInspector.tsx'],
 'R06': ['PathLab-AI/src/domain/grid.ts', 'PathLab-AI/src/domain/algorithms/bfs.ts', 'PathLab-AI/src/domain/algorithms/astar.ts', 'PathLab-AI/src/domain/algorithms/priorityQueue.ts'],
 'R07': ['PathLab-AI/src/domain/learning/diagnose.ts', 'PathLab-AI/src/domain/learning/report.ts', 'PathLab-AI/src/domain/learning/feedback-validation.ts', 'docs/ai-contract.md'],
 'R08': ['PathLab-AI/src/server/deepseek.ts', 'PathLab-AI/src/domain/learning/web-review.ts', 'docs/web-review-guide.md', 'docs/verification-deepseek.md'],
 'R09': ['PathLab-AI/src/domain/learning/progress.ts', 'PathLab-AI/src/domain/learning/progress-store.ts', 'docs/storage.md', 'docs/playground-spec.md'],
 'R10': ['PathLab-AI/src/standalone.tsx', 'PathLab-AI/scripts/build-standalone.mjs', 'docs/verification-standalone-html.md'],
 'R11': ['prompts/sessions/2026-10-17-stage-2-bfs.jsonl', 'prompts/sessions/2026-10-17-autonomous-iterations.jsonl'],
 'R12': ['prompts/submission/C01-algorithms.md', 'prompts/submission/C02-prediction-replay.md', 'prompts/submission/C03-reflection.md', 'docs/verification-stage-2-bfs.md', 'docs/verification-stage-3-astar.md', 'docs/verification-stage-4-learning.md', 'docs/verification-stage-5-reflection.md'],
 'R13': ['prompts/submission/U01-human-html-correction.md', 'prompts/sessions/2026-10-17-local-html-entry.jsonl', 'prompts/sessions/2026-10-17-standalone-html-correction.jsonl'],
 'R14': ['prompts/submission/S02-web-review-iteration.md', 'prompts/sessions/2026-10-17-deepseek-integration.jsonl', 'prompts/sessions/2026-10-17-deepseek-configuration-guide.jsonl', 'prompts/sessions/2026-10-17-deepseek-web-alternative.jsonl', 'prompts/sessions/2026-10-17-web-review-workbench.jsonl'],
 'R15': ['docs/reproducibility.md', 'README.md'],
 'R16': ['docs/evidence/reproduction-20261025.json', 'docs/verification-github-publication.md'],
 'R17': ['prompts/submission/README.md', 'prompts/submission/chain-map.json', 'docs/evolution-log.md'],
 'R18': ['PathLab-AI/package.json', 'PathLab-AI/package-lock.json', 'PathLab-AI/.env.example', 'scripts/Invoke-ProjectNpm.ps1'],
 'R19': ['docs/evidence/publication-http-20261025.json', 'docs/evidence/publication-offline-20261025.json', 'docs/evidence/reproduction-line-endings-before-20261025.json', 'docs/evidence/reproduction-line-endings-after-20261025.json', 'docs/evidence/reproduction-check-20261025.txt', 'docs/evidence/reproduction-build-20261025.txt'],
}

def git(*args: str) -> str:
    return subprocess.check_output(['git', '-C', str(ROOT), *args], encoding='utf-8').strip()

def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def baseline_bytes(path: str) -> bytes:
    return subprocess.check_output(['git', '-C', str(ROOT), 'show', BASE + ':' + path])

def load_json(path: str):
    return json.loads(baseline_bytes(path).decode('utf-8-sig'))

def evidence_check():
    git('cat-file', '-e', BASE+'^{commit}')
    package = load_json('PathLab-AI/package.json')
    expected = {'next':'16.4.2', 'react':'19.3.1', 'react-dom':'19.3.1', 'ajv':'8.20.0'}
    assert all(package['dependencies'][k] == v for k,v in expected.items())
    t = load_json('docs/evidence/reproduction-20261025.json')
    assert t['sourceCommit'] == '44b4ef24f39158c50229e96dd7ef048922dc1025'
    assert t['installSeconds'] == 44.611 and t['wallSecondsIncludingOperatorWaits'] == 342.113
    assert t['test']['pageErrors'] == [] and t['test']['remoteRequests'] == []
    assert t['test']['isHumanOrRealDeviceAcceptance'] is False
    for filename, count in [('publication-http-20261025.json',260), ('publication-offline-20261025.json',272)]:
        st = load_json('docs/evidence/'+filename)['stats']
        assert st['expected'] == count and st['unexpected'] == st['skipped'] == st['flaky'] == 0
    after = load_json('docs/evidence/reproduction-line-endings-after-20261025.json')
    assert after['canonicalHtmlSha256'] == after['cleanCloneHtmlSha256'] == '8f481dcdd4870ee9d9ab11b024f0d20d030c27cefcf89ce8f657efa83111a1d0'
    chain = load_json('prompts/submission/chain-map.json')
    assert len(chain['snapshots']) == 9
    messages = []
    for name in chain['snapshots']:
        records = [json.loads(x) for x in baseline_bytes('prompts/sessions/' + name + '.jsonl').decode('utf-8-sig').splitlines() if x.strip()]
        assert any(x['phase'] in ['final_answer','final'] for x in records if x['role']=='assistant')
        for x in records:
            assert sha(x['text'].encode('utf-8')) == x['textSha256']
        messages += records
    assert len(messages) == 38
    assert len({x['sourceLine'] for x in messages}) == 38
    for chain_entry in chain['chains']:
        for commit in chain_entry['commits']:
            assert subprocess.run(['git','-C',str(ROOT),'merge-base','--is-ancestor',commit,BASE],capture_output=True).returncode == 0
    return {'executor':'AI', 'productTestsRerun':False,'dependencyVersionsMatch':True, 'sourceOnlyTimingMatches':True,'historicalBrowserReportsMatch':True,'htmlRebuildEvidenceMatches':True,'coreSelectedRounds':9,'uniqueVisibleMessages':38,'linkedCommitsAreAncestors':True}

def register_fonts():
    fonts = [('ZH',r'C:\Windows\Fonts\simhei.ttf'),('ZHB',r'C:\Windows\Fonts\Dengb.ttf'),('Mono',r'C:\Windows\Fonts\consola.ttf')]
    for name,path in fonts:
        pdfmetrics.registerFont(TTFont(name,path))
    pdfmetrics.registerFontFamily('ZH',normal='ZH',bold='ZHB',italic='ZH',boldItalic='ZHB')

S = {}
def styles():
    for k,fs,leading,col in [('body',11.6,19.5,INK),('h2',13.5,21,TEAL),('source',8.8,13.5,MUTED),('table',10.4,16,INK),('th',10.4,16,colors.white),('quote',11.4,19,TEAL),('code',9.2,14,INK)]:
        S[k]=ParagraphStyle(k,fontName='ZH',fontSize=fs,leading=leading,textColor=col,wordWrap='CJK',alignment=TA_LEFT,spaceAfter=9 if k=='body' else 7,spaceBefore=6 if k=='h2' else 0)


def esc(text):
    text = html.escape(text)
    text = re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',text)
    # Evidence numbers are intentionally human-readable in the PDF.
    return text

class EvidenceFlow(Flowable):
    def __init__(self, lines):
        Flowable.__init__(self)
        self.lines=lines
        self.width=CW
        self.height=len(lines)*30+7
    def draw(self):
        c=self.canv
        for i,line in enumerate(self.lines):
            y=self.height-27-i*30
            c.setFillColor(PALE); c.roundRect(0,y,CW,25,5,fill=1,stroke=0)
            c.setFillColor(TEAL); c.circle(15,y+12,7,fill=1,stroke=0)
            c.setFillColor(colors.white); c.setFont('Mono',8); c.drawCentredString(15,y+9,str(i+1))
            c.setFillColor(INK); c.setFont('ZH',10.1); c.drawString(31,y+9,line)
            if i<len(self.lines)-1:
                c.setStrokeColor(TEAL); c.line(15,y,15,y-5)



class ArchitectureDiagram(Flowable):
    """Conceptual dependency / evidence boundary, not an exact import graph."""
    def __init__(self):
        Flowable.__init__(self)
        self.width, self.height = CW, 242
    def draw(self):
        c = self.canv
        def box(x, y, w, title, subtitle):
            c.setFillColor(PALE); c.setStrokeColor(LINE)
            c.roundRect(x, y, w, 44, 5, fill=1, stroke=1)
            c.setFillColor(INK); c.setFont('ZH', 11)
            c.drawCentredString(x+w/2, y+27, title)
            c.setFillColor(MUTED); c.setFont('ZH', 9.6)
            c.drawCentredString(x+w/2, y+11, subtitle)
        def arrow(x1, y1, x2, y2, dashed=False):
            c.saveState(); c.setStrokeColor(TEAL); c.setFillColor(TEAL)
            c.setLineWidth(1); c.setDash([3,2] if dashed else [])
            c.line(x1, y1, x2, y2)
            p=c.beginPath(); p.moveTo(x2, y2)
            if y1==y2:
                p.lineTo(x2-5, y2+3); p.lineTo(x2-5, y2-3)
            else:
                p.lineTo(x2-3, y2+5); p.lineTo(x2+3, y2+5)
            p.close(); c.drawPath(p,fill=1,stroke=0); c.restoreState()
        left, gap = 294, 25
        right = CW-left-gap
        box(0, 194, CW, '视图适配：Next 工程版 / 完整离线 HTML', 'React + Canvas / 等价 DOM')
        box(0, 112, left, '本机编排与受门控学习会话', 'ProgressStore / LearningSession')
        box(left+gap, 112, right, '外围 AI 适配', '仅消费已揭示证据')
        box(0, 31, left, '纯算法：grid / BFS / A* / 二叉堆', '无 React、DOM 或模型依赖')
        box(left+gap, 31, right, '手动复制 / 可选服务端', '不回写算法、评分与存档')
        arrow(left/2,194,left/2,156)
        arrow(left/2,112,left/2,75)
        arrow(left,134,left+gap,134,True)
        arrow(left+gap+right/2,112,left+gap+right/2,75)
        c.setFillColor(MUTED);c.setFont('ZH',8.8)
        c.drawString(0,8,'实线：主要调用方向；虚线：已揭示事实的数据边界。契约与 fixtures 跨层校验。')


def make_table(lines, reference=False):
    data=[]
    for row in lines:
        cells=[x.strip() for x in row.strip().strip('|').split('|')]
        if all(re.fullmatch(r':?-+:?',x.replace(' ','')) for x in cells):continue
        data.append(cells)
    n=len(data[0]); assert all(len(x)==n for x in data)
    ratios={2:[0.20,0.80],3:[0.26,0.38,0.36]}[n]
    if reference:ratios=[0.105,0.895]
    ps=ParagraphStyle('smalltable',parent=S['table'],fontSize=8.6,leading=12.5) if reference else S['table']
    rows=[[Paragraph(esc(x),S['th'] if i==0 else ps) for x in row] for i,row in enumerate(data)]
    t=Table(rows,colWidths=[CW*x for x in ratios],hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),TEAL),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),4 if reference else 6),('BOTTOMPADDING',(0,0),(-1,-1),4 if reference else 6),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#F1F6F6'),colors.white]),('LINEBELOW',(0,0),(-1,0),0.6,TEAL),('LINEBELOW',(0,1),(-1,-1),0.4,LINE)]))
    return t

def parse_body(body,reference=False):
    lines=body.splitlines(); out=[]; i=0
    while i<len(lines):
        text=lines[i].strip()
        if not text:i+=1;continue
        if text.startswith('## '):out.append(Paragraph(esc(text[3:]),S['h2']));i+=1;continue
        if text.startswith('```'):
            code=[];i+=1
            while i<len(lines) and not lines[i].startswith('```'):code.append(lines[i]);i+=1
            i+=1
            for line in code:
                assert pdfmetrics.stringWidth(line,S['code'].fontName,S['code'].fontSize)<CW-20, 'Code line overflows: '+line
            pre=XPreformatted(html.escape('\n'.join(code)),S['code'])
            box=Table([[pre]],colWidths=[CW]);box.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#F2F5F8')),('BOX',(0,0),(-1,-1),0.5,LINE),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]));out.extend([box,Spacer(1,9)]);continue
        if text==':::architecture':
            out.extend([ArchitectureDiagram(),Spacer(1,10)]);i+=1;continue
        if text==':::flow':
            flow=[];i+=1
            while i<len(lines) and lines[i].strip()!=':::':flow.append(lines[i].strip());i+=1
            out.extend([EvidenceFlow(flow),Spacer(1,10)]);i+=1;continue
        if text.startswith('|'):
            tbl=[]
            while i<len(lines) and lines[i].strip().startswith('|'):tbl.append(lines[i]);i+=1
            out.extend([make_table(tbl,reference),Spacer(1,10)]);continue
        if text.startswith('> '):
            p=Paragraph(esc(text[2:]),S['quote']);t=Table([[p]],colWidths=[CW]);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('LINEBEFORE',(0,0),(0,0),3,TEAL),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),6)]));out.extend([t,Spacer(1,11)]);i+=1;continue
        out.append(Paragraph(esc(text),S['source'] if text.startswith('来源：') else S['body']));i+=1
    return out


def category(n):
    if n<=3:return '01 / 项目与阅读指引'
    if n<=8:return '02 / 意图控制策略'
    if n<=16:return '03 / 架构设计'
    if n<=21:return '04 / 可复现性论证'
    return '05 / 可追溯性与附录'


def chrome(c,n,total,title):
    c.setFillColor(colors.white);c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(TEAL);c.rect(0,H-8,W,8,fill=1,stroke=0)
    c.setFont('ZH',9);c.setFillColor(TEAL);c.drawString(M,H-35,'PATHLAB AI  /  TECHNICAL REPORT')
    c.setFont('ZH',8.5);c.setFillColor(MUTED);c.drawRightString(W-M,H-35,category(n))
    c.setFont('ZHB',22);c.setFillColor(INK);c.drawString(M,H-83,title)
    c.setStrokeColor(LINE);c.line(M,48,W-M,48)
    c.setFont('ZH',8);c.setFillColor(MUTED);c.drawString(M,31,'基线 e438363  |  2026-10-25  |  本地技术文档')
    c.setFont('Mono',9);c.setFillColor(TEAL);c.drawRightString(W-M,31,f'{n:02d} / {total:02d}')
    c.setFillColor(TEAL);c.rect(M,47,(CW*n/total),1.5,fill=1,stroke=0)


def cover(c,total):
    c.setFillColor(INK);c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(TEAL);c.rect(0,H-12,W,12,fill=1,stroke=0)
    c.setFont('Mono',12);c.setFillColor(colors.HexColor('#82D5C8'));c.drawString(M,H-70,'EVIDENCE BEFORE EXPLANATION')
    c.setFont('ZHB',44);c.setFillColor(colors.white);c.drawString(M,H-147,'PathLab AI')
    c.setFont('ZHB',31);c.drawString(M,H-197,'技术文档')
    c.setFont('ZH',13);c.setFillColor(colors.HexColor('#BEDAD7'));c.drawString(M,H-238,'意图控制策略 / 架构设计 / 可复现性论证')
    c.setFont('ZH',11);c.drawString(M,H-271,'面向 BFS / A* 路径搜索的预测、实验与证据复盘系统')
    # Code-native search-grid motif: illustrative only, never described as runtime output.
    size=27;gx=W-M-6*size;gy=H-472
    cells={(1,2),(2,2),(4,3),(0,2),(4,1)}
    path=[(0,0),(1,0),(2,0),(2,1),(3,1),(3,2),(4,2),(5,2),(5,3)]
    for y in range(4):
        for x in range(6):
            c.setFillColor(colors.HexColor('#304752') if (x,y) in cells else colors.HexColor('#223E49'))
            c.roundRect(gx+x*size,gy+y*size,size-3,size-3,3,fill=1,stroke=0)
    c.setStrokeColor(colors.HexColor('#70D7BA'));c.setLineWidth(3)
    p=c.beginPath()
    for i,(x,y) in enumerate(path):
        px=gx+x*size+12;py=gy+y*size+12
        p.moveTo(px,py) if i==0 else p.lineTo(px,py)
    c.drawPath(p)
    c.setFillColor(colors.HexColor('#E8B46A'));c.circle(gx+12,gy+12,4,fill=1,stroke=0);c.circle(gx+5*size+12,gy+3*size+12,4,fill=1,stroke=0)
    c.setFont('ZH',9);c.setFillColor(colors.HexColor('#9EBFC4'));c.drawString(gx,gy-17,'搜索网格示意 / 非运行数据')
    c.setFillColor(colors.HexColor('#BDD6DC'));c.setFont('ZH',15);c.drawString(M,H-361,'让搜索过程成为可以预测、');c.drawString(M,H-390,'验证和解释的证据，');c.drawString(M,H-419,'而不是只看一段动画。')
    c.setStrokeColor(colors.HexColor('#3E5B65'));c.line(M,268,W-M,268)
    c.setFont('ZH',10);c.setFillColor(colors.HexColor('#BEDAD7'))
    for i,line in enumerate(['版本 1.0 / 编制日期 2026-10-25','项目作者 LJQZS08 / 文档整理与自动校验 AI 辅助','代码与证据基线 '+BASE,'交付范围 本地 PDF；不上传，不代替正式赛事提交']):
        c.drawString(M,239-i*24,line)
    c.setFont('Mono',9);c.setFillColor(colors.HexColor('#82D5C8'));c.drawString(M,54,f'24 PAGES / LOCAL EDITION / 01 OF {total:02d}')


def build():
    checks=evidence_check();register_fonts();styles()
    manuscript=(ROOT/'docs/technical-report.md').read_text(encoding='utf-8')
    parts=re.split(r'<!-- page: ([a-z-]+) -->',manuscript)
    sections=[]
    for i in range(1,len(parts),2):
        slug,body=parts[i],parts[i+1].strip()
        title,rest=body.split('\n',1)
        assert title.startswith('# ')
        sections.append((slug,title[2:],rest))
    assert len(sections)==24
    OUT.mkdir(parents=True,exist_ok=True)
    c=canvas.Canvas(str(PDF),pagesize=(W,H),pageCompression=1,invariant=1)
    c.setTitle('PathLab AI 技术文档：意图控制、架构设计与可复现性')
    c.setAuthor('LJQZS08')
    c.setSubject('Evidence-bounded local technical report; AI-assisted editing and QA; baseline '+BASE)
    page_stats=[]
    for n,(slug,title,body) in enumerate(sections,1):
        c.bookmarkPage(slug);c.addOutlineEntry(title,slug,0,False)
        if n==1:
            cover(c,len(sections));page_stats.append({'page':n,'title':title,'kind':'cover'});c.showPage();continue
        chrome(c,n,len(sections),title)
        story=parse_body(body,slug=='references')
        initial=len(story)
        available_height=H-110-66
        used=sum(f.wrap(CW,available_height)[1]+f.getSpaceBefore()+f.getSpaceAfter() for f in story)
        assert used <= available_height, f'Content overflow page {n}: {used:.1f} > {available_height:.1f}'
        frame=Frame(M,66,CW,available_height,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
        frame.addFromList(story,c)
        assert not story, f'Unplaced content on page {n}: {len(story)} remaining'
        page_stats.append({'page':n,'title':title,'flowables':initial,'calculatedContentHeight':round(used,2),'availableHeight':round(available_height,2)})
        c.showPage()
    c.save()
    reader=PdfReader(PDF)
    assert len(reader.pages)==24 and len(reader.pages)<=30
    extracted=[p.extract_text() or '' for p in reader.pages]
    for i,text in enumerate(extracted):
        assert len(text.strip())>100, f'Empty / missing text page {i+1}'
        assert '\ufffd' not in text and '\u25a0' not in text
    files=[]
    for ref,paths in SOURCES.items():
        for path in paths:
            b=(ROOT/path).read_bytes()
            original=baseline_bytes(path)
            files.append({'reference':ref,'path':path,'baselineBlobSha256':sha(original),'baselineBytes':len(original),'worktreeSha256':sha(b),'worktreeBytes':len(b),'worktreeByteIdentical':b==original,'worktreeEqualAfterLfNormalization':b.replace(b'\r\n',b'\n')==original.replace(b'\r\n',b'\n')})
    manifest={'format':'pathlab-technical-report-sources/v1','date':'2026-10-25','codeAndEvidenceBaseline':BASE,'measuredReproductionBaseline':'44b4ef24f39158c50229e96dd7ef048922dc1025','manuscript':'docs/technical-report.md','manuscriptSha256':sha(manuscript.encode('utf-8')),'sourcePathsAreRepositoryRelative':True,'sourceAuthority':'Git blobs at codeAndEvidenceBaseline; worktree hashes are informational, with CRLF/LF equivalence reported separately','sourceFiles':files,'scope':'Project source and recorded evidence only; no private environment files or full personal session logs'}
    (OUT/'PathLab-AI-技术文档-来源清单.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    report={'executor':'AI','date':'2026-10-25','pdfFile':PDF.name,'pages':len(reader.pages),'within30PageLimit':True,'pdfSha256':sha(PDF.read_bytes()),'pdfBytes':PDF.stat().st_size,'metadataCreationDate':reader.metadata.creation_date.isoformat(),'embeddedFonts':True,'textPresentOnEveryPage':True,'replacementGlyphFound':False,'evidenceChecks':checks,'pageLayout':page_stats,'visualInspection':'pending','limits':['Document build and evidence checks, not a fresh product regression','Not human or real-device acceptance','Current final conversation answer is not yet persisted','Local-only, no upload performed']}
    (OUT/'PathLab-AI-技术文档-校验记录.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (OUT/(PDF.name+'.sha256')).write_text(sha(PDF.read_bytes())+'  '+PDF.name+'\n',encoding='utf-8')
    print(json.dumps({'pdf':str(PDF),'pages':len(reader.pages),'bytes':PDF.stat().st_size,'sourceFileEntries':len(files),'evidenceChecks':checks},ensure_ascii=False,indent=2))

if __name__=='__main__':
    argparse.ArgumentParser(description=__doc__).parse_args()
    build()