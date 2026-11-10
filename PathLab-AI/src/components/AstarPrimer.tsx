import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Position } from '../../contracts/types';
import { PRIMER_QUIZ, buildPrimerTrace, cellName, describeChoice, explainPrediction, manhattan, sameNode, type PrimerCell, type PrimerQuestion } from '../domain/learning/astar-primer';

const trace = buildPrimerTrace();
const { grid, start, goal } = trace.input;
const chapters = ['要解决什么', '笨办法：一圈圈试', '给格子打分', '挑选规则', '跟着 A* 走一遍', '对比与小测'] as const;
const exercise = { node: { x: 2, y: 1 }, g: 3 } as const;
const predictable = trace.steps.filter(step => step.reason !== 'only').length;

type CellState = 'open' | 'new' | 'closed' | 'current' | 'path' | 'wave' | 'focus' | 'wrong';
interface CellView { state?: CellState; main?: ReactNode; g?: number; h?: number; label?: string }

function kindOf(node: Position) {
  if (sameNode(node, start)) return 'start';
  if (sameNode(node, goal)) return 'goal';
  return grid.rows[node.y]![node.x] === '#' ? 'wall' : 'road';
}

function PrimerGrid({ view, pickable, onPick, caption }: { view: (node: Position) => CellView; pickable: (node: Position) => boolean; onPick: ((node: Position) => void) | undefined; caption: string }) {
  const rows = Array.from({ length: grid.height }, (_, y) => Array.from({ length: grid.width }, (_, x) => ({ x, y })));
  return <figure className="primer-map">
    <div className="primer-grid" style={{ ['--primer-columns' as string]: grid.width }} role="group" aria-label={caption + '。地图 ' + grid.width + ' 列 ' + grid.height + ' 行'}>
      <span className="primer-axis" aria-hidden="true">y\x</span>
      {rows[0]!.map(({ x }) => <span key={'x' + x} className="primer-axis" aria-hidden="true">{x}</span>)}
      {rows.map((row, y) => [<span key={'y' + y} className="primer-axis" aria-hidden="true">{y}</span>, ...row.map(node => {
        const kind = kindOf(node);
        const cell = view(node);
        const words = [cellName(node), kind === 'start' ? '起点 S' : kind === 'goal' ? '终点 G' : kind === 'wall' ? '墙' : '', cell.label ?? '', cell.g !== undefined ? 'g=' + cell.g + ' h=' + cell.h + ' f=' + (cell.g + cell.h!) : ''].filter(Boolean).join('，');
        const body = <>
          {kind === 'start' && <b className="primer-tag">S</b>}
          {kind === 'goal' && <b className="primer-tag">G</b>}
          {cell.g !== undefined && <><small className="primer-g">g{cell.g}</small><small className="primer-h">h{cell.h}</small></>}
          {cell.main !== undefined && <span className="primer-main">{cell.main}</span>}
        </>;
        const className = 'primer-cell primer-cell--' + kind + (cell.state ? ' is-' + cell.state : '');
        return onPick && pickable(node)
          ? <button key={node.x + ',' + node.y} type="button" className={className + ' is-pickable'} aria-label={words + '，点击选择'} data-primer-cell={node.x + ',' + node.y} onClick={() => onPick(node)}>{body}</button>
          : <span key={node.x + ',' + node.y} className={className} role="img" aria-label={words} data-primer-cell={node.x + ',' + node.y}>{body}</span>;
      })])}
    </div>
    <figcaption><span><i className="primer-swatch primer-swatch--start" />S 起点</span><span><i className="primer-swatch primer-swatch--goal" />G 终点</span><span><i className="primer-swatch primer-swatch--wall" />墙</span><span><i className="primer-swatch primer-swatch--open" />待选</span><span><i className="primer-swatch primer-swatch--new" />刚加入</span><span><i className="primer-swatch primer-swatch--closed" />已处理</span></figcaption>
  </figure>;
}

