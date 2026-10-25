# C03：改变条件、重新验证与引用证据复盘

性质：编辑导引，不是新聊天。共享 [连续开发轮](../sessions/2026-10-17-autonomous-iterations.md) / [JSONL](../sessions/2026-10-17-autonomous-iterations.jsonl)，完整最终答复已保存；不重复计数成另一轮作者反馈。

## 1. 真实建议与可见修复过程

| 来源行 | 原文中的环节 |
| --- | --- |
| 1926 | 用户授权继续开发、自主优化，是 C01/C02/C03 共同的真实上游 Prompt |
| 2537 | AI 提出“改一次条件，重新预测和运行，再用两次真实结果解释差异” |
| 2839 | AI 说明条件实验/证据报告已接入，并说明修正“应用条件后不能立即重置” |
| 3023 | AI 报告额外检查发现复盘标题焦点落到屏幕外，承诺先补回归再修复 |
| 3271 | 完整最终答复：已修复条件重置与焦点、记录实际验证及剩余持久化等问题 |

## 2. 对应提交和文件

- `3b2e9f3`：`PathLab-AI/src/domain/learning/diagnose.ts`、`report.ts`、`session.ts` 及领域测试。
- `f4a43ca`：`LearningWorkbench.tsx`、`ReflectionPanel.tsx`、报告历史和浏览器回归。
- [阶段完整验证](../../docs/verification-stage-5-reflection.md)；[最终检查日志](../../docs/evidence/stage-5-ui-check.txt)；[124 项最终浏览器报告](../../docs/evidence/stage-5-ui-browser.json)。均为历史 AI 自动化，不是本次整理又跑了一次产品测试。

## 3. 一个真实 Bug 的闭环（发现者明确为 AI）

1. 额外浏览器观察确认完成搜索时焦点标题在屏外：[原始观察 JSON](../../docs/evidence/stage-5-focus-observation.json)。390px 下 top=1728、视口高 844；1440px 下 top 约 1255.67、视口高 1000。
2. 补充回归后出现真实 mobile-390 失败：[失败原日志](../../docs/evidence/stage-5-focus-red.txt) / [失败 JSON](../../docs/evidence/stage-5-focus-red.json)。
3. 修复焦点的 preventScroll 行为，允许原生滚动；四视口回归通过。最终领域测试 92 项、浏览器 124 项；不是用初版 120 项冒充新增场景已经覆盖。
4. 条件后不能立即重置是在测试前由 AI 检查发现，不编造一个从未运行过的“修复前浏览器失败”。

本链真实展示了 AI 自测自修；**不存在该焦点问题的用户报错原话**。作者真实引导修复见 [U01](U01-human-html-correction.md)。后续作者对 AI 复盘的实际方向调整另见 [S02](S02-web-review-iteration.md)，不倒填到本轮。

[返回材料入口](README.md)
