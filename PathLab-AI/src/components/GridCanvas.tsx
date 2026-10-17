import { useEffect, useRef, type CSSProperties } from 'react';
import type { Position } from '../../contracts/types';
import type { LearningView } from '../domain/learning/session';

const key = (node: {x: number; y: number}) => node.x + ',' + node.y;

export function GridCanvas({ view, title, inspected, onInspect, selectedPrediction, onSelectPrediction }: { view: LearningView; title: string; inspected: string | null; onInspect: (key: string) => void; selectedPrediction: Position | null; onSelectPrediction: (node: Position) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { grid, start, goal } = view.input;
  const discovered = new Set(view.nodes.map(n => key(n.node)));
  const expanded = new Set(view.expanded.map(key));
  const frontier = new Set(view.frontier.map(n => key(n.node)));
  const path = new Set(view.path.map(key));
  const candidates = new Set(view.checkpoint?.candidates.map(candidate => key(candidate.node)) ?? []);

  useEffect(() => {
    const canvas = canvasRef.current, element = gridRef.current;
    if (!canvas || !element) return;
    const context = canvas.getContext('2d');
    if (!context) return; // The DOM map and all controls remain usable without Canvas.
    const draw = () => {
      const width = element.clientWidth, height = element.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
      const cell = (width - gap * (grid.width - 1)) / grid.width;
      const center = (node: {x: number; y: number}) => ({x: node.x * (cell + gap) + cell / 2, y: node.y * (cell + gap) + cell / 2});
      if (view.path.length > 1) {
        context.beginPath();
        view.path.forEach((node, index) => { const point = center(node); if (index === 0) context.moveTo(point.x, point.y); else context.lineTo(point.x, point.y); });
        context.strokeStyle = view.pathFinal ? '#85e3cd' : '#94b9ed';
        context.lineWidth = Math.max(2, cell * 0.09); context.lineJoin = 'round';
        context.setLineDash(view.pathFinal ? [] : [4, 4]); context.stroke(); context.setLineDash([]);
      }
      for (const node of view.frontier) {
        const point = center(node.node);
        context.beginPath(); context.arc(point.x, point.y, Math.max(4, cell * 0.25), 0, Math.PI * 2);
        context.strokeStyle = '#85e3cd'; context.lineWidth = 1.5; context.stroke();
      }
      if (view.current) {
        const point = center(view.current.node);
        context.strokeStyle = '#ffb783'; context.lineWidth = 2;
        context.strokeRect(point.x - cell * .37, point.y - cell * .37, cell * .74, cell * .74);
      }
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    window.addEventListener('resize', draw);
    return () => { observer.disconnect(); window.removeEventListener('resize', draw); };
  }, [view, grid.width]);

  return (
    <figure className="map-figure">
      <div className="map-surface">
        <span className="map-axis" aria-hidden="true">N ↑ · 校园路网</span>
        <div ref={gridRef} className="map-grid learning-map" role="group" aria-label={title + '的地图，' + grid.width + '列' + grid.height + '行。起点坐标（' + start.x + '，' + start.y + '），终点坐标（' + goal.x + '，' + goal.y + '）。坐标从零开始；仅包含已揭示的搜索事实。'} style={{ '--grid-columns': grid.width } as CSSProperties} data-testid="map-grid" data-level-id={view.levelId} onKeyDown={event => {
          const target = event.target as HTMLButtonElement;
          if (!target.dataset.cell || !['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(event.key)) return;
          event.preventDefault();
          const [x, y] = target.dataset.cell.split(',').map(Number) as [number, number];
          const next = { x: Math.max(0, Math.min(grid.width - 1, x + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0))), y: Math.max(0, Math.min(grid.height - 1, y + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0))) };
          onInspect(key(next));
          gridRef.current?.querySelector<HTMLButtonElement>('[data-cell="' + key(next) + '"]')?.focus({ preventScroll: true });
        }}>
          <canvas ref={canvasRef} className="search-canvas" aria-hidden="true" data-testid="search-canvas" />
          {grid.rows.flatMap((row, y) => [...row].map((cell, x) => {
            const id = x + ',' + y;
            const kind = id === key(start) ? 'start' : id === key(goal) ? 'goal' : cell === '#' ? 'wall' : 'road';
            const state = id === (view.current && key(view.current.node)) ? '当前选中' : frontier.has(id) ? '有效前沿' : expanded.has(id) ? '已扩展' : discovered.has(id) ? '已发现' : '未发现';
            const isCandidate = candidates.has(id);
            const isDraft = selectedPrediction !== null && key(selectedPrediction) === id;
            const name = { start: '起点', goal: '终点', wall: '障碍', road: '可通行' }[kind];
            return <button key={id} type="button" className={'map-cell map-cell--' + kind + (view.current && key(view.current.node) === id ? ' map-cell--current' : '')} aria-label={'查看坐标 (' + x + ', ' + y + ')，' + name + '，' + state + (isCandidate ? '，预测候选，点击可选择' : '') + (isDraft ? '，待提交的预测' : '')} tabIndex={(inspected ?? key(start)) === id ? 0 : -1} aria-pressed={inspected === id} data-prediction-candidate={isCandidate} data-prediction-selected={isDraft} data-cell={id} data-kind={kind} data-search={state} data-on-path={path.has(id)} onClick={() => { onInspect(id); if (isCandidate) onSelectPrediction({ x, y }); }}>
              <span aria-hidden="true">{kind === 'start' ? 'S' : kind === 'goal' ? 'G' : cell === '#' ? '−' : expanded.has(id) ? '×' : discovered.has(id) ? '·' : ''}</span>
            </button>;
          }))}
        </div>
        <span className="map-origin" aria-hidden="true">地图修订 {view.gridRevision} / {grid.width} × {grid.height}</span>
      </div>
      <figcaption>
        <span><i className="legend-swatch legend-swatch--start" aria-hidden="true" />S 起点</span><span><i className="legend-swatch legend-swatch--goal" aria-hidden="true" />G 终点</span><span><i className="legend-swatch legend-swatch--wall" aria-hidden="true" />− 障碍</span>
        <span>◇ 预测候选（可点选）</span><span>○ 前沿</span><span>× 已扩展</span><span>虚线：当前回溯前缀</span><span>实线：已揭示最终路径</span>
      </figcaption>
    </figure>
  );
}
