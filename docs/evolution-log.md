# 开发演进与参赛证据索引

更新日期：2026-10-25（各阶段保留原日期）。事实来自实际操作，不补造之前的代码、提交、缺陷或用户追问。

## 当前状态

- Git 仓库根目录：本工作区；应用目录：`PathLab-AI/`，不另建嵌套仓库。
- 分支为 `main`；文档/工具基线已真实提交：`30523e1622322bd44592b87f3c550cb8a88ef279`，只包含当时已有规格、规则与归档工具，不包含未来应用功能。当时没有远程仓库；E020 已按授权推送 GitHub，状态以带日期的阶段记录为准。
- 2026-10-17 用户提供作者名称 `LJQZS08` 与邮箱；已仅在本仓库配置 `user.name` / `user.email`，并核对实际作者与提交者身份。保留仓库级 `user.useConfigOnly=true`；未更改全局配置、伪造身份或倒填时间。
- 阶段 0 规格、阶段 1 应用壳、阶段 2/3 BFS/A* 与二叉堆、阶段 4 门控预测/Canvas/回放均已实现；阶段 5 本地条件实验、真实前后指标、证据反馈和解释报告已连接工作台。阶段 6 已完成本机自动存档、JSON 备份/预览/确认、安全恢复与旧档保护；E015 已接入自由地图，E017 已实现可选 DeepSeek 服务端复盘（默认关闭、未真实联调），不是最终参赛交付。E000—E004 最终答复均已补齐；E005—E009 同一自主轮已补齐 9 条真实可见消息（含最终答复）。E016 已整理核心链、补齐 E015 最终答复并准备体验包，当前缺口见最新章节。当前功能与证据缺口分列 progress-status.md，不用内部 0/3 证据口径概括开发完成度。
- 阶段 1 应用提交：`ca4aa7ddeba2c5dd44c6322c1af4f42975e48c26`；工具修复：`90e64270ae54efa26ab720b5ee2e521717b780a6`；阶段 1 证据索引：`f6994513aa362fd0152a92babdfdfb5275e78f60`。阶段 2 提交按 E004 登记，不改写历史。
- 初始阶段未创建或推送远程；E020 已按明确授权完成 Public GitHub 上传与匿名验证。E021 新材料的本地提交/推送状态单独记录，不能据旧访问快照宣称新材料已上传。

## 本轮 E000：强制演进与留证规则

| 字段 | 真实记录 |
|---|---|
| 用户意图 | 以后每轮对话和模块完成时，主动保留细粒度 Git 历史和真实 AI Prompt 过程；至少三条核心链包含用户引导 Bug 修复 |
| 原始 Prompt 与可见答复 | `prompts/sessions/2026-10-17-codex-policy-update.md`；同名 JSONL 含原文字段、原始记录行号和 SHA256 |
| 归档来源/局限 | 从当前会话真实本地记录只读提取可见文字，不是事后重建或原生全量导出；2026-10-17 已补齐真实最终答复，共 4 条消息，`finalCaptured=True`；未生成截图/录屏 |
| 变更 | `AGENTS.md`；总控 Prompt 包；`.gitignore`；可见消息提取脚本与回归检查；本索引 |
| 对既有方案的必要纠正 | 平台按用户最新摘录统一 GitHub；仓库与证据统一放父根目录避免漏入提交；视频 AI 协同片段由 1:45 修正为 2:15；移除未经核验的校内通知依据 |
| 实际问题 1 | 会话记录正被主程序写入，普通 ReadLines 读取失败；改为只读 FileStream 并允许读写/删除共享，不改动原始会话文件 |
| 实际问题 2 | Windows PowerShell 5.1 将无 BOM 的中文 UTF-8 PS1 按旧编码解析，导致字符串语法错误；只将执行脚本保存为 UTF-8 BOM 后复测通过，Markdown/JSONL 仍为 UTF-8 无 BOM |
| 问题引导者 | 上述问题由 AI 执行时自行发现、自行修复；用户未实际追加 Bug 指引，**不能冒充用户引导修复链** |
| 执行者 | AI 通过本地 PowerShell 实际执行；尚无人类验收记录 |
| 验证结果 | Windows PowerShell 5.1 与 PowerShell 7.6.5 各通过 14 项自动检查；2026-10-17 作者确认轮次已在两者重跑并各通过 14 项；真实会话提取在两者均成功 |
| Git 状态 | 已真实提交 `30523e1622322bd44592b87f3c550cb8a88ef279`；消息 `docs: establish competition evidence policy and prompt archives`；本索引在后续证据归档提交中登记该哈希，不改写基线 |
| 核心链计数 | 0/3；本轮是流程与工具准备，不算应用核心功能链 |

## E001：作者确认与首个真实基线（2026-10-17）

| 字段 | 真实记录 |
|---|---|
| 用户意图 | 提供 GitHub 名称 `LJQZS08` 与 Git 作者邮箱，解除本地提交的身份阻塞；不是远程发布授权 |
| 原始 Prompt 与可见答复 | `prompts/sessions/2026-10-17-git-author-baseline.md` 与同名 JSONL；已刷新为 3 条真实可见消息，`finalCaptured=True`；含实际最终答复 |
| 实际操作 | 仅配置本仓库作者名称与用户提供的邮箱；核对实际 author/committer；补齐 E000 最终答复；审查暂存范围后创建首个本地文档/工具基线 |
| 归档变更 | 本索引登记已经存在的基线哈希；归档本轮作者确认快照；不启动应用、不增加虚构功能或空提交 |
| 实际验证 | 本轮两版 PowerShell 各重跑并通过 14 项检查；核对两组真实 JSONL 全部消息的原文 SHA256；显式暂存文件清单与预期一致；暂存差异检查通过；限定文件中未匹配到所检查的常见凭证模式，但不等于全面安全认证 |
| 基线提交 | `30523e1622322bd44592b87f3c550cb8a88ef279`，`docs: establish competition evidence policy and prompt archives`；真实作者与提交者均为用户提供的身份，使用自然当前时间 |
| 当前归档提交 | 本记录与作者确认快照构成独立证据归档；用 `git log -- prompts/sessions/2026-10-17-git-author-baseline.jsonl` 定位，不为填入提交自身哈希反复 amend |
| 远程与隐私 | 无远程仓库、未 push、未变更 Public/评审权限；Git 作者元数据与本地原始 Prompt 含邮箱，未来发布前须确认公开范围 |
| 剩余缺口 | E001 最终答复已于阶段 0 开始补齐；三条应用核心链仍为 0/3，本轮不计入核心功能迭代 |

## 可复用验证命令

从仓库根目录运行：

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-PromptSnapshot.ps1
pwsh.exe -NoLogo -NoProfile -File .\scripts\Test-PromptSnapshot.ps1
```

当前脚本每个运行包含 17 项检查（E000/E001 当时为 14 项）：开放轮次不冒充已结束、中文原文保持、隐藏/系统消息排除、不隐式覆盖、真实最终答复追加、内部摘要/后续轮次排除、原文哈希、禁止篡改旧消息、拒绝歧义前缀、缺失 Prompt、会话身份、工作区范围、未写完尾行标注、输出路径穿越；另有生成标题尾空白、破折号式内部交接不被当成最终答复及其正文不导出的检查。阶段 5B 在两版 PowerShell 实测各 17/17，见 evidence/stage-5-prompt-tools.json；合成测试对话不能冒充真实参赛链。

测试使用明确标记的合成对话，仅作测试夹具；不作为真实参赛材料。检查目录和生成的测试快照均在本工作区内，用后删除；保留真实 Prompt 证据。

## 快照完整性与下一轮补齐操作

E000 已用下列命令读取真实记录补齐最终答复，共 4 条消息且 `finalCaptured=True`。重复刷新仍只允许追加原文，不推测生成：

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\Export-PromptSnapshot.ps1 -PromptPrefix '**2.1代码仓库与演进记录**' -SessionId '01a146d1-cc80-7722-a40f-28321250bcce' -OutputStem '2026-10-17-codex-policy-update' -Refresh
```

核验输出 `finalCaptured=True`；若最终答复不在原始记录中，则如实标记缺失，采用真实导出/截图/录屏补充，不自行写成“原文”。

