# 地图预测交互与克制动效验证（E014）

日期：2026-10-17。执行者：AI。不是用户人工、真机、屏幕阅读器或跨浏览器验收。

## 目标、参考与取舍

用户希望选择性借鉴 MotionSites 免费提示词，让网站更有可玩性，而非照搬整站。
本轮在内置浏览器实际查看了 https://motionsites.org/zh 及免费案例 https://motionsites.org/zh/prompts/portfolio-cosmic-hero 。详情页最终可打开；展开的公开预览只展示分类、类型、免费标记及字体标题开头，复制全文入口指向登录。**未获得或复制完整提示词，没有登录、付费、下载素材或抓取受限内容。** 仅借鉴公开介绍的深色渐变视觉方向，自主实现符合现有学习界面的短动效，不采用背景视频、持续跑马灯或视差滚动。

验收目标：有一个真实交互改进；不泄漏未来答案；正常动效/减少动态模式均能操作；保持地图和 Canvas 几何一致、原四关与离线能力不退化；不新增依赖。

## 实际改动

- 地图预测：当前检查点的候选格子标记为菱形，可鼠标点选或聚焦后 Enter 选择，与候选卡双向同步。选择只是草稿，仍须明确提交；非候选格子仅查看，方向键也仅查看。提示不清空选择，重置/新运行/换关不沿用旧草稿，不把草稿写入存档或成绩。
- 动效：首屏分层淡入、渐变底光、一次性扫描线、任务卡抬升、按钮按压、预测与反馈面板短入场、已揭示节点短暂描边。减少动态模式关闭动画/过渡；hover 位移只用于精确指针设备。所有装饰动画有限次，最长 1.8 秒。
- 审查期间去掉中间版本的指针逐事件计算、无限呼吸/扫描和格子缩放；最终格子不缩放、不平移。正常动效检查不能由 reduce 模式回归替代。
- 改动源文件：PathLab-AI/src/app/globals.css、src/components/GridCanvas.tsx、src/components/LearningWorkbench.tsx。PathLabShell.tsx 的中间修改已撤回到原内容。HTML 由共享源码重新构建，不维护独立逻辑。
- 未改变 BFS/A*、门控规则、题目、计分、存档格式、反事实或报告逻辑；不是新增关卡或自由地图编辑。

## 执行环境与命令

本机已有 Edge；未安装新依赖或浏览器。终端命令在 PathLab-AI 下执行，TEMP/TMP 指向 D:\竞赛\.cache\tmp，npm_config_cache 指向 D:\竞赛\.cache\npm，NEXT_TELEMETRY_DISABLED=1。复用流程建议使用根目录 scripts/Invoke-ProjectNpm.ps1 包装器。

- `npm run check`：最终 typecheck、零告警 lint、102/102 Node 测试；见 evidence/motion-check-final.txt。
- `npm run build`：Next 生产构建通过；执行前已读取本机 next/dist/docs/01-app/02-guides/building.md。见 evidence/motion-production-build.txt。
- `npm run test:standalone`：最新 HTML，四视口断网 file 模式 **204/204**，失败/跳过/不稳定均为 0；见 evidence/motion-standalone-final.txt 与 .json。
- `npx --no-install playwright test --grep-invert 'temporary stage 6 visual review only' --output 'D:\竞赛\.cache\motion-http-results' --reporter=list,json`：生产 HTTP 四视口 **192/192**，失败/跳过/不稳定均为 0；PLAYWRIGHT_JSON_OUTPUT_NAME 指向 docs/evidence/motion-http-final.json，日志为同名前缀 .txt。未运行既有截图临时 spec。
- 上述每套回归都新增 16 项：四视口各 3 项正常动效测试 + 1 项减少动态测试。检查候选同步、改选、键盘、提示、非候选、显式提交、重置、门控、有限动画、格子无 transform、Canvas 容器对齐、完整 BFS 和横向溢出。其他历史回归仍默认 reduce；不声称全部检查都运行于正常动画。
- 视口宽度 1440 / 390 / 320 / 768。实际查看 1440/390 首屏与地图共四张临时图，未发现该范围的遮挡/溢出；截图仅静态检查，不证明 FPS、真实触屏或真实手机表现。

最终 HTML：334424 bytes；SHA256 `a41fe0208e845155064d9c6da7910ba4f17adf00a1e16c75336dc5c6683181c7`；零外部资源；双击即可运行。中间专项 16/16 的 HTML 为 334459 bytes，其 hash 不代表最终文件；第一版无限动效检查也不作为最终验收。

## 本轮实际发现的留证缺陷及修复

刷新 Prompt 时发现中文交接摘要被原导出器误识别为 final_answer。只过滤英文标题不足以保证不归档内部摘要。新增中文合成夹具先复现失败，再补充对应过滤；未改真实用户原文，未放宽 Refresh 原文不可改写校验。

- 以 HEAD 修复前导出器重跑新增合成夹具，确实报 `FAIL: Chinese handoff is not a real final answer`；原始错误见 evidence/motion-export-before.txt。
- 修复后的脚本在 PowerShell 7 与 Windows PowerShell 5.1 各 **19/19**，见 evidence/motion-export-after.json 与 motion-export-after-ps51.json；保留脚本 UTF-8 BOM 兼容性。
- 正式选用快照是 prompts/sessions/2026-10-17-motion-interaction.{md,jsonl}：真实用户 Prompt + 3 条可见 AI 说明；目前 4 条、finalCaptured=False。最终答复尚未落盘，下一轮从真实来源补齐。不是原生完整导出，不包含工具全量日志或附件。
- 有问题的旧 motion-playability 草稿未提交、不作为证据；删除这两个本轮误生成文件的操作被工具拒绝，因此未绕过删除/覆盖。真实原始会话从未修改。
- 这属于 AI 发现的导出工具问题，不冒充用户引导的 C01/C02/C03 产品 Bug。

## 清理、范围与剩余事项

本轮四张临时检查图位于 .cache/motion-preview，删除也被工具拒绝；仍在 D 盘、不入库、不计为参赛证据。测试输出缓存仍在 .cache，正式日志/JSON 单独归档。未声称工作区清空。此前未跟踪的 stage6-review.temp.spec.ts 与 status-update 快照均保留，不夹带提交。

C01/C02/C03 均已有实现、测试、Prompt 和历史提交；本轮增强 C02 交互，没有补造三条人类修复链。三链的人类引导材料仍未齐，远程 AI、自由地图编辑、GitHub 评审访问、视频/PDF 与正式参赛包仍待完成。没有对外发布、推送或账号权限变更。

可复用：正常动画和减少动态分开检查；所有格子保持几何不动；候选草稿与确定性会话分层；导出时中英文内部摘要都不能当最终答复。对应 Git 哈希在 evolution-log.md 的 E014 索引登记。

提交前检查：源码、测试、脚本和说明文档的 git diff --cached --check 通过；全量检查仅报告保留原样的真实 Prompt 与工具原始日志尾空格/末尾空行，不为消除警告改写原文。暂存文件凭证模式扫描未命中；该扫描不是全面的安全审计。
