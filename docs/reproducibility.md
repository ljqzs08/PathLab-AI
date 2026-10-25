# 复现性声明与环境指南

核对日期：2026-10-25。执行者：AI。评审入口为根 README 的“10 分钟源码复现指南”；本文件解释范围，不替代原始日志，也不把 AI 自动化冒充人工/真实设备验收。

## 复现对象与版本锚点

- GitHub： https://github.com/ljqzs08/PathLab-AI ，使用 Git clone 保留演进。记录实际 git rev-parse HEAD；最终推送/远端一致性见 evidence/github-publication-20261025.json。
- 本次源码闭环演练基线：44b4ef24f39158c50229e96dd7ef048922dc1025（既有 32 次真实提交）。源码检出无 node_modules、.next 或 .env.local，npm 缓存也从空目录开始；克隆来源是同机本地 Git，不是假称已从 GitHub 下载。
- E020 仅增加发布/复现文档、Prompt 索引、Git LF 属性与单文件构建换行归一化；不改现有算法、玩法、评分、存档或远程接口，不改写已有提交。
- BFS/A* 固定地图、FIFO/二叉堆、确定性平局规则由测试固定。同一领域输入与操作可复现；不承诺不同机器绘制耗时、浏览器存储策略或 AI 再生成源码逐字一致。

## 已测环境与依赖

Windows 11；PowerShell 7.6.5 与 Windows PowerShell 5.1.26100.7705（工具回归）；Node v24.19.0、npm 11.17.0；已经安装的 Microsoft Edge（无头自动化，未下载浏览器）。最低项目 engines 为 Node >=22.13.0，不等于所有满足最低版本的环境都已实测。准确直接依赖见 README / PathLab-AI/package.json，传递依赖以 package-lock.json 为准。只通过 scripts/Invoke-ProjectNpm.ps1 安装/构建/启动，缓存和 TEMP/TMP 留在当前 D 盘项目。

## 本次计时与检查

| 检查 | 实际结果 | 来源 |
| --- | --- | --- |
| 空依赖检出后 npm ci | 354 个包；44.611 秒 | evidence/reproduction-install-20261025.txt |
| 开发服务 | 仅 127.0.0.1:3235；服务日志 Ready 378 ms | evidence/reproduction-dev-20261025.txt |
| 一关门控闭环 | L01；2 次显式预测、20 次推进、真实指标和本地复盘；零 pageerror/外部请求 | evidence/reproduction-20261025.json |
| 计时开始至闭环 | 342.113 秒，包含安装后 AI 操作/OAuth 协调等待；不含预先完成的本地 clone | 同上 |
| 类型 / lint / Node | 155/155；零失败、跳过 | evidence/reproduction-check-20261025.txt |
| 生产构建 | 通过；首页与反馈路由正常构建 | evidence/reproduction-build-20261025.txt |
| HTTP 四视口 | 260/260；零失败、跳过或重试波动 | evidence/publication-http-20261025.json |
| 修复后离线四视口 | 272/272；零失败、跳过或重试波动 | evidence/publication-offline-20261025.json |
| 双 PowerShell Prompt 工具 | 各 19/19 | evidence/publication-prompt-check{,-ps51}-20261025.txt |
| npm 环境工具 | PS7 49/49；PS5.1 37/37，成功/失败恢复均覆盖 | evidence/publication-npm-check{,-ps51}-20261025.txt |

上述 HTTP 与修复后离线回归均已结束且结果落盘；详细版本/执行范围见 verification-github-publication.md。publication-offline-prefix-20261025.json 为修复前结果，不能代替最终修复后结果。本次计时是同机 source-only 演练，不是从空操作系统安装软件，也不含公网 clone 时间，不构成所有评审设备的 10 分钟保证。浏览器操作是 AI 合成操作，不是学生学习数据或真人掌握程度。

## Windows 换行与单文件重建

AI 实测发现，既有 Git autocrlf 会将 CSS/SVG 检出为 CRLF；原构建器直接嵌入原文，导致同份提交重新构建的 HTML hash 不同。前置失败测量见 evidence/reproduction-line-endings-before-20261025.json。修复仅规范嵌入文本换行并增加 .gitattributes，不修改算法和游戏行为。

规范 HTML 的 Git blob SHA256 为 **8f481dcdd4870ee9d9ab11b024f0d20d030c27cefcf89ce8f657efa83111a1d0**。历史本机工作副本包含两字节 CRLF 差异，历史报告 18d043... 保留为当时测量值，不回写伪造。修复后本机混合换行源与 CRLF 检出重建的比较见 evidence/reproduction-line-endings-after-20261025.json。依赖/编译器升级仍需重新验证，不保证无限期跨版本字节一致。

<a id="环境变量"></a>
## 环境变量

模板：PathLab-AI/.env.example。**不需要复制模板或填写凭证即可复现本地学习闭环。** 不读取/覆盖已有 .env.local；所有 .env 私有文件与缓存均被忽略。只有主动启用站内 API 的本机受控演示需要配置下面的敏感项。

| 变量 | 模板默认值 | 作用与边界 |
| --- | --- | --- |
| AI_ENABLED | false | 默认不进行远程模型调用 |
| AI_BASE_URL | https://api.deepseek.com | 仅可选服务端提供方地址 |
| AI_MODEL | deepseek-flash | 模板值；启用前按提供方账户可用模型核验 |
| AI_API_KEY | 空 | 提供方密钥，仅服务端；不提交/不展示/不交给评审 |
| AI_ACCESS_TOKEN | 空 | 独立至少 32 字符口令，不可复用 API Key |
| AI_ALLOWED_ORIGIN | http://127.0.0.1:3000 | 启用 API 时匹配真实本机 origin；换端口同步调整 |
| AI_TIMEOUT_MS | 8000 | 超时回退本地反馈 |
| AI_MAX_REQUESTS | 20 | 每进程尝试次数，重启重置；不是金额封顶 |

可选 API 尚无真实付费联调；共享口令和进程限额不适合作为多实例公开部署保障。网页辅助仅本机整理、手动复制和打开官方页面，不自动发送/读取外部聊天；官方页面自身可能要求联网/账号，不等同模型 API。HTML 不包含站内服务器 API。

## 常见故障与停止

- 找不到 node/npm：先完成前提环境，不用复制别人的 node_modules。
- 安装失败：确认 Node engines、联网、锁文件和可选包；不要删除锁文件改用漂移的版本，不直接放开全部安装钩子。
- 端口占用：使用 README 的 3001 参数数组；不要杀死身份未知的其他服务。
- test:browser：先 build，要求既有 Edge 和空闲 3210 端口；干净检出不含本机遗留临时 spec，可直接运行普通命令。
- 文件版换位置/浏览器：先导出 JSON，再在目标位置预览/确认导入；不假设 file:// 存档自动迁移。
- npm 依赖提示 ESLint 9 结束支持为已知风险，不伪称无漏洞；本轮未执行完整依赖安全审计。
- 使用 Ctrl+C 停止自己启动的 dev/start。截图/视频/trace 默认为关闭；本轮无新检查图，不删除历史真实参赛证据。

## 参赛材料边界

本地功能与 Git 上传不等于已正式提交。C01/C02/C03 实现、细粒度历史与来源快照存在；部分共享连续开发会话且缺独立人类 Bug 指引。真实用户 HTML 纠正 U01 单独保留，不复制凑三链。视频/PDF、官方账户字段及最终提交回执未完成或未核验；详见 progress-status.md 和 prompts/README.md。
