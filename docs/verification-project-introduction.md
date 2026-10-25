# 作品介绍文档本地验证记录（E024）

核对日期：2026-10-25 15:55（Asia/Shanghai）
执行者：AI，在 `D:\竞赛` 工作区内执行。
范围：只验证本轮作品介绍材料的生成、截图来源、PDF 结构和视觉版式；不把材料检查冒充产品回归、人工验收或真机验收。

## 1. 产物与来源

- 可编辑稿：`docs/project-introduction.md`
- 生成脚本：`scripts/build-project-introduction.py`
- HTML 截图脚本：`scripts/capture-project-introduction.cjs`
- 正式 PDF：`output/pdf/PathLab-AI-作品介绍文档.pdf`
- 生成校验记录：`output/pdf/PathLab-AI-作品介绍文档-校验记录.json`
- 来源清单：`output/pdf/PathLab-AI-作品介绍文档-来源清单.json`
- 截图清单：`docs/assets/project-introduction/capture-manifest.json`
- 真实 Prompt 快照：
  - `prompts/sessions/2026-10-25-project-introduction.md/.jsonl`
  - `prompts/sessions/2026-10-25-project-introduction-continue.md/.jsonl`

截图源为 `PathLab-AI/PathLab AI.html`。`capture-manifest.json` 记录其 SHA256、视口、状态和每张图的 SHA256；本轮没有下载或引入外部图片。

## 2. 实际执行与结果

### HTML 截图

已执行的生成命令：

```powershell
node .\scripts\capture-project-introduction.cjs
```

脚本通过项目现有 Playwright 与无头 Microsoft Edge 打开本地 `file://` HTML，依次捕获首页、L01 预测、搜索结果、单因素对照、网页辅助复盘、事件引用报告、自由地图、存档面板和 390×844 模拟移动视口，共 9 张正式截图。

脚本内置断言与实际结果：

- 页面异常：0；
- 外部网络请求：0；
- 截图数量：9；
- 未打开 DeepSeek；
- 未发送真实聊天；
- 未进行人工或手机真机验收。

9 张正式截图位于 `docs/assets/project-introduction/`，属于证据材料，不作为临时图清理。

### PDF 构建

已执行的生成命令：

```powershell
python .\scripts\build-project-introduction.py
```

构建脚本固定在 D 盘工作区运行，读取可编辑稿和截图清单，断言 15 个页面分段、每页内容未溢出、截图哈希一致，并重新写出 PDF、来源清单、校验记录和 `.sha256` 文件。

### PDF 结构检查

实际核对结果：

- A4，15 页，满足不超过 30 页；
- PDF 未加密，无自动打开动作；
- 15 页均能提取到超过 100 个字符，未发现替换字符或黑方块；
- 9 个嵌入图像对象与截图清单数量一致；
- TrueType 字体嵌入情况已在校验记录中保留；
- PDF SHA256 与同名 `.sha256` 一致：
  `9af5d3182881c005775e6139e8d18dce855389dbb3e7cc91574b4b28b3cb2339`。

### PDF 视觉检查

已用 Poppler 将 15 页以 100 dpi 渲染至 `.cache/project-introduction-review/`，并查看 4 张联系表，覆盖全部 15 页。检查项包括：

- 标题、页眉、页脚、页码和章节切换；
- 中文字形、表格、图片边界和图注；
- 图片缩放、裁切、重叠和空白页；
- 页面 15 的图片索引与来源说明。

结果：未观察到文字越界、图片裁切、元素重叠、中文缺字、黑块、表格破坏或不可读的截图放置。该检查是 AI 视觉复核，不是人工签字。

## 3. 内容覆盖核对

正文已覆盖用户指定的七项：

1. 项目详情及使用方式；
2. 项目亮点；
3. AI 测试技术落地概述；
4. 关键技术；
5. HTML 实际运行截图；
6. 未获奖、发表与公开托管的区分说明；
7. 既有骨架上的实际优化，以及第三方基础设施的边界说明。

“本作品未获奖”来自用户原话；该声明没有被包装成外部独立核验结果。GitHub Public 是代码托管状态，不等同于论文、期刊或正式发表。

## 4. 真实性边界与剩余风险

以下事项本轮没有完成，文档也没有宣称完成：

- 人工验收、真实手机验收、屏幕阅读器和跨真实设备体验；
- 作品视频、报名系统中的正式提交回执；
- DeepSeek 真实付费 API 联调或网页聊天发送；
- 学习效果、教学效果或性能提升的外部研究结论；
- 三条 C01/C02/C03 核心链全部具备独立用户引导 Bug 修复材料。

本轮没有重跑完整产品回归套件；历史套件结果仅按来源清单中的既有证据引用。作品介绍 PDF 的 `productRegressionSuiteRerun`、`humanOrRealDeviceAcceptance`、`uploadPerformed` 仍为 `false`。

## 5. 清理边界

本轮保留正式 PDF、可编辑稿、构建脚本、来源清单、验证文档、Prompt 快照和 9 张正式截图。已清理本轮用于视觉检查的临时渲染图、联系表和探针图；不删除正式截图，也不删除与历史阶段有关的既有缓存或未跟踪文件。
