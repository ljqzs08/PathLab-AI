# E017：可选 DeepSeek 证据复盘验证

日期：2026-10-17。执行者：AI / 本机 Node 与无头 Edge。所有模型成功响应、访问口令与学习样例均为合成测试数据；没有真实 DeepSeek 调用、付费、用户数据外发或人工/真机验收。

## 验收范围与实际实现

- 复用原请求/反馈 schema 与本地证据关系约束；新增共享 schema 检查、固定 DeepSeek 服务端适配器及 `POST /api/feedback`，没有扩展为通用聊天。
- UI 仅在已完成运行的复盘阶段展示；主动发送前预览事实、填写独立访问口令并同意费用/数据发送。原本地反馈始终可见；模型结果不写入评分、报告或 JSON 存档。
- 默认关闭；API Key 仅服务端持有，禁止任意供应商 URL/重定向。独立口令、精确 origin、同意标记、并发/间隔/进程额度、输入/输出按字节限长、超时/取消均已实现。
- schema 失败、引用不匹配、提示越级、虚构标签、HTTP 错误、无效/截断/空输出、过量/流式卡住的响应、旧 run/revision 均不作为有效远程反馈。格式/引用正确仍不代表自然语言正确。
- 无新 SDK；已有 AJV 8.20 移至运行依赖并更新 lockfile。Next 本地 route/env 文档在实现前读取；原 layout 仅修正文案，随后也复核本机 metadata 文档，没有改用新 API。
- `.env.example` 是可提交模板；另已在原文件不存在时建立 `.env.local`（禁用、两项凭证为空），实际确认 Git 忽略。没有读取用户已有密钥。
- `src/standalone.tsx` 显式标记完整单文件模式，file/静态托管时都不展示远程控件。HTML 重新生成；旧 E016 ZIP 是历史本地交付物，未覆盖，也不能称其包含 E017。

## 实际执行与结果

| 检查 | 实际结果 | 原始记录 |
|---|---|---|
| PowerShell 7.6.5：`Invoke-ProjectNpm.ps1 run check` | typecheck、零告警 lint、147/147 Node | evidence/deepseek-check-pwsh.txt |
| Windows PowerShell：同一 check 命令 | typecheck、零告警 lint、147/147 Node | evidence/deepseek-check-windows-powershell.txt |
| `run build` | 生产编译通过，新增动态 `/api/feedback` | evidence/deepseek-production-build.txt |
| `run build:html` | 单文件生成成功，无外部资源 | evidence/deepseek-html-build.txt |
| HTTP 完整四视口回归 | **228/228**；0 unexpected / skipped / flaky | evidence/deepseek-http-full.json、.txt |
| file:// 完整四视口离线回归 | **240/240**；0 unexpected / skipped / flaky | evidence/deepseek-offline-full.json、.txt |
| 最终服务端修订重建后 HTTP 专项复跑 | **16/16**；0 unexpected / skipped / flaky | evidence/deepseek-http-targeted.json、.txt |
| 客户端产物边界 | 11 个 JS/HTML 产物无服务端环境变量名、合成供应商密钥、直接供应商 URL | evidence/deepseek-client-boundary.json |
| AI 视觉核对 | 1440/320 宽度的合成远程反馈卡片完整、无横向溢出；临时图检查后已删 | evidence/deepseek-visual-check.json |

Node 比 E015 的 108 项增加 39 项：关闭/缺配置、鉴权/同源/同意、模板形状与关系检查、请求/响应字节限长、多字节、供应商 HTTP/JSON/空响应/截断、并发/冷却/累计额度、取消、网络异常和慢流超时；全部 mock fetch，不访问 DeepSeek。四视口为 1440/390/320/768，使用已有 Edge 配置。HTTP 的新增 16 项覆盖模拟成功、隐私、引用/旧版本失败、取消、条件切换、真实本地关闭路由及自动 WCAG 检查；离线的对应 16 项验证无远程控件而非虚构离线远程成功，没有 skip。

HTTP 全量所用生产包构建后，对服务端网络异常做了更准确的状态分类（网络不可用与无效内容分开），并将配置口令长度限制与 UI 的 256 上限对齐。这是 AI 代码自查，不是用户报告的 Bug；双 PowerShell Node、生产重建和最终 HTTP 专项覆盖最终版本。客户端源码和 HTML 在全量回归之后没有改动。

浏览器执行环境均显式 `AI_ENABLED=false`；缓存/临时目录、浏览器产物全在 D 盘工作区。独立视觉检查临时监听 127.0.0.1:3211，结束关闭；没有公网地址、隧道或发布。

HTML：486959 bytes；SHA256 `288b8e219bdac5e1410ccc9aa8d4168282e60e88e36f69ff4745b9568efc37ae`。比旧版增加的内容主要为可选复盘 UI 和共享 JSON 校验；不内置密钥或新的网络资源。

## Prompt、链与 Git

- 本轮原文：`prompts/sessions/2026-10-17-deepseek-integration.md` / `.jsonl`，从真实会话提取，当前 4 条可见消息；最后答复未落盘，明确待下一轮补齐。不是原生全量导出，未包含内部摘要、工具载荷或隐藏推理。
- E016 `review-rules-continuation` 已补齐真实最后答复，现 2 条、finalCaptured=True；旧审计 44 条是当时状态，未改写历史数字。
- 官网获取途径与实际页面记录见 `deepseek-setup.md`。早前可见说明中的来源引用标记没有可用 web 来源卡片，不作为已核验引用；保留真实原文，不篡改快照。实际协议字段用官方网页正文直接读取核对。
- C01/C02 的实现与既有证据保持不变；C03 增加 E017 可选远程补充。本轮是用户选择供应商后的增强，不冒充三条用户引导缺陷修复。
- 功能提交将以实际执行后的哈希写入演进索引，不倒填、不自引用。本轮不推送、不开远程、不改评审权限，已有未跟踪 spec/错误 Prompt 草稿不夹带。

## 剩余边界

1. 用户仍需本机填写自己的 DeepSeek Key、独立访问口令、确认预算并主动允许最小事实外发，才能进行真实联调；本轮没有真实模型正确性或账号可用性结论。
2. 进程额度重启后重置，多进程不共享；不是货币预算封顶，不是公共多人服务的身份系统。公开部署前需专门验证权限/配额/代理 origin 与供应商费用控制。
3. 服务端验证请求结构与关系，不具有浏览器原始学习过程的独立可信见证；持有口令的调用者仍可构造合规格式事实。不得把模型结果用作防作弊评分或真实学习成效证明。
4. GitHub 发布/有效评审访问、真实设备/人工验收、比赛原文最终核对和三链人类引导材料的既有缺口仍保留。
5. 已删除本轮两张临时检查图和视觉脚本；可复用构建产物保留，真实验证日志转存 evidence。既有被拒清理目录/草稿未重试或夹带。

## 暂存检查说明

首次提交前的 diff-check 因原始生产构建日志带行末空格/末尾空行而停止，没有创建提交；随后全量 diff-check 也保留了真实 Prompt 的原始空白告警。日志见 `evidence/deepseek-diff-whitespace.txt`。没有修饰原始日志/Prompt 来消除告警；排除这两类原文目录后的代码与说明文档检查通过。这是证据文本格式告警，不是应用测试失败或人类引导修复。
