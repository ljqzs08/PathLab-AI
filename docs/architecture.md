# 架构与目录规划

## 当前仓库事实

Git 根目录为本工作区；应用子目录为 PathLab-AI；无嵌套 Git。
阶段 0 已保留规格、契约和固定 JSON。阶段 1 已建立 Next.js App Router + React + TypeScript 的最小本地应用；不等于已实现教育闭环。
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

## 运行数据流（阶段 1）

固定关卡 JSON → missions 只读类型边界 → 所选关卡 ID → 简报、目标、静态地图投影。
不存在搜索引擎调用、学习状态转移、生成事件、远程路由、localStorage 或模型 SDK。
地图只表达墙/路/S/G，不伪造搜索路径、待处理集合或指标；禁用按钮旁写明后续开放。

## 后续目录（规划，尚未实现）

- src/domain/grid.ts、algorithms/{bfs,astar,priorityQueue}.ts：纯确定性内核。
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
