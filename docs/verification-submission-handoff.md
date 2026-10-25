# E025：非视频参赛材料整理与提交字段核验

日期：2026-10-25；执行者：AI。**只整理本地材料，不重复上传 GitHub，不登录/填表/提交，不上传网盘，不制作视频。**

## 1. 验收目标与规则事实

真实需求：依据两个官方入口，把已有作品整理成可直接选择的发送材料；作者已纠正“GITHUB已经上传了”。因此本轮不是再次发布任务。

- 官网：https://www.boxuegu.com/matchTrack/detail/?id=10039
- WPS：https://f.kdocs.cn/ksform/w/write/GZcCLbBV#routePromt
- 两页面由 Codex 浏览器读取实际渲染 DOM / 可访问性树。WPS 明示是**省赛预指导**，截止显示 **2026-10-31 15:00:00**；完整作品之后仍须另交正式省赛入口。网站没有标注时区，不自行补充官网 11 月 18 日的具体截止时刻。
- 第 1–4 项 UID、姓名、学校、手机号均由本人填写；不根据 Git 作者或仓库信息猜测报名隐私。
- 第 5 项是主流网盘作品文件链接；GitHub 保留为代码/历史证据，但不能直接替代网盘字段。
- 第 6 项最多 1 份、单个 100MB 以内，选 **15 页作品介绍 PDF**。官网另要求技术 PDF ≤30 页，本包技术 PDF 为 **24 页**，不将两份 PDF 合并成 39 页。
- 第 7 项视频地址有必填星号，要求公开视频平台地址、不接受百度网盘视频链接。本轮按用户要求不处理视频，**不据此承诺能先提交后补**。官网视频要求 5–8 分钟、MP4 1080p，其中至少 2 分钟实际 AI 协同展示。
- 源规则快照：`docs/evidence/submission-rules-20261025.json`；字段映射：`docs/submission-handoff-20261025.md`。

## 2. 产物与明确发送位置

