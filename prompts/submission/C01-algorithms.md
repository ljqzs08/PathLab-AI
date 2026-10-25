# C01：算法内核与确定性

性质：2026-10-25 编辑的证据导引；**不是新的用户/AI 对话**。完整原文不裁成虚构多轮。

## 1. 真实提问与 AI 建议

- 起始产品需求与算法/学习闭环背景：[产品方案轮](../sessions/2026-10-17-project-brief.md)（来源行 9、254；粘贴附件见入口）。规划中的功能不等于当时已经实现。
- [BFS 独立轮原文](../sessions/2026-10-17-stage-2-bfs.md) / [JSONL](../sessions/2026-10-17-stage-2-bfs.jsonl)，共 6 条，最终答复已捕获。来源行 1523 用户原话：“专家，请继续完成并丰富内容优化”。
- 来源行 1526、1594：AI 说明先实现确定性网格 / BFS、输入边界与四关验证，不提前声称 Canvas 或远程 AI 已完成；1695、1809 是实测解释与验证；1919 为真实最终答复。
- [连续开发轮完整原文](../sessions/2026-10-17-autonomous-iterations.md) / [JSONL](../sessions/2026-10-17-autonomous-iterations.jsonl)，共 9 条。来源行 1926 用户授权持续优化，1929 为 A* 与优先队列建议，2054 为边界修正检查说明，3271 为该连续轮的完整最终答复。

## 2. 实际实现与提交

| Git 提交 | 实现文件（节选，完整清单由包内 git-history.json 读取） | 验证 |
| --- | --- | --- |
| `5c3eec6` | `PathLab-AI/src/domain/grid.ts`、`algorithms/bfs.ts`；网格/BFS/四关与独立 oracle 测试 | [BFS 阶段验证](../../docs/verification-stage-2-bfs.md)；[PS7 原始检查](../../docs/evidence/stage-2-check-ps7.txt) |
| `5ade0e8` | `PathLab-AI/src/domain/algorithms/astar.ts`、`priorityQueue.ts`；A*/堆/对照测试 | [A* 验证](../../docs/verification-stage-3-astar.md)；[检查](../../docs/evidence/stage-3-check-ps7.txt)、[机器对照](../../docs/evidence/stage-3-comparison.json) |

## 3. 实际问题、处理与验证边界

- 新能力未实现时新增测试因缺失模块失败，是先立验收的红态，不是用户报告的线上 Bug。
- A* 针对更小 g 更新 parent 与过期堆项跳过建立了真实边界地图检查；BFS / A* 最短步数与独立检查一致。历史实际结果为 BFS 53 项、A* 阶段 73 项 Node 测试，两版 PowerShell 检查通过，详见上述原日志。
- **没有在该轮找到用户针对算法缺陷的追加报告**。用户持续优化授权不是一个具体缺陷报告，不能替代 U01 中真实存在的用户纠正。
- 上述测试由 AI 执行；不是作者人工操作、真实手机或最终评审验收。2026-10-25 本次整理只复核证据，未把历史测试重命名为今日重跑。

[返回材料入口](README.md) · [下一项 C02](C02-prediction-replay.md)
