# E022：Prompt 材料 GitHub 上传与匿名核验

日期：2026-10-25；执行者：AI。用户先要求“在github上传”，随后通过真实响应批注确认“已授权”。只上传已审查材料与真实发布核验，不修改应用，不更改账号/仓库可见性，不代替正式参赛提交。

## 上传结果

- 官方 GitHub CLI 设备授权完成后现场确认账号 `ljqzs08`、既有仓库 `ljqzs08/PathLab-AI` 的 push 权限与 `private=false`。临时凭证仅保存在受当前用户/SYSTEM ACL 限制、被 Git 忽略的 D 盘目录，不读出/打印 token，不归档一次性验证码。
- `git fetch --no-tags origin main` 确认没有分叉，然后正常执行 `git push origin main:main`，退出码 0：`4fa3f0d..ae91aa4`。未 squash/amend/rebase/force-push，两个已有内容提交 `9ca1ffc`、`ae91aa4` 均原样保留。
- 主材料 HEAD：`ae91aa4abbf022bb26279f5486fb95f567745873`。这是主材料发布快照；后续收尾归档提交不自写自身哈希，也不能倒填为这次快照。
- ZIP 与校验文件发布到 [prompt-evidence-20261025](https://github.com/ljqzs08/PathLab-AI/releases/tag/prompt-evidence-20261025)，不是用 Git 二进制文件污染源码历史。Release 的来源提交为 `9ca1ffcb096bf714ed2bcfcb1aa6da89d9c53ab7`，与原包 manifest 的 sourceHead 一致。

## 实际验证

| 检查 | 本轮结果 | 证据 |
| --- | --- | --- |
| 远端 main | 正常推送后为 ae91aa4 | git push / ls-remote 实际输出 |
| 未登录仓库 | API private=false；Git fetch 显式清空 credential.helper/http.extraHeader、禁止交互 | evidence/prompt-github-publication-20261025.json |
| 完整演进 | 主材料 37 个历史哈希逐个等于本地 | 同上 |
| 关键文件 | 25 个原文/导引/附件/报告的 Git blob 一致 | 同上 |
| ZIP | 241976 字节；匿名重新下载，SHA256 与本地及 GitHub digest 均相同 | evidence/prompt-release-assets-20261025.json |
| 校验文件 | 113 字节；匿名重新下载，SHA256 与本地及 GitHub digest 均相同 | 同上 |
| 本轮对话与文档 | 三份快照的 10 条真实原文角色/phase/文本/哈希相符；7 份文档的 44 个本地链接均有效 | evidence/prompt-upload-source-audit-20261025.json |

ZIP SHA256：`8f9d5e888574bf50f000aef2a762b20b99fbe76ff0e47709dfe3c9d4d36a542c`。网络下载只在内存核对，不保存至 C 盘。包内仍是 E021 已验证的 9 轮/38 条/10 个历史功能提交；本轮不会用上传记录扩充核心功能数量。

## 真实对话与范围

- `prompts/sessions/2026-10-25-prompt-upload-authorization.{md,jsonl}`：完整 3 条，包含真正发生的授权未完成与电脑工具安全停止，不把中止改写为成功。
- `prompts/sessions/2026-10-25-prompt-chain-package-supplement.{md,jsonl}`：从只读原始会话补提取 4 条可见助手续答，含 E021 最终答复。原提取器的控制边界与原件不变；补充不是新增用户轮，也不是工具原生全量导出。
- `prompts/sessions/2026-10-25-prompt-upload-completion.{md,jsonl}`：本轮授权确认与可见执行说明。最终答复在真实落盘后再补，不预写，不收进已完成核心轮 ZIP。
- 不公开隐藏推理、系统/开发者内容、内部交接/控制消息、工具载荷、凭证或无关聊天。保留真实可见原文里的历史路径/进度；发布证据不冒充第三方作者鉴定、人工/设备验收或评审认可。

## 收尾边界

C01 算法、C02 预测/回放、C03 学习复盘的实现与共享来源保持原样；真实用户引导修复为 U01，S02 是实际方案调整。此轮没有修改网站源码或重跑网站功能检查。未夹带既有 HTML stat 假脏和五个未跟踪残留。没有生成检查图片或新增磁盘下载缓存；真实 ZIP、校验文件与发布证据保留在 D 盘。最后归档正常提交/推送，临时登录按既有流程在验证后退出，最终结果以实际执行为准。
