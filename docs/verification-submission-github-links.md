# E026：参赛材料增补 GitHub 直接入口

日期：2026-10-25。执行者：AI。前轮材料提交为 `687c58ba74a37b3b6c863bd8711f23194dd59e12`。本轮只增补本地材料链接，没有发布、推送或表单提交。

## 目标与已落地结果

用户提供 `https://github.com/ljqzs08`，它是作者个人主页。评审主入口使用具体作品仓库 `https://github.com/ljqzs08/PathLab-AI`，个人主页另列作补充，不让评委自己查找项目。

现有交付目录仍为 `D:\竞赛\delivery\PathLab-AI-参赛整理-20261025\`，无需在多个新版目录中猜选：

- `GitHub作品仓库地址.txt`：可复制的仓库 / 主页、用途与版本说明；完整 ZIP 根目录和解压版也各有相同文件。
- `00-提交说明.html` 与解压版的 `00-评审入口.html`：顶部独立 GitHub 区块，可点击、可键盘聚焦，仓库和主页分开标注；纯静态，无自动外网请求。
- 两份入口 Markdown 和包内字段说明同步。
- `01-上传网盘/PathLab-AI-完整作品材料-不含视频.zip`：更新后的唯一应发送 ZIP。SHA256、manifest 和 `packet-build-verification.json` 均同步。
- 构建脚本已同步，后续重建不会丢失新入口；默认拒绝覆盖既有目录的保护未移除。

仓库是源码托管地址，不是在线运行网站。两份 PDF 随本地材料提供，本轮没有把它们上传到 GitHub。GitHub 不替代预指导表第 5 项的网盘分享地址，视频仍需本人后补并符合表单要求。

## 校验与版本保留

原 E025 ZIP 的大小 / 哈希 / 425 条目是当时真实冻结结果，不覆盖旧验证证据。原 ZIP、校验文件、顶层导航及构建记录已复制保留在 D 盘 `delivery/.history/PathLab-AI-参赛整理-20261025-E025/`。

更新后的 ZIP：

- 大小：7,697,227 字节，约 7.70 MB。
- 426 条目 = 425 内容文件 + manifest。
- SHA256：`375ab8b4702235034f3cc065d9374f0fc6da6f435cbb3a36d1f94ae153d53a24`。
- 对比前版：新增链接 TXT；原有 3 份入口 / 说明文本与 manifest 更新，另 421 条目保持原字节。两份 PDF、384 源码文件、离线 HTML、完整 Git bundle、原 Prompt ZIP、9 张正式截图全部不改。
- ZIP 重开 CRC / 全内容 SHA、逐文件与解压版一致、SHA256 旁置文件重开、外层 / 包内 TXT 一致通过。
- 构建工具 11/11 单测通过，D 盘与禁止覆盖 / 私密路径边界仍通过。
- Edge AI 自动检查两页面 × 1440 / 390 两宽度：12 个本地文件目标存在；各页面两条外链正确；键盘聚焦、无水平溢出、无页面异常、无自动外网请求。4 张页面截图已由 AI 查看；不是人工或真机验收，没有重跑应用全套功能测试。
- GitHub API 无凭证只读复核：`full_name=ljqzs08/PathLab-AI`、`private=false`、`archived=false`；只证明本次核验时的状态，不承诺未来不变。无登录或外发修改。

实际命令（所有输出都在 D 盘；运行时只读）：

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
$env:TEMP='D:\竞赛\.cache\tmp'; $env:TMP=$env:TEMP
$python='C:\Users\LJQ\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $python -B 'D:\竞赛\scripts\test-submission-packet.py'
& $python -B 'D:\竞赛\scripts\build-submission-packet.py' --verify 'D:\竞赛\delivery\PathLab-AI-参赛整理-20261025\01-上传网盘\PathLab-AI-完整作品材料-不含视频.zip'
```

归档证据：`docs/evidence/submission-github-link-{readonly,update,tool-tests,browser,prompt,cleanup}-20261025.*`。本轮新建的 4 张检查图按精确 D 盘文件路径尝试清理，但整个删除命令被工具策略拒绝，尚留在 `.cache/e026-github-*.png`；未换 shell / 运行时绕过，也未触碰前轮清理受阻目录或 9 张正式证据图。

## 真实 Prompt、Git 与边界

- 上轮真正最终答复（来源第 491 行）已补至 `prompts/sessions/2026-10-25-submission-organize-completion-final.{md,jsonl}`。
- 本轮用户要求与已落盘可见说明：`prompts/sessions/2026-10-25-submission-github-links.{md,jsonl}`，3 条真实消息，行号 / 原文 SHA 校验。标准脚本不能识别本次内部交接，故按原始行补充摘录并明确排除该内部记录；没有把内部交接当用户可见收尾。不是工具原生完整导出。
- 本轮最终答复待真实落盘，下一轮补齐；核心选编仍是原有 9 轮 / 38 条消息，不因链接整理增加。
- C01/C02/C03 的实现、共享开发轮来源与人工引导材料边界不变，U01 仍为真实作者 HTML 纠正；不制造三次用户 Bug。
- 暂存检查曾发现补充摘录的空 phase 展示标题有尾空格；已仅修正包装标题，原始消息文本、来源行和 JSONL SHA 不改，重新通过空白检查。这是本轮 AI 自检，不是用户报 Bug。
- 本地普通细粒度提交，不 push、不改写历史；不夹带本轮前已存在的 HTML 假脏、旧测试草稿和四个旧 Prompt 文件。新提交哈希产生后在最终回复报告，避免自引用。

## 下次复用

保持“具体仓库主入口 + 作者主页补充 + 纯文本备用 + 包内外同步 + 重开 ZIP 验 SHA”的方式；修改链接后同步构建脚本，不重写无关 PDF 或应用。
