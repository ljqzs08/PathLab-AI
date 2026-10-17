# 阶段 1 实际验证记录

日期：2026-10-17。执行者：AI，通过本机 PowerShell、Node 和无头 Edge 实际执行；不是用户人工验收。范围仅为可运行应用壳、四关简报和静态地图，不是参赛作品最终验收。

## 环境与实现边界

- 仓库为 D:\竞赛；应用为 PathLab-AI/；不建立嵌套 Git 仓库。
- Windows；PowerShell 5.1.26100.7705 / 7.6.5；Node 24.19.0、npm 11.17.0；已安装 Edge 155.0.4283.45。
- Next 16.4.2、React/React DOM 19.3.1；精确依赖与来源/兼容取舍见 dependencies-stage-1.md。
- 应用只有所选任务 ID 这一项 UI 状态；复用未修改的 fixtures/levels.json。地图以 DOM/CSS 网格展示 S/G/道路/障碍，不计算路径，不包含 Canvas、搜索、预测、学习诊断、存储或远程 AI。
- 主按钮明确禁用；刷新回 L01。页面不伪造学习记录、准确率、用户数量或 AI 结果。

## 实际命令

在仓库根目录执行，npm 操作均经项目包装器；包装器限定 D 盘缓存/临时路径，关闭安装钩子、浏览器下载与 Next 遥测，并恢复调用者环境。

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 ci
.\scripts\Invoke-ProjectNpm.ps1 run check
.\scripts\Invoke-ProjectNpm.ps1 run build
.\scripts\Invoke-ProjectNpm.ps1 run test:browser
.\scripts\Test-PromptSnapshot.ps1
.\scripts\Test-ProjectNpm.ps1
~~~

ci 在本轮首次接入后实际成功，安装 354 个包，输出约 39 秒；之后 engines 元数据调整执行过 lockfile-only install。没有以最后一次构建替代实际安装验证；不是另一台干净机器的安装结论。check 与两项工具回归在两版 PowerShell 均实际执行。

## 结果

| 项目 | 实际结果 | 限制 |
|---|---|---|
| next typegen + tsc --noEmit | 两版 shell 通过；保留 strict、noUncheckedIndexedAccess、exactOptionalPropertyTypes 与原类型负例 | 不证明手写类型与每个 JSON Schema 分支完全等价 |
| eslint . --max-warnings=0 | 两版 shell 通过，零 lint 告警 | Next build 不自动代替 lint |
| 原有 Node 契约测试 | 两版 shell 各 22/22 通过；最终 PS5.1 重跑 210.9545 ms | 仍是契约/合成夹具，不是算法实测 |
| next build | 生产构建通过；静态路由 /、/_not-found、/icon.svg | 不是线上部署验证 |
| dev / start | 开发首页与生产首页 HTTP 200；生产不存在路由 404；无 x-powered-by 响应头 | 仅绑定 127.0.0.1；未开放局域网 |
| 生产浏览器检查 | 最终重跑 28/28；0 skipped / unexpected / flaky；JSON duration 21587.924 ms，终端 21.6 s | 单台 Windows 已安装 Edge；非真实手机/跨浏览器 |
| Prompt 提取回归 | PS5.1 / PS7 各 17 项通过 | 可见文字提取，不是原生全量对话或媒体导出 |
| npm 环境恢复回归 | PS5.1 37 项；PS7 49 项；均覆盖成功/预期失败路径 | PS7 另测空字符串；PS5.1 不支持相同语义 |
| 冻结规格 | git diff 核对 contracts/ 与 fixtures/ 无变化 | tests 中只修正一处未用变量的写法 |

浏览器矩阵为 1440×1000、390×844、320×860、768×1024，每视口 7 项：

1. 真实本地壳、禁用预测按钮、无 Canvas。
2. 四关按钮、简报目标和每个地图格逐项匹配原 JSON，只有一个按下状态。
3. Tab/跳过导航、空格/Enter 选择、焦点与 live 状态通知。
4. 四张地图和文档无横向溢出。
5. L01/L04 的 axe WCAG A/AA 自动检查无违规；不等于人工无障碍认证。
6. 测试操作没有外部页面请求、页面异常/console error 或 local/sessionStorage 写入；刷新恢复 L01。
7. reduced-motion 下平滑滚动和装饰过渡关闭。

浏览器 JSON 原始报告位于 .cache/stage-1-browser-results.json，被 Git 忽略，保留作本机复核；本文件是实际执行结果的索引，不冒充已提交原报告。测试时只有 NO_COLOR/FORCE_COLOR 优先级提示，没有将该运行环境提示隐去当作页面错误。

