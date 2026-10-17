# 架构与目录规划

## 当前仓库事实

Git 根目录为本工作区；应用子目录为 PathLab-AI；无嵌套 Git。
阶段 0 已保留规格、契约和固定 JSON；阶段 1 已建立 Next.js App Router + React + TypeScript 最小本地应用。阶段 2 的 BFS 与阶段 3 的 A*/二叉堆已实现并交叉核验，阶段 4 已通过私有学习会话接入页面；还未实现条件实验/诊断/报告，不等于完整教育闭环。
版本精确锁定于 package-lock.json；核验来源与 ESLint 兼容取舍见 dependencies-stage-1.md。

## 当前已落地

- docs/：产品、关卡、状态机、事件、AI 契约、验收、验证与演进证据。
- PathLab-AI/contracts/、fixtures/：原有类型/schema/固定四关，未改动定义与地图。
- src/app/{layout,page}.tsx、globals.css、icon.svg：服务端页面入口、中文元数据、系统字体、响应式框架与代码原生图标；无字体 CDN、图片下载或视觉依赖库。
- src/components/PathLabShell.tsx：持有 selectedId 和稳定的每关 LearningSession；工作台只保存 view() 投影，组件不实现搜索；播放定时器在隐藏/切关/卸载时暂停与清理，无存储。
- src/data/missions.ts：同一 JSON 数据源；JSON → LevelDefinition 类型断言的边界由现有 schema/跨字段测试检查，不宣称运行时已验证算法。
- tests/contracts.test.mjs：22 项原有契约检查；只将未使用的测试夹具解构改为显式字段，保持测试语义。
- tests/browser/shell.spec.ts：四视口生产页面检查，含固定格子逐项比对、键盘、溢出、axe、页面网络和存储边界。
- next.config.ts：仅回环地址由脚本绑定，关闭 powered-by，固定 Turbopack 应用根；agentRules=false 避免 dev 自动生成第二份 AGENTS。根 AGENTS 已要求读取安装版本自带文档。
- scripts/Invoke-ProjectNpm.ps1：11 项进程环境保护；PS7 缺失/空字符串严格区分；依赖脚本默认禁止，遥测/浏览器下载关闭。
- scripts/Test-ProjectNpm.ps1：成功、预期失败、缺失/既有/PS7 空字符串与工作目录恢复回归。
- scripts/Export-PromptSnapshot.ps1：真实可见消息提取，排除两种已观测内部摘要标题；不是全量原生导出。

## 阶段 2 新增的独立内核

- src/domain/grid.ts：只读 SearchInput、运行时输入边界、稳定错误码、上右下左四邻域。内核接受 1—25 格尺寸；1/2 格仅供数学边界测试，关卡 schema 仍要求 3—25，未扩大关卡编辑规格。
- src/domain/algorithms/bfs.ts：FIFO 头索引队列；入队即 discovered；首个 parent 保持不变；终点有效选中后结束；每次调用创建全新状态；事件不带时间、ID 或用户数据。
- events.md 固化 BFS 1.0.0 的事件顺序。前沿快照是独立副本；path_updated 的非 final 路径是搜索回溯前缀，不代表机器人实际行走。最终路径与 metrics 不共享终止事件对象。
- 统计从纯算法事件汇总；无路为 path=[] / pathLength=null，起终点相同为 pathLength=0。非法/阻塞端点抛 GridInputError，不能伪装成无路。
- tests/grid、bfs、bfs-missions 与 helpers/search-checks：31 项新测试，加原 22 项共 53 项。独立同步距离松弛 oracle 不使用生产队列；检查 128 种固定端点的 3×3 障碍布局，以及 25×25 上限。
- scripts/inspect-bfs.mjs 与 docs/evidence/stage-2-bfs.json：开发者证据，含八次运行的路径/指标/轨迹哈希/16 个 checkpoint 可用性。分析器不是学习 reducer；不会提交预测或包装真实用户事件。L03 的 BFS 仅作核验。
- Node 原生去类型直接运行 .ts，使用显式扩展名与 allowImportingTsExtensions；tsc 独立检查，noEmit/strict 不变，无新增依赖。Node 22 的最低声明版本本轮未实测。
- BFS 队列搜索本身按边/点处理；完整事件还复制前沿和回溯前缀，日志体积最坏可达平方级。不把带完整轨迹的总成本宣称为严格 O(V+E)，目前只支持至 25×25。

## 页面数据流（阶段 4 已实现）

固定 JSON → 稳定 LearningSession → 私有 BFS/A* 轨迹 → 检查点门控 → 已揭示 LearningView → LearningWorkbench / GridCanvas / EvidenceInspector。
算法选项白名单、候选有效性、单次提交、播放停止与首次统计在领域层强制执行；完整轨迹不进入 React state、DOM 或序列化页面。Canvas 不持有真值，DOM 提供可键盘检查的同源格子/成本/路径与事件。
只读投影包含当前 run/session ID、输入、已揭示事件/前沿/节点/前缀、提交后的反馈、首次记录与已完成运行；终止前不提供 outcome 或最终步数。

## 后续模块（尚未实现）

- 条件实验与新 gridRevision/run；本地证据诊断及复盘报告。
- 版本化本地存储、JSON 导入导出与安全恢复。
- 可选远程反馈与严格校验/回退；不能输出或覆写算法路径。
- 继续复用 Node 内置测试、Playwright 与已安装 Edge，不为目录规划引入状态框架或依赖。

## A* 更新语义（阶段 3 已实现）

二叉堆按 f、h、entrySequence 比较；更小 g 才更新 parent；lazy duplicate 的旧条目弹出时记录 stale_entry 并跳过。有效候选快照仅保留当前最优条目。
邻居上、右、下、左；曼哈顿 h；单位非负步长；终点有效选中即结束。一致启发式下不重开已展开节点；更换启发式须先更新规格与测试。

## 存储与恢复（规划）

学习会话含 schemaVersion、algorithmVersion、gridRevision、map、activeState、cursor、predictions、aggregates 与只读已完成摘要。导入上限建议 1 MiB，先解析与校验再替换；未知版本拒绝，不静默丢数据。损坏数据提示重置/导出原始数据，不执行输入中的代码/HTML。
恢复 running → paused；未提交预测恢复 prediction；编辑草稿丢弃回 briefing；仅恢复已验证地图；不得恢复凭证。

## 下一阶段边界

用户已授权自主连续推进；阶段 3 的 A*/二叉堆已验证。阶段 4 门控学习 UI 已验证，后续按独立里程碑接入条件实验、诊断与报告；仍不接远程 AI。
