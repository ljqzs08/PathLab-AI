# 架构与目录规划

## 当前仓库事实

Git 根目录为当前仓库；应用子目录为 PathLab-AI；无嵌套 Git。本轮之前无应用项目或既有前端栈。
阶段 0 只安装开发期 TypeScript 与 Ajv：类型检查和 JSON Schema 2020-12 校验。使用 Node 内置测试执行器，不提前安装 Next/React/Canvas/AI SDK。
版本以 package-lock.json 为准：TypeScript 5.9.3（固定版本，不追逐主版本）、Ajv 8.20.0。不是运行时 UI 依赖。

## 当前已落地

- docs/：产品、关卡、状态机、事件、AI 契约、验收与证据索引。
- PathLab-AI/contracts/：TypeScript 类型、关卡/事件/AI 请求与响应 schema。
- PathLab-AI/fixtures/：固定关卡、转移表、明确标注的合成反馈夹具。
- PathLab-AI/scripts/contract-checks.mjs：规格跨字段校验，不是应用 reducer/算法引擎。
- PathLab-AI/tests/：规格正反例测试，不冒充端到端测试。
- scripts/Invoke-ProjectNpm.ps1：将 npm 缓存和 TEMP/TMP 置于仓库 .cache，仅修改子进程环境；默认禁止安装脚本。
- prompts/sessions/：真实会话可见文字提取；fixtures 与 Prompt 证据严格分开。

## 后续目录（规划，尚未实现）

PathLab-AI/src/app/：Next.js 页面与可选服务端反馈路由。
src/domain/grid.ts、algorithms/{bfs,astar,priorityQueue}.ts：纯确定性内核。
src/domain/{events,levels}.ts：读取/校验规格，生成事件。
src/domain/learning/{diagnose,report}.ts：本地规则与复盘。
src/state/：受控状态转移、回放游标与预测门控。
src/components/：PathLabShell、GridCanvas、PredictionPanel、EventTimeline、InspectorPanel、ReflectionReport。
src/ai/feedbackAdapter.ts：受约束请求、校验、超时、回退。
src/storage/：版本化 localStorage、JSON 导入导出。
tests/：之后引入 Vitest 算法/规则测试，浏览器工具验证完整流程。

## 数据流与隔离

冻结输入（levelId、grid、start、goal、algorithm、algorithmVersion）→ 纯算法事件 → 会话编排增加 runId、时间与预测 → 受门控可见投影 → React/Canvas → 本地诊断 → 可选远程解释。
Canvas 不持有业务真值，React 不直接实现搜索，AI 不输出或覆写路径。未来 UI 即便内部预先计算轨迹，也不得在候选检查器、时间线、屏幕阅读器或提示中暴露尚未揭示事件。

## A* 更新语义（冻结）

使用二叉堆，按 f、h、entrySequence 比较。发现更小 g 才更新 parent；允许 lazy duplicate，改进 g 时分配新的入堆序号，旧条目弹出时记录 stale_entry 并跳过。有效候选快照仅保留当前最优条目。
邻居顺序上、右、下、左；曼哈顿 h；单位非负步长；终点有效选中即结束。当前一致启发式下不重开已展开节点；若未来更换启发式须先更新规格与测试。

## 存储与恢复（规划）

学习会话含 schemaVersion、algorithmVersion、gridRevision、map、activeState、cursor、predictions、aggregates 与只读已完成摘要。导入上限建议 1 MiB，先解析与校验再替换；未知版本明确拒绝，不静默丢数据。损坏数据提示重置/导出原始数据，不执行输入中的代码/HTML。
恢复 running → paused；未提交预测恢复 prediction；编辑草稿丢弃回 briefing；仅保存并恢复已验证地图。不得从 localStorage 恢复凭证。

## 下一阶段

用户确认阶段 0 后建立最小 Next.js + React + TypeScript 可运行壳；安装前核实兼容性/锁定版本并按实际构建需求显式审查安装脚本。不得将本阶段禁止脚本配置盲目沿用于依赖原生安装钩子的未来工具。
