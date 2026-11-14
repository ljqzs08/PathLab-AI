import { useEffect, useMemo, useState } from 'react';
import type { Position } from '../../../contracts/types';
import { DESIGN_BASE, DESIGN_BUDGET, DESIGN_STARS, DRAW_LEVELS, QUICK_ROUNDS, applyWalls, editPath, judgePath, quickAnswer, sameCell, scoreDesign, toggleWall, type PathJudgement, type QuickRound } from '../../domain/game';
import { manhattanDistance, runAstar } from '../../domain/algorithms/astar';
import { Naiwa, type NaiwaMood } from '../Naiwa';
import { TileGrid } from './TileGrid';

type Stars = 0 | 1 | 2 | 3;
const starText = (count: number, total = 3) => '★'.repeat(count) + '☆'.repeat(total - count);

function reduceMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

function DrawLevel({ index, onScore, onNext }: { index: number; onScore: (stars: Stars) => void; onNext: (() => void) | null }) {
  const level = DRAW_LEVELS[index]!;
  const [path, setPath] = useState<Position[]>([level.input.start]);
  const [result, setResult] = useState<PathJudgement | null>(null);
  const [showAstar, setShowAstar] = useState(false);
  const [say, setSay] = useState<{ text: string; mood: NaiwaMood }>({ text: level.story + ' 从 S 开始，一格一格点相邻的空地，把路线画到 G。点路线上的格子可以退回到那里。', mood: 'wave' });
  const astar = useMemo(() => runAstar(level.input), [level]);
  const thought = useMemo(() => astar.events.filter(event => event.type === 'node_expanded').map(event => event.payload.node), [astar]);

  const pick = (node: Position) => {
    if (result) return;
    const edit = editPath(level.input, path, node);
    if (!edit.ok) {
      setSay({ text: edit.reason === 'wall' ? '那是墙，过不去～' : edit.reason === 'not_adjacent' ? '只能走到和路线末端上下左右挨着的格子哦。' : '已经到终点啦。', mood: 'oops' });
      return;
    }
    setPath(edit.path);
    if (sameCell(edit.path[edit.path.length - 1]!, level.input.goal)) {
      const judged = judgePath(level.input, edit.path);
      setResult(judged);
      onScore(judged.stars as Stars);
      setSay(judged.stars === 3
        ? { text: '太棒了！' + judged.steps + ' 步，和 A* 找到的最短路线一样短！', mood: 'happy' }
        : { text: '送到啦！你走了 ' + judged.steps + ' 步，最短其实只要 ' + judged.optimal + ' 步。点“看看 A* 怎么走”对比一下？', mood: 'think' });
    } else setSay({ text: '已走 ' + (edit.path.length - 1) + ' 步（这就是你现在的 g）。离 G 直线还差 ' + manhattanDistance(node, level.input.goal) + ' 格（这就是 h）。', mood: 'wave' });
  };
  const reset = () => { setPath([level.input.start]); setResult(null); setShowAstar(false); setSay({ text: '重新来！从 S 出发。', mood: 'wave' }); };

  return <div className="game-stage" data-testid={'draw-' + level.id}>
    <div className="game-map">
      <TileGrid input={level.input} label={'第 1 关地图：' + level.title} testId="draw-grid" onPick={pick} tile={node => {
        const order = path.findIndex(item => sameCell(item, node));
        const astarPath = showAstar && astar.path.some(item => sameCell(item, node));
        const astarThought = showAstar && thought.some(item => sameCell(item, node));
        return {
          className: [order >= 0 ? 'is-mine' : '', order === path.length - 1 ? 'is-head' : '', astarPath ? 'is-astar' : '', astarThought && !astarPath ? 'is-thought' : ''].filter(Boolean).join(' '),
          content: sameCell(node, level.input.start) ? 'S' : sameCell(node, level.input.goal) ? 'G' : order > 0 ? order : null,
          label: order > 0 ? '我的路线第 ' + order + ' 步' : astarPath ? 'A* 的最短路线' : undefined,
        };
      }} />
      <div className="legend"><span><i className="sw sw--mine" />我的路线</span>{showAstar && <><span><i className="sw sw--astar" />A* 最短路线</span><span><i className="sw sw--thought" />A* 处理过</span></>}</div>
    </div>
    <div className="game-side">
      <Naiwa key={say.text} lines={[say.text]} mood={say.mood} size="sm" />
      <p className="game-meta">地图 {index + 1} / {DRAW_LEVELS.length} · {level.title} · 已走 <b data-testid="draw-steps">{path.length - 1}</b> 步</p>
      {result && <div className="game-result" role="status" data-testid="draw-result">
        <p className="stars" aria-label={'获得 ' + result.stars + ' 颗星'}>{starText(result.stars)}</p>
        <p>你的路线 {result.steps} 步 · 最短 {result.optimal} 步。A* 找这条路时处理了 {result.astarExpanded} 个格子，BFS 要处理 {result.bfsExpanded} 个。</p>
      </div>}
      <div className="game-actions">
        <button type="button" className="action-quiet" disabled={path.length < 2 || result !== null} onClick={() => setPath(path.slice(0, -1))}>撤销一步</button>
        <button type="button" className="action-quiet" onClick={reset}>重画</button>
        {result && <button type="button" className="action-secondary" aria-pressed={showAstar} onClick={() => setShowAstar(!showAstar)}>{showAstar ? '隐藏 A* 路线' : '看看 A* 怎么走'}</button>}
        {result && onNext && <button type="button" className="action-primary" onClick={onNext} data-testid="draw-next">下一张地图 →</button>}
      </div>
    </div>
  </div>;
}

