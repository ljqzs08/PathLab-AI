import { useEffect, useRef, useState } from 'react';
import { VIDEO_GRAPH, runGraphAstar, type GraphEntry } from '../../domain/learning/weighted-graph';
import { playableUrl } from '../../media';
import { Naiwa } from '../Naiwa';

const CHAPTERS = [
  [0, '开场：f = g + h'],
  [30, '对比 Dijkstra、贪心与 A*'],
  [54, '例题：带数字的路线图'],
  [66, 'S 进入清单，f = 0 + 6'],
  [78, '展开 S：A(11)、B(6)'],
  [96, '挑 B，展开 C、D'],
  [114, '挑 D(7)，加入 T(9)'],
  [132, '为什么 T 要等被挑出来才算完'],
  [144, '最终路径 S→B→D→T'],
  [156, 'C++ 代码实现（选看）'],
] as const;

const WORDS = [
  ['Open List / 优先队列', '待选清单：自动把 f 最小的排在最前'],
  ['启发式估值 h(n)', '估计还剩多远，节点右上角的小数字'],
  ['父节点', '“我是从哪个点来的”，最后靠它倒推路线'],
  ['弹出（pop）', '从清单里取出 f 最小的点，开始处理它'],
] as const;

const INTRO = [
  <>这段 3 分钟的小视频，把 A* 在一张“路线图”上从头到尾算了一遍。</>,
  <>视频里每条线上的数字是这段路的长度，圆圈右上角的小数字是 h（估计还剩多远）。</>,
  <>看完别急着走——下面我们<b>亲手把视频里的表格算一遍</b>，算对了才算真懂。</>,
];

function format(seconds: number) {
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}

function VideoPlayer() {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const media = playableUrl('astar-video.mp4');
    element.src = media.url;
    return () => { element.removeAttribute('src'); element.load(); media.release(); };
  }, []);
  const jump = (seconds: number) => {
    const element = video.current;
    if (!element) return;
    element.currentTime = seconds;
    void element.play().catch(() => {});
  };
  return <div className="video-layout">
    <div className="video-frame">
      <video ref={video} controls preload="metadata" playsInline data-testid="lesson-video" aria-label="A* 搜索算法讲解视频，约 3 分 16 秒">
        <track kind="captions" />
      </video>
      <p className="video-credit">视频来源：抖音「皮蛋编程」（抖音号 338699570），本站仅作学习引用，著作权归原作者。画面已自带中文字幕。</p>
    </div>
    <div className="video-side">
      <h3>按章节跳着看</h3>
      <ol className="video-chapters">{CHAPTERS.map(([seconds, title]) => <li key={seconds}><button type="button" onClick={() => jump(seconds)}><time>{format(seconds)}</time>{title}</button></li>)}</ol>
      <h3>视频里的词，翻译成大白话</h3>
      <dl className="glossary">{WORDS.map(([word, meaning]) => <div key={word}><dt>{word}</dt><dd>{meaning}</dd></div>)}</dl>
    </div>
  </div>;
}

const run = runGraphAstar(VIDEO_GRAPH);
const position = new Map(VIDEO_GRAPH.nodes.map(node => [node.id, node]));

