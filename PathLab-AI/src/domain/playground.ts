import type { Position } from '../../contracts/types.ts';
import { runBfs } from './algorithms/bfs.ts';
import { runAstar } from './algorithms/astar.ts';
import { assertSearchInput, isInBounds, type SearchInput } from './grid.ts';

export type PlaygroundPreset = 'open' | 'detour' | 'fork';
export type PaintTool = 'wall' | 'erase' | 'start' | 'goal';
export type ExpansionGuess = 'bfs' | 'astar' | 'tie';
const same = (a: Position, b: Position) => a.x === b.x && a.y === b.y;

/** A separate practice space; never changes fixed missions or their progress schema. */
export function createPlayground(preset: PlaygroundPreset): SearchInput {
  const rows = preset === 'detour'
    ? ['....#....', '....#....', '....#....', '....#....', '....#....', '....#....', '.........']
    : preset === 'fork'
      ? ['.........', '.###.###.', '...#.....', '.#.#.###.', '.#.......', '.#####.#.', '.........']
      : Array<string>(7).fill('.........');
  return { grid: { width: 9, height: 7, rows }, start: { x: 0, y: 0 }, goal: { x: 8, y: preset === 'detour' ? 0 : 6 } };
}

export function editPlayground(input: SearchInput, tool: PaintTool, node: Position): SearchInput {
  assertSearchInput(input);
  if (!isInBounds(input.grid, node)) throw new Error('编辑坐标必须位于地图内。');
  if (tool === 'wall' && (same(node, input.start) || same(node, input.goal))) return input;
  if ((tool === 'start' || tool === 'goal') && (same(node, input.start) || same(node, input.goal))) return input;
  const value = tool === 'wall' ? '#' : '.';
  if ((tool === 'wall' || tool === 'erase') && input.grid.rows[node.y]![node.x] === value) return input;
  const rows = [...input.grid.rows];
  rows[node.y] = rows[node.y]!.slice(0, node.x) + value + rows[node.y]!.slice(node.x + 1);
  return { grid: { ...input.grid, rows }, start: tool === 'start' ? { ...node } : { ...input.start }, goal: tool === 'goal' ? { ...node } : { ...input.goal } };
}

export function comparePlayground(input: SearchInput) {
  const bfs = runBfs(input), astar = runAstar(input);
  const fewerExpanded: ExpansionGuess = bfs.metrics.expandedCount === astar.metrics.expandedCount ? 'tie'
    : bfs.metrics.expandedCount < astar.metrics.expandedCount ? 'bfs' : 'astar';
  return { bfs, astar, fewerExpanded };
}
