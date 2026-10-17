# 本地诊断与可选 AI 契约 v1

阶段 0 只创建 schema、类型、合成夹具及证据引用检查；没有实现本地诊断引擎、HTTP 请求或任何真实模型调用。

## 请求

contracts/feedback-request.schema.json 是唯一允许字段集：schemaVersion、levelId、algorithm、runId（无身份随机标识）、gridRevision、requestedHintLevel、answerRevealed、facts。
facts 仅含 predictionCount、correctCount、candidateErrorTypes、事件事实摘要。事件摘要由后续本地确定性代码模板生成，不直接拼接用户自由文本；最多 100 条，每条 500 字以内。
不会上传账号、邮箱、Cookie、API Key、完整会话、文件路径、原始键盘输入或复盘自由文本。阶段 0 的示例明确标注 SYNTHETIC，不是 AI 输出或真实学习数据。

## 响应

contracts/feedback.schema.json：schemaVersion、mode、summary、primaryErrorType（六类之一或 null）、evidence、hintLevel、nextQuestion、recommendation、insufficientEvidence。
严格拒绝未知字段，不把任意文本当 HTML、脚本或链接执行。所有模型文字按纯文本渲染。mode 最终由适配器按实际来源赋值，不能让模型自己声称 remote。
每条 evidence 采用 eventId + factPath。MVP factPath 仅接受 /facts/events/N/description，必须解析到同一条提供给模型的事件；不允许不存在的 ID、跨运行猜测或越界索引。
只接受本地已建立的候选错误标签；primaryErrorType 不得凭语言模型推断增加。insufficientEvidence=true 时标签必须 null；有判断时必须有证据。

## 分层提示与防泄露

1 观察 → 2 规则 → 3 比较 → 4 揭示。提示不得高于用户已请求级别。
MVP 在提交预测前只使用本地模板，不调用远程；提交前不把实际答案放进请求或 DOM。预测后 answerRevealed=true 才可请求远程解释，避免仅靠提示词承诺“不泄题”。
JSON 格式、引用合法不等于自然语言事实正确；上线前须测试远程解释与事实一致，无法确定时展示已验证本地反馈，不声称能完全消除幻觉。

## 失败回退（E017 已实现，未真实联调）

默认未配置 → 本地；明确启用后才发送脱敏摘要。服务端从 AI_BASE_URL/AI_API_KEY/AI_MODEL/AI_TIMEOUT_MS 读取配置；默认 timeout 8000ms，超时中断一次请求，不无限重试。
超时、HTTP 非成功、无效 JSON、schema 不通过、引用失配、旧 runId/revision 响应、提示越级均回退本地，并给可理解状态。最多接受 32 KiB 响应；不得将密钥、原始请求或服务商堆栈输出到客户端。
切换任务/实验后旧响应丢弃。无网络时所有算法与课程仍可完成。阶段 0 当时未实现；E017 现提供默认关闭的 POST /api/feedback，仅在明确配置、同源、独立口令和主动同意时调用。供应商与请求体按字节限长；固定 DeepSeek HTTPS 地址并拒绝跳转；并发 1、10 秒间隔、默认进程内 20 次尝试，没有自动重试。进程重启/多实例不能共享额度，不能声称货币预算保障。详见 deepseek-setup.md。

## 六类错误的证据门槛

- misunderstand_queue_order：实际 FIFO 队首与用户选择不一致；只能说本次选择不符合队列顺序。
- only_goal_distance / ignore_path_cost：需要多次选择及对应 g/h/f 对比，不能由单次误选断言原因。
- confuse_search_and_path：必须有针对两种指标的明确题目回答，不能仅由路线点击推断。
- overtrust_greedy_choice：需对应解释选项或重复证据；不与 only_goal_distance 重复统计为两次错误。
- cannot_explain_counterfactual：需旧路径引用或明确条件变更题目回答；缺作答就是证据不足。

本地规则将先落地可观测、可测试的子集；没有足够题目/事件支持的标签保持未判定。


## 阶段 5A 本地实现（无远程请求）

src/domain/learning/diagnose.ts 使用已完成运行的确定性模板生成原 schema 请求形状和 mode=local 反馈；request 只在内存供证据解析，不发送。assertFeedbackReferences 校验精确事件路径、候选标签、提示和证据不足边界，Node 测试同时通过原始 JSON schema 与关系检查。

当前仅建立 BFS 实际 FIFO 不一致的行为标签。A* 错选只陈述实际选择差异、标签 null，明确证据不足；其他五类不强行推断。用户复盘自由文本不拼入 fact.description；无真实模型调用、没有远程失败回退实现。报告记录齐备仅表示操作证据齐备，不证明理解或自然语言解释正确。

阶段 5B 已将上述本地规则反馈与引用证据连接 ReflectionPanel。页面明确显示“规则模板 · 未调用模型”；解释按 React 纯文本呈现，浏览器测试的脚本形状文本未执行，测试流程没有外部请求或存储写入。这不是未来远程服务的安全或事实一致性验收。

## E017 可选 DeepSeek 实现

以上阶段 0/5 描述保留为历史事实。当前复盘组件先展示本地结果，再提供独立远程补充区；只有完成运行且 answerRevealed=true 时才出现。请求复用原契约，额外拒绝 reflection_completed 事件（本地生成器本来就不导出该自由文本事件）。仅 Next 路由调用服务端适配器，mode 由适配器覆盖；前端复验引用、runId/revision。AJV 从开发依赖改为运行依赖，无新 SDK。

服务端 API Key 不进入客户端；客户端仅内存持有网站独立访问口令。HTTP 失败只返回固定状态，不回传供应商文本或凭证。远程结果不修改本地判断、分数、报告、存档或搜索结果；切换任务/进入条件实验/重置将取消并弃用旧响应。完整 HTML 入口显式标记 standalone，即使静态托管也不启用远程控件。

本轮未调用真实 DeepSeek，所有成功文本是合成模拟。格式和引用校验并不证明模型推理正确；需要用户配置与费用/数据同意后才可做真实联调。验证见 verification-deepseek.md。
