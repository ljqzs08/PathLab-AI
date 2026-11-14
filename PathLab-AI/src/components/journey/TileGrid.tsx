import type { ReactNode } from 'react';
import type { Position } from '../../../contracts/types';
import type { SearchInput } from '../../domain/grid';
import { sameCell } from '../../domain/game';

export interface Tile { readonly className?: string | undefined; readonly content?: ReactNode; readonly label?: string | undefined }

/** Square map used by the story and game pages; every cell is a real button so touch and keyboard both work. */
export function TileGrid({ input, tile, onPick, label, testId }: { input: SearchInput; tile: (node: Position) => Tile; onPick?: ((node: Position) => void) | undefined; label: string; testId?: string }) {
  const { grid, start, goal } = input;
  return <div className="tile-scroll"><div className="tile-grid" style={{ ['--tile-columns' as string]: grid.width }} role="group" aria-label={label + '，' + grid.width + ' 列 ' + grid.height + ' 行'} data-testid={testId}>
    {grid.rows.flatMap((row, y) => [...row].map((cell, x) => {
      const node = { x, y };
      const kind = sameCell(node, start) ? 'start' : sameCell(node, goal) ? 'goal' : cell === '#' ? 'wall' : 'road';
      const view = tile(node);
      const words = '(' + x + ',' + y + ') ' + ({ start: '起点', goal: '终点', wall: '墙', road: '空地' } as const)[kind] + (view.label ? '，' + view.label : '');
      const className = 'tile tile--' + kind + (view.className ? ' ' + view.className : '');
      return onPick
        ? <button key={x + ',' + y} type="button" className={className} aria-label={words} data-tile={x + ',' + y} onClick={() => onPick(node)}>{view.content}</button>
        : <span key={x + ',' + y} className={className} role="img" aria-label={words} data-tile={x + ',' + y}>{view.content}</span>;
    }))}
  </div></div>;
}
