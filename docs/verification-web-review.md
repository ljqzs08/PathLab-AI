# E018：网页辅助复盘与界面优化验证

## 范围与边界

用户要求采用无需 API 配置的网页辅助方式，并丰富功能、优化界面和流畅性。本轮仅增强固定关卡复盘区：真实已揭示事实 → 本机整理 → 预览/复制 → 用户手动打开官方网页。不是 iframe 聊天、自动登录、私有接口代理或已完成的大模型真实联调。

新增三方向（预测偏差、算法规则、条件实验）、两种回答风格，缺少真实前后对照时禁用实验方向；只导出本次模板事实和匹配当前运行的同算法指标。复制不发送，外链固定且无提示词参数、noopener/noreferrer；不读外部回答，不改变成绩/报告/存档。API 通道留在折叠进阶区，私有配置未读取、未修改，测试进程显式关闭 API。

UI 样式集中在 learning.css 的局部块，桌面卡片/手机堆叠、44px 操作控件、键盘 radio/select/textarea、状态播报，220ms 单次入场与减少动态适配。没有新依赖、轮询、持续动画或逐帧提示生成。现有算法、关卡、Canvas 回放和自由地图逻辑未改。

## 先失败、后修复的实际记录

1. 添加 Node 检查后运行 `test -- --test-name-pattern='web review'`；包装参数没有过滤旧测试，实际 147 个旧测试通过、新文件因生成器尚不存在而失败（148 项/1 失败）。见 `evidence/web-review-before.txt`，不把它算作产品上线缺陷。
2. 初版生成器在无对照时仍在规则中列出 C1，6 个固定组合的检查失败；将引用说明改成按真实对照提供编号。见 `evidence/web-review-check-pwsh.txt`。
3. 复制并发自查后补充同一面板写入不重叠、内容过期/卸载后不更新 UI；首次两版 shell 检查触发 effect cleanup 的 ref lint 警告，随后用挂载状态门控异步完成，消除警告。原日志 `web-review-lint-{ps51,pwsh}.txt` 保留。
4. 初次离线命令中 `--config` 被 PowerShell 包装/ npm 参数处理，误落到 HTTP 默认配置，因 HTTP 测试已占端口而停止；没有结束他人进程。改用显式 `-NpmArguments` 数组，原失败见 `web-review-offline-cli-failure.txt`。不是离线应用运行失败。
5. 初版专项 48/48 通过；在其后完成复制写入串行保护/挂载 lint 修正并重建，最终版本以全量 HTTP/离线回归为准。初版构建和日志保留，不用旧结果替代最终版本。

## 最终执行命令（工作目录 D:\竞赛）

执行者：AI / 本机 PowerShell + Edge 自动化，不是真人或真机验收。

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-ProjectNpm.ps1 run check
.\scripts\Invoke-ProjectNpm.ps1 run check
.\scripts\Invoke-ProjectNpm.ps1 run build
.\scripts\Invoke-ProjectNpm.ps1 run build:html
$env:AI_ENABLED='false'
.\scripts\Invoke-ProjectNpm.ps1 exec -- playwright test canvas.spec.ts deepseek.spec.ts learning.spec.ts motion.spec.ts playground.spec.ts progress.spec.ts reflection.spec.ts shell.spec.ts web-review.spec.ts
.\scripts\Invoke-ProjectNpm.ps1 -NpmArguments @('exec','--','playwright','test','--config','playwright.standalone.config.ts')
```

HTTP 显式列出正式 spec，未混入旧未跟踪 stage6-review.temp.spec.ts；离线配置原有排除规则继续生效。输出和缓存均留 D 盘，禁止读取真实凭证或发起付费调用。网页外链与剪贴板在专项中模拟，不访问官方聊天。

## 最终结果

最终两组进程均退出 0，JSON 报告均无 errors、skipped、unexpected 或 flaky：

| 检查 | 最终结果 | 真实证据 |
| --- | --- | --- |
| Windows PowerShell 5.1 类型 / lint / Node | 通过 / 通过 / 155 项通过 | `evidence/web-review-check-ps51.txt` |
| PowerShell 7 类型 / lint / Node | 通过 / 通过 / 155 项通过 | `evidence/web-review-check-pwsh-final.txt` |
| 生产构建、离线 HTML 构建 | 均成功 | `evidence/web-review-build-final.txt`、`evidence/web-review-html-final.txt` |
| HTTP 四视口全量 | 260/260 通过 | `evidence/web-review-http-full.{txt,json}` |
| 离线四视口全量 | 272/272 通过 | `evidence/web-review-offline-full.{txt,json}` |
| AI 视觉检查 1440 / 320 | 2/2 通过 | `evidence/web-review-visual.txt` |
| 客户端产物边界 | 11 个文件检查通过 | `evidence/web-review-client-boundary.json` |

最终 `PathLab-AI/PathLab AI.html` 为 501852 字节，SHA256：`18d04356474a4e3e9dbe2901669bcc77592e336084be83943ce98d2ff4c67e63`。浏览器外链与剪贴板测试使用模拟能力，没有访问真实聊天或进行付费调用。

新增 8 项 Node 检查覆盖六个固定关卡/算法组合、确定性、不修改输入、隐私字段排除、揭示门控、无预测/无路径与过期对照。新增 8 项浏览器用例 × 四视口，覆盖无自动外发、可访问性、预览一致、无存档写入、复制成功/拒绝/缺能力、异步过期/卸载、真实条件对照、无 referrer 固定外链、键盘和正常/减少动态；旧 API mock 也按折叠入口回归。

AI 视觉检查：以最终离线 HTML 在 1440/320 宽度检查新面板，标题、卡片、预览和操作完整，没有横向溢出；测得 documentWidth 分别 1440/320，完成后动画数 0、iframe 数 0。见 `evidence/web-review-visual.txt`。两张临时截图与临时 spec 已按工作区内确切路径删除；保留实测日志，不冒充手机、屏幕阅读器或 FPS 保证。

## 证据、提交与剩余风险

- Prompt：`prompts/sessions/2026-10-17-web-review-workbench.{md,jsonl}`，从本会话真实用户/可见助手消息提取，不是原生全量导出；无隐藏推理、工具载荷或内部摘要。本轮最终答复待下一轮补齐。
- E017 最终答复、配置教学、网页替代咨询已补齐，一并归档；不夹带旧错误 motion-playability 草稿或旧状态快照。
- C01/C02 保持，C03 增加网页辅助，不视为真实 AI 调用成功。条件实验输出不会伪造另一算法运行，不将用户点击外链计作复盘完成。
- 真实官方登录/聊天、操作系统剪贴板权限与同步、真机手感/移动浏览器、人工及屏幕阅读器未验收。网站不能保证 DeepSeek 可用性、额度、外部回答正确性，也不能承诺所有设备绝对流畅。
- 无发布/远程仓库/评审访问授权；这些与官方条款及三链人类材料缺口保持原状态。离线 HTML 是本轮最新产物，旧 delivery 包不是本轮重打包。
- 本轮功能验证完成后单独本地提交，真实哈希后写演进索引，不改写历史。
