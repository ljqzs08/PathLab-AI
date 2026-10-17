# 阶段 4A 验证：门控学习会话

日期：2026-10-17。执行者：AI。本机 Node 24.19.0、npm 11.17.0、PowerShell 7.6.5 / Windows PowerShell 5.1。此报告仅描述领域模块，不是浏览器或用户验收。

## 实现与验收

- LearningSession 使用 JavaScript 私有字段持有预计算轨迹；React 后续只可读取 view() 副本。尚未揭示的终点路径、事件总数、最终统计和实际选择不在投影中。
- 六种预定关卡/算法组合逐步检查可见算法事件始终是原始确定性轨迹的真前缀。提交前无终止事件或最终 pathLength；提交后才有 actual。
- 初始第 2 次选择前预测，第 4 次前再次停止；不足两个候选则延后，最终无法出现时才记录 skipped。不可达与同端点正常完成，没有假预测/绕过按钮。
- 候选 2–4 个，坐标排序、不带答案标记；不可见候选/非法动作/重复提交/错误时间与 ID 均被拒绝。每逻辑步为一次有效选择+邻居处理；播放不能跨预测点。
- reset 清理活动轨迹，保留完成摘要与首次统计。同地图/算法/预测点再次作答为新的 retryCount，不能重写首次结果。算法白名单与运行中冻结在领域层执行。
- 三层提交前提示仅含规则；所有事件通过原始严格 schema，ID 按追加顺序，时间由调用者提供。测试时间和 ID 明确为合成值，不是人类学习历史。
- 副本隔离、相同动作复现、128 种 3×3 图终止与最终路径一致。

## 实际命令与结果

通过根目录包装器运行 run check；PowerShell 7 与 5.1 均通过 typecheck、ESLint 零告警、83/83 测试。原始输出见 evidence/stage-4-session-check.txt 与 stage-4-session-check-ps51.txt。

先添加测试时模块未实现，73 原测试通过、新文件 ERR_MODULE_NOT_FOUND，见 stage-4-session-red.txt。首次实现后测试脚手架用了默认 Ajv，无法编译 draft2020-12；保留原错误于 stage-4-schema-validator-failure.txt，切换与现有测试相同的 ajv/dist/2020.js 后全部通过。没有编造产品缺陷或用户追问。

## 限制与证据状态

本里程碑未改页面，未重跑 build/browser；上次构建属于阶段 3，28 项浏览器回归属于阶段 2。Canvas/学习 UI、反事实/报告、存储和远程 AI 仍未实现。所有产物在 D 盘工作区，无新包/浏览器/截图下载。既有被拒绝清理的缓存与图片未重试。

Prompt 使用本轮 autonomous-iterations 原始消息快照，finalCaptured=False，最终答复落盘后下一轮补齐。完整用户引导 Bug 链仍 0/3；本地提交不等于 GitHub 已公开或评审可访问。