E001 已补齐至 3 条真实消息，含最终答复。以下命令为已执行的刷新记录：

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\Export-PromptSnapshot.ps1 -PromptPrefix '[**LJQZS08**]' -SessionId '01a146d1-cc80-7722-a40f-28321250bcce' -OutputStem '2026-10-17-git-author-baseline' -Refresh
```

再核对 `finalCaptured=True`、原文哈希与未覆盖附件；不要把内部交接摘要当成人类 Prompt。

后续每轮使用本轮 Prompt 的唯一真实前缀及新的 OutputStem。若存在附件、图片或录屏，这个文字提取脚本不会替代对应原始媒体；须另外保留。发现公开材料含敏感信息时保留本地原件，提供标明脱敏范围的评审副本，不自动外发。

## 三条核心完整链跟踪

| 链编号 | 对应核心功能 | 人类初始 Prompt | AI 建议/修改 | 真实问题与复现 | 用户实际引导修复 | 回归验证 | 对应提交 | 状态 |
|---|---|---|---|---|---|---|---|---|
| C01 | 算法内核与确定性 | 阶段 2 与自主继续原文已归档 | BFS/A*/二叉堆已实现 | AI 自测失败与脚手架纠正已留原文；非人类引导 | 尚无真实用户引导修复 | 独立 oracle、schema、两版 shell；当前 92 项测试 | 5c3eec6 / 5ade0e8 | 功能已验证；完整链缺用户实际引导，不能计入完成数 |
| C02 | 预测交互、Canvas 与回放 | autonomous-iterations 原文已归档 | 私有轨迹、门控 UI、Canvas/DOM/回放已实现 | AI 自测与工具问题已留证；阶段 5 补充实际屏外焦点回归 | 尚无真实用户引导修复 | 四视口浏览器、DPR/像素/axe、键盘门控 | 572e15d / fd82d8f / f4a43ca | 功能已验证；完整链缺用户实际引导，不能计入完成数 |
| C03 | 学习诊断或反事实复盘 | autonomous-iterations 原文已归档 | 单因素条件实验、本地规则反馈、证据报告已实现 | AI 自测发现两项测试假设错误，另有检查发现 reset 禁用和实际焦点缺陷；角色已区分 | 尚无真实用户引导修复 | 六组合原图/新条件、引用边界、报告历史、四视口流程 | 3b2e9f3 / f4a43ca | 功能已验证；完整链缺用户实际引导，不能计入完成数 |

完整链可以跨多个真实对话与提交，不要求单轮凑齐。AI 自测自修有价值，但不能代替用户真实引导。没有实际 Bug 时不制造 Bug；可以围绕实际失败或明确验收偏差记录迭代，最终是否满足赛事条款须按真实材料核对。

## 后续每轮记录字段

1. 事件编号、日期、模块/核心链编号及本轮目标。
2. 原始 Prompt、AI 可见建议、用户追加约束的文件及消息位置。
3. 实际修改文件、设计决定和验收标准。
4. 问题/复现条件；谁发现、谁运行、谁引导，不混淆角色。
5. 实际检查命令、结果和未覆盖范围。
6. 对应真实提交哈希；没有提交则明确缺口与原因。
7. 当前链状态：规划 / 进行中 / 完整可核对；缺失环节。
8. 重要边界：本地已提交不等于已公开或已授予评审访问。

## 完整收尾待办

- [x] 补齐 E000 规则更新轮次的真实最终答复。
- [x] 补齐 E001 作者确认轮次的真实最终答复。
- [x] 已补齐 E002 阶段 0 最终答复，5 条真实可见消息，finalCaptured=True。
- [x] E003 阶段 1 最终答复已在 E004 补齐，7 条真实可见消息与原文哈希一致。
- [x] 用户提供 Git 作者信息，仅配置本仓库并创建首个真实文档/工具基线：`30523e1622322bd44592b87f3c550cb8a88ef279`。
- [x] 第一轮应用已按工具修复/应用壳保留细粒度本地提交并同步证据索引，最终答复已补齐。
- [ ] 当前自主连续迭代轮次 E005—E009 的真实最终答复待下一轮补齐；尚未落盘的答复不能预写成原文。
- [ ] 应用核心链实际达到 3/3，含真实用户引导、验证与提交。
- [ ] 发布前确认 GitHub 操作并检查密钥/个人信息，核实评审访问权限。

## E002：执行总控提示词的阶段 0（2026-10-17）

- 用户真实要求：专家，请用你的提示词来开始工作。
- 范围：按总控第 16 节只做规格、四个关卡、状态机、事件结构、AI JSON 契约、验收与目录规划。不自动进入完整应用/Canvas/算法阶段。
- 原始证据：prompts/sessions/2026-10-17-stage-0.md 与同名 JSONL；已在 E003 开始补齐至 5 条真实可见消息，finalCaptured=True；只读提取，含真实最终答复。
- 已补齐 E001：3 条消息，finalCaptured=True；上一轮归档提交为 eb8f05e（从当前 git log 可核对）。
- 变更：README；docs 下产品/架构/关卡/状态机/事件/AI/验收/评分证据/验证文档；PathLab-AI 的类型、schema、固定关卡、合成测试、package/lock；本地 npm 环境包装脚本；AGENTS 当前阶段说明与总控提示词中 BFS/封路/A* 事件用语纠正。
- 关键决定：无 UI 不提前安装 Next/React；阶段 0 只使用开发期 TypeScript/Ajv 与 Node 内置测试；新增 A* node_relaxed；算法轨迹与用户会话事件分层；AI 预测后才请求；旧运行只读保留但不适用新地图。
- 验证：类型检查、22 项契约测试在 PowerShell 5.1/7 均通过；锁文件 ci 成功；Prompt 工具在两版各 14 项通过；JavaScript 语法和环境变量恢复检查通过。详见 verification-stage-0.md。
- 真实问题：README 命令转义丢反斜杠；先建立失败断言得到 21 pass/1 fail，修复后 22/22；AI 自查自修，不是用户引导。
- 实际阶段提交：`d870a9f572e897017b08590f4e1d211f6ace8ad8`，`docs: freeze stage zero specifications and validate contracts`。本条哈希由后续证据归档提交登记，不改写已提交历史。
- 核心链状态：0/3；C01/C02/C03 均尚未实现核心模块，本阶段不冒充完成任何完整链。
- 风险：无网页/算法/真实 AI/浏览器或人工验收；图可达性/预测点效果待算法实现核对；赛事细则本轮未复核；未推送远程。工具策略拒绝缓存删除，.cache/npm 与 .cache/tmp 仍在仓库内且被忽略，不能声称已清空。
- 下一阶段：由用户确认后搭建最小 Next/React/TS 应用壳；当前按规则停止。

E002 最终答复现已补齐；不改写阶段 0 提交或其当时的验证范围。

## E003：检查阶段 0 并落地阶段 1 应用壳（2026-10-17）

| 字段 | 真实记录 |
|---|---|
| 用户真实 Prompt | 检查并进行下一阶段 |
| 范围判定 | 依总控分阶段规则，从已提交阶段 0 推进到可运行壳；不擅自扩展算法、Canvas、诊断、存储或远程 AI |
| 上一轮补齐 | E002 已刷新为 5 条真实可见消息，finalCaptured=True；已保留阶段 0 真实提交 d870a9f 与后续证据提交 d4b7e54 |
| 本轮 Prompt 证据 | prompts/sessions/2026-10-17-stage-1.md 与同名 JSONL；本轮开始补齐为 7 条真实可见消息，finalCaptured=True；原文字段哈希复算一致，仍不是原生全量媒体导出 |
| 应用变更 | src/app/ 页面/CSS/元数据/图标；PathLabShell.tsx；固定 missions 数据边界；Next/ESLint/Playwright 配置、精确依赖和严格 TS；四关切换、原始网格、状态边界、键盘与窄屏布局 |
| 保持不变 | contracts/ 与 fixtures/ 无差异；没有搜索结果、用户学习统计、网络 AI 或 local/sessionStorage 持久化；唯一 UI 状态为选择任务，刷新回 L01 |
| 工具与文档变更 | npm 包装器的 D 盘运行边界/严格环境恢复与独立回归；Prompt 内部摘要过滤与回归；README、架构、验收、评分证据、依赖核验和 verification-stage-1.md |
| 验证 | 两版 shell 的 typecheck/lint/原 22 项测试均通过；build 成功；dev/start 首页 HTTP 200；4 视口 × 7 = 28 项生产 Edge 检查通过；Prompt 工具各 17 项、环境恢复 37/49 项通过 |
| 真实问题与修复 | 未用夹具字段的 lint 告警；Node 24 JSON 导入属性缺失；内部摘要误作 final；PS7 缺失变量变空串；快照生成标题末尾空格；均有实际失败/修复/复测；另记录启动参数与收尾检查命令的编写错误，不伪装成用户报告 |
| 发现/引导/执行者 | 均为 AI 自查、自修和自动检查；用户只授权下一阶段，未实际引导 Bug 修复，不计作完整核心链 |
| 视觉与清理 | 三张 D 盘临时图已查看；删除尝试被安全策略拒绝，仍在忽略目录，未绕过；npm/tmp 旧缓存同样保留；node_modules/.next 为运行复用保留 |
| Git 状态 | 工具修复与真实快照：90e64270ae54efa26ab720b5ee2e521717b780a6，fix: preserve prompt boundaries and npm process environment；阶段 1 应用壳：ca4aa7ddeba2c5dd44c6322c1af4f42975e48c26，feat: add responsive PathLab learning shell and fixed mission previews；均为已存在的真实本地提交，本索引由后续证据提交登记，不 amend |
| 证据等级与剩余缺口 | 仅本机 AI 检查；没有真实手机/屏幕阅读器/其他浏览器/用户人工验收；最终答复已由 E004 轮补齐；完整安全审计与最终赛事条款复核未做 |
| 远程与隐私 | 无 GitHub remote、未 push、未更改公开/访问权限；作者邮箱与 Prompt 的公开范围需发布前确认 |
| 核心链与下一步 | C01/C02/C03 为 0/3。本阶段停止；下阶段先独立网格/BFS 确定性与边界测试，验证四图/预测点，不自动接入 UI 回放与 AI |

E004 开始时已用以下命令补齐 E003 的真实最终答复：

~~~powershell
.\scripts\Export-PromptSnapshot.ps1 -PromptPrefix '检查并进行下一阶段' -SessionId '01a146d1-cc80-7722-a40f-28321250bcce' -OutputStem '2026-10-17-stage-1' -Refresh
~~~

已确认 finalCaptured=True、7 条原文哈希与来源；不以本索引或内部摘要代替实际最终答复。


## E004：独立网格/BFS 与证据型教学内容（2026-10-17）

| 字段 | 真实记录 |
|---|---|
| 用户真实 Prompt | 专家，请继续完成并丰富内容优化 |
| 范围判定 | 按总控 Prompt 2 和上一轮约定，只做纯网格/BFS、路径回溯、确定性事件、四关核验和教学备稿；不提前接 A*/Canvas/预测门控/诊断/存储/远程 AI |
| 上一轮补齐 | E003 刷新为 7 条可见消息，finalCaptured=True；逐条 textSha256 复算一致，不改写既有功能历史 |
| 本轮 Prompt | prompts/sessions/2026-10-17-stage-2-bfs.md / .jsonl；本轮从原记录补齐为 6 条真实可见消息，finalCaptured=True，原文哈希一致；不归档内部交接摘要 |
| 核心实现 | src/domain/grid.ts、algorithms/bfs.ts；运行时输入错误、上右下左、FIFO/入队发现、首次 parent、终点选中结束、事件与统计、输出副本 |
| 测试与证据 | grid/bfs/bfs-missions 与独立同步松弛 oracle；inspect-bfs.mjs；docs/evidence/stage-2-bfs.json、stage-2-browser.json、两版 shell 的 check 原始输出；verification-stage-2-bfs.md |
| 内容优化 | teaching-guide.md 的四关提问/提交后解释/反事实复盘/证据不足措辞；README、架构/关卡/事件/验收/评审证据及根规则当前状态 |
| 保持不变 | contracts、fixtures、所有页面/组件/CSS/任务数据入口与 lockfile；无新包/浏览器下载，BFS 与答案 JSON 不导入学习页面 |
| 先测试与真实问题 | 先建测试后执行，原 22 通过，2 个新测试文件因尚无模块而 ERR_MODULE_NOT_FOUND；实现后全部通过。这是待实现能力的红态，不是用户报告的缺陷；未编造 Bug 或用户引导 |
| 算法验证 | 两版 shell 的 typecheck/lint/53 项均通过；128 种 3×3 固定端点障碍布局、25×25 边界；四关八次运行、2,532 个事件 schema 与语义核对；16 个静态 checkpoint 槽可用 |
| 页面回归 | 生产构建通过；4 视口 × 7 = 28/28 Edge 检查，零 skipped/unexpected/flaky，duration=18991.441 ms；不是人工/真机/跨浏览器验收 |
| 教学发现 | L02 封路后最短路径 14→16、扩展 53→52，说明两指标不能混称；L03 8→12 且避开封锁格，仅为 BFS 核验，不冒称 A* 结果 |
| 清理 | 本轮无新检查图。旧 npm/tmp/三张图片的策略拒绝未重试；新生成 .last-run.json 的一次精确删除也被工具策略拒绝，保留于 D 盘忽略目录，不绕过或谎称已清空 |
| Git 状态 | 功能已真实提交 `5c3eec624249ddfe149cf1768658ceabf62ef2ce`；消息 `feat: implement deterministic BFS and evidence-based mission lessons`；本索引在该功能提交之后以独立证据提交归档，不 amend 或哈希自引用 |
| 远程 / 隐私 | 无 remote、未 push/发布/改权限；作者邮箱未来公开与赛事细则、视频/PDF规格仍需另行确认/核实 |
| 核心链 | C01 已有 BFS 核心实现，仍缺真实用户追加约束/引导修复，本轮最终答复已补齐；C02/C03 未实现，完整链仍 0/3 |
| 下一阶段 | 本阶段收口后停止；下次按 Prompt 3 做 A*/确定性优先队列及 BFS 对照，再验证 A* 的 checkpoint；不自动接 UI 或 AI |

E005 开始时已用下列命令从真实记录补齐 E004 最终答复：

~~~powershell
.\scripts\Export-PromptSnapshot.ps1 -PromptPrefix '专家，请继续完成并丰富内容优化' -SessionId '01a146d1-cc80-7722-a40f-28321250bcce' -OutputStem '2026-10-17-stage-2-bfs' -Refresh
~~~

只有实际记录中的最后答复及必要附件齐全，才能将该轮对话标为已补齐；本阶段自动检查不能计作人工验收或完整用户引导链。


## E005：自主连续迭代 — A* 与算法对照（2026-10-17）

| 字段 | 真实记录 |
|---|---|
| 用户真实 Prompt | AI专家继续，有什么问题自行优化，必须确保我的作品优秀，你接下来一直工作就行，不用跟我一一确定 |
| 执行边界 | 最新直接授权覆盖旧阶段停止约定；仍按阶段验收/留证/提交；公开、外发、权限与重要数据删除保留确认 |
| 上轮补齐 | 阶段 2 快照 6 条，finalCaptured=True；保留真实最终答复和原文哈希，不改写既有历史 |
| 本轮证据 | prompts/sessions/2026-10-17-autonomous-iterations.md / .jsonl，当前 3 条可见消息，finalCaptured=False；后续刷新追加真实消息 |
| 范围与实现 | A*/二叉堆、固定 f/h/sequence、Manhattan、strict smaller-g parent 更新、lazy stale 跳过、有效唯一 open 快照；BFS/契约/固定地图不改 |
| 验证 | 73 项，两版 shell type/lint/test 通过；128 种 3×3 与 16,384 种 4×4 障碍图；真实 relaxation/stale 地图；四关对照 3,651 事件/32 checkpoint 槽；生产 build 通过 |
| 内容 | 四关对照 JSON、教师 A* 对照修订、事件具体顺序、验证报告；不把较少节点数当耗时或普遍优越性 |
| 真实工具问题 | Tee-Object 相对输出路径受包装器 Push-Location 影响而指向应用子目录，不存在则失败；改为已验证的 D 盘绝对证据路径后重跑通过；AI 自查自修，不是用户引导缺陷 |
| Git | 功能已提交 5ade0e82ad41cc867ae36f4ccfae8eb755998958；feat: add deterministic A-star heap and verified algorithm comparisons；在下一里程碑登记，不 amend |
| 下一里程碑 | 在当前连续授权下继续学习状态机、门控预测和回放，独立验证后再提交；不接远程 AI |
| 核心链 | C01 算法部分已落地但缺真实用户引导修复；C02/C03 尚未实现；完整链 0/3；不捏造交互或验收 |

## E006：自主连续迭代 — 预测门控与学习会话（2026-10-17）

- 同一真实用户 Prompt；autonomous-iterations 快照持续追加真实可见消息，最终答复尚待落盘；内部交接不归档。
- 实现：LearningSession 私有轨迹、只读复制投影、有效候选最多四个、单次提交/三层规则提示、单步与播放门控、首次统计保护、已完成运行摘要；不依赖 React/DOM/时钟生成/远程 AI。
- 验证：typecheck/零告警 lint/83 项测试在 PowerShell 7 与 5.1 均通过；覆盖六种预定算法组合、128 小图及真实 envelope schema。UI 未改，浏览器未重跑。
- 真实失败：先测试时缺模块是待实现红态；首次 schema 测试错误使用默认 draft-07 Ajv，编译原 2020-12 schema 抛错；改用项目既有 ajv/dist/2020.js 后回归通过。均为 AI 自查自修，不算用户实际引导链。
- 证据：docs/evidence/stage-4-session-{red,check,check-ps51}.txt、stage-4-schema-validator-failure.txt；docs/verification-stage-4-learning.md。
- Git：已真实提交 572e15d8205eb881563459a78804d23c872ed1d5；feat: gate learning predictions and replay behind private search traces；本索引随后登记，不 amend。
- 下一步：将只读投影接到 DOM/Canvas、预测控件、证据检查器与时间线，重新构建并测试四视口；诊断/反事实/存储尚未实现。
- 核心链：C02 已有领域门控实现但无真实用户引导修复；C01 同样缺该证据；C03 未实现，完整链仍 0/3。

## E007：自主连续迭代 — Canvas 与门控学习工作台（2026-10-17）

- 同一真实 Prompt；快照 5 条可见消息、finalCaptured=False，内部摘要不归档。
- LearningWorkbench / GridCanvas / EvidenceInspector / learning.css：预测、规则提示、门控播放/单步、重置、键盘节点检查、已揭示前沿/路径/事件；shell 稳定保留每关会话，刷新丢失诚实提示。
- 本机 AI 验证：两版 PowerShell typecheck/lint/83 项通过、生产 build；Edge 4 视口 × 18 = 72/72，零 skipped/unexpected/flaky，2026-10-17T01:56:47.062Z，105961.264 ms。证据 stage-4-ui-{check,check-ps51,build,browser}.txt / browser.json。
- 未验证真实手机、人工 UX、屏幕阅读器实用性或 Canvas 像素/DPR；不承诺性能/FPS。条件实验/诊断/报告/存储/远程 AI 尚未实现。
- 真实工具失误：PowerShell Write 别名优先于同名函数，文档批处理只打印没有保存；核对 Git 状态后改用明确 UTF-8 文件 API 实际写入并复核。非产品缺陷/用户引导。
- Git：已提交 fd82d8f1abdca0dbfcd54c8fbb1773e27467ca9c；feat: connect gated predictions Canvas and evidence replay to the learning workbench；没有远程发布。C01/C02 缺真实用户引导修复，C03 未实现；完整链仍 0/3。


## E008：自主连续迭代 — 条件实验与本地证据报告领域层（2026-10-17）

- C03；同一真实 Prompt，快照 6 条可见消息、finalCaptured=False。
- session.ts 扩展 experiment/apply/cancel/report；diagnose.ts 确定性行为反馈与引用校验；report.ts 同算法单因素比较/解释证据；reflection.test.mjs 新增 9 项。
- 验证：两版 PowerShell typecheck/零告警 lint/92 项全部通过；六种允许组合原图/新条件的真实内核结果与事件 schema、引用路径、不可达、首次记录和旧摘要保留。未重跑 build/browser，UI 仍属阶段 4B。
- 真实自测：缺新模块的预期红态；初次实现后两项测试假设错误（把可通行格当墙、把“不能证明已经掌握”误作肯定承诺）。用实际 fixture 墙与明确否定断言修复，原失败保留 stage-5-domain-first-check.txt；非用户引导产品缺陷。
- 关键决定：相同地图复用修订身份，重置恢复 fixture revision0，防止重复条件刷首次率；条件实验锁定算法；空解释可出部分报告，有解释必须引用真实当前事实。自由文本不入反馈事实请求，报告不声称掌握/解释正确。
- 证据：verification-stage-5-reflection.md、evidence/stage-5-reflection-red.txt / stage-5-domain-{first-check,check,check-ps51}.txt。无新依赖/图片/浏览器下载。
- Git：已真实独立提交 3b2e9f353f55c5d5a303afa8a445b42dbb0e4c94；feat: add controlled condition experiments and local evidence-based reflection；本里程碑随后登记，不改写历史/外发。C01/C02/C03 均仍缺用户实际引导修复，完整链 0/3。


## E009：自主连续迭代 — 条件实验与证据报告工作台（2026-10-17）

- C02/C03；同一真实用户 Prompt。autonomous-iterations 当前 8 条可见消息、finalCaptured=False；已排除内部交接，不把尚未落盘的最终答复或 AI 自测伪装成人类材料。
- 实现：ReflectionPanel / ReportHistory；LearningWorkbench 接入预设单因素实验、固定算法、重新预测、真实指标对照、本地规则反馈与引用解释报告。重置后历史可查，取消保留同次草稿；刷新仍丢失。shell/README/规格与验收矩阵同步实际边界。
- 实际发现：检查发现已修改 briefing 无法立即 reset；领域保留的旧报告 reset 后缺 UI；额外浏览器实际确认 terminal 标题焦点在屏外，补回归后 mobile-390 真实失败 1/1。修复原生 focus 滚动，四视口回归通过。分别记录发现方式，不伪造用户 Bug 指引。
- 验证：两版 PowerShell 类型/lint/92 项测试、生产 build；最终 Edge 4×31=124/124，零 skipped/unexpected/flaky，startTime=2026-10-17T02:48:20.383Z，duration=264089.577 ms。Canvas DPR1/2/3 的几何/实际橙色像素、响应式重绘，axe/键盘作用域/报告历史/纯文本/无外部请求与存储写入均纳入。
- 证据：verification-stage-5-reflection.md；evidence/stage-5-ui-{first-check,check,check-ps51,build,browser}.txt、stage-5-ui-browser.json、stage-5-focus-{observation,red}.json / red.txt / error-context.md、stage-5-prompt-tools.json（两版 shell 各 17 项导出工具回归）。新查看的 390px 检查图已删除，无新增依赖/浏览器下载；既有拒绝清理项未重试。
- 关键边界：“记录齐备”仅为过程记录，不证明掌握或解释正确；本地规则模板不是远程模型；headless 检查不等于真实手机、屏幕阅读器或人工学习效果。
- Git：阶段 5B 已真实本地提交 f4a43cac7346689d33307e1d8b96d7166979f222；feat: connect condition experiments and evidence reflection reports to the learning workbench。显式暂存 33 个相关文件、暂存范围与清单一致；源码/文档 diff 检查通过，原始证据仅放宽尾空白检查；未匹配到所检查的私钥/GitHub/API token 模式，但不等于全面安全认证。已对实际提交中的 8 条 Prompt 重新计算原文 SHA256，全部一致，保留用户末尾空白。本索引在后续证据提交登记，不 amend/发布。C01/C02/C03 功能已实现，但仍缺用户实际引导修复；完整链 0/3。
- 下一模块优先版本化本地存储、导入导出和安全恢复；远程反馈按证据契约另行评估。对外发布/权限变更仍先确认，最终赛事条款与视频/PDF 待复核。

## E010：用户纠正证据口径 — 本机进度与安全恢复（2026-10-17）

- 真实用户反馈：“这条为什么还不能实现，继续修改与优化。然后我问一下现在的进度到哪里”，针对上一轮“真实用户引导修复完整链仍 0/3”的标注。来源 evidence-correction-storage；当前 5 条可见消息、finalCaptured=False，最后答复待后续原文捕获，不补写。
- 实质纠偏：此前混淆三核心模块已实现/测试/提交与人类引导修复材料缺口，并将内部逐链六步要求用作总进度。更新 AGENTS、README、acceptance 与 progress-status，区分原文摘录、内部口径、真实用户过程纠正和 AI 自测；不宣称官网已核验、不伪造三条应用 Bug 指引。
- 功能：成功命令日志、版本/目录/白名单与容量校验、正常守卫重建；唯一键自动保存，刷新恢复首次结果/提示/报告/修订身份；running→paused，未答仍门控。JSON 下载/预览/确认，原始备份、损坏旧档保护、存储禁用/配额回退、写前跨页改变检测与显式取舍。无新依赖、未改算法/contracts/fixtures/全局 CSS、未接远程模型。
- 真实技术失败：缺模块是计划性红态；TS18046 数组收窄是实现问题；新增 mobile 检查 11/13 中一项是测试标签错误，一项是实际品牌链接可访问名称不含可见文字。修正类型分支/标签并去掉多余 aria-label 后 13/13。全量首次 160/176，四类旧断言仍要求刷新丢失/无存储/唯一 status；改为明确验证恢复、受限键和作用域后全量通过。均为 AI 执行自查，不冒充用户报错。
- 验证：两版 PowerShell 类型/零告警 lint/102 项 Node 测试；生产 build；四视口 176/176 Edge，skipped/unexpected/flaky=0，startTime=2026-10-17T04:22:30.65Z、duration=236600.763 ms。桌面/手机视口临时截图 2/2，AI 已查看；不是人工/真机验收。
- Prompt：上一自主轮补齐 9 条可见消息和真实最终答复。七轮快照共 39 条原文 SHA256 与只读来源行逐一一致，当前轮最终答复仍缺；stage-6-prompt-integrity.json 留存核对。共享同一自主轮的 C01/C02/C03 不冒充三次独立人类追问。
- 证据：verification-stage-6-storage.md、storage.md、progress-status.md 与 evidence/stage-6-* 原始失败/通过日志；不只保留成功结果。JSON 是受限操作备份，不是签名、防作弊或人类证据；跨页检测不保证原子锁；上限 1 MiB/4096 总命令/每关 32 次开始运行，超限不静默裁剪。
- 清理：本轮查看的两张临时图与 stage6-review.temp.spec.ts 删除被工具策略拒绝，仍在 D 盘、未重试绕过；临时 spec 未提交，产品回归明确 grep-invert 排除。既有拒绝清理项仍未动，不报告工作区全清空。
- Git：已真实本地提交 14a7881b685cb420de27ae45dd98d8ea3e0554b2；feat: persist learning progress with validated backups and safe recovery。45 个显式暂存文件与预期清单一致，临时 spec 未入库。源码/文档严格 diff 检查通过；原始证据只豁免行末空白和末尾空行以保留原文，未匹配所检查的常见凭证模式（非全面安全认证）。提交内七轮 39 条 Prompt 的 SHA256 与已核对原文再次一致，见 stage-6-commit-audit.json。本证据索引正常独立提交，不 amend/rebase/squash/发布；无 GitHub remote，未外发/改权限；三核心模块的人类引导 Bug 修复材料仍待据实补全。

## E011：独立 HTML 网站入口（2026-10-17）

- 真实请求：把现有网站地址单独放入 PathLab-AI 文件夹并制作 HTML。只做本机入口整理，不改算法、Next 应用或启动流程，不扩张为离线应用/公网发布。
- 产物：`PathLab-AI/打开 PathLab AI.html`；单文件、UTF-8、中文语义结构与内联样式，无脚本、无外部资源。明确展示 `http://127.0.0.1:3000`，原生链接打开工作台，并给出既有 PowerShell 启动命令；不自动启动服务、不误报连接状态。README 启动部分增加入口位置。
- 本机 AI 验证：`Invoke-WebRequest` 确认现有 3000 服务 HTTP 200/PathLab 标题；在应用目录以 `node --input-type=module -` 使用已有 Playwright、Edge 与 axe 运行入口专项检查。1440/768/390/320 四视口均无页面横向溢出，Tab 焦点和可见焦点框通过，axe 违规 0，入口无外部 HTTP 请求和脚本错误，点击后真实进入 PathLab 应用且 HTTP 200。结果见 `docs/evidence/local-html-entry-check.json`。未重跑完整产品构建/回归，未进行人工、真机或像素视觉验收；本轮未生成截图、下载或新依赖。
- Prompt：补齐上一地址咨询快照 `2026-10-17-preview-address`（2 条，含实际最终答复）；上一证据纠正轮 `2026-10-17-evidence-correction-storage` 已补为 6 条且含最终答复。本轮 `2026-10-17-local-html-entry` 为 2 条真实可见消息，最终答复尚待落盘，下轮必须追加；三个快照共 10 条的原文来源行、角色与 SHA256 均已核对一致。均位于 `prompts/sessions/`，不把内部摘要导出或补写成真实对话。
- Git：本条与 HTML、README、专项验证结果和上述真实 Prompt 更新一起作有意义的本地细粒度提交；提交后真实哈希在下一次演进索引登记，不改写历史。显式暂存，既有 `tests/browser/stage6-review.temp.spec.ts` 不纳入；无 remote/外发/权限更改。
- 边界：HTML 是可独立打开的访问卡片，完整网站仍需本机 3000 服务；不计为新的 C01/C02/C03 核心迭代，三核心功能已有实现，真实人类引导 Bug 修复材料仍待据实补全。

