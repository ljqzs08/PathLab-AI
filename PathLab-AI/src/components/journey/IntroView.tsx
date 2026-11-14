import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Position } from '../../../contracts/types';
import { buildPrimerTrace, sameNode } from '../../domain/learning/astar-primer';
import { Naiwa, type NaiwaMood } from '../Naiwa';
import { TileGrid, type Tile } from './TileGrid';

const trace = buildPrimerTrace();
const { input } = trace;
const S = input.start, G = input.goal;
const RIGHT = { x: 1, y: 2 };
const firstChoice = trace.steps[1]!;
const direction = (node: Position) => (node.y < S.y ? '上面' : node.y > S.y ? '下面' : '右边');
const onPath = (node: Position) => trace.path.some(item => sameNode(item, node));

function reduceMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

function Choices({ options, answer, onPick, picked }: { options: readonly string[]; answer: number; picked: number | null; onPick: (index: number) => void }) {
  return <div className="choice-list choice-list--row">{options.map((option, index) => <button key={option} type="button" className={'choice' + (picked === null ? '' : index === answer ? ' is-right' : index === picked ? ' is-wrong' : '')} disabled={picked !== null} onClick={() => onPick(index)}>{option}</button>)}</div>;
}

interface Step { title: string; say: string; mood: NaiwaMood; ready: boolean; body: ReactNode; tile?: (node: Position) => Tile; onPick?: (node: Position) => void; caption?: string }

