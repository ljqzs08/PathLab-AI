# U01：作者引导 AI 修复“入口文件代替完整网站”的交付错误

这是实际发生的用户纠正，不是为满足参赛要求补写的示例。两轮完整原文共 **7 条可见消息**，角色和顺序保留。本文为编辑导引。

## 1. 原需求 → AI 错误理解

[原要求轮完整 Markdown](../sessions/2026-10-17-local-html-entry.md) / [JSONL](../sessions/2026-10-17-local-html-entry.jsonl)。

- 来源行 3922，用户原话：“把这个地址单独放到path lab AI文件中，并帮我弄成HTML文件”。
- 来源行 3925，AI 明确表示将做“HTML 入口文件”，没有转换完整应用。
- 来源行 4001，AI 当轮最终答复及 `5e369b5` 交付了入口；[实际旧产物检查](../../docs/evidence/standalone-before.json)。**不把这次错误改写为一次完成。**

## 2. 用户明确纠正 → AI 调整方案

[修正轮完整 Markdown](../sessions/2026-10-17-standalone-html-correction.md) / [JSONL](../sessions/2026-10-17-standalone-html-correction.jsonl)。

> 我的意思是让你把这个网站制作成HTML文件，不是建一个HTML 的访问入口 ，重新修改

上句为来源行 4008 的用户原文正文；尾部原始空白以 JSONL 为准。来源行 4011，AI 承认误解，并明确改为完整、可双击离线运行且保留学习功能的 HTML，不依赖 localhost。这是**作者实际引导的交付错误修复**，不是算法正确性缺陷。

## 3. 实际实现 → 失败 → 修复与验证

- 修复提交 `4b11729`：共享现有组件、算法和样式构建完整单文件，替换误做入口。
- [首次构建实际失败](../../docs/evidence/standalone-first-build.txt)；[离线初轮报告](../../docs/evidence/standalone-browser-initial.json) 为 180/188。
- 来源行 4272 的 AI 可见消息说明修复无障碍地标与旧测试对本地文件的误拦截。这些后续问题由 AI 自测发现，**不冒充用户追加报错**。
- [最终离线报告](../../docs/evidence/standalone-browser.json) 为 188/188；[HTTP 回归](../../docs/evidence/standalone-next-browser.json) 为 176/176。来源行 4457 为真实最终答复。
- 完整命令、校验和与当时范围：[离线 HTML 验证](../../docs/verification-standalone-html.md)。这里是该次历史修复结果，不用其旧 HTML SHA256 代表后续新增网页复盘后的最新版。

## 4. 可以与不可以声称的内容

可以声称作者指出交付偏差、AI 改方案、代码确实修正并完成 AI 自动回归。不可以声称作者亲自跑了 188 个场景、三条算法链各有用户报错，或本包等于真机/真人验收。是否将离线完整应用交付认定为赛事核心迭代，由评审判断。

[返回材料入口](README.md)
