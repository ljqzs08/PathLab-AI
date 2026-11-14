import { useEffect, useRef, useState } from 'react';

const TERMS = [
  ['A*（读作“A 星”）', '一种找最短路线的方法：给它地图、起点和终点，它算出最短的路。'],
  ['算法', '一套一步一步做事的规则，像菜谱，照着做就能得到结果。'],
  ['S / G', 'S 是起点（Start），G 是终点（Goal）。'],
  ['g', '已经走了几步。口诀：g ≈ “过”，走过的路。它是真实、确定的。'],
  ['h', '估计还要几步。假装没有墙，横着差几格 + 竖着差几格。口诀：h ≈ “还”，还要走的路。'],
  ['f', 'f = g + h，走完全程大概要几步，也就是这个格子的总分。口诀：f ≈ “分”。'],
  ['挑选规则', 'A* 每次先试 f 最小的格子；f 一样，先试 h 小的（离终点更近）；还一样，先试更早放进清单的。'],
  ['待选清单（开放集 / Open List）', 'A* 手里那张“还没试过、但可以去”的格子名单。'],
  ['BFS（广度优先搜索）', '笨办法：像水波一样一圈一圈地试，不管终点在哪个方向。'],
  ['启发式 / 曼哈顿距离', '“启发式”就是 h 这种估计；“曼哈顿距离”是算 h 的方法：横差 + 竖差。'],
] as const;

export function GlossaryButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  return <>
    <button type="button" className="glossary-button" onClick={() => setOpen(true)} data-testid="glossary-open">g/h/f 是什么？</button>
    <dialog ref={dialog} className="glossary-dialog" aria-labelledby="glossary-title" onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <h2 id="glossary-title">名词小词典</h2>
      <dl className="glossary">{TERMS.map(([term, meaning]) => <div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>)}</dl>
      <button type="button" className="action-primary" onClick={() => setOpen(false)}>知道了</button>
    </dialog>
  </>;
}