根目录：`D:\竞赛\delivery\PathLab-AI-参赛整理-20261025\`。

| 文件 | 使用位置 |
| --- | --- |
| `00-提交说明.html` | 本地导航入口，静态页面，不联网、不发送 |
| `00-提交说明.md` / `表单填写草稿.txt` | 对照规则、复制实际填写内容；隐私与未生成链接留空 |
| `01-上传网盘/PathLab-AI-完整作品材料-不含视频.zip` | 上传到本人选择的网盘，生成真实分享，再填第 5 项 |
| `02-表单第6项/PathLab-AI-作品介绍文档.pdf` | 第 6 项直接上传这一份 PDF |
| `03-技术文档备用/PathLab-AI-技术文档.pdf` | 完整 ZIP 内已含；正式入口另有字段时可单独用 |
| `04-完整材料解压版/00-评审入口.html` | 不解压 ZIP 也可从现成目录检查材料 |

ZIP 为 **7,695,581 字节（约 7.70 MB）**，425 条目：424 个内容文件和 1 份 manifest。SHA256：

`69ae06d8129189b807b1f7606947c335b3239e331ab813bdb30fe294129dc3d6`

包含：两 PDF、完整离线 HTML、384 个源码文件、完整历史 bundle、原已公开 Prompt ZIP、9 张正式实际截图、PDF 源稿及来源、规则/发送说明。明确排除视频、依赖包、构建/浏览器缓存、私有环境变量、原始会话记录和内部交接内容。整理轮的收尾证据保存在工作区，不向已冻结的核心 Prompt ZIP 塞入新轮次。

## 3. 源码 / GitHub / 文档版本一致性

- 已有公开仓库：https://github.com/ljqzs08/PathLab-AI 。本轮匿名只读 API `private=false`、`ls-remote` 证实远端 main 为 `e438363692762398117756ceb7f72a3fb415e5ad`，38 个完整提交。未使用凭证、未 push。
- 两 PDF 的资料基线均为 e438363；故包内源码、HTML 与历史统一取这个**已公开版本**，不用本机后续文档提交冒充已上线。包构建前本地 HEAD 为 `650eb914a15240b44772444cb4d06f57ab0f2dfa`、41 提交；后三次仅文档，应用 / README / npm 运行工具无差异。只读事实保留采样时点，不能推断以后远端永不变化。
- `git archive` 提取 384 源码文件；bundle 使用 `refs/remotes/origin/main`，包含 e438363 的全部祖先，不裁剪或改写历史。包内有恢复命令、逐条日志及 parent 图。
- 15 页介绍 PDF SHA256：`9af5d3182881c005775e6139e8d18dce855389dbb3e7cc91574b4b28b3cb2339`。
- 24 页技术 PDF SHA256：`ead851bb3c7f9417837376fc440219572526472c76c4ac5a5dd0b97dfac1dd2e`。
- 离线 HTML SHA256：`8f481dcdd4870ee9d9ab11b024f0d20d030c27cefcf89ce8f657efa83111a1d0`。
- 匿名只读证据：`docs/evidence/submission-github-readonly-20261025.json`。本轮未上传的本地 PDF 和整理材料不能称为已经发布到 GitHub。

## 4. 实际执行的验证

| 范围 | 实际结果 / 证据 |
| --- | --- |
| ZIP 构建与重开 | 425 条目、424 内容文件逐字节 SHA256 / CRC / 清单覆盖通过；build 与 reopen JSON |
| 源码 | 384 文件与 e438363 的 Git 对象逐字节一致 |
| Git bundle | 在 D 盘新建空仓库恢复 38 提交；所有 commit / parent 图一致；`git fsck --full` 通过；不需要网络 |
| PDF | 15+24 页均 A4、未加密、文本可提取、无替换方块；与既有 PDF 原字节一致；本轮未重新逐页视觉渲染，沿用 E023/E024 已归档 AI 检查范围 |
| 正式截图 | 9 张的 SHA 与既有清单一致，源 HTML 与包内 HTML 一致；不是新拍的手机实测 |
| 本地导航 | 两 HTML 共 12 个本地链接存在；入口 1440 / 390 两布局已由 AI 查看临时截图，文本可读、无裁切 |
| 包内离线作品 | 从实际 ZIP 解压副本运行，1440×1000 / 390×844 / 320×720 / 768×1024，4 次 L01 预测→显式提交→单步→复盘均成功；路径 6、扩展 22；无水平溢出、页面异常或外网请求 |
| 包工具 | Python 3 文件内存编译通过；新增包工具 10/10 单元测试通过；Node 冒烟脚本语法检查通过 |
| Prompt ZIP | PowerShell 7 与 Windows PowerShell 5.1 重新核验原冻结 ZIP 均通过：57 内容文件、9 完成轮、38 去重原文、10 历史功能提交；未改原 ZIP |
| 常见凭证模式 | 399 文本文件扫描无命中；仅启发式检查，不是安全认证，不声称全历史完成安全审计 |

对应证据位于 `docs/evidence/submission-packet-{build,reopen,validation,browser-smoke}-20261025.json`、`submission-packet-tool-tests-20261025.txt`、`submission-prompt-archive-recheck-20261025.json`。

归档前 `git diff --cached --check` 捕获补充摘录 Markdown 末尾空行；已用明确的摘录结束分隔修正封装格式，不改消息正文/哈希；复核通过。

这是 **AI 材料完整性检查与有限包冒烟**，不是完整产品回归、人工/手机真机验收、真实用户学习成效或 DeepSeek 付费联调。没有为了整理材料重跑 155 / 260 / 272 全套产品检查，也不把旧测试数字包装成这次新跑。

### 可复用命令

只读使用已有运行时；所有产物、TEMP/TMP、浏览器资料均在 D 盘项目。没有下载/安装新软件。

```powershell
$Python = 'C:\Users\LJQ\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$env:PYTHONDONTWRITEBYTECODE = '1'
$env:PYTHONIOENCODING = 'utf-8'
$env:TEMP = $env:TMP = 'D:\竞赛\.cache\tmp'
& $Python -B .\scripts\test-submission-packet.py
& $Python -B .\scripts\build-submission-packet.py --verify 'D:\竞赛\delivery\PathLab-AI-参赛整理-20261025\01-上传网盘\PathLab-AI-完整作品材料-不含视频.zip'
& $Python -B .\scripts\verify-submission-packet.py
# 上一命令的输出 JSON 提供新解压 HTML 路径；以下传入那条实际绝对路径：
node .\scripts\verify-submission-smoke.cjs '<本轮新解压HTML的绝对路径>'
.\scripts\Export-PromptEvidencePackage.ps1 -VerifyArchive 'D:\竞赛\delivery\PathLab-AI-参赛整理-20261025\04-完整材料解压版\05-Prompt证据\PathLab-AI-Prompt-evidence-20261025-093233.zip'
```

重建器默认拒绝覆盖现有交付目录；需要重建时显式给出新的 `--output` 工作区目录。源码/规则变化时先复核锚点与两 PDF，不绕开构建断言硬打旧版本。

## 5. 真实 Prompt、上一轮补件与 Git 边界

- 主请求：`prompts/sessions/2026-10-25-submission-organize.{md,jsonl}`，标准工具按唯一真实前缀提取，在后续人类纠正前停止；该主请求无独立最终答复，不虚构。
- GitHub 纠正及本轮可见说明：`prompts/sessions/2026-10-25-submission-github-clarification.{md,jsonl}`。原用户消息含自动浏览器上下文，只选择 `## My request:` 后的人类句子；保留整条源文本哈希、明确字符片段范围及片段哈希。内部交接不导出、不当 final。
- E024 收尾已真实补齐：`prompts/sessions/2026-10-25-project-introduction-completion-final.{md,jsonl}`，只读来源第 4804 行真实 final。旧 continue 快照曾误抓内部交接，保持旧文件/历史不改写，但明确不作为该轮最终答复证据、也不在本包公开基线内；以后使用此真实补件。
- 本轮最后答复尚未写入原始记录，**待下一轮补齐**，不预写。上述材料整理/纠正不是新核心功能轮，不改变 9 轮 / 38 条选编。
- C01 算法、C02 预测/Canvas/回放、C03 单因素/引用复盘的真实实现、原文与提交不变。U01 是实际人类交付纠正；共享轮不重复算作三次人类 Bug，不声称每链均有独立用户引导 Bug 材料。
- 本轮只显式暂存相关文件并普通本地提交，不 push、不改写历史。自身提交哈希在收尾真实产生后报告，不在同一提交内自引用。
- 既有 HTML 假脏及 5 个未跟踪旧残留不夹带、不删除。

