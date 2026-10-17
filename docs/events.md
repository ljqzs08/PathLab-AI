# 事件结构与确定性 v1

机器契约：PathLab-AI/contracts/event.schema.json 与 contracts/types.ts。每个 envelope 含 schemaVersion=1、eventId、sessionId、runId、levelId、gridRevision、algorithm、algorithmVersion=1.0.0、step、type、payload、createdAt。

## 两层事件

- 纯算法轨迹：仅有 step、type、payload。step 从 0 递增，无时间、随机值、会话 ID。相同冻结输入须产生完全相同的这段轨迹及结果。
- 会话 envelope：编排层增加 ID、时间和用户事件。eventId 采用 runId:appendOrdinal，appendOrdinal 严格递增，与算法 step 区分。用户操作事件的 step 指向当前算法步，可重复；这些事件不参与“相同算法输入轨迹一致”的断言。
- 只比较算法事件的确定性投影，不能把用户耗时、预测、AI 反馈和 createdAt 一并宣称为确定性。
- createdAt 由包装层提供 UTC ISO 字符串，仅用于显示/排序辅助；真正回放依赖保存的追加顺序，不按墙钟时间重排。

## 类型与载荷

| 类型 | 最小载荷 / 规则 |
|---|---|
| mission_started | gridRevision |
| prediction_requested | checkpointId、候选节点及推理所需数值；严禁 actual 答案字段 |
| prediction_submitted | 选择、实际、候选、correct、hintLevel、耗时区间、retryCount；提交后才产生 |
| node_discovered | node、parent（起点 null）、g/h/f、entrySequence；首次发现 |
| node_relaxed | 更小 g、previousG、parent、h/f、新 entrySequence；只更新不增加 discoveredCount |
| node_selected | 有效节点、g/h/f、entrySequence；过期堆条目不能算选中 |
| node_expanded | 实际检查邻居的 node；终点只选中不展开 |
| node_skipped | node、原因；越界邻居允许有负坐标；其余节点坐标仍非负 |
| frontier_snapshot | 按 FIFO 或 f/h/sequence 输出的有效候选，不含 A* 过期条目 |
| path_updated | parent 回溯的当前前缀路径或最终路径，final 明确区分 |
| run_paused / run_resumed | 原因 / 速度（0.5、1、2、4） |
| run_finished | found/unreachable、path、统计；无路 path=[]、pathLength=null |
| counterfactual_applied | previousRunId、前后 gridRevision、合法条件变更 |
| diagnosis_generated | feedbackId、local/remote、引用的事件 ID |
| reflection_completed | 证据 ID 与本地解释文字 |

BFS 数值统一为 g=distanceFromStart、h=0、f=g；A* 的 g 是已走步数、h 曼哈顿、f=g+h。渲染不将 BFS 的 h=0 错称为真实终点距离。

## 后续运行时必须验证（不靠 JSON Schema 假装已验证）

ID 唯一且引用同一会话/相关旧运行；g+h=f；prediction correct 与实际节点一致；实际/选择均属于候选；path 相邻且可通行；统计由事件汇总而非 UI 随意累加；gridRevision 单调；时间字符串对应有效日期。
A* 更小 g 更新须有单独 node_relaxed 事件（见 schema），携带旧 g、新 g、parent 和新入堆序号；不能重复把已发现节点记作新发现。所有比较与更新最终由独立算法测试核对。

schemaVersion 与 algorithmVersion 独立演进；旧导入版本不兼容时明确拒绝或使用有测试的迁移，不偷偷按新规则重放。


## BFS 1.0.0 的具体顺序（阶段 2 已实现）

1. 起点 node_discovered（g=0、h=0、f=0、parent=null、entrySequence=0），再输出包含起点的 frontier_snapshot。
2. FIFO 出队一个节点，node_selected 后立即输出出队后的 frontier_snapshot。预测候选只能取该 node_selected 之前最后一个快照，不能取出队后的快照。
3. 若节点为终点，直接输出 final=true 的 path_updated 与 run_finished，不输出 node_expanded，不检查终点邻居。
4. 非终点依次输出 final=false 的回溯前缀 path_updated、node_expanded，再按上右下左逐一输出 node_discovered 或 node_skipped。
5. 邻居拒绝顺序为越界 → 障碍 → 已发现；入队即标记已发现，首次 parent 不再改变。每个已扩展节点恰有四个邻居处理事件。扩展结束再输出 frontier_snapshot。
6. 队列耗尽仍未选中终点时，输出 final=true / nodes=[] 的 path_updated，再输出 unreachable 的 run_finished；pathLength=null。
7. step 从 0 无空洞递增；entrySequence 从 0 按首次发现顺序递增。BFS 不发 node_relaxed/not_better/stale_entry 或会话/预测事件。
8. discovered/selected/expanded 计数与 frontierPeak 由事件汇总。快照、回溯、最终路径和终止事件为独立数据副本；同一输入重复运行路径、全部事件与统计深度相等。

以上顺序由固定 15 事件的 2×1 测试锁定，并以四关八次运行共 2,532 个实际算法事件逐项通过原 envelope schema（测试包装使用明确标注的合成 ID/时间，不冒充学习会话）。若未来改变纯算法发事件的顺序或含义，须同时处理 algorithmVersion 与对应测试/导入兼容性。

## A* 1.0.0 的具体顺序（阶段 3 已实现）

1. 初始发现/快照、有效选中后的快照、路径前缀、扩展/四邻居、扩展后快照、终止，与 BFS 的位置一致；数值为 g / Manhattan h / f=g+h。
2. 真正的二叉最小堆按 f、h、entrySequence 依次比较；每次首次发现或更小 g 更新都取得新序号。邻居上右下左；相等 g 保留原 parent。
3. 更小 g 替换 parent 与有效 open 记录，输出 node_relaxed（含 previousG），不重复 discovered。原堆项惰性保留，弹出时输出 stale_entry，不能变成 node_selected。
4. 快照由有效 open 唯一节点生成并按 f/h/sequence 排序，不含过期堆项。排序只用于证据快照；堆选择不全量排序。frontierPeak 依有效快照汇总。
5. 越界 → 障碍 → 已关闭或 g 不更优，依次拒绝；后者为 not_better。一致 Manhattan 下不重开已展开节点；不接受自定义启发式或权重。
6. 终点有效选中即结束，不扩展终点；过期堆项不增加 selectionCount/expandedCount/discoveredCount。不可达与同端点语义保持不变。
7. 固定 tiny 15 事件、真实更小 g/过期项地图、独立数组优先级回放、16,384 种 4×4 障碍最短距离共同核验；四关两算法共 3,651 事件通过原 schema。

完整日志包含有效前沿排序及回溯副本，因此不把整次带证据运行的总成本宣称为单纯堆搜索复杂度。
