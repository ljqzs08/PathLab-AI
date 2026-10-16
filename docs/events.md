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
