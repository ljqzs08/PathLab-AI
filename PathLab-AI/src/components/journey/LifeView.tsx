import { useEffect, useState } from 'react';
import type { Position } from '../../../contracts/types';
import { TOWN, planWalk, sameCell, type WalkResult } from '../../domain/game';
import { isWalkable } from '../../domain/grid';
import { mediaUrl } from '../../media';
import { Naiwa, Picture, type NaiwaMood } from '../Naiwa';
import { TileGrid } from './TileGrid';

const INTRO = [
  <>上一站你已经认识了 A*：它给每个格子打分，<b>g</b> = 已经走了几步，<b>h</b> = 估计还要几步，<b>f = g + h</b> 是总分。</>,
  <>你用过手机导航吗？玩游戏时点一下地面，角色会自己绕开墙走过去。这两件事背后，常常就是 A*。</>,
  <>这一站用两个小游戏，看看 g、h、f 在生活里长什么样。忘了意思？点顶部的“g/h/f 是什么？”随时查。</>,
];

const NAV_PHRASES = [
  { id: 'g', text: '已行驶 3.2 公里', answer: 'g', why: '已经真实走过的路，是确定的——这就是 g（已走代价）。' },
  { id: 'h', text: '预计剩余 5.1 公里', answer: 'h', why: '还没走，只是估计——这就是 h（估计还剩）。' },
  { id: 'f', text: '全程约 8.3 公里', answer: 'f', why: '已走 + 预计剩余 = 全程估计——这就是 f = g + h。' },
] as const;

function NavMatch() {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const done = NAV_PHRASES.every(item => picks[item.id] === item.answer);
  return <div className="journey-card" data-testid="nav-match">
    <h3>小游戏 ①：导航屏幕上的三句话</h3>
    <p>导航 App 一边开车一边告诉你下面三句话。猜猜它们分别对应 A* 里的哪个字母？</p>
    <p className="journey-tip">复习一下：<b>g</b> = 已经走了多少（走<b>过</b>的），<b>h</b> = 估计还剩多少（<b>还</b>要走的），<b>f</b> = g + h，全程大概多少（总<b>分</b>）。</p>
    <div className="nav-phone" aria-hidden="true"><span className="nav-phone-dot" /><span>导航中 · 前方 200 米右转</span></div>
    <ul className="nav-match">
      {NAV_PHRASES.map(item => {
        const pick = picks[item.id];
        return <li key={item.id}>
          <strong>“{item.text}”</strong>
          <div className="chip-row" role="group" aria-label={item.text + ' 对应哪个字母'}>
            {(['g', 'h', 'f'] as const).map(letter => <button key={letter} type="button" className={'chip' + (pick === letter ? (letter === item.answer ? ' is-right' : ' is-wrong') : '')} aria-pressed={pick === letter} onClick={() => setPicks(current => ({ ...current, [item.id]: letter }))}>{letter}</button>)}
          </div>
          {pick && <p className={pick === item.answer ? 'is-right' : 'is-wrong'} role="status">{pick === item.answer ? '对！' + item.why : '再想想：它是“走过的”、“估计的”，还是“加起来的”？'}</p>}
        </li>;
      })}
    </ul>
    {done && <p className="journey-tip" role="status">全对！记住这个口诀：<b>g 管过去，h 看未来，f 是两者之和</b>。A* 每次都挑 f 最小的格子往前走。</p>}
  </div>;
}

