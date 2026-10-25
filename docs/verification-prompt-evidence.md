# E021：真实 Prompt 核心迭代材料选编验证

日期：2026-10-25；执行者：AI。范围仅为真实对话提取、原附件恢复、材料导引与白名单 ZIP；不改变应用代码、地图/算法/评分/存档，也没有重新执行产品功能测试。

后续状态：E022 已完成正常推送与 Release 附件上传，并验证未登录访问；本页末尾“尚未上传”保留 E021 当时事实，不代表现在。实际记录见 [上传核验](verification-prompt-upload.md)。

## 本次产出与真实边界

- 入口 `prompts/submission/README.md`；C01/C02/C03 三模块分别给出真实原话位置、AI 建议/实现、实际问题与验证、历史提交。共享连续开发原件只收一次，不能伪称三次独立用户会话。
- U01 完整两轮：原 HTML 要求、错误入口交付、用户明确纠正、AI 修复、真实失败与通过日志。S02 保留四轮由 API 配置转网页辅助的实际引导；咨询不算成独立已实现模块，需求转向不是捏造的用户 Bug。
- 补提取真实最早 `project-brief` 轮（2 条）及原用户粘贴附件；原附件 SHA256 与 D 盘副本均为 `c309d39c71dfda49f5be5f4550bef6b781c798961cc763c4291a9b6635fa0d85`。方案是历史输入，不能用其中愿景代替完成事实。
- 最终选编 9 个完成轮、38 条去重消息、10 个历史提交；单个可读 Markdown 与同名 JSONL 保留原文、来源行、时间与原文字段 SHA256。不是工具原生全量导出、截图或录屏，不归档隐藏推理/系统规则/工具载荷/内部交接。
- ZIP 不包含当前整理轮未落盘最终答复。上轮 `2026-10-25-github-final-upload` 真实最终答复已补齐，现 6 条、finalCaptured=True。本轮快照实际截止下一个控制/用户边界，不能据此预写自己的最后答复。

## 验证结果

| 检查 | 结果 | 真实证据 |
| --- | --- | --- |
| 原始来源与哈希复核 | 扩展 16 份/61 条均匹配，11 个提交为 HEAD 祖先；14 轮完整可见范围验证通过，另 2 轮原有中止范围不冒称完成 | `evidence/prompt-source-audit-20261025.json` |
| 交付选编范围 | 9 份均是上述完整可见轮；38 条不重复，原始方案附件哈希一致；C01/C02/C03 共享关系明示 | `prompts/submission/chain-map.json`、包内 manifest |
| PowerShell 7 包工具 | 9/9：白名单、生成重开、SHA256、越界输出、篡改、额外条目、路径逃逸、重复条目、重算清单后隐藏 phase 拒绝 | `evidence/prompt-package-tools-ps7-20261025.json` |
| Windows PowerShell 5.1 包工具 | 同上 9/9 | `evidence/prompt-package-tools-ps51-20261025.json` |
| 新导引本地链接 | 6 份导引共 67 个相对链接均存在，原始聊天中的历史链接不改写 | `evidence/prompt-guide-links-20261025.json` |
| 两版原 Prompt 导出工具 | 各 19/19 合成回归，不是参赛人类对话 | `evidence/prompt-export-tools-ps7-20261025.json`、`prompt-export-tools-ps51-20261025.json` |

实际命令（工作目录均为 D 盘根项目）：

```powershell
.\scripts\Test-CoreEvidence.ps1
.\scripts\Test-PromptSnapshot.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\竞赛\scripts\Test-PromptSnapshot.ps1
.\scripts\Test-PromptEvidencePackage.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\竞赛\scripts\Test-PromptEvidencePackage.ps1
.\scripts\Export-PromptEvidencePackage.ps1 -CheckOnly
.\scripts\Export-PromptEvidencePackage.ps1
# 用实际生成的 ZIP 绝对路径调用 -VerifyArchive，不能复制占位符。
```

工具直接从白名单文件的字节写 ZIP（不抽取全日志/浏览器会话），包内 `START-HERE.md` 导航，`manifest.json` 覆盖文件字节 SHA256，`git-history.json` 从真实 Git 获取哈希/原提交时间/变更文件。生成后重开 ZIP，拒绝额外/重复/危险路径、内容篡改和未完成选定轮。只校验自洽性，不构成第三方时间戳或作者鉴定。临时合成损坏包均在独立 D 盘 `.cache` 中生成并按确切文件清理；未触碰历史被拒绝删除项，未生成检查图片。

## 最终交付包与本地提交

- 内容里程碑提交：`9ca1ffcb096bf714ed2bcfcb1aa6da89d9c53ab7`；不重写已有 Git 历史。
- 最终 ZIP：`D:\竞赛\delivery\PathLab-AI-Prompt-evidence-20261025-093233.zip`；同目录 `.zip.sha256` 可独立校验。
- ZIP SHA256：`8f9d5e888574bf50f000aef2a762b20b99fbe76ff0e47709dfe3c9d4d36a542c`。
- 57 个内容文件加 manifest 共 58 个条目；9 轮 / 38 条 / 10 个历史提交。生成后在 PowerShell 7 和 Windows PowerShell 5.1 分别重新打开核验通过，无需解压。
- 重新读取最终 ZIP，6 份导引的 67 个相对链接在包内均存在；禁用路径与常见凭证模式均无匹配。启发式扫描不构成正式安全审计。
- 实际结果：`evidence/prompt-package-archive-20261025.json`、`evidence/prompt-package-scan-20261025.json`。manifest 的 sourceHead 对应上述内容提交；随后归档扫描结果的提交不在本包中，不能倒填为包的来源。
- 本次测试合成包及临时目录已清理；真实交付 ZIP/校验文件保留在 D 盘。没有生成或保留临时检查图片，没有触碰原先未跟踪残留。
## 状态与剩余风险

本地导引/原文选编已经完成；不能保证评审一定接受选定范围，也不能声称三条 C 链各有独立用户报错。真实用户引导过程在 U01；S02 是另一真实产品方向调整，AI 自测不冒充人类。原文中的过期进度/未发布/0/3 原样保留，最新解释集中在新导引。

源码仓库此前已公开，但当前轮新增材料的本地提交与远端上传必须分别验证。本轮使用既有 D 盘临时 GH_CONFIG_DIR 执行官方 `gh auth status`，实际返回未登录；未读取凭证内容，也未借旧授权声称已推送新材料。当前轮最终答复要等真实记录落盘后再留证，既有视频/PDF、真实人工/设备和正式提交回执也不由本包代替。
