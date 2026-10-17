# 完整单文件 HTML 交付与验证

核对日期：2026-10-17。执行者：AI 自动化；不是用户人工、真实手机或全部浏览器验收。

> 本文保留 E012/E013 打包修复的历史验收与当时 hash。E014 已加入地图预测与有限动效，当前产物 hash、204/204 离线回归和 192/192 HTTP 回归以 `verification-motion-interaction.md` 为准，不把下方历史 hash 当作最新文件。

## 真实需求纠正与交付物

用户原文：“我的意思是让你把这个网站制作成HTML文件，不是建一个HTML 的访问入口 ，重新修改”。此前 E011 的入口卡片误解了需求；保留其提交和真实检查记录，不将当时的“入口可访问”改写为“完整网站已离线”。

- 现交付：`D:\竞赛\PathLab-AI\PathLab AI.html`，直接双击打开，无需启动服务器。
- 旧 `PathLab-AI/打开 PathLab AI.html` 已替换，不再保留相互混淆的启动卡片。
- “完整”指当前阶段 6 已实现的四关、BFS/A*、预测门控、Canvas/DOM 回放、单因素条件实验、引用解释报告、本机进度与 JSON 备份/恢复；不是预览截图、iframe、localhost 链接或跳转页。
- HTML 内含生产 React/ReactDOM、scheduler、共用组件/算法/fixtures、两份 CSS、SVG data URI 与对应运行时许可证。没有外链脚本/样式、CDN 或相邻资源文件。
- 不接远程 AI、不新增自由地图编辑，不将本次打包纠正计作三条核心功能的人类 Bug 修复链，也不宣称已完成参赛公开交付。

## 可复用构建方式

仓库根目录执行：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','build:html')
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','test:standalone')
~~~

`src/standalone.tsx` 挂载现有 `PathLabShell`，不另写算法或教学逻辑。单独构建脚本复用锁定 Next 16.4.2 内的 webpack/Terser 与既有 TypeScript；没有新增依赖或改动原 Next 配置。TypeScript loader 只转译，严格类型检查仍必须单独执行 `check`。编译器禁止拆分/异步 chunks、校验仅一个 JS 产物，内联资源并转义脚本结束标记。

安装版本自带 `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` 说明常规静态导出仍输出 HTML/CSS/JS 多资源，不能单凭静态导出目录声称满足本次“只有一个文件”的需求。本次独立构建不改变原 Next 部署方式。

构建脚本引用 Next 包内的内部模块路径，不是稳定公共 API。首次尝试默认 minimizer 时真实失败：缺少 `next/dist/build/webpack/plugins/terser-webpack-plugin/src`；改用已安装的 compiled Terser 后成功。保留 `evidence/standalone-first-build.txt`，未靠下载/安装新包规避。

## 真实验证与修复

1. 修改前检查：旧卡片 script 数为 0、有 localhost 链接、无学习工作台，不满足用户的新明确要求；见 `evidence/standalone-before.json`。
2. 初版真实单文件构建成功，类型/lint/102 项 Node 测试通过；桌面三项离线专项通过；见 `standalone-build.txt`、`standalone-first-check.txt`、`standalone-first-browser.txt`。
3. 第一次四视口全量实际为 **180/188**：顶部说明未归入 landmark（4 项），一条旧反事实测试仅允许 HTTP、误拦 `file:`（4 项）。完整失败日志/JSON 为 `standalone-browser-initial.{txt,json}`。前者是真实 HTML 无障碍缺陷，后者是跨运行方式的测试适配问题，不混称产品故障。
4. 将顶部说明纳入有名称的 `aside`，保留原 note；只在单文件测试模式允许 `file:`，其他非本地流量继续拦截。Canvas 手动创建的 DPR1/2/3 上下文也显式设置 offline，避免只依赖默认测试上下文。补充地标回归断言，内联已有运行时许可证。
5. 修复后的最终结果和产物哈希以文末最终核对记录为准，不以首次烟测替代全量结果。

