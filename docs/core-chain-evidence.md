# 核心链与真实纠正索引（E016）

核对日期：2026-10-17。执行者：AI；本页是证据导航，不是补写的对话，也不证明人工或真实设备验收通过。

## 三条已实现的核心链

| 链 | 原始可见 Prompt（同名 JSONL 含来源行号与文本 SHA256） | 实现提交 | 真实验证与问题来源 | 人类引导缺口 |
|---|---|---|---|---|
| C01 算法内核与确定性 | `prompts/sessions/2026-10-17-stage-2-bfs.md`；`2026-10-17-autonomous-iterations.md` | `5c3eec6` BFS；`5ade0e8` A*/堆 | `docs/verification-stage-2-bfs.md`、`verification-stage-3-astar.md`；独立距离 oracle、边界与确定性检查 | 选定记录未找到针对算法缺陷的用户追加修复指引；不捏造 Bug |
| C02 预测、Canvas、回放 | `prompts/sessions/2026-10-17-autonomous-iterations.md` | `572e15d` 私有门控；`fd82d8f` 界面 | `docs/verification-stage-4-learning.md`；`docs/evidence/stage-4-session-red.txt`、`stage-4-schema-validator-failure.txt`；均为 AI 自测 | 没有独立的用户 Bug 引导记录；地图直接选择 E014 是后续真实增强，不改写为过去缺陷 |
| C03 条件实验、证据复盘 | 同一份 `2026-10-17-autonomous-iterations.md`，不伪装成另一轮人类对话 | `3b2e9f3` 领域层；`f4a43ca` 界面 | `docs/verification-stage-5-reflection.md`；`docs/evidence/stage-5-focus-observation.json`、`stage-5-focus-red.txt`；真实焦点问题由 AI 发现并修复 | 没有针对该问题的用户报告；不可把自动测试当成人类验收 |

以上两个核心 Prompt 快照均包含实际最终答复。原始会话与已选快照逐条对照、哈希和提交存在性检查见 `docs/evidence/review-readiness-audit.json`。算法、用户界面、学习诊断有三个模块的事实，不等于三轮各自独立的用户纠错对话。

## 已经发生、可以使用的用户纠正

### U01：完整离线 HTML，而不是网站访问入口

1. 原要求：`prompts/sessions/2026-10-17-local-html-entry.md`。
2. 错误理解及产物：`5e369b5`；真实旧产物检查 `docs/evidence/standalone-before.json`。
3. 用户原文：“我的意思是让你把这个网站制作成HTML文件，不是建一个HTML 的访问入口 ，重新修改”。原文和 AI 可见响应：`prompts/sessions/2026-10-17-standalone-html-correction.md`。
4. 实际修复：`4b11729`，共享现有应用代码构建完整离线 HTML，不是 iframe 或跳转。
5. 修复中真实失败：`docs/evidence/standalone-first-build.txt`、`standalone-browser-initial.json`；后者 180/188。后续修复由 AI 自测引导，不冒充用户另报缺陷。
6. 修复后：`docs/evidence/standalone-browser.json`（188/188）、`standalone-next-browser.json`（176/176）；完整解释 `docs/verification-standalone-html.md`。
7. 结论：这是可追溯的**人类引导交付纠正链**。不将它复制计入三个核心链；最终是否可作为官方要求中的一个核心迭代，待正式条款确认。

### U02：证据进度口径纠正

`prompts/sessions/2026-10-17-evidence-correction-storage.md` 保留了用户对“0/3”的追问。它推动区分功能进度与人类修复证据；不是三条应用 Bug。E016 进一步修正旧矩阵的过期状态。

### U03：截图指出功能状态并要求增加玩法

`prompts/sessions/2026-10-17-free-playground.md` 和 `docs/evidence/playground-user-status.png`；`c51334d` 将自由地图接入并与远程 AI 状态拆开。属于真实用户推动的功能迭代，不虚构为算法错误。最终答复已补齐为 4 条可见消息。

## 后续真实验收怎样形成闭环

用 `docs/review/manual-acceptance.md` 按实际操作记录“预期/实际/复现步骤”，有问题才开修复链。修复时链接原话/原图、失败复现、修改提交和回归；没有发现问题就如实记录通过，不人为制造缺陷。正式参赛前必须取得官方规则原文或链接；现有用户摘录不能被内部更严格清单替代。
