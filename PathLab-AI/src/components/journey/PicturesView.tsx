import { useEffect, useRef, useState, type ReactNode } from 'react';
import { mediaUrl, type MediaName } from '../../media';
import { Naiwa, Picture } from '../Naiwa';

interface Slide {
  readonly id: string; readonly title: string; readonly image: MediaName; readonly alt: string;
  readonly points: readonly ReactNode[]; readonly question: string; readonly options: readonly string[]; readonly answer: number; readonly explain: ReactNode;
  readonly careful?: ReactNode;
}

const SLIDES: readonly Slide[] = [
  {
    id: 'io', title: '输入和输出是什么', image: 'astar-io.jpg',
    alt: '信息图：A* 的输入是栅格地图、起点、终点、移动代价和邻接方式；输出是一条路径坐标序列，不可达时返回失败',
    points: [
      <>喂给 A* 的<b>输入</b>：一张格子地图（哪里能走、哪里是墙）、起点 S、终点 G、每走一步花多少（代价）、能往哪几个方向走。</>,
      <><b>4 邻域</b>只能上下左右走，每步代价 1；<b>8 邻域</b>还能斜着走，斜走一步约 1.41（√2），因为对角线比边长。</>,
      <>A* 吐出来的<b>输出</b>：一串相邻格子的坐标，就是路线；如果被墙完全堵死，就老实回答“无可行路径”。</>,
    ],
    question: '下面哪一个“不是” A* 的输入？', options: ['起点和终点', '哪些格子是墙', '最终的路线'], answer: 2,
    explain: <>最终路线是 A* 算出来的<b>输出</b>。一句话：<b>输入是地图与目标，输出是一条可走的路径</b>。</>,
    careful: <>输出里的 (1,1)→(1,2)→… 只是示意写法，省略号省掉了中间的格子；记住“输出是一串首尾相连的相邻格子”就够了。</>,
  },
  {
    id: 'principle', title: '算法基本原理', image: 'astar-principle.jpg',
    alt: '信息图：A* 每次优先扩展总代价 f 最小的候选节点，f 等于 g 加 h；示意图展示地图与任务、开放集候选节点、回溯得到最终路径三步',
    points: [
      <>A* 手里有一张<b>候选清单</b>（图里叫“开放集”）。每一轮只做一件事：挑 <b>f 最小</b>的格子往前走。</>,
      <>f = g + h：<b>既看已经走了多远，也看离目标还有多远</b>。只看 g 会到处乱试，只看 h 容易一头撞进死胡同。</>,
      <>挑到终点就停下，顺着每个格子记下的“我从哪来”倒着走回起点，就得到完整路线（回溯）。</>,
    ],
    question: '看图中第 2 步：机器人四周的候选格子 f 分别是 10、7、12、9。它下一步先扩展哪个？', options: ['上（f=10）', '左（f=7）', '右（f=12）', '下（f=9）'], answer: 1,
    explain: <>f 越小越优先，所以先扩展 <b>f=7</b> 的左边格子。注意：先扩展不等于马上“走过去”，A* 是在脑子里试，最后才定路线。</>,
  },
  {
    id: 'formula', title: '核心公式解读', image: 'astar-formula.jpg',
    alt: '信息图：f(n)=g(n)+h(n)，g 管过去，h 看未来；常用启发式为曼哈顿距离 h(n)=|x−xg|+|y−yg|，适合四邻域栅格',
    points: [
      <><b>g(n)</b>：从起点走到格子 n 实际花了多少，像打车表上已经跳的里程。</>,
      <><b>h(n)</b>：从 n 到终点的<b>估计</b>。四邻域地图常用<b>曼哈顿距离</b>：横着差几格 + 竖着差几格，假装没有墙。</>,
      <>口诀：<b>g 管过去，h 看未来</b>。h 只要“不高估”真实距离，A* 找到的就一定是最短路线。</>,
    ],
    question: '格子 n 在 (2,3)，终点在 (5,1)。曼哈顿距离 h(n) 是多少？', options: ['3', '5', '7'], answer: 1,
    explain: <>横向差 |2−5| = 3，纵向差 |3−1| = 2，加起来 h = <b>5</b>。</>,
    careful: <>两处容易混淆：① 图里终点写成 g(x<sub>g</sub>, y<sub>g</sub>)，这个小写 g 是 goal（终点）的缩写，和 g(n)“已走代价”不是一回事；② 示意折线里有斜着走的线段，但曼哈顿距离只适合上下左右四方向。允许斜走时，常改用对角距离或直线距离作 h。</>,
  },
  {
    id: 'scenes', title: '应用场景', image: 'astar-scenes.jpg',
    alt: '信息图：A* 应用于仓储 AGV、扫地机器人、室内配送机器人、游戏网格寻路和无人机巡检全局路径规划；共同点是在已知地图上找到低代价可行路线',
    points: [
      <>仓库搬运车、送餐机器人、游戏角色、巡检无人机……都要在<b>已知地图</b>上从 A 走到 B。</>,
      <>地图不必是方格：图 5 的无人机用的是多边形障碍，先把空间切成格子或“路线图”，A* 照样能用。</>,
      <>路上突然出现的行人属于<b>动态障碍</b>，一般要 A* 负责全局路线 + 局部避障负责临时躲闪，配合使用。</>,
    ],
    question: '突然有只小猫跑到送餐机器人面前，最合理的做法是？', options: ['A* 什么都不用管', '局部避障先躲开，必要时让 A* 重新规划', '原地关机'], answer: 1,
    explain: <>A* 擅长“地图已知时的全局路线”。遇到临时障碍，局部避障先处理，地图变化大时再让 A* <b>重新规划</b>。</>,
  },
];