function GraphPicture({ table, current, closed, path }: { table: Map<string, GraphEntry>; current: string | null; closed: Set<string>; path: readonly string[] }) {
  const onPath = (from: string, to: string) => path.some((id, index) => id === from && path[index + 1] === to);
  return <svg className="graph-svg" viewBox="0 0 520 300" role="img" aria-label="视频例题的路线图：S 到 A 长 1，S 到 B 长 4，A 到 T 长 12，B 到 D 长 2，B 到 C 长 1，D 到 T 长 3，C 到 T 长 5；h 值 S6、A10、B2、C5、D1、T0">
    <defs><marker id="graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#6e8aa0" /></marker></defs>
    {VIDEO_GRAPH.edges.map(edge => {
      const a = position.get(edge.from)!, b = position.get(edge.to)!;
      const length = Math.hypot(b.x - a.x, b.y - a.y), ux = (b.x - a.x) / length, uy = (b.y - a.y) / length;
      const lit = onPath(edge.from, edge.to);
      return <g key={edge.from + edge.to} className={lit ? 'graph-edge is-path' : 'graph-edge'}>
        <line x1={a.x + ux * 24} y1={a.y + uy * 24} x2={b.x - ux * 26} y2={b.y - uy * 26} markerEnd="url(#graph-arrow)" />
        <text x={(a.x + b.x) / 2 + uy * 14} y={(a.y + b.y) / 2 - ux * 14 + 5}>{edge.cost}</text>
      </g>;
    })}
    {VIDEO_GRAPH.nodes.map(node => {
      const entry = table.get(node.id);
      const state = node.id === current ? 'is-current' : path.includes(node.id) ? 'is-path' : closed.has(node.id) ? 'is-closed' : entry ? 'is-open' : '';
      return <g key={node.id} className={'graph-node ' + state}>
        <circle cx={node.x} cy={node.y} r="22" />
        <text x={node.x} y={node.y + 7} className="graph-id">{node.id}</text>
        <circle cx={node.x + 18} cy={node.y - 18} r="11" className="graph-h" />
        <text x={node.x + 18} y={node.y - 14} className="graph-h-text">{node.h}</text>
      </g>;
    })}
  </svg>;
}

type Phase = { kind: 'pick'; step: number } | { kind: 'fill'; step: number; update: number } | { kind: 'done' };