function Choice({ question, onAnswered }: { question: PrimerQuestion; onAnswered?: (correct: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  return <fieldset className="primer-question" data-testid={'primer-' + question.id}>
    <legend>{question.prompt}</legend>
    {question.options.map((option, index) => <label key={option} className={picked === null ? '' : index === question.answer ? 'is-answer' : index === picked ? 'is-wrong' : ''}>
      <input type="radio" name={question.id} disabled={picked !== null} checked={picked === index} onChange={() => { setPicked(index); onAnswered?.(index === question.answer); }} />{option}
    </label>)}
    {picked !== null && <p className="primer-explain" role="status"><strong>{picked === question.answer ? '答对了。' : '再想想：'}</strong>{question.explanation}</p>}
  </fieldset>;
}

function NumberCheck({ label, answer, clue, success, onSolved }: { label: string; answer: number; clue: string; success: string; onSolved: () => void }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<'right' | 'wrong' | null>(null);
  return <form className="primer-number" onSubmit={event => { event.preventDefault(); const ok = Number(value) === answer; setResult(ok ? 'right' : 'wrong'); if (ok) onSolved(); }}>
    <label>{label}<input inputMode="numeric" value={value} disabled={result === 'right'} onChange={event => { setValue(event.target.value.trim()); setResult(null); }} /></label>
    <button type="submit" className="action-secondary" disabled={value === '' || result === 'right'}>检查</button>
    {result && <p role="status" className={result === 'right' ? 'is-right' : 'is-wrong'}>{result === 'right' ? '正确：' + success : '还不对。提示：' + clue}</p>}
  </form>;
}

function ProblemChapter() {
  const [guess, setGuess] = useState<number | null>(null);
  return <>
    <p>你是校园配送员，要把外卖从 <b>S</b> 送到 <b>G</b>。</p>
    <ul className="primer-list">
      <li>每次只能往<b>上、下、左、右</b>走一格，每走一格算 <b>1 步</b>，不能斜走。</li>
      <li>斜纹格子是<b>墙</b>，过不去。</li>
      <li>目标：找出<b>步数最少</b>的路线。</li>
    </ul>
    <p className="primer-aside">读坐标：(x,y) 中 x 是第几列（从左往右数），y 是第几行（从上往下数），都从 0 开始。所以 S=(0,2)，G=(6,2)。</p>
    <div className="primer-question"><p className="primer-legend">先凭直觉猜：最少要走几步？</p>
      <div className="primer-chips">{[6, 8, 10].map(value => <button key={value} type="button" className="action-quiet" disabled={guess !== null} onClick={() => setGuess(value)}>{value} 步</button>)}</div>
      {guess !== null && <p className="primer-explain" role="status"><strong>{guess === trace.path.length - 1 ? '对！' : '答案是 ' + (trace.path.length - 1) + ' 步。'}</strong>直线只要 6 步，但中间有墙：从上面绕过去要 8 步（多走 2 步），从下面绕要 10 步。人一眼能看出来；电脑虽然知道 G 在哪，却不知道墙怎么绕最近，只能一格一格地试。下一章看看它怎么试。</p>}
    </div>
  </>;
}

function WaveChapter({ shown, playing, onPlay }: { shown: number; playing: boolean; onPlay: () => void }) {
  const done = shown >= trace.bfsLayers.length;
  return <>
    <p>最朴素的办法叫 <b>BFS（广度优先搜索）</b>：先把离起点 1 步的格子全试一遍，再试 2 步的，再试 3 步的……像石子落进水里，一圈一圈往外扩。格子里的数字就是“离起点几步”。</p>
    <button type="button" className="action-primary" onClick={onPlay} disabled={playing}>{done ? '重新播放水波' : playing ? '正在扩散…' : '播放水波'}</button>
    <p className="primer-aside" role="status">{done ? '水波碰到终点了：地图上 ' + trace.bfs.selectionCount + ' 个数字格都被试过，其中 ' + trace.bfs.expandedCount + ' 个被“处理”（往外扩了一圈），终点 G 一碰到就停；BFS 一共处理了 ' + trace.bfs.expandedCount + ' 个格子，路线 ' + trace.bfs.pathLength + ' 步。' : shown > 0 ? '已扩散到离起点 ' + (shown - 1) + ' 步。' : '点按钮开始。'}</p>
    {done && <p>BFS 一定能找到最短路线，但它<b>不知道终点在哪边</b>：往左下角、左上角这些明显背离终点的格子，它也老老实实试了一遍。<br />能不能让搜索<b>朝着终点</b>去？这就是 A* 的想法——给每个格子打个分。</p>}
  </>;
}

function ScoreChapter({ solved, onSolve }: { solved: number; onSolve: (count: number) => void }) {
  const h = manhattan(exercise.node, goal);
  return <>
    <p>A* 给每个格子算三个数：</p>
    <dl className="primer-terms">
      <div><dt>g</dt><dd><b>已经走了几步</b>：从 S 走到这个格子花的步数。这是确定的，像打车时表上已经跳的里程。</dd></div>
      <div><dt>h</dt><dd><b>估计还要几步</b>：从这个格子到 G，横着差几格 + 竖着差几格。<b>假装没有墙</b>，像导航给的“预计剩余”。</dd></div>
      <div><dt>f</dt><dd><b>f = g + h</b>：如果路线经过这个格子，整趟大约要走几步。f 越小，越像最短路线上的格子。</dd></div>
    </dl>
    <p>动手算一次：地图上发光的格子是 <b>{cellName(exercise.node)}</b>。</p>
    <NumberCheck label={'① g：从 S 走到 ' + cellName(exercise.node) + ' 最少几步？'} answer={exercise.g} clue="在地图上用手指从 S 往右走，碰到墙前再往上，数一数走了几格。" success="g = 3（S→(1,2)→(2,2)→(2,1)）。" onSolved={() => onSolve(Math.max(solved, 1))} />
    {solved >= 1 && <NumberCheck label={'② h：G 在第 6 列第 2 行。横向差 |6−2| 加纵向差 |2−1|，等于几？'} answer={h} clue="横向差 = 6−2 = 4，纵向差 = 2−1 = 1，再相加。不用管墙。" success={'h = 4 + 1 = ' + h + '。'} onSolved={() => onSolve(Math.max(solved, 2))} />}
    {solved >= 2 && <NumberCheck label="③ f = g + h = ?" answer={exercise.g + h} clue={'把上面两个数相加：3 + ' + h + '。'} success={'f = 3 + ' + h + ' = ' + (exercise.g + h) + '。经过 (2,1) 的路线，整趟大约 ' + (exercise.g + h) + ' 步。'} onSolved={() => onSolve(3)} />}
    {solved >= 3 && <p className="primer-explain"><strong>为什么 h 只是“估计”？</strong>看 (2,2)：它的 h=4，可墙挡着，真实还要走 6 步。h 只会少估、不会多估，所以真正最短的路线不会因为“看起来远”而被排到后面，A* 仍能找到最短路线。现在记住这个结论就行。</p>}
  </>;
}

function RulesChapter() {
  return <>
    <p>A* 手里有一张<b>待选清单</b>，一开始只有起点 S。然后不停重复：</p>
    <ol className="primer-steps">
      <li><b>挑</b>：从清单里挑 <b>f 最小</b>的格子。<br /><small>f 一样？挑 h 小的（离终点近）。还一样？挑先进清单的。</small></li>
      <li><b>到了吗</b>：挑中的是 G 就结束，顺着“每个格子记下的上一格”倒着走回 S，就是路线。</li>
      <li><b>展开</b>：否则，把它上下左右<b>能走、没处理过、也不在清单里</b>的邻居放进清单，算好 g/h/f，并记下“我是从它这儿来的”。它自己标为“已处理”，不再回头。<br /><small>邻居按“上、右、下、左”的顺序放进清单。已经在清单里的邻居不重复放；只有这次走过去步数更少时，才把它的 g 改小、重算 f，并把它的“上一格”改成当前格子（这张小地图里没出现这种情况）。</small></li>
    </ol>
    <p className="primer-aside">整个 A* 就这三句话。下面两道小题，练一下“挑”这一步。</p>
    {PRIMER_QUIZ.filter(item => item.stage === 'rules').map(item => <Choice key={item.id} question={item} />)}
  </>;
}

function WalkChapter({ index, revealed, guess, onGuess, onReveal, onNext, onRestart, score }: { index: number; revealed: boolean; guess: Position | null; onGuess: (node: Position | null) => void; onReveal: () => void; onNext: () => void; onRestart: () => void; score: number }) {
  const step = trace.steps[index]!;
  const previous = trace.steps[index - 1];
  const show = revealed || step.reason === 'only';
  const ordered = show ? [...step.open].sort((a, b) => a.f - b.f || a.h - b.h || a.entrySequence - b.entrySequence) : step.open;
  return <>
    <p className="primer-progress"><b>第 {index + 1} / {trace.steps.length} 轮</b>　预测对 {score} / {predictable}</p>
    {!show && <p>清单里有 {step.open.length} 个待选格子（地图上带数字的格子：大数字是 f，角上是 g 和 h）。<b>你觉得 A* 这一轮会挑哪个？</b>点地图上的格子，或点下表的一行。</p>}
    <table className="primer-table"><caption>待选清单（{show ? '已按挑选规则排好' : '按加入先后'}）</caption>
      <thead><tr><th scope="col">格子</th><th scope="col">g 已走</th><th scope="col">h 估计剩</th><th scope="col">f 合计</th></tr></thead>
      <tbody>{ordered.map(cell => {
        const chosen = show && sameNode(cell.node, step.selected.node);
        const mine = guess && sameNode(cell.node, guess);
        return <tr key={cellName(cell.node)} className={(chosen ? 'is-chosen' : '') + (mine ? ' is-mine' : '')}>
          <th scope="row">{show ? cellName(cell.node) : <button type="button" className="primer-row-pick" onClick={() => onGuess(cell.node)}>{cellName(cell.node)}</button>}</th>
          <td>{cell.g}</td><td>{cell.h}</td><td><b>{cell.f}</b></td>
        </tr>;
      })}</tbody>
    </table>
    {!show && <div className="primer-actions">
      <button type="button" className="action-primary" disabled={!guess} onClick={onReveal} data-testid="primer-reveal">{guess ? '我选 ' + cellName(guess) + '，揭晓' : '先选一个格子'}</button>
      <button type="button" className="action-quiet" onClick={() => { onGuess(null); onReveal(); }}>不确定，直接看答案</button>
    </div>}
    {show && <div className="primer-reveal" role="status" data-testid="primer-step-explanation">
      {guess && step.reason !== 'only' && <p className={sameNode(guess, step.selected.node) ? 'is-right' : 'is-wrong'}>{sameNode(guess, step.selected.node) ? '' : '没猜中，你选的是 ' + cellName(guess) + '。'}{explainPrediction('astar', step.open, guess, step.selected.node)}</p>}
      <p><b>A* 挑中 {cellName(step.selected.node)}。</b>{describeChoice(step)}</p>
      {previous && step.selected.f > previous.selected.f && <p className="primer-explain"><strong>注意 f 变大了：</strong>从 {previous.selected.f} 涨到 {step.selected.f}。之前的 h 假装没有墙；现在被墙挡住，必须绕路，整趟估计就多了 {step.selected.f - previous.selected.f} 步。</p>}
      {step.isGoal
        ? <p className="primer-explain"><strong>挑中的就是终点 G，搜索结束！</strong>顺着每个格子记下的“上一格”倒着走：{[...trace.path].reverse().map(cellName).join(' ← ')}，一共 {trace.path.length - 1} 步。</p>
        : <p>展开它：{step.added.length > 0 ? '新放进清单 ' + step.added.map(cell => cellName(cell.node) + '（f=' + cell.f + '）').join('、') : '没有新的邻居可放'}{step.blocked.length > 0 ? '；' + step.blocked.map(cellName).join('、') + ' 是墙，跳过' : ''}{step.known.length > 0 ? '；' + step.known.map(node => cellName(node) + (step.closedBefore.some(item => sameNode(item, node)) ? ' 已处理过' : ' 已在清单里')).join('、') + '，不重复放' : ''}。{cellName(step.selected.node)} 标为已处理。</p>}
      {step.isGoal
        ? <button type="button" className="action-quiet" onClick={onRestart}>从头再走一遍</button>
        : <button type="button" className="action-primary" onClick={onNext} data-testid="primer-next-step">下一轮 →</button>}
    </div>}
  </>;
}

function FinalChapter({ onTryMission }: { onTryMission: (id: 'L02' | 'L03') => void }) {
  const finals = PRIMER_QUIZ.filter(item => item.stage === 'final');
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const done = Object.keys(answers).length;
  const correct = Object.values(answers).filter(Boolean).length;
  return <>
    <div className="primer-compare">
      <div><span>BFS 处理的格子</span><strong>{trace.bfs.expandedCount}</strong></div>
      <div><span>A* 处理的格子</span><strong>{trace.astar.expandedCount}</strong></div>
      <div><span>两者路线步数</span><strong>{trace.astar.pathLength}</strong></div>
    </div>
    <p className="primer-aside">“处理”指被挑中并展开邻居的格子；挑中终点那一轮直接结束、不再展开，所以 A* 走了 {trace.steps.length} 轮，处理了 {trace.astar.expandedCount} 个格子。</p>
    <p>看左边地图：A* 处理过的 {trace.astar.expandedCount} 个格子全部在最短路线上，一步弯路都没走；BFS 却把整张图几乎都试了一遍。</p>
    <p>路线一样短，A* 却少处理了 {trace.bfs.expandedCount - trace.astar.expandedCount} 个格子：h 把搜索“拉”向终点。背离终点的格子要么 f 更大，要么 f 打平但 h 更大，在清单里一直排在后面，根本轮不到。</p>
    <p className="primer-summary"><b>一句话记住 A*：</b>每次从待选清单里挑 <b>f = g（已走）+ h（估计还剩）</b>最小的格子展开，直到挑中终点。</p>
    <h4>出关小测（{finals.length} 题）</h4>
    {finals.map(item => <Choice key={item.id} question={item} onAnswered={ok => setAnswers(current => ({ ...current, [item.id]: ok }))} />)}
    {done === finals.length && <div className="primer-result" role="status" data-testid="primer-result">
      <p><b>小测得分 {correct} / {finals.length}。</b>{correct === finals.length ? '你已经能说清 A* 怎么挑格子了。' : '答错的题看一下解析，再回到第 4、5 章走一遍。'}</p>
      <p>下一步：到真实关卡里自己预测，系统不会提前告诉你答案。</p>
      <div className="primer-actions"><button type="button" className="action-primary" onClick={() => onTryMission('L03')}>去 L03 用 A* 自己预测 →</button><button type="button" className="action-quiet" onClick={() => onTryMission('L02')}>去 L02 对比 BFS 与 A*</button></div>
    </div>}
  </>;
}

export function AstarPrimer({ onTryMission }: { onTryMission: (id: 'L02' | 'L03') => void }) {
  const [chapter, setChapter] = useState(0);
  const [wave, setWave] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [solved, setSolved] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [guess, setGuess] = useState<Position | null>(null);
  const [hits, setHits] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!playing) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => {
      const next = reduce ? trace.bfsLayers.length : wave + 1;
      setWave(next);
      if (next >= trace.bfsLayers.length) setPlaying(false);
    }, reduce ? 0 : 520);
    return () => window.clearTimeout(timer);
  }, [playing, wave]);

  const step = trace.steps[stepIndex]!;
  const showStep = revealed || step.reason === 'only';
  const waveDistance = useMemo(() => {
    const map = new Map<string, number>();
    trace.bfsLayers.slice(0, wave).forEach((layer, distance) => layer.forEach(node => map.set(cellName(node), distance)));
    return map;
  }, [wave]);

  const view = (node: Position): CellView => {
    if (kindOf(node) === 'wall') return {};
    if (chapter === 1) {
      const distance = waveDistance.get(cellName(node));
      return distance === undefined ? {} : { state: 'wave', main: distance, label: '离起点 ' + distance + ' 步' };
    }
    if (chapter === 2) {
      if (sameNode(node, exercise.node)) return { state: 'focus', label: '练习格', ...(solved >= 3 ? { g: exercise.g, h: manhattan(node, goal), main: exercise.g + manhattan(node, goal) } : { main: '?' }) };
      if (solved >= 3 && sameNode(node, { x: 2, y: 2 })) return { g: 2, h: 4, main: 6 };
      return {};
    }
    if (chapter === 4) {
      const final = step.isGoal && showStep;
      if (final && trace.path.some(item => sameNode(item, node))) return { state: 'path', label: '最短路线' };
      if (showStep && sameNode(node, step.selected.node)) return cellView(step.selected, 'current', '本轮挑中');
      if (step.closedBefore.some(item => sameNode(item, node))) return { state: 'closed', label: '已处理' };
      const fresh = showStep && !step.isGoal ? [...step.updated, ...step.added].find(cell => sameNode(cell.node, node)) : undefined;
      if (fresh) return cellView(fresh, 'new', '刚加入清单');
      const open = step.open.find(cell => sameNode(cell.node, node));
      if (open) return cellView(open, guess && sameNode(guess, node) ? (showStep && !sameNode(guess, step.selected.node) ? 'wrong' : 'focus') : 'open', '待选');
    }
    if (chapter === 5) {
      if (trace.path.some(item => sameNode(item, node))) return { state: 'path', label: 'A* 最短路线' };
      if (trace.steps.at(-1)!.closedBefore.some(item => sameNode(item, node))) return { state: 'closed', label: 'A* 处理过' };
    }
    return {};
  };
  const picking = chapter === 4 && !showStep;

  const reveal = () => {
    setRevealed(true);
    if (guess && step.reason !== 'only') setHits(current => (stepIndex in current ? current : { ...current, [stepIndex]: sameNode(guess, step.selected.node) }));
  };
  const goStep = (index: number) => { setStepIndex(index); setRevealed(false); setGuess(null); };
  const caption = ['配送地图', 'BFS 水波：数字是离起点几步', '打分练习', '配送地图', 'A* 逐轮演示：大数字 f，角标 g 与 h', 'A* 的最终结果：亮色为最短路线；这张图里 A* 处理过的 ' + trace.astar.expandedCount + ' 个格子全在路线上'][chapter]!;

  return <section id="astar-primer" className="primer" aria-labelledby="primer-title" data-testid="astar-primer" tabIndex={-1}>
    <div className="primer-head">
      <p className="eyebrow">ZERO TO A* · 约 6 分钟 · 不需要任何算法基础</p>
      <h2 id="primer-title">零基础 A* 入门：一张小地图，看懂它每一步怎么想</h2>
      <p>先自己猜，再看答案。所有数字都由站内真实的 A* / BFS 程序算出，不是手写的演示。</p>
    </div>
    <ol className="primer-chapters" aria-label="入门章节">
      {chapters.map((name, index) => <li key={name}><button type="button" aria-current={chapter === index ? 'step' : undefined} onClick={() => setChapter(index)}><span>{index + 1}</span>{name}</button></li>)}
    </ol>
    <div className="primer-body">
      <PrimerGrid view={view} caption={caption} pickable={node => step.open.some(cell => sameNode(cell.node, node))} onPick={picking ? setGuess : undefined} />
      <div className="primer-text">
        <h3>{chapter + 1}. {chapters[chapter]}</h3>
        {chapter === 0 && <ProblemChapter />}
        {chapter === 1 && <WaveChapter shown={wave} playing={playing} onPlay={() => { setWave(0); setPlaying(true); }} />}
        {chapter === 2 && <ScoreChapter solved={solved} onSolve={setSolved} />}
        {chapter === 3 && <RulesChapter />}
        {chapter === 4 && <WalkChapter index={stepIndex} revealed={revealed} guess={guess} onGuess={setGuess} onReveal={reveal} onNext={() => goStep(stepIndex + 1)} onRestart={() => { goStep(0); setHits({}); }} score={Object.values(hits).filter(Boolean).length} />}
        {chapter === 5 && <FinalChapter onTryMission={onTryMission} />}
      </div>
    </div>
    <div className="primer-nav">
      <button type="button" className="action-quiet" disabled={chapter === 0} onClick={() => setChapter(chapter - 1)}>← 上一章</button>
      <span>{chapter + 1} / {chapters.length}</span>
      <button type="button" className="action-primary" disabled={chapter === chapters.length - 1} onClick={() => setChapter(chapter + 1)} data-testid="primer-next-chapter">下一章 →</button>
    </div>
  </section>;
}

function cellView(cell: PrimerCell, state: CellState, label: string): CellView {
  return { state, g: cell.g, h: cell.h, main: cell.f, label };
}
