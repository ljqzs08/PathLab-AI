# Next.js 工程目录（不是完整参赛材料包）

[当前正式参赛入口](../00-正式参赛入口.md) · [仓库首页](../README.md)

## 先区分两个作品工件

| 工件 | 定位 |
| --- | --- |
| 根目录 `PathLab_AI_v4_optimized_final.html` | **当前选定的增强版作品**，E037 / E038 已包含 |
| 本目录 `PathLab AI.html` | 现有 Next 工程的离线生成物，保留原有演进；不是当前增强主件的字节副本 |

本目录的 package.json 版本为 `4.0.0`，不代表正式材料或独立增强 HTML 又发布了一个新版本。
不得把 `build:html` 覆盖到根目录，或声称工程构建自动包含独立增强层。

## 运行和检查

**以下命令从仓库根目录执行**，不要在本目录另建 Git 仓库或全局安装依赖。

```powershell
.\scripts\Invoke-ProjectNpm.ps1 ci
.\scripts\Invoke-ProjectNpm.ps1 run check
.\scripts\Invoke-ProjectNpm.ps1 run dev
```

开发服务默认仅绑定 `127.0.0.1:3000`。新安装需要网络；本地学习不要求模型账号或 API Key。
完整前提、生产构建、浏览器工具和历史计时见 [工程指南](../docs/development-guide.md)。
增强主件的可重现检查和底稿边界也在那里单列。

`src/domain` 为算法/学习领域实现；`contracts/`、`fixtures/` 与 `tests/` 支撑规格和检查。
可选服务端模型能力默认关闭；离线 HTML 不携带密钥，不把协议模拟当成真实付费联调。

本次只新增目录说明，未修改本目录的代码、配置、锁文件或生成 HTML，也没有重跑产品回归。
