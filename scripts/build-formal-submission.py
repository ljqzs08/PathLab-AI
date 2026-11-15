"""Build the E040 reviewer-facing packet without altering the full E039 archive."""
from pathlib import Path, PurePosixPath
import hashlib, json, shutil, zipfile, re, sys, subprocess, io, html
ROOT=Path(__file__).resolve().parents[1]
ARCHIVE=ROOT/'delivery/PathLab-AI-参赛文件-最新版-20261115'
FULL=ARCHIVE/'04-完整材料解压版'
NEW=ROOT/'delivery/PathLab-AI-正式参赛文件-20261115'
TMP=ROOT/'.cache/formal-submission-20261115'
EVIDENCE=ROOT/'docs/evidence'
EXPECTED='7bd7f222529701b1912be5f30f4ea097d8f2205521e6e900d829cd97c03c917a'
ZIPNAME='PathLab-AI-正式参赛材料-20261115.zip'

def sha(p):
 h=hashlib.sha256()
 with Path(p).open('rb') as f:
  for b in iter(lambda:f.read(4*1024*1024),b''): h.update(b)
 return h.hexdigest()
def write(p,text):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8')
def js(p,data): write(p,json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def read(p): return p.read_text(encoding='utf-8-sig')
def inventory(base): return [{'path':p.relative_to(base).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(base.rglob('*')) if p.is_file()]
def safe_member(name):
 p=PurePosixPath(name)
 if p.is_absolute() or '..' in p.parts or '\\' in name or ':' in name: raise ValueError('unsafe member')
 return p

def replace_page(raw,key,body):
 pattern=r'<!-- page: '+re.escape(key)+r' -->.*?(?=<!-- page: |\Z)'
 result,n=re.subn(pattern,'<!-- page: '+key+' -->\n'+body.strip()+'\n\n',raw,flags=re.S)
 assert n==1,(key,n)
 return result

def formal_md():
 intro=read(ROOT/'docs/latest-project-introduction.md').replace('2026-11-15 完整迁移版','2026-11-15 正式提交版')
 intro=intro.replace('本文按作者指定 HTML 的实际状态编写；旧 v3 文档、源码、视频与原始证据均迁入新版历史区，不再要求评审返回旧文件夹找材料。','本文按作者指定 HTML 的实际状态编写。提交包只设一个最终体验入口，附当前文档、源码与真实开发证据；所有旧版文件另存完整归档版，不在本包重复堆放。')
 intro=replace_page(intro,'evidence','''# 09 开发过程与证据来源
## 保留演进证据 不重复提交全部旧版本
正式提交包保留冻结的九轮、38条可见原文和C01/C02/C03/U01/S02阅读导引，另附E037/E038实际文字快照和七张作者原始拍屏。导引与本文均为编辑说明，不冒充原生完整聊天导出。共享开发轮不拆成三次人类报错。
| 提交材料 | 实际内容 | 证据边界 |
| --- | --- | --- |
| 核心开发原文 | 完整选定轮次 Markdown 与 JSONL | 角色、先后、来源行与真实末答复可核验 |
| 7张新Prompt原图 | 原文件名和字节保留 | 局部拍屏；750/751中的计划与预期不是成果 |
| 2段聊天回看 | 36.033秒与18.933秒 | 不等于实时AI编程协同 |
| 产品演示 | 243.100秒 原生960×544 | 未证明全部最新增强入口出镜 |
| 兼容视频3份 | H.264/AAC 保留原尺寸与时间线 | 转码副本；原件SHA与来源另列 |
| 正式截图11张 | 当前HTML的桌面和移动模拟截图 | AI操作，不是用户实验照片 |
三段视频总计约4分58秒。不能据此声称满足旧材料中5至8分钟、1080p和至少2分钟实时AI协同的口径。全部旧视频、旧文档及视频原件在独立完整归档版保留；本包不拼接或放大画面伪造符合性。''')
 intro=replace_page(intro,'verification','''# 10 验证结果与使用限制
## 既有E039验证与本次包级核验分开
E039在Windows Edge 157 headless、file://断网模式下，以1440、768、390、320四个模拟宽度完成124项专项；另有23项ZIP抽取、导航与兼容播放检查。覆盖范围包括八站、五步练习、真实回放、学习提问和BFS L01闭环，不是产品全量回归。三段原件和三份转码输出在该轮完成全片解码。
本次重新整理不改作品代码。当前包的哈希、导航、源文件一致性、PDF渲染与离线抽测结果，单独记录在09-核验与边界；不把已有124/23项写成本次重跑。
## 沿用的历史结果
E038归档显示：辅助复盘入口312/312、原UI 389/389、原回归316/316、Node171/171与保护检查21/21。它们发生在既有功能轮，不与本次材料检查相加。
## 不作出的承诺
没有真人零基础迁移与保持测试，没有真实手机或屏幕阅读器验收，没有付费模型联调，也没有教学对照实验。短测分数、访问和练习记录不证明真实掌握率或统计显著提升。
自动化浏览器检查不等于人工、真机或评审验收。当前规则符合性、视频录制要求、素材使用权与公开隐私仍需作者确认。''')
 intro=replace_page(intro,'disclosure','''# 11 交付清单与提交边界
## 从一个最终作品开始评审
打开00-打开最新参赛材料.html，先体验最新版HTML，再阅读本介绍及技术文档；需要核验时进入开发证据、源码和历史说明。
| 目录 | 评审用途 |
| --- | --- |
| 01-作品介绍 与 02-技术文档 | 当前PDF和可编辑Word |
| 03-离线体验 | 唯一选定的最终HTML |
| 04-源码与演进 | 精确源码快照 完整Git历史 恢复说明 |
| 05-开发证据 | 核心链原文 最新文字快照 七张拍屏 |
| 06-实际截图 与 07-演示视频 | 当前页面截图和三份兼容视频 |
| 08-文档源稿 与 09-核验与边界 | 可编辑源稿 哈希清单 来源与验证范围 |
所有旧版文件仍在另存的完整归档版。本包不重复嵌套旧ZIP、不再设置旧版体验入口；源码目录内为复现而保留的受Git跟踪底稿不是其他最终作品。
未替作者上传、填写表单或正式提交。未新增获奖、论文发表或真实学习者成效。GitHub历史托管与本地最新版本分开表述，不假定远程HEAD已与本包同步。''')
 tech=read(ROOT/'docs/latest-technical-report.md').replace('2026-11-15 完整迁移版','2026-11-15 正式提交版')
 tech=tech.replace('原 v3 所有记录已迁入；本文是当前说明，历史文档中的旧日期、旧功能范围和旧提交状态仅作为当时记录阅读。','所有旧记录另存完整归档版；本包保留当前说明与必要开发证据。源码中的历史文档仅作为当时记录阅读。')
 tech=tech.replace('本次材料迁移的是文件记录','本次整理的是参赛文件记录')
 tech=tech.replace('本轮在 bundle 独立恢复的副本执行 ci（59.287 秒），再运行增强 --check（0.749 秒），字节一致通过','既有E039在a3389d1的bundle独立恢复副本执行ci（59.287秒），再运行增强--check（0.749秒），字节一致通过')
 tech=replace_page(tech,'tests','''# 13 验证层级与执行时点
## 本次包级检查不冒充产品全量回归
| 执行时点 | 实际范围 | 结果与性质 |
| --- | --- | --- |
| 历史E038 | 辅助复盘入口专项 | 312/312 AI Edge |
| 历史E038 | 原UI与原回归 | 389/389及316/316 AI Edge |
| 历史E038 | Node与保护检查 | 171/171及21/21 AI |
| 历史E039 | 四个模拟宽度离线专项 | 124/124 AI Edge157 headless |
| 历史E039 | ZIP抽取与兼容播放 | 23/23 AI自动化 |
| 历史E039 | 视频可解码性 | 三段原件与三份兼容版全片解码 |
| 本次E040 | 正式包内容 文档 导航与源码 | 实际回执另列于09-核验与边界 |
既有124项只抽测八站、五步、回放、学习模板与BFS L01，不替代312/389/316等全套重新执行。E040不改产品，不把同一个文件的历史通过数相加或重新命名为本次产品结果。
## 失败与修正照实保留
E039曾把阶段按钮误当tab、把首页内嵌练习舱误当弹窗，并误要求返回访客必有欢迎框。核对真实语义后修正测试工具，未改产品；这些不是用户报告的产品Bug。
11张截图是AI自动操作的当前页面，不是人工研究照片。文档以实际Word导出、Poppler渲染和AI视觉检查为材料验收；不称教学成效实验。
本次操作、工具检查及遗留限制见formal-submission-verification.md和09-核验与边界内实际JSON。''')
 tech=tech.replace('均 H.265 原件；另附 H.264/AAC 原尺寸播放副本','原件为H.265；本正式包只附H.264/AAC原尺寸播放副本，原件及其字节保留在独立完整归档版，来源SHA随包列出')
 tech=replace_page(tech,'migration','''# 15 正式提交包与完整归档分离
## 只设一个当前作品入口
正式提交包包含当前HTML、对应PDF和Word、源码、Git历史、精选真实Prompt、七张原图、11张当前截图与三份兼容视频。不重复放入旧版PDF、旧演示、嵌套历史ZIP和临时检查图片。完整归档版原有文件不删除、不覆盖。
源码快照保持所选真实提交的全部跟踪文件；其中构建底稿与历史文档用于复现和追溯，不作为其他最终体验入口。精确基线、提交数、每个源码文件的Git blob核验见04-源码与演进/源码清单.json。
## 独立核验步骤
1. 对ZIP计算SHA256，与旁边.sha256对比；解压后打开唯一材料入口。
2. 查看manifest.json，逐项核对相对路径、大小与SHA256。媒体来源说明列出原件和兼容副本的分别哈希，不把转码字节当成原件。
3. 按源码恢复说明从bundle恢复，核对记录的真实HEAD、提交数与源码清单。完整历史属于演进证据，不代表附上所有旧交付包。
4. 在D盘可写副本先运行项目ci安装锁定依赖，再运行增强--check；只有Node不够。Next底座生产构建不能代替最新独立HTML。
## 未替作者完成的外部事项
不push、不上传、不填写或提交表单、不改变权限。未重新核验当前官网规则，未确认素材公开授权、全部隐私或真人真机体验。正式视频是否满足要求仍待作者按真实条款核对。
本包由完整归档版选取材料而成。取舍清单、来源哈希及本次实际验证在09-核验与边界；文档源稿在08-文档源稿。''')
 for s in [intro,tech]:
  assert '12-历史材料' not in s and '622' not in s
 write(ROOT/'docs/formal-project-introduction.md',intro.rstrip()+'\n')
 write(ROOT/'docs/formal-technical-report.md',tech.rstrip()+'\n')
 for name in ['formal-project-introduction.md','formal-technical-report.md']:
  write(NEW/'08-文档源稿'/name,read(ROOT/'docs'/name))

def page(title,body):
 return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><style>*{box-sizing:border-box}body{margin:0;background:#f2f6f4;color:#17382e;font:17px/1.7 system-ui,-apple-system,"Microsoft YaHei",sans-serif}main{max-width:1050px;margin:auto;padding:42px 22px}h1{font-size:clamp(28px,5vw,42px);line-height:1.25}h2{font-size:23px;margin-top:35px}.muted{color:#526960}a{color:#075d46;text-underline-offset:3px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,285px),1fr));gap:16px}.card{background:white;border:1px solid #cddfd5;border-radius:16px;padding:22px;min-width:0;overflow-wrap:anywhere}.card a{font-weight:700}.primary{background:#0b6249;color:white;display:inline-block;padding:15px 23px;border-radius:10px;text-decoration:none;margin:5px 10px 5px 0}.tag{font-size:14px;letter-spacing:1px;color:#386453}small{display:block;color:#526960}img{max-width:100%;height:auto;border-radius:8px}li{margin:8px 0}a:focus-visible{outline:3px solid #d78c19;outline-offset:4px}</style><main>'+body+'</main></html>'

def portal():
 links=[('作品介绍 PDF','01-作品介绍/PathLab-AI-作品介绍文档-最新版-20261115.pdf','12页 项目定位与体验方法'),('技术文档 PDF','02-技术文档/PathLab-AI-技术文档-最新版-20261115.pdf','16页 算法 架构 复现与边界'),('开发过程证据','05-开发证据/00-证据导航.html','三条核心链 真实纠正与最新增强'),('源码恢复说明','04-源码与演进/源码恢复说明.md','源码快照 完整Git历史 精确基线'),('材料核验与限制','09-核验与边界/00-核验说明.md','清单 来源 视频规格与验收边界')]
 cards=''.join('<section class="card"><a href="'+u+'">'+n+'</a><small>'+d+'</small></section>' for n,u,d in links)
 write(NEW/'00-打开最新参赛材料.html',page('PathLab AI 正式参赛材料','<p class="tag">PATHLAB AI · 2026-11-15 · 正式提交版</p><h1>先体验一个明确的最终作品</h1><p class="muted">从术语理解到预测、搜索回放和证据复盘。只设一个当前体验入口，开发历史放在证据区，不与最终作品混排。</p><p><a class="primary" href="03-离线体验/PathLab_AI_v4_optimized_final.html">打开最新离线作品</a><a href="07-演示视频/01-产品演示-H264.mp4">观看产品演示</a></p><p class="muted">解压后本地打开，无需服务器或模型密钥。视频约4分03秒，是作者提供的产品展示，不等于覆盖全部最新增强功能。</p><div class="grid">'+cards+'</div><h2>建议评审顺序</h2><ol><li>体验认识 A*、五步练习舱和任务工作台。</li><li>阅读介绍和技术文档，核对当前能力与运行方法。</li><li>查看真实Prompt、用户纠正、Git演进及验证范围。</li></ol><p class="muted">这是待本人核对条款后提交的本地材料，不代表已正式提交或规则符合性已获确认。旧交付包另存完整归档，不在本包重复嵌套。自动检查不是人工或真机验收。</p>'))
 core='核心链证据/prompts/submission/'
 body='<p class="tag">真实开发记录 · 选定轮次完整保留</p><h1>开发过程证据导航</h1><p>以下链导引是编辑说明，原文以各轮Markdown和JSONL为准。冻结九轮38条不被新增照片或共享轮次重复计数。</p><div class="grid">'
 for name,file in [('C01 算法与确定性','C01-algorithms.md'),('C02 预测 Canvas与回放','C02-prediction-replay.md'),('C03 实验与复盘','C03-reflection.md'),('U01 真实HTML交付纠正','U01-human-html-correction.md'),('S02 网页辅助复盘演进','S02-web-review-iteration.md')]: body+='<section class="card"><a href="'+core+file+'">'+name+'</a></section>'
 body+='</div><h2>当前增强的真实文字快照</h2><ul>'
 for stem in ['2026-11-15-ui-beginner','2026-11-15-web-review-entry']: body+='<li><a href="最新增强原文/'+stem+'.md">'+stem+'</a> · <a href="最新增强原文/'+stem+'.jsonl">JSONL</a></li>'
 body+='</ul><p><a href="20261115原始拍屏/00-原图索引.html">查看七张原始拍屏</a> · <a href="../07-演示视频/02-历史聊天回看-H264.mp4">36秒历史聊天回看</a> · <a href="../07-演示视频/03-改版聊天回看-H264.mp4">19秒改版聊天回看</a></p><p>749是术语顺序纠正的局部证据；750/751中的v5方案、预期90分和提升比例不是当前实测成果。聊天回看不等于实时开发录屏。C01/C02/C03不冒称三条独立人类报错完整链。</p><p><a href="../00-打开最新参赛材料.html">返回材料入口</a></p>'
 write(NEW/'05-开发证据/00-证据导航.html',page('PathLab AI 开发过程证据',body))

def prepare():
 assert not NEW.exists(),'Refusing to overwrite existing formal folder'
 assert sha(ROOT/'PathLab_AI_v4_optimized_final.html')==EXPECTED
 before={'date':'2026-11-15','fullArchive':inventory(ARCHIVE),'v3':inventory(ROOT/'delivery/PathLab-AI-参赛文件-v3'),'selectedHtmlSha256':EXPECTED}
 js(EVIDENCE/'formal-submission-inputs-20261115.json',before)
 NEW.mkdir();copies=[]
 def cp(src,dst):
  p=NEW/dst;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,p);assert sha(src)==sha(p)
  copies.append({'source':str(src.relative_to(ROOT)),'path':dst,'bytes':p.stat().st_size,'sha256':sha(p)})
 cp(ROOT/'PathLab_AI_v4_optimized_final.html','03-离线体验/PathLab_AI_v4_optimized_final.html')
 for p in sorted((ROOT/'docs/assets/submission-20261115').glob('*.png')): cp(p,'06-实际截图/'+p.name)
 frozen=next((FULL/'05-Prompt证据').glob('*.zip'))
 with zipfile.ZipFile(frozen) as z:
  assert z.testzip() is None
  for info in z.infolist():
   safe_member(info.filename)
   if not info.is_dir():
    p=NEW/'05-开发证据/核心链证据'/info.filename;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(info))
 cp(ROOT/'prompts/sessions/2026-11-14-v4-journey.md','05-开发证据/最新增强原文/2026-11-14-v4-journey.md')
 for stem in ['2026-11-15-ui-beginner','2026-11-15-web-review-entry']:
  for ext in ['.md','.jsonl']: cp(ROOT/'prompts/sessions'/(stem+ext),'05-开发证据/最新增强原文/'+stem+ext)
 photos=FULL/'05-Prompt证据/20261115新增拍屏原图'
 for p in sorted(photos.glob('*.jpg')): cp(p,'05-开发证据/20261115原始拍屏/'+p.name)
 photo_body='<h1>作者提供的七张原始拍屏</h1><p>原文件名与字节保留。局部截图不是原生完整聊天导出。749记录术语顺序纠正；750/751中的v5建议和预期分数不是实测成果。</p><div class="grid">'
 for p in sorted(photos.glob('*.jpg')): photo_body+='<section class="card"><a href="'+p.name+'"><img loading="lazy" src="'+p.name+'" alt="'+p.stem+'"></a><small>'+p.name+'</small></section>'
 write(NEW/'05-开发证据/20261115原始拍屏/00-原图索引.html',page('PathLab AI 原始拍屏',photo_body+'</div><p><a href="../00-证据导航.html">返回证据导航</a></p>'))
 media=[]
 for original,target in [('新版本mp4','01-产品演示'),('183595fb6fa9eb107ab392f73ca80aa4','02-历史聊天回看'),('ee88b0dd110e97bb568bd819e5fa5f5f','03-改版聊天回看')]:
  src=FULL/'09-演示视频/H264兼容播放'/(original+'-H264.mp4');dst='07-演示视频/'+target+'-H264.mp4';cp(src,dst)
  raw=FULL/'09-演示视频/作者视频原件'/(original+'.mp4')
  media.append({'path':dst,'compatibilitySha256':sha(src),'originalFilename':raw.name,'originalSha256':sha(raw),'originalBytes':raw.stat().st_size,'originalInSeparateFullArchive':True,'durationSeconds':{'新版本mp4':243.1,'183595fb6fa9eb107ab392f73ca80aa4':36.033,'ee88b0dd110e97bb568bd819e5fa5f5f':18.933}[original],'originalDimensions':[960,544] if original=='新版本mp4' else [1280,720],'realtimeDevelopmentClaim':False})
 for name in ['latest-submission-browser-20261115.json','latest-submission-packed-browser-20261115.json','latest-submission-source-20261115.json','latest-submission-media-20261115.json','latest-submission-h264-20261115.json']:
  cp(EVIDENCE/name,'09-核验与边界/历史验证E039/'+name)
 for name in ['web-review-entry-20261115.json','e038-web-review-entry-20261115-ui.json','e038-web-review-entry-20261115-original-regression.json','e038-web-review-entry-20261115-preservation.json']:
  cp(EVIDENCE/name,'09-核验与边界/历史验证E038/'+name)
 js(NEW/'09-核验与边界/媒体来源.json',media)
 js(NEW/'09-核验与边界/材料取舍清单.json',{'date':'2026-11-15','kind':'reviewer-facing not full archive','copiedUnchanged':copies,'frozenPromptZipSourceSha256':sha(frozen),'frozenPromptEntries':58,'retained':['one final HTML','current introduction and technical PDF/DOCX','exact source snapshot and complete Git history','9 frozen rounds/38 visible messages','E037/E038 visible snapshots','7 original photos','11 current screenshots','3 H264 playback derivatives'], 'notRepeated':['v3 old full ZIP','old v3 demo','old PDF/DOCX deliveries','10 duplicate old prompt photos','duplicate video originals','disposable render or browser images'],'sourceTreeException':'Tracked build baselines/history inside exact source are provenance, not alternate final work entries.','fullArchiveUnmodified':True})
 formal_md();portal()
 write(NEW/'00-提交说明.md','''# PathLab AI 正式提交材料

先打开00-打开最新参赛材料.html。本包只有一个当前HTML体验入口；介绍与技术文档分别在01、02目录，源码和完整Git历史在04，核心开发原文和最新纠正在05。PDF旁有可编辑Word，Markdown源稿在08。

完整归档版仍单独保留，旧版视频、旧文档、旧ZIP与视频原件不重复装入正式包。源码快照中的受Git跟踪底稿是复现材料，不是其他最终作品。

07目录三份H264为原尺寸转码副本。产品演示243.100秒、960×544；两段聊天回看36.033和18.933秒，均不冒充实时开发。原件SHA及版本对应关系在09/媒体来源.json。

这是一份本地待提交材料，并非已经上传或被赛事受理。当前官网规则、视频规格、素材授权、隐私、本人信息、真人和真机验收仍需本人确认。历史验证按实际轮次标记，不当成本次重跑。

GitHub历史仓库：https://github.com/ljqzs08/PathLab-AI 。本轮没有push，不假定远程已同步本包。具体HEAD见04/源码清单.json。

提交压缩包目录包含本包ZIP与SHA256；ZIP不嵌套自身或旧ZIP。解压到完整路径后再打开入口。
''')
 write(NEW/'09-核验与边界/00-核验说明.md','''# 核验方法与真实边界

根目录manifest.json列出本包全部内容文件的大小与SHA256（不自列manifest）。提交ZIP与.sha256位于提交压缩包；最终校验回执在ZIP外，避免自哈希。

历史验证E038/E039是原轮实际结果，不计为本次重跑。本次包级和文档实际结果另附JSON。AI自动化不是人工或真机验收；没有真实DeepSeek发送、付费API联调或教学效果实验。

核心链C01/C02/C03及U01原文保留。共享开发轮不拆成三次独立人类Bug报告；照片、聊天回看和编辑导引不冒充原生完整导出。

本包不包含外部完整归档版，但体验、文档、核心链阅读和Git恢复不依赖那个目录。视频原件另存归档，仅其来源校验信息随正式包提供。

原始素材和Git历史可能包含作者标识、文件路径或账号线索；未宣称全历史已彻底脱敏。对外提交前仍需本人确认公开范围、素材使用权和当前规则。没有代为上传或正式提交。
''')
 print(json.dumps({'prepared':str(NEW),'copiedUnchanged':len(copies),'sourceAndDocumentsPending':True},ensure_ascii=True))

def source():
 base=NEW/'04-源码与演进';assert not base.exists(),'source already frozen'
 head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
 names=subprocess.check_output(['git','ls-tree','-rz','--name-only',head],cwd=ROOT).split(b'\0');names=[x.decode() for x in names if x]
 data=subprocess.check_output(['git','archive','--format=zip',head],cwd=ROOT)
 with zipfile.ZipFile(io.BytesIO(data)) as z:
  for info in z.infolist():
   safe_member(info.filename)
   if not info.is_dir():
    p=base/'源码'/info.filename;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(info))
 rows=[]
 for name in names:
  p=base/'源码'/name;b=subprocess.check_output(['git','show',head+':'+name],cwd=ROOT)
  assert p.read_bytes()==b,name;rows.append({'path':name,'sha256':sha(p),'bytes':len(b)})
 bundle=base/('PathLab-AI-完整历史-'+head[:7]+'.bundle')
 subprocess.run(['git','bundle','create',str(bundle),'main'],cwd=ROOT,check=True,capture_output=True)
 clone=TMP/'bundle-recovery';assert not clone.exists()
 subprocess.run(['git','clone','--branch','main',str(bundle),str(clone)],cwd=ROOT,check=True,capture_output=True)
 count=int(subprocess.check_output(['git','rev-list','--count',head],cwd=ROOT))
 assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=clone,text=True).strip()==head
 assert int(subprocess.check_output(['git','rev-list','--count','HEAD'],cwd=clone))==count
 proof={'date':'2026-11-15','executor':'AI','head':head,'commitCount':count,'trackedFiles':len(rows),'everyGitBlobVerified':True,'bundle':bundle.name,'bundleSha256':sha(bundle),'independentBundleClonePassed':True,'selectedHtmlSha256':EXPECTED,'files':rows,'fullInstallOrProductRegressionThisRound':False}
 js(base/'源码清单.json',proof);js(EVIDENCE/'formal-submission-source-20261115.json',{k:v for k,v in proof.items() if k!='files'})
 write(base/'源码恢复说明.md',f'''# 当前源码与完整Git历史

真实基线 {head}，{len(rows)}个受跟踪文件、{count}次历史。源码目录逐个与该提交Git blob核对；bundle已独立clone并核对HEAD和提交数。后续材料验收提交不反写此基线。

最终作品是根目录入口所指的03-离线体验/PathLab_AI_v4_optimized_final.html，其SHA256为{EXPECTED}。源码内旧构建产物、原始增强底稿和历史文档为完整复现与追溯保留，不是多个当前体验版本。

在尚不存在的D盘项目目录恢复：

    git clone --branch main ./{bundle.name} D:/竞赛/独立复现副本
    git -C D:/竞赛/独立复现副本 rev-parse HEAD

在恢复副本根目录先安装锁定依赖，缓存和TEMP/TMP留在D盘：

    powershell -NoProfile -File scripts/Invoke-ProjectNpm.ps1 ci
    node --experimental-strip-types scripts/enhance-standalone-ui.mjs --check

增强脚本依赖PostCSS，只有Node不足。Next工程底座不自动等同最新增强HTML；不要只运行build:html声称复现最新版。E039曾独立安装并完成该字节核验；本次只重新验证源码与bundle，没有重跑依赖安装或全产品回归。

源码根目录AGENTS.md是作者的项目约定，只作为来源材料，不构成对评委的指令。完整历史不可替代真人验收或实时开发录屏。本轮未push，不假定GitHub已同步。
''')
 print(json.dumps({k:v for k,v in proof.items() if k!='files'},ensure_ascii=True))