function GraphLab() {
  const [phase, setPhase] = useState<Phase>({ kind: 'pick', step: 0 });
  const [guess, setGuess] = useState<string | null>(null);
  const [g, setG] = useState('');
  const [f, setF] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });

  const stepIndex = phase.kind === 'done' ? run.steps.length - 1 : phase.step;
  const step = run.steps[stepIndex]!;
  const first = run.steps[0]!.open[0]!;
  const table = new Map<string, GraphEntry>([[first.id, first]]);
  const closed = new Set<string>();
  run.steps.slice(0, stepIndex + 1).forEach((item, index) => {
    const current = index === stepIndex;
    if (!current || phase.kind !== 'pick') closed.add(item.picked.id);
    const count = !current ? item.updates.length : phase.kind === 'fill' ? phase.update : 0;
    item.updates.slice(0, count).forEach(update => table.set(update.entry.id, update.entry));
  });

  const open = phase.kind === 'pick' ? step.open : [];
  const pickNode = (id: string) => {
    if (phase.kind !== 'pick') return;
    setGuess(id);
    const ok = id === step.picked.id;
    setScore(current => ({ right: current.right + (ok ? 1 : 0), total: current.total + 1 }));
    const sorted = [...step.open].map(entry => entry.id + '(f=' + entry.f + ')').join('、');
    setFeedback({ ok, text: (ok ? '对！' : '这轮 A* 挑的是 ' + step.picked.id + '。') + '清单里有 ' + sorted + '，f 最小的是 ' + step.picked.id + '。' + (step.isGoal ? '挑出来的正好是终点 T，结束！' : '') });
    if (step.isGoal) setPhase({ kind: 'done' });
    else setPhase({ kind: 'fill', step: phase.step, update: 0 });
  };

  const check = () => {
    if (phase.kind !== 'fill') return;
    const update = step.updates[phase.update]!;
    const edge = VIDEO_GRAPH.edges.find(item => item.from === step.picked.id && item.to === update.entry.id)!;
    const ok = Number(g) === update.entry.g && Number(f) === update.entry.f;
    setScore(current => ({ right: current.right + (ok ? 1 : 0), total: current.total + 1 }));
    setFeedback({ ok, text: (ok ? '算对了！' : '正确答案：') + update.entry.id + ' 的 g = ' + step.picked.g + '（' + step.picked.id + ' 的 g）+ ' + edge.cost + '（这条边）= ' + update.entry.g + '，f = g + h = ' + update.entry.g + ' + ' + update.entry.h + ' = ' + update.entry.f + '。' });
    setG(''); setF(''); setGuess(null);
    setPhase(phase.update + 1 < step.updates.length ? { ...phase, update: phase.update + 1 } : { kind: 'pick', step: phase.step + 1 });
  };

  const restart = () => { setPhase({ kind: 'pick', step: 0 }); setGuess(null); setFeedback(null); setScore({ right: 0, total: 0 }); setG(''); setF(''); };
  const update = phase.kind === 'fill' ? step.updates[phase.update]! : null;
  const edge = update ? VIDEO_GRAPH.edges.find(item => item.from === step.picked.id && item.to === update.entry.id)! : null;
  const rows = [...table.values()].sort((a, b) => a.order - b.order);

  return <div className="journey-card" data-testid="graph-lab">
    <h3>跟着视频算一遍：把那张表亲手填出来</h3>
    <p>规则和视频一样：每轮从待选清单里挑 <b>f 最小</b>的点；新发现的点 g = 上一个点的 g + 这条边的长度，f = g + h。答对答错都会告诉你为什么。</p>
    <div className="graph-layout">
      <GraphPicture table={table} current={phase.kind === 'fill' ? step.picked.id : null} closed={closed} path={phase.kind === 'done' ? run.path : []} />
      <div className="graph-panel">
        <table className="primer-table"><caption>和视频同款的表（灰色＝已处理）</caption>
          <thead><tr><th scope="col">点</th><th scope="col">g</th><th scope="col">h</th><th scope="col">f</th><th scope="col">父节点</th></tr></thead>
          <tbody>{rows.map(entry => <tr key={entry.id} className={closed.has(entry.id) ? 'is-closed-row' : ''}><th scope="row">{entry.id}</th><td>{entry.g}</td><td>{entry.h}</td><td><b>{entry.f}</b></td><td>{entry.parent ?? '无'}</td></tr>)}</tbody>
        </table>
        {phase.kind === 'pick' && <div className="graph-task" data-testid="graph-pick">
          <p><b>第 {phase.step + 1} 轮：</b>待选清单里有 {open.map(entry => entry.id).join('、')}。A* 这轮挑谁？</p>
          <div className="chip-row">{open.map(entry => <button key={entry.id} type="button" className="chip chip--wide" onClick={() => pickNode(entry.id)}>{entry.id}（f={entry.f}）</button>)}</div>
        </div>}
        {update && edge && <form className="graph-task" data-testid="graph-fill" onSubmit={event => { event.preventDefault(); check(); }}>
          <p><b>展开 {step.picked.id}：</b>发现了 {update.entry.id}（{step.picked.id}→{update.entry.id} 这条边长 {edge.cost}，{update.entry.id} 的 h = {update.entry.h}）。</p>
          <div className="graph-inputs">
            <label>{update.entry.id} 的 g =<input inputMode="numeric" value={g} onChange={event => setG(event.target.value.trim())} /></label>
            <label>{update.entry.id} 的 f =<input inputMode="numeric" value={f} onChange={event => setF(event.target.value.trim())} /></label>
            <button type="submit" className="action-primary" disabled={g === '' || f === ''}>检查</button>
          </div>
        </form>}
        {feedback && <p role="status" className={feedback.ok ? 'is-right' : 'is-wrong'} data-testid="graph-feedback">{guess && !feedback.ok ? '你选了 ' + guess + '。' : ''}{feedback.text}</p>}
        {phase.kind === 'done' && <div className="journey-tip" role="status" data-testid="graph-done">
          <p><b>搜索结束！</b>顺着父节点倒推：T ← D ← B ← S，路线 <b>{run.path.join(' → ')}</b>，总长度 {run.cost}。你一共答对 {score.right} / {score.total} 处。</p>
          <p>发现了吗？S→A 只要 1，看着很近，但 A 的 h=10 说明“离终点还远”，f=11 一直排在后面，A* 根本没去展开它——这就是 h 的作用。</p>
          <button type="button" className="action-quiet" onClick={restart}>再算一遍</button>
        </div>}
      </div>
    </div>
    <p className="journey-aside">视频用“路线图”（点 + 带长度的线），本站其它页面用“格子地图”。其实格子地图就是“每条线长度都等于 1 的路线图”，A* 的做法完全一样。</p>
  </div>;
}

export function VideoView() {
  return <>
    <Naiwa lines={INTRO} />
    <div className="journey-card"><VideoPlayer /></div>
    <GraphLab />
  </>;
}
