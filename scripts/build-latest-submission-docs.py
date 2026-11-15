"""Create two editable DOCX from dated, versioned Markdown; no network."""
from pathlib import Path
import os,re,json,hashlib,sys
from docx import Document
from docx.shared import Inches,Pt,RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH
ROOT=Path(__file__).resolve().parents[1]
TMP=ROOT/'.cache/submission-latest-20261115';os.environ['TEMP']=os.environ['TMP']=str(TMP)
FULL=ROOT/'delivery/PathLab-AI-参赛文件-最新版-20261115/04-完整材料解压版'
ASSETS=ROOT/'docs/assets/submission-20261115'
FONT='Microsoft YaHei'
def setup(st,size,bold=False):
 st.font.name=FONT;st.font.size=Pt(size);st.font.bold=bold;st.font.italic=False;st.font.color.rgb=RGBColor(0,0,0)
 r=st.element.get_or_add_rPr();ff=r.find(qn('w:rFonts'))
 if ff is None:ff=OxmlElement('w:rFonts');r.insert(0,ff)
 for k in ['ascii','hAnsi','eastAsia','cs']:ff.set(qn('w:'+k),FONT)
 for k in ['asciiTheme','hAnsiTheme','eastAsiaTheme','cstheme']:ff.attrib.pop(qn('w:'+k),None)
 pf=st.paragraph_format;pf.line_spacing=Pt(size*1.5);pf.widow_control=True
 pr=st.element.get_or_add_pPr();snap=OxmlElement('w:snapToGrid');snap.set(qn('w:val'),'0');pr.append(snap)
 for b in st.element.findall('.//'+qn('w:pBdr')):b.getparent().remove(b)
def text(p,s):
 for i,part in enumerate(re.split(r'(\*\*.*?\*\*|`[^`]+`)',s)):
  if not part:continue
  run=p.add_run(part[2:-2] if part.startswith('**') else part[1:-1] if part.startswith('`') else part)
  if part.startswith('**'):run.bold=True

def table(doc,rows):
 t=doc.add_table(rows=1, cols=len(rows[0]));t.autofit=False
 widths=[7.06/len(rows[0])]*len(rows[0])
 if len(rows[0])==3:widths=[1.32,2.87,2.87]
 if len(rows[0])==2:widths=[2.08,4.98]
 for c,w in zip(t.columns,widths):c.width=Inches(w)
 for i,row in enumerate(rows):
  cells=t.rows[0].cells if i==0 else t.add_row().cells
  for j,value in enumerate(row):
   cells[j].width=Inches(widths[j]);p=cells[j].paragraphs[0];p.paragraph_format.space_after=Pt(3);p.paragraph_format.space_before=Pt(3);p.paragraph_format.line_spacing=Pt(14.5)
   r=p.add_run(value);r.font.size=Pt(10);r.bold=(i==0)
  pr=t.rows[i]._tr.get_or_add_trPr();cant=OxmlElement('w:cantSplit');pr.append(cant)
  if i==0:rep=OxmlElement('w:tblHeader');pr.append(rep)
 # Thin black horizontal rules, no colored/shaded callouts.
 pr=t._tbl.tblPr;b=OxmlElement('w:tblBorders')
 for edge in ['top','bottom','insideH']:
  e=OxmlElement('w:'+edge);e.set(qn('w:val'),'single');e.set(qn('w:sz'),'4');e.set(qn('w:color'),'B8B8B8');b.append(e)
 pr.append(b);doc.add_paragraph().paragraph_format.space_after=Pt(0)

