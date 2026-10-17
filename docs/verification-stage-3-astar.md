# 阶段 3：确定性 A* 与算法对照实际验证

日期：2026-10-17。执行者：AI 本机自动检查；不是人工、真机、学习效果或评审验收。

## 范围

新增 algorithms/astar.ts、priorityQueue.ts、相应单元/语义回放/对照测试、inspect-comparison.mjs。BFS、grid、contracts、fixtures、页面/样式/组件与锁文件未改。算法尚未接入学习页面。没有新增依赖、浏览器下载或截图。

堆按 f/h/sequence；只更小 g 才更新 parent；旧堆项记录 stale_entry，不计有效选中/扩展/前沿。终点选中即结束。完整日志有快照排序与路径复制，不把整体成本冒称纯堆复杂度。

## 实际命令与证据

在根目录通过 scripts/Invoke-ProjectNpm.ps1 执行 run check、run build、run --silent inspect:compare。Windows PowerShell 5.1 使用 -NoProfile 的独立子进程，PS7 为本地 7.6.5；Node 24.19.0 / npm 11.17.0 / Next 16.4.2。证据管道须使用 D 盘绝对输出路径，避免包装器 Push-Location 改变相对解析。

- evidence/stage-3-check-ps7.txt：typecheck、ESLint 零告警、73/73 tests，0 fail/skip；duration_ms=407.277。
- evidence/stage-3-check-ps51.txt：同样 73/73；duration_ms=399.0549。
- evidence/stage-3-build.txt：生产构建成功，静态 /、/_not-found、/icon.svg。
- evidence/stage-3-comparison.json：可复现路径、统计、SHA256、两算法对照与 checkpoint。

先建测试时原 53 通过、两份新测试因缺失模块失败；这是尚未实现能力的红态，不冒充真实应用 Bug。实现后新增 20 项，共 73。覆盖 128 种 3×3、全部 16,384 种 4×4 固定端点障碍布局与独立同步距离松弛；25×25 开放图 A* 48 步、扩展 48、选中 49。

独立数组优先级回放不调用生产堆/comparator；验证每次有效选择、所有快照/skip/parent/成本/统计。边界图 ..#./..#./..#./.#.. 真实触发 g=4→2 及 stale；另有 5×5 可达图确认最终路径确实使用更新后的 parent。四关两算法共 3,651 算法事件用明确合成 envelope 通过原 schema；16 个 A* checkpoint 槽均可用。

## 四关实测

| 图 | 最短步数（两算法相同） | BFS 扩展 | A* 扩展 |
|---|---:|---:|---:|
| L01 原图 / 移终点 | 6 / 8 | 22 / 30 | 6 / 8 |
| L02 原图 / 封路 | 14 / 16 | 53 / 52 | 27 / 32 |
| L03 原图 / 封路 | 8 / 12 | 23 / 26 | 8 / 16 |
| L04 原图 / 移终点 | 14 / 8 | 45 / 25 | 14 / 8 |

只对这些固定输入成立；无耗时基准或“A* 总更好”结论。L01 A* / L03 BFS 标为 verification_oracle_only，不改变原教学算法白名单。

## Prompt、提交与限制

阶段 2 真正最终答复已补齐为 6 条；本轮 autonomous-iterations 快照当前 3 条，finalCaptured=False，仍需最后答复落盘后补齐。C01 有 BFS/A* 核心但没有用户实际引导 Bug 修复；C02/C03 尚未实现，完整链 0/3。

按显式文件列表创建本地有意义功能提交；真实哈希在后续演进记录登记，不改写历史。没有 GitHub remote/push/公开/权限变更。

本阶段未重跑页面浏览器检查，旧 28 项结果只属阶段 2；后续 UI 里程碑必须重新生产构建并回归。旧被策略拒绝的缓存/检查图未重试或绕过，本阶段无新截图。没有完整安全审计、真实用户/手机/跨浏览器验收。

### 原始证据空白例外

提交前 diff --check 对代码及普通文档保持默认规则。仅对原始构建输出 stage-3-build.txt（进度行尾空格及末尾空行）与 autonomous-iterations.md（真实用户 Prompt 末尾空格）逐次允许相应空白；不改原文、不改哈希、不改全局 Git 配置。两份本轮涉及的 Prompt JSONL 重新逐条核对 UTF-8 SHA256。
