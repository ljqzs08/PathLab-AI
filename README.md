# PathLab AI

让算法初学者先预测，再通过确定性搜索与证据反馈理解“为什么这样走”。

**当前状态：阶段 4B，真实 BFS/A* 预测、受门控回放、Canvas/DOM 与证据检查器已通过本机 AI 检查。** 四关可实际运行；完整轨迹留在领域控制器私有字段，页面只收到已揭示内容。反事实、诊断/报告、持久存储及远程 AI 尚未实现，当前不是可直接提交的完整参赛作品。

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

- check = 生成 Next 路由类型 + TypeScript 严格检查 + ESLint 零告警 + 83 项测试（原 73、门控学习会话 10）。Node 原生去类型只负责执行；独立 tsc 仍负责类型检查，未增加测试依赖。
- test:browser 使用本机**已经安装**的 Microsoft Edge，无浏览器下载命令；从生产构建启动专用 3210 端口。测试前须先 build 且该端口空闲。当前为 4 视口 × 18 项 = 72 项 AI 自动检查，不代表真实手机/人工验收。
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
node_modules、.next 与类型增量文件用于复用或本地预览，不入 Git。阶段 1 的三张临时检查图和既有 .cache/npm、.cache/tmp 清理被工具策略拒绝，未重试或绕过。本轮未生成检查图；归档回归结果后，仅尝试清理新生成的 browser-results/.last-run.json，也被策略拒绝。以上仍在 D 盘忽略目录中，不声称已经清空。

## 仓库布局

- PathLab-AI/src/app/：App Router 页面、元数据、系统字体与响应式 CSS。
- PathLab-AI/src/components/PathLabShell.tsx：保留每关当前页内会话；LearningWorkbench 连接预测/回放，GridCanvas 与 EvidenceInspector 仅消费受门控投影。
- PathLab-AI/src/data/missions.ts：复用原有固定 JSON；不生成轨迹、统计或答案。
- PathLab-AI/contracts/、fixtures/：阶段 0 契约与数据，继续保留。
- PathLab-AI/src/domain/grid.ts、algorithms/{bfs,astar,priorityQueue}.ts：独立网格边界、FIFO BFS、f/h/sequence 二叉堆 A*、回溯、确定性事件与由事件汇总的统计；不依赖 React/DOM/AI。
- PathLab-AI/tests/：契约、网格/BFS、128 种固定端点的 3×3 障碍布局、四关原图/反事实与可复现证据；tests/browser/：生产页面自动检查。
- PathLab-AI/scripts/inspect-bfs.mjs：仅开发者核验，输出路径、指标、轨迹 SHA256 与 checkpoint 可用性，不是预测门控或用户学习记录。
- docs/：产品/架构/验收/演进/依赖核验/各阶段实际验证。
- prompts/sessions/：带来源行号和原文哈希的真实可见对话快照。
- scripts/：npm 环境包装、真实 Prompt 提取和相应回归。

## 真实性、隐私与证据

页面展示真实搜索已揭示轨迹、预测与统计，不伪造学习效果。重置与关卡切换保留当前页首次统计/完成摘要；刷新后丢失，明确不声称已持久保存。浏览器测试覆盖的默认页面操作没有外部请求或 local/sessionStorage 写入；这不是对所有系统进程或未来服务的网络保证。

本仓库没有 GitHub remote；创建/推送/公开与评审授权需另行确认。作者邮箱可能随未来公开历史曝光，发布前复核。
合成 fixtures 和工具回归不是用户对话、模型实测或人工验收。AI 自查不代替用户引导 Bug 修复；C01 已有 BFS/A* 核心实现，C02 已有门控/界面，C03 尚未实现，三条核心完整链仍为 **0/3**。
每轮最后答复尚未落盘时，标明待补齐，下一轮只读提取真实记录；不把内部交接摘要归档为最终答复。

## 阅读与下一阶段

规格基线见 docs/product-spec.md；算法结果见 docs/verification-stage-3-astar.md；当前学习 UI 结果见 docs/verification-stage-4-learning.md；教师内容见 docs/teaching-guide.md；剩余验收见 docs/acceptance.md；过程索引见 docs/evolution-log.md。

## 可复核的关卡结果（BFS/A* 步数一致，完成各运行后显示；条件修改 UI 尚未实现）

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

用户已授权自主连续推进，仍逐阶段验证与提交；下一里程碑为条件修改、新运行、证据诊断与复盘，不接远程 AI。对照证据用 inspect:compare 生成，见 docs/evidence/stage-3-comparison.json；不把节点数差异叫作运行耗时差异。
