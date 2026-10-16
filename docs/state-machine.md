# 学习状态机 v1（规格，非已实现 reducer）

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