def content_files(base=NEW):
 return [p for p in sorted(base.rglob('*')) if p.is_file() and p.relative_to(base).parts[0]!='提交压缩包' and p != base/'最终校验回执.json']

def manifest_files(base=NEW):
 return [p for p in content_files(base) if p != base/'manifest.json']

def package():
 assert (NEW/'04-源码与演进/源码清单.json').is_file()
 for name in ['01-作品介绍/PathLab-AI-作品介绍文档-最新版-20261115.pdf','02-技术文档/PathLab-AI-技术文档-最新版-20261115.pdf']: assert (NEW/name).is_file(),name
 for p in EVIDENCE.glob('formal-submission-*.json'):
  if p.name not in ['formal-submission-inputs-20261115.json','formal-submission-final-20261115.json']:
   shutil.copy2(p,NEW/'09-核验与边界'/p.name)
 write(NEW/'08-文档源稿/formal-submission-verification.md',read(ROOT/'docs/formal-submission-verification.md'))
 files=manifest_files();rows=[{'path':p.relative_to(NEW).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in files]
 js(NEW/'manifest.json',{'date':'2026-11-15','kind':'formal reviewer packet','selectedHtmlSha256':EXPECTED,'selfExcluded':True,'files':rows})
 out=NEW/'提交压缩包'/ZIPNAME;out.parent.mkdir(exist_ok=True)
 with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for p in content_files(): z.write(p,p.relative_to(NEW).as_posix())
 write(out.with_suffix('.zip.sha256'),sha(out)+'  '+out.name+'\n')
 print(json.dumps({'zipBytes':out.stat().st_size,'sha256':sha(out),'contentFiles':len(rows)},ensure_ascii=True))

if __name__=='__main__':
 {'prepare':prepare,'source':source,'package':package}[sys.argv[1]]()
