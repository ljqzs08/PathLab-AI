# 学习状态机 v1（规格 + 阶段 5B 本地学习闭环）

机器转移表：PathLab-AI/fixtures/state-machine.json。默认拒绝未列出的 state/action 组合，不吞掉非法操作；reset_task 是明确列出的统一例外。

| 状态 | 主动作 | 次动作 / 键盘 | 守卫与效果 |
|---|---|---|---|
| idle | 选择关卡 | Tab 导航，Enter 确认 | 进入 briefing，不自动运行 |
| briefing | 开始预测 | 编辑地图；重置 | 验证输入，冻结 run 输入，进入 prediction |
| editing | 保存 | 取消；Esc | 仅合法且有变化才能保存；取消不改地图；返回 briefing |
| prediction | 提交选择 | 请求分层提示；候选按钮可键盘选取 | 必须选择可见候选且未重复提交；提交后进入 paused、揭示一个实际选择 |
| paused | 播放 | 单步；重置 | Space 播放，右箭头单步；不得跨越下一个预测点 |
| running | 暂停 | Space 暂停；重置 | 到预测点立即 prediction；到结束 reflection；禁止地图修改 |
| reflection | 条件实验 | 填写证据解释后生成报告 | 只有事实已揭示才能诊断；不可达也是有效结果 |
| counterfactual | 应用条件 | 取消；Esc | 新地图验证通过、不同于旧地图后进入 briefing，必须重新预测/运行 |
| report | 下一个任务 | 再做实验 | 默认关卡成功还要求一次反事实；未满足只生成“未完成复盘”，不盖完成标记 |

## 非线性转移与守卫

1. prediction 的 no_checkpoint_available 仅可由引擎检查后发出（起终点相同、不可达或候选不足），不是用户绕过按钮。
2. paused 的 step 消耗一个“有效节点选择及其邻居处理”逻辑批次，而非一个动画帧；若预测点将至先进入 prediction，不揭示该批次。
3. start_valid_run 初始化后只展示首个预测点之前的事实，绝不能把预计算的终点路径给时间线/DOM。候选按展示坐标排列，不加“下一节点”标记；队列/优先级数值作为学习证据可以查看。
4. editing/save_valid_map 用于简报阶段修改；若当前地图派生自已完成运行，仍须记录 counterfactual_applied。无先前运行则不伪造 previousRunId。
5. counterfactual 取消固定回 reflection（即使从 report 打开），保留原报告快照；不会自动新建运行。
6. prediction 提交是单次确认；显示结果后重试必须创建新的 attempt，不能覆盖首次结果、增加首次正确率。
7. reset_task 从除 idle 外的状态回 briefing。清理当前活动轨迹，不删除历史学习摘要与原始参赛证据。

## 恢复与无障碍

running 恢复为 paused，避免后台自动推进；prediction 保持未提交；editing 丢弃未保存草稿回 briefing；counterfactual 回 reflection；非法版本/状态先提示，再按用户选择回 briefing，不自动覆盖存档。
所有操作提供文字按钮、可见焦点和禁用原因；Space/箭头快捷键仅作用于聚焦的回放控件，不拦截文本输入；关键反馈 aria-live=polite。
Canvas 有同等 DOM 候选、节点详情与事件列表。390px 模式不依赖悬停；底部控制避开 safe-area；降低动态效果不改变逻辑步数。

阶段 0 检查：转移表引用合法、state/action 唯一、运行中无编辑入口、预测不直接跳报告、恢复不自动播放。运行态 reducer 与浏览器交互仍待后续实现。

## 阶段 4A 历史已实现边界（后续进展见下文）

src/domain/learning/session.ts 持有私有预计算轨迹；view() 只返回已揭示事件、候选与由这些事实推导的统计副本。已实现 briefing、prediction、paused、running、reflection 的学习主线及 reset_task；editing、counterfactual、report 和恢复仍是后续规格，不宣称完整转移表均已实现。

start_valid_run 在内部先消耗初始化及首个真实预测前的批次；候选不足则延后，运行结束后才登记跳过点。没有用户可触发的 no_checkpoint_available/finish/checkpoint_due 绕过入口。每个 step/tick 恰好揭示一个有效选中及邻居处理批次，并在下一预测前停止。速度仅由 UI 定时器决定，不改逻辑步数。

最多取有效前沿的前四个候选，再按 y/x 坐标展示；不把内部下一选择另附到 view、aria 或请求事件。提交只接受可见候选且仅一次；提交后才记录 actual、揭示一个批次。提示 1–3 仅讲规则，没有提前答案；第四层解释限揭示后。reset 后同算法/地图修订/预测点再次作答记 retryCount，首次统计永不覆盖。已完成摘要只读保留。

83 项 Node 测试包含全部六种关卡/算法组合、128 种小图、事件 schema、可见轨迹前缀、非法动作无副作用、重复提交、播放门控、单步与首次率保护。UI/Canvas 尚未接入，不把这些领域测试当浏览器验收。

## 阶段 5A 已实现边界

reflection/report → experiment → counterfactual；cancel 固定回 reflection 并保留报告；应用合法单一条件 → briefing → 显式 start → 新 run，必须重新预测。变更事件只在新 run 建立后追加，引用旧已完成 run，旧摘要不被污染。条件实验冻结算法，保证同算法单因素比较。

已实现 complete_reflection → report；缺条件运行/证据解释只产生部分记录，不盖掌握证明。引用必须属于当前已揭示事实；自由解释不进入反馈事实摘要。reset 恢复原 fixture 与 revision=0，保留首次统计、摘要与报告历史；相同地图复用修订身份，重复实验仍为重试。editing/存储恢复未实现。阶段 5B 已接通条件/报告 UI，取消支持 Escape；改完尚未启动可直接 reset，报告在同页会话内保留并可在 reset 后通过报告历史查阅。进入复盘、条件实验或报告时标题接收键盘焦点，原生聚焦滚动保证当前标题可见；不拦截自由文本输入。