export function IntroView({ onFinish }: { onFinish: () => void }) {
  const [index, setIndex] = useState(0);
  const [found, setFound] = useState<{ s: boolean; g: boolean }>({ s: false, g: false });
  const [mapNote, setMapNote] = useState<string | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [wave, setWave] = useState(0);
  const [waving, setWaving] = useState(false);
  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);
  const [fValue, setFValue] = useState('');
  const [fResult, setFResult] = useState<boolean | null>(null);
  const [pick, setPick] = useState<Position | null>(null);
  const [walk, setWalk] = useState(0);
  const [walking, setWalking] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const turned = useRef(false);
  useEffect(() => {
    if (!turned.current) { turned.current = true; return; }
    if (top.current && top.current.getBoundingClientRect().top < 0) top.current.scrollIntoView({ block: 'start' });
  }, [index]);

  useEffect(() => {
    if (!waving) return;
    const timer = window.setTimeout(() => {
      const next = reduceMotion() ? trace.bfsLayers.length : wave + 1;
      setWave(next);
      if (next >= trace.bfsLayers.length) setWaving(false);
    }, reduceMotion() ? 0 : 450);
    return () => window.clearTimeout(timer);
  }, [waving, wave]);
  useEffect(() => {
    if (!walking) return;
    const timer = window.setTimeout(() => {
      const next = reduceMotion() ? trace.steps.length : walk + 1;
      setWalk(next);
      if (next >= trace.steps.length) setWalking(false);
    }, reduceMotion() ? 0 : 600);
    return () => window.clearTimeout(timer);
  }, [walking, walk]);

  const label = (node: Position) => (sameNode(node, S) ? 'S' : sameNode(node, G) ? 'G' : null);
  const waveDistance = (node: Position) => trace.bfsLayers.slice(0, wave).findIndex(layer => layer.some(item => sameNode(item, node)));
  const fDone = fResult === true;

  const steps: Step[] = [
    {
      title: 'A* 是什么？',
      say: '先用一句话认识它：A*（读作“A 星”）是一种帮电脑“找路”的方法。',
      mood: 'wave', ready: true,
      caption: '亮色的格子：A* 找到的最短路线',
      tile: node => ({ className: onPath(node) && !label(node) ? 'is-astar' : '', content: label(node) }),
      body: <>
        <p className="intro-lead">给 A* 一张地图、一个<b>起点</b>和一个<b>终点</b>，它就能算出一条<b>最短的路线</b>，而且算得很快。</p>
        <ul className="slide-points">
          <li>手机导航帮你规划路线；</li>
          <li>游戏里你点一下地面，角色自己绕开墙走过去；</li>
          <li>仓库里的送货机器人在货架间穿行。</li>
        </ul>
        <p>这些背后，常常都是 A*。它在 1968 年由三位美国科学家提出，到现在还在用。</p>
        <p className="journey-aside">“算法”听起来很难，其实就是<b>一套一步一步做事的规则</b>，像菜谱一样，照着做就能得到结果。这一站我们就把 A* 这份“菜谱”一句一句看懂。</p>
      </>,
    },
    {
      title: '看懂这张地图',
      say: '我们用一张格子地图来练习。请你在地图上点一下起点 S，再点一下终点 G。',
      mood: found.s && found.g ? 'happy' : 'think', ready: found.s && found.g,
      caption: '点一点：先找 S，再找 G',
      onPick: node => {
        if (sameNode(node, S)) { setFound(current => ({ ...current, s: true })); setMapNote('找到了！S 是起点（Start），奶娃从这里出发。'); }
        else if (sameNode(node, G)) { setFound(current => ({ ...current, g: true })); setMapNote('找到了！G 是终点（Goal），要把牛奶送到这里。'); }
        else if (input.grid.rows[node.y]![node.x] === '#') setMapNote('这是墙（斜纹格子），走不过去。');
        else setMapNote('这是空地，可以走。再找找 S 和 G。');
      },
      tile: node => ({ className: (sameNode(node, S) && found.s) || (sameNode(node, G) && found.g) ? 'is-focus' : '', content: label(node) }),
      body: <>
        <ul className="slide-points">
          <li>每个小方块叫一个<b>格子</b>，代表地上的一小块地方。</li>
          <li><b>S</b> 是起点（Start），<b>G</b> 是终点（Goal）。</li>
          <li>斜纹格子是<b>墙</b>，不能穿过去。</li>
          <li>每次只能往<b>上、下、左、右</b>走一格，不能斜着走。<b>走一格就算 1 步</b>。</li>
        </ul>
        <p className="game-meta">起点 S：{found.s ? '✓ 找到了' : '还没找到'} · 终点 G：{found.g ? '✓ 找到了' : '还没找到'}</p>
        {mapNote && <p role="status" className={found.s && found.g ? 'is-right' : 'journey-aside'}>{mapNote}</p>}
      </>,
    },
    {
      title: '最少要走几步？',
      say: '你先凭感觉猜一猜，从 S 走到 G 最少要几步？',
      mood: guess === null ? 'think' : guess === 1 ? 'happy' : 'wave', ready: guess !== null,
      caption: guess === null ? '数一数格子' : '亮色：最短路线，8 步',
      tile: node => ({ className: guess !== null && onPath(node) && !label(node) ? 'is-astar' : '', content: label(node) }),
      body: <>
        <Choices options={['6 步', '8 步', '10 步']} answer={1} picked={guess} onPick={setGuess} />
        {guess !== null && <p role="status" className={guess === 1 ? 'is-right' : 'is-wrong'}>{guess === 1 ? '猜对了！' : '答案是 8 步。'}如果没有墙，直着走 6 步就到；可中间有墙挡着，从上面绕过去要 8 步，从下面绕要 10 步。</p>}
        {guess !== null && <p className="journey-tip">你<b>一眼</b>就能看出墙在哪、往哪绕。可电脑没有眼睛，它看不到“形状”，只能从 S 出发<b>一格一格地试</b>。问题来了：怎么试才最省事？</p>}
      </>,
    },
    {
      title: '笨办法——一圈一圈地试',
      say: '最老实的办法：先试离 S 一步的格子，再试两步的，再试三步的……像石子扔进水里，水波一圈圈扩开。',
      mood: wave >= trace.bfsLayers.length ? 'think' : 'wave', ready: wave >= trace.bfsLayers.length,
      caption: '数字：离起点几步',
      tile: node => {
        const distance = waveDistance(node);
        return { className: distance >= 0 && !label(node) ? 'is-thought' : '', content: label(node) ?? (distance >= 0 ? distance : null) };
      },
      body: <>
        <button type="button" className="action-primary" disabled={waving} onClick={() => { setWave(0); setWaving(true); }} data-testid="intro-wave">{waving ? '水波扩散中…' : wave > 0 ? '再放一次' : '▶ 放出水波'}</button>
        {wave >= trace.bfsLayers.length && <>
          <p role="status" className="is-right">水波碰到 G 了！这个办法确实能找到最短路线（8 步），但为此试了 <b>{trace.bfs.selectionCount}</b> 个格子，几乎把整张地图都试了一遍。</p>
          <p className="journey-tip">问题在于：它<b>完全不管终点在哪个方向</b>。G 明明在右边，它也老老实实地往左边试。这个办法有个名字叫 <b>BFS（广度优先搜索）</b>，记个名字就行。</p>
        </>}
      </>,
    },
    {
      title: '聪明的办法——每个格子问两个问题',
      say: 'A* 更聪明：每看到一个格子，它都问自己两个问题。我们拿 S 右边那个发光的格子来试试。',
      mood: q1 !== null && q2 !== null ? 'happy' : 'think', ready: q1 !== null && q2 !== null,
      caption: '发光的格子：S 右边那一格',
      tile: node => ({ className: sameNode(node, RIGHT) ? 'is-focus' : '', content: label(node) ?? (sameNode(node, RIGHT) ? '?' : null) }),
      body: <>
        <div className="journey-check">
          <p><b>问题 ①：</b>从 S 走到这个格子，<b>已经走了几步</b>？</p>
          <Choices options={['0 步', '1 步', '2 步']} answer={1} picked={q1} onPick={setQ1} />
          {q1 !== null && <p role="status" className={q1 === 1 ? 'is-right' : 'is-wrong'}>{q1 === 1 ? '对！' : '是 1 步。'}它就在 S 旁边，走一格就到了。</p>}
        </div>
        {q1 !== null && <div className="journey-check">
          <p><b>问题 ②：</b>从这个格子到 G，<b>大概还要几步</b>？<br /><small>估算方法：<b>假装没有墙</b>，横着差几格 + 竖着差几格。</small></p>
          <Choices options={['4 步', '5 步', '7 步']} answer={1} picked={q2} onPick={setQ2} />
          {q2 !== null && <p role="status" className={q2 === 1 ? 'is-right' : 'is-wrong'}>{q2 === 1 ? '对！' : '是 5 步。'}这一格在第 1 列，G 在第 6 列，横着差 6 − 1 = 5 格；它们在同一行，竖着差 0 格。5 + 0 = 5。</p>}
        </div>}
        {q2 !== null && <p className="journey-tip">注意：问题 ① 的答案是<b>真的走过的</b>，很确定；问题 ② 的答案是<b>估计的</b>，因为我们假装没有墙，真实可能更远。</p>}
      </>,
    },
    {
      title: '给这两个答案起名字——g、h、f',
      say: '每次都说“已经走了几步”“大概还要几步”太长了，所以用三个字母当代号。字母本身没特别意思，记住口诀就行！',
      mood: fDone ? 'happy' : 'wave', ready: fDone,
      caption: 'S 右边那格：g = 1，h = 5，f = 6',
      tile: node => ({ className: sameNode(node, RIGHT) ? 'is-focus' : sameNode(node, { x: 0, y: 1 }) && fDone ? 'is-thought' : '', content: label(node) ?? (sameNode(node, RIGHT) ? 6 : null) }),
      body: <>
        <dl className="term-cards">
          <div><dt>g</dt><dd><b>已经走了几步</b><small>口诀：g ≈ “过”，走<b>过</b>的路。刚才问题 ① 的答案：g = 1</small></dd></div>
          <div><dt>h</dt><dd><b>估计还要几步</b><small>口诀：h ≈ “还”，<b>还</b>要走的路。刚才问题 ② 的答案：h = 5</small></dd></div>
          <div><dt>f</dt><dd><b>f = g + h，走完全程大概几步</b><small>口诀：f ≈ “分”，这个格子的<b>总分</b>。1 + 5 = 6</small></dd></div>
        </dl>
        <form className="journey-check" onSubmit={event => { event.preventDefault(); setFResult(Number(fValue) === 8); }}>
          <p><b>轮到你算：</b>S <b>上面</b>那一格，已经走了 1 步（g = 1），估计还要 7 步（h = 7）。它的总分 f 是多少？</p>
          <div className="graph-inputs">
            <label>f =<input inputMode="numeric" value={fValue} disabled={fDone} onChange={event => { setFValue(event.target.value.trim()); setFResult(null); }} data-testid="intro-f" /></label>
            <button type="submit" className="action-primary" disabled={fValue === '' || fDone}>检查</button>
          </div>
          {fResult !== null && <p role="status" className={fResult ? 'is-right' : 'is-wrong'}>{fResult ? '对！f = 1 + 7 = 8。' : '还不对。提示：f = g + h，把 1 和 7 加起来。'}</p>}
        </form>
      </>,
    },
    {
      title: 'A* 的规则——先试总分最小的',
      say: '奶娃刚离开 S，面前有三个格子可以去：上、右、下。A* 会先去哪一个？点地图上带数字的格子，或者点下面的按钮。',
      mood: pick === null ? 'think' : sameNode(pick, firstChoice.selected.node) ? 'happy' : 'oops', ready: pick !== null,
      caption: '格子里的大数字是 f（总分）',
      onPick: node => { if (pick === null && firstChoice.open.some(cell => sameNode(cell.node, node))) setPick(node); },
      tile: node => {
        const cell = firstChoice.open.find(item => sameNode(item.node, node));
        if (!cell) return { content: label(node) };
        const chosen = pick !== null && sameNode(node, firstChoice.selected.node);
        return { className: chosen ? 'is-astar' : pick !== null && sameNode(node, pick) ? 'is-wrong-pick' : 'is-candidate', content: cell.f, label: 'g=' + cell.g + ' h=' + cell.h + ' f=' + cell.f };
      },
      body: <>
        <table className="primer-table"><caption>三个可以去的格子</caption>
          <thead><tr><th scope="col">格子</th><th scope="col">g 已走</th><th scope="col">h 还剩（估）</th><th scope="col">f 总分</th></tr></thead>
          <tbody>{firstChoice.open.map(cell => <tr key={cell.node.x + ',' + cell.node.y} className={pick !== null && sameNode(cell.node, firstChoice.selected.node) ? 'is-chosen' : ''}><th scope="row">S {direction(cell.node)}</th><td>{cell.g}</td><td>{cell.h}</td><td><b>{cell.f}</b></td></tr>)}</tbody>
        </table>
        {pick === null && <div className="chip-row">{firstChoice.open.map(cell => <button key={cell.node.x + ',' + cell.node.y} type="button" className="chip chip--wide" onClick={() => setPick(cell.node)}>先去 S {direction(cell.node)}</button>)}</div>}
        {pick !== null && <>
          <p role="status" className={sameNode(pick, firstChoice.selected.node) ? 'is-right' : 'is-wrong'}>{sameNode(pick, firstChoice.selected.node) ? '答对了！' : 'A* 会先去 S 右边。'}右边的总分 f = 6 最小：走过去只花 1 步，而且离 G 最近。上面、下面的 f 都是 8，说明经过它们整趟要绕远。</p>
          <p className="journey-tip"><b>这就是 A* 的全部规则：</b>手里拿一张“待选清单”，每次挑 <b>f 最小</b>的格子去试；试完把它旁边的格子也算好 g、h、f，放进清单；再挑最小的……一直重复，直到挑到 G。</p>
        </>}
      </>,
    },
    {
      title: '看 A* 自己走完全程',
      say: '按下按钮，看 A* 照着“挑 f 最小”的规则，一格一格地走到 G。格子里的数字是它挑这一格时的 f。',
      mood: walk >= trace.steps.length ? 'happy' : 'wave', ready: walk >= trace.steps.length,
      caption: '数字：A* 挑中这一格时的 f',
      tile: node => {
        const order = trace.steps.slice(0, walk).findIndex(step => sameNode(step.selected.node, node));
        const done = walk >= trace.steps.length && onPath(node);
        return { className: done ? 'is-astar' : order >= 0 ? 'is-mine' : '', content: label(node) ?? (order >= 0 ? trace.steps[order]!.selected.f : null) };
      },
      body: <>
        <button type="button" className="action-primary" disabled={walking} onClick={() => { setWalk(0); setWalking(true); }} data-testid="intro-walk">{walking ? 'A* 正在挑格子…' : walk > 0 ? '再看一次' : '▶ 让 A* 走一遍'}</button>
        {walk >= trace.steps.length && <>
          <dl className="stat-row">
            <div><dt>路线</dt><dd>{trace.astar.pathLength} 步</dd></div>
            <div><dt>A* 试了</dt><dd>{trace.astar.expandedCount} 格</dd></div>
            <div><dt>笨办法试了</dt><dd>{trace.bfs.selectionCount} 格</dd></div>
          </dl>
          <p role="status" className="is-right">一样找到 8 步的最短路线，A* 只试了 {trace.astar.expandedCount} 个格子，笨办法试了 {trace.bfs.selectionCount} 个。</p>
          <p className="journey-tip">你可能注意到：一开始 f 是 6，碰到墙以后变成了 8。因为 h 是“假装没有墙”估出来的，被墙挡住要绕路，整趟就多了 2 步。h 会<b>猜少</b>，但<b>从不猜多</b>，所以 A* 找到的一定是最短路线。</p>
        </>}
      </>,
    },
    {
      title: '学会了！三句话记住 A*',
      say: '恭喜你，已经弄懂 A* 最核心的想法了！忘了 g、h、f 也没关系，顶部随时可以点“g/h/f 是什么？”查一查。',
      mood: 'happy', ready: true,
      caption: 'A* 的最短路线',
      tile: node => ({ className: onPath(node) && !label(node) ? 'is-astar' : '', content: label(node) }),
      body: <>
        <ol className="slide-points">
          <li><b>A* 是找最短路线的方法</b>：给它地图、起点和终点，它算出最短的路。</li>
          <li>它给每个格子打分：<b>g</b> = 已经走了几步，<b>h</b> = 估计还要几步，<b>f = g + h</b> = 总分。</li>
          <li>它每次都<b>先试 f 最小的格子</b>，所以总是朝着终点走，不像笨办法到处乱试。</li>
        </ol>
        <p className="journey-aside">接下来：去“生活里的 A*”看看导航和游戏怎么用它，再用图解、视频和闯关把它练熟。</p>
        <button type="button" className="action-primary" onClick={onFinish} data-testid="intro-finish">去下一站：生活里的 A* →</button>
      </>,
    },
  ];

  const step = steps[index]!;
  return <div className="intro-lesson" data-testid="intro-lesson" ref={top}>
    <ol className="intro-dots" aria-label="认识 A* 的步骤">
      {steps.map((item, order) => <li key={item.title}><button type="button" aria-current={order === index ? 'step' : undefined} aria-label={'第 ' + (order + 1) + ' 页：' + item.title} disabled={order > index && !steps.slice(index, order).every(prior => prior.ready)} onClick={() => setIndex(order)}>{order + 1}</button></li>)}
    </ol>
    <Naiwa key={'say-' + index} lines={[step.say]} mood={step.mood} />
    <article className="journey-card intro-step" data-testid={'intro-step-' + (index + 1)}>
      <div className="intro-map">
        <TileGrid input={input} label={'练习地图：' + (step.caption ?? '')} onPick={step.onPick} tile={step.tile ?? (node => ({ content: label(node) }))} testId="intro-grid" />
        {step.caption && <p className="journey-aside">{step.caption}</p>}
      </div>
      <div className="intro-text">
        <p className="eyebrow">第 {index + 1} / {steps.length} 页</p>
        <h2>{step.title}</h2>
        {step.body}
        <div className="slide-nav">
          <button type="button" className="action-quiet" disabled={index === 0} onClick={() => setIndex(index - 1)}>← 上一页</button>
          {index < steps.length - 1 && <button type="button" className="action-primary" disabled={!step.ready} onClick={() => setIndex(index + 1)} data-testid="intro-next">{step.ready ? '下一页 →' : '先完成上面的小任务'}</button>}
        </div>
      </div>
    </article>
  </div>;
}
