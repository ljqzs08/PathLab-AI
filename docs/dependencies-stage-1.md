# 阶段 1 依赖核验与取舍

核验日期：2026-10-17；执行者：AI。本机 Node v24.19.0、npm 11.17.0；未修改全局配置。
从 npm 官方 registry 直接读取包元数据，并读取 Next/React 官方 GitHub 发布与官方安装/ESLint/Playwright 文档；版本不依据模型记忆。

## 精确锁定

| 依赖 | 版本 | 依据与边界 |
|---|---|---|
| next / eslint-config-next | 16.4.2 | registry 返回的稳定标签；官方 v16.4.2 发布于 2026-10-15；要求 Node >=20.9；React peer 支持 19 |
| react / react-dom | 19.3.1 | 官方 v19.3.1 发布于 2026-10-14；react-dom peer 与 React 一致 |
| typescript / ajv | 5.9.3 / 8.20.0 | 保留阶段 0 固定版本，不无故升级主版本 |
| eslint | 9.39.5 | 刻意不选 registry 最新 10.13.0：eslint-config-next 使用的 eslint-plugin-react 7.37.5 peer 仅到 ^9.7；不使用 force/legacy-peer-deps |
| @types/node | 24.19.2 | 匹配当前 Node 24，不使用返回的 Node 26 类型 |
| @types/react / @types/react-dom | 19.3.0 | 匹配 React 19；版本精确锁定 |
| @playwright/test | 1.64.1 | 仅本地工程验证；使用已安装 Edge channel，不下载浏览器 |
| @axe-core/playwright | 4.14.0 | Node >=22.12；自动检查不代替人工辅助技术验证 |

项目 engines 统一设为 Node >=22.13.0 以覆盖当前开发工具；不以 Next 单独的最低要求替代完整工具链要求。README 推荐已测 Node 24；未验证其他主版本。

## 安装与钩子

- 手工接入既有目录，不运行 create-next-app 去覆盖已有 contracts/tests 或建立嵌套仓库。
- 先生成锁文件、检查 hasInstallScript，再 ci。锁文件共 414 条 package 记录（包含跨平台可选包）；当前平台实际安装 354 个包。
- 唯一标记 hasInstallScript 的包为 unrs-resolver 1.12.2：postinstall.js 调用 napi-postinstall 的 checkAndPreparePackage。默认仍不执行，未放开钩子；本平台的可选预编译包已足以通过 lint/build。
- Next 本机 SWC 等可选包随锁文件安装，未触发外部 SWC/浏览器手动下载。跨平台若失败需重新审查，不承诺任意平台都可忽略安装脚本。
- Next 遥测关闭；XDG、npm、TEMP/TMP 与 Playwright 路径全部由项目包装器限定到 D 盘工作区。
- 安装输出明确警告 ESLint 9 已结束支持。当前为开发工具兼容取舍，不是“没有风险”；后续发布前重新核对 React lint 插件对 ESLint 10 的支持并升级，不为了消除提示强行越过 peer。
- 未执行向审计服务提交依赖清单的 npm audit；这不是完整安全审计，不能宣称无漏洞。正式部署前另做经授权的依赖审查。

## 当前官方文档适配

Next 16 不再提供 next lint，必须显式运行 ESLint；build 不作为替代 lint 的证据。
typecheck 先 next typegen，再 tsc，避免依赖未提交的生成类型；next-env.d.ts 与 .next 均不入 Git。
首次 dev 自动生成应用级 AGENTS.md；已阅读安装版本随包文档，通过官方 agentRules=false 由下一次 dev 自动移除仅含托管块的文件，保留根 AGENTS，不忽视版本文档。

## 一手来源（核验入口，不代表永久最新）

- https://registry.npmjs.org/next/latest
- https://registry.npmjs.org/react/latest
- https://registry.npmjs.org/eslint-config-next/latest
- https://registry.npmjs.org/eslint-plugin-react/latest
- https://api.github.com/repos/vercel/next.js/releases/tags/v16.4.2
- https://api.github.com/repos/facebook/react/releases/tags/v19.3.1
- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/api-reference/config/eslint
- https://nextjs.org/docs/app/api-reference/config/next-config-js/agentRules
- https://playwright.dev/docs/browsers#google-chrome--microsoft-edge
- 本地版本对应文档：PathLab-AI/node_modules/next/dist/docs/；agentRules 官方说明与 config-shared.d.ts 均实际阅读。
