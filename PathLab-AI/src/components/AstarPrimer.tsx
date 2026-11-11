import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Position } from '../../contracts/types';
import { PRIMER_QUIZ, buildPrimerTrace, cellName, describeChoice, explainPrediction, manhattan, sameNode, type PrimerCell, type PrimerQuestion } from '../domain/learning/astar-primer';
import { MISCONCEPTIONS, POST_TEST, PRE_TEST, answerIndex, buildReport, classifyMistake, decisionStages, explainItem, gradeItem, optionLabels, reportText, type DecisionStage, type ItemResult, type MasteryReport, type Misconception, type TestItem } from '../domain/learning/mastery';

const trace = buildPrimerTrace();
const { grid, start, goal } = trace.input;
const chapters = ['学前测', '要解决什么', '笨办法：一圈圈试', '给格子打分', '挑选规则', '跟着 A* 走一遍', '对比 · 学后测 · 掌握度'] as const;
const exercise = { node: { x: 2, y: 1 }, g: 3 } as const;
const predictable = trace.steps.filter(step => step.reason !== 'only').length;

type CellState = 'open' | 'new' | 'closed' | 'current' | 'path' | 'wave' | 'focus' | 'wrong' | 'dropped';
interface CellView { state?: CellState; main?: ReactNode; g?: number; h?: number; label?: string }

function kindOf(node: Position) {
  if (sameNode(node, start)) return 'start';
  if (sameNode(node, goal)) return 'goal';
  return grid.rows[node.y]![node.x] === '#' ? 'wall' : 'road';
}

/** True when the visitor asked the system to reduce motion; streaming then resolves immediately. */
function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
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