const INTRO = [
  <>这一站有 4 张图，一张讲一件事。每张图都可以<b>点击放大</b>慢慢看。</>,
  <>看完右边我划的重点，再答一道小题；答完就能翻到下一张。</>,
  <>有的图里藏着容易看错的地方，我用黄色便签标出来了。</>,
];

export function PicturesView() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const top = useRef<HTMLOListElement>(null);
  const turned = useRef(false);
  useEffect(() => {
    if (!turned.current) { turned.current = true; return; }
    if (top.current && top.current.getBoundingClientRect().top < 0) top.current.scrollIntoView({ block: 'start' });
  }, [index]);
  const slide = SLIDES[index]!;
  const picked = answers[slide.id];
  return <>
    <Naiwa lines={INTRO} />
    <ol className="slide-tabs" aria-label="图解目录" ref={top}>
      {SLIDES.map((item, order) => <li key={item.id}>
        <button type="button" aria-current={order === index ? 'step' : undefined} onClick={() => setIndex(order)}>
          <span>{answers[item.id] === item.answer ? '✓' : order + 1}</span>{item.title}
        </button>
      </li>)}
    </ol>
    <article className="journey-card slide" data-testid={'slide-' + slide.id}>
      <div className="slide-media"><Picture src={mediaUrl(slide.image)} alt={slide.alt} caption={'图 ' + (index + 1) + ' / ' + SLIDES.length + '：' + slide.title + '（点击放大）'} /></div>
      <div className="slide-text">
        <h3>{index + 1}. {slide.title}</h3>
        <p className="slide-label">奶娃划重点</p>
        <ul className="slide-points">{slide.points.map((point, order) => <li key={order}>{point}</li>)}</ul>
        {slide.careful && <p className="sticky-note"><b>容易看错：</b>{slide.careful}</p>}
        <div className="journey-check">
          <p><b>看懂了吗？</b>{slide.question}</p>
          <div className="choice-list">{slide.options.map((option, order) => <button key={option} type="button" className={'choice' + (picked === undefined ? '' : order === slide.answer ? ' is-right' : order === picked ? ' is-wrong' : '')} disabled={picked !== undefined} onClick={() => setAnswers(current => ({ ...current, [slide.id]: order }))}>{option}</button>)}</div>
          {picked !== undefined && <p role="status" className="journey-tip"><b>{picked === slide.answer ? '答对了！' : '正确答案是“' + slide.options[slide.answer] + '”。'}</b>{slide.explain}</p>}
          {picked !== undefined && picked !== slide.answer && <button type="button" className="action-quiet" onClick={() => setAnswers(current => { const next = { ...current }; delete next[slide.id]; return next; })}>再答一次</button>}
        </div>
        <div className="slide-nav">
          <button type="button" className="action-quiet" disabled={index === 0} onClick={() => setIndex(index - 1)}>← 上一张</button>
          <button type="button" className="action-primary" disabled={index === SLIDES.length - 1 || picked === undefined} onClick={() => setIndex(index + 1)} data-testid="slide-next">{picked === undefined ? '先答题再翻页' : '下一张 →'}</button>
        </div>
      </div>
    </article>
  </>;
}