## E012：将错误访问入口纠正为真正完整的离线 HTML（2026-10-17）

- 真实用户纠正：“我的意思是让你把这个网站制作成HTML文件，不是建一个HTML 的访问入口 ，重新修改”。此前 E011 实际提交为 `5e369b54349c5812b296c03f7800732d2bac1dd7`，它只证明入口卡片可用，不能满足本次明确需求；保留当时历史，当前交付取代它。
- 实现：删除旧入口卡片路径，交付 `PathLab-AI/PathLab AI.html`。新增独立 React 入口、TypeScript loader、单文件构建脚本、离线 Playwright 配置与 3 项专项测试；共用既有 PathLabShell/领域算法/fixtures/两份 CSS，不复制重写逻辑，不改原 Next 配置、contracts 或关卡。JS/CSS/icon/运行时许可证均内联，没有外链资源、iframe、CDN、服务依赖或新包。
- 可复用：`build:html` 在 D 盘唯一临时目录构建并清理确切产物；`test:standalone` 先重新生成再对 file:// 执行共享产品检查。共享测试仅增加运行地址选择/严格本地 file: 允许规则，Canvas 的手动 DPR 上下文在该模式显式 offline；原 HTTP 检查仍使用原方式。
- 真实失败与修复：修改前卡片无应用脚本/学习工作台（standalone-before.json）；首次默认 minimizer 缺 Next 内部插件，使用现有 compiled Terser 修复（standalone-first-build.txt）。烟测 3/3 后首次全量是 180/188，不冒充全量通过：4 项顶部说明缺 landmark、4 项旧测试拦 file:；增加有名称 aside 与明确测试守卫后重跑。许可证完整文本已内联。日志相对路径曾被 npm 包装器的临时 cwd 影响，后续均用绝对路径；这是命令留证错误，不冒充产品 Bug。
- 最终验证：两版 PowerShell 类型、零告警 lint、102/102 Node 测试；原 Next 生产构建；四视口断网单文件 188/188；原 HTTP 四视口 176/176，全部无跳过/失败/不稳定。专项实际只复制一个 HTML 到独立 D 盘文件夹及中文文件名，完成 A*；禁用 file-origin 存储仍可预测和 JSON 导出。全部为本机已有 Edge 的 AI 检查，不是用户/真机/其他浏览器验收。
- 产物：330771 bytes；SHA256 `7e3a7ed4b459e82b5c1b97128e1654b5dbd105f838a8b01dcdec6e0a909c2510`；最终重复构建哈希一致。README、AGENTS、progress-status 与 verification-standalone-html 同步真实使用方式和边界。原 HTTP/file 存档不保证互通，移动/改名/换浏览器前应 JSON 备份；Next 内部编译器路径升级需重新验证。
- 证据：`docs/evidence/standalone-*` 保留前态、首次构建失败、首次全量失败、最终构建/两版检查/两套全量原始日志与 JSON。standalone-final-audit.json 保留 15 个原始证据哈希、报告真实计数与产物核对。没有新截图/录屏；本次唯一新建构建/复制临时目录全部清空，归档后清理本轮两个测试输出目录/重复报告，历史拒绝清理项未重试/绕过；原 HTTP 检查改用独立 output 目录避免接触历史拒绝项，未跟踪临时 spec 排除且不提交。
- Prompt：上一 `2026-10-17-local-html-entry` 补齐到 3 条含真实最终答复；本轮 `2026-10-17-standalone-html-correction` 已刷新为 4 条真实用户/AI 可见消息，`finalCaptured=True`，两轮共 7 条角色/来源/原文 SHA256 均核对一致，见 `evidence/standalone-final-audit.json`。已归档的 11 轮快照共 51 条可见消息均有实际最终答复；当前新聊天的最终答复尚未落盘，下一轮先补齐。不导出内部摘要、不预写最终答复。这是真实的包装交付纠正，不复制计作 C01/C02/C03 三条人类功能修复链；三核心实现已有，所需人类修复材料仍有缺口。
- Git：上述相关代码、产物、文档、原始证据与 Prompt 快照的 HTML 功能提交真实哈希为 `4b117292176d36c9d6fe6b5edaea66131ec21a2b`；本轮只补齐真实 Prompt 终态与索引证据，显式暂存并另作有意义的本地证据提交。新证据提交哈希不在本条自引用，将在后续有意义提交中登记；不 amend/rebase/squash。作者沿用用户已确认身份；无 remote、无外发、未发布或改变权限。`tests/browser/stage6-review.temp.spec.ts` 为既有无关未跟踪文件，保持原状，不纳入提交。

