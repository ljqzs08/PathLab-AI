<!-- page: cover -->
# PathLab AI
## 技术文档
作者指定独立 HTML · 2026-11-15 完整迁移版

本文回答三个问题：算法与交互由什么事实驱动；最新单文件如何与源码对应；评审怎样独立复核而不依赖作者电脑的旧文件夹。
:::image 03-coach-replay 6.75

主件为 PathLab_AI_v4_optimized_final.html，7,127,303 字节。实现锚点 E037：39e51b2；E038：8c1e6c9。完整 SHA256、实际源码导出基线和 Git 提交数由本包校验文件提供，不用猜测或自引用哈希代替。
原 v3 所有记录已迁入；本文是当前说明，历史文档中的旧日期、旧功能范围和旧提交状态仅作为当时记录阅读。

<!-- page: architecture -->
# 01 双层交付与总体架构
## 不把 Next 工程误当成完整最新版
基础层由 Next/React 组件、TypeScript 领域逻辑、contracts 与 fixtures 组成，构建为原完整 HTML。E037/E038 按作者指定范围仅增强根目录独立 HTML：增加练习舱、主题/欢迎和可发现辅助复盘，不同步修改 Next 页面。
因此随包提供三个相互对应的对象：当前成品、不可变原始 HTML 底稿、可复现增强脚本及 JS/CSS。只有基础层的 build:html 不等于构建当前主件。
| 层次 | 主要文件 | 职责 |
| --- | --- | --- |
| 输入契约 | PathLab-AI/contracts、fixtures | 关卡、事件、候选和反馈结构 |
| 领域算法 | src/domain/algorithms、grid.ts | 输入边界、BFS/A*、最小堆与事件 |
| 学习领域 | src/domain/learning | 门控会话、诊断、对照、报告、存档 |
| 展示与交互 | src/components | 站点、课程、Canvas/DOM、工作台 |
| 独立增强 | scripts/ui-beginner、web-review-entry | 练习舱与辅助复盘的增量交互 |
| 证据与交付 | prompts、docs、scripts | 真实对话、验证、导出、哈希迁移 |

依赖版本读取自 package.json：Next 16.4.2、React 19.3.1、TypeScript 5.9.3、Ajv 8.20.0。它们是当前仓库锁定版本，不代表市场最新版本。本轮未改依赖或应用代码。

<!-- page: domain -->
# 02 输入模型、BFS 与 A* 适用域
## 先约束问题，再解释结论
Grid 由 width、height 与 rows 表示，点为整数 x/y。assertSearchInput 在引擎入口验证尺寸 1 至 25、行列一致、仅允许可走与障碍字符、端点在界内且可走。此通用边界与自由区固定 9×7 不是同一限制。
邻居按上、右、下、左稳定生成，包含越界候选以便输出明确跳过事件。移动仅四方向，每步代价为 1，不允许斜走或任意权重。
## BFS
FIFO 队列使用 head 索引避免每步移除队首；节点入队即标记 discovered，避免重复发现。父节点链接用于回溯路径。在单位代价图中，逐层搜索得到最短步数路径；不将该性质直接推广到带权路径。
## A*
g 为累计单位步数；h 为曼哈顿距离；f 为二者之和。在当前四邻接单位代价网格中，h 一致且不高估，因此关闭节点不重新打开的策略适用于本实现范围。
算法源码使用 open/known/closed 区分有效候选与已处理节点。更好的 g 产生新的堆项；已失效项弹出后跳过，不进入有效候选快照和指标。若目标无法到达，返回 unreachable 和空路径，而不伪造到达。
定位：src/domain/grid.ts、algorithms/bfs.ts、astar.ts。所有路径均相对于本包源码目录下的 PathLab-AI。

<!-- page: heap -->
# 03 二叉堆、决胜规则与事件计数
## 为什么相同输入能产生同一条教学轨迹
PriorityQueue 是二叉最小堆。push 向上调整，pop 用末项补根并向下调整；单次堆操作为对数级。comparePriority 先比 f，再比 h，最后比唯一 entrySequence。邻居顺序固定，序号只在入队时递增，不依赖对象枚举、随机数或时钟。
```javascript
return a.f - b.f || a.h - b.h
  || a.entrySequence - b.entrySequence;
```
这是本项目的稳定决胜规则；A* 算法可以采用其他合法平局策略，教学文案不能把本站规则说成全部实现的唯一规定。
## 轨迹与指标使用同一来源
| 事件/指标 | 含义 |
| --- | --- |
| node_discovered | 有效发现/更新候选，携带父节点与分数 |
| node_selected | 选出当前节点；不把退役堆项算作有效选择 |
| node_expanded | 实际检查其邻居 |
| frontier_snapshot | 当前有效前沿快照 |
| path_updated / run_finished | 过程/最终路径和本次结果 |
| pathLength | 最终路径节点数减一；不可达为 null |
| expandedCount / frontierPeak | 扩展事件数 / 有效快照最大前沿 |

