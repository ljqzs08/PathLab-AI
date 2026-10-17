# PathLab AI

让算法初学者先预测，再通过确定性搜索与证据反馈理解“为什么这样走”。

**当前状态：阶段 1 可运行应用骨架。** 已提供四个固定任务的简报切换和静态地图；BFS/A*、预测/回放、诊断、存储及真实 AI 尚未接入。当前不是可以直接提交的完整参赛作品。

## 启动与检查（Windows）

需要已安装 Node.js 22.13+ 与 npm；本机已验证 Node 24.19.0、npm 11.17.0。无需 API Key，不需要账号。推荐使用 Node 24 LTS；未测试其他 Node 主版本。
在仓库根目录使用 Windows PowerShell 5.1 或 PowerShell 7：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 ci
.\scripts\Invoke-ProjectNpm.ps1 run check
.\scripts\Invoke-ProjectNpm.ps1 run dev
~~~

开发预览为 http://127.0.0.1:3000，Ctrl+C 退出。仅绑定回环地址，不向局域网开放。
生产构建与浏览器检查：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 run build
.\scripts\Invoke-ProjectNpm.ps1 run test:browser
.\scripts\Invoke-ProjectNpm.ps1 run start
~~~

- check = 生成 Next 路由类型 + TypeScript 严格检查 + ESLint 零告警 + 22 项原有契约测试。
- test:browser 使用本机**已经安装**的 Microsoft Edge，无浏览器下载命令；从生产构建启动专用 3210 端口。测试前须先 build 且该端口空闲。当前为 4 视口 × 7 项 = 28 项 AI 自动检查，不代表真实手机/人工验收。
- 浏览器检查之外的工程工具回归：

~~~powershell
.\scripts\Test-PromptSnapshot.ps1
.\scripts\Test-ProjectNpm.ps1
~~~

PowerShell 传递 npm 的双横线和额外参数时，使用显式数组，避免 shell 吞掉分隔符：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run', 'dev', '--', '--port', '3001')
~~~

## 工作区与依赖边界

包装器将 npm 缓存、TEMP/TMP、Playwright 路径和 XDG 缓存限制在本仓库 .cache；关闭 Next 遥测、浏览器下载、安装脚本与自动审计/更新通知，仅修改当前调用进程环境，成功/失败均恢复。不要直接运行会绕过这些约束的安装或启动命令；不使用全局安装。

依赖全部精确锁定，来源和兼容取舍见 docs/dependencies-stage-1.md。Next 运行需要的本机预编译组件已在禁止安装脚本的模式下通过构建验证；换平台失败时应先检查可选包，不能直接开启全部安装钩子。
node_modules、.next 与类型增量文件用于复用或本地预览，不入 Git。临时检查图按规则在查看后尝试删除；本轮三张检查图与上轮 .cache/npm、.cache/tmp 的清理被工具策略拒绝，仍在 D 盘忽略目录中保留，不声称已经清空或绕过限制。

## 仓库布局

- PathLab-AI/src/app/：App Router 页面、元数据、系统字体与响应式 CSS。
- PathLab-AI/src/components/PathLabShell.tsx：本轮唯一 UI 状态是所选关卡，不是学习状态机。
- PathLab-AI/src/data/missions.ts：复用原有固定 JSON；不生成轨迹、统计或答案。
- PathLab-AI/contracts/、fixtures/：阶段 0 契约与数据，继续保留。
- PathLab-AI/tests/contracts.test.mjs：规格检查；tests/browser/：真实生产页面自动检查。
- docs/：产品/架构/验收/演进/依赖核验/各阶段实际验证。
- prompts/sessions/：带来源行号和原文哈希的真实可见对话快照。
- scripts/：npm 环境包装、真实 Prompt 提取和相应回归。

## 真实性、隐私与证据

页面只显示固定地图，不展示虚构路径、预测正确率或学习效果；“开始预测”明确禁用。刷新后回到 L01，不声称进度已保存。浏览器测试覆盖的默认页面操作没有外部请求或 local/sessionStorage 写入；这不是对所有系统进程或未来服务的网络保证。

本仓库没有 GitHub remote；创建/推送/公开与评审授权需另行确认。作者邮箱可能随未来公开历史曝光，发布前复核。
合成 fixtures 和工具回归不是用户对话、模型实测或人工验收。AI 自查不代替用户引导 Bug 修复；当前三条核心完整链仍为 **0/3**。
每轮最后答复尚未落盘时，标明待补齐，下一轮只读提取真实记录；不把内部交接摘要归档为最终答复。

## 阅读与下一阶段

规格基线见 docs/product-spec.md；实际阶段结果见 docs/verification-stage-1.md；剩余验收见 docs/acceptance.md；过程索引见 docs/evolution-log.md。

**本阶段收口后停止。** 下一阶段是独立、确定性的网格/BFS 内核与边界测试（C01 开始），先验证四图与预测点，再接入交互；不会自动扩展到 Canvas、A*、诊断或远程 AI。
