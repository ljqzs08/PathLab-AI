# E042：GitHub 导航与历史版本标识整理

日期：2026-11-15。执行者：AI。授权：作者明确要求“重新整理并发布内容”，并提供当前仓库根目录截图。

## 范围与验收目标

- 当前正式包保持唯一推荐入口，README 简化为下载 / 当前作品 / 按目的导航。
- 截图中的各目录增加或更新 README，明确当前主件、工程生成物、旧文档与原始证据的区别。
- 原 README 的工程命令与历史功能说明迁入独立指南，不删除真实历史。
- 旧 v2 / v3 Release 标为“历史版本｜非当前参赛版”；Prompt 旧 Release 标为“历史证据附件”。只在原说明前加导航，不重写当时正文。
- 正式 Release 继续 Latest，更新推荐标识及版本导航。原附件 ID、大小、digest、标签对象保持不变。
- About 简介、链接和 topics 同步到当前作品和正式发布入口，不伪称已经部署在线网站。

## 不做什么

不改应用源码或作品 HTML，不重建、重压缩或替换正式 ZIP，不移动原证据目录，不删除旧 Release / 标签 / 提交，不改仓库权限。
不为让截图里的时间显得“更新”而修改无关文件；目录更新时间来自真正增加的用途说明。
不重跑产品回归，不把本轮文档整理或历史数字当作新产品/真人/真机验收。

## 文件与工具

- `README.md`：当前下载、作品说明、实际已有首页截图、根目录用途与真实性。
- `00-正式参赛入口.md`：根目录的单一正式入口。
- `docs/development-guide.md`、`docs/version-history.md`、`archive/README.md`：工程、版本与历史分离。
- `PathLab-AI/README.md`、`docs/README.md`、`output/README.md`、`scripts/README.md` 与既有 Prompt 索引：目录内也不误导。
- `docs/github-navigation.json`：正式包身份、原件哈希及期望公开说明的单一配置。
- `docs/release-notes/`：旧 Release 导航前缀与原正文；正式说明沿用 `docs/formal-submission-release-notes.md`。
- `scripts/verify-github-navigation.py`：本地链接、原件、共享历史、Prompt 原文与可选匿名公开核对；不下载完整旧包。
- `docs/evidence/github-organization-before-20261115.json`：匿名读取的发布前基线。
- `docs/assets/github-organization-20261115/author-repository-before.png`：用户提供截图原件的 D 盘证据副本，不是本轮生成的检查图。

## 对话留证

E041 目录澄清轮真实末答复已补为 6 条 / finalCaptured=true。保留旧版咨询为 2 条 / finalCaptured=true。
本轮原始要求和真实可见进展另存 `prompts/sessions/2026-11-15-github-reorganization.{md,jsonl}`，当前5条已与源文核对，内部交接明确排除；不把上传或导航整理当作新核心功能链。本轮最终答复只能在实际落盘后补齐，不预写完成记录。

提取命令的第一次复合调用在三份导出均已成功后，因 PowerShell 残留的原生 LASTEXITCODE 被错误判断失败；导出器没有失败。后续以 JSONL、源行与文本 SHA 对照为准，不将残留退出码当成 Prompt 内容失败。

## 核验与发布状态

### 已实际发布

导航提交 A：`bd2a63e3a5e65ee2a8a04a6be7ae63fa938d8d99`，正常推送 `origin main:main`，不改写历史。About 简介、正式 Release 主页链接、6个 topics 和四个 Release 标题/正文均已发布；`formal-submission-20261115` 继续 Latest。v2、v3 明确为历史版本，早期 Prompt 为历史证据附件，旧正文在新增指引后保留。没有新建 Release、重传附件、改标签或改权限。

2026-11-15 18:07 +08:00，匿名标准库 HTTP/REST 核对 **311/311通过、0失败**（其中本地236项；此为刷新本轮第5条可见进展前的真实时点，不与之后的检查相加）。33个发布文件逐 Git blob 核对、README 原字节、About/topics、Latest、四个 Release 标题/说明、原附件 ID/大小/digest、四个原标签对象、可见性与默认分支均通过；匿名核对不使用 cookie 或 Authorization。

`docs/evidence/github-navigation-tool-checks-20261115.json` 记录9项合成工具检查通过，范围仅是比较器/行尾归一/附件身份判断，不是产品测试。已登录 Edge 只读刷新根目录页面，观察到新 README 正式下载、当前作品、根目录用途和 About；页面观察不作为匿名访问证明，未保存新检查图。

### 真实失败与修正

1. `docs/evidence/github-navigation-public-20261115-failure-100155.json`：元数据发布成功后的首次匿名复核遇到 HTTP403 配额用尽；已通过236项本地检查，没有断言失败。配额重置为2026-11-15 18:02:44 +08:00，等待后重试，未用认证查询冒充匿名。
2. `docs/evidence/github-navigation-public-20261115-failure-100551.json`：重试已通过272项后，发现本地尚未获取 `prompt-evidence-20261025` 原标签，`git rev-parse` 退出128。这是核验环境前提遗漏，不是发布丢失标签或产品缺陷。
3. 仅从原远程获取缺少的两个既有标签，未创建新远程标签、未强制覆盖、未修改核验断言，随后完整匿名复核通过。失败回执原样保留。

复用命令（仓库根目录；fetch只补本地原标签，已有时不改对象）：

```powershell
git fetch --no-tags origin refs/tags/prompt-evidence-20261025:refs/tags/prompt-evidence-20261025 refs/tags/formal-submission-20261115:refs/tags/formal-submission-20261115
$env:PYTHONDONTWRITEBYTECODE='1'
$env:PYTHONIOENCODING='utf-8'
python -B scripts/verify-github-navigation.py --public --expected-main bd2a63e3a5e65ee2a8a04a6be7ae63fa938d8d99
```

`--expected-main` 须按实际当前 main 替换；发布收尾提交后，用同一模块的只读 `local_checks()` / `public_checks(实际main)` 在内存核对，不反复覆盖已归档回执或制造自引用提交。导航提交A的公开回执保留A时点身份；后续验收/说明/第5条可见进展另作增量提交，不反写冻结源码、bundle或正式包。

以 `docs/evidence/github-navigation-local-20261115.json` 和 `docs/evidence/github-navigation-public-20261115.json` 的实际结果为准。
发布后逐个核对当前提交相关 Git blob、README 原字节、四个 Release 的标题/说明、About、Latest、附件身份与旧标签对象；人类可读 Release 说明允许 API 的 CRLF / 本地 LF 行尾归一，不放宽任何工件字节校验。

本轮不会重新下载 E041 已逐字核验的 131.75 MB 附件，只检查公开 asset ID / 大小 / digest 与发布前一致，且本地原 ZIP SHA 与作品 HTML 不变；不得说成本轮全量匿名下载。
没有新临时检查图或新附件下载缓存；用户原图作为真实证据保留，旧被拒清理目录不触碰。
认证复用既有 Git credential helper，仅在当前进程调用 CLI，凭证不输出、不落到仓库、不创建新 OAuth 授权、不修改账号权限。

## 仍需作者确认的事项

C01 / C02 / C03 共享真实开发原文与 Git 证据保留，U01 真实纠正不变；不冒充三次独立人工报错。
GitHub 导航与 Release 整理不是网站部署或赛事代交；真人学习效果、真机测试、素材授权/隐私、最新赛事条款与正式表单仍分开处理。