def build(stem,subdir,name):
 source=ROOT/'docs'/stem;raw=source.read_text(encoding='utf-8-sig');doc=Document();sec=doc.sections[0]
 sec.page_width=Inches(8.5);sec.page_height=Inches(11)
 sec.left_margin=sec.right_margin=Inches(.72);sec.top_margin=Inches(.62);sec.bottom_margin=Inches(.6)
 sec.header_distance=sec.footer_distance=Inches(.25)
 grid=sec._sectPr.find(qn('w:docGrid'))
 if grid is not None:sec._sectPr.remove(grid)
 for style,size,bold in [('Normal',11,False),('Title',27,True),('Subtitle',13,False),('Heading 1',19,True),('Heading 2',12.5,True),('Caption',9,False)]:
  setup(doc.styles[style],size,bold)
 doc.styles['Normal'].paragraph_format.space_after=Pt(7)
 for style in ['Heading 1','Heading 2']:
  doc.styles[style].paragraph_format.space_before=Pt(9 if style=='Heading 2' else 0);doc.styles[style].paragraph_format.space_after=Pt(8);doc.styles[style].paragraph_format.keep_with_next=True
 hp=sec.header.paragraphs[0];hp.add_run('PATHLAB AI  /  2026-11-15  /  本地完整迁移版').font.size=Pt(8)
 footer=sec.footer.paragraphs[0];footer.alignment=WD_ALIGN_PARAGRAPH.RIGHT
 footer.add_run('PathLab AI   ·   ').font.size=Pt(8)
 fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');footer._p.append(fld)
 lines=raw.splitlines();i=0;page=0;image_count=0
 while i<len(lines):
  line=lines[i].strip();i+=1
  if not line:continue
  if line.startswith('<!-- page:'):
   if page:doc.add_page_break()
   page+=1;continue
  if line.startswith(':::image '):
   bits=line.split();pic=ASSETS/(bits[1]+'.png');assert pic.exists();p=doc.add_paragraph();p.paragraph_format.space_after=Pt(3);p.paragraph_format.line_spacing=1;p.add_run().add_picture(str(pic),width=Inches(float(bits[2])));p.alignment=WD_ALIGN_PARAGRAPH.CENTER
   cap=doc.add_paragraph('实际离线页面 · AI 自动操作截图 · 2026-11-15',style='Caption');cap.paragraph_format.space_after=Pt(7);image_count+=1;continue
  if line.startswith('```'):
   code=[]
   while i<len(lines) and not lines[i].startswith('```'):code.append(lines[i]);i+=1
   i+=1
   p=doc.add_paragraph();p.paragraph_format.line_spacing=Pt(12.5);p.paragraph_format.space_after=Pt(8)
   for j,v in enumerate(code):
    r=p.add_run(('\n' if j else '')+v);r.font.name='Consolas';r.font.size=Pt(9)
   continue
  if line.startswith('|'):
   rows=[]
   while True:
    vals=[v.strip() for v in line.strip('|').split('|')]
    if not all(re.fullmatch(r'[-: ]+',v) for v in vals):rows.append(vals)
    if i>=len(lines) or not lines[i].lstrip().startswith('|'):break
    line=lines[i].strip();i+=1
   table(doc,rows);continue
  if line.startswith('# '):doc.add_paragraph(line[2:],style='Title' if page==1 else 'Heading 1');continue
  if line.startswith('## '):doc.add_paragraph(line[3:],style='Subtitle' if page==1 else 'Heading 2');continue
  p=doc.add_paragraph();text(p,line)
 doc.core_properties.title='PathLab AI '+name;doc.core_properties.subject='2026-11-15 latest complete migration';doc.core_properties.author='PathLab AI 项目材料';doc.core_properties.comments='AI-assisted material authoring; not human or device acceptance.'
 out=FULL/subdir/(name+'-最新版-20261115.docx');out.parent.mkdir(parents=True,exist_ok=True);doc.save(out)
 return {'source':stem,'docx':out.relative_to(ROOT).as_posix(),'plannedPages':page,'embeddedScreenshots':image_count,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
if __name__=='__main__':
 result=[build('latest-project-introduction.md','01-作品介绍','PathLab-AI-作品介绍文档'),build('latest-technical-report.md','02-技术文档','PathLab-AI-技术文档')]
 (ROOT/'docs/evidence/latest-submission-documents-20261115.json').write_text(json.dumps({'date':'2026-11-15','executor':'AI','creation':'python-docx from versioned Markdown, editable text and tables, original screenshots','files':result,'rendering':'pending actual Word and visual verification'},ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result,ensure_ascii=True))
