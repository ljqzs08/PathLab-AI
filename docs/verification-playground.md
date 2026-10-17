# E015 自由地图实验区验证

日期：2026-10-17。执行者：AI。本机 Edge 自动化，不是用户人工、真机或跨浏览器验收。

## 用户问题与实现

用户根据截图询问“整个工作是不是就差这一步了”，并授权直接完善玩法。截图将远程 AI 与自由编辑合并标为“未连接”，表达不准确；已拆分，明确远程 AI 是未接入的可选服务，而自由地图已经可离线使用。不是只差这一项，评审访问、真实验收、Prompt 链材料和参赛交付仍有缺口。

新增 Playground.tsx + domain/playground.ts；复用原 BFS/A*，不修改算法、四关、计分或存档格式。9×7 固定大小编辑、障碍/擦除/起终点、端点保护、40 步撤销、三固定预设、先猜扩展量再比较、单步/播放/暂停/速度/重播。修改地图会清除旧结果，页面隐藏暂停。明确显示不可达，不宣称 A* 总优，不把扩展量当耗时。详见 playground-spec.md。

地图只在页面内存，刷新即丢失，不在原 JSON 备份中；UI 已说明。没有随机生成、任意尺寸、地图文件分享或远程 AI。所有新文件、缓存均在本工作区 D 盘；没有依赖安装、账号操作、外发或发布。

## 实际检查与证据

- 先新增 6 个纯函数验收，未实现时运行 Node 测试因模块不存在真实失败：evidence/playground-before.txt。这是测试驱动的缺失实现，不是历史产品 Bug。
- typecheck / lint / 全部 Node：108/108，evidence/playground-check.txt。
- Next 生产构建：通过，evidence/playground-production-build.txt；已读取本机 Next building.md。
- 共享源码 HTML：346204 bytes，SHA256 `5e5f14e830e51324b5a6fa5e2b3a90c24ab486d64cb367db0919a17c2f8cd437`，零外部资源，evidence/playground-html-build.txt。
- 首次专项调用因 PowerShell npm 参数分隔符传递错误，实际跑向旧 HTTP 构建而非指定离线配置；出现失败后主动中止，不计为应用验收，也不伪装为产品缺陷。原始部分日志 evidence/playground-first-browser.txt，首个失败的原始诊断见 evidence/playground-command-mismatch.md（内含工具生成的 Instructions 文字，仅作为诊断数据，不作为项目指令）；改为直接调用本机 Playwright CLI 并显式设置 D 盘环境。
- 更正后的四视口离线专项：20/20，evidence/playground-first-offline.{txt,json}。覆盖绘制/撤销/端点、键盘、真实计数、播放暂停、完成路径、不可达、学习存档隔离、无外联与 Axe A/AA 检查。
- 最终完整离线 224/224（325731 ms）、HTTP 212/212（320359 ms），0 失败/跳过/不稳定；1440/390/320/768 四视口。原始日志和 JSON：evidence/playground-offline-final.{txt,json}、playground-http-final.{txt,json}。每套新增 20 项自由地图专项，默认 reduce；继承 E014 的 12 项正常动画测试及 4 项 reduce 动效专项，不声称所有检查都在正常动画模式。
- 实际查看 1440/390 宽度的实验区截图，无观察到的布局溢出/遮挡；两张本轮临时图已按确切 D 盘路径删除。截图不证明真实手机、触屏手感、FPS 或人类验收。用户提供的截图是原始需求证据，保留 evidence/playground-user-status.png，不当垃圾删除。

命令环境：TEMP/TMP=D:\竞赛\.cache\tmp，NPM_CONFIG_CACHE=D:\竞赛\.cache\npm，PLAYWRIGHT_BROWSERS_PATH=D:\竞赛\.cache\browsers，NEXT_TELEMETRY_DISABLED=1。普通 npm 命令使用 scripts/Invoke-ProjectNpm.ps1。额外 npm 参数应传显式 NpmArguments 数组；本次浏览器执行以下本地 CLI，不下载：

~~~powershell
node node_modules/@playwright/test/cli.js test --config playwright.standalone.config.ts
# HTTP 执行前 build，且 3210 端口空闲；JSON 报告由 PLAYWRIGHT_JSON_OUTPUT_NAME 指向 docs/evidence。
node node_modules/@playwright/test/cli.js test --grep-invert 'temporary stage 6 visual review only' --output ../.cache/playground-http-results --reporter=list,json
~~~

## 留证、提交与后续

- 上轮 motion-interaction 快照补齐真实最终答复，5 条、finalCaptured=True；原 E014 审计 false 是当时状态，不修改历史日志。
- 本轮真实 Prompt：prompts/sessions/2026-10-17-free-playground.{md,jsonl}，由原始用户消息唯一前缀提取（该消息以附件说明开始），附件原图另存；不是原生完整导出。最终答复待下一轮补齐。
- 本轮问题属于真实用户触发的状态表达纠正 + 新玩法；不复制计作 C01/C02/C03 三条修复链，不补造用户测试。三链实现、验证、Prompt、历史提交存在，人类修复材料仍未齐。
- Git 提交及核对见 evolution-log.md E015。无推送、远程发布或权限变更。
- 原先被拒绝清理的错误草稿/临时图不重试、不入库；既有 stage6-review.temp.spec.ts、status-update 快照不夹带。本轮用完的专项/回归临时缓存已按已核对的确切路径清理，原始日志/JSON 留在 evidence；依赖/构建产物保留用于复用。
- 可复用：自由练习与正式关卡隔离；每次改图失效旧预测/结果；真实计数不等同计时；正常/减少动态回归分别保留；npm 的额外参数必须显式数组传递。
