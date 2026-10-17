# 阶段 6：本机进度、JSON 备份与安全恢复实际验证

日期：2026-10-17。执行者：AI，通过本机 PowerShell、Node 与已安装 Microsoft Edge。以下是实际执行与日志，不是用户学习记录或人工验收。

## 范围

session.ts 新增成功命令日志与独立 checkpoint；progress.ts 版本化格式、白名单/容量校验和守卫重建；progress-store.ts 单键自动保存、异常与跨页保护；ProgressPanel 提供状态、JSON 备份、先预览再确认导入、原始备份及显式读取/覆盖。Shell/工作台/历史报告同步保存与恢复，新增局部 CSS，不改 fixtures/contracts/算法/全局样式或引入依赖。

安全语义与限制见 storage.md；功能/材料进度分开见 progress-status.md。当前用户反馈属于证据口径纠偏，下面所有技术失败均由 AI 执行时发现，不能冒充用户 Bug 指引。

## 原始失败与归因

| 留存证据 | 实际结果与归因 | 处理 |
|---|---|---|
| stage-6-storage-red.txt | 新测试先引用尚不存在模块，预期红态；92 项既有测试仍过 | 实现模块；不把计划性红态叫人类发现的 Bug |
| stage-6-domain-first-check.txt | TypeScript TS18046：解释引用数组校验后未正确收窄 | 无效分支 return fail()，恢复精确类型 |
| stage-6-storage-browser-first.{txt,json} | mobile-390 新增存档用例 11/13；一项错用“播放速度”而真实标签为“回放速度”；另一项 axe 发现品牌链接可访问名称没有覆盖可见文字 | 修正测试标签；去掉多余 brand aria-label，使名称包含可见内容 |
| stage-6-label-red-context.md | 上述真实 axe 失败的原始上下文 | 原文留存，不把报告内工具建议当用户 Prompt |
| stage-6-storage-browser-fix.{txt,json} | 同视口新增用例 13/13 通过 | 再进入完整回归 |
| stage-6-ui-browser-first.{txt,json} | 完整回归 160 通过 / 16 失败；四视口各四个旧断言不适用于新增存档 | 详见下文；未回退存档功能、未跳过失败测试 |

16 个失败源自四类旧测试预期：刷新后首次统计 0/0；报告刷新回 briefing；localStorage 必须为空；新增存档 role=status 后选择器不再唯一。改为精确验证恢复的首次 1/2 与两次完整运行、保留报告文本/状态、只有受限键、工作台内的播报。仍检查键盘焦点、axe、网络、预测门控与不可执行文本；存储禁用的旧用例保留并增加明确失败状态断言。

## 最终已通过

1. PowerShell 7：run check → Next 类型生成、tsc、ESLint 零告警、**102/102** Node 测试。
2. Windows PowerShell 5.1：同样 **102/102**，零失败/跳过。
3. run build：生产静态页面构建成功；品牌修复后重建，浏览器检查针对此生产构建。
4. Edge 产品浏览器回归：**4 视口 × 44 = 176/176**，expected=176、skipped=0、unexpected=0、flaky=0。JSON startTime=`2026-10-17T04:22:30.65Z`，duration=`236600.763 ms`。
5. 桌面 1440 与手机视口 390 的临时截图用例 2/2，生成图实际由 AI 查看；新增面板、导入预览与布局没有发现明显重叠或溢出。不等于真实设备验收。

日志位于 docs/evidence/：stage-6-domain-check.txt、stage-6-ui-{first-check,check,check-ps51,first-build,build,browser}.txt、stage-6-ui-browser.json、stage-6-visual-review.txt。失败和通过日志都保留，不改写首次结果。

实际产品回归命令（仓库根目录；临时截图 spec 排除在产品数量外）：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','check')
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-ProjectNpm.ps1 run check
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','build')
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run','test:browser','--','--grep-invert','temporary stage 6 visual review only')
~~~

包装器仍将项目 TEMP/TMP、npm/Playwright/XDG 缓存限制在工作区。没有新增依赖、远程图片或浏览器下载。

## 覆盖的恢复与保护行为

- 全部六种允许关卡/算法：未答预测、提示和首次错误作答在刷新后保留；未揭示结果不会通过存档进入页面。
- running 恢复为 paused，已揭示计数与回放速度一致；不得跳过预测。counterfactual 恢复 reflection；草稿不保存。
- 条件图、修订/重试身份、已生成报告/解释/引用与历史跨 reset/refresh 重建。
- JSON 下载内容、先预览/取消/确认再导入；损坏/过大/未知版本/多余字段/伪造指标/非法重放拒绝且现存进度未改。
- 损坏浏览器原文保留并可备份；覆盖/重新读取明确确认，取消不覆盖；不写其他键。
- 禁用存储、配额失败仍可进行核心交互，提示仅内存；检测另页写入后暂停自动保存，显式读取/覆盖。
- 原有确定性/门控/条件/报告/Canvas DPR1/2/3 实际像素、响应式/键盘/axe/网络用例全量通过。

## 尚未验证或不保证

- 无人类、真实手机、屏幕阅读器、其他浏览器、干净机器或教学效果验收；自动 axe 不等于完整无障碍认证。
- JSON 不签名、不认证用户，不证明操作由真人完成；目录标识仅兼容性比较。跨页检测非原子锁，不保证同时竞争的强一致性。
- 1 MiB/4096 命令/每关 32 次开始运行上限；超限明确失败并保留旧档，不自动截断。无无限历史/版本迁移/云同步。
- 未接远程模型/自由地图编辑，无 GitHub 发布、评审访问与正式视频/PDF。官方页面本轮未取得可核对正文，不声称最新赛规/期限已验证。
- 清理 desktop-1440.png、mobile-390.png 与 stage6-review.temp.spec.ts 的操作被工具策略拒绝，未成功删除、未重试绕过；文件仍在 D 盘。临时 spec 未纳入提交，普通本机 test:browser 会发现它，产品回归显式排除。既有拒绝清理项也未动。

## Prompt 与 Git

本轮原文见 prompts/sessions/2026-10-17-evidence-correction-storage.{md,jsonl}；上一自主迭代轮已补齐实际最终答复（9 条可见消息）。本轮最终答复待后续只读捕获，不把此验证报告或内部摘要冒充对话。模块通过后进行正常本地提交，真实哈希在 evolution-log.md 登记，不重写既有提交。

已完成本地功能提交：14a7881b685cb420de27ae45dd98d8ea3e0554b2；45 个相关文件显式暂存。提交内 39 条真实 Prompt 哈希再次核对通过，记录在 evidence/stage-6-commit-audit.json；源码/文档严格差异检查，原始日志的行末空白与末尾空行保持不变。该哈希由后续独立证据索引提交记录，不改写功能提交。
