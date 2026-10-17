# 阶段 5：条件实验与本地证据复盘

## 5A 领域层（2026-10-17，AI 执行）

目标：完成搜索后只改变一项条件，保留旧结果，新建运行并重新预测；只根据真实已揭示事件生成可解析的本地反馈和报告。

实现文件：PathLab-AI/src/domain/learning/{session,diagnose,report}.ts；tests/reflection.test.mjs。原始契约/固定地图不改，无新依赖。

- 六种允许的关卡/算法组合：条件应用回 briefing，不自动运行；新 run 的 counterfactual_applied 精确关联旧 run/修订；新运行再次经过预测门控，终止结果匹配独立内核，旧摘要原样保留。
- 非法/封锁端点/越界/小数/无变化/未知字段条件被拒绝且无副作用；运行中无编辑。条件实验固定算法，防止把两个因素同时变化的结果当控制实验。
- 重置恢复原图 revision0；相同地图复用修订身份。重复原图和同条件仍为 retry，首次准确率不被重写。报告历史/已完成摘要保留。
- cancel 即使从 report 打开也返回 reflection，保留快照，不偷建运行。
- BFS 仅诊断观察到的 FIFO 不一致；A* 不猜心理原因；无预测点/正确选择不虚构能力或掌握程度。请求/反馈通过原 schema 与引用关系检查。
- 解释最多 500 字，非空须有真实当前运行事实引用；未知/跨 run/重复引用被拒绝。空解释可生成部分报告。有条件运行、预测、解释和变更/终止引用才标“记录齐备”，不评定解释正确或已掌握。解释仅作为纯文本保留，不拼入反馈事实摘要。
- 事件 UTC 与 ID 边界，反馈/报告深拷贝、原指标/两次终止事件与差值可核对。

实际命令：根包装器 run check；PowerShell 7 和 5.1 均 typecheck/lint/92/92 通过。证据 stage-5-domain-check.txt / check-ps51.txt。

真实红态：缺新模块（原 83 项通过）；第一次实现 90/92，两个测试自身假设错误，保留 first-check 原文；根据 fixture 和否定句语义纠正后通过。AI 自查自修，不是用户引导 Bug 链。

此里程碑未连接条件/报告 UI，未重跑 build/browser。存储/导入导出/地图自由编辑/远程反馈未实现；不是人工/真机验收。所有新文件在 D 盘工作区；未重试旧清理拒绝项。Prompt 6 条真实可见消息、finalCaptured=False；核心完整链仍 0/3，未发布 GitHub。


## 5B 学习工作台（2026-10-17，AI 执行）

### 实现与可核对边界

- 新增 ReflectionPanel：原图运行结束后才展示本地规则反馈；允许进入预设单因素实验。应用条件回 briefing，不自动运行、不提前给最终指标；保持原算法，重新预测并用新 run 的真实终止结果比较。
- 同算法前后表分别列路径步数、扩展节点数与差值；两次终止事件和条件事件可展开核对。不把扩展数差值解释为实际耗时差值或一般性优劣。
- 当前已揭示事实可勾选引用，解释最多 500 字并按 React 纯文本展示。没有解释可明确生成部分记录；“复盘记录齐备”只检查过程记录齐备，不判定自由解释正确或已经掌握。
- 取消/Escape 保留同次运行草稿与报告；切换关卡保留本页会话。新增“本页报告历史”，重置后仍可查阅旧报告快照；刷新仍丢失，未声称持久化。
- 本地反馈标明“规则模板 · 未调用模型”；脚本形状解释文本不执行，也不会被拼入反馈事实描述。无新增依赖、浏览器下载或模型调用，globals.css 不改，新增样式集中 learning.css。

### 真实发现与修复

1. 代码检查发现已修改条件的 briefing 仍禁用 reset。改为只有原图 briefing 才禁用重置；补浏览器回归。该问题在测试运行前由 AI 检查发现，不编造“先失败的浏览器测试”。
2. 领域层本来保留 reports，但 reset 后缺少可查阅 UI。增加独立 ReportHistory 折叠区，六种组合均验证重置后报告解释与记录状态仍在。
3. 额外浏览器观察确认：完成搜索时 reflection-title 虽获焦点，却因 preventScroll 留在屏外。390px 下标题 top=1728、视口高 844；1440px 下 top=1255.671875、视口高 1000。观察原值见 stage-5-focus-observation.json。补测试后 mobile-390 实际失败 1/1，原输出/JSON/页面文字快照见 stage-5-focus-red.txt / .json 与 stage-5-focus-error-context.md；允许原生 focus 滚动后四视口均通过。此为真实 AI 自测自修，不是用户引导修复链。

