# 架构与目录规划

## 当前仓库事实

Git 根目录为本工作区；应用子目录为 PathLab-AI；无嵌套 Git。
阶段 0 已保留规格、契约和固定 JSON；阶段 1 已建立 Next.js App Router + React + TypeScript 最小本地应用。阶段 2（BFS）实现独立纯搜索模块，但不接入页面，不等于已实现教育闭环。
版本精确锁定于 package-lock.json；核验来源与 ESLint 兼容取舍见 dependencies-stage-1.md。

## 当前已落地

- docs/：产品、关卡、状态机、事件、AI 契约、验收、验证与演进证据。
- PathLab-AI/contracts/、fixtures/：原有类型/schema/固定四关，未改动定义与地图。
- src/app/{layout,page}.tsx、globals.css、icon.svg：服务端页面入口、中文元数据、系统字体、响应式框架与代码原生图标；无字体 CDN、图片下载或视觉依赖库。
- src/components/PathLabShell.tsx：客户端仅保存 selectedId，切换简报与 CSS 静态地图；无搜索业务、计时、动画循环或存储。
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

## 页面数据流（维持阶段 1）

固定关卡 JSON → missions 只读类型边界 → 所选关卡 ID → 简报、目标、静态地图投影。
页面不存在搜索引擎调用、学习状态转移、生成事件、远程路由、localStorage 或模型 SDK。独立内核只由测试/开发者核验脚本调用，完整轨迹与答案 JSON 未导入客户端。
地图只表达墙/路/S/G，不伪造搜索路径、待处理集合或指标；禁用按钮旁写明后续开放。

## 后续目录（规划，尚未实现）

- src/domain/algorithms/{astar,priorityQueue}.ts：下一阶段的纯确定性 A*；grid.ts 与 bfs.ts 已落地，不列为未来功能。
- src/domain/{events,levels}.ts：读取/校验规格，生成事件。
- src/domain/learning/{diagnose,report}.ts：本地规则与复盘。
- src/state/：受控状态转移、回放游标与预测门控。
- src/components/：GridCanvas、PredictionPanel、EventTimeline、InspectorPanel、ReflectionReport。
- src/ai/feedbackAdapter.ts 与可选服务端路由：受约束请求、校验、超时、回退。
- src/storage/：版本化 localStorage、JSON 导入导出。
- 后续按实际模块需要再决定是否引入 Vitest；当前契约使用 Node 内置测试，浏览器使用 Playwright + 已安装 Edge。

## 完整数据流与隔离（规划）

冻结输入（levelId、grid、start、goal、algorithm、algorithmVersion）→ 纯算法事件 → 会话编排增加 runId、时间与预测 → 受门控可见投影 → React/Canvas → 本地诊断 → 可选远程解释。
Canvas 不持有业务真值，React 不直接实现搜索，AI 不输出或覆写路径。未来 UI 即便内部预先计算轨迹，也不得在候选检查器、时间线、屏幕阅读器或提示中暴露尚未揭示事件。

## A* 更新语义（冻结，尚未实现）

二叉堆按 f、h、entrySequence 比较；更小 g 才更新 parent；lazy duplicate 的旧条目弹出时记录 stale_entry 并跳过。有效候选快照仅保留当前最优条目。
邻居上、右、下、左；曼哈顿 h；单位非负步长；终点有效选中即结束。一致启发式下不重开已展开节点；更换启发式须先更新规格与测试。

## 存储与恢复（规划）

学习会话含 schemaVersion、algorithmVersion、gridRevision、map、activeState、cursor、predictions、aggregates 与只读已完成摘要。导入上限建议 1 MiB，先解析与校验再替换；未知版本拒绝，不静默丢数据。损坏数据提示重置/导出原始数据，不执行输入中的代码/HTML。
恢复 running → paused；未提交预测恢复 prediction；编辑草稿丢弃回 briefing；仅恢复已验证地图；不得恢复凭证。

## 下一阶段边界

阶段 1 收口后停止。下一阶段先做独立网格/BFS 与确定性、边界检查；图可达性/最短长度/预测点效果仍待算法实测，不从静态地图或 schema 结果推断。
