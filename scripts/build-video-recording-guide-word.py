"""Build the Word recording guide from its existing Markdown source. No network."""
from pathlib import Path
from hashlib import sha256
import json
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.opc.constants import RELATIONSHIP_TYPE as RT

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/video-recording-guide.md'
OUT = ROOT / 'output/docx/PathLab-AI-演示视频录制指导.docx'
QA = ROOT / '.cache/video-guide-docx-qa'
FONT = 'Microsoft YaHei'


def font_setup(style, size, bold=False, latin=None):
    # Word's CJK document grid otherwise overrides the intended readable line spacing.
    ppr = style.element.get_or_add_pPr()
    snap = OxmlElement('w:snapToGrid')
    snap.set(qn('w:val'), '0')
    ppr.append(snap)
    style.font.name = latin or FONT
    style.font.size = Pt(size)
    style.font.bold = bold
    style.font.italic = False
    style.font.color.rgb = RGBColor(0, 0, 0)
    rpr = style.element.get_or_add_rPr()
    fonts = rpr.find(qn('w:rFonts'))
    if fonts is None:
        fonts = OxmlElement('w:rFonts')
        rpr.insert(0, fonts)
    for k, value in [('ascii', latin or FONT), ('hAnsi', latin or FONT), ('eastAsia', FONT), ('cs', FONT)]:
        fonts.set(qn('w:' + k), value)
    for theme in ['asciiTheme', 'hAnsiTheme', 'eastAsiaTheme', 'cstheme']:
        fonts.attrib.pop(qn('w:' + theme), None)
    borders = style.element.find('.//' + qn('w:pBdr'))
    if borders is not None:
        borders.getparent().remove(borders)


def inline(paragraph, text, base_size=None):
    token = re.compile(r'(\*\*.*?\*\*|`[^`]+`|\[[^\]]+\]\(https?://[^)]+\))')
    for part in token.split(text):
        if not part:
            continue
        if part.startswith('**') and part.endswith('**'):
            run = paragraph.add_run(part[2:-2]); run.bold = True
        elif part.startswith('`') and part.endswith('`'):
            run = paragraph.add_run(part[1:-1])
            run.font.name = 'Consolas'
            run._element.get_or_add_rPr().rFonts.set(qn('w:eastAsia'), FONT)
            if base_size:
                run.font.size = Pt(base_size)
        elif part.startswith('[') and '](' in part:
            m = re.fullmatch(r'\[([^\]]+)\]\((https?://[^)]+)\)', part)
            link = OxmlElement('w:hyperlink')
            link.set(qn('r:id'), paragraph.part.relate_to(m[2], RT.HYPERLINK, is_external=True))
            r = OxmlElement('w:r'); pr = OxmlElement('w:rPr')
            fonts = OxmlElement('w:rFonts'); fonts.set(qn('w:eastAsia'), FONT); pr.append(fonts)
            color = OxmlElement('w:color'); color.set(qn('w:val'), '000000'); pr.append(color)
            underline = OxmlElement('w:u'); underline.set(qn('w:val'), 'single'); pr.append(underline)
            r.append(pr); t = OxmlElement('w:t'); t.text = m[1]; r.append(t); link.append(r)
            paragraph._p.append(link)
        else:
            paragraph.add_run(part)


source = SOURCE.read_text(encoding='utf-8')
doc = Document()
sec = doc.sections[0]
grid = sec._sectPr.find(qn('w:docGrid'))
if grid is not None:
    sec._sectPr.remove(grid)
sec.page_width = Inches(8.5)
sec.page_height = Inches(11)
sec.top_margin = sec.bottom_margin = Inches(.68)
sec.left_margin = sec.right_margin = Inches(.68)
sec.header_distance = sec.footer_distance = Inches(.28)
normal = doc.styles['Normal']
font_setup(normal, 11)
normal.paragraph_format.line_spacing = Pt(16.5)
normal.paragraph_format.space_after = Pt(5)
normal.paragraph_format.widow_control = True
for name, size, before, after in [('Title', 23, 0, 8), ('Subtitle', 12, 0, 10), ('Heading 1', 15, 15, 8), ('Heading 2', 12, 11, 6)]:
    st = doc.styles[name]
    font_setup(st, size, name != 'Subtitle')
    st.paragraph_format.space_before = Pt(before)
    st.paragraph_format.space_after = Pt(after)
    st.paragraph_format.line_spacing = Pt({'Title': 30, 'Subtitle': 18, 'Heading 1': 21, 'Heading 2': 18}[name])
    st.paragraph_format.keep_with_next = True
for name in ['Code Guide', 'Guide List', 'Guide Quote', 'Guide Small']:
    if name not in doc.styles:
        doc.styles.add_style(name, 1)
