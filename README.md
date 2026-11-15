# PathLab AI · A* 与 BFS 交互学习

从生活类比开始，先预测、再看真实算法回放，用证据解释“为什么这样走”。

> **当前正式参赛版：2026-11-15**
> 本次评审请下载下方正式材料包。v2、v3 和早期材料只用于历史追溯，不是当前参赛版。

## ① 下载当前正式参赛文件

### [下载完整正式参赛包 ZIP（131.75 MB）](https://github.com/ljqzs08/PathLab-AI/releases/download/formal-submission-20261115/PathLab-AI-formal-submission-20261115.zip)

[正式发布页与校验文件](https://github.com/ljqzs08/PathLab-AI/releases/tag/formal-submission-20261115) · [评审入口说明](00-正式参赛入口.md)

**下载 → 完整解压 → 打开 `00-打开最新参赛材料.html`。**

这是 **PathLab-AI-正式参赛文件-20261115**。不需要先安装 Node.js，也不需要启动服务器。
**不要下载 GitHub 自动生成的 `Source code (zip)` 来代替完整参赛包。**

| 材料 | 正式包中的内容 |
| --- | --- |
| 当前作品 | `03-离线体验/PathLab_AI_v4_optimized_final.html`，完整离线单文件 |
| 作品介绍与技术文档 | 12 页介绍、16 页技术 PDF，以及可编辑 Word 和源稿 |
| 源码与演进 | 冻结源码、完整历史 bundle、来源与复核说明 |
| 开发证据 | 真实 Prompt、用户纠正记录、7 张新增原始拍屏 |
| 展示材料 | 11 张正式截图、3 份 H.264 视频 |
| 核验与边界 | 文件清单、SHA256、验收回执与明确的未完成项 |

<details>
<summary>文件校验与版本对应关系</summary>

- ZIP：**131,747,543 字节**。
- SHA256：`64fbca276df0b35e7e8d10d11d426a2627b440c1ba07d1aa8496acf235207d25`。
- 正式 Release 标签：`formal-submission-20261115`。
- 包内源码冻结：`955df39c5db78bf07614486018d6b52b6ea07b69`，653 个文件、75 次真实历史。
- main 继续记录后续核验和文档整理；它与已冻结的包不是同一时间点，不改写原 ZIP 或历史。
- 英文下载名与本地中文 ZIP 名不同，文件内容相同；校验文件正文保留本地原名。
- 完整归档母版与 v3 在作者本机保留，不作为额外正式下载入口反复上传。

</details>

## ② 了解当前作品

- **8 站学习路线**：认识 A* → 生活类比 → 图解 → 视频课 → 互动入门 → 闯关游戏 → 任务工作台 → 自由实验。
- **零基础练习**：先定义 g / h / f，再练习、看真实引擎回放、换题自测；保留首答与错因，不把“访问过”直接算作掌握。
- **确定性算法**：独立 BFS / A*、预测门控、Canvas / 文字回放、单因素条件对照与有事实引用的本地反馈。
- **体验增强**：可跳过欢迎、明暗主题、分级向导与本机备份；存档迁移请先导出 JSON，不能假定跨浏览器或移动文件后自动继承。
- **可选辅助复盘**：准备已揭示事实，由使用者预览、复制后手动到官方网页提问。不会自动发送；站内 API 为独立的可选服务端能力，离线 HTML 不内置密钥。

![当前正式作品的实际首页截图](docs/assets/submission-20261115/01-home.png)

只想体验作品，可下载仓库根目录的 [当前离线 HTML](PathLab_AI_v4_optimized_final.html) 后本地打开。
**文件名含 `v4` 是沿用的原始名称，不代表它是旧 v3，也不把未交付的 v5 建议当成当前成果。**
GitHub 文件页用于查看或下载代码，不是已部署的在线体验网站。

## ③ 按目的阅读仓库

| 你要做什么 | 从这里开始 |
| --- | --- |
| 评审完整作品 | [正式参赛包](https://github.com/ljqzs08/PathLab-AI/releases/tag/formal-submission-20261115) / [唯一入口说明](00-正式参赛入口.md) |
| 看技术、文档和实际边界 | [文档导航](docs/README.md) |
| 运行工程源码 | [工程版说明](PathLab-AI/README.md) / [安装、运行与历史复现实测](docs/development-guide.md) |
| 核对真实 AI 协作与用户纠正 | [开发证据总索引](prompts/README.md) / [C01、C02、C03、U01 阅读导引](prompts/submission/README.md) |
| 查版本变化 | [版本历史](docs/version-history.md) / [历史归档导航](archive/README.md) |
| 复用构建和核验工具 | [脚本导航](scripts/README.md) |

### 截图中根目录各项的用途

| 路径 | 当前定位 |
| --- | --- |
| `PathLab_AI_v4_optimized_final.html` | **当前选定作品**，E037 / E038 增强已包含 |
| `PathLab-AI/` | 现有 Next.js 工程；其生成 HTML 与根目录增强主件有明确差异 |
| `docs/` | 当前材料导航、技术资料、阶段核验和历史记录 |
| `prompts/` | 真实文字记录与核心链导引；保留当时原话与状态 |
| `Prompt历史快照/` | 10 张早期原始拍屏，局部历史证据，不等于全部最新记录 |
| `output/` | 旧文档导出与受保护底稿；不是当前正式材料下载区 |
| `archive/` | 历史版本的统一导航；不重复制品、不重写 Git 历史 |
| `scripts/` | 构建、留证和校验工具 |
| `PathLab_AI_参赛级完整提示词.md` | 初始方案与规格原文，不是当前状态报告或完整对话 |
| `AGENTS.md`、`.gitignore`、`.gitattributes` | 工作区规则与 Git 配置，不是评审作品入口 |

目录继续保留原路径，以免破坏源码复现和历史证据引用；更新的是**导航与版本标识**，不是人为刷新旧文件或伪造修改时间。

## 历史保留原则与真实性

**一个当前正式入口 + 可追溯的历史版本。** 旧 Release 明确标注历史用途，原标签、附件和提交保留；不把旧版与新版并列推荐。
本次仓库导航整理不修改作品代码、不替换正式 ZIP、不重跑或累加历史产品测试。

已有自动化记录不等于真人/真机验收、教学效果证明、真实付费模型联调或当前赛事条款验收。
C01 / C02 / C03 保留真实共享开发原文，U01 保留真实用户纠正，不冒充三次独立人工报 Bug。

GitHub 发布不等于网站部署或赛事平台正式提交。素材授权、隐私、真人学习测试和最终表单仍需单独确认。

[当前进度与剩余风险](docs/progress-status.md) · [原正式包核验](docs/formal-submission-verification.md) · [原发布核验](docs/verification-formal-github-publication.md) · [本次导航整理核验](docs/verification-github-navigation.md)