## E013：补齐 E012 真实 Prompt 终态与新聊天接续证据（2026-10-17）

- 触发：E012 提交时真实来源尚未写入最终答复，不能把当时的 `finalCaptured=False` 永久当作当前事实；本轮使用 `scripts/Export-PromptSnapshot.ps1` 按唯一真实前缀和只读源文件刷新，未补写原文。
- 证据：`prompts/sessions/2026-10-17-standalone-html-correction.{md,jsonl}` 现为 4 条可见消息、`finalCaptured=True`；`2026-10-17-new-chat-continuity.{md,jsonl}` 现为 2 条真实接续消息、`finalCaptured=True`，后者只是聊天连续性材料，不计作核心功能链。
- 同步：更新 `docs/evidence/standalone-final-audit.json`、`docs/verification-standalone-html.md`、`docs/progress-status.md` 与 E012 索引；未修改应用源码、完整 HTML、算法、测试逻辑或历史证据，既有 `PathLab-AI/tests/browser/stage6-review.temp.spec.ts` 保持未跟踪。
- 验证：刷新脚本返回 2 条/`finalCaptured=True`；JSON 快照与审计文件可解析；HTML 仍为 330771 bytes、SHA256 `7e3a7ed4b459e82b5c1b97128e1654b5dbd105f838a8b01dcdec6e0a909c2510`；变更文档的 `git diff --check` 通过。完整 diff 仅报告原始最终答复中保留的 1 处行末空白，未篡改原文。没有因证据补齐重复运行整套产品回归，也没有人工、真机或其他浏览器验收。
- Git：E012 的功能提交为 `4b117292176d36c9d6fe6b5edaea66131ec21a2b`；本轮仅做证据归档与索引修正，显式暂存，不外发、不推送、不改权限。当前新聊天最终答复在真实记录落盘前仍待下一轮补齐；C01/C02/C03 的真实用户引导修复材料仍不完整。