font_setup(doc.styles['Code Guide'], 10.5, latin='Consolas')
cp = doc.styles['Code Guide'].paragraph_format
cp.line_spacing = Pt(14.5)
cp.space_before = cp.space_after = Pt(0)
cp.left_indent = Inches(.12)
cp.right_indent = Inches(.08)
cp.keep_together = True
lp = doc.styles['Guide List'].paragraph_format
lp.left_indent = Inches(.2)
lp.first_line_indent = Inches(-.2)
lp.space_after = Pt(4)
lp.line_spacing = Pt(16.5)
lp.keep_together = True
font_setup(doc.styles['Guide List'], 11)
qp = doc.styles['Guide Quote'].paragraph_format
qp.left_indent = Inches(.18)
qp.right_indent = Inches(.12)
qp.line_spacing = Pt(16.5)
qp.space_before = Pt(3)
qp.space_after = Pt(7)
font_setup(doc.styles['Guide Quote'], 11)
font_setup(doc.styles['Guide Small'], 9)
foot = sec.footer.paragraphs[0]
foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
foot.style = doc.styles['Guide Small']
foot.add_run('第 ')
f = OxmlElement('w:fldSimple'); f.set(qn('w:instr'), 'PAGE'); foot._p.append(f)
foot.add_run(' 页')
settings = doc.settings.element
compat = settings.find(qn('w:compat'))
if compat is None:
    compat = OxmlElement('w:compat'); settings.append(compat)
cs = OxmlElement('w:compatSetting')
cs.set(qn('w:name'), 'compatibilityMode'); cs.set(qn('w:uri'), 'http://schemas.microsoft.com/office/word'); cs.set(qn('w:val'), '15'); compat.append(cs)
lang = OxmlElement('w:themeFontLang'); lang.set(qn('w:val'), 'en-US'); lang.set(qn('w:eastAsia'), 'zh-CN'); settings.append(lang)

headings = {
    1: '1 录制目标与硬条件', 2: '2 开录前的窗口准备', 3: '3 七分钟分镜与口播',
    4: '4 AI 协同段与可复制 Prompt', 5: '5 现场复现与真实项目的对应关系',
    6: '6 录屏设置与试录', 7: '7 成片检查清单', 8: '8 常见误区', 9: '9 来源与真实性边界'
}

def make_table(rows):
    table = doc.add_table(rows=0, cols=3)
    table.autofit = False
    widths = [.85, 2.55, 3.74]
    for col, width in zip(table.columns, widths):
        col.width = Inches(width)
    pr = table._tbl.tblPr
    b = OxmlElement('w:tblBorders')
    for edge in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        e = OxmlElement('w:' + edge); e.set(qn('w:val'), 'single'); e.set(qn('w:sz'), '4'); e.set(qn('w:color'), 'D9D9D9'); b.append(e)
    pr.append(b)
    for index, values in enumerate(rows):
        cells = table.add_row().cells
        trpr = cells[0]._tc.getparent().get_or_add_trPr()
        no_split = OxmlElement('w:cantSplit'); trpr.append(no_split)
        if index == 0:
            repeat = OxmlElement('w:tblHeader'); trpr.append(repeat)
        for j, (cell, text) in enumerate(zip(cells, values)):
            cell.width = Inches(widths[j]); cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            tcpr = cell._tc.get_or_add_tcPr()
            margins = OxmlElement('w:tcMar')
            for edge, value in [('top', 85), ('bottom', 85), ('left', 90), ('right', 90)]:
                e = OxmlElement('w:' + edge); e.set(qn('w:w'), str(value)); e.set(qn('w:type'), 'dxa'); margins.append(e)
            tcpr.append(margins)
            if index == 0:
                shade = OxmlElement('w:shd'); shade.set(qn('w:fill'), 'E6EDF3'); tcpr.append(shade)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = Pt(15.5)
            if j == 0 or index == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            inline(p, text, 10.5)
            for r in p.runs:
                r.font.size = Pt(10.5)
                if index == 0:
                    r.bold = True

