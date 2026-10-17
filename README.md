# PathLab AI

让算法初学者先预测，再通过确定性搜索与证据反馈理解“为什么这样走”。

**当前状态：阶段 6，本地学习闭环 + 本机进度与安全恢复已接通。** 四关支持真实 BFS/A* 预测、受门控回放、Canvas/DOM、单因素条件实验、前后真实指标与引用解释报告。完整轨迹留在领域控制器私有字段，页面只收到已揭示内容。本地反馈是规则模板，没有调用模型；“记录齐备”不代表掌握，也不判定自由文本解释正确。已支持本机自动存档、版本化 JSON 备份和安全导入，远程 AI 尚未实现。功能检查与参赛证据分别列在 docs/progress-status.md；当前仍不是可直接提交的完整参赛交付。

## 启动与检查（Windows）

需要已安装 Node.js 22.13+ 与 npm；本机已验证 Node 24.19.0、npm 11.17.0。无需 API Key，不需要账号。推荐使用 Node 24 LTS；未测试其他 Node 主版本。
在仓库根目录使用 Windows PowerShell 5.1 或 PowerShell 7：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 ci
.\scripts\Invoke-ProjectNpm.ps1 run check
.\scripts\Invoke-ProjectNpm.ps1 run dev
~~~

开发预览为 http://127.0.0.1:3000，Ctrl+C 退出。仅绑定回环地址，不向局域网开放。
生产构建与浏览器检查：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 run build
.\scripts\Invoke-ProjectNpm.ps1 run test:browser
.\scripts\Invoke-ProjectNpm.ps1 run start
~~~

- check = 生成 Next 路由类型 + TypeScript 严格检查 + ESLint 零告警 + 102 项测试（原 73、门控会话 10、条件/报告 9、存档/恢复 10）。Node 原生去类型只负责执行；独立 tsc 仍负责类型检查，未增加测试依赖。
- test:browser 使用本机**已经安装**的 Microsoft Edge，无浏览器下载命令；从生产构建启动专用 3210 端口。测试前须先 build 且该端口空闲。当前为 4 视口 × 44 项 = 176 项 AI 自动检查，不代表真实手机/人工验收。
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

- PathLab-AI/src/app/：App Router 页面、元数据、系统字体与响应式 CSS。
- PathLab-AI/src/components/PathLabShell.tsx：经 ProgressStore 保留/恢复每关会话；LearningWorkbench 连接预测/回放/条件实验，GridCanvas、EvidenceInspector 与 ReflectionPanel 仅消费受门控投影。
- PathLab-AI/src/domain/learning/{progress,progress-store}.ts 与 components/ProgressPanel.tsx：受限命令日志、存档保护、JSON 预览/确认与备份。
- PathLab-AI/src/data/missions.ts：复用原有固定 JSON；不生成轨迹、统计或答案。
- PathLab-AI/contracts/、fixtures/：阶段 0 契约与数据，继续保留。
- PathLab-AI/src/domain/grid.ts、algorithms/{bfs,astar,priorityQueue}.ts：独立网格边界、FIFO BFS、f/h/sequence 二叉堆 A*、回溯、确定性事件与由事件汇总的统计；不依赖 React/DOM/AI。
- PathLab-AI/tests/：契约、网格/BFS、128 种固定端点的 3×3 障碍布局、四关原图/反事实与可复现证据；tests/browser/：生产页面自动检查。
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

规格基线见 docs/product-spec.md；算法结果见 docs/verification-stage-3-astar.md；门控 UI 结果见 docs/verification-stage-4-learning.md，条件/报告与像素历史见 docs/verification-stage-5-reflection.md；最新存档回归见 docs/verification-stage-6-storage.md；教师内容见 docs/teaching-guide.md；剩余验收见 docs/acceptance.md；过程索引见 docs/evolution-log.md。

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

用户已授权自主连续推进，仍逐阶段验证与提交；条件修改、报告和本机存档均已完成本机检查；下一阶段优先实际体验与正式交付证据，远程 AI 如接入须遵守现有证据契约与失败回退。对照证据用 inspect:compare 生成，见 docs/evidence/stage-3-comparison.json；不把节点数差异叫作运行耗时差异。

## 当前可操作的学习闭环

1. 选择关卡与允许的算法；开始后先预测，再揭示一次选择。
2. 用单步或播放观察已揭示前沿、代价和事件；回放不能越过下一预测点。
3. 完成后选择“改变一次条件”；应用预设封路/终点变化，旧摘要保留，算法固定。
4. 显式开始新运行并重新预测；新结果未完成前不显示最终步数。改完条件尚未开始时也可直接重置原图。
5. 对照两次路径步数与扩展数，选择本次真实事实并填写最多 500 字解释；引用条件变化和本次终止事件才满足比较记录要求。
6. 报告显示过程齐备/部分记录，文本不执行。留意上方本机存档状态；可导出 JSON、预览并确认导入。刷新恢复时播放暂停，未答预测仍需作答。未保存草稿不会恢复，不以浏览器存档替代独立备份。

Canvas 检查覆盖四视口、DPR1/2/3、响应式重绘、前沿/路径几何与当前节点真实像素；阶段 6 另查看了桌面与手机视口截图，但临时图清理被拒绝；不代表已做真实手机、屏幕阅读器或人工体验验收。