## E014：地图直接预测与有限动效（2026-10-17）

- Prompt：prompts/sessions/2026-10-17-motion-interaction.{md,jsonl}，真实需求为选择性参考 MotionSites 丰富可玩性；现为 4 条可见消息，最终答复尚未落盘、待下一轮补齐。旧 motion-playability 草稿误含内部摘要，不提交也不计证据。
- 实现：GridCanvas + LearningWorkbench 增加地图候选点选/键盘作答与卡片双向草稿同步，提交门控不变；globals.css 引入有限短动效、精确指针 hover、减少动态覆盖，删除中间版无限装饰与格子缩放。共享源码重新生成完整离线 HTML，不增加依赖或新关卡。
- 验证：最终类型/lint/102 Node 通过；生产构建通过；四视口离线 204/204、HTTP 192/192，均零失败/跳过/不稳定，每套含 12 项正常动效 + 4 项 reduce 专项；静态查看桌面/手机尺寸共四图。这些均为 AI、本机 Edge 检查，不是人类/真机验收。命令、产物 hash、范围及原始日志见 verification-motion-interaction.md 与 evidence/motion-*。
- 真实问题：Prompt 导出器仅过滤英文内部摘要，中文摘要被误当最终答复；新增合成夹具先失败再修复，PowerShell 7/5.1 各 19/19。不复制内部摘要到正式证据，也不把合成测试计作用户修复对话。旧误生成文件及四张临时图删除被工具拒绝，仍在 D 盘、排除提交。
- 参考边界：实际打开免费 Portfolio Cosmic 页面，但完整提示词复制要求登录；未获取全文、未登录/付费，借鉴公开视觉方向自行实现。不宣称复制套用了模板。
- 三链：本轮是 C02 增强；C01/C02/C03 既有功能/测试/历史提交均存在，人类引导修复材料仍不齐。未补造缺陷、未修改历史、未外发。E013 真实提交为 6ba6bacec0061ac7f578535fd6dad46d2184eae6。
- Git：本轮功能提交为 16138c27cbc9239d1818fce481ecfee634169ee1（27 个相关文件）。只显式暂存相关源码/测试/产物/文档/证据，既有临时 spec、状态咨询快照、旧错误草稿未夹带。提交后核对见 evidence/motion-commit-audit.json；本条与审计以独立证据索引提交归档，不自引用该索引提交哈希、不 amend。