结果计数从发出的事件对账。不能把扩展数当路径步数。为了教学证据，快照会排序和复制；整套带轨迹运行的时间/空间开销高于仅求路径的裸算法，不能仅用二叉堆复杂度概括整个产品。
定位：priorityQueue.ts、bfs.ts 与 astar.ts 的 finish/snapshot。

<!-- page: session -->
# 04 私有会话与预测门控
## 预计算不等于提前向界面公开
LearningSession 用私有字段保存完整 trace、cursor 和命令历史。LearningView 是已揭示状态的复制投影，包含当前前沿、候选、路径、已揭示事件、首次预测表现和完成运行；展示层不直接持有未来选择。
典型流程为任务简介 → 开始运行 → prediction 检查点 → 显式提交 → 暂停/播放/单步 → reflection。具体非法动作由会话拒绝，而不依赖按钮是否禁用。
## 核心不变量
1. 地图与候选卡仅改变选中项，必须提交才记录预测；tick/step 不跨过待答检查点。
2. 首次预测结果保留，重试不改写首答；提示和解释只能依据已揭示事实。
3. 切换算法、关卡或应用条件后建立相应运行关系，不复用旧未来轨迹作为当前结果。
4. 运行标识、网格修订和事件标识使条件对照可追溯；报告引用属于实际完成的运行。
## 条件实验
在保留前次完成运行的前提下进入实验状态，仅应用关卡允许的一项变更。新 gridRevision 重新搜索和预测；compareRuns 组织前后 pathLength 与 expandedCount 差异，不内置“优化必然更好”的结论。
定位：learning/session.ts、report.ts、components/LearningWorkbench.tsx。恢复存档通过重放有效命令重建，而不是接受任意客户端给定的算法答案。

<!-- page: rendering -->
# 05 Canvas 与 DOM 共用事实
:::image 02-lab 6.75
## 绘制层不另算一套答案
GridCanvas 根据 LearningView 生成 discovered、expanded、frontier 和 path 集合，Canvas 绘制线条/标记，DOM 提供可访问的格子与交互。Canvas 不可用时仍保留 DOM 控件和地图，不以画布像素作为唯一信息来源。
画布以元素尺寸和受限设备像素倍率调整，候选点击与键盘操作同步到同一预测选择状态。地图检查与预测提交分离；缩放、重绘和有限动效不能推进算法游标。
本版具有减少动态偏好与移动布局支持。当前材料中的四宽度检查属于浏览器模拟，不能推断已完成屏幕阅读器或真实手机验收。
定位：components/GridCanvas.tsx、LearningWorkbench.tsx，以及原回归脚本。

<!-- page: teaching -->
# 06 站点、课程与误区诊断
## 内容先定义，再使用
PathLabShell 以 hash 导航显示首页与八站。intro 的九页课先定义概念；life/pictures/video 提供作者场景和媒体；primer 是学前测、五章、学后测与报告；game/lab/playground 分别提供游戏、正式任务和自由地图。
“七章互动课”包含前测与后测两个阶段，不意味着有七章算法正文。顶部访问计数不是学习完成数。
## 规则误区不是能力标签
mastery.ts 以 comparePriority 计算候选排序和逐步淘汰，不为题目另写一套答案。classifyMistake 区分只看 h、只看 g、f 比较、平局 h、加入顺序。分类描述本题遗漏的规则，不推断长期能力或心理特征。
学前测/后测形成当前会话对照；首答和重试分别记录。该机制提供形成性反馈，但短测本身不证明迁移、保持或统计显著提升。
## 自由地图
playground.ts 与 Playground.tsx 使用独立 9×7 练习状态，保护起终点、支持撤销与预设。比较使用真实 BFS/A* 输出，先有预测再揭晓，保持与正式关卡和存档隔离。
定位：PathLabShell.tsx、AstarPrimer.tsx、domain/learning/astar-primer.ts、mastery.ts、Playground.tsx。图片中的公式或场景说明若与可执行引擎冲突，应以输入契约与真实事件解释，不把素材当计算依据。

