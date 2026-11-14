import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { mediaUrl } from '../../media';

/** Hints go from a gentle nudge to the concrete method, so a stuck learner is never just told the answer first. */
const HINTS: Record<string, readonly string[]> = {
  home: [
    '不知道从哪开始？点左边“第一次学？从零开始认识 A*”，我一页一页带你学。',
    'A* 是一种帮电脑找最短路线的方法。g、h、f 看不懂没关系，第 1 站会讲清楚。',
    '顶部黄色虚线按钮“g/h/f 是什么？”随时可以查名词。',
  ],
  intro: [
    '每页先看左边的地图，再读右边的文字。做完小任务，“下一页”按钮才会亮。',
    '找 S 和 G：S 是绿色格子（起点），G 是棕红色格子（终点），斜纹格子是墙。',
    '算 h（估计还要几步）：假装没有墙，横着差几格 + 竖着差几格。比如从第 1 列到第 6 列，横着差 5 格。',
    'f 就是 g + h，把“已经走了几步”和“估计还要几步”加起来。',
    'A* 只有一条规则：先试 f（总分）最小的格子。',
  ],
  life: [
    '导航配对：已经开过的路是 g，还剩下的路是 h，加起来的全程是 f。',
    '小镇里点浅色的空地，我就会自己走过去；深色斜纹是房子，进不去。',
    '勾上“显示 A* 考虑过的格子”，就能看到 A* 动过脑筋的地方。',
  ],
  pictures: [
    '每张图都能点开放大，慢慢看。',
    '先读右边“奶娃划重点”，再答题；答完，“下一张”才会亮。',
    '算曼哈顿距离：横坐标相减 + 纵坐标相减，两个差都取正数。比如 (2,3) 到 (5,1)：3 + 2 = 5。',
    '图里的“开放集”就是“待选清单”：还没试过、但可以去的格子。',
  ],
  video: [
    '视频右边的章节可以点，直接跳到想看的地方。',
    '填表时：新发现的点，g = 上一个点的 g + 连线上的数字。',
    'h 是圆圈右上角的蓝色小数字；f = g + h。',
    '挑点：在待选清单里找 f 最小的那个。',
  ],
  primer: [
    '前测不会就先猜，它只用来和学完后的成绩对比。',
    '预测 A* 挑哪格：先比 f；f 一样比 h；还一样就挑更早进清单的。',
    '卡住了可以回到“认识 A*”那一站复习。',
  ],
  game: [
    '画路线：从 S 开始，一格一格点相邻的空地。点路线上已有的格子可以退回去。',
    '想拿 3 星，要走得和 A* 一样短：别被墙骗了，先想好从哪边绕。',
    '快问快答：f = g + h；先比 f，f 一样比 h，再一样比谁先进清单。',
    '迷宫设计：把墙摆成正对终点的“口袋”，A* 会被骗去多试很多格子。',
  ],
  lab: [
    '先在左边选一个关卡，再点“开始预测”。',
    '预测时看每张候选卡片上的 f，挑最小的；f 一样比 h。',
    '做完一关可以写复盘报告，进度只存在这台电脑上。',
  ],
  playground: [
    '先选画笔，再点格子画墙，或者移动起点、终点。',
    '先猜 BFS 和 A* 谁试的格子少，再点按钮看真实结果。',
  ],
};

const SIZE = 72;

export function NaiwaPet({ station }: { station: string }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<Record<string, number>>({});
  const [offset, setOffset] = useState({ right: 18, bottom: 18 });
  const [hop, setHop] = useState(0);
  const drag = useRef<{ x: number; y: number; right: number; bottom: number; moved: boolean } | null>(null);
  const hints = HINTS[station] ?? HINTS.home!;
  const shown = Math.min(seen[station] ?? 0, hints.length - 1);

  const onDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    drag.current = { x: event.clientX, y: event.clientY, right: offset.right, bottom: offset.bottom, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (!start.moved && Math.hypot(dx, dy) < 6) return;
    start.moved = true;
    setOffset({
      right: Math.min(Math.max(4, start.right - dx), window.innerWidth - SIZE - 4),
      bottom: Math.min(Math.max(4, start.bottom - dy), window.innerHeight - SIZE - 4),
    });
  };
  const onUp = () => { window.setTimeout(() => { drag.current = null; }, 0); };
  const toggle = () => {
    if (drag.current?.moved) return;
    setOpen(!open);
    setHop(hop + 1);
  };
  const leftSide = typeof window !== 'undefined' && offset.right > window.innerWidth / 2;

  return <div className={'naiwa-pet' + (leftSide ? ' is-left' : '') + (offset.bottom > 240 ? ' is-high' : '')} style={{ right: offset.right, bottom: offset.bottom }} data-testid="naiwa-pet">
    {open && <div className="naiwa-pet-bubble" role="region" aria-label="奶娃的提示" data-testid="naiwa-pet-bubble">
      <div className="naiwa-pet-head"><b>奶娃小助手</b><span>提示 {shown + 1} / {hints.length}</span><button type="button" className="naiwa-pet-close" aria-label="收起提示" onClick={() => setOpen(false)}>×</button></div>
      <p aria-live="polite">{hints[shown]}</p>
      <div className="naiwa-pet-actions">
        {shown < hints.length - 1
          ? <button type="button" className="naiwa-next" onClick={() => { setSeen({ ...seen, [station]: shown + 1 }); setHop(hop + 1); }} data-testid="naiwa-pet-more">再给我一个提示</button>
          : <button type="button" className="naiwa-next" onClick={() => setSeen({ ...seen, [station]: 0 })}>从头再看</button>}
        <button type="button" className="naiwa-next" onClick={() => document.querySelector<HTMLButtonElement>('[data-testid="glossary-open"]')?.click()}>查名词小词典</button>
      </div>
    </div>}
    <button type="button" className="naiwa-pet-avatar" aria-expanded={open} aria-label={open ? '奶娃小助手：点我收起提示，按住可以拖动' : '点我提示：奶娃小助手，不会的时候点它，按住可以拖动'}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onClick={toggle} data-testid="naiwa-pet-button">
      {/* eslint-disable-next-line @next/next/no-img-element -- the single-file build embeds media as data URLs */}
      <img key={hop} src={mediaUrl('naiwa.webp')} alt="" draggable={false} className={hop > 0 ? 'is-hop' : ''} />
      {!open && <span className="naiwa-pet-tag" aria-hidden="true">点我提示</span>}
    </button>
  </div>;
}
