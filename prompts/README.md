# 真实 Prompt 与演进证据导航

本目录保存真实用户/AI 可见文字快照，按原始来源行号、角色、时间和 SHA256 核对。它们是从本机原始会话只读提取的可见消息，**不是工具原生全量导出**；隐藏推理、系统/开发者提示、工具载荷、内部交接、凭证和无关聊天不纳入。缺失附件或中止轮最终答复不假称已经齐备；未发生的用户追问/缺陷不得补写。

## 本地技术文档留证（E023）

- [技术文档要求与可见说明](sessions/2026-10-25-technical-document.md)：真实用户原文，未将内部交接或隐藏内容纳入；用户追加作品介绍时尚无最终答复，不预写。
- [上传完成最终答复补充](sessions/2026-10-25-prompt-upload-completion-final.md)：从原始记录真实补齐 E022 的最后答复，独立补充、不计新核心轮。
- 技术 PDF 与来源验证见 [本轮校验](../docs/verification-technical-report.md)，只本地交付，没有上传。

## E022：已发布的 Prompt 附件（2026-10-25）

[GitHub Release 下载 ZIP 与校验文件](https://github.com/ljqzs08/PathLab-AI/releases/tag/prompt-evidence-20261025)；[上传与匿名核验](../docs/verification-prompt-upload.md)。原文与导引已正常推送，主材料提交为 `ae91aa4`，附件内容锚定 `9ca1ffc`，不倒填包内来源哈希。

- [E021 助手续答与最终答复补充](sessions/2026-10-25-prompt-chain-package-supplement.md)：4 条真实可见助手消息，补齐控制边界后的续答，不伪称独立用户轮、不计入 9 轮/38 条选编。
- [上传授权轮](sessions/2026-10-25-prompt-upload-authorization.md)：3 条原文，保留真实未授权完成/工具安全停止的当时答复。
- [授权后实际上传轮](sessions/2026-10-25-prompt-upload-completion.md)：当前真实原文；最终答复须真实落盘后补齐，不能预写，不作为核心功能新增。
## E021：可直接阅读的 Prompt 选编（2026-10-25）

请先看 [评审材料入口](submission/README.md)。已按 C01/C02/C03 三个核心模块、U01 真实用户 HTML 纠正及 S02 网页复盘方案迭代整理，白名单包含 **9 份完成轮快照、38 条去重原文、10 个历史功能/修复提交**。补提取最早产品方案轮，并恢复其原粘贴附件（不是把最初方案所有愿景宣称已实现）。连续开发原文共享关系明确，不将其重复计为三次独立用户对话。

原文与来源行/哈希/选定轮完整性已核对；包内 Markdown/JSONL 可读、可校验，不是工具原生全量导出或聊天截图。真实作者引导修复见 U01；AI 自测与用户报告分开。`scripts/Export-PromptEvidencePackage.ps1` 可从 D 盘工作区重复生成 ZIP，逐文件校验、不复制凭证/缓存。原整理轮因控制边界而保留 finalCaptured=False；[续答补充](sessions/2026-10-25-prompt-chain-package-supplement.md) 已核对真实最终答复，不改原件，也不放进“完成轮”核心选编。

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
- [本轮继续上传](sessions/2026-10-25-github-final-upload.md)：真实最终答复已于 E021 从原来源补齐，现 6 条、finalCaptured=True；不计作新增核心功能。

## 核对方法与公开范围

JSONL 与 Markdown 同名；JSONL 每条包含来源行号、textSha256、角色和原文。查看文件头 finalCaptured / 末尾“最终答复已捕获”标记，不把 False 当作完整。scripts/Test-CoreEvidence.ps1 需要作者机器既有原始日志来核对，不是公开应用运行前提；评审可先核对已公开 JSONL 哈希、提交文件与实际验证日志。

公开证据保留原用户项目说明、作者既有 Git 身份/邮箱、本机路径和附件来源标识，不伪称完全匿名；本轮未改写原始历史。私有环境文件、缓存、原始全量日志、浏览器会话、临时错误草稿和临时授权文件不提交。本轮材料与历史在推送前进行启发式扫描，实际范围与限制见 ../docs/evidence/publication-history-scan-20261025.json；它不是不存在秘密或漏洞的证明。未来只在真实用户使用中发现问题时按原话/失败复现/修复/回归/提交补证，不故意制造 Bug 或冒充人工验收。


## E024：作品介绍文档 PDF（2026-10-25）

- [作品介绍原始要求与执行说明](sessions/2026-10-25-project-introduction.md)：3 条真实可见消息，最终答复当时尚未落盘。
- [继续与真实收尾快照](sessions/2026-10-25-project-introduction-continue.md)：2 条真实可见消息，`finalCaptured=True`；包含当前用户“继续”和上一条助手可见收尾摘要。它只证明本轮留证已补齐，不是新增核心功能迭代。
- [本地验证记录](../docs/verification-project-introduction.md)：列出截图、PDF 构建、结构/视觉检查与剩余边界。
- 作品介绍材料没有替代 C01/C02/C03 的真实性边界，也没有把 AI 自动化检查写成用户或真机验收。

## E026：材料 GitHub 链接与上轮真实最终答复（2026-10-25）

- [E025 真正最终答复补件](sessions/2026-10-25-submission-organize-completion-final.md)：来源第 491 行，真实收尾，最终答复已捕获；不作为新增核心轮。
- [本轮 GitHub 链接要求与可见说明](sessions/2026-10-25-submission-github-links.md)：3 条真实消息，明确排除内部交接，最终答复待下一轮落盘补齐。
- [本轮实际验证](../docs/verification-submission-github-links.md)：纯本地链接 / 归档更新，不新增 C01/C02/C03 用户 Bug 材料，不改变 9 轮 / 38 条核心选编范围。

## E027：Prompt 历史照片与暂停后继续（2026-10-25）

- [E026 真正最终答复补件](sessions/2026-10-25-submission-github-links-completion-final.md)：原始第 702 行，1 条，final 已捕获，不算核心新增轮。
- [十张照片原要求与当时暂停结果](sessions/2026-10-25-prompt-photos.md)：来源 709 / 714 / 822 行，3 条；明确非连续提取，末条仅是当时暂停，不冒充纳包已完成；内部交接排除。
- [继续与实际执行说明](sessions/2026-10-25-prompt-photos-continue.md)：来源 829 / 832 / 931 行，3 条真实可见消息；本轮末答复仍待落盘，finalCaptured=False，不预写。
- [原始照片与来源边界](../Prompt历史快照/README.md)、[本轮材料验证](../docs/verification-prompt-photos.md)：十图仅为局部历史补充，按原文件名 / 原字节单独纳包，不改冻结 Prompt ZIP 的 9 轮 / 38 条，也不重复计作三条用户 Bug 链。
