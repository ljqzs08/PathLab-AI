# E038：让独立 HTML 的辅助复盘可发现、可操作

日期：2026-11-15。执行者：AI。本轮只增强作者指定的 `D:\竞赛\PathLab_AI_v4_optimized_final.html`，不重建 Next 应用，不更新旧交付包，不上传 / push / 付费调用。

## 真实问题与修改前复现

作者指出首页说明「DeepSeek 网页辅助：本机整理、手动复制提问；站内 API 复盘仍为可选」在文件中没有体现。

实际不是原功能被删：原 `ReflectionPanel` 仅在 `reflection` / `report` 且已有诊断结果时渲染 `WebReview`。AI 用独立浏览器上下文实测：首页操作入口 **0**、首页复盘卡片 **0**、搜索结束前原复盘区 **0**；完成任务搜索后原复盘区可见，预览含真实 `[F1]`。所以本轮修复的是**可发现性与使用路径缺失**，不把原功能重做成假聊天。

- 修改前文件 SHA256：`9c023fa57c263d921ca0db73528b77beacfe5a9a325f951b6e82d6bb7d634874`。
- 修改前浏览器证据：`docs/evidence/web-review-entry-before-20261115.json`。
- 本轮前 Git：`515752b`；原 E037 功能：`39e51b2`；原稿备份提交：`5ddf101`。
- 原稿备份仍为 `output/backups/PathLab_AI_v4_optimized_final.before-ui-20261115.html`，不得覆盖。

## 实现与边界

1. 首页在介绍下方增加可点击的「辅助复盘」卡片；顶部增加跨站常驻「辅助复盘」按钮。
2. 「学习提问」随时可用：认识 A*、g/h/f、绕墙、BFS 与 A* 四种模板，以及循序 / 简明风格。本机确定性生成，可见预览；明确不是运行记录、实验结论或掌握度。
3. 「本次运行复盘」只从当前任务原 `web-review-preview` 读取已经揭示的完整预览，不另造事实或 F 编号；未完成任务时显示三步路径，预览为空且复制禁用。条件对照仍由原组件与原 `hasWebComparison` 门控。
4. 可跳转并聚焦原复盘区，使用原有方向 / 风格选择；返回辅助面板后预览与原组件逐字一致。切换关卡时重新核对，不沿用其他关卡的旧结果。
5. 真实「复制提问内容」、只读预览与「选中全文」手动回退；复制无权限 / API 缺失时仍可操作。内容变化失效旧成功状态；晚到的复制结果不误报新内容已复制。复制不等于发送。
6. 固定官方网页外链保留新标签页与 opener / referrer 隔离。不自动打开、发送或读取外部聊天；网页需要联网，登录与实际外部回答未验证。
7. 可选 API 折叠区明确说明：本离线 HTML **不提供站内 API 请求**。只有带服务端并配置启用的工程版本才可能使用；不要求用户把 API Key 写入 HTML 或前端，不伪装已真实接通。
8. 不改变原八站 / 媒体 / 奶娃 / 算法 / 原课程 / 评分 / 存档；新增强层无网络请求与本机存档写入。没有引入依赖。

## 可复现入口

- 构建：`node --experimental-strip-types scripts/enhance-standalone-ui.mjs`。
- 校验：同一命令追加 `--check`。
- E038 实现：`scripts/web-review-entry.js`、`scripts/web-review-entry.css`；与原 E037 注入在同一增强块，保持原运行时仅六处既有文案纠正，不增加新的原运行时改动。
- 专项：`node scripts/verify-web-review-entry.cjs`。`--probe` 仅用于修改前复现，现不再对新文件覆盖旧证据。
- 原套件复用：三个既有验证脚本支持可选 `PATHLAB_VERIFY_RUN=e038-web-review-entry-20261115`，将本轮证据和缓存另存到 D 盘，默认行为与断言不变，不覆盖 E037 已归档结果。

## 验证

最终文件：**7,127,303 字节**，SHA256 **`7bd7f222529701b1912be5f30f4ea097d8f2205521e6e900d829cd97c03c917a`**。以下完整重跑均针对这个 SHA，而不是较早中间版本。

| 检查 | 实际结果 | 证据 |
| --- | --- | --- |
| E038 新入口专项，1440 / 768 / 390 / 320 四视口 | **312/312**，每视口 78；无页面错误、无自动外发 | `docs/evidence/web-review-entry-20261115.json` |
| E037 原 UI / 零基础练习专项 | **389/389** | `docs/evidence/e038-web-review-entry-20261115-ui.json` |
| 原八站 / 算法交互 / 预测门控 / 存档 / 自由实验 / 复盘 / 完整离线套件 | **316/316**，每视口 79，无跳过、失败或 flaky | `docs/evidence/e038-web-review-entry-20261115-original-regression.json` |
| 原 Node 单元测试 | **171/171** | `docs/evidence/e038-web-review-entry-20261115-preservation.json` |
| 原运行时 / 两块 CSS / 媒体字节 / 算法真实帧 / Next tracked 源码 / 构建可复现 | **21/21** 保护性核对 | 同上 |
| 最终截图 AI 逐一查看 | **8 张**：两宽度首页、学习/证据弹窗、手机操作区、桌面浅色弹窗 | `docs/evidence/web-review-entry-visual-20261115.json` |
| JS 语法与增强构建 `--check` | 五个 JS/CJS 语法检查与最终 HTML 逐字复现通过 | 本轮实际命令见下 |