function explainRound(round: QuickRound) {
  if (round.kind === 'f') return 'f = g + h = ' + round.g + ' + ' + round.h + ' = ' + (round.g + round.h) + '。';
  if (round.kind === 'h') return 'h = |' + round.from.x + '−' + round.goal.x + '| + |' + round.from.y + '−' + round.goal.y + '| = ' + manhattanDistance(round.from, round.goal) + '。';
  const answer = round.cells[quickAnswer(round)]!;
  const fs = round.cells.map(cell => cell.name + ' f=' + (cell.g + cell.h)).join('、');
  const tied = round.cells.filter(cell => cell.g + cell.h === answer.g + answer.h);
  const sameH = tied.filter(cell => cell.h === answer.h);
  return fs + '。' + (tied.length === 1 ? '最小的是' + answer.name + '。' : sameH.length === 1 ? 'f 打平，比 h：' + answer.name + ' 离终点更近（h=' + answer.h + '）。' : 'f、h 都打平，挑先进清单的' + answer.name + '（第 ' + answer.order + ' 个加入）。');
}

function QuickQuiz({ onScore }: { onScore: (stars: Stars) => void }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [combo, setCombo] = useState(0);
  const finished = index >= QUICK_ROUNDS.length;
  const round = QUICK_ROUNDS[Math.min(index, QUICK_ROUNDS.length - 1)]!;
  const answer = quickAnswer(round);
  const options = round.kind === 'pick' ? round.cells.map(cell => cell.name + '（g=' + cell.g + '，h=' + cell.h + '）') : round.options.map(String);
  const stars: Stars = right === QUICK_ROUNDS.length ? 3 : right >= 6 ? 2 : right >= 4 ? 1 : 0;

  const choose = (option: number) => {
    setPicked(option);
    if (option === answer) { setRight(right + 1); setCombo(combo + 1); } else setCombo(0);
  };
  const next = () => {
    const after = index + 1;
    setIndex(after); setPicked(null);
    if (after >= QUICK_ROUNDS.length) onScore(stars);
  };
  const restart = () => { setIndex(0); setPicked(null); setRight(0); setCombo(0); };

  if (finished) return <div className="game-stage game-stage--single" data-testid="quiz-result">
    <Naiwa key={'quiz-' + right} lines={[stars >= 2 ? '答对 ' + right + ' / ' + QUICK_ROUNDS.length + '！你已经会像 A* 一样“挑格子”了。' : '答对 ' + right + ' / ' + QUICK_ROUNDS.length + '。记住挑选顺序：先比 f，f 一样比 h，再一样比谁先进清单。再来一次？']} mood={stars >= 2 ? 'happy' : 'think'} />
    <p className="stars" role="status" aria-label={'获得 ' + stars + ' 颗星'}>{starText(stars)}</p>
    <div className="game-actions"><button type="button" className="action-quiet" onClick={restart}>再来一次</button></div>
  </div>;

  return <div className="game-stage game-stage--single" data-testid="quiz">
    <p className="game-meta">第 {index + 1} / {QUICK_ROUNDS.length} 题 · 答对 {right}{combo >= 2 ? ' · 连对 ×' + combo + '！' : ''}</p>
    <div className="quiz-card">
      <p className="quiz-prompt">{round.prompt}</p>
      {round.kind === 'pick' && <p className="journey-aside">规则：先比 f = g + h；f 一样比 h；还一样就挑更早进清单的（甲乙丙按进清单先后：{round.cells.map(cell => cell.name + '#' + cell.order).join('、')}）。</p>}
      <div className="choice-list choice-list--row">{options.map((option, order) => <button key={option} type="button" className={'choice' + (picked === null ? '' : order === answer ? ' is-right' : order === picked ? ' is-wrong' : '')} disabled={picked !== null} onClick={() => choose(order)}>{option}</button>)}</div>
      {picked !== null && <p role="status" className={picked === answer ? 'is-right' : 'is-wrong'} data-testid="quiz-feedback"><b>{picked === answer ? '答对了！' : '差一点。'}</b>{explainRound(round)}</p>}
      {picked !== null && <button type="button" className="action-primary" onClick={next} data-testid="quiz-next">{index + 1 < QUICK_ROUNDS.length ? '下一题 →' : '看成绩'}</button>}
    </div>
  </div>;
}

