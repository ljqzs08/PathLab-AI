# 开发演进与参赛证据索引

更新日期：2026-10-17。事实来自本轮真实操作，不补造之前的代码、提交、缺陷或用户追问。

## 当前状态

- Git 仓库根目录：本工作区；应用目录：`PathLab-AI/`，不另建嵌套仓库。
- 分支为 `main`；文档/工具基线已真实提交：`30523e1622322bd44592b87f3c550cb8a88ef279`，只包含当时已有规格、规则与归档工具，不包含未来应用功能。没有远程仓库。
- 2026-10-17 用户提供作者名称 `LJQZS08` 与邮箱；已仅在本仓库配置 `user.name` / `user.email`，并核对实际作者与提交者身份。保留仓库级 `user.useConfigOnly=true`；未更改全局配置、伪造身份或倒填时间。
- 阶段 0 已冻结规格；阶段 1 应用壳继续保留；阶段 2 的 BFS 与阶段 3 的 A*/二叉堆、可复现事件与四关对照已通过本机 AI 检查，尚未接入页面。预测/Canvas、诊断、存储或真实 AI 未实现，不是最终参赛作品。E000—E004 最终答复均已补齐；E005 的本轮最终答复待下一轮补齐。
- 阶段 1 应用提交：`ca4aa7ddeba2c5dd44c6322c1af4f42975e48c26`；工具修复：`90e64270ae54efa26ab720b5ee2e521717b780a6`；阶段 1 证据索引：`f6994513aa362fd0152a92babdfdfb5275e78f60`。阶段 2 提交按 E004 登记，不改写历史。
- 未创建或推送 GitHub 仓库，未更改 Public 或评审权限；这些操作需用户明确确认。

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

每个运行包含 14 项检查：开放轮次不冒充已结束、中文原文保持、隐藏/系统消息排除、不隐式覆盖、真实最终答复追加、内部摘要/后续轮次排除、原文哈希、禁止篡改旧消息、拒绝歧义前缀、缺失 Prompt、会话身份、工作区范围、未写完尾行标注、输出路径穿越。

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
| C01 | 算法内核与确定性 | 未开始 | 未开始 | 未发生 | 未发生 | 未开始 | 无 | 规划，不能计入完成数 |
| C02 | 预测交互、Canvas 与回放 | 未开始 | 未开始 | 未发生 | 未发生 | 未开始 | 无 | 规划，不能计入完成数 |
| C03 | 学习诊断或反事实复盘 | 未开始 | 未开始 | 未发生 | 未发生 | 未开始 | 无 | 规划，不能计入完成数 |

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
- [ ] 下一轮补齐 E003 阶段 1 最终答复。
- [x] 用户提供 Git 作者信息，仅配置本仓库并创建首个真实文档/工具基线：`30523e1622322bd44592b87f3c550cb8a88ef279`。
- [x] 第一轮应用已按工具修复/应用壳保留细粒度本地提交并同步证据索引；本轮最终答复仍单独待补。
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
- Git：本里程碑按显式范围提交；哈希由下一有意义提交登记；没有远程发布。C01/C02 缺真实用户引导修复，C03 未实现；完整链仍 0/3。
