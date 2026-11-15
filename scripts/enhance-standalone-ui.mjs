/** E037: additive, offline-only UI lesson; never rebuild or replace the original app. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { lightPalette } from './ui-light-palette.mjs';
import { runAstar } from '../PathLab-AI/src/domain/algorithms/astar.ts';
import { runBfs } from '../PathLab-AI/src/domain/algorithms/bfs.ts';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(ROOT, 'PathLab_AI_v4_optimized_final.html');
const backup = path.join(ROOT, 'output/backups/PathLab_AI_v4_optimized_final.before-ui-20261115.html');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const EXPECTED = '79e49cc94e14118aa7228e1fdbd2446921d90c8fc39eb736cc508bf074ade0c4';
assert.equal(sha(fs.readFileSync(backup)), EXPECTED, 'The original backup must not change.');
let html = fs.readFileSync(target, 'utf8');
html = html.replace(/\n<!-- E037:STYLE:START -->[\s\S]*?<!-- E037:STYLE:END -->\n/g, '');
html = html.replace(/\n<!-- E037:SCRIPT:START -->[\s\S]*?<!-- E037:SCRIPT:END -->\n/g, '');
// Correct unsupported claims and premature learning-success language, not algorithms.
const corrections = [
 ['h 只会“直线估计”', '本课的 h 用横向差 + 纵向差估计，暂时忽略墙'],
 ['背后常常都是 A*。', '都可以用寻路算法解决。这里用 A* 来认识这种思路。'],
 ['学会了！三句话记住 A*', '先记住三句话，再换题检验'],
 ['恭喜你，已经弄懂 A* 最核心的想法了！', '你已完成这一轮认识；是否能独立运用，还要换题检验。'],
 ['所以总是朝着终点走，不像笨办法到处乱试。', '但不保证每一步都更靠近终点，遇到墙时可能先绕远。'],
 ['所以 A* 找到的一定是最短路线。', '本页使用四方向、每步代价为 1 的地图与一致的曼哈顿估计，因此能找到最短路线；不能照搬到任意估计方法。'],
];
for (const [from, to] of corrections) {
 assert(html.includes(from) || html.includes(to), 'Missing expected teaching text: ' + from);
 html = html.replaceAll(from, to);
}
// Replace only the old unsupported welcome and ineffective theme hookup.
html = html.replace(/<!-- 改进3：欢迎弹窗 -->[\s\S]*?<aside class="standalone-notice"/, '<!-- E037 welcome uses an accessible, optional native dialog. -->\n<aside class="standalone-notice"');
html = html.replace(/<script>\s*\/\/ 改进：恢复用户之前的主题选择[\s\S]*?<\/script>/, '');
const input = { grid: { width: 7, height: 5, rows: ['.......','...#...','...#...','...#...','.......'] }, start: { x: 0, y: 2 }, goal: { x: 6, y: 2 } };
const astar = runAstar(input), bfs = runBfs(input);
let frontier = [], expanded = [], frames = [];
for (let i = 0; i < astar.events.length; i++) {
 const event = astar.events[i];
 if (event.type === 'frontier_snapshot') frontier = event.payload.nodes;
 if (event.type === 'node_expanded') expanded.push(event.payload.node);
 if (event.type === 'node_selected') {
  const route = astar.events.slice(i + 1).find(e => e.type === 'path_updated');
  frames.push({ selected: event.payload, frontier: [...frontier], expanded: [...expanded], path: route.payload.nodes, final: route.payload.final });
 }
}
assert.equal(astar.metrics.pathLength, bfs.metrics.pathLength);
const data = { input, frames, astar: astar.metrics, bfs: bfs.metrics, path: astar.path };
const legacyCss = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const css = lightPalette(legacyCss) + '\n' + fs.readFileSync(path.join(ROOT, 'scripts/ui-beginner.css'), 'utf8') + '\n' + fs.readFileSync(path.join(ROOT, 'scripts/web-review-entry.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'scripts/ui-beginner.js'), 'utf8') + '\n' + fs.readFileSync(path.join(ROOT, 'scripts/web-review-entry.js'), 'utf8');
assert(!js.includes('</script>'), 'Escape script closing tags.');
html = html.replace('</head>', '\n<!-- E037:STYLE:START -->\n<style id="pl-ui-enhancement">\n' + css + '\n</style>\n<!-- E037:STYLE:END -->\n</head>');
const injection = '\n<!-- E037:SCRIPT:START -->\n<script id="pl-coach-data" type="application/json">' + JSON.stringify(data) + '</script>\n<script id="pl-ui-script">\n' + js + '\n</script>\n<!-- E037:SCRIPT:END -->\n';
html = html.replace('</body>', injection + '</body>');
if (process.argv.includes('--check')) {
 assert.equal(fs.readFileSync(target, 'utf8'), html, 'Target does not match reproducible enhancement.');
 console.log('Reproducible HTML verified: ' + sha(Buffer.from(html)));
} else {
 fs.writeFileSync(target, html);
 console.log(JSON.stringify({target, originalSha256: EXPECTED, enhancedSha256: sha(Buffer.from(html)), bytes: Buffer.byteLength(html), frames: frames.length, astar: astar.metrics, bfs: bfs.metrics},null,2));
}