function MazeDesigner({ onScore }: { onScore: (stars: Stars) => void }) {
  const [walls, setWalls] = useState<Position[]>([]);
  const [replay, setReplay] = useState<number | null>(null);
  const [say, setSay] = useState<{ text: string; mood: NaiwaMood }>({ text: '换你当出题人！最多放 ' + DESIGN_BUDGET + ' 堵墙，想办法让 A* 多绕点弯、多“动脑筋”——但不能把路完全堵死。', mood: 'wave' });
  const result = useMemo(() => scoreDesign(DESIGN_BASE, walls), [walls]);
  const input = useMemo(() => applyWalls(DESIGN_BASE, walls), [walls]);

  useEffect(() => {
    if (replay === null || replay >= result.expandedCells.length) return;
    const timer = window.setTimeout(() => setReplay(reduceMotion() ? result.expandedCells.length : replay + 1), reduceMotion() ? 0 : 90);
    return () => window.clearTimeout(timer);
  }, [replay, result]);

  const pick = (node: Position) => {
    const edit = toggleWall(DESIGN_BASE, walls, node);
    if (!edit.ok) { setSay({ text: edit.reason === 'endpoint' ? '起点和终点上不能放墙哦。' : '墙用完啦（' + DESIGN_BUDGET + ' 堵）。点一堵已有的墙可以拆掉它。', mood: 'oops' }); return; }
    setWalls(edit.walls);
    setReplay(null);
    const next = scoreDesign(DESIGN_BASE, edit.walls);
    setSay(next.status !== 'found'
      ? { text: '哎呀，路被堵死了！A* 会老实回答“无可行路径”。拆掉一堵墙吧。', mood: 'oops' }
      : { text: 'A* 现在要处理 ' + next.expanded + ' 个格子，路线 ' + next.pathLength + ' 步。' + (next.stars === 3 ? '厉害，三星设计！' : '试试把墙摆成“口袋”形，正对着终点方向。'), mood: next.stars >= 2 ? 'happy' : 'think' });
  };

  const shown = replay === null ? 0 : replay;
  return <div className="game-stage" data-testid="designer">
    <div className="game-map">
      <TileGrid input={input} label="第 3 关：迷宫设计台" testId="designer-grid" onPick={pick} tile={node => {
        const step = result.expandedCells.slice(0, shown).findIndex(item => sameCell(item, node));
        const done = replay !== null && shown >= result.expandedCells.length;
        const onPath = done && result.path.some(item => sameCell(item, node));
        return {
          className: [step >= 0 ? 'is-thought' : '', onPath ? 'is-astar' : ''].filter(Boolean).join(' '),
          content: sameCell(node, DESIGN_BASE.start) ? 'S' : sameCell(node, DESIGN_BASE.goal) ? 'G' : step >= 0 ? step + 1 : null,
          label: step >= 0 ? 'A* 第 ' + (step + 1) + ' 个处理' : undefined,
        };
      }} />
      <div className="legend"><span><i className="sw sw--wall" />墙（点击放置/拆除）</span><span><i className="sw sw--thought" />A* 处理顺序</span><span><i className="sw sw--astar" />最终路线</span></div>
    </div>
    <div className="game-side">
      <Naiwa key={say.text} lines={[say.text]} mood={say.mood} size="sm" />
      <dl className="stat-row">
        <div><dt>已用墙</dt><dd data-testid="designer-walls">{walls.length} / {DESIGN_BUDGET}</dd></div>
        <div><dt>A* 处理</dt><dd data-testid="designer-expanded">{result.status === 'found' ? result.expanded + ' 格' : '—'}</dd></div>
        <div><dt>当前星级</dt><dd className="stars-inline">{starText(result.stars)}</dd></div>
      </dl>
      <p className="journey-aside">星级标准：A* 处理 ≥ {DESIGN_STARS[0]} 格一星，≥ {DESIGN_STARS[1]} 格二星，≥ {DESIGN_STARS[2]} 格三星（不放墙时只要 {scoreDesign(DESIGN_BASE, []).expanded} 格）。</p>
      <div className="game-actions">
        <button type="button" className="action-secondary" disabled={result.status !== 'found'} onClick={() => setReplay(0)}>播放 A* 搜索过程</button>
        <button type="button" className="action-quiet" disabled={walls.length === 0} onClick={() => { setWalls([]); setReplay(null); }}>清空</button>
        <button type="button" className="action-primary" disabled={result.stars === 0} onClick={() => { onScore(result.stars); setSay({ text: '设计已提交，拿到 ' + result.stars + ' 颗星！秘密是：h 只会“直线估计”，墙越是挡在直线方向上，A* 被骗去试的格子就越多。', mood: 'happy' }); }} data-testid="designer-submit">提交我的设计</button>
      </div>
    </div>
  </div>;
}