## 实际失败、修复与回归

以下均由 AI 执行时自行发现/修复，**不是用户引导的核心修复链**。

1. 接入 lint 后，旧合成事件夹具解构了未使用的 distanceFromStart；只将剩余字段显式列出，保持夹具语义。lint 与原 22 项测试复测通过。
2. Node 24 发现浏览器测试时，JSON 模块缺少导入属性导致 ESM 加载失败；测试加上 with { type: 'json' } 后 28 项通过。
3. 新式内部交接标题可能被快照脚本误认为最终答复。先加合成回归得到失败，再补充标题过滤；两版 shell 各 16 项通过。合成内部正文与真实内部摘要均不作为参赛 Prompt。
4. 新增严格环境检查发现 PS7 缺失变量恢复为空字符串；新增可复用回归先失败，再在 finally 中区分 Env: 删除与字符串还原；PS5.1 37 项、PS7 49 项通过，并在阶段 0 记录追加原覆盖范围的纠正。
5. PowerShell 松散传递 npm 的 -- 分隔符导致一次启动命令参数错误。额外参数改用显式 -NpmArguments 数组；无需额外参数的 run start 正常。README 给出已验证写法。
6. 暂存 git diff --check 发现生成的 user 标题因空 phase 带末尾空格。先新增标题回归实际失败，再只修正生成元数据标题（不修剪原始对话文字），刷新两份快照；工具最终两版各 17 项通过，原文哈希仍一致。

收尾过程也出现过**检查命令自身的错误**（预期失败残留退出码、子 shell 字符串插值、核验时字段名误读与 PowerShell 对锁文件空键的解析边界），没有据此修改产品或伪造通过。最终以独立 powershell.exe -File 逐项核对，两版所需检查通过；按实际 textSha256 字段核对两份快照的 5/6 条原文哈希，并以 Node JSON.parse 核对 414 条锁文件记录及根 engines 元数据。环境负例故意调用不存在的 npm script，不是应用故障。

## Prompt、Git 与完整链

- 上轮阶段 0 已补齐为 5 条真实可见消息，finalCaptured=True。
- 本轮真实 Prompt 为“检查并进行下一阶段”；快照见 prompts/sessions/2026-10-17-stage-1.md 与同名 JSONL。阶段 1 收尾时最终答复尚未落盘；阶段 2 开始已从原始记录补齐为 7 条可见消息，finalCaptured=True，逐条原文哈希复算一致。此补齐不改变阶段 1 当时的功能/测试范围。
- 变更按独立工具修复、阶段 1 应用、证据索引保留本地提交；真实哈希在 evolution-log.md 登记，禁止 amend 或倒填。
- C01/C02/C03 仍为 0/3。阶段 1 不冒充算法、交互或诊断核心链，也不能用 AI 自查替代真实用户追加约束。
- 无 GitHub remote、未 push、未改变公开性或评审权限。

## 清理与剩余风险

- node_modules、.next、类型增量文件是本地运行/复用依赖，保留且不入 Git。
- 三张临时图已实际查看：.cache/visual-stage-1/1440.png、390.png、narrow-320-mission.png。收尾尝试核验后删除被工具安全策略拒绝；**均仍在 D 盘忽略目录中，未删除、未绕过限制**。先前被拒绝的 .cache/npm、.cache/tmp 同样保留。
- 未做真实手机、屏幕阅读器、跨浏览器、真机性能、线上部署、完整依赖安全审计或用户人工验收。
- ESLint 9 已结束支持但当前 React 插件 peer 不支持 10；保留明确的开发工具风险，发布前重新核验兼容升级，不强行越过 peer。
- 赛事入口、截止日期、最终上传规格本轮未重新核实；最终提交前须重新从官方来源核对。作者邮箱和原始 Prompt 的公开范围也需确认。

本阶段停在应用壳。下阶段先独立实现确定性网格/BFS 与边界测试（C01），验证四图与预测点，尚不接入 Canvas/远程 AI。


后续核对说明（阶段 2）：Playwright 既有配置继续使用 .cache/stage-1-browser-results.json 固定输出名，该原始文件已被阶段 2 回归覆盖。本记录的 21587.924 ms 保留为阶段 1 当时测量，不冒称当前原始 JSON 仍是旧报告。阶段 2 独立摘要见 evidence/stage-2-browser.json，测量见 verification-stage-2-bfs.md。
