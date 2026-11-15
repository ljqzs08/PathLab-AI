# E041：指定正式参赛包的 GitHub 发布与匿名核验（2026-11-15）

## 授权与范围

作者明确要求将新正式参赛文件夹推送至 GitHub `ljqzs08`，并进一步指定 `PathLab-AI-正式参赛文件-20261115`。本轮将这一正式包发布到既有 Public 仓库 `ljqzs08/PathLab-AI`；不上传独立完整归档版或 v3，不改作品和原包，不部署网站、不代交赛事表单、不改仓库权限。

本地原包：`D:\竞赛\delivery\PathLab-AI-正式参赛文件-20261115\提交压缩包\PathLab-AI-正式参赛材料-20261115.zip`。原包131747543字节，SHA256 `64fbca276df0b35e7e8d10d11d426a2627b440c1ba07d1aa8496acf235207d25`。本轮只读重新核对775个ZIP条目、774个清单内容、全CRC、目录原件和包外回执；未重建ZIP。

## 实际发布

- 使用官方GitHub CLI设备登录，认证账号确认为 `ljqzs08`；浏览器最终显示设备已连接。AI没有点击最终OAuth授权按钮，未读取浏览器cookie或系统凭证。
- 临时CLI认证目录限定在本工作区D盘被忽略目录，未把凭证、设备码或工具日志纳入公开Prompt。命令未执行全局Git认证配置。
- 初始远端main为 `102902cc14e70dcbe31a1b4bae53fc4392b13cb2`，本地为 `568eac83771d228168d7a545ac675adae1366c4f`，真实14个提交领先、0个远端独有提交；按原历史fast-forward正常推送至后者。没有force、rebase、amend或squash。
- 新建正式Release：<https://github.com/ljqzs08/PathLab-AI/releases/tag/formal-submission-20261115>。标签固定在正式包源码冻结A `955df39c5db78bf07614486018d6b52b6ea07b69`，653文件/75次历史；后续main收尾不是A内内容，不反写bundle。
- 上传原ZIP、原SHA256侧车和原包外最终回执；没有重新打包。Release已设为latest，旧v2/v3/Prompt Release和标签保留。
- GitHub将中文附件名自动转成 `PathLab-AI-.-20261115.zip` / `default.json` 等。随后仅PATCH新附件的name/label，设为清晰ASCII下载名；远端资产ID、大小和服务端digest不变。具体前后映射见 `docs/evidence/github-formal-asset-names-20261115.json`。本地原文件名/字节均未改。

公开下载名为 `PathLab-AI-formal-submission-20261115.zip`、同名`.sha256`和 `PathLab-AI-formal-verification-20261115.json`。原侧车正文保留原中文ZIP名，用PowerShell `Get-FileHash -Algorithm SHA256`可直接核对英文下载名。

## 本轮只读预检

`docs/evidence/github-formal-local-check-20261115.json`记录原ZIP字节/CRC/清单/回执核对及195个待推送历史blob的凭证模式扫描。最大待推送blob7127303字节；未发现所列token/私钥模式、私密路径或超限blob。此为启发式检查，不宣称绝无隐私风险或等同安全审计。原有作者身份/邮箱、原文中的本地来源路径及作者拍屏按已选证据保留，不宣称完全脱敏。既有无关未跟踪用户文件未纳入提交。

## 匿名下载核验

最终实际结果以 `docs/evidence/github-formal-publication-20261115.json` 为准。本轮于2026-11-15 17:22（Asia/Shanghai）完成无凭证全量下载：Public仓库、main当时HEAD、latest正式Release与冻结A标签均核对；三个附件原字节一致，ZIP 131747543字节 / SHA256 64fbca276df0b35e7e8d10d11d426a2627b440c1ba07d1aa8496acf235207d25，775条目全CRC和774清单内容SHA通过。9项合成工具检查另外通过，不计入产品测试。工具 `scripts/verify-formal-github-publication.py`直接使用无Authorization头、无cookie的Python HTTPS请求，不借助已登录CLI或浏览器会话。

```powershell
$env:TEMP='D:\竞赛\.cache\github-formal-20261115'
$env:TMP=$env:TEMP
$env:PYTHONDONTWRITEBYTECODE='1'
python D:\竞赛\scripts\verify-formal-github-publication.py --expected-main 568eac83771d228168d7a545ac675adae1366c4f
```

该SHA是实际执行时的main；后续main会增加真实发布记录，重跑时应传当时预期HEAD。下载只写D盘工作区缓存，不解压到C盘，不改交付母版。

首轮核验工具错误地为仓库API根端点附加斜杠而收到404，修为无斜杠后通过该端点；第二次因GitHub改写中文资产名而被严格集合断言拒绝，未放宽断言，而是完成明确资产映射/名称修正后重跑。这些是本次核验工具与上传服务的实际处理，不是作品功能Bug或用户学习缺陷，未伪造产品修复。

## Prompt与时序

- 上轮正式包快照 `prompts/sessions/2026-11-15-formal-submission-packet.{md,jsonl}`已补真正末答复：4条，`finalCaptured=true`。
- 上传请求与明确目录分别提取为 `2026-11-15-formal-submission-github` 和 `2026-11-15-formal-submission-github-scope`。分别为2条和5条真实可见消息，原文角色、来源行与文本SHA逐条只读核对；当前最终答复需真实落盘后下一轮补，不写拟稿。
- 内部交接、系统/开发者内容、工具载荷、隐藏推理和登录码均不入公开快照。此上传轮不冒充新的核心功能人类报错过程。

## 严格边界

本轮只做发布、文件/历史/公开可下载性检查，没有重跑Node、Next构建或产品浏览器测试。E040历史的5084项包级核验、109/109离线四模拟宽度专项、28页文档检查和8项工具单测仍保留原日期与执行者，不相加、不伪称本轮新结果。

C01/C02/C03共享开发原文与真实Git演进保留，不称三次独立人类报Bug；U01真实用户纠正边界不变。两段聊天回看不等于实时AI开发协同；真人新手、真机、真实外部模型发送、付费API联调、素材授权/隐私、最新赛事条款与正式赛事提交仍不能由本次发布替代。

后续复用：完整正式包作为Release资产，仓库README提供唯一当前材料下载入口，旧版本留在既有历史/归档中；核对远端下载字节，而不是把上传命令成功等同完成。原先被拒绝的清理目录不重试、不绕过。

## 本轮缓存清理

匿名核验完成后，仅对本轮三份下载副本及其空父目录尝试一次精确原生PowerShell清理，先校验解析绝对路径、父目录和普通文件类型。工具在进程启动前拒绝；3文件 / 132512208字节 / 0张图仍在 `D:\竞赛\.cache\github-formal-20261115\download`，不在交付包内，未重试或换方式绕过。真实回执见 `docs/evidence/github-formal-cleanup-20261115.json`。本轮没有创建检查图；旧被拒目录和正式证据原件均不动。

收尾认证约束：仅在发布记录正常推送并核对后，用官方CLI注销本轮临时本地登录；不擅自撤销GitHub整项应用授权，不声称本地logout等同撤销服务端授权。实际结果以末次操作为准。

提交前的普通diff空白检查在上传请求快照中报告两行尾空白（导出器空元数据行、用户原文Markdown硬换行）。为保留真实原文未删改这两行；其余暂存文件严格通过diff空白检查，该快照继续按源行原文/JSONL文本SHA核对，而非格式化证据。见工具核验回执。
