# DeepSeek 证据复盘：配置与使用（E017）

## 不想配置 API？

优先使用 E018 网页辅助复盘：完成固定关卡后选择方向、核对事实、复制并打开官方网页手动提问。HTTP 和完整 HTML 都可用，无需修改 `.env.local`。详见 `web-review-guide.md`。下面仅说明折叠的“进阶选项”中的站内 API 通道，不是网页辅助的必需步骤。

## 当前交付边界

已实现 Next 服务端 `POST /api/feedback`、复盘按钮、严格 schema/引用检查、取消与旧结果丢弃、失败时保留本地反馈。默认 **关闭**，这轮只使用合成数据和模拟响应测试；没有使用真实凭证、发起付费调用或发送用户学习事实。

完整单文件 `PathLab-AI/PathLab AI.html` 无论以 file 还是静态 HTTP 打开，都只保留本地功能，不展示远程发送控件。远程功能需要运行 Next 服务，不能把长期供应商密钥塞进 HTML。原有算法、评分、JSON 存档格式与自由地图逻辑未改变；远程生成文字不写入学习报告或存档。

## 你需要做的配置

1. 在 DeepSeek 官方控制台自行创建 API Key、确定能接受的费用并了解数据处理条款。不把真实密钥发到聊天、截图或 Git。这里不提供未核实的价格，也不替你充值或设置账单权限。
2. 在 `D:\竞赛\PathLab-AI` 将 `.env.example` 复制为 `.env.local`；已有文件时只编辑相应字段，不覆盖。该文件被 Git 忽略。不要加 `NEXT_PUBLIC_` 前缀。
3. 填入以下配置（示例中的占位文字不是可用凭证）：

```dotenv
AI_ENABLED=true
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-flash
AI_API_KEY=在本机填写你自己的DeepSeek密钥
AI_ACCESS_TOKEN=在本机填写另一个随机访问口令
AI_ALLOWED_ORIGIN=http://127.0.0.1:3000
AI_TIMEOUT_MS=8000
AI_MAX_REQUESTS=20
```

`AI_ACCESS_TOKEN` 是 **本网站复盘接口的独立访问口令**，32–256 字符，不是 DeepSeek API Key，也不能与它相同。可在本机终端生成 48 位随机十六进制口令：

```powershell
node -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))"
```

将它填在 `.env.local`，使用页面时填入“复盘访问口令”。不要公开共享该口令；浏览器只在当前复盘组件内存持有，不保存、不回显、不发给 DeepSeek。实际供应商密钥始终仅服务端持有。

4. 在仓库根目录启动，改配置后重启进程：

```powershell
.\scripts\Invoke-ProjectNpm.ps1 run dev
```

打开 `http://127.0.0.1:3000`。若用 `localhost`、其他端口或域名，`AI_ALLOWED_ORIGIN` 必须改为地址栏的精确 origin（不带路径/末尾斜杠），然后重启。生产方式仍使用已有 `build`、`start` 脚本。保持本机监听，不要在本轮擅自发布。

5. 完成一个固定关卡的搜索，进入复盘：展开拟发送事实预览 → 输入访问口令 → 勾选发送与费用确认 → 点“请求 DeepSeek 复盘”。未揭示结果前没有远程入口。第一次真实调用需由你明确执行并核对真实返回；本轮测试不等于已经连接了你的账号。

## 已实现的数据与调用限制

- 出站地址只允许 `https://api.deepseek.com/chat/completions`；拒绝其他 base URL 和重定向，不转发浏览器 Cookie。
- 配置允许模型 `deepseek-flash` 或 `deepseek-v4-pro`，默认前者。使用非流式、非思考模式、JSON 对象输出、固定最大 1600 输出 token；不启用工具调用、检索或通用对话。
- 仅已有契约字段：关卡、算法、无身份运行标识、地图修订、揭示/提示状态、预测统计、候选行为标签、最多 100 个确定性模板事件。接口不接受额外字段或自由文本解释事件。页面预览的就是实际发送给模型的事实数据。
- 请求与供应商响应都按字节读取，上限 32 KiB；默认 8 秒，配置仅允许 1–15 秒。客户端 17 秒结束等待，不自动重试。取消不能保证供应商未计费。
- 必须同源、独立访问口令、显式同意标记。无配置、未启用、错误口令等在远程调用前返回固定状态，不泄露服务商原始错误、凭证或堆栈。
- 全进程同时最多 1 个请求、远程尝试间隔至少 10 秒、默认本进程最多 20 次尝试（可设 1–100 次，包括供应商失败）。**这不是人民币预算上限**；重启进程会重置计数，多进程各有额度。公开/多人/无服务器部署前还需持久共享限额和正式身份验证，不能把此单实例演示保护当作上线账单保障。
- 双端执行同一 JSON schema 和事件引用检查。mode 由适配器赋值；未知字段、引用错位、越级提示、未经本地支持的标签、旧运行/地图修订均不采用。即使通过也不保证自然语言事实完全正确，用户须核对引用。

## 常见状态

| 页面状态 | 处理 |
|---|---|
| 尚未启用 | `AI_ENABLED` 仍为 false；本地功能正常 |
| 配置未齐备 | 核对 `.env.local` 与口令长度、支持模型、origin；重启 |
| 访问口令不正确 | 填网站访问口令，不是供应商 API Key |
| 来源不匹配 | 地址栏 origin 与 `AI_ALLOWED_ORIGIN` 必须一致 |
| 额度或频率限制 | 至少等 10 秒；若已达进程次数，先确认预算，不用无限重启绕过 |
| 暂时不可用/超时 | 本地反馈不受影响；检查账号状态或网络，不自动重试 |
| 格式或引用检查失败 | 本次结果已弃用，不作为有效反馈；不把解析失败说成模型判断正确 |

## 文档核验记录

2026-10-17 已实际只读获取以下官方页面；web 搜索未返回可用来源卡片，改用 PowerShell `Invoke-WebRequest` 读取页面正文进行核对，没有下载 SDK、调用模型或保存整页副本。

- `https://api-docs.deepseek.com/`：当前快速开始列出 API 主机和 `deepseek-flash` / `deepseek-v4-pro`，不能沿用旧记忆硬写历史型号。
- `https://api-docs.deepseek.com/guides/json_mode`：JSON 输出要求响应格式及提示中的 JSON 指示/示例；可能出现空响应，所以仍需要解析与校验。
- `https://api-docs.deepseek.com/api/create-chat-completion`：POST 路径、thinking 开关、max_tokens、finish_reason；只接受正常 stop，截断响应按失败处理。
- 本机 `PathLab-AI/node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` 与 `01-app/02-guides/environment-variables.md`：修改前读取，采用本版本 Route Handler 与非公开环境变量。

后续官方模型或协议若变化，应重新核验后修改 allowlist；不要静默切到未验证模型。可复用流程：配置默认关 → 模拟边界测试 → 用户本机填写凭证并确认费用/数据 → 单次真实联调 → 再决定是否发布。