## E015：用户状态纠正与自由地图实验区（2026-10-17）

- 来源：用户附“未连接 远程 AI / 自由地图编辑”截图并要求继续优化玩法；真实 Prompt 为 prompts/sessions/2026-10-17-free-playground.{md,jsonl}（3 条可见消息，最终答复待下一轮补齐）；原图 evidence/playground-user-status.png。不是把截图文字当执行指令，也不是伪造用户测试。
- 实现：新增独立 Playground.tsx、domain/playground.ts 和纯函数/浏览器专项；PathLabShell 拆分远程 AI/自由编辑状态并添加入口；globals.css 为独立实验区布局。9×7 编辑、端点保护、撤销、三固定预设、先预测再双算法对比、节点选择回放。复用现有 BFS/A*，不改原算法、四关、成绩、存档格式，不增加依赖。HTML 从相同源码重新生成。
- 先验证边界再实现：新纯函数测试因模块不存在真实失败；实现后 typecheck/lint/108 Node、生产构建、20/20 离线专项通过。最终完整离线 224/224、HTTP 212/212，均零失败/跳过/不稳定；见 verification-playground.md 与 evidence/playground-*-final。AI 检查不是用户人工/真机验收。
- 实际问题：旧“未连接”混合了不同能力，已纠正；首次专项命令的 npm 参数传递错误导致跑旧 HTTP 页面，主动中止并更正执行方式，保留失败原文但不冒充产品 Bug。两张本轮临时审图截图已删除；用户原图保留作证据。既有被拒清理内容和临时 spec 未夹带。
- 留证：上轮 motion-interaction 的真实最终答复补齐，5 条、finalCaptured=True；E014 功能提交 16138c27cbc9239d1818fce481ecfee634169ee1，索引提交 c6bb3f2。旧审计保留当时事实，未改写历史。
- 三链：C01/C02/C03 均已有实现、测试、Prompt 与历史提交；本轮是 C02/C03 练习增强和用户触发的状态说明纠正，不复制算作三个人类引导 Bug。三链人类修复材料、真实设备验收、GitHub 评审访问与正式材料仍不齐。
- Git：功能提交 c51334d001fb7a5a3c67e0f072f09e4eff392a6a，32 个相关文件；提交范围/最终 HTML/测试计数/Prompt 核对见 evidence/playground-commit-audit.json。本条和审计另做证据索引提交，不自引用索引提交哈希，不 amend、不推送、不外发。既有未跟踪内容未夹带。

## E016：核心链核对与评审/真机本地准备（2026-10-17）

