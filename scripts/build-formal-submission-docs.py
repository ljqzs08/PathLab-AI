"""Reuse the established DOCX layout for the separate E040 reviewer edition."""
from pathlib import Path
import os,importlib.util,json,hashlib
from docx import Document
R=Path(__file__).resolve().parents[1];T=R/'.cache/formal-submission-20261115'
spec=importlib.util.spec_from_file_location('latest_doc_layout',R/'scripts/build-latest-submission-docs.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
m.FULL=R/'delivery/PathLab-AI-正式参赛文件-20261115';m.TMP=T
os.environ['TEMP']=os.environ['TMP']=str(T)
rows=[]
for source,folder,name in [('formal-project-introduction.md','01-作品介绍','PathLab-AI-作品介绍文档'),('formal-technical-report.md','02-技术文档','PathLab-AI-技术文档')]:
 row=m.build(source,folder,name);p=R/row['docx'];d=Document(p)
 for s in d.sections:
  for q in s.header.paragraphs:
   for run in q.runs:run.text=run.text.replace('本地完整迁移版','正式提交版')
 d.core_properties.subject='2026-11-15 formal reviewer-facing submission edition';d.save(p)
 row['sha256']=hashlib.sha256(p.read_bytes()).hexdigest();rows.append(row)
(R/'docs/evidence/formal-submission-documents-20261115.json').write_text(json.dumps({'date':'2026-11-15','executor':'AI','edition':'formal reviewer packet','files':rows,'rendering':'pending actual Word export and visual inspection'},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(rows,ensure_ascii=True))
