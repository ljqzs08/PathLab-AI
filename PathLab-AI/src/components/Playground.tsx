import { useEffect, useRef, useState } from 'react';
import type { Algorithm, Position } from '../../contracts/types';
import type { SearchInput } from '../domain/grid';
import { comparePlayground, createPlayground, editPlayground, type ExpansionGuess, type PaintTool, type PlaygroundPreset } from '../domain/playground';

const names = { bfs: 'BFS', astar: 'A*', tie: '一样多' };
const key = (node: Position) => node.x + ',' + node.y;

export function Playground() {
  const [map, setMap] = useState(() => createPlayground('detour'));
  const [history, setHistory] = useState<SearchInput[]>([]);
  const [tool, setTool] = useState<PaintTool>('wall');
  const [guess, setGuess] = useState<ExpansionGuess | ''>('');
  const [result, setResult] = useState<ReturnType<typeof comparePlayground> | null>(null);
  const [algorithm, setAlgorithm] = useState<Algorithm>('bfs');
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [focused, setFocused] = useState('0,0');
  const [notice, setNotice] = useState('选择画笔后点格子；先猜哪种算法扩展更少，再查看真实结果。');
  const gridRef = useRef<HTMLDivElement>(null);
  const run = result?.[algorithm];
  const selections = run?.events.filter(event => event.type === 'node_selected').map(event => event.payload.node) ?? [];
  const total = selections.length;
  const visited = new Set(selections.slice(0, cursor).map(key));
  const path = new Set(cursor === total && run ? run.path.map(key) : []);
  const current = cursor > 0 ? key(selections[cursor - 1]!) : null;

  useEffect(() => {
    if (!playing || cursor >= total) return;
    const timer = window.setTimeout(() => {
      setCursor(cursor + 1);
      if (cursor + 1 >= total) setPlaying(false);
    }, 320 / speed);
    const visibility = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', visibility);
    return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', visibility); };
  }, [playing, cursor, total, speed]);

  const clearRun = () => { setResult(null); setGuess(''); setCursor(0); setPlaying(false); };
  const replaceMap = (next: SearchInput) => {
    if (next === map) { setNotice('起点终点不能被封锁或重叠；相同画笔不会重复修改。'); return; }
    setHistory(previous => [...previous.slice(-39), map]); setMap(next); clearRun();
    setNotice('地图已更新，旧对比已清除。请重新预测；可撤销最近 40 次编辑。');
  };
  const paint = (node: Position) => replaceMap(editPlayground(map, tool, node));
  const undo = () => {
    const previous = history.at(-1); if (!previous) return;
    setMap(previous); setHistory(history.slice(0, -1)); clearRun(); setNotice('已撤销，重新预测后可比较。');
  };

  return <section id="free-playground" className="playground" aria-labelledby="playground-title" data-testid="playground">
    <div className="playground-heading"><div><p className="eyebrow">BUILD · PREDICT · COMPARE</p><h2 id="playground-title">自由地图实验室</h2></div><span className="neutral-badge">离线玩法 · 不计入四关成绩</span></div>
    <p className="playground-description">自己设路障、移动起终点，让 BFS 与 A* 在同一张地图上较量。挑战：造一张必须绕路的地图，再猜谁扩展更少。此区仅本次页面有效，刷新不保留，也不包含在学习存档中。</p>
    <div className="playground-layout">
      <div>
        <div className="playground-tools">
          <label>编辑画笔<select aria-label="地图编辑画笔" value={tool} onChange={event => setTool(event.target.value as PaintTool)}><option value="wall">添加障碍</option><option value="erase">擦除障碍</option><option value="start">移动起点 S</option><option value="goal">移动终点 G</option></select></label>
          <button type="button" className="action-secondary" disabled={!history.length} onClick={undo}>撤销编辑</button>
        </div>
        <div className="playground-presets" role="group" aria-label="练习地图预设">{([['open', '空白地图'], ['detour', '绕路挑战'], ['fork', '岔路探索']] as const).map(([id, label]) => <button type="button" className="action-quiet" key={id} onClick={() => replaceMap(createPlayground(id as PlaygroundPreset))}>{label}</button>)}</div>
        <p id="playground-help" className="playground-help">点按或 Enter / 空格绘制；方向键移动焦点。S 起点 · G 终点 · ■ 障碍 · · 已选节点 · ◆ 最终路径。</p>
        <div ref={gridRef} className="playground-grid" role="group" aria-label="自由地图，9列7行" aria-describedby="playground-help" data-testid="playground-grid">
          {map.grid.rows.flatMap((row, y) => [...row].map((cell, x) => {
            const node = { x, y }, id = key(node), start = key(map.start) === id, goal = key(map.goal) === id;
            const kind = start ? 'start' : goal ? 'goal' : cell === '#' ? 'wall' : 'road';
            const state = path.has(id) ? 'path' : visited.has(id) ? 'visited' : 'idle';
            const label = start ? '起点' : goal ? '终点' : cell === '#' ? '障碍' : '道路';
            return <button key={id} type="button" className="playground-cell" data-play-cell={id} data-kind={kind} data-state={state} data-current={current === id} tabIndex={focused === id ? 0 : -1} aria-label={'编辑 (' + x + ', ' + y + ') ' + label + (state === 'path' ? '，最终路径' : state === 'visited' ? '，已选节点' : '')} onFocus={() => setFocused(id)} onClick={() => paint(node)} onKeyDown={event => {
              const delta = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[event.key];
              if (!delta) return; event.preventDefault();
              const nx = Math.min(8, Math.max(0, x + delta[0]!)), ny = Math.min(6, Math.max(0, y + delta[1]!));
              gridRef.current?.querySelector<HTMLButtonElement>('[data-play-cell="' + nx + ',' + ny + '"]')?.focus();
            }}>{start ? 'S' : goal ? 'G' : kind === 'wall' ? '■' : state === 'path' ? '◆' : state === 'visited' ? '·' : ''}</button>;
          }))}
        </div>
      </div>
      <div className="playground-console">
        <label>先预测：谁扩展更少？<select aria-label="扩展数量预测" value={guess} disabled={!!result} onChange={event => setGuess(event.target.value as ExpansionGuess | '')}><option value="">请选择你的判断</option><option value="bfs">BFS</option><option value="astar">A*</option><option value="tie">一样多</option></select></label>
        <button type="button" className="action-primary" disabled={!guess || !!result} onClick={() => {
          const comparison = comparePlayground(map); setResult(comparison); setCursor(0); setPlaying(false);
          setNotice((guess === comparison.fewerExpanded ? '这次预测符合结果。' : '这次预测与结果不同。') + '实际扩展更少：' + names[comparison.fewerExpanded] + '。' + (comparison.bfs.status === 'unreachable' ? '终点不可达，试着打通一条路。' : '可逐步回放搜索，看看差异从哪里开始。'));
        }}>提交预测并对比</button>
        <p role="status" className="playground-notice">{notice}</p>
        {result && <div data-testid="playground-results">
          <div className="playground-metrics">{(['bfs', 'astar'] as const).map(id => <div key={id} data-testid={'playground-result-' + id}><h3>{names[id]}</h3><dl><dt>路径步数</dt><dd>{result[id].metrics.pathLength ?? '不可达'}</dd><dt>扩展节点</dt><dd>{result[id].metrics.expandedCount}</dd><dt>前沿峰值</dt><dd>{result[id].metrics.frontierPeak}</dd></dl></div>)}</div>
          <p className="playground-help">这里只比较单位代价四邻域地图的真实计数，不把扩展量当耗时，也不承诺 A* 总是更少。下方回放的是节点选择顺序，完成后才绘出最终路径。</p>
          <div className="playground-tools"><label>回放算法<select aria-label="自由地图回放算法" value={algorithm} onChange={event => { setAlgorithm(event.target.value as Algorithm); setCursor(0); setPlaying(false); }}><option value="bfs">BFS</option><option value="astar">A*</option></select></label><label>速度<select aria-label="自由地图回放速度" value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label></div>
          <p className="playground-help" data-testid="playground-step">已选择 {cursor} / {total} 个节点{cursor === total ? ' · 回放完成' : ''}</p>
          <div className="playground-controls">
            <button type="button" className="action-secondary" disabled={cursor >= total} onClick={() => setPlaying(!playing)}>{playing ? '暂停自由回放' : '播放自由回放'}</button>
            <button type="button" className="action-secondary" disabled={cursor >= total} onClick={() => { setPlaying(false); setCursor(cursor + 1); }}>自由回放单步</button>
            <button type="button" className="action-quiet" onClick={() => { setPlaying(false); setCursor(0); }}>从头回放</button>
            <button type="button" className="action-quiet" onClick={() => { clearRun(); setNotice('地图保持不变，可重新预测。'); }}>重新预测</button>
          </div>
        </div>}
      </div>
    </div>
  </section>;
}
