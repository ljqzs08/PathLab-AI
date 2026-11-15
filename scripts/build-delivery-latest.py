"""Build a complete latest packet with byte-preserved migration, not a delta.
Usage: bundled Python -B scripts/build-delivery-latest.py prepare|source|package|verify
No publishing, no changes to author inputs or v3. All output is inside D workspace.
"""
from pathlib import Path
import json,sys,os,hashlib,shutil,subprocess,tarfile,io,zipfile,html
ROOT=Path(__file__).resolve().parents[1]
NEW=ROOT/'delivery/PathLab-AI-参赛文件-最新版-20261115'
OLD=ROOT/'delivery/PathLab-AI-参赛文件-v3'
FULL=NEW/'04-完整材料解压版'
TMP=ROOT/'.cache/submission-latest-20261115'
HIST=FULL/'12-历史材料/v3'
DATE='2026-11-15'
HTML='PathLab_AI_v4_optimized_final.html'
EXPECTED='7bd7f222529701b1912be5f30f4ea097d8f2205521e6e900d829cd97c03c917a'
os.environ['TEMP']=os.environ['TMP']=str(TMP);sys.dont_write_bytecode=True
if ROOT.drive.upper()!='D:':raise SystemExit('D workspace only')
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1<<20),b''):h.update(b)
 return h.hexdigest()
def put(p,t):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(t,encoding='utf-8')
def stream_sha(stream):
 h=hashlib.sha256()
 for block in iter(lambda:stream.read(1<<20),b''):h.update(block)
 return h.hexdigest()
