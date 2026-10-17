# 阶段 2（BFS）实际验证记录

日期：2026-10-17。执行者：AI 在本机 Windows/PowerShell、Node 与无头 Edge 中实际执行；不是用户人工验收或最终参赛验收。

## 范围与改动

用户真实 Prompt：“专家，请继续完成并丰富内容优化”。依总控 Prompt 2 与上一轮约定，只推进独立纯网格/BFS、路径回溯、结构化事件及教学证据，不提前实现 A*、状态机、Canvas、诊断、持久化或远程 AI。

- src/domain/grid.ts：只读输入、运行时网格/坐标校验、固定四邻域、稳定 GridInputError.code。
- src/domain/algorithms/bfs.ts：FIFO 头索引队列、入队即发现、固定 parent、选中终点后结束、回溯前缀与最终路径、确定性事件、由事件汇总的指标。
- tests/grid、bfs、bfs-missions 与独立同步距离松弛 oracle：31 项新增测试，与原 22 项契约合计 53 项。
- scripts/inspect-bfs.mjs：仅开发者核验脚本；输出八次固定运行的路径/指标/事件数/轨迹 SHA256/预测点可用性。不创建真实学习记录，不实现学习门控。
- evidence/stage-2-bfs.json 为可复现机器证据；teaching-guide.md 为四关提问、提交后解释与反事实复盘备稿。更新 README、架构/事件/关卡/验收/评审证据与根 AGENTS 的当前状态。
- package.json 只改状态说明、原生 TS 测试命令与核验命令；tsconfig 允许显式 .ts 导入，noEmit/strict 保持。依赖版本与 lockfile 未变，本轮没有安装新包或浏览器。
- contracts/、fixtures/、页面/CSS/组件/数据边界与浏览器用例未改；BFS 和答案 JSON 不导入学习页面。

## 环境与命令

实际核对：Node 24.19.0、npm 11.17.0、PowerShell 7.6.5；另在 Windows PowerShell 5.1 子进程重跑 check；已安装 Edge 155.0.4283.45。最低声明 Node 22.13 与其他 Node 主版本本轮未测试，不以去类型执行替代 tsc。

修改 TypeScript/运行流程前已读取安装版 Next 的 01-app/03-api-reference/05-config/02-typescript.md 与 01-next-config-js/typescript.md；未关闭类型检查或生成第二份 AGENTS。

在 D:\竞赛 中实际执行：

~~~powershell
# 验收测试先建立、实现前执行：原 22 项通过，两个新增文件因模块不存在失败
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('test')

# 实现后、完成文档后均执行过；最后两版 shell 的记录见 evidence/
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run', 'check')
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File 'D:\竞赛\scripts\Invoke-ProjectNpm.ps1' run check

# 可复现机器证据（输出包含答案，只用于开发者核验）
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run', '--silent', 'inspect:bfs')

.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run', 'build')
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('run', 'test:browser')
~~~

所有 npm 项目运行均经既有包装器，限制 D 盘缓存/临时路径、禁用安装钩子/浏览器下载/Next 遥测并恢复调用者环境。没有执行 ci；本轮构建是现有锁定依赖下的本机回归，不是干净安装证明。原工具的 17/37/49 项回归属于阶段 1，本轮工具实现未改，未重新计入。

## 实际结果

| 项目 | 结果 | 证据 / 限制 |
|---|---|---|
| 先测试的红态 | 22 pass / 2 fail，ERR_MODULE_NOT_FOUND 指向尚不存在的 grid.ts 与 bfs.ts | 缺少待实现能力，不是伪造或用户引导的 Bug |
| next typegen + tsc --noEmit | 两版 shell 均通过 | strict/noUncheckedIndexedAccess/exactOptionalPropertyTypes 不变 |
| ESLint --max-warnings=0 | 两版 shell 均通过、零 lint 告警 | 不由 build 代替 lint |
| Node 测试 | 两版均 53/53；PS5.1 265.8157 ms，PS7 314.0651 ms | evidence/stage-2-check-ps51.txt、stage-2-check-ps7.txt 为真实终端文本 |
| 独立正确性核验 | 128 种固定开放端点的 3×3 障碍布局全部一致；25×25 开放图最短 48 步 | 不是任意规模/加权图证明；输入上限 25×25 |
| 确定性 / 数据隔离 | 同输入重复运行路径、全部事件、指标深度一致；冻结输入不变；输出路径/指标/快照不污染输入或终止事件 | 没有时间/随机/会话字段；有固定 15 事件轨迹测试 |
| 四关原图/反事实 | 八次均可达，最短距离 (6,8)/(14,16)/(8,12)/(14,8)，路径均改变 | BFS 结果；L03 只作核验，A* 未实现 |
| 事件 schema | 八次共 2,532 个实际算法事件全部通过冻结 schema 的合成 envelope 包装 | 合成 ID/时间不是用户事件；另有路径/代价/队列/统计运行时语义断言 |
| checkpoint | 16 个槽均在第 2/4 次有效选中前有多候选，无需延后；另测延后、单次最多一个和无候选跳过 | 仅静态证据分析，不是 reducer 门控实现 |
| next build | 通过，静态 /、/_not-found、/icon.svg | 页面无新功能，非线上部署 |
| 页面生产回归 | 28/28，0 skipped/unexpected/flaky；JSON duration=18991.441 ms | 单机无头 Edge，四视口；evidence/stage-2-browser.json |