lines = source.splitlines()
code_blocks = []
i = 0
while i < len(lines):
    line = lines[i]
    if not line.strip():
        i += 1; continue
    if line.startswith('# '):
        doc.add_paragraph('PathLab AI 演示视频录制指导', 'Title')
        doc.add_paragraph('七分钟分镜 口播与 AI 协同复现', 'Subtitle')
    elif line.startswith('## '):
        num = int(re.match(r'## (\d+)', line)[1])
        p = doc.add_paragraph(headings[num], 'Heading 1')
        if num == 9:
            p.paragraph_format.page_break_before = True
    elif line.startswith('### '):
        h = line[4:]
        if h.startswith('2:40'):
            h = '两分四十秒协同段安排'
        h = re.sub(r'[：:（）()]', ' ', h)
        h = re.sub(r'\s+', ' ', h).strip()
        doc.add_paragraph(h, 'Heading 2')
    elif line.startswith('```'):
        block = []
        i += 1
        while i < len(lines) and not lines[i].startswith('```'):
            block.append(lines[i]); i += 1
        code_blocks.append('\n'.join(block))
        for j, value in enumerate(block):
            p = doc.add_paragraph(value, 'Code Guide')
            p.paragraph_format.keep_with_next = j < len(block) - 1
        doc.add_paragraph().paragraph_format.space_after = Pt(1)
    elif line.startswith('|'):
        rows = []
        while i < len(lines) and lines[i].startswith('|'):
            row = [x.strip() for x in lines[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?', x) for x in row):
                rows.append(row)
            i += 1
        make_table(rows)
        doc.add_paragraph().paragraph_format.space_after = Pt(2)
        continue
    elif line.startswith('> '):
        p = doc.add_paragraph(style='Guide Quote'); inline(p, line[2:])
    elif line.startswith('- [ ] '):
        p = doc.add_paragraph(style='Guide List')
        r = p.add_run('☐ '); r.font.name = 'Segoe UI Symbol'
        inline(p, line[6:])
    elif line.startswith('- ') or re.match(r'^\d+\. ', line):
        p = doc.add_paragraph(style='Guide List')
        inline(p, ('• ' + line[2:]) if line.startswith('- ') else line)
    else:
        p = doc.add_paragraph(); inline(p, line)
        if line.rstrip().endswith(('：', ':')):
            p.paragraph_format.keep_with_next = True
    i += 1

props = doc.core_properties
props.title = 'PathLab AI 演示视频录制指导'
props.subject = '七分钟分镜 口播 新拟复现 Prompt 与成片检查清单'
props.author = 'PathLab AI'
props.keywords = 'PathLab AI, 视频录制, AI 协同, BFS, Prompt'
props.comments = ''
OUT.parent.mkdir(parents=True, exist_ok=True)
QA.mkdir(parents=True, exist_ok=True)
doc.save(OUT)
# Check that every original prose/table/code line survives conversion, apart from renamed headings.
from lxml import etree
with __import__('zipfile').ZipFile(OUT) as z:
    xml = etree.fromstring(z.read('word/document.xml'))
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
paragraphs = [''.join(p.xpath('.//w:t/text()', namespaces=ns)) for p in xml.xpath('//w:body//w:p', namespaces=ns)]
combined = '\n'.join(paragraphs)
def plain(value):
    value = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', r'\1', value)
    return value.replace('**', '').replace('`', '')
missing = []
in_code = False
for no, line in enumerate(lines, 1):
    if line.startswith('```'):
        in_code = not in_code; continue
    if not line.strip() or line.startswith('#') or (line.startswith('|') and re.fullmatch(r'[|: \-]+', line)):
        continue
    if in_code:
        candidates = [line]
    elif line.startswith('|'):
        candidates = [plain(x.strip()) for x in line.strip('|').split('|')]
    else:
        candidate = re.sub(r'^(?:- \[ \] |- |> )', '', line)
        candidates = [plain(candidate)]
    for candidate in candidates:
        if candidate and candidate not in combined:
            missing.append({'sourceLine': no, 'text': candidate})
if missing:
    raise AssertionError(missing)
for block in code_blocks:
    assert block in combined, 'Code block copy fidelity failed'
assert len(doc.tables) == 1 and len(doc.tables[0].rows) == 8
assert combined.count('☐ ') == 10
report = {
    'source': str(SOURCE), 'sourceSha256': sha256(SOURCE.read_bytes()).hexdigest(),
    'output': str(OUT), 'outputSha256': sha256(OUT.read_bytes()).hexdigest(),
    'outputBytes': OUT.stat().st_size, 'sourceLineCount': len(lines),
    'tableRowsIncludingHeader': 8, 'checklistCount': 10, 'codeBlocks': len(code_blocks),
    'codeBlockSha256': [sha256(b.encode()).hexdigest() for b in code_blocks],
    'missingSourceLines': missing, 'textFidelity': 'all nonheading source content preserved; headings normalized',
    'pageSize': 'Letter portrait 8.5x11 inches', 'bodyFont': FONT, 'bodyFontSizePt': 11,
    'bodyLineSpacingPt': 16.5, 'codeLineSpacingPt': 14.5, 'gridSnapping': False,
    'visualInspection': {'status': 'pending'},
}
(QA / 'structure.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
