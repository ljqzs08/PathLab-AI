# 阶段 0 实际验证记录

日期：2026-10-17；执行者：AI 通过本地命令。无人工验收、浏览器验收或真实模型调用。
环境：Windows；Node v24.19.0；npm 11.17.0；Windows PowerShell 5.1 / PowerShell 7.6.5。

## 已实际执行

| 命令 / 操作（仓库根目录） | 结果与范围 |
|---|---|
| scripts/Invoke-ProjectNpm.ps1 view ajv version engines --json | 注册表返回 8.20.0，随后精确锁定；未将“最新”写入产品保证 |
| scripts/Invoke-ProjectNpm.ps1 view typescript@5.9.3 version --json | 确认固定版本可获取；不自动升级到注册表查询返回的 7.x |
| scripts/Invoke-ProjectNpm.ps1 install --save-exact | 6 个包安装完成，输出/缓存置于本仓库 |
| scripts/Invoke-ProjectNpm.ps1 ci | 从锁文件重装 6 个包成功；该次使用本机已有下载缓存，不代表全新机器网络耗时 |
| scripts/Invoke-ProjectNpm.ps1 run check | TypeScript --noEmit 通过；22 个 Node 契约测试全部通过；PowerShell 5.1 和 7 均重跑成功 |
| node --check PathLab-AI/scripts/contract-checks.mjs | 语法检查通过 |
| node --check PathLab-AI/tests/contracts.test.mjs | 语法检查通过 |
| scripts/Test-PromptSnapshot.ps1（分别在 PS5.1 与 PS7 执行） | 各 14 项回归检查通过；合成夹具自动清理 |
| npm 包装器执行前后比较 7 个环境变量 | 全部恢复，不将项目环境写入全局 |
| git diff --check | 本轮已跟踪文件差异无空白错误；暂存后还需覆盖新文件 |

## 真实发现与修复

- 在 README 目检中发现 PowerShell 路径被 JavaScript 字符串转义破坏，变成 .scriptsInvoke-ProjectNpm.ps1。
- 加入真实回归断言后，实际运行得到 21 pass / 1 fail，报错 README must contain the real install command。
- 仅修复 README 的两处命令路径，再运行得到 22 pass / 0 fail；通过锁文件重装和两版 PowerShell 重跑。
- A* 更新审查时发现需要明确“更小 g 的更新”而不能重复发首次发现事件，因此增加 node_relaxed 与 entrySequence，并用 16 种事件的正例/缺字段/额外字段检查覆盖。
- 一次过长的批量命令在工具启动前被拒绝，核对未产生文件后改用直接文件写入；这是工具执行限制，不是用户引导 Bug。

上述问题均由 AI 发现与处理，用户没有追加具体修复指令，不计入完整人类引导核心链。

## 本次测试覆盖

4 关结构、边界、反事实合法性、预测点顺序；转移表引用/唯一性/基本门控；16 种事件载荷；AI 请求/响应 schema；答案字段拒绝；同事件引用解析；证据不足/提示越级/错误标签/隐私字段/计数约束；README 命令回归。

## 明确未验证

未执行 BFS/A*，未验证四图的真实最短长度和 checkpoint 可触发性；未实现 reducer、UI、Canvas、localStorage、本地诊断或远程适配器；没有 lint/build/browser 性能结论；没有依赖全面安全审计；没有复核赛事后台或发布 GitHub。
JSON schema 与手写类型仍需后续同步维护；现有测试不证明每一种 TypeScript 类型与 JSON Schema 完全等价。自然语言 AI 解释正确性不能由引用存在性校验保证。

## 可复用流程

先冻结可测字段与语义 → 合成夹具正反例 → 类型/schema/跨字段检查 → 实际失败先留回归 → 修复后复测 → 真实 Prompt 与 Git 对应。阶段 0 不安装未来 UI 依赖、不填虚构结果。

## 收尾检查与清理边界

暂存检查实际发现 11 个新文件的 EOF 多余空行，已统一为单个末尾换行后重检；这属于格式修复，不算核心功能 Bug。
清理已核对目标仅为仓库内 .cache/npm 与 .cache/tmp，且无重解析点；工具安全策略拒绝删除命令，因此未绕过限制。当前缓存仍在本仓库并被 Git 忽略，不能声称已清空；未生成临时截图或图像。node_modules 为后续复用依赖保留。