/** One graded test form. The pre-test withholds feedback so it measures the starting point. */
function MasteryTest({ id, items, feedback, title, intro, onDone }: { id: string; items: readonly TestItem[]; feedback: boolean; title: string; intro: ReactNode; onDone: (results: ItemResult[]) => void }) {
  const [picks, setPicks] = useState<Record<string, number>>({});
  const done = items.every(item => item.id in picks);
  const results = done ? items.map(item => gradeItem(item, picks[item.id]!)) : [];
  const correct = results.filter(item => item.correct).length;
  return <div className="primer-test" data-testid={'primer-test-' + id}>
    {intro}
    {items.map((item, index) => {
      const picked = picks[item.id];
      const answer = answerIndex(item);
      return <fieldset key={item.id} className="primer-question" data-testid={'primer-item-' + item.id}>
        <legend>{index + 1}. {item.prompt}</legend>
        {optionLabels(item).map((option, option_index) => <label key={option} className={picked === undefined || !feedback ? (picked === option_index ? 'is-picked' : '') : option_index === answer ? 'is-answer' : option_index === picked ? 'is-wrong' : ''}>
          <input type="radio" name={id + '-' + item.id} disabled={picked !== undefined && feedback} checked={picked === option_index} onChange={() => setPicks(current => (item.id in current && feedback ? current : { ...current, [item.id]: option_index }))} />{option}
        </label>)}
        {feedback && picked !== undefined && <p className="primer-explain" role="status"><strong>{picked === answer ? '答对了。' : '答错了：'}</strong>{explainItem(item)}</p>}
      </fieldset>;
    })}
    {done
      ? <div className="primer-actions"><button type="button" className="action-primary" onClick={() => onDone(results)} data-testid={'primer-finish-' + id}>{feedback ? '生成我的掌握度报告 →' : '交卷（' + title + '）'}</button>{feedback && <span className="primer-aside">本页得分 {correct} / {items.length}</span>}</div>
      : <p className="primer-aside" role="status">还剩 {items.length - Object.keys(picks).length} 题未作答。{feedback ? '' : '不会就先猜一个，前测只用来和学完后的结果对比，不计分、不展示答案。'}</p>}
  </div>;
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

function stageSentence(stage: DecisionStage<PrimerCell>) {
  const value = (cell: PrimerCell) => stage.rule === 'f' ? 'f=' + cell.f : stage.rule === 'h' ? 'h=' + cell.h : '#' + cell.entrySequence;
  const best = stage.rule === 'sequence' ? '最早加入的是 #' + stage.best : '最小的 ' + stage.rule + ' 是 ' + stage.best;
  const out = stage.out.length === 0 ? '' : '；淘汰 ' + stage.out.length + ' 个：' + stage.out.slice(0, 3).map(cell => cellName(cell.node) + ' ' + value(cell)).join('、') + (stage.out.length > 3 ? ' 等' : '');
  return best + '，留下 ' + stage.keep.map(cell => cellName(cell.node)).join('、') + out + '。';
}

const ruleTitles: Record<string, string> = { only: '清单里只剩一个格子', f: '第 1 关：比 f（已走 + 估计剩）', h: '第 2 关：f 打平，比 h（离终点远近）', sequence: '第 3 关：f、h 都打平，比加入清单的先后' };

/**
 * Streams A*'s own decision, one elimination round at a time, so the reasoning is visible as it happens.
 * `shown` is driven by a timer in the parent; reduced-motion visitors get all rounds at once.
 */
function ThinkingStream({ open, shown }: { open: readonly PrimerCell[]; shown: number }) {
  const stages = decisionStages(open);
  const live = Math.min(shown, stages.length);
  return <ol className="primer-stream" data-testid="primer-thinking" aria-live="polite">
    {stages.slice(0, live).map((stage, index) => <li key={stage.rule} className="primer-stream-row">
      <span className="primer-stream-step">{index + 1}</span>
      <div>
        <strong>{ruleTitles[stage.rule]}</strong>
        {stage.rule === 'only'
          ? <p>直接选 {cellName(stage.keep[0]!.node)}。</p>
          : <p>{stageSentence(stage)}</p>}
      </div>
    </li>)}
    {live < stages.length && <li className="primer-stream-row is-thinking" aria-hidden="true"><span className="primer-stream-step">…</span><div><p>正在比较…</p></div></li>}
  </ol>;
}

function WalkChapter({ index, revealed, guess, onGuess, onReveal, onNext, onRestart, score, mistakes, stream }: {
  index: number; revealed: boolean; guess: Position | null; onGuess: (node: Position | null) => void; onReveal: () => void;
  onNext: () => void; onRestart: () => void; score: number; mistakes: (Misconception | null)[]; stream: number;
}) {
  const step = trace.steps[index]!;
  const previous = trace.steps[index - 1];
  const show = revealed || step.reason === 'only';
  const ordered = show ? [...step.open].sort((a, b) => a.f - b.f || a.h - b.h || a.entrySequence - b.entrySequence) : step.open;
  const wrong = guess && show && !sameNode(guess, step.selected.node) ? classifyMistake(step.open, step.open.find(cell => sameNode(cell.node, guess))!) : null;
  const thinking = show && stream < decisionStages(step.open).length;
  return <>
    <p className="primer-progress"><b>第 {index + 1} / {trace.steps.length} 轮</b>　预测对 {score} / {predictable}{mistakes.filter(Boolean).length > 0 ? '　已记录 ' + mistakes.filter(Boolean).length + ' 次误区' : ''}</p>
    {!show && <p>清单里有 {step.open.length} 个待选格子（地图上带数字的格子：大数字是 f，角上是 g 和 h）。<b>你觉得 A* 这一轮会挑哪个？</b>点地图上的格子，或点下表的一行。</p>}
    <table className="primer-table"><caption>待选清单（{show ? '已按挑选规则排好' : '按加入先后'}）</caption>
      <thead><tr><th scope="col">格子</th><th scope="col">g 已走</th><th scope="col">h 估计剩</th><th scope="col">f 合计</th><th scope="col">加入 #</th></tr></thead>
      <tbody>{ordered.map(cell => {
        const chosen = show && sameNode(cell.node, step.selected.node);
        const mine = guess && sameNode(cell.node, guess);
        return <tr key={cellName(cell.node)} className={(chosen ? 'is-chosen' : '') + (mine ? ' is-mine' : '')}>
          <th scope="row">{show ? cellName(cell.node) : <button type="button" className="primer-row-pick" onClick={() => onGuess(cell.node)}>{cellName(cell.node)}</button>}</th>
          <td>{cell.g}</td><td>{cell.h}</td><td><b>{cell.f}</b></td><td>{cell.entrySequence}</td>
        </tr>;
      })}</tbody>
    </table>
    {!show && <div className="primer-actions">
      <button type="button" className="action-primary" disabled={!guess} onClick={onReveal} data-testid="primer-reveal">{guess ? '我选 ' + cellName(guess) + '，看 A* 怎么想' : '先选一个格子'}</button>
      <button type="button" className="action-quiet" onClick={() => { onGuess(null); onReveal(); }}>不确定，直接看答案</button>
    </div>}
    {show && <div className="primer-reveal" role="status" data-testid="primer-step-explanation">
      <p className="primer-stream-title">A* 这一轮的思考过程（逐条浮现）：</p>
      <ThinkingStream open={step.open} shown={stream} />
      {!thinking && <>
      {guess && step.reason !== 'only' && <p className={sameNode(guess, step.selected.node) ? 'is-right' : 'is-wrong'}>{sameNode(guess, step.selected.node) ? '' : '没猜中，你选的是 ' + cellName(guess) + '。'}{explainPrediction('astar', step.open, guess, step.selected.node)}</p>}
      {wrong && <p className="primer-explain" data-testid="primer-walk-misconception"><strong>这类错误叫「{MISCONCEPTIONS[wrong].name}」：</strong>{MISCONCEPTIONS[wrong].advice}（可回看第 {MISCONCEPTIONS[wrong].chapter + 1} 章）</p>}
      <p><b>A* 挑中 {cellName(step.selected.node)}。</b>{describeChoice(step)}</p>
      {previous && step.selected.f > previous.selected.f && <p className="primer-explain"><strong>注意 f 变大了：</strong>从 {previous.selected.f} 涨到 {step.selected.f}。之前的 h 假装没有墙；现在被墙挡住，必须绕路，整趟估计就多了 {step.selected.f - previous.selected.f} 步。</p>}
      {step.isGoal
        ? <p className="primer-explain"><strong>挑中的就是终点 G，搜索结束！</strong>顺着每个格子记下的“上一格”倒着走：{[...trace.path].reverse().map(cellName).join(' ← ')}，一共 {trace.path.length - 1} 步。</p>
        : <p>展开它：{step.added.length > 0 ? '新放进清单 ' + step.added.map(cell => cellName(cell.node) + '（f=' + cell.f + '）').join('、') : '没有新的邻居可放'}{step.blocked.length > 0 ? '；' + step.blocked.map(cellName).join('、') + ' 是墙，跳过' : ''}{step.known.length > 0 ? '；' + step.known.map(node => cellName(node) + (step.closedBefore.some(item => sameNode(item, node)) ? ' 已处理过' : ' 已在清单里')).join('、') + '，不重复放' : ''}。{cellName(step.selected.node)} 标为已处理。</p>}
      {step.isGoal
        ? <button type="button" className="action-quiet" onClick={onRestart}>从头再走一遍</button>
        : <button type="button" className="action-primary" onClick={onNext} data-testid="primer-next-step">下一轮 →</button>}
      </>}
    </div>}
  </>;
}

function MasteryReportView({ report, onTryMission, onReview }: { report: MasteryReport; onTryMission: (id: 'L02' | 'L03') => void; onReview: (chapter: number) => void }) {
  const text = reportText(report);
  const [copied, setCopied] = useState(false);
  const gain = report.pre === null ? null : report.post - report.pre;
  const marks: Record<string, string> = { kept: '本来就会', learned: '学会了', review: '还要再看', slipped: '前测对、后测错' };
  return <div className="primer-report" data-testid="primer-report">
    <h4>你的 A* 掌握度</h4>
    <div className="primer-compare">
      <div><span>学前测</span><strong>{report.pre === null ? '—' : report.pre + '/' + report.total}</strong></div>
      <div><span>学后测</span><strong>{report.post}/{report.total}</strong></div>
      <div><span>逐轮预测</span><strong>{report.walk.correct}/{report.walk.total}</strong></div>
    </div>
    <p>{gain === null ? '你跳过了学前测，所以没有对比基线；' : gain > 0 ? '同一组知识点，学前答对 ' + report.pre + ' 题，学完答对 ' + report.post + ' 题，净增 ' + gain + ' 题。' : gain === 0 ? '前后测得分相同（' + report.post + '/' + report.total + '）。' : '后测比前测少 ' + -gain + ' 题，看下面哪一项掉了。'}{report.seconds === null ? '' : '从开始学到交卷用时 ' + Math.floor(report.seconds / 60) + ' 分 ' + report.seconds % 60 + ' 秒。'}</p>
    <table className="primer-table primer-table--left"><caption>逐知识点对比</caption>
      <thead><tr><th scope="col">知识点</th><th scope="col">学前</th><th scope="col">学后</th><th scope="col">结论</th></tr></thead>
      <tbody>{report.concepts.map(item => <tr key={item.concept} className={item.post ? '' : 'is-gap'}>
        <th scope="row">{item.name}</th>
        <td>{item.pre === null ? '—' : item.pre ? '✓' : '✗'}</td><td>{item.post ? '✓' : '✗'}</td>
        <td>{marks[item.status]}{item.post ? '' : <> · <button type="button" className="primer-link" onClick={() => onReview(item.chapter)}>回看第 {item.chapter + 1} 章</button></>}</td>
      </tr>)}</tbody>
    </table>
    {report.misconceptions.length > 0 && <div className="primer-misconceptions">
      <h5>按出错原因归类（来自逐轮预测和学后测）</h5>
      <ul className="primer-list">{report.misconceptions.map(item => <li key={item.type}><b>{item.name} ×{item.count}</b>：{item.advice} <button type="button" className="primer-link" onClick={() => onReview(item.chapter)}>回看第 {item.chapter + 1} 章</button></li>)}</ul>
    </div>}
    <p className="primer-aside">这份报告只在你这台设备的浏览器内生成，不上传。它说明“此刻能不能按规则做题”，不等于长期掌握。</p>
    <details className="primer-export"><summary>导出这份记录（可贴进测试表或截图）</summary>
      <pre data-testid="primer-report-text">{text}</pre>
      <div className="primer-actions">
        <button type="button" className="action-secondary" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); } }}>复制文本</button>
        {copied && <span className="is-right" role="status">已复制。</span>}
      </div>
    </details>
    <div className="primer-actions"><button type="button" className="action-primary" onClick={() => onTryMission('L03')}>去 L03 用 A* 自己预测 →</button><button type="button" className="action-quiet" onClick={() => onTryMission('L02')}>去 L02 对比 BFS 与 A*</button></div>
  </div>;
}

