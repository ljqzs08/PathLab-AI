# E020：GitHub 发布、演进材料与源码复现验证

日期：2026-10-25。执行者：AI。仓库 https://github.com/ljqzs08/PathLab-AI ，本文件不是人工/真机验收或正式竞赛提交回执。实际推送与未登录访问结果见 [发布证据](evidence/github-publication-20261025.json)。

## 输入、授权与实际范围

用户指定 LJQZS08 并要求创建、完成 GitHub 上传以及 2.1/2.2 材料。按 Public PathLab-AI 执行，保留既有细粒度历史；不重做 initial commit、不 squash/amend/rebase/force-push。Git 根为 D:\竞赛，应用在 PathLab-AI/。所有本轮写入、依赖、下载和临时授权仅在该 D 盘工作区；C 盘既有会话仅只读。

本轮在官方设备授权后实际核对账号 ljqzs08。临时授权只在 D 盘被忽略、限当前用户与 SYSTEM 访问的目录中使用；不读取或打印凭证、不提取浏览器会话、不读取私有 .env.local。公开历史保留原作者邮箱、项目路径和附件来源，未假称匿名。

## 真实演进与 Prompt

- 原基线 44b4ef24f39158c50229e96dd7ef048922dc1025 共 32 个提交；初始 30523e1622322bd44592b87f3c550cb8a88ef279 只有 8 个规则/Prompt/工具文件，无完整应用。
- 本轮实际功能修复 6455c846fb543f537cdf725cff88a4b80d70f94c：Git LF 属性与 CSS/SVG 嵌入换行归一化，未改变算法/玩法/评分/存档/UI。后续材料提交与远端一致性按发布证据记录，不使用自引用哈希。
- [Prompt 导航](../prompts/README.md)、[三链](core-chain-evidence.md)、[演进](evolution-log.md) 互相对应；11 份/45 条真实可见原文、9 个祖先提交已重验。原始范围和限制见 evidence/publication-core-evidence-20261025.txt。
- 创建轮被中止，标准导出在控制事件前停止；已另存中止后的真实暂停答复并交叉引用，不伪造为成功。当前上传轮快照不包含尚未落盘的最终答复。
- C01/C02/C03 都有实现与真实迭代记录；部分共享连续会话、修复多为 AI 自测。U01 是独立真实用户纠正，不复制凑三个。不能保证“三条完整人工引导修复链”已获评审认可。

## 干净源码演练与最小修复

从本地 Git 独立 clone 到 D 盘临时目录，不复制 node_modules、.next 或私有 env，npm 缓存为空。Node 24.19.0 / npm 11.17.0，Windows 11 / 已安装 Edge。安装 354 包用 44.611 秒；从安装计时开始至 L01 两次显式预测、20 次推进、真实指标与本地复盘共 342.113 秒。无页面异常或自动外部请求。计时不含提前完成的本地 clone、操作系统/Node 安装或公网下载，不保证所有机器/网络 10 分钟完成。

AI 复现发现 CRLF 检出令 HTML hash 与 Git blob 不同，修复前测量未删除。修复后本机与 CRLF 检出均生成 501850 字节、SHA256 8f481dcdd4870ee9d9ab11b024f0d20d030c27cefcf89ce8f657efa83111a1d0，与原规范 blob 一致。不是人类报告 Bug，不更改历史测量值。详见 [复现声明](reproducibility.md) 与 evidence/reproduction-line-endings-{before,after}-20261025.json。

## 实际检查

| 范围 | 结果 | 证据 |
| --- | --- | --- |
| 干净源码安装/一关闭环 | 44.611 秒 / 342.113 秒 | evidence/reproduction-{install,dev}-20261025.txt；reproduction-20261025.json |
| 类型 / lint / Node | 155/155，零失败/跳过 | evidence/reproduction-check-20261025.txt |
| 生产构建 | 通过 | evidence/reproduction-build-20261025.txt |
| HTTP 四视口 | 260/260，零失败/跳过/波动 | evidence/publication-http-20261025.json |
| 换行修复后离线四视口 | 272/272，零失败/跳过/波动 | evidence/publication-offline-20261025.json |
| Prompt 工具 PS7 / PS5.1 | 各 19/19 | evidence/publication-prompt-check{,-ps51}-20261025.txt |
| npm 工具 PS7 / PS5.1 | 49/49；37/37 | evidence/publication-npm-check{,-ps51}-20261025.txt |

浏览器四视口为 1440、390、320、768；均 AI 无头 Edge。修复前离线也通过 272 项，文件名 publication-offline-prefix-20261025.json 保留历史含义，最终结果以无 prefix 文件为准。未重新声称真实手机、人工学习效果、全浏览器成功或绝对流畅。

本轮文档链接/JSON/原文哈希/暂存及全历史检查的实际结果见 evidence/publication-materials-validation-20261025.json 与 publication-history-scan-20261025.json；后者仅启发式扫描，不是不存在秘密或漏洞的保证。git diff --cached --check 的空白提示仅位于原 Prompt 与真实工具输出，保留原文尾空格/末尾空行，不为消除提示篡改来源；非证据文件无空白问题。git diff --cached --check 的空白提示仅位于原 Prompt 与真实工具输出，保留原文尾空格/末尾空行，不为消除提示篡改来源；非证据文件无空白问题。

## 未完成与清理边界

GitHub 源码可访问不等于网站部署，也不等于整场竞赛提交。视频/PDF、账户资格、最终提交回执及真实人工/设备验收仍未完成或未核验。可选 DeepSeek API 未实际付费联调，不影响默认本地学习复现。

既有 5 个未跟踪残留（临时 spec、motion-playability/status-update 两对草稿）不纳入、不擅自删除。只清理本轮废弃下载、临时克隆/配置及检查产物；真实归档证据保留。本轮不生成检查截图/录屏。授权文件在最终推送验证后移除，不把它提交到仓库。

## 实际发布与未登录访问结果

已正常执行 git push -u origin main，退出码 0，未使用 force。主材料提交 **1c10e32fb1a28bd56b72ac864f5ca648635743a8** 已公开；初次推送后远端 main、匿名 API 与无凭证 Git clone 的 HEAD 均为该哈希，克隆含 **34 个提交**，与本地 main 全历史逐个一致。关键算法/交互/复盘/用户纠正/换行修复提交均仍为祖先。

匿名请求没有 Authorization/Cookie，Git 克隆显式清空 credential.helper 和 http.extraHeader，禁止交互。仓库 API 返回 private=false、网页 HTTP 200；11 个 README/模板/锁文件/Prompt/HTML 关键文件均在匿名检出中存在，无 .env.local/node_modules。该次精确时间、引用与范围在 evidence/github-publication-20261025.json。

此后使用普通证据归档提交保存本结果并再次正常推送；归档提交哈希不写入自身，不为填哈希反复 amend。最终远端一致性在执行后核对，不将材料提交的 34 次快照误称永远最新提交数。

## 本轮清理实际限制

已核对临时目标位于 D 盘工作区，但删除本轮复现克隆/下载归档的操作被工具策略拒绝，未改用其他方法绕过；这些缓存仍留在被 Git 忽略的 .cache 中，未上传。临时授权的退出将在最终推送核验后通过官方 CLI 执行，最终是否成功以实际执行结果为准。本轮无检查图产生，既有真实证据与无关残留不删除。