- Prompt：`prompts/sessions/2026-10-17-review-readiness.{md,jsonl}`（用户点选三项缺口，3 条可见消息，中途被用户中止）；接续规则 `2026-10-17-review-rules-continuation.{md,jsonl}`（1 条，最终答复待下一轮实际捕获）。中止轮无最终答复，不推测补齐。
- 产出：core-chain-evidence.md、review/ 说明/待测表/授权清单、白名单体验包生成和完整性校验工具、合成工具回归、源 Prompt/提交只读核对脚本；同步当前矩阵/进度/README/AGENTS，不改应用、算法、HTML 或历史日志。
- 真实用户纠正：完整 HTML 而非访问入口的 U01 已单独链接原文→错误产物→用户指引→修复→失败/成功回归→提交。不复用同一链凑 C01/C02/C03 的人类引导证据，也不要求人为制造 Bug。
- 验证：两版 PowerShell 各 11/11 包工具合成检查；11 份快照 44 条原文/哈希、9 个历史提交核对通过；解压后单文件四视口离线专项 32/32，零失败/跳过/不稳定。完整命令/包 SHA256/证据范围见 verification-review-readiness.md。
- 实际问题：临时浏览器配置 ESM 解释失败，修正配置后 32/32。原失败输出保留，不冒充应用缺陷或人类修复。旧当前矩阵过期状态已纠正，历史报告不改写。
- 留证：E015 与远程 AI 咨询的真实最终答复已补齐；原中止咨询仅问题，缺失明确标记。正式 ZIP 不含原始聊天/密钥，原 Git 历史的邮箱/路径信息在外发前仍须用户确认。
- 边界：仍无 GitHub remote/评审访问验证、无真机/人工/屏幕阅读器验收；本轮完成的是准备和核对，不宣布三项全部完成。合成测试残留已清理；浏览器解压检查目录清理被工具拒绝，留在 D 盘且不提交。
- Git：实现/材料提交 `c15d4a02757825ff96bc41e247756c1d92e29940`，35 个显式暂存文件；提交复核见 `evidence/review-readiness-commit-audit.json`。不包含旧临时 spec、错误 motion-playability 草稿、状态咨询材料或生成 ZIP，不推送/不改写历史。本索引与复核另作证据提交，不自引用。

## E017：可选 DeepSeek 证据复盘（C03 后续增强）

- 用户真实要求：选定 DeepSeek，继续落实“有证据的 AI 复盘”，不是开发通用聊天。原文 `prompts/sessions/2026-10-17-deepseek-integration.md` / `.jsonl` 当前 4 条可见消息，最终答复待补齐。E016 规则接续最后答复已从原始来源补齐，未篡改旧审计结果。
- 修改：`src/server/deepseek.ts`、`src/app/api/feedback/route.ts`、共享 `feedback-validation.ts`、`RemoteFeedback.tsx` 与复盘挂载；模板/依赖分类、明确的本地存档边界、完整 HTML 标记与重建；测试、配置指南和当前状态同步。算法/评分/存档协议/自由地图逻辑不变。
- 验证：两版 PowerShell type/lint/147 Node；生产构建与单 HTML；HTTP 228/228、离线 240/240，最终服务端分类调整后专项 16/16；11 个浏览器产物服务端信息边界检查；1440/320 AI 视觉检查。证据与真实范围见 `docs/verification-deepseek.md` 和 `docs/evidence/deepseek-*`。
- 自查改进：网络异常单独归类为服务商不可用、访问口令配置长度与 UI 上限对齐；不是用户报告的缺陷。所有模型输出为模拟；无真实凭证、无付费请求、无用户学习数据外发。
- 配置默认为关；本地 `.env.local` 仅由空模板创建并被 Git 忽略。当前只适合受控本机/单实例演示，进程限额不是人民币上限。C01/C02 原状态不变，C03 本地闭环保留并增加可选远程补充；官方/人类/真机/评审访问缺口未隐去。
- Git：本条先记录真实模块与验证，功能提交后再以独立证据归档登记实际哈希；不改写历史、不推送，既有未跟踪文件不入提交。

E017 实现提交已核对：`d235a91514014c10ed4ef68733f8a6536080c0ee`，43 个显式暂存文件；不含本地私有配置、旧临时 spec、错误 motion-playability 草稿或旧状态咨询。复核见 `docs/evidence/deepseek-commit-audit.json`。本段与复核文件作为独立证据归档提交，不自引用，不 amend。

## E018：无需密钥的网页辅助复盘与界面优化（C03 后续增强）

- 真实要求：用户确认以网页辅助替代强制 API 配置，并要求丰富功能、优化界面与流畅性；`prompts/sessions/2026-10-17-web-review-workbench.{md,jsonl}`。此前配置教学、网页替代咨询与 E017 最终答复均已补齐，本轮最终答复待下一轮真实捕获。
- 产出：纯本机提示生成器、三种复盘方向/两种风格、匹配本次运行才开放的条件对照、可预览复制与手动回退、固定官方外链；复盘区统一视觉/步骤引导/移动堆叠/键盘与有限动效。API 保留在折叠进阶区，既有算法/规则/存档/自由地图未修改，无新增依赖。
- 问题与修复：先建立缺模块失败检查；测试指出无条件对照时仍在说明中提 C1，改成按真实对照提供引用编号；剪贴板自查加入不重叠写入及卸载/过期结果丢弃，补充 hooks lint 修正；PowerShell 包装脚本转发 `--config` 的一次命令失败改用显式 `-NpmArguments` 数组。均为 AI 自测自修，不冒充人类报告 Bug。
- 验证：最终命令、计数、真实日志与 HTML hash 统一见 `verification-web-review.md`；实际截图在检查后删除，仅保留测量/检查日志。测试不调用官方聊天/付费 API，不读取真实密钥。
- C01/C02 状态保持，C03 增加可选网页协作。网页辅助不等同站内模型集成，不把打开网页记为复盘完成；评审访问、官方要求、真人/真机与三链人类材料缺口未隐去。
- Git：验证通过后显式暂存本轮文件并创建本地功能提交；实际哈希由后续证据索引提交登记，不自引用、不 amend、不发布，既有无关临时 spec/错误 Prompt/旧状态快照不入库。

E018 实现提交已核对：`ce566d2c877f11f1ae29a8fb7e7a98ff517c477a`，44 个显式暂存文件；两版 shell 类型/lint/155 Node、HTTP 260/260、离线 272/272 均通过。复核与本轮冗余检查缓存清理记录见 `docs/evidence/web-review-commit-audit.json`。不含私有配置、旧临时 spec、错误草稿或旧状态快照；无推送。本段与复核另作证据索引提交，不自引用、不 amend；当前最终答复仍待下轮真实捕获。

## E019：官方赛道规则与提交缺口审计

- 用户真实要求：按 `https://www.boxuegu.com/matchTrack/detail/?id=10039` 规则检查当前还有哪些缺项；Prompt `prompts/sessions/2026-10-21-official-submission-audit.{md,jsonl}`，本轮最后答复待下一轮补齐。E018 最终答复已从真实来源补齐为 5 条可见消息。
- 实际核对：AI 只读浏览公开页面的渲染文本，确认托管平台/历史、三次核心完整 Prompt、10 分钟指南、MP4 5–8 分钟/1080p/至少 2 分钟协同、PDF 至多 30 页及主题；保留官网阶段/时间表述待澄清，不编造截止时刻或登录个人中心。
- 本地事实：审计前 30 个细粒度提交，初始基线不含完整应用；remote 为 0；工作区排除生成/依赖后未找到视频/PDF；旧体验 ZIP 哈希与当前 HTML 不同。重跑 Test-CoreEvidence：11 份/45 条真实可见消息、9 个祖先提交核对通过；不是原生完整导出，也不证明逐链人类 Bug 材料齐备。
- 产出：`docs/submission-audit-2026-10-21.md`、三份 `docs/evidence/submission-*-20261021.json`；README 增加可演练但未计时的 10 分钟源码流程与模板说明，纠正过期测试数量；progress-status/core-chain/access-checklist/AGENTS 同步官方核验状态。
- 边界：C01/C02/C03 实现状态保持，未改源码/HTML/私有配置，未重新执行功能回归，未登录/付款/上传/发布。官网不统一强制接 API、公开网站部署或固定次数真机；不把内部各链独立新报 Bug 口径冒充原文。账号资格/缴费/组别、最终阶段通知、材料实际上传回执仍未知。
- Git：文档和真实 Prompt/证据验证后显式暂存提交；真实哈希随后登记，不自引用、不 amend，不夹带旧临时 spec/错误草稿。

E019 收尾验证（AI，2026-10-21）：两版 PowerShell Prompt 工具各 19/19，E018 与本轮新增快照原文/角色/哈希匹配；14 项文档证据一致性检查通过，结果存于 docs/evidence/submission-validation-20261021.json。本轮最终答复尚待写入后补齐。

E019 实际文档提交：`06fd98aacd0430d276e91a37cd0cce377f6786b4`（`docs: audit official competition submission requirements`），17 个规则/审计/README/证据/Prompt 文件，未提交应用源码、私有配置或既有 5 个无关未跟踪文件。基线 83a6dee 为其祖先；本地提交不代表上传，remote 仍为 0。提交范围复核见 docs/evidence/submission-commit-audit-20261021.json。该索引由后续独立归档提交纳入，不改写已有提交。

## E020：GitHub 发布与源码复现（2026-10-25）

### E020a：先复现并修复 Windows 单文件构建字节差异