<!-- page: e037 -->
# 07 E037 独立增强层的可复现性
:::image 03-coach-replay 6.75
## 基于原字节底稿，而不是再次另写网站
enhance-standalone-ui.mjs 读取 output/backups 中的原始底稿，校验预期 SHA256，导入真实 runAstar/runBfs，生成固定练习地图的回放和指标，然后注入 JS、CSS 与 JSON 数据。
ui-beginner.js 管理五阶段任务、首答、错因、导出与可选阶段记忆；样式只服务指定独立文件。原媒体、八站、评分与正式存档保留。可选阶段记忆只存练过的前四步与阶段，不保存小测答案为“掌握”。
--check 模式重新生成预期字符串并逐字比较当前成品，不修改目标文件。本版以这个检查证明最新 HTML 与底稿/增强源码一致；历史保护性测试另检查原功能未被覆盖。
定位：scripts/enhance-standalone-ui.mjs、ui-beginner.js/.css，底稿见 output/backups。

<!-- page: e038 -->
# 08 E038 辅助复盘与双重门控
:::image 04-review-learning 6.75
## 可发现入口不代表可以编造证据
首页卡片与跨站按钮打开同一面板。“学习提问”使用固定主题和风格生成可预览模板；“本次运行复盘”读取原 WebReview 的当前预览，在未完成搜索、条件编辑或切换任务时锁定。
本层不另造运行摘要，不从页面残留拼接过时事实。用户复制后自行到固定官方网页粘贴/发送；复制失败提供手动文本回退，关闭面板使未完成操作失效。打开外链需明确操作，不在初始 DOM 提前激活可用外链。
不自动发送、不读取外部聊天、不接收前端密钥，不把外部回答计入评分。离线 API 不可用的提示必须保留。
定位：scripts/web-review-entry.js/.css 与 components/WebReview.tsx。E038 历史首次原回归外链断言失败已留存，修后通过；没有放宽原断言，也没有伪装成用户新报错。

<!-- page: storage -->
# 09 本机存档、备份与恢复
## 正式任务与便捷练习分离
原 ProgressStore 使用 pathlab.progress.v1 键；首次 load 之前不写入。正式进度包括可重放命令、关卡与版本信息。恢复时重建会话并保持暂停，未提交的预测仍要求作答。
JSON 导出、预览和显式确认导入分离。损坏数据、未知版本和不可用存储时保留旧档、暂停自动写入，并允许内存继续及导出。检测到跨页原始值变化时保护当前状态，不承诺数据库级强一致锁。
## 独立增强的最小写入
E037 的 pathlab-coach-e037 键仅在用户主动记住阶段时写入；关闭记忆只删除自己的键。主题和访问记录另有命名空间，不把访问次数提升为练习成绩。
练习舱不改变正式评分和 JSON 存档格式。本次材料迁移的是文件记录，不复制作者浏览器私人学习进度，也不声称把旧 localStorage 自动搬到评审浏览器。
## 操作建议
移动 HTML、切换浏览器或转到工程版前先导出原任务 JSON。目标版本先预览再确认，检查恢复提示；浏览器 file:// 存储策略可能不同，禁用存储时继续使用内存但注意刷新丢失。
定位：learning/progress.ts、progress-store.ts、ProgressPanel.tsx、scripts/ui-beginner.js。

<!-- page: feedback -->
# 10 反馈、契约与外部 AI 边界
## 本地规则是基线能力
diagnose.ts 依据已发生预测和事件组织反馈，report.ts 保留解释与引用事件。报告能检查事实/引用齐备性，不自动证明自由文本解释正确。DOM 按文本展示外部内容，不把模型返回字符串当可执行 HTML。
contracts/schema 与 Ajv 校验关卡/反馈输入，远程适配双端检查结构和引用，不允许模型改写引擎结果、评分或存档。
## 服务端 API 为可选分支
工程版保留可选 DeepSeek 适配，默认关闭，配置在服务端私有环境；具备独立口令、主动同意、进程级限流、超时/取消和本地回退。该分支不等于离线 HTML 已接通，也不等于已经完成真实付费联调。
网页辅助则完全不同：生成本地文本，由本人复制到官方网页。它不需要 API Key，但需要本人联网登录并自行发送；当前没有自动读回结果或站内持续聊天。
## 公开材料应检查的边界
包内不提供私人环境文件、浏览器存档、账号令牌或完整原始聊天数据库。真实拍屏和历史文档仍可能包含作者标识、目录与网址，外发前本人复核隐私与素材使用权限。本轮不登录外部账号、不发布、不更改仓库可见性。
定位：learning/feedback-validation.ts、web-review.ts、server 目录、docs/deepseek-setup.md 与 web-review-guide.md。

