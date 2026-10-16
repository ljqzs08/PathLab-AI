# 开发演进与参赛证据索引

更新日期：2026-10-17。事实来自本轮真实操作，不补造之前的代码、提交、缺陷或用户追问。

## 当前状态

- Git 仓库根目录：本工作区；应用目录：`PathLab-AI/`，不另建嵌套仓库。
- 分支为 `main`；文档/工具基线已真实提交：`30523e1622322bd44592b87f3c550cb8a88ef279`，只包含当时已有规格、规则与归档工具，不包含未来应用功能。没有远程仓库。
- 2026-10-17 用户提供作者名称 `LJQZS08` 与邮箱；已仅在本仓库配置 `user.name` / `user.email`，并核对实际作者与提交者身份。保留仓库级 `user.useConfigOnly=true`；未更改全局配置、伪造身份或倒填时间。
- 已启动阶段 0：产品规格、固定关卡、状态机、事件/AI 契约和检查工具；尚无可运行应用。E000/E001 最终答复均已从真实记录补齐；E002 当前轮次最终答复待下一轮补齐。
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
- [ ] 下一轮补齐 E002 阶段 0 最终答复。
- [x] 用户提供 Git 作者信息，仅配置本仓库并创建首个真实文档/工具基线：`30523e1622322bd44592b87f3c550cb8a88ef279`。
- [ ] 第一轮应用开发起持续进行细粒度提交与同步证据归档。
- [ ] 应用核心链实际达到 3/3，含真实用户引导、验证与提交。
- [ ] 发布前确认 GitHub 操作并检查密钥/个人信息，核实评审访问权限。

## E002：执行总控提示词的阶段 0（2026-10-17）

- 用户真实要求：专家，请用你的提示词来开始工作。
- 范围：按总控第 16 节只做规格、四个关卡、状态机、事件结构、AI JSON 契约、验收与目录规划。不自动进入完整应用/Canvas/算法阶段。
- 原始证据：prompts/sessions/2026-10-17-stage-0.md 与同名 JSONL；当前 4 条真实可见消息，finalCaptured=False；只读提取，本轮最终答复待下一轮补齐。
- 已补齐 E001：3 条消息，finalCaptured=True；上一轮归档提交为 eb8f05e（从当前 git log 可核对）。
- 变更：README；docs 下产品/架构/关卡/状态机/事件/AI/验收/评分证据/验证文档；PathLab-AI 的类型、schema、固定关卡、合成测试、package/lock；本地 npm 环境包装脚本；AGENTS 当前阶段说明与总控提示词中 BFS/封路/A* 事件用语纠正。
- 关键决定：无 UI 不提前安装 Next/React；阶段 0 只使用开发期 TypeScript/Ajv 与 Node 内置测试；新增 A* node_relaxed；算法轨迹与用户会话事件分层；AI 预测后才请求；旧运行只读保留但不适用新地图。
- 验证：类型检查、22 项契约测试在 PowerShell 5.1/7 均通过；锁文件 ci 成功；Prompt 工具在两版各 14 项通过；JavaScript 语法和环境变量恢复检查通过。详见 verification-stage-0.md。
- 真实问题：README 命令转义丢反斜杠；先建立失败断言得到 21 pass/1 fail，修复后 22/22；AI 自查自修，不是用户引导。
- 实际阶段提交：`d870a9f572e897017b08590f4e1d211f6ace8ad8`，`docs: freeze stage zero specifications and validate contracts`。本条哈希由后续证据归档提交登记，不改写已提交历史。
- 核心链状态：0/3；C01/C02/C03 均尚未实现核心模块，本阶段不冒充完成任何完整链。
- 风险：无网页/算法/真实 AI/浏览器或人工验收；图可达性/预测点效果待算法实现核对；赛事细则本轮未复核；未推送远程。工具策略拒绝缓存删除，.cache/npm 与 .cache/tmp 仍在仓库内且被忽略，不能声称已清空。
- 下一阶段：由用户确认后搭建最小 Next/React/TS 应用壳；当前按规则停止。

下一轮先从原始会话刷新 E002：

~~~powershell
.\scripts\Export-PromptSnapshot.ps1 -PromptPrefix '专家，请用你的提示词来开始工作' -SessionId '01a146d1-cc80-7722-a40f-28321250bcce' -OutputStem '2026-10-17-stage-0' -Refresh
~~~