浏览器矩阵仍为 1440×1000、390×844、320×860、768×1024，覆盖诚实能力提示、四图逐格匹配、键盘/skip link、横向溢出、L01/L04 axe A/AA、无外部页面请求/异常/学习存储写入、reduced-motion。原 JSON 路径 .cache/stage-1-browser-results.json 是既有配置的固定输出名，本轮运行已覆盖它；独立阶段 2 摘要保存在 evidence/stage-2-browser.json，不把本轮数字改记为阶段 1 的旧结果。

浏览器终端有 NO_COLOR/FORCE_COLOR 环境警告，不是页面 console error，也没有修改全局环境来隐藏警告。没有新增截图、视频或录屏。

## 本轮确实改进的教学证据

- L01 第 2 次选中前的候选为 (0,1)/(1,2)/(0,3)，顺序 1/2/3，g=f=1/h=0；实际选中 (0,1)。更接近终点的 (1,2) 不能插队，适合解释 BFS 而非贪心选择。
- L02 封路后路径 14 → 16 步、扩展 53 → 52：路径长度与搜索范围不能混称，且没有测量耗时，不推论“更快”。
- L03 封锁 (4,2) 确实破坏旧 BFS 路径，新最短 12 步，上下等长绕行都通过路径校验；固定顺序选择上绕。不能将这些数据称为 A* 结果或实时避障。
- 反馈措辞只描述可见选择与事实，保留“证据不足”；未收集用户预测、准确率提升或教学效果。

## Prompt、提交和链状态

- 阶段 1 已补齐真实最终答复：7 条可见消息，finalCaptured=True；逐条 textSha256 重新计算一致。
- 本轮快照：prompts/sessions/2026-10-17-stage-2-bfs.md / .jsonl，已于阶段 3 开始补齐为 6 条可见消息，finalCaptured=True。来源原记录，哈希一致，内部交接摘要未归档；仍不是全量原生媒体导出。
- C01 已有网格/BFS 核心实现与自动验证，但本轮没有真实用户追加约束并引导 Bug 修复。C02/C03 未实现；完整链仍为 0/3。不为凑链制造缺陷或补造用户对话。
- 功能已真实提交 `5c3eec624249ddfe149cf1768658ceabf62ef2ce`（`feat: implement deterministic BFS and evidence-based mission lessons`）；本记录与演进索引在其后以独立证据提交归档，不 amend/rebase/squash，不自引索引提交的哈希。

## 清理、限制与下一阶段

- 所有本轮保存的源码/内容/证据在 D 盘当前工作区。保留用于本地复用的 node_modules/.next/类型增量数据和可核对的测试证据；没有新检查图要删除。
- 先前被安全策略拒绝的 .cache/npm、.cache/tmp 与三张 stage-1 检查图仍在 D 盘忽略目录，未重试或绕过。归档回归结果后，仅对新生成的 browser-results/.last-run.json 发起一次原生 PowerShell 精确路径删除，工具在执行前拒绝；未换工具绕过，文件保留，不声称已清空。
- 无人工、真实手机、屏幕阅读器、跨浏览器或干净新机器验收；没有完整依赖安全审计。ESLint 9 的既有兼容/维护风险未改变。
- 未创建 GitHub remote、push 或更改公开/访问权限；作者邮箱公开、赛事细则/截止时间与视频/PDF规格仍需发布前确认/复核。
- 本阶段完成后停止。下一阶段按总控 Prompt 3 实现 A*/确定性优先队列，用现有 BFS 距离基线核验，再验证 A* 的预测点与更小 g 更新；不自动接入后续 UI 或 AI。
