# 真实 Prompt 与演进证据导航

本目录保存真实用户/AI 可见文字快照，按原始来源行号、角色、时间和 SHA256 核对。它们是从本机原始会话只读提取的可见消息，**不是工具原生全量导出**；隐藏推理、系统/开发者提示、工具载荷、内部交接、凭证和无关聊天不纳入。缺失附件或中止轮最终答复不假称已经齐备；未发生的用户追问/缺陷不得补写。

## 三个已实现核心模块

| 核心链 | 真实 Prompt | AI 实现 / 修复 / 验证 | 关键提交 |
| --- | --- | --- | --- |
| C01 算法与确定性 | [BFS](sessions/2026-10-17-stage-2-bfs.md)；[连续迭代](sessions/2026-10-17-autonomous-iterations.md) | [BFS 验证](../docs/verification-stage-2-bfs.md)、[A* 验证](../docs/verification-stage-3-astar.md) | 5c3eec6、5ade0e8 |
| C02 预测、Canvas、回放 | 同一份[连续迭代](sessions/2026-10-17-autonomous-iterations.md)，不伪装独立用户轮 | [门控验证与真实 AI 自测失败](../docs/verification-stage-4-learning.md) | 572e15d、fd82d8f |
| C03 条件实验、证据复盘 | 同一份[连续迭代](sessions/2026-10-17-autonomous-iterations.md) | [复盘验证与真实焦点修复](../docs/verification-stage-5-reflection.md) | 3b2e9f3、f4a43ca |

11 份选定快照 **45 条真实可见原文**与 9 个历史提交已于 2026-10-25 重新只读核对（publication-core-evidence-20261025.txt）。三条链功能存在，不写“功能 0/3”。AI 自测自修与人类引导严格分开：**不能据此宣称三条完整人工引导修复链都满足赛规**。详细边界见 [核心链索引](../docs/core-chain-evidence.md)。

## 实际发生的人类纠正

- U01：[原 HTML 要求](sessions/2026-10-17-local-html-entry.md) → [用户明确纠正“不是访问入口”及实际修复](sessions/2026-10-17-standalone-html-correction.md) → 5e369b5 / 4b11729 → [失败与修复后检查](../docs/verification-standalone-html.md)。这是完整、真实的交付纠正链；不复制填给三个模块。
- U02：[证据进度口径纠正](sessions/2026-10-17-evidence-correction-storage.md)，不是三条应用 Bug。
- U03：[截图与自由玩法要求](sessions/2026-10-17-free-playground.md) → c51334d → [验证](../docs/verification-playground.md)，是功能迭代而非伪造算法错误。
- [动效与地图预测](sessions/2026-10-17-motion-interaction.md)、[DeepSeek 网页辅助实现](sessions/2026-10-17-web-review-workbench.md)：保留实际功能迭代，不用前置咨询替代实现证据。

## 本轮上传 / 复现过程（不是额外核心功能凑数）

- [官网审计](sessions/2026-10-21-official-submission-audit.md)：最终答复本轮已从真实来源补齐。
- [上传原要求](sessions/2026-10-25-github-publication.md)、[账号与浏览器受限接续](sessions/2026-10-25-github-upload-retry.md)：保留先前未上传的真实结果，不覆写成成功。
- [授权继续创建](sessions/2026-10-25-github-create-reproduce.md)：原轮被用户中止，标准导出在控制事件处停止；真实暂停答复另存于[中止后最终答复补录](sessions/2026-10-25-github-create-interrupted-final.md)，不虚构为开发成功。
- [本轮继续上传](sessions/2026-10-25-github-final-upload.md)：当前过程快照，最后答复尚未落盘，需下一轮从真实来源补齐；不计作新增核心功能。

## 核对方法与公开范围

JSONL 与 Markdown 同名；JSONL 每条包含来源行号、textSha256、角色和原文。查看文件头 finalCaptured / 末尾“最终答复已捕获”标记，不把 False 当作完整。scripts/Test-CoreEvidence.ps1 需要作者机器既有原始日志来核对，不是公开应用运行前提；评审可先核对已公开 JSONL 哈希、提交文件与实际验证日志。

公开证据保留原用户项目说明、作者既有 Git 身份/邮箱、本机路径和附件来源标识，不伪称完全匿名；本轮未改写原始历史。私有环境文件、缓存、原始全量日志、浏览器会话、临时错误草稿和临时授权文件不提交。本轮材料与历史在推送前进行启发式扫描，实际范围与限制见 ../docs/evidence/publication-history-scan-20261025.json；它不是不存在秘密或漏洞的证明。未来只在真实用户使用中发现问题时按原话/失败复现/修复/回归/提交补证，不故意制造 Bug 或冒充人工验收。