def cp(s,t):t.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(s,t)
def js(p,d):put(p,json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def git(*a):return subprocess.run(['git','-C',str(ROOT),*a],check=True,capture_output=True,text=True,encoding='utf-8').stdout.strip()
def prepare():
 assert sha(ROOT/HTML)==EXPECTED,'Selected HTML has changed; audit before packaging'
 if NEW.exists():raise SystemExit('Output exists. Refusing to overwrite a completed or partial packet.')
 FULL.mkdir(parents=True); HIST.mkdir(parents=True)
 shutil.copytree(OLD/'04-完整材料解压版',FULL,dirs_exist_ok=True)
 # Retain old current materials as historical records; do not present stale docs/source as current.
 for name in ['01-作品介绍','02-技术文档','03-离线体验','04-源码与演进','09-演示视频','00-评审入口.md','GitHub作品仓库地址.txt','manifest.json']:
  (FULL/name).rename(HIST/name)
 index={}
 for p in sorted(FULL.rglob('*')):
  if p.is_file():index.setdefault(sha(p),p)
 baseline=json.loads((ROOT/'docs/evidence/latest-submission-inputs-20261115.json').read_text(encoding='utf-8'))
 mapped=[]
 for row in baseline['v3Files']:
  src=OLD/row['oldRelative'];assert sha(src)==row['sha256'],'Original v3 changed during work'
  dest=index.get(row['sha256'])
  if not dest:
   dest=HIST/'v3原外层文件'/row['oldRelative'];cp(src,dest);index[row['sha256']]=dest
  assert sha(dest)==row['sha256']
  mapped.append({'oldPath':row['oldRelative'],'newPath':dest.relative_to(NEW).as_posix(),'bytes':row['bytes'],'sha256':row['sha256'],'verified':True})
 js(FULL/'10-最新版更新说明/v3迁移映射.json',{'date':DATE,'executor':'AI','oldPathCount':len(mapped),'uniqueRetainedFiles':len(set(x['newPath'] for x in mapped)),'method':'Every original v3 file path maps to one exact-byte file within this new folder. Identical duplicates share a retained copy. No evidence content is rewritten.','files':mapped})
 put(FULL/'10-最新版更新说明/v3迁移说明.md','# v3 原记录迁移说明\n\n原 v3 共 '+str(len(mapped))+' 个文件路径均已迁入本新版文件夹。相同字节的重复副本共用一个保留文件；各原路径、保留位置、大小和 SHA256 见同目录 JSON 映射。\n\n原 v3 源码、文档、离线 HTML、Git bundle、视频、manifest 和旧原始 ZIP 均保留。旧材料内的日期、版本、待办与 GitHub 说法是历史时点记录，不能当作本版状态；当前状态以新版 00 入口和新版验证记录为准。\n')
 cp(ROOT/HTML,FULL/'03-离线体验'/HTML)
 # No renamed competing HTML entry; the chosen filename remains authoritative.
 for folder in ['01-作品介绍','02-技术文档','04-源码与演进','09-演示视频/作者视频原件','09-演示视频/H264兼容播放','11-最新验证证据']:(FULL/folder).mkdir(parents=True,exist_ok=True)
 for p in sorted(ROOT.glob('微信图片_202611151006*.jpg')):cp(p,FULL/'05-Prompt证据/20261115新增拍屏原图'/p.name)
 ref=Path('C:/Users/LJQ/AppData/Local/Temp/codex-clipboard-fe789e5b-d6cb-4f33-8332-83f903926a5b.png')
 if ref.exists():cp(ref,FULL/'10-最新版更新说明/v3目录结构参考原图.png')
 for name in ['183595fb6fa9eb107ab392f73ca80aa4.mp4','ee88b0dd110e97bb568bd819e5fa5f5f.mp4','新版本mp4.mp4']:cp(ROOT/name,FULL/'09-演示视频/作者视频原件'/name)
 # Preserve newer real visible messages and existing verification, without manufacturing full transcripts.
 for stem in ['2026-11-14-v4-journey','2026-11-15-ui-beginner','2026-11-15-web-review-entry','2026-11-15-latest-submission-request','2026-11-15-latest-submission-migration']:
  for ext in ['md','jsonl']:
   p=ROOT/f'prompts/sessions/{stem}.{ext}'
   if p.exists():cp(p,FULL/'05-Prompt证据/最新文字记录'/p.name)
 for name in ['verification-v4-journey.md','verification-ui-beginner.md','verification-web-review-entry.md','verification-v3-mastery.md','core-chain-evidence.md']:
  p=ROOT/'docs'/name
  if p.exists():cp(p,FULL/'11-最新验证证据/既有验证记录'/name)
 for name in ['latest-submission-inputs-20261115.json','latest-submission-media-20261115.json','web-review-entry-20261115.json','web-review-entry-visual-20261115.json','e038-web-review-entry-20261115-ui.json','e038-web-review-entry-20261115-original-regression.json','e038-web-review-entry-20261115-preservation.json']:
  p=ROOT/'docs/evidence'/name
  if p.exists():cp(p,FULL/'11-最新验证证据/既有与输入核验'/name)
 put(NEW/'00-提交说明.md',ENTRY)
 put(FULL/'00-评审入口.md',ENTRY)
 repo='PathLab AI 作品仓库（代码托管，不是在线网站）\nhttps://github.com/ljqzs08/PathLab-AI\n\n本包以作者指定独立 HTML 为主件。新版 HTML 含独立增强层，Next 源码不自动等于它。\n本轮未 push、未上传、未重新核验远程 HEAD；不要将历史公开版本说成与本包完全一致。完整本地源码、原始底稿、增强脚本和 Git bundle 随包提供。\n'
 put(NEW/'GitHub作品仓库地址.txt',repo);put(FULL/'GitHub作品仓库地址.txt',repo)
 put(FULL/'03-离线体验/使用说明.md',OFFLINE)
 put(FULL/'09-演示视频/视频说明与真实边界.md',VIDEO_NOTE)
 put(FULL/'05-Prompt证据/最新证据阅读说明.md',PROMPT_NOTE)
 put(FULL/'08-规则与提交说明/本版状态与旧规则边界.md','# 本版提交状态\n\n本轮只整理本地材料，不 push、不上传网盘或视频平台、不填表、不代交赛事。旧规则文件按原日期保留，不代表 2026-11-15 仍有报名入口或截止期有效。本版不声称重新核验官网。\n\n旧材料采用的视频口径为 5 至 8 分钟、1080p、至少 2 分钟实际 AI 协同；这是历史材料口径，提交前应核对当前实际表单。新三段视频不能仅靠转码满足它。个人身份、联系方式、作者素材授权、学习者同意和提交权限应由本人确认。\n')
 put(NEW/'表单填写草稿.txt',FORM)
 # A browsable, entirely local entry point and photo gallery.
 gallery=['<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>20261115新增Prompt原图</title><style>body{font:17px system-ui;max-width:1000px;margin:30px auto;padding:16px}img{max-width:100%;height:auto}article{margin:35px 0}a{color:#075b40}</style><h1>20261115新增Prompt拍屏原图</h1><p>七张原文件原字节。属于局部拍屏补充，不是完整对话导出。旧对话中的预期评分、提升比例、v5版本等不作为本版实测成果。</p>']
 for i,p in enumerate(sorted((FULL/'05-Prompt证据/20261115新增拍屏原图').glob('*.jpg')),1):gallery.append(f'<article><h2>{i} {p.name}</h2><a href="{p.name}">查看原尺寸</a><br><img src="{p.name}" alt="作者提供的第{i}张Prompt原图"></article>')
 put(FULL/'05-Prompt证据/20261115新增拍屏原图/00-原图索引.html',''.join(gallery)+'</html>')
 write_portal()
 print(json.dumps({'folder':str(NEW),'migratedPaths':len(mapped),'uniqueV3Files':len(set(x['newPath'] for x in mapped))},ensure_ascii=True))
def write_portal():
 links=[('打开最新离线作品','03-离线体验/'+HTML),('阅读最新版作品介绍 PDF','01-作品介绍/PathLab-AI-作品介绍文档-最新版-20261115.pdf'),('阅读最新版技术文档 PDF','02-技术文档/PathLab-AI-技术文档-最新版-20261115.pdf'),('作者新产品视频 H264兼容版','09-演示视频/H264兼容播放/新版本mp4-H264.mp4'),('新增Prompt七张原图','05-Prompt证据/20261115新增拍屏原图/00-原图索引.html'),('完整迁移与验收说明','10-最新版更新说明/材料验收报告.html'),('源码恢复与一致性说明','04-源码与演进/源码一致性与恢复说明.md'),('新旧证据阅读导航','07-文档源稿与来源/20261115最新版/latest-evidence-guide.md'),('全部旧记录迁移映射','10-最新版更新说明/v3迁移映射.json'),('GitHub代码仓库（联网）','https://github.com/ljqzs08/PathLab-AI')]
 page='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>PathLab AI 最新参赛材料 20261115</title><style>body{font:18px/1.7 system-ui;background:#f4f7f5;color:#18362b;max-width:980px;margin:40px auto;padding:24px}h1{font-size:30px}a{display:block;color:#09583e;background:white;padding:18px;margin:14px 0;border-radius:10px;border:1px solid #d1dfd7}p{color:#40574d}small{display:block}</style><h1>PathLab AI 最新参赛材料</h1><p>2026年11月15日完整迁移版。以作者指定 HTML 为当前体验；旧版源码、文档、视频、Prompt与Git记录已经迁入本文件夹，不需要回到v3找文件。</p>'+''.join(f'<a href="{u}">{n}</a>' for n,u in links)+'<p>视频原件与兼容版均在包内。AI自动检查不等于人工或真机验收；未进行真实DeepSeek发送、付费API联调或正式赛事提交。详见同目录00-评审入口.md。</p></html>'
 put(FULL/'00-评审入口.html',page)
 put(FULL/'00-打开最新参赛材料.html',page)
 # Root-facing entry keeps paths relative to FULL without copying stale v3 HTML.
 put(NEW/'00-打开最新参赛材料.html',page.replace('href="','href="04-完整材料解压版/').replace('href="04-完整材料解压版/https:','href="https:').replace('详见同目录00-评审入口.md。','详见同目录00-提交说明.md。'))
def write_acceptance():
 proof=json.loads((FULL/'04-源码与演进/source-export-verification.json').read_text(encoding='utf-8'))
 packed=json.loads((ROOT/'docs/evidence/latest-submission-packed-browser-20261115.json').read_text(encoding='utf-8'))
 assert packed['passed']==23 and packed['selectedHtmlSha256']==EXPECTED
 sections=[
 ('当前主件',f"{HTML}；7,127,303字节；SHA256 {EXPECTED}。作者指定原文件未修改。"),
 ('完整迁移',"v3的622个原路径均在新文件夹内找到原字节副本；相同内容重复路径可共用保留文件，实际572个唯一保留文件。旧文档/源码/HTML/视频/原ZIP/manifest全部保留在历史区或原证据目录。"),
 ('当前文档',"作品介绍12页、技术文档16页；均提供PDF、可编辑Word与Markdown源稿。Word实际导出PDF，全部28页经Poppler渲染与AI视觉检查，文字边界及嵌图字节检查另见验收JSON。"),
 ('源码与演进',f"真实Git基线 {proof['gitHead']}；{proof['commits']}次完整历史；{proof['trackedFiles']}个源码导出文件逐个与Git blob核对。bundle已独立clone。此后仅整理的验收回执不伪装为该源码基线的内容。"),
 ('独立源码复现',"在bundle独立恢复副本先运行项目ci安装锁定依赖（含PostCSS），再执行增强--check，指定HTML逐字一致。只有Node不足以运行检查；不要在正式交付的冻结源码中安装依赖。未重跑Next生产构建/完整功能测试。详见本轮验收JSON。"),
 ('本轮浏览器',"Windows Edge157 headless、file://离线、1440/768/390/320模拟宽度，124/124专项通过；11张正式截图由AI查看。历史312/389/316/171/21套件是此前已归档结果，并非本轮全部重跑。"),
 ('压缩包抽取播放',f"从ZIP抽取指定HTML与三份H264视频，Edge离线1440/390模拟宽度、入口/图库/报告及视频元数据与短时解码播放，共{packed['passed']}/{packed['passed']}项通过。首页内嵌练习舱与跨站弹窗分别验证；初始测试工具错误和修正单独留证。非真人/真实设备或全片主观视听审核。"),
 ('新增证据',"7张Prompt原始照片、3段作者新视频及H264兼容版均入包；原件哈希与迁移映射可复核。E038最终答复已补齐；本轮最终答复尚未真实落盘时明确待补，不编造。"),
 ('视频真实限制',"新视频原生1280×720、1280×720、960×544，时长约36秒、19秒、4分03秒。两段滚动聊天不是实时AI编程；不能用转码、拼接或预期评分声称满足旧1080p/实时协同条款。"),
 ('交付核验',"本目录manifest逐文件列大小与SHA256；ZIP含全部当前材料与历史原件。ZIP字节数、CRC/逐条哈希与最终独立验收见外层packet-build-verification.json、packet-final-verification.json和.zip.sha256，避免ZIP对自身哈希循环引用。"),
 ('临时缓存边界',"本轮D盘.cache/submission-latest-20261115的精确清理请求被工具策略执行前拒绝，临时检查图/依赖/抽帧仍在工作区；不在本交付目录内，未绕过拒绝。正式11图和全部原件保留。详见本轮cleanup验收JSON。"),
 ('仍需本人确认',"真人新手体验与真实设备、素材授权及旧图/历史作者标识、当前赛事实际规则与视频要求、本人信息和可访问链接。未push、未上传、未调用付费API、未代交。C01/C02/C03实现与共享真实开发轮保留，不制造逐链人类Bug材料。")]
 page='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>PathLab AI 最新材料验收报告</title><style>body{font:17px/1.8 system-ui;max-width:1000px;margin:32px auto;padding:20px;color:#18362b}section{background:#f3f7f5;padding:18px;margin:15px 0;border-radius:10px}p{overflow-wrap:anywhere}a{color:#075b40}</style><h1>最新版材料验收报告</h1><p>2026-11-15 · AI执行的材料检查，不是人工、真机或赛事验收。</p>'+''.join('<section><h2>'+html.escape(a)+'</h2><p>'+html.escape(b)+'</p></section>' for a,b in sections)+'<p><a href="../00-评审入口.html">返回材料入口</a> · <a href="v3迁移映射.json">逐路径迁移映射</a> · <a href="../manifest.json">当前manifest</a></p></html>'
 put(FULL/'10-最新版更新说明/材料验收报告.html',page)
def source():
 assert not git('status','--porcelain','--untracked-files=no'),'Commit selected changes before source export'
 head=git('rev-parse','HEAD');count=int(git('rev-list','--count','HEAD'))
 base=FULL/'04-源码与演进';tree=base/'源码';assert not tree.exists(),'Source output exists'
 data=subprocess.run(['git','-C',str(ROOT),'archive','--format=tar',head],check=True,capture_output=True).stdout
 tree.mkdir(parents=True)
 with tarfile.open(fileobj=io.BytesIO(data)) as tf:tf.extractall(tree,filter='data')
 names=[n for n in git('ls-tree','-r','--name-only','-z',head).split('\0') if n]
 assert sorted(p.relative_to(tree).as_posix() for p in tree.rglob('*') if p.is_file())==sorted(names)
 # Compare all exported files to the actual Git blob; CRLF working copies need not equal Git LF.
 for name in names:
  blob=subprocess.run(['git','-C',str(ROOT),'show',head+':'+name],check=True,capture_output=True).stdout
  assert hashlib.sha256(blob).hexdigest()==sha(tree/name),name
 assert sha(tree/HTML)==EXPECTED
 bundle=base/f'PathLab-AI-完整历史-20261115-{head[:7]}.bundle'
 git('bundle','create',str(bundle),'HEAD','main')
 check=TMP/'bundle-restored';assert not check.exists(),'Choose a new restore directory'
 subprocess.run(['git','clone','-q','--branch','main',str(bundle),str(check)],check=True,capture_output=True)
 restored=subprocess.run(['git','-C',str(check),'rev-parse','HEAD'],check=True,capture_output=True,text=True).stdout.strip()
 rc=int(subprocess.run(['git','-C',str(check),'rev-list','--count','HEAD'],check=True,capture_output=True,text=True).stdout)
 assert (restored,rc)==(head,count)
 put(base/'git-log.txt',git('log','--format=%h %ad %s','--date=short')+'\n')
 put(base/'源码一致性与恢复说明.md',f'''# 最新源码与完整演进\n\n源码目录为真实提交 {head} 的 git archive，逐文件核对 Git blob；共 {len(names)} 文件。完整历史 {count} 个提交，bundle 已独立 clone 并核对 HEAD 和提交数。\n\n主件 {HTML} SHA256 为 {EXPECTED}。Next 页面仅是原八站工程底座，独立 HTML 另含 E037/E038 增强；不要只运行 npm run build:html 就声称生成最新版主件。\n\n## 恢复步骤\n\n在尚不存在的 D 盘项目目录执行：\n\n    git clone --branch main ./{bundle.name} D:/竞赛/复现副本\n    git -C D:/竞赛/复现副本 rev-parse HEAD\n\n应输出上述真实提交。随后按源码中的 README 与复现说明安装依赖（缓存、TEMP、TMP限定D盘）。增强脚本依赖PostCSS，只有Node不足。先在恢复的可写副本根目录运行：\n\n    powershell -NoProfile -File scripts/Invoke-ProjectNpm.ps1 ci\n\n再核验指定独立HTML：\n\n    node --experimental-strip-types scripts/enhance-standalone-ui.mjs --check\n\n本包包含原始HTML底稿与所有增强脚本。--check 读取已有主件，验证增强后的精确字节；不是 Next 页面生产构建。完整原文和工具说明见 源码/docs/latest-technical-report.md。\n\n本轮不 push。旧 v3 的源码与bundle在 12-历史材料/v3，旧提示仍保留作历史，不作当前运行说明。\n''')
 js(base/'source-export-verification.json',{'date':DATE,'executor':'AI','gitHead':head,'commits':count,'trackedFiles':len(names),'everyGitBlobVerified':True,'bundle':bundle.name,'bundleRecloneVerified':True,'selectedHtmlSha256':EXPECTED,'nextAndEnhancedHtmlIdentical':False})
 print(json.dumps({'head':head,'commits':count,'sourceFiles':len(names)},ensure_ascii=True))
def manifest_files(base):
 return [p for p in sorted(base.rglob("*")) if p.is_file() and p!=base/"manifest.json"]
def package():
 write_portal()
 write_acceptance()
 # Refresh this turn's persisted messages without inventing its not-yet-written final reply.
 for stem in ['2026-11-15-latest-submission-request','2026-11-15-latest-submission-migration']:
  for ext in ['md','jsonl']:cp(ROOT/f'prompts/sessions/{stem}.{ext}',FULL/'05-Prompt证据/最新文字记录'/f'{stem}.{ext}')
 for p in (ROOT/'docs/evidence').glob('latest-submission-*.json'):
  if p.name!='latest-submission-final-20261115.json':cp(p,FULL/'11-最新验证证据/本轮验收'/p.name)
 for p in (ROOT/'docs/assets/submission-20261115').glob('*.png'):cp(p,FULL/'06-实际截图/20261115-最新版'/p.name)
 for name in ['latest-project-introduction.md','latest-technical-report.md','latest-evidence-guide.md','verification-latest-submission.md']:
  p=ROOT/'docs'/name
  if p.exists():cp(p,FULL/'07-文档源稿与来源/20261115最新版'/name)
 verify_migration()
 for name in ['02-表单第6项','03-技术文档备用','03-视频材料','01-上传网盘']:(NEW/name).mkdir(exist_ok=True)
 for folder,out in [('01-作品介绍','02-表单第6项'),('02-技术文档','03-技术文档备用')]:
  for p in (FULL/folder).glob('*'):
   if p.suffix.lower() in ['.pdf','.docx']:cp(p,NEW/out/p.name)
 cp(FULL/'09-演示视频/H264兼容播放/新版本mp4-H264.mp4',NEW/'03-视频材料/新版本产品演示-H264.mp4')
 cp(FULL/'09-演示视频/视频说明与真实边界.md',NEW/'03-视频材料/视频说明与真实边界.md')
 # Only exclude the current root manifest; historical manifests are immutable evidence.
 files=manifest_files(FULL)
 rows=[{'path':p.relative_to(FULL).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in files]
 js(FULL/'manifest.json',{'date':DATE,'executor':'AI','format':1,'excludedSelf':'manifest.json','fileCount':len(rows),'files':rows})
 target=NEW/'01-上传网盘/PathLab-AI-完整作品材料-最新版-20261115.zip'
 with zipfile.ZipFile(target,'w',allowZip64=True,compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for p in sorted(FULL.rglob('*')):
   if p.is_file():z.write(p,p.relative_to(FULL).as_posix(),compress_type=zipfile.ZIP_STORED if p.suffix.lower() in ['.zip','.mp4','.jpg','.png','.pdf','.bundle'] else zipfile.ZIP_DEFLATED)
 with zipfile.ZipFile(target) as z:
  assert z.testzip() is None
  for row in rows:
   with z.open(row['path']) as stream:assert stream_sha(stream)==row['sha256'],row['path']
 put(target.with_suffix('.zip.sha256'),sha(target)+'  '+target.name+'\n')
 js(NEW/'packet-build-verification.json',{'date':DATE,'executor':'AI','allV3PathsMigrated':json.loads((FULL/'10-最新版更新说明/v3迁移映射.json').read_text(encoding='utf-8'))['oldPathCount'],'manifestFiles':len(rows),'zip':{'path':str(target.relative_to(NEW)),'bytes':target.stat().st_size,'sha256':sha(target),'crcVerified':True,'allEntryHashesVerified':True},'source':json.loads((FULL/'04-源码与演进/source-export-verification.json').read_text(encoding='utf-8')),'uploaded':False,'githubPushed':False,'humanOrRealDeviceAcceptance':False,'finalReplyInCurrentPrompt':'pending until actually persisted; not fabricated'})
 print(json.dumps({'folder':str(NEW),'files':len(rows),'zipBytes':target.stat().st_size,'sha256':sha(target)},ensure_ascii=True))
def verify_migration():
 data=json.loads((FULL/'10-最新版更新说明/v3迁移映射.json').read_text(encoding='utf-8'))
 for row in data['files']:assert sha(NEW/row['newPath'])==row['sha256']
 print('V3 migration verified:',len(data['files']))
ENTRY='''# PathLab AI 最新完整参赛材料\n\n日期 2026-11-15。此文件夹是完整更新版，不是补丁。v3 的全部 622 个原文件路径均已迁入：旧记录原字节保留，重复副本按哈希映射；旧文档、HTML、源码、bundle 与视频在历史区，新主材料在前台目录。\n\n## 先看哪些文件\n\n1. 打开 00-评审入口.html（外层为 00-打开最新参赛材料.html）。\n2. 最新作品：03-离线体验/PathLab_AI_v4_optimized_final.html，作者指定文件原字节，无需服务器。\n3. 最新作品介绍：01-作品介绍 的 20261115 PDF 与可编辑 Word。\n4. 最新技术文档：02-技术文档 的 20261115 PDF 与可编辑 Word。\n5. 新视频：09-演示视频/作者视频原件 与 H264兼容播放；旧演示迁入 12-历史材料/v3/09-演示视频。\n6. 新旧 Prompt：05-Prompt证据；新增七张原始拍屏、真实文字记录和解读边界，原冻结选编不改写。\n7. 源码：04-源码与演进，含精确 Git 导出、当前独立 HTML、增强脚本、原始底稿与完整历史 bundle。\n8. 迁移核验：10-最新版更新说明/v3迁移映射.json；验收：11-最新验证证据。\n\n## 本版作品内容\n\n八个可点击学习站、g/h/f 白话解释与词典、可拖动奶娃、媒体课、闯关、学前测与学后测、五步练习舱、真实搜索事件回放、四任务预测与单因素实验、自由地图、本机存档、明暗主题、常驻辅助复盘入口。\n\n学习提问和运行证据复盘在本机生成可读预览，复制后由用户手动到 DeepSeek 网页粘贴发送。离线 HTML 不调用站内 API，不需要前端密钥。可选服务端 API 仅属于单独配置的工程运行方式，不宣称已真实联调。\n\n## 真实性与提交边界\n\n- 最新独立 HTML 与 Next 工程底座分开交代；不能只重建 Next 就声称生成同一最新版。\n- 新视频 00:36.033、00:18.933、04:03.100，原生分辨率均低于1080p；前两段为滚动回看历史对话，不冒充实时开发复现。转码不提高证据级别。\n- 预期90分、学习提升比例、停留时间、访问等不写成实测效果。没有新增奖项或真实学习者效果数据。\n- 既有自动化结果与本轮材料/抽测分开列；AI自动检查不是人工、真机或评审验收。\n- C01/C02/C03 已有实现与共享开发轮证据继续保留；人类引导Bug证据边界不因新增照片而自动补齐，U01 与AI自测分开。\n- 本轮未push、未上传、未填表、未正式代交。当前表单规则、素材授权、视频口径、本人信息和真人新手测试仍须本人确认。\n- 本轮最终答复在真实写入原始记录后才能追加，包内不预造本答复。\n'''
OFFLINE='''# 当前离线作品\n\n双击 PathLab_AI_v4_optimized_final.html。建议用 Edge/Chrome，无需 Node、localhost、账号或模型密钥；HTML内嵌原媒体。\n\n建议顺序：首页先解释 A* → 认识A* → 零基础练习舱五步 → 原互动入门课 → 任务工作台L01 → 自由实验 → 辅助复盘。八站可直接点击，练习不等于掌握认证。\n\n辅助复盘可在首页卡片或顶部按钮进入。学习提问随时可用；本次运行复盘须先完成本关搜索，引用真实记录。复制不等于发送，打开网页需要联网。\n\n可选记住练习进度与原任务存档相互独立。迁移路径或换浏览器前导出原JSON存档；本轮交付不携带私人进度。\n'''
VIDEO_NOTE='''# 新旧视频及其证据级别\n\n三段新视频均保留作者原文件名、原字节和SHA256；另提供H.264/AAC兼容播放副本，不裁切、不拼接、不倍速、不放大分辨率。兼容副本不是原件。\n\n| 原文件 | 时长 | 原生尺寸 | 已观察画面 | 用途与限制 |\n| --- | --- | --- | --- | --- |\n| 183595fb6fa9eb107ab392f73ca80aa4.mp4 | 00:36.033 | 1280×720 | 滚动浏览过往聊天与材料总结 | 历史对话回看，不证明36秒实时协同开发 |\n| ee88b0dd110e97bb568bd819e5fa5f5f.mp4 | 00:18.933 | 1280×720 | 七站、术语顺序和改版对话回看 | 局部证据补充，不是完整导出 |\n| 新版本mp4.mp4 | 04:03.100 | 960×544 | 拍摄产品首页、图解、测验、工作台和自由实验 | 最新产品展示，未证明全部增强入口出镜 |\n\n三段完整解码无错误；每段抽取6帧经AI查看。未进行逐字音频转录或真人验收。完整元数据与哈希见11-最新验证证据。\n\n三段相加约4分58秒，不能据此声称满足旧材料中的5至8分钟/1080p/至少2分钟实际AI协同口径。尤其滚动查看历史对话不等于现场与AI协同编码。旧v3演示6分37秒仍在历史区，但界面过时且原AI协同段仍须作者人工确认。提交前请按当前真实表单决定是否重录或补录，不把上采样当原生清晰度。\n'''
PROMPT_NOTE='''# 新旧 Prompt 证据阅读说明\n\n原冻结9轮38条、原照片与原始ZIP均保留，不改写、不扩充它们的历史计数。新增七张20261115拍屏原图有独立图库、哈希和观察索引。\n\n1. 745：用户提出零基础、导航与游戏入手、点击式站点和奶娃。\n2. 746与748：AI描述七站实现和测试，并提示素材授权、公式图易误导及旧交付包未更新。数字是当时陈述，应与真实日志核对。\n3. 749：真实用户指出g/h/f未经定义即被使用，并要求桌宠提示；可作为后续用户引导纠正的局部证据，不自动构成三条核心链各自完整记录。\n4. 750与751：另一次改版建议和预期效果；截图提到的v5、预期90分、停留时间和提升比例均不作为当前软件版本或实测结果。\n5. 753：辅助复盘入口修复的可见最终答复，含E038结果与边界。已从真实记录补齐该轮最终答复。\n\n新增文字记录来自各自已注明的来源：E035仍是人工摘录；E037/E038为真实本地可见消息提取，不含隐藏推理。此次首轮在作者纠正后结束于追加约束，未伪造首轮final；继续轮最终答复待真实落盘。\n\n前两段新视频是对话回看，七张照片是局部拍屏，均不冒充完整原生导出或实时AI编程复现。C01/C02/C03与U01按原索引保留事实边界。\n'''
FORM='''PathLab AI 参赛表单草稿 2026-11-15\n\n不填私人身份信息，不代替本人提交。旧v3草稿完整保存在历史迁移区。\n\n作品名称：PathLab AI 路径学习实验室\n作品定位：面向零基础学习者的A*算法交互学习工具，以八站课程、五步练习、先预测后揭晓、算法事件回放和可引用复盘帮助理解寻路过程。\n使用方式：下载完整材料解压，打开指定独立HTML；无需服务器。\n作品介绍：本文件夹02-表单第6项中的最新版PDF。\n技术说明：03-技术文档备用中的最新版PDF，可编辑Word同时提供。\n作品源码：完整材料的04-源码与演进，含增强脚本、原始HTML底稿、当前主件及完整Git历史。\nAI协同：已有真实Prompt选编、新增局部拍屏与文字记录；区分用户引导纠正和AI自测，不夸大为每链完整人工复现。\n视频：新产品演示约4分03秒，另有两段历史对话回看和全部原件；当前没有证据证明新视频满足旧1080p与2分钟实时AI协同口径，上传前本人核对。\n代码仓库：https://github.com/ljqzs08/PathLab-AI （本轮未push，不能声称仓库当前HEAD等于本包。）\n公开发表与获奖：代码曾公开托管，不等于正式发表；按原作者确认未获奖，本轮无新增证明。\n已验证：材料迁移/文件哈希/离线抽测/文档渲染，具体数量和范围见packet-build-verification及验收报告。\n未完成：素材授权确认、真人新手测试、当前赛事规则与开放状态核验、符合实际表单的视频、网盘及公开视频地址、正式提交。\n'''
if __name__=='__main__':{'prepare':prepare,'source':source,'package':package,'verify':verify_migration}[sys.argv[1]]()
