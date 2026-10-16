# PathLab AI

让算法初学者先预测，再通过确定性搜索与证据反馈理解“为什么这样走”。

**当前状态：阶段 0 规格与契约基线，尚无可运行网页、BFS/A* 内核或真实 AI 服务。** 不要将当前仓库作为最终参赛作品提交。

## 仓库布局

- docs/：产品/架构/关卡/状态机/事件/AI 契约、验收、演进和验证记录。
- PathLab-AI/contracts/：TypeScript 类型与 JSON Schema；fixtures/：固定任务与合成测试夹具。
- PathLab-AI/tests/：仅规格测试；不会验证应用算法或浏览器。
- prompts/sessions/：带来源/哈希的真实可见对话快照。
- scripts/：本地 npm 环境包装与真实 Prompt 提取工具。

## 运行当前检查

需要已安装 Node.js 22+ 与 npm（本次环境为 Node 24.19.0）；不需要 API Key。
在仓库根目录使用 Windows PowerShell 5.1 或 PowerShell 7：

~~~powershell
.\scripts\Invoke-ProjectNpm.ps1 ci
.\scripts\Invoke-ProjectNpm.ps1 run check
~~~

包装器将 npm 下载缓存和子进程 TEMP/TMP 限定在当前仓库的 .cache 中，默认关闭安装脚本与自动审计/更新通知，不修改用户全局配置。运行环境二进制可只读使用已安装位置，依赖与输出不转移盘符。下载仅安装锁定的开发期检查依赖，不上传项目。

check = TypeScript --noEmit + Node 测试执行器（Ajv JSON Schema 与跨字段校验）。当前没有 dev/build/lint 脚本，不谎称已有应用构建结果；下一阶段再建立前端最小壳与相应检查。
node_modules 是需要复用的已安装依赖，不作为垃圾删除；本轮无用 .cache、临时检查图应在收尾清理。它们均不提交。

## 推荐阅读顺序

1. docs/product-spec.md：目标、范围、真实指标与非目标。
2. docs/levels.md、state-machine.md、events.md：固定数据与交互约束。
3. docs/ai-contract.md：证据门槛、默认本地、失败回退。
4. docs/acceptance.md：阶段与最终作品的差距。
5. docs/evolution-log.md、verification-stage-0.md：实际过程与验证边界。

## 真实性与隐私

默认无外发，无 GitHub remote。创建/推送/公开与评审授权需用户确认。提交作者邮箱可能随未来公开历史曝光，发布前确认。
合成 fixtures 不是用户对话、模型实测或人工验收。AI 自查不冒充用户引导修复。每轮最后答复若尚未落盘，下一轮从原始记录补齐，不编造。

## 下一步（待确认）

建立 Next.js + React + TypeScript 最小可启动项目壳，保留当前契约与固定数据；不在阶段 0 偷跑 Canvas、算法或远程 AI。