### 实际验证

| 检查 | 最新结果 | 原始证据 |
|---|---|---|
| PowerShell 7 check | 路由类型、严格 tsc、零告警 lint、92/92 Node 测试通过 | evidence/stage-5-ui-check.txt |
| Windows PowerShell 5.1 check | 同上，92/92 通过 | evidence/stage-5-ui-check-ps51.txt |
| 生产构建 | next build 成功 | evidence/stage-5-ui-build.txt |
| Prompt 提取工具 | 两版 PowerShell 各 17/17 合成回归通过；不是人类参赛对话 | evidence/stage-5-prompt-tools.json |
| 已观察焦点的修复前回归 | mobile-390，预期失败 1/1；不是最终验收失败 | evidence/stage-5-focus-red.txt / .json |
| 最终 Edge 浏览器 | 4 视口 × 31 场景 = 124/124，skipped/unexpected/flaky 均 0 | evidence/stage-5-ui-browser.txt / .json |

最终浏览器 startTime=2026-10-17T02:48:20.383Z（UTC），duration=264089.577 ms。四视口为 1440×1000、390×844、320×860、768×1024。此前包含报告历史的 120 项回归已通过；新增四视口焦点场景后的最终结果以上表为准，不重复累加为更多独立功能。

Canvas 新增 3 DPR 场景 × 4 视口：DPR1/2/3 的 backing scale 上限为 2；初始无未揭示绘制；Canvas/DOM 矩形、当前节点、前沿与路径中心几何一致；getImageData 核对真实当前节点橙色像素；调整至 517/320px 后重绘一致。探针仅注入测试上下文，无应用调试全局，像素采样不保存图片。额外查看了一张 390px 复盘检查图，查看后已删除，未留新增检查图片。

反事实/报告流程覆盖六种允许组合、原图/新条件与独立内核匹配、单次预测门控、旧摘要/报告历史、条件后立即重置、纯文本/键盘输入作用域、取消与 Escape、部分记录、刷新丢失提示、axe 与无横向溢出；测试流程无外部请求或存储写入。无障碍自动检查与 headless 几何不等于真实手机、屏幕阅读器实用性、真人学习效果或 FPS 验收。

实际命令（从仓库根运行，Tee 采用 D 盘绝对路径）：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','check')
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','build')
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','test:browser','--','--project=mobile-390','--grep','new reflection states') # 修复前真实红态
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','test:browser') # 修复后最终全量
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "& 'D:\竞赛\scripts\Invoke-ProjectNpm.ps1' -NpmArguments @('run','check')"
~~~

### 留证、提交与未完成部分

- Prompt 快照：prompts/sessions/2026-10-17-autonomous-iterations.md / .jsonl；当前 8 条真实可见消息，finalCaptured=False；最终答复写入原始记录后须下一轮补齐，不预写本轮答复或内部摘要。
- C01/C02/C03 的对应功能已落地并有 AI 验证，但仍缺真实用户引导修复环节；完整链保持 0/3，不以 AI 自修或多视口重复执行冒充三条人类引导链。
- 阶段 5A 实际提交 3b2e9f353f55c5d5a303afa8a445b42dbb0e4c94；阶段 5B 实际功能提交 f4a43cac7346689d33307e1d8b96d7166979f222。已独立核对实际 Git blob 中 8 条原文 SHA256 全部一致，用户尾部空白保留；显式暂存清单与实际 33 文件一致，未匹配到所检查的常见凭证模式（不代表全面安全审计）。真实哈希由随后证据索引提交登记，不 amend/改写历史。
- 持久化/安全导入导出与恢复、自由地图编辑、远程反馈、真机/人工测试、干净机器复现、最终视频/PDF 和 GitHub 评审访问仍未完成。未对外发送或发布，所有新增产物在 D 盘工作区，既有清理拒绝项未重试。
