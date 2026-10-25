# 评审访问准备与发布边界

2026-10-25：Git 根为本工作区，main 分支；用户已明确授权并创建 Public 仓库 https://github.com/ljqzs08/PathLab-AI ，origin 已绑定。已正常上传材料提交 1c10e32fb1a28bd56b72ac864f5ca648635743a8；无凭证 clone 验证完整 34 次历史、匿名 API private=false/网页200。证据归档随后普通提交/推送，精确访问快照以 ../evidence/github-publication-20261025.json 与 ../verification-github-publication.md 为准；这不是正式参赛提交回执。

## 已准备

- `docs/core-chain-evidence.md`：C01/C02/C03 与实际用户纠正的导航，不捏造完整链。
- `scripts/Build-ReviewPacket.ps1`：从固定白名单生成独立 HTML 体验 ZIP 与完整性清单；不包含原始会话、个人路径、密钥、依赖或 Git 元数据。
- `docs/review/manual-acceptance.md`：真实手机、键盘、屏幕阅读器、干净机器的未填写记录。
- 现有 Git 细粒度历史保留，不用单个打包提交冒充从零开发过程。

## 授权、公开范围与剩余边界

1. 已确认：用户指定 LJQZS08，并要求直接创建/上传；本轮按 Public PathLab-AI 执行。该授权不扩展为购买服务、网站部署、付款或修改账号权限。
2. 确认原始历史可共享范围：作者邮箱存在 Git 历史中；部分 Prompt 含本机路径、作者确认信息与附件路径。`.gitignore` 不会移除已提交内容。仅净化工作区不能消除历史信息，不自动改写历史。
3. 本轮对选定材料与全部待推送历史做启发式凭证/内部摘要检查，结果见 ../evidence/publication-history-scan-20261025.json；私有 env、缓存、临时授权和既有错误草稿不提交。不伪称完整匿名或正式安全审计，不改写历史删除来源。
4. 官方赛道规则已在 2026-10-21 核对，允许 GitHub/Gitee 及公开/授权评审访问；项目仍按已选 GitHub 执行。详见 `../submission-audit-2026-10-21.md`；材料完整性、报名与个人中心最终通知仍须确认，不宣称已合规或已提交。

## 授权后的实际执行顺序

- 先核对 GitHub 登录账号与目标仓库，再创建/绑定仓库；只推明确授权内容，不使用 force。
- 保留历史提交和核心 Prompt 关系；上传体验包不等同上传源码/演进证据。
- 若需要手机网页访问，再确认部署平台和对外访问范围；不自动设置公网隧道或开放防火墙。
- Public 仓库需在未登录环境打开验证；受限仓库需由获授权评审账号确认能访问。只在自己登录时能打开，不足以证明评审可访问。
- 记录精确 URL、被访问提交、时间、访问方式及真实结果。GitHub 源码页面与可交互网站 URL 分开标注；前者不自动成为网站。

## 可复用本地命令

在仓库根目录执行：

```powershell
.\scripts\Build-ReviewPacket.ps1
.\scripts\Test-ReviewPacket.ps1 -Path '.\delivery\实际生成的ZIP文件名.zip'
```

生成物仅位于本工作区 `delivery/`，是保留的交付物，不是废弃缓存；不自动上传。校验只检查完整性，不等于应用验收、安全审计或评审访问验证。
