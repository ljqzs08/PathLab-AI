# 脚本导航

[当前正式参赛入口](../00-正式参赛入口.md) · [工程运行指南](../docs/development-guide.md)

命令默认从仓库根目录运行；所有新产物和缓存保存在 D 盘本项目，不写入其他盘符。
脚本存在不代表本轮已经执行；构建、冻结、发布和读取核验是不同步骤。

| 工具 | 用途与注意事项 |
| --- | --- |
| `Invoke-ProjectNpm.ps1` | 工程依赖、构建和测试的工作区包装器 |
| `enhance-standalone-ui.mjs --check` | 校验已有根目录增强 HTML 与源码/受保护底稿；先安装工程依赖，不写产品 |
| `Export-PromptSnapshot.ps1` | 从只读真实会话提取指定轮可见消息，不导出隐藏推理或凭证 |
| `build-formal-submission.py` | 正式包白名单选材、分阶段冻结；**不要为修改导航而重建已发布的冻结包** |
| `verify-formal-submission-artifacts.py` | 独立核对正式包、来源与受保护旧目录 |
| `verify-formal-github-publication.py` | 原发布的全量匿名附件下载校验；不是产品回归，会产生下载副本 |
| `verify-github-navigation.py` | 本轮只读导航/链接/版本/原件检查，可选匿名核对远端 README、Release、附件元数据与旧标签 |

本轮导航校验（无需安装新依赖）：

```powershell
python -B scripts/verify-github-navigation.py
# 发布后指定本轮已实际推送的提交；以下示例哈希由实际 git rev-parse HEAD 提供：
python -B scripts/verify-github-navigation.py --public --expected-main (git rev-parse HEAD)
```

脚本只使用 Python 标准库；公开核验不使用认证、不重新下载 131.75 MB 原 ZIP。
完整原 ZIP 字节下载检查已在 E041 完成；本轮核对本地原件及公开资产 ID、大小和 GitHub digest 未变，不冒充重复全量下载。