function FinalChapter({ onTryMission, report, onPost, onReview }: { onTryMission: (id: 'L02' | 'L03') => void; report: MasteryReport | null; onPost: (results: ItemResult[]) => void; onReview: (chapter: number) => void }) {
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
    {report
      ? <MasteryReportView report={report} onTryMission={onTryMission} onReview={onReview} />
      : <MasteryTest id="post" items={POST_TEST} feedback title="学后测" onDone={onPost}
        intro={<><h4>学后测（{POST_TEST.length} 题）</h4><p>和开头那份前测<b>考同样 5 个知识点、换了数字</b>。答完会逐题讲解，并生成你的掌握度报告。</p></>} />}
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
  const [mistakes, setMistakes] = useState<Record<number, Misconception | null>>({});
  const [pre, setPre] = useState<ItemResult[] | null>(null);
  const [report, setReport] = useState<MasteryReport | null>(null);
  const [stream, setStream] = useState(0);
  const startedAt = useRef<number | null>(null);

  // The learning clock starts when the visitor leaves the pre-test for the first lesson.
  useEffect(() => { if (chapter > 0 && startedAt.current === null) startedAt.current = Date.now(); }, [chapter]);

  useEffect(() => {
    if (!playing) return;
    const reduce = prefersReducedMotion();
    const timer = window.setTimeout(() => {
      const next = reduce ? trace.bfsLayers.length : wave + 1;
      setWave(next);
      if (next >= trace.bfsLayers.length) setPlaying(false);
    }, reduce ? 0 : 520);
    return () => window.clearTimeout(timer);
  }, [playing, wave]);

  const step = trace.steps[stepIndex]!;
  const showStep = revealed || step.reason === 'only';
  const stages = showStep ? decisionStages(step.open).length : 0;
  useEffect(() => {
    if (!showStep || stream >= stages) return;
    const timer = window.setTimeout(() => setStream(current => current + 1), prefersReducedMotion() ? 0 : 620);
    return () => window.clearTimeout(timer);
  }, [showStep, stream, stages]);

  const waveDistance = useMemo(() => {
    const map = new Map<string, number>();
    trace.bfsLayers.slice(0, wave).forEach((layer, distance) => layer.forEach(node => map.set(cellName(node), distance)));
    return map;
  }, [wave]);
  const dropped = useMemo(() => {
    if (!showStep || stream === 0) return new Set<string>();
    const names = new Set<string>();
    for (const stage of decisionStages(step.open).slice(0, stream)) for (const cell of stage.out) names.add(cellName(cell.node));
    return names;
  }, [showStep, stream, step]);

  const view = (node: Position): CellView => {
    if (kindOf(node) === 'wall') return {};
    if (chapter === 2) {
      const distance = waveDistance.get(cellName(node));
      return distance === undefined ? {} : { state: 'wave', main: distance, label: '离起点 ' + distance + ' 步' };
    }
    if (chapter === 3) {
      if (sameNode(node, exercise.node)) return { state: 'focus', label: '练习格', ...(solved >= 3 ? { g: exercise.g, h: manhattan(node, goal), main: exercise.g + manhattan(node, goal) } : { main: '?' }) };
      if (solved >= 3 && sameNode(node, { x: 2, y: 2 })) return { g: 2, h: 4, main: 6 };
      return {};
    }
    if (chapter === 5) {
      const final = step.isGoal && showStep;
      if (final && trace.path.some(item => sameNode(item, node))) return { state: 'path', label: '最短路线' };
      if (showStep && sameNode(node, step.selected.node) && stream >= stages) return cellView(step.selected, 'current', '本轮挑中');
      if (step.closedBefore.some(item => sameNode(item, node))) return { state: 'closed', label: '已处理' };
      const fresh = showStep && !step.isGoal && stream >= stages ? [...step.updated, ...step.added].find(cell => sameNode(cell.node, node)) : undefined;
      if (fresh) return cellView(fresh, 'new', '刚加入清单');
      const open = step.open.find(cell => sameNode(cell.node, node));
      if (open) {
        const mine = guess && sameNode(guess, node);
        const state: CellState = mine ? (showStep && !sameNode(guess, step.selected.node) ? 'wrong' : 'focus') : dropped.has(cellName(node)) ? 'dropped' : 'open';
        return cellView(open, state, state === 'dropped' ? '本轮已被淘汰' : '待选');
      }
    }
    if (chapter === 6) {
      if (trace.path.some(item => sameNode(item, node))) return { state: 'path', label: 'A* 最短路线' };
      if (trace.steps.at(-1)!.closedBefore.some(item => sameNode(item, node))) return { state: 'closed', label: 'A* 处理过' };
    }
    return {};
  };
  const picking = chapter === 5 && !showStep;

  const reveal = () => {
    setRevealed(true);
    setStream(0);
    if (guess && step.reason !== 'only') {
      setHits(current => (stepIndex in current ? current : { ...current, [stepIndex]: sameNode(guess, step.selected.node) }));
      setMistakes(current => (stepIndex in current ? current : { ...current, [stepIndex]: classifyMistake(step.open, step.open.find(cell => sameNode(cell.node, guess))!) }));
    }
  };
  const goStep = (index: number) => { setStepIndex(index); setRevealed(false); setGuess(null); setStream(0); };
  const goChapter = (index: number) => { setChapter(index); if (index !== 6) setReport(null); };
  const caption = ['配送地图', '配送地图', 'BFS 水波：数字是离起点几步', '打分练习', '配送地图', 'A* 逐轮演示：大数字 f，角标 g 与 h；灰掉的是本轮已被淘汰的格子', 'A* 的最终结果：亮色为最短路线；这张图里 A* 处理过的 ' + trace.astar.expandedCount + ' 个格子全在路线上'][chapter]!;

  return <section id="astar-primer" className="primer" aria-labelledby="primer-title" data-testid="astar-primer" tabIndex={-1}>
    <div className="primer-head">
      <p className="eyebrow">ZERO TO A* · 约 10 分钟 · 不需要任何算法基础</p>
      <h2 id="primer-title">零基础 A* 入门：先测一遍，再学，再测一遍</h2>
      <p>先自己猜，再看 A* 逐条浮现的思考过程。所有数字都由站内真实的 A* / BFS 程序算出，不是手写的演示；最后给你一份前后对比的掌握度报告。</p>
    </div>
    <ol className="primer-chapters" aria-label="入门章节">
      {chapters.map((name, index) => <li key={name}><button type="button" aria-current={chapter === index ? 'step' : undefined} onClick={() => goChapter(index)}><span>{index + 1}</span>{name}</button></li>)}
    </ol>
    <div className={'primer-body' + (chapter === 0 ? ' primer-body--single' : '')}>
      {chapter !== 0 && <PrimerGrid view={view} caption={caption} pickable={node => step.open.some(cell => sameNode(cell.node, node))} onPick={picking ? setGuess : undefined} />}
      <div className="primer-text">
        <h3>{chapter + 1}. {chapters[chapter]}</h3>
        {chapter === 0 && (pre
          ? <>
            <p role="status">前测已交卷：<b>{pre.filter(item => item.correct).length} / {PRE_TEST.length}</b>。先不看答案——学完第 7 章的学后测会考同样的知识点，到时一起对比讲解。</p>
            <div className="primer-actions"><button type="button" className="action-primary" onClick={() => goChapter(1)} data-testid="primer-start-learning">开始学 →</button><button type="button" className="action-quiet" onClick={() => setPre(null)}>重做前测</button></div>
          </>
          : <MasteryTest id="pre" items={PRE_TEST} feedback={false} title="学前测" onDone={setPre}
            intro={<><p>先花 2 分钟做 5 道题，<b>不会就猜</b>。这不是考试：它只用来和你学完之后的同类题目作对比，让“学会了没有”变成能看见的数据。</p><p className="primer-aside">前测不显示答案，也不解释，避免提前泄题。想直接开始学就点下面的跳过。</p><div className="primer-actions"><button type="button" className="action-quiet" onClick={() => goChapter(1)} data-testid="primer-skip-pre">跳过前测，直接开始学</button></div></>} />)}
        {chapter === 1 && <ProblemChapter />}
        {chapter === 2 && <WaveChapter shown={wave} playing={playing} onPlay={() => { setWave(0); setPlaying(true); }} />}
        {chapter === 3 && <ScoreChapter solved={solved} onSolve={setSolved} />}
        {chapter === 4 && <RulesChapter />}
        {chapter === 5 && <WalkChapter index={stepIndex} revealed={revealed} guess={guess} onGuess={setGuess} onReveal={reveal} onNext={() => goStep(stepIndex + 1)} onRestart={() => { goStep(0); setHits({}); setMistakes({}); }} score={Object.values(hits).filter(Boolean).length} mistakes={Object.values(mistakes)} stream={stream} />}
        {chapter === 6 && <FinalChapter onTryMission={onTryMission} report={report} onReview={goChapter}
          onPost={results => setReport(buildReport(pre, results, Object.values(mistakes), startedAt.current === null ? null : Math.round((Date.now() - startedAt.current) / 1000)))} />}
      </div>
    </div>
    <div className="primer-nav">
      <button type="button" className="action-quiet" disabled={chapter === 0} onClick={() => goChapter(chapter - 1)}>← 上一章</button>
      <span>{chapter + 1} / {chapters.length}</span>
      <button type="button" className="action-primary" disabled={chapter === chapters.length - 1} onClick={() => goChapter(chapter + 1)} data-testid="primer-next-chapter">下一章 →</button>
    </div>
  </section>;
}

function cellView(cell: PrimerCell, state: CellState, label: string): CellView {
  return { state, g: cell.g, h: cell.h, main: cell.f, label };
}