<!-- page: reproduce-html -->
# 11 最新单文件的独立复现
## 最短体验路径
无需 Node：从本包打开指定 HTML 即可离线体验。不要把旧历史区 HTML 或源码目录内其他同名入口误认为当前主件。
## 从真实源码检查增强结果
在可写的 D 盘项目路径解压当前“源码”，安装满足 package.json 的 Node 版本（至少 22.13.0）。以下命令在该源码根目录运行。--check 不会重写当前成品。
```powershell
node --experimental-strip-types `
  scripts/enhance-standalone-ui.mjs --check
```
若确需重新生成，先在自己的工作副本留存当前文件，然后去掉 --check。生成物仍为指定根目录 HTML；不要在正式交付目录覆盖证据。底稿缺失或字节不符时脚本应拒绝，而不是用当前任意 HTML 顶替。
## 本版识别信息
| 项目 | 值 |
| --- | --- |
| 当前文件 | PathLab_AI_v4_optimized_final.html |
| 字节数 | 7,127,303 |
| SHA256 首尾 | 7bd7f222529701b1 … d97c03c917a |
| 完整值 | manifest.json 与最新输入核验 JSON |
| 原始底稿 | output/backups 中 before-ui-20261115 文件 |
| 增强来源 | E037 39e51b2、E038 8c1e6c9 |

源码导出使用真实 git archive，bundle 独立恢复到另一个本地目录检查 HEAD/历史数。具体基线和逐文件一致性见 04-源码与演进；不把后续归档提交谎称已在先前导出的 bundle 中。

<!-- page: reproduce-next -->
# 12 基础 Next 工程的运行与检查
## 与最新独立增强明确分工
本章复现基础工程，不能替代上一章对增强 HTML 的逐字检查。仓库已有脚本将 npm 缓存、临时目录与浏览器缓存定向到项目 D 盘；无需创建嵌套 Git 仓库。
以下命令在本包“源码”根目录运行；ci 需要联网获取锁定依赖，初次环境安装和公网下载时间不能隐去后称完整冷启动耗时。
```powershell
powershell -NoProfile -File scripts/Invoke-ProjectNpm.ps1 ci
powershell -NoProfile -File scripts/Invoke-ProjectNpm.ps1 run dev
```
开发服务位于 127.0.0.1:3000。生产检查与原始单文件构建使用现有 package scripts：
```powershell
powershell -NoProfile -File scripts/Invoke-ProjectNpm.ps1 run check
powershell -NoProfile -File scripts/Invoke-ProjectNpm.ps1 run build
powershell -NoProfile -File scripts/Invoke-ProjectNpm.ps1 run build:html
```
Node 测试脚本为 node --experimental-strip-types --test tests/*.test.mjs；typecheck 先执行 next typegen，再 tsc --noEmit；lint 为零告警 ESLint。版本和具体命令以 package.json/lock 为准。
本轮没有重装依赖、重启 Next 或重跑生产构建，因此不能把本章的可执行步骤当成本轮已经执行。CLI 用法参考仓库所带 Next 版本文档，不采用已过时的 next lint 口径。
本地复现不需要配置真实模型密钥。需要浏览器专项时按现有脚本指定浏览器；自动化用例中的视口并非真实设备。

<!-- page: tests -->
# 13 验证层级与本轮实际范围
## 不合并不同轮次的分数
| 执行时点 | 实际范围 | 结果/性质 |
| --- | --- | --- |
| 历史 E038 | 新复盘入口专项 | 312/312，AI Edge |
| 历史 E038 | 原 UI / 原回归 | 389/389、316/316，AI Edge |
| 历史 E038 | 原 Node / 保护检查 | 171/171、21/21，AI |
| 本轮材料整理 | 打包副本四宽度专项 | 124/124，AI Edge 157 headless |
| 本轮材料整理 | 视频原件与兼容版 | 三段原件与三份输出全片解码 |
| 本轮材料整理 | 文档、迁移、源码与 ZIP | 分项结果见材料验收报告 |

本轮浏览器只抽测八站、五步、回放、学习模板和 BFS L01 闭环；不把它写成 312/389/316 全量重新执行。离线上下文记录无自动外部请求和无 JS 页面异常，仍不证明所有交互、所有浏览器或所有安全性质。
## 如实保留测试工具自己的问题
第一次本轮专项把阶段按钮误当 tab，用 aria-selected 断言，实际组件使用 aria-current=step，导致 harness 断言失败。核对源码后改用真实语义再运行，产品文件未改。此为测试选择器纠正，不编造用户 Bug 或产品功能修复。
11 张当前正式截图由自动浏览器生成并经 AI 查看；文档全部页面还要进行 Word/Poppler 渲染与版式检查。渲染/哈希检查是材料验收，不是教学效果实验。
定位：docs/evidence/latest-submission-browser-20261115.json、既有 E038 JSON 与本轮 verification-latest-submission.md。

<!-- page: prompts -->
# 14 Prompt、Git 与媒体证据的来源
## 角色、先后和完整性必须可辨
原冻结九轮/38 条可见原文不扩充历史计数，C01/C02/C03 共享开发轮也不拆成虚构的独立用户报错。U01 保留真正用户纠正。新增七张拍屏独立编号，749 是术语顺序纠正的局部证据，750/751 的计划和预期不转为成果。
E037/E038 文字快照从已有会话的可见消息提取，保留来源/范围与角色；E038 最终答复已经真实补齐。E035 的人工摘录仍标明原性质。本轮结束后的末答复只有真实落盘才可补录，不把本文总结当成原生完整对话。
## 核心链状态
| 链 | 真实实现锚点 | 人类引导材料边界 |
| --- | --- | --- |
| C01 算法 | 5c3eec6、5ade0e8 | 现有主要为 AI 自测自修 |
| C02 预测/Canvas/回放 | 572e15d、fd82d8f | 与其他模块有共享真实开发轮 |
| C03 对照/复盘 | 3b2e9f3、f4a43ca，后续 E038 | 后续入口纠正不反写三条独立人类链 |

新视频分别为 36.033 秒、18.933 秒和 243.100 秒，均 H.265 原件；另附 H.264/AAC 原尺寸播放副本。抽帧只能支持所见画面描述，全片解码只支持可解码性，不等于完整语音审核或符合参赛录制条款。
三链的实现、Prompt 来源与提交都存在；满足摘录中全部人工引导材料的证据仍有缺项。不用合成对话、拼接历史视频或事后制造 Bug 补齐。

<!-- page: migration -->
# 15 完整迁移、校验与交付边界
## 每个原路径都有字节一致的去向
先冻结 v3 所有文件的相对路径、大小和 SHA256，再迁入新版：当前作品/文档/源码/视频进入新主目录，旧同类文件归 12-历史材料/v3；Prompt、截图、原始记录和旧 ZIP 继续保留。相同字节副本可共用保留文件，但 622 个原路径均能在映射中查到。
最新完整 manifest 不覆盖旧 manifest；历史哈希仍保留原语义。ZIP 逐条 CRC 检查并与当前 manifest 对账。包内存在旧 ZIP 会增加体积，这是完整迁移的明确取舍，不把它当可随意删除的垃圾。
## 独立复核步骤
1. 对最新 ZIP 执行 Get-FileHash，与旁边 .sha256 比较；解压后打开本地评审入口。
2. 查看 v3迁移映射.json，逐项计算 newPath 的 SHA256；每条应与原记录一致。
3. 查看最新 manifest、源码一致性说明和 Git bundle。用 git clone -b main 对 bundle 恢复，再核对记录的 HEAD 和提交数。
4. 对源码运行独立增强 --check；需要基础工程时再按上一章安装依赖。本轮未重新执行整个干净环境冷启动计时。
## 未替作者完成的外部事项
不 push、不上传网盘或视频平台、不填写/提交表单、不改变账号权限。GitHub 曾公开的历史核验按原日期保留，本轮不声称远程 HEAD 与此包一致。
旧规则是历史材料，不是 2026-11-15 官网现行条款核验。当前视频清晰度/时长/协同展示、素材授权、公开隐私、真人教学和真机测试，仍须在正式提交前由本人按真实要求确认。
详细产物导航、来源与操作记录：latest-evidence-guide.md、verification-latest-submission.md、10-最新版更新说明中的材料验收报告。
