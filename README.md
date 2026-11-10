# PathLab AI

让算法初学者先预测，再通过确定性搜索与证据反馈理解“为什么这样走”。

**GitHub：[`ljqzs08/PathLab-AI`](https://github.com/ljqzs08/PathLab-AI)**（Public；仓库是源码与历史，不是已部署的网站）。

**Prompt 历史附件：[下载 ZIP 与校验文件](https://github.com/ljqzs08/PathLab-AI/releases/tag/prompt-evidence-20261025)**（已验证未登录下载；阅读入口见下方导航）。

评审导航：[10 分钟源码复现](#10分钟源码复现) · [复现性声明与本轮实测](docs/reproducibility.md) · [Prompt 评审材料入口](prompts/submission/README.md) · [真实 Prompt 总索引](prompts/README.md) · [演进记录](docs/evolution-log.md) · [三条核心链](docs/core-chain-evidence.md) · [剩余提交材料](docs/progress-status.md)。

**当前状态：阶段 6，本地学习闭环 + 本机进度与安全恢复已接通。** 四关支持真实 BFS/A* 预测、受门控回放、Canvas/DOM、单因素条件实验、前后真实指标与引用解释报告。完整轨迹留在领域控制器私有字段，页面只收到已揭示内容。本地反馈是规则模板，没有调用模型；“记录齐备”不代表掌握，也不判定自由文本解释正确。已支持本机自动存档、版本化 JSON 备份和安全导入。E017 已增加可选的 DeepSeek 服务端证据复盘，默认关闭，模拟协议测试通过不代表真实账号联调已完成。功能检查与参赛证据分别列在 docs/progress-status.md；当前仍不是可直接提交的完整参赛交付。

## v2.0.0（2026-11-10）：按评审意见新增「A* 零基础入门」

首次评审 68 分，评语为“看完之后还是没有学会 A* 算法”。v2 不再堆功能，而是补上缺失的“从零讲懂”一段：首页第一个板块就是 6 章入门，读者先猜、后看答案。

- 用打车计价、导航预估作类比，手把手算一遍 g、h、f。
- 用三句话讲完 A* 的规则：挑、到了吗、展开。
- 在 7×5 的小地图上，跟着真实的 A* 一轮轮预测，每轮都说明为什么选这个格子。
- 最后对比 BFS 处理 29 格、A* 只处理 8 格，并完成 5 道出关小测。

关卡里的预测也做了改造：候选卡直接写成“已走 g · 估计剩 h · 合计 f”，猜错时会用具体数字解释原因。入门里的所有数字都来自站内真实的 `runAstar` / `runBfs`，不是手写动画。

验证（AI 执行）：160 项 Node 单元测试，离线 HTML 四视口回归 280/280，各章节 axe 无障碍检查均通过，另做了两轮 AI 模拟零基础学习者走查（非真人）。详见 [`docs/verification-astar-primer.md`](docs/verification-astar-primer.md)。

## 直接打开完整 HTML（无需安装或启动服务）

**实际网站文件：`PathLab-AI/PathLab AI.html`。** 在本工作区为 `D:\竞赛\PathLab-AI\PathLab AI.html`。双击文件，或在已安装的 Edge 中打开即可；不需要 Node.js、终端、API Key、网络或 localhost 服务。也可只复制这一个文件到其他文件夹再打开。

这不是访问卡片、网页截图、iframe 或跳转页：四关、BFS/A*、预测门控、Canvas/文字回放、条件实验、证据报告和 JSON 导入/导出均在 HTML 内运行，使用与工程版相同的组件、算法和关卡数据。原先的 `打开 PathLab AI.html` 入口已被替换，避免误用。

- 建议先在本机 Edge 中使用；已验证范围和实际结果见 `docs/verification-standalone-html.md`，不宣称所有浏览器或真实手机均已通过。
- 本地文件的自动存档受浏览器策略影响；移动/重命名文件、换浏览器或从 HTTP 版切换到 HTML 版时，不应假定存档会自动跟随。请先导出 JSON，再到目标版本预览并确认导入。存储被禁用时仍可学习和导出备份。
- “完整 HTML”包含本地学习与网页复盘内容整理，不包含需要服务端密钥的站内 DeepSeek API 调用，也不代表参赛交付材料已经完成；自由实验区仅保存当前页面中的地图。

## 无需密钥：DeepSeek 网页辅助复盘（E018）

完成固定关卡后，在复盘区选择问题方向，预览并复制本次真实事实，再手动打开 DeepSeek 官方网页粘贴提问。支持简明/引导两种风格、条件对照、复制失败回退、手机布局与减少动态。HTTP 与完整 HTML 均可本地生成；使用官方聊天需联网，网站不自动发送或读取回答。无需 API Key；不等同于站内模型调用。操作见 `docs/web-review-guide.md`，验证见 `docs/verification-web-review.md`。

## 可选站内 DeepSeek API 复盘

配置与数据/费用边界见 `docs/deepseek-setup.md`，模板为 `PathLab-AI/.env.example`。仅 Next 服务端持有 API Key；用户主动确认后发送已揭示的最小事实，不发送自由文本解释。默认关闭、失败保留本地反馈、离线 HTML 不发送。当前没有真实付费 API 联调；共享口令与进程限额仅适合本机/单实例受控演示，不当作公开部署保障。

源码修改后可在仓库根目录重新生成并检查单文件版：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','build:html')
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','test:standalone')
~~~

`test:standalone` 会先生成实际 HTML，再以 `file://` 执行四视口回归，无 webServer、不启动 Next 服务。构建脚本复用已锁定 Next 包内的编译器，不新增依赖；它使用内部模块路径，升级 Next 时需重新验证，不视为稳定公共 API。

## 地图预测与动效（E014 历史验收）

预测时可直接点地图上的菱形候选，或使用右侧候选卡；两处同步选中，但仍须点击“提交预测”才揭示下一步。方向键只查看，Enter 可选择。新增有限入场、按钮按压与节点反馈，遵循减少动态偏好，不增加无限动画或外部依赖。最终离线 204/204、HTTP 192/192（均含 16 项动效/地图专项）；细节与边界见 `docs/verification-motion-interaction.md`。

## 自由地图玩法（E015）

点击顶部“自由实验”进入独立 9×7 地图。选择“添加障碍 / 擦除障碍 / 移动起点 / 移动终点”后点格子；方向键移动焦点，Enter/空格绘制，支持最近 40 次编辑撤销。

1. 先试“绕路挑战”，猜 BFS、A* 谁扩展更少，或两者一样多；提交后比较真实路径步数、扩展量和前沿峰值。
2. 切换回放算法，单步或播放节点选择顺序；最后才绘出最终路径。支持暂停、速度与从头回放。
3. 尝试封住起点附近两条路，看不可达结果；再擦除一块障碍重新预测。改地图会清除过期结果，预设切换也可撤销。

此区不计入四关成绩、不改变关卡算法/规则/存档，刷新不保留，不进入 JSON 备份。不是任意尺寸/随机地图生成器。无需远程 AI、账号或密钥；自由地图不接入远程 AI。范围与实测见 `docs/playground-spec.md`、`docs/verification-playground.md`。

<a id="10分钟源码复现"></a>
<a id="10分钟源码复现"></a>
## 10 分钟源码复现指南（2026-10-25）

官方规则与提交材料审计见 [E019 报告](docs/submission-audit-2026-10-21.md)。GitHub 已按用户授权创建为 Public；推送提交、未登录访问与远端历史的实际核对记录见 [发布证据](docs/evidence/github-publication-20261025.json)。视频/PDF、完整人类引导修复材料与最终比赛提交回执仍单独跟踪，不把上传仓库等同于完成参赛提交。

**环境前提：** Windows 10/11，Git、Windows PowerShell 5.1 或 PowerShell 7、Node.js **22.13+** 与 npm；建议使用本次实际测试的 **Node 24.19.0 / npm 11.17.0**。首次安装需要联网；不需要 Python、数据库、Docker、模型账号或 API Key。浏览器建议使用已安装的 Microsoft Edge。不要全局安装项目依赖。

### 1. 获取源码并记录版本（目标 0–2 分钟）

以下示例将源码、依赖和缓存都留在本项目的 D 盘环境，目标目录必须尚不存在；已有仓库不要再次覆盖或执行 reset。使用 Git clone，而不是下载 ZIP，才能取得细粒度历史。

~~~powershell
New-Item -ItemType Directory -Path 'D:\竞赛\.cache' -Force | Out-Null
git clone https://github.com/ljqzs08/PathLab-AI.git 'D:\竞赛\.cache\review-source'
Set-Location -LiteralPath 'D:\竞赛\.cache\review-source'
git rev-parse HEAD
git log --oneline -10
node --version
npm.cmd --version
~~~

后续命令都从仓库根执行，而不是从应用子目录执行。PowerShell 若阻止本地脚本，只对本次进程运行 `Set-ExecutionPolicy -Scope Process Bypass`，无需修改系统级策略。

### 2. 安装锁定依赖（目标 2–5 分钟）

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 ci
~~~

包装器使用 package-lock.json，将 npm/TEMP/TMP/运行缓存限制到当前仓库；禁用安装钩子、遥测及浏览器下载。准确依赖清单见下表，完整传递依赖见锁文件。

| 用途 | 固定版本 |
| --- | --- |
| Next.js / React / React DOM | 16.4.2 / 19.3.1 / 19.3.1 |
| JSON Schema 校验 | ajv 8.20.0 |
| TypeScript / ESLint / eslint-config-next | 5.9.3 / 9.39.5 / 16.4.2 |
| Playwright / axe | @playwright/test 1.64.1 / @axe-core/playwright 4.14.0 |
| 类型声明 | @types/node 24.19.2；@types/react 19.3.0；@types/react-dom 19.3.0 |

ESLint 9 的已停止支持提示是已知工具链风险；本轮保留锁文件，不通过临时升级破坏复现。安装失败先检查 Node 版本、网络和跨平台可选包，不直接放开所有安装脚本。

### 3. 默认不接模型，启动网站（目标 5–7 分钟）

模板为 [PathLab-AI/.env.example](PathLab-AI/.env.example)。本地学习与网页辅助复盘**不需要创建 .env.local**；AI_ENABLED 默认关闭，密钥和独立口令默认留空。需要站内 API 时再按 [DeepSeek 配置](docs/deepseek-setup.md) 手工配置，不覆盖已有私有文件。

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 run dev
~~~

打开 **http://127.0.0.1:3000**，只绑定本机；Ctrl+C 停止。若端口被占用，使用：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','dev','--','--port','3001')
~~~

核心流程不依赖 AI_ALLOWED_ORIGIN；只有启用 API 时才需同步实际端口对应的 AI_ALLOWED_ORIGIN。全部环境变量的默认值、敏感性与作用见 [复现性声明](docs/reproducibility.md#环境变量)。

### 4. 验证本地学习闭环（目标 7–10 分钟）

1. 选择第一关，确认路径步数仍为“未揭示”。
2. 点击“开始预测”，点选地图候选或候选卡，再点击“提交预测”。未提交不能越过门控。
3. 使用“单步”或播放推进，遇到下一个预测点再次显式提交。
4. 搜索结束检查真实步数/扩展量和“规则模板 · 未调用模型”的本地复盘。需要更完整体验再做一次条件变化与引用报告，不把远程聊天响应代替本地事实。

**本次实测：** 在同一 Windows 主机的全新 Git 检出中，不复制 node_modules 或私有环境文件，使用新 npm 缓存，安装耗时 **44.611 秒**；从计时开始至一关闭环 **342.113 秒（约 5 分 42 秒，含中途操作等待）**。Git 本地克隆在计时前完成，不包含公网下载/环境安装；本机 AI 无头 Edge 自动执行，不是全新电脑、人工或真机验收。它验证了本次 10 分钟内演练，不保证所有网络/电脑均达标。来源修订、实际日志和边界见 [复现实测](docs/reproducibility.md)。

## 复现性声明

程序复现以 **实际 Git commit + package-lock.json +固定输入** 为锚点。BFS/A*、评分和本地证据不依赖远程模型；同样输入/操作的领域结果由确定性测试核对。独立 HTML 构建已修复 Windows 换行差异，并固定文本检出 LF；这是字节级构建修正，不改变算法、规则、存档或 UI。AI 开发过程通过真实可见 Prompt、实际失败/修复与提交来审计，**不保证相同 Prompt 再生成逐字相同源码**。

全套 typecheck/lint/测试、生产构建和浏览器回归在下文单独运行，不全部塞进 10 分钟体验目标。最终材料并未因此自动齐备。

## 开发与工程检查（Windows）

需要已安装 Node.js 22.13+ 与 npm；本机已验证 Node 24.19.0、npm 11.17.0。无需 API Key，不需要账号。建议复用本轮实测的 Node 24.19.0；未测试其他 Node 主版本。
在仓库根目录使用 Windows PowerShell 5.1 或 PowerShell 7：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 ci
.\scripts\Invoke-ProjectNpm.ps1 run check
.\scripts\Invoke-ProjectNpm.ps1 run dev
~~~

开发预览为 http://127.0.0.1:3000，Ctrl+C 退出。仅绑定回环地址，不向局域网开放。
上方为开发服务；日常直接使用完整网站可打开前述单文件 HTML，无需运行这些命令。
生产构建与浏览器检查：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 run build
.\scripts\Invoke-ProjectNpm.ps1 run test:browser
.\scripts\Invoke-ProjectNpm.ps1 run start
~~~

- check = 生成 Next 路由类型 + TypeScript 严格检查 + ESLint 零告警 + 155 项测试（2026-10-25 在干净源码检出中重新通过，日志见 docs/evidence/reproduction-check-20261025.txt）。Node 原生去类型只负责执行；独立 tsc 仍负责类型检查，未增加测试依赖。
- test:browser 使用本机**已经安装**的 Microsoft Edge，无浏览器下载命令；从生产构建启动专用 3210 端口。测试前须先 build 且该端口空闲。2026-10-25 在独立源码检出中重跑：HTTP **260/260**、换行修复后的离线 **272/272**，均为四视口 AI 自动检查、零失败/跳过，不代表真实手机/人工验收；本轮证据见 docs/verification-github-publication.md。
- 浏览器检查之外的工程工具回归：

~~~powershell
.\scripts\Test-PromptSnapshot.ps1
.\scripts\Test-ProjectNpm.ps1
~~~

PowerShell 传递 npm 的双横线和额外参数时，使用显式数组，避免 shell 吞掉分隔符：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run', 'dev', '--', '--port', '3001')
~~~

## 工作区与依赖边界

包装器将 npm 缓存、TEMP/TMP、Playwright 路径和 XDG 缓存限制在本仓库 .cache；关闭 Next 遥测、浏览器下载、安装脚本与自动审计/更新通知，仅修改当前调用进程环境，成功/失败均恢复。不要直接运行会绕过这些约束的安装或启动命令；不使用全局安装。

依赖全部精确锁定，来源和兼容取舍见 docs/dependencies-stage-1.md。Next 运行需要的本机预编译组件已在禁止安装脚本的模式下通过构建验证；换平台失败时应先检查可选包，不能直接开启全部安装钩子。
node_modules、.next 与类型增量文件用于复用或本地预览，不入 Git。阶段 1 既有检查图/缓存及 browser-results/.last-run.json 的清理曾被工具策略拒绝，未重试或绕过。本轮实际查看的 desktop/mobile 两张临时检查图，以及 `tests/browser/stage6-review.temp.spec.ts` 的清理也被拒绝，文件仍在 D 盘；临时 spec 不纳入提交。当前本机运行产品回归时明确排除该临时检查：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','test:browser','--','--grep-invert','temporary stage 6 visual review only')
~~~

已提交仓库不含该临时 spec，干净检出可运行普通 test:browser。不声称缓存已清空；也不把无用检查图冒充正式参赛证据。

## 仓库布局

- PathLab-AI/PathLab AI.html：完整可离线运行的单文件产物；src/standalone.tsx 与 scripts/build-standalone.mjs 复用现有应用生成它。
- PathLab-AI/src/app/：App Router 页面、元数据、系统字体与响应式 CSS。
- PathLab-AI/src/components/PathLabShell.tsx：经 ProgressStore 保留/恢复每关会话；LearningWorkbench 连接预测/回放/条件实验，GridCanvas、EvidenceInspector 与 ReflectionPanel 仅消费受门控投影。
- PathLab-AI/src/domain/learning/{progress,progress-store}.ts 与 components/ProgressPanel.tsx：受限命令日志、存档保护、JSON 预览/确认与备份。
- PathLab-AI/src/data/missions.ts：复用原有固定 JSON；不生成轨迹、统计或答案。
- PathLab-AI/contracts/、fixtures/：阶段 0 契约与数据，继续保留。
- PathLab-AI/src/domain/grid.ts、algorithms/{bfs,astar,priorityQueue}.ts：独立网格边界、FIFO BFS、f/h/sequence 二叉堆 A*、回溯、确定性事件与由事件汇总的统计；不依赖 React/DOM/AI。
- PathLab-AI/tests/：契约、网格/BFS、128 种固定端点的 3×3 障碍布局、四关原图/反事实与可复现证据；tests/browser/：共享产品回归；tests/standalone/：单文件离线、独立复制和存储受限检查。
- PathLab-AI/scripts/inspect-bfs.mjs：仅开发者核验，输出路径、指标、轨迹 SHA256 与 checkpoint 可用性，不是预测门控或用户学习记录。
- docs/：产品/架构/验收/演进/依赖核验/各阶段实际验证。
- prompts/sessions/：带来源行号和原文哈希的真实可见对话快照。
- scripts/：npm 环境包装、真实 Prompt 提取和相应回归。

## 真实性、隐私与证据

页面只展示真实搜索已揭示内容，不伪造学习效果。重置与关卡切换保留首次统计、完成摘要和报告历史；本机保存成功后刷新可恢复。唯一存储键 `pathlab.progress.v1`；当前测试页面操作无外部请求，未实现云同步。禁用/满额/损坏时提示仅内存并保留旧档，须留意保存状态。

JSON 先校验再确认导入；恢复不自动播放、不跳预测。1 MiB、4096 条总命令、每关 32 次运行；未提交草稿不保存。目录标识不是签名、JSON 不是身份或人类学习证明，详见 docs/storage.md。

本仓库没有 GitHub remote；创建/推送/公开与评审授权需另行确认。作者邮箱可能随未来公开历史曝光，发布前复核。
合成 fixtures、工具回归与 AI 自测不是人工验收。**C01/C02/C03 三个核心模块的代码、测试、Prompt 来源与细粒度提交均已存在；真实用户引导 Bug 修复材料尚未齐备，不能把 AI 自测顶替。** 这不是“功能完成 0/3”。本轮用户已真实纠正进度口径，按过程纠偏留证，不冒充三条应用 Bug 链。原文要求与当前缺口逐项见 docs/progress-status.md。

每轮最后答复尚未落盘时标明待补齐，下一轮只读提取真实记录；不归档内部交接摘要。此前自主迭代轮已补齐 9 条真实消息（含最终答复）；本轮最终答复仍待后续捕获。

## 阅读与下一阶段

规格基线见 docs/product-spec.md；算法结果见 docs/verification-stage-3-astar.md；门控 UI 结果见 docs/verification-stage-4-learning.md，条件/报告与像素历史见 docs/verification-stage-5-reflection.md；最新存档回归见 docs/verification-stage-6-storage.md，单文件交付见 docs/verification-standalone-html.md；教师内容见 docs/teaching-guide.md；剩余验收见 docs/acceptance.md；过程索引见 docs/evolution-log.md。

## 可复核的关卡结果（BFS/A* 步数一致，完成各运行后显示；条件修改 UI 已实现）

| 关卡 | 原图最短步数 | 默认条件修改后 | 说明 |
|---|---:|---:|---|
| L01 | 6 | 8 | 移动终点 |
| L02 | 14 | 16 | 封锁 (4,5)；扩展节点却从 53 降为 52，步数与搜索范围不是同一指标 |
| L03 | 8 | 12 | BFS 作独立距离基线；A* 原图扩展 8、封路后扩展 16 |
| L04 | 14 | 8 | 移动终点 |

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run', '--silent', 'inspect:bfs')
~~~

输出含答案，仅供开发者核验，不得提前显示给学习者。机器证据见 docs/evidence/stage-2-bfs.json；测试逐项核对其可复现性。16 个 checkpoint 槽在 BFS 轨迹中均有多候选，门控交互另见阶段 4 实测，不将静态分析器当作学习记录。

用户已授权自主连续推进，仍逐阶段验证与提交；条件修改、报告和本机存档均已完成本机检查；下一阶段优先实际体验与正式交付证据，可选 DeepSeek 复盘遵守现有证据契约与失败回退。对照证据用 inspect:compare 生成，见 docs/evidence/stage-3-comparison.json；不把节点数差异叫作运行耗时差异。

## 当前可操作的学习闭环

1. 选择关卡与允许的算法；开始后先预测，再揭示一次选择。
2. 用单步或播放观察已揭示前沿、代价和事件；回放不能越过下一预测点。
3. 完成后选择“改变一次条件”；应用预设封路/终点变化，旧摘要保留，算法固定。
4. 显式开始新运行并重新预测；新结果未完成前不显示最终步数。改完条件尚未开始时也可直接重置原图。
5. 对照两次路径步数与扩展数，选择本次真实事实并填写最多 500 字解释；引用条件变化和本次终止事件才满足比较记录要求。
6. 报告显示过程齐备/部分记录，文本不执行。留意上方本机存档状态；可导出 JSON、预览并确认导入。刷新恢复时播放暂停，未答预测仍需作答。未保存草稿不会恢复，不以浏览器存档替代独立备份。

Canvas 检查覆盖四视口、DPR1/2/3、响应式重绘、前沿/路径几何与当前节点真实像素；阶段 6 另查看了桌面与手机视口截图，但临时图清理被拒绝；不代表已做真实手机、屏幕阅读器或人工体验验收。

## 评审与真实设备收尾（E016）

- 三条核心功能与真实用户纠正的可核对导航：`docs/core-chain-evidence.md`。
- 发布授权、原始历史隐私与实际访问验证：`docs/review/access-checklist.md`；实际仓库为 https://github.com/ljqzs08/PathLab-AI ，是否已推送和核验以当次发布证据为准。
- 本地体验包：根目录执行 `scripts/Build-ReviewPacket.ps1`，输出到 `delivery/`，不上传且不包含原始会话。
- 人工/真机记录：`docs/review/manual-acceptance.md`（全部待测，不是已通过清单）。
- 包校验：`scripts/Test-ReviewPacket.ps1 -Path <实际 ZIP 路径>`；工具合成回归：`scripts/Test-ReviewPacketTools.ps1`。
- 证据原文只读复核：`scripts/Test-CoreEvidence.ps1`，需要本机原始会话文件；这不是公开体验包的运行前置条件。
- 本轮验证范围与剩余边界：`docs/verification-review-readiness.md`。