function Walker() {
  const [pos, setPos] = useState<Position>(TOWN.start);
  const [plan, setPlan] = useState<(WalkResult & { target: Position }) | null>(null);
  const [cursor, setCursor] = useState(0);
  const [showThinking, setShowThinking] = useState(true);
  const [message, setMessage] = useState<{ text: string; mood: NaiwaMood }>({ text: '点地图上任意一块空地（浅色格子），我就用 A* 自己走过去！', mood: 'wave' });
  const walking = plan !== null && cursor < plan.path.length - 1;

  useEffect(() => {
    if (!plan || cursor >= plan.path.length - 1) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => {
      const next = reduce ? plan.path.length - 1 : cursor + 1;
      setCursor(next);
      setPos(plan.path[next]!);
      if (next === plan.path.length - 1) setMessage({ text: '到啦！走了 ' + (plan.path.length - 1) + ' 步。A* 只“动脑筋”处理了 ' + plan.astarExpanded + ' 个格子；要是一圈圈地瞎试（BFS），得处理 ' + plan.bfsExpanded + ' 个。', mood: 'happy' });
    }, reduce ? 0 : 150);
    return () => window.clearTimeout(timer);
  }, [plan, cursor]);

  const pick = (node: Position) => {
    if (walking) return;
    if (sameCell(node, pos)) { setMessage({ text: '我已经站在这里啦，换个地方点吧。', mood: 'think' }); return; }
    if (!isWalkable(TOWN.grid, node)) { setMessage({ text: '那是房子（深色格子），进不去哦。点一块空地试试。', mood: 'oops' }); return; }
    const result = planWalk(TOWN, pos, node);
    if (!result) { setMessage({ text: '那里被围住了，走不过去。', mood: 'oops' }); return; }
    setPlan({ ...result, target: node });
    setCursor(0);
    setMessage({ text: 'A* 已经想好路线了，出发！', mood: 'think' });
  };

  const input = { grid: TOWN.grid, start: pos, goal: plan?.target ?? pos };
  return <div className="journey-card" data-testid="walker">
    <h3>小游戏 ②：像玩游戏一样，点哪儿走哪儿</h3>
    <p>很多游戏里“点地面让角色走过去”，用的就是 A*。点下面小镇里的空地，奶娃会自己绕开房子走过去。</p>
    <div className="walker-layout">
      <div className="town">
        <TileGrid input={input} label="奶娃小镇" testId="town-grid" onPick={pick} tile={node => {
          const here = sameCell(node, pos);
          const onPath = plan ? plan.path.slice(cursor).some(item => sameCell(item, node)) : false;
          const thought = showThinking && plan ? plan.astarCells.some(item => sameCell(item, node)) : false;
          const target = plan && sameCell(node, plan.target);
          return {
            className: [here ? 'is-here' : '', onPath ? 'is-route' : '', thought ? 'is-thought' : '', target ? 'is-target' : ''].filter(Boolean).join(' '),
            // eslint-disable-next-line @next/next/no-img-element -- embedded data URL in the single-file build
            content: here ? <img src={mediaUrl('naiwa.webp')} alt="" className="tile-avatar" /> : target ? <span aria-hidden="true">⚑</span> : null,
            label: here ? '奶娃在这里' : target ? '目的地' : thought ? 'A* 考虑过' : undefined,
          };
        }} />
        <div className="legend"><span><i className="sw sw--road" />空地</span><span><i className="sw sw--wall" />房子</span><span><i className="sw sw--thought" />A* 考虑过的格子</span><span><i className="sw sw--route" />要走的路线</span></div>
      </div>
      <div className="walker-side">
        <Naiwa key={message.text} lines={[message.text]} mood={message.mood} size="sm" />
        <label className="toggle"><input type="checkbox" checked={showThinking} onChange={event => setShowThinking(event.target.checked)} />显示 A* 考虑过的格子</label>
        {plan && !walking && <dl className="stat-row">
          <div><dt>走了</dt><dd>{plan.path.length - 1} 步</dd></div>
          <div><dt>A* 处理</dt><dd>{plan.astarExpanded} 格</dd></div>
          <div><dt>BFS 要处理</dt><dd>{plan.bfsExpanded} 格</dd></div>
        </dl>}
        <p className="journey-aside">多点几个远近不同的地方，比较一下：目的地越远、路越弯，A* 省下的力气越明显。</p>
      </div>
    </div>
  </div>;
}

const SCENE_OPTIONS = ['都在已知地图上，找一条低代价、能走通的路线', '都需要把每一条路都走一遍', '都只能直线前进'];

function SceneCheck() {
  const [pick, setPick] = useState<number | null>(null);
  return <div className="journey-check">
    <p><b>看图回答：</b>仓储 AGV、扫地机器人、送餐机器人、游戏角色、巡检无人机——它们的共同点是什么？</p>
    <div className="choice-list">{SCENE_OPTIONS.map((option, index) => <button key={option} type="button" className={'choice' + (pick === null ? '' : index === 0 ? ' is-right' : index === pick ? ' is-wrong' : '')} disabled={pick !== null} onClick={() => setPick(index)}>{option}</button>)}</div>
    {pick !== null && <p role="status" className="journey-tip">{pick === 0 ? '答对了！' : '答案是第一个。'}这就是 A* 擅长的事：<b>地图已知，找低代价可行路线</b>。路上突然冒出来的行人这类“动态障碍”，还要配合局部避障一起用。小知识：扫地机器人“把房间扫一遍”属于覆盖规划，A* 负责其中“从这儿去那儿”的一段段路线。</p>}
  </div>;
}

export function LifeView() {
  return <>
    <Naiwa lines={INTRO} size="lg" />
    <NavMatch />
    <Walker />
    <div className="journey-card">
      <h3>它还藏在哪些地方？</h3>
      <div className="journey-split">
        <Picture src={mediaUrl('astar-scenes.jpg')} alt="A* 的五个应用场景：仓储 AGV 货架间导航、扫地机器人避障、室内配送机器人、游戏网格寻路、无人机巡检全局路径规划" caption="图：A* 的 5 个典型应用场景（点击放大）" />
        <SceneCheck />
      </div>
    </div>
  </>;
}