## 6. 清理与剩余风险

- 正式材料包与 9 张真实证据图保留。新生成的 2 张入口检查图仅用于视觉验收，不属于正式证据。
- **清理未完成**：针对本轮两个明确临时目录的原生 PowerShell 删除命令被工具策略在执行前拒绝，未改用别的 shell / 运行时绕过。两目录仍留在 D 盘，总约 24.53 MB，待本人手动清理：
  - `D:\竞赛\.cache\submission-validation-20261025-2e93ed28`
  - `D:\竞赛\.cache\submission-smoke-20261025`
- 原始真实结果：`docs/evidence/submission-cleanup-20261025.json`。没有误删其他缓存、旧草稿或正式截图。
- 尚须本人操作：填真实报名信息、选择网盘并上传分享/未登录验证、制作并公开真实视频、提交预指导并留成功回执；后续还需按通知交正式省赛。
- 材料整理完成不等于资格审核、官方认可三链证据、人工/真机验收或整个参赛提交完成。

## 7. 下次复用与已确认偏好

本次再次确认：沿用已上传 GitHub、只整理本地非视频、按真实字段直接选文件、不编造缺失信息。下次优先从本整理入口核对；复用固定源码锚点、逐文件 SHA、可恢复完整历史和真实来源摘录流程。避免混淆预指导/正式入口、拿 GitHub 替代网盘、合并 PDF 超页或把自动交接摘要误认用户可见最终答复。
