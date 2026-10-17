# E016：核心链整理与本地评审体验包验证

日期：2026-10-17（Asia/Shanghai）。执行者：AI。没有执行公开发布、真实手机、人工/屏幕阅读器或跨浏览器验收，没有接入远程模型。

## 本轮完成与范围

1. `core-chain-evidence.md` 链接 C01/C02/C03 的真实 Prompt、实现提交、实际失败和回归；U01 完整 HTML 用户纠正单列，不将同一轮 Prompt/纠错复制为三条人类链。
2. 修正当前矩阵仍引用阶段 5 和笼统 0/3 的过期表述；保留各阶段历史报告当时的事实。
3. `review/START-HERE.md`、`review/manual-acceptance.md` 与 `review/access-checklist.md` 提供体验说明、**未填写**人工记录和授权后访问验证流程。
4. 固定白名单生成本地 ZIP，保留完整 HTML、两个说明文件和 manifest；不自动上传，不含原始聊天/Git/依赖。源码、HTML 和算法行为均未更改。

## 真实 Prompt 与源记录

- 原请求：`prompts/sessions/2026-10-17-review-readiness.{md,jsonl}`；3 条真实可见消息。用户主动中止，未产生该轮最终答复，不补写。
- 接续约束：`prompts/sessions/2026-10-17-review-rules-continuation.{md,jsonl}`；当前保存 1 条用户原文，最终答复尚未落盘，待下一轮补齐。用户提供的 AGENTS 约束是用户消息，不包含系统/开发者提示或内部摘要。
- 上一咨询 `remote-ai-advice` 已补齐为 2 条、finalCaptured=True；早先 `remote-ai-interrupted` 只有用户问题，中止且无最终答复。
- E015 `free-playground` 已补齐为 4 条、finalCaptured=True；历史 E015 提交审计不回写当时计数。
- 两版 PowerShell 的源记录审计都通过：11 份快照、44 条原文/角色/阶段/来源行/文本 SHA256 对照，8 份含真实最终答复；9 个实现/纠正提交存在且属于当前历史。只是选定可见消息核对，不是工具原生完整导出，未将隐藏内容归档。

复用命令（仓库根目录）：

```powershell
.\scripts\Test-CoreEvidence.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-CoreEvidence.ps1
.\scripts\Test-ReviewPacketTools.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-ReviewPacketTools.ps1
.\scripts\Build-ReviewPacket.ps1
.\scripts\Test-ReviewPacket.ps1 -Path '.\delivery\PathLab-review-20261017-153048-9ccbd0.zip'
```

## 体验包与工具验证

- 产物：`delivery/PathLab-review-20261017-153048-9ccbd0.zip`，109741 bytes。
- ZIP SHA256：`129fc4835a08c0dcd4d6a67c893ccbe4e915396bdf6d48ed97b88dc9b2e88f90`。
- 包内 HTML SHA256：`5e5f14e830e51324b5a6fa5e2b3a90c24ab486d64cb367db0919a17c2f8cd437`，与 E015 已验证产物相同。
- 工具合成回归：PowerShell 7.6.5 和 Windows PowerShell 5.1 各 **11/11**；包括正常生成、只读校验、工作区输出边界、错误预期 hash、篡改内容、额外/缺失/重复/路径穿越条目、无效 JSON。非人类体验记录。
- 原文证据：`evidence/review-packet.json`、`review-packet-tests-ps7.json`、`review-packet-tests-ps51.json`、`review-readiness-audit.json`、`review-readiness-audit-ps51.json`。
- 对包内白名单来源检查了本机用户目录、已知作者邮箱、常见 API/平台 token 和私钥头的模式，未匹配；这是有限模式检查，不是全面隐私/安全认证。公开原始 Git 历史仍需单独授权及隐私复核。

## 解压后的实际浏览器检查

本轮实际测试的是 ZIP 解压副本，不是仅检查源 HTML 的存在或截图。复用既有 `tests/standalone/offline.spec.ts` 和 `tests/browser/playground.spec.ts`，四视口 1440/390/320/768，离线 Edge，共 **32/32**；失败、跳过、不稳定均为 0。包括离线无外联、移动单文件后完整 A* 学习、存储拒绝时可预测/备份，以及地图编辑/端点/撤销/真实指标/不可达/回放/存档隔离。

实际命令为根目录 `node PathLab-AI/node_modules/@playwright/test/cli.js test --config .cache/review-packet-check/playwright.config.ts`；设置 TEMP/TMP 至本工作区 `.cache/tmp`、PLAYWRIGHT_BROWSERS_PATH 至 `.cache/browsers`。解压目录的包类型声明为 module，复用配置将测试 URL 改为解压后的 file URL；实际配置备份 `evidence/review-packet-browser-config.txt`。原日志/JSON 为 `evidence/review-packet-browser.txt` / `.json`。

首次临时配置位于没有 type=module 的目录，导入原 ESM 配置报 `Cannot use import.meta outside a module`，当时没有任何应用测试被执行。保留 `evidence/review-packet-browser-config-failure.txt`；给临时目录明确 ESM 并改用 import.meta URL 后实际通过。不是应用 Bug，更不是用户引导修复。

没有重新执行类型/lint、108 Node 或完整 224/212 回归，因为本轮未改应用源码/HTML；引用这些数值时均明确为 E015 历史结果。本轮 32 项不替代真机、跨浏览器、FPS 或人工无障碍验收。

## 清理与剩余边界

- 两版工具测试各自创建的合成 ZIP/测试目录已由测试脚本在检查绝对路径后删除。没有新增检查截图。
- 清理解压浏览器临时目录 `.cache/review-packet-check` 的命令被工具策略拒绝，未绕过；该目录仍在 D 盘且被 Git 忽略。正式 ZIP 是交付物，保留。既有被拒清理内容和旧错误 Prompt 草稿未重试/未夹带提交。
- 本轮无 remote；不创建/推送仓库、不改 Public 或访问权限、不打开公网隧道。需要明确发布授权，且之后才能实际验证评审访问。
- 人工模板全部待测；必须有人使用真实设备，发现问题后才能形成新的真实用户修复链。未独立取得官方条款，不能保证参赛材料合规或结果。

## Git 收尾

实现/材料提交：`c15d4a02757825ff96bc41e247756c1d92e29940`（35 个文件，显式暂存且范围一致）；复核见 `evidence/review-readiness-commit-audit.json`。应用源码/HTML 没有变更，既有未跟踪文件未夹带。限定代码/说明文档 diff-check 通过；全量检查保留了原始快照中的行末空格/空行及实际临时配置末尾空行，没有为消警告篡改证据。当前最终答复仍待下一轮从真实来源提取。