测试覆盖：四视口 1440×1000、390×844、320×860、768×1024；共享产品测试涵盖预测/回放/实验、指标、文本安全、键盘、响应式、axe、本机进度、JSON 确认导入、损坏/禁用/配额与跨页取舍。专项测试在断网状态检测零 HTTP/WebSocket 请求、无外部资源/页面错误；**只复制一个 HTML 到 D 盘另一新文件夹及中文文件名**，完成 A* 学习流程，并核对该文件夹只有一个文件；模拟 localStorage 访问即抛错，仍可预测和导出有效 JSON。

### 最终核对记录（2026-10-17，AI 执行）

| 验证 | 实际结果 | 证据 |
|---|---|---|
| PowerShell 7 / Windows PowerShell 5.1 | 两次均类型通过、lint 零告警、102/102 Node 测试 | standalone-check-ps7.txt / standalone-check-ps51.txt |
| 独立 HTML 离线全量 | 188/188；4 视口 × 47 项，零失败/跳过/不稳定 | standalone-browser.{txt,json} |
| 原 Next 生产构建 | 通过，未更改 Next 配置或页面/领域逻辑 | standalone-next-build.txt |
| 原 HTTP 产品回归 | 176/176；4 视口 × 44 项，零失败/跳过/不稳定 | standalone-next-browser.{txt,json} |
| 最终 HTML 再次构建 | 330771 bytes，重复构建哈希一致 | standalone-build-final.txt |
| Prompt 原文核对 | 上一入口轮 3 条含最终答复；本轮 4 条，角色/来源/文本 SHA256 均一致，最终答复已捕获 | standalone-final-audit.json |

离线全量 startTime=`2026-10-17T05:17:43.021Z`，duration=`265266.479 ms`；HTTP 回归 startTime=`2026-10-17T05:17:40.869Z`，duration=`259675.691 ms`。JSON 报告的 expected 分别为 188/176，unexpected/skipped/flaky 均为 0；不是重试后忽略失败的统计。

最终 `PathLab AI.html` 的 SHA256：

~~~text
7e3a7ed4b459e82b5c1b97128e1654b5dbd105f838a8b01dcdec6e0a909c2510
~~~

原 HTTP 回归的真实命令（在仓库根目录）：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','build')
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','test:browser','--','--grep-invert','temporary stage 6 visual review only','--output=../.cache/standalone-next-browser-results')
~~~

`standalone-final-audit.json` 同时保留 15 份实际证据文件哈希、首轮失败与最终报告统计、最终产物哈希和两轮真实文字快照的逐条原文一致性核对。未归档隐藏推理、内部交接摘要或工具凭证。

## 使用与边界

- 使用文件本身不需要 Node.js；只有修改源码后重新生成或运行测试才需要工程依赖。源码更新不会自动改写已有 HTML，须运行 `build:html`；`test:standalone` 会先重建。
- 本地文件存储由浏览器策略决定，不能保证移动/重命名文件、换浏览器或 HTTP/file 切换后自动恢复。定期把 JSON 备份保存到本 D 盘工作区；在目标版本先预览再确认导入。被禁用时显示仅内存提示，不能误报保存成功。
- Node/Edge 均使用本机已有安装。没有新增依赖、浏览器下载、外发、GitHub remote、发布或权限变更；没有生成截图/录屏，未把历史遗留检查图当作本次证据。
- 构建/独立复制仅在 D 盘本次新建的唯一临时目录中进行，最后只删本次产生的确切文件和空目录。归档后已清理本轮两个测试输出目录内的运行摘要与重复单文件 JSON 报告；历史拒绝清理项未重试/绕过，不能宣称历史缓存已全部清空。
- 原 HTTP 产品回归使用独立 `--output=../.cache/standalone-next-browser-results`，避免接触历史拒绝清理的 `browser-results/.last-run.json`；现有未跟踪 `stage6-review.temp.spec.ts` 明确排除且不纳入 Git。
- 原始 Prompt 为 `prompts/sessions/2026-10-17-standalone-html-correction.{md,jsonl}`；上一错误入口轮和本轮最终答复均已从真实来源补齐。本轮新聊天的最终答复尚未落盘，不能预写成已经完成的对话证据。