const LEVELS = [
  { id: 'draw', title: '第 1 关 · 画出最短路', teach: '体会“最短路线”和 g、h', total: 9 },
  { id: 'quiz', title: '第 2 关 · f 值快问快答', teach: '练熟 A* 的挑选规则', total: 3 },
  { id: 'design', title: '第 3 关 · 迷宫设计师', teach: '理解 h 只是估计', total: 3 },
] as const;
type LevelId = typeof LEVELS[number]['id'] | 'badge';

export function GameView({ onGoLab }: { onGoLab: () => void }) {
  const [level, setLevel] = useState<LevelId>('draw');
  const [drawIndex, setDrawIndex] = useState(0);
  const [drawStars, setDrawStars] = useState<Record<string, Stars>>({});
  const [quizStars, setQuizStars] = useState<Stars | null>(null);
  const [designStars, setDesignStars] = useState<Stars | null>(null);
  const drawTotal = Object.values(drawStars).reduce<number>((sum, value) => sum + value, 0);
  const unlocked: Record<LevelId, boolean> = {
    draw: true,
    quiz: DRAW_LEVELS.every(item => (drawStars[item.id] ?? 0) > 0),
    design: quizStars !== null && quizStars > 0,
    badge: designStars !== null && designStars > 0,
  };
  const earned: Record<string, number> = { draw: drawTotal, quiz: quizStars ?? 0, design: designStars ?? 0 };
  const total = drawTotal + (quizStars ?? 0) + (designStars ?? 0);

  return <>
    <Naiwa lines={[
      <>欢迎来到<b>奶娃送奶大冒险</b>！一共 3 关，每关最多 3 星（第 1 关有 3 张地图）。</>,
      <>每过一关，下一关才会解锁。卡住了也没关系，随时可以回前面的站点复习。</>,
    ]} />
    <ol className="level-tabs" aria-label="关卡">
      {LEVELS.map(item => <li key={item.id}>
        <button type="button" aria-current={level === item.id ? 'step' : undefined} disabled={!unlocked[item.id]} onClick={() => setLevel(item.id)} data-testid={'level-' + item.id}>
          <strong>{item.title}{unlocked[item.id] ? '' : '（未解锁）'}</strong><span>{item.teach}</span><span className="stars-inline">{earned[item.id]} / {item.total} ★</span>
        </button>
      </li>)}
      <li><button type="button" aria-current={level === 'badge' ? 'step' : undefined} disabled={!unlocked.badge} onClick={() => setLevel('badge')} data-testid="level-badge"><strong>通关证书{unlocked.badge ? '' : '（未解锁）'}</strong><span>共 {total} / 15 ★</span></button></li>
    </ol>
    <div className="journey-card">
      {level === 'draw' && <DrawLevel key={drawIndex} index={drawIndex}
        onScore={stars => setDrawStars(current => ({ ...current, [DRAW_LEVELS[drawIndex]!.id]: Math.max(current[DRAW_LEVELS[drawIndex]!.id] ?? 0, stars) as Stars }))}
        onNext={drawIndex + 1 < DRAW_LEVELS.length ? () => setDrawIndex(drawIndex + 1) : () => setLevel('quiz')} />}
      {level === 'draw' && <div className="draw-switch">{DRAW_LEVELS.map((item, index) => <button key={item.id} type="button" className="chip" aria-pressed={drawIndex === index} onClick={() => setDrawIndex(index)}>{index + 1}. {item.title} {drawStars[item.id] ? starText(drawStars[item.id]!) : ''}</button>)}</div>}
      {level === 'quiz' && <QuickQuiz onScore={stars => setQuizStars(current => Math.max(current ?? 0, stars) as Stars)} />}
      {level === 'design' && <MazeDesigner onScore={stars => setDesignStars(current => Math.max(current ?? 0, stars) as Stars)} />}
      {level === 'badge' && <div className="certificate" data-testid="certificate">
        <Naiwa lines={['恭喜通关！你已经是 A* 小达人啦！']} mood="happy" size="lg" />
        <h3>A* 小达人 · 通关证书</h3>
        <p className="stars" aria-label={'共 ' + total + ' 颗星'}>{total} / 15 ★</p>
        <ul className="slide-points">
          <li>会算：g（已走）、h（估计还剩，曼哈顿距离）、f = g + h。</li>
          <li>会挑：先比 f，打平比 h，再打平比先来后到。</li>
          <li>会解释：h 只是直线估计，被墙挡住时 A* 就得多试一些格子。</li>
        </ul>
        <div className="game-actions"><button type="button" className="action-primary" onClick={onGoLab}>去任务工作台挑战真实关卡 →</button></div>
      </div>}
    </div>
  </>;
}