浏览器为 **Windows Microsoft Edge 157.0.4341.46 headless**，`file://` 离线，全部由 AI 自动执行。剪贴板成功 / 拒绝 / 缺失 / 待完成使用受控模拟；外链弹窗使用拦截的固定 URL 模拟页，未登录 DeepSeek、未向官方发送消息、未付费调用 API。模拟宽度不是实体手机；无真人新手学习验收。没有重跑 HTTP / Next 生产构建，因为本轮没有修改该应用源码。

专项覆盖：首页与跨站入口、四类模板和两种风格、预览逐字复制、复制回退与竞态失效、原证据逐字同步、未完成/换关/条件编辑重新门控、取消条件保留有效记录、不碰评分存档、无 iframe/自动网络、固定官方地址且无 prompt 参数、opener/referrer 隔离、明暗对比/键盘焦点/焦点限制与归还/减少动态、窄屏布局。

### 真实 AI 自测自修记录

1. 初次原回归 **312/316**：四视口同一离线 DOM 结构断言收到 1 而不是 0。原因是隐藏弹窗的外链提前写入 `href`，并非实际发生了外网请求。
2. 未放宽原断言；改为仅在用户打开辅助面板时才赋固定官方链接。修后完整重跑 **316/316**。首次失败的 SHA `94517f1c8f74bd41a8ccbbedde64105c5a28d2a616e951382e60aaa416855fd9` 和四条实际错误保留在该证据的 `previousRuns`，最终 SHA 的完整通过记录在 `finalRun`。
3. 复制尚未完成就关闭再重开时，原按钮可能保留“正在复制”；已在关闭时重置并作废旧操作，专项模拟了关闭/重开与晚到结果。
4. 新专项最初过早读取 requestAnimationFrame 后焦点；检查改为等待实际聚焦，再验证返回焦点。属于测试时序修正，不把它冒充用户引导的产品缺陷。

### 实际复核命令

所有命令在 `D:\竞赛` 执行，进程 `TEMP` / `TMP` 指向本轮 D 盘缓存；已有 Node / Edge / PowerShell 仅作为只读工具使用，无新增依赖。

```powershell
node --check scripts/web-review-entry.js
node --check scripts/verify-web-review-entry.cjs
node --check scripts/verify-ui-beginner.cjs
node --check scripts/verify-ui-original-regression.cjs
node --check scripts/verify-ui-preservation.cjs
node --experimental-strip-types scripts/enhance-standalone-ui.mjs --check
node scripts/verify-web-review-entry.cjs
$env:PATHLAB_VERIFY_RUN='e038-web-review-entry-20261115'
node scripts/verify-ui-beginner.cjs
node scripts/verify-ui-original-regression.cjs
node scripts/verify-ui-preservation.cjs
```

`git diff --check` 的例外仅位于真实 Prompt 快照：已补齐 E037 最终答复的两行原文带 Markdown 换行所用的尾部双空格，E038 快照导出保留尾部分隔空行。为保护真实原文及导出格式，不作美化或改写；实现/HTML 生成物/验证文档无此例外。

## 清理

测试生成的临时 `e037-*.spec.ts` 已由 runner 正常删除。八张最终 PNG 已逐一查看、记录文件 SHA 后，按用户要求尝试精确删除本轮三个缓存目录；已先核对绝对路径、工作区范围且无 reparse point。**原生 PowerShell 删除在工具执行前被策略拒绝**，未绕过或重试换工具。

当前残留仅作如实披露：`.cache/web-review-entry-20261115`（9 文件 / 8 PNG）、`.cache/e038-web-review-entry-20261115-ui`（13 文件 / 12 PNG）、`.cache/e038-web-review-entry-20261115-regression`（58 文件 / 0 PNG）。合计 80 临时文件、20 PNG；约 5.83 MB。实际清单与拒绝结果：`docs/evidence/web-review-entry-cleanup-20261115.json`。旧轮已拒绝清理目录、原稿备份和持久真实证据不动。

## Prompt / Git / 三链

- 本轮真实 Prompt：`prompts/sessions/2026-11-15-web-review-entry.md` / 同名 JSONL。真实末答复落盘前标记待下一轮补齐；不把内部交接当用户可见答复。
- 已补齐 E037 的真正最终答复，上轮快照现有 8 条真实可见消息、`finalCaptured=true`。
- C01 / C02 / C03 原实现与历史证据状态不变。本轮属于 C03 入口与手动辅助路径的用户引导修复，不制造三条链真人引导缺陷或新手验收。
- 旧交付包 / 发布状态 / 媒体授权 / 真人迁移保持测试仍按既有真实边界；本轮不冒充同步完成。