- 用户真实要求：完成 GitHub 创建/上传、演进与 10 分钟复现材料；原始 Prompt 见 prompts/sessions/2026-10-25-github-{publication,upload-retry,create-reproduce}.{md,jsonl}。前三轮审计/上传最终答复已补齐；本轮最终答复未写入前不伪造。
- 基线：main 的 44b4ef24f39158c50229e96dd7ef048922dc1025，32 个真实提交，初始 30523e1 仅 8 个规则/Prompt/工具文件、不含完整应用。用户通过官方设备授权后核对 ljqzs08，创建 Public ljqzs08/PathLab-AI 并配置 origin；此子阶段尚未推送。此前原生浏览器安全停止不绕过，未提取浏览器会话。
- 复现：仅在 D 盘工作区新建独立 Git 检出，无复制依赖/.next/.env.local，使用新 npm 缓存；ci 44.611 秒；计时开始至 L01 预测→20 次推进→本地复盘为 342.113 秒（含等待，不含事前本地 clone/环境安装/公网下载），AI 无头 Edge，不是人工或干净电脑验收。类型/lint/155 Node、生产构建和 HTTP260/260 均重新通过。
- 实际失败：Windows Git 检出 CRLF 导致重新生成 HTML 为 730cdf...，与既有 Git blob 8f481d... 不同；AI 发现而非用户报告 Bug。旧工作副本 18d043... 也含两字节换行差异，历史报告保留原测量，不重写。
- 最小修复：.gitattributes 固定文本检出 LF；build-standalone.mjs 只对嵌入 CSS/SVG 换行归一化。混合换行工作区与 CRLF 检出均生成同一 501850 字节 HTML，SHA256 8f481dcdd4870ee9d9ab11b024f0d20d030c27cefcf89ce8f657efa83111a1d0，与既有 Git blob 完全一致。没有修改算法/界面/存档或私有配置，不新增依赖。
- 验证证据：docs/evidence/reproduction-line-endings-{before,after}-20261025.json；reproduction-html-{,crlf-}build-20261025.txt。修复前离线 272/272 已通过，修复后的完整四视口回归独立执行，结果完成后再归档，不提前填写。
- Git：本子阶段仅显式暂存构建/LF、失败与修复证据、真实 Prompt 和演进记录；不夹带既有临时 spec/错误草稿，不 amend 或改写历史。实际哈希由后续文档提交登记。
E020a 实际提交：6455c846fb543f537cdf725cff88a4b80d70f94c（fix: make offline HTML reproducible across Windows checkouts）。修复后的完整离线回归已实际完成：272/272，零失败/跳过/波动，见 docs/evidence/publication-offline-20261025.json。

### E020b：README、真实演进索引与 GitHub 上传材料

- 用户本轮再次明确要求完成 2.1/2.2 上传；真实快照 prompts/sessions/2026-10-25-github-final-upload.{md,jsonl}，最后答复尚未落盘，不伪造。创建轮的中止后暂停答复单独补录并核对源行，原 5 条快照不改写。
- 材料：README 的 D 盘 clone/环境/锁定依赖/变量模板/10 分钟流程、docs/reproducibility.md、prompts/README.md、三链与进度/访问/规则说明、本轮真实日志与 docs/verification-github-publication.md；纠正旧“本轮未重跑”的过期表述，不夹带既有 5 个无关残留。
- 验证：独立源码类型/lint/155 Node、build、HTTP 260/260、修复后离线 272/272；Prompt 工具双 PS 各 19；npm 工具 PS7 49/PS5.1 37。实测与边界均按真实日志归档，无人工/真机冒称。
- 本地初始并非全功能一次提交；完整细粒度历史将正常推送到已获授权的 Public ljqzs08/PathLab-AI。实际材料提交、推送和匿名访问在完成后按 docs/evidence/github-publication-20261025.json 登记，不提前称成功、不自引用、不改写历史。
- 三链功能/证据索引存在，部分共享连续会话；人类引导修复材料及视频/PDF/正式提交仍分列。最终答复须下一轮实际补齐。

E020b 实际材料提交：**1c10e32fb1a28bd56b72ac864f5ca648635743a8**（docs: publish reproducible setup and authentic AI evolution evidence），36 个文件。完整 34 次历史已正常推送至 Public https://github.com/ljqzs08/PathLab-AI ，无凭证 clone 与匿名 API/网页验证通过，远端 main 与本地材料提交一致，源码/Prompt/模板/锁文件/HTML 存在。

### E020c：真实发布结果归档

- 补录主材料提交与匿名访问快照：不带 Authorization/Cookie；clone 清空 helper/extraHeader、禁止交互；34 次历史逐个匹配，9 个关键阶段加本轮换行修复均保留。实际证据 docs/evidence/github-publication-20261025.json。
- 上传前重扫全部 34 次历史与本轮材料，无启发式凭证/私有路径/内部摘要匹配；此结论不等于正式安全审计。原 Prompt/真实工具日志空白原样保留，非证据文件无空白问题。文档/JSON/本地链接、6 份快照原文/哈希已核对，最后答复仍待真实落盘。
- 本归档是有实际验证内容的独立提交，不为凑演进次数，不自写自身哈希。归档后正常推送并再次核验远端，不 amend 或 force；三条核心链真实边界与视频/PDF/正式提交未完成状态保留。
- 清理本轮临时克隆和下载归档被工具策略拒绝，未绕过；均在 D 盘被忽略缓存且未上传。官方 CLI 的临时凭证退出安排在最后推送后，结果另按实际执行报告，不提前称完成。

## E021：真实 Prompt 完整迭代选编（2026-10-25）

- 用户原文：“AI对话历史导出的Prompt历史快照: … 这个如何完成，你帮我完成”。真实当前轮 `prompts/sessions/2026-10-25-prompt-chain-package.{md,jsonl}`；最终答复尚未落盘，照实待补，不加入完成轮 ZIP。上一上传轮最终答复已原文补齐为 6 条。
- 读原会话与已有快照后发现：三核心模块有完整可见开发原件，但 C01 A*/C02/C03 共用自主连续轮。采用逐模块导引 + 单份共享原件；用户明确 HTML 纠正 U01 独立列出，S02 API→网页复盘方向调整另列，不能编造三次用户算法 Bug。
- 补提取起始方案原文轮、原粘贴附件（源与副本 SHA256 一致），形成 9 份完成轮、38 条去重消息、10 个历史提交的交付选编。不是截图/原生全量导出，不提取隐藏推理、系统/开发者规则、工具载荷、内部交接或凭证。
- 变更：`prompts/submission/` 入口/5 项导引/机器映射/附件；`scripts/Export-PromptEvidencePackage.ps1`、`Test-PromptEvidencePackage.ps1`；扩展 `Test-CoreEvidence.ps1` 来源完整性检查；根 README/AGENTS、Prompt/核心/进度导航及 `verification-prompt-evidence.md`。
- 验证：作者侧 16 份/61 条与 11 个祖先提交通过（选编 9 轮均完整）；两版 PowerShell 包工具各 9 项、提取工具各 19 项通过。包以白名单直接写入 D 盘 delivery，原始失败与通过日志保留；当前轮没有修改应用或重跑产品功能。
- 临时合成损坏包与生成目录均按确切本轮路径清理，没有生成图像，不碰历史拒绝清理项。旧 HTML stat 假脏与 5 个未跟踪残留不夹带提交；新增材料先本地验证/正常细粒度提交，不改写历史，不把 E020 远端访问快照当作本轮已上传。实际提交哈希在提交后据实登记，不自引用。
- 内容里程碑已正常提交：`9ca1ffcb096bf714ed2bcfcb1aa6da89d9c53ab7`（30 个显式暂存文件）；未夹带旧 HTML 假脏或未跟踪残留。
- 基于该提交生成最终 `delivery/PathLab-AI-Prompt-evidence-20261025-093233.zip`，SHA256 `8f9d5e888574bf50f000aef2a762b20b99fbe76ff0e47709dfe3c9d4d36a542c`。57 个内容文件 / 58 个 ZIP 条目，双 PowerShell 重开一致性通过，包内 67 个导引链接均存在，禁用路径/常见凭证模式无匹配。真实最终报告独立归档，不以旧的 09:27 测试包结果代替。
- 本轮新增材料没有执行推送；既有 D 盘 GitHub CLI 配置现场检查未登录，不能把旧公开仓库的访问证据冒充为这些新文件已经上线。归档提交只记录此内容提交与最终 ZIP 结果，不进行哈希自引用。
