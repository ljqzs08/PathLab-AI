/** Builds the real client application, styles and data into ONE portable HTML file. */
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rmdir, unlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = dirname(app);
const cache = join(workspace, '.cache');
const target = join(app, 'PathLab AI.html');
const require = createRequire(import.meta.url);
// The installed, pinned Next release already includes webpack; no download/new dependency.
// This is a separate compiler, NOT a modification of Next's runtime/configuration.
const { webpack } = require('next/dist/compiled/webpack/webpack');
const { minify } = require('next/dist/compiled/terser');
await mkdir(cache, { recursive: true });
const temporary = await mkdtemp(join(cache, 'standalone-build-'));
const inside = relative(cache, temporary);
if (!inside || inside.startsWith('..') || isAbsolute(inside)) throw new Error('Build path outside workspace.');

try {
  const compiler = webpack({
    mode: 'production',
    context: app,
    entry: join(app, 'src/standalone.tsx'),
    target: ['web', 'es2022'],
    cache: false,
    devtool: false,
    performance: false,
    output: {
      path: temporary,
      filename: 'pathlab.js',
      publicPath: '',
      iife: true,
      asyncChunks: false,
      chunkLoading: false,
    },
    resolve: { extensions: ['.tsx', '.ts', '.js', '.json'] },
    module: { rules: [{
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: { loader: join(app, 'scripts/standalone-typescript-loader.mjs') },
    }] },
    optimization: { splitChunks: false, runtimeChunk: false, minimize: false },
  });
  const stats = await new Promise((accept, reject) => {
    compiler.run((error, result) => {
      compiler.close(closeError => {
        if (error || closeError) reject(error ?? closeError);
        else if (!result || result.hasErrors() || result.hasWarnings()) {
          reject(new Error(result?.toString({ all: false, errors: true, warnings: true }) ?? 'No compiler result.'));
        } else accept(result);
      });
    });
  });
  const assets = stats.toJson({ all: false, assets: true }).assets.map(asset => asset.name);
  if (assets.some(name => name !== 'pathlab.js')) {
    throw new Error('Single-file export emitted unexpected sidecar assets: ' + assets.join(', '));
  }
  const uncompressed = await readFile(join(temporary, 'pathlab.js'), 'utf8');
  const compressed = await minify(uncompressed, { ecma: 2022, format: { comments: /@license|@preserve|^!/ } });
  if (!compressed.code) throw new Error('No browser bundle emitted.');
  const javascript = compressed.code.replace(/<\/script/gi, '<\\/script');
  const styles = (await Promise.all(['globals.css', 'learning.css'].map(name => readFile(join(app, 'src/app', name), 'utf8')))).join('\n').replace(/\r\n?/g, '\n');
  if (/@import\b|url\(|<\/style/i.test(styles)) throw new Error('Inline styles must not depend on external assets.');
  // Canonical raw text keeps the single-file bytes stable across Windows Git checkouts.
  const icon = (await readFile(join(app, 'src/app/icon.svg'), 'utf8')).replace(/\r\n?/g, '\n');
  const notices = await Promise.all(['react', 'react-dom', 'scheduler'].map(async name => {
    const root = dirname(require.resolve(name + '/package.json'));
    const license = await readFile(join(root, 'LICENSE'), 'utf8');
    if (license.includes('-->')) throw new Error('License cannot be safely embedded in an HTML comment.');
    return name + '\n' + license;
  }));
  const html = `<!doctype html>
<!-- Third-party runtime license notices
${notices.join('\n\n')}
-->
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0b1118">
<meta name="description" content="PathLab AI 完整单文件 HTML：四关 BFS/A*、预测、Canvas 回放、条件实验、证据报告与本机备份，可断网运行。远程 AI 未接入。">
<title>PathLab AI · 路径学习实验室</title>
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(icon)}">
<style>${styles}
.standalone-notice { margin: 0; padding: 8px 20px; border-bottom: 1px solid var(--line); color: var(--muted); background: var(--surface); text-align: center; font-size: 12px; line-height: 1.7; }
.standalone-loading { padding: 36px 20px; }
</style>
</head>
<body>
<aside class="standalone-notice" aria-label="单文件运行说明"><p role="note">完整 HTML 单文件版 · 无需服务器，可断网使用 · 本机存档受浏览器策略影响，请定期导出 JSON 备份。</p></aside>
<div id="pathlab-root"><main class="standalone-loading"><h1>PathLab AI · 路径学习实验室</h1><p>正在从此 HTML 文件加载完整应用…</p><noscript><p>请启用浏览器 JavaScript，再重新打开此文件。无需联网或启动服务器。</p></noscript></main></div>
<script>${javascript}</script>
</body>
</html>
`;
  await writeFile(target, html, 'utf8');
  console.log(JSON.stringify({
    target,
    bytes: Buffer.byteLength(html, 'utf8'),
    sha256: createHash('sha256').update(html).digest('hex'),
    embedded: 'production React runtime, shared components/domain, fixtures, both stylesheets and SVG icon',
    externalAssets: 0,
    serverRequired: false,
  }, null, 2));
} finally {
  // Only files in the newly created directory, never the existing project/browser caches.
  for (const entry of await readdir(temporary, { withFileTypes: true })) {
    if (!entry.isFile()) throw new Error('Unexpected directory in compiler output; retained for inspection.');
    await unlink(join(temporary, entry.name));
  }
  await rmdir(temporary);
}
