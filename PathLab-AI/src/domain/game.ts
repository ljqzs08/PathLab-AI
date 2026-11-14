// Rules for the guided game levels. Every judgement is computed by the site's real A* and BFS engines.
import type { Position } from '../../contracts/types.ts';
import { isWalkable, type SearchInput } from './grid.ts';
import { manhattanDistance, runAstar } from './algorithms/astar.ts';
import { runBfs } from './algorithms/bfs.ts';

export const sameCell = (a: Position, b: Position): boolean => a.x === b.x && a.y === b.y;
export const isAdjacent = (a: Position, b: Position): boolean => manhattanDistance(a, b) === 1;

export interface DrawLevel { readonly id: string; readonly title: string; readonly story: string; readonly input: SearchInput }

const map = (rows: string[], start: Position, goal: Position): SearchInput => ({ grid: { width: rows[0]!.length, height: rows.length, rows }, start, goal });

export const DRAW_LEVELS: readonly DrawLevel[] = [
  { id: 'D1', title: '小区门口', story: '奶娃要把一瓶牛奶送到对面楼。中间只有一堵矮墙。', input: map([
    '.......',
    '...#...',
    '...#...',
    '.......',
    '.......',
  ], { x: 0, y: 2 }, { x: 6, y: 2 }) },
  { id: 'D2', title: '弯弯胡同', story: '胡同里有两道墙，别被“直线最近”骗了。', input: map([
    '........',
    '.####...',
    '....#...',
    '.##.#.#.',
    '..#...#.',
    '..#.###.',
  ], { x: 0, y: 5 }, { x: 7, y: 2 }) },
  { id: 'D3', title: '迷宫超市', story: '收银台就在货架后面，直线只隔 2 格——可惜货架挡着。', input: map([
    '.........',
    '.###.###.',
    '.#.....#.',
    '.#.#.#.#.',
    '...#.#...',
    '.#######.',
    '.........',
  ], { x: 4, y: 6 }, { x: 4, y: 4 }) },
];

export type PathEdit = { readonly ok: true; readonly path: Position[] } | { readonly ok: false; readonly reason: 'wall' | 'not_adjacent' | 'finished' };

/** Clicking extends the route by one neighbour; clicking a cell already on the route rewinds to it. */
export function editPath(input: SearchInput, path: readonly Position[], node: Position): PathEdit {
  const index = path.findIndex(item => sameCell(item, node));
  if (index >= 0) return { ok: true, path: path.slice(0, index + 1) };
  const last = path[path.length - 1]!;
  if (sameCell(last, input.goal)) return { ok: false, reason: 'finished' };
  if (!isWalkable(input.grid, node)) return { ok: false, reason: 'wall' };
  if (!isAdjacent(last, node)) return { ok: false, reason: 'not_adjacent' };
  return { ok: true, path: [...path, node] };
}

export interface PathJudgement { readonly reached: boolean; readonly steps: number; readonly optimal: number; readonly stars: 0 | 1 | 2 | 3; readonly astarExpanded: number; readonly bfsExpanded: number }

export function judgePath(input: SearchInput, path: readonly Position[]): PathJudgement {
  const astar = runAstar(input);
  const bfs = runBfs(input);
  const optimal = astar.metrics.pathLength!;
  const steps = path.length - 1;
  const reached = sameCell(path[path.length - 1]!, input.goal);
  const stars = !reached ? 0 : steps === optimal ? 3 : steps <= optimal + 2 ? 2 : 1;
  return { reached, steps, optimal, stars, astarExpanded: astar.metrics.expandedCount, bfsExpanded: bfs.metrics.expandedCount };
}

export interface QuickCell { readonly name: string; readonly g: number; readonly h: number; readonly order: number }
export type QuickRound =
  | { readonly kind: 'pick'; readonly prompt: string; readonly cells: readonly QuickCell[] }
  | { readonly kind: 'h'; readonly prompt: string; readonly from: Position; readonly goal: Position; readonly options: readonly number[] }
  | { readonly kind: 'f'; readonly prompt: string; readonly g: number; readonly h: number; readonly options: readonly number[] };

export const QUICK_ROUNDS: readonly QuickRound[] = [
  { kind: 'f', prompt: '奶娃已经走了 3 步（g=3），估计还剩 4 步（h=4）。f 是多少？', g: 3, h: 4, options: [7, 1, 12] },
  { kind: 'pick', prompt: '待选清单里有 3 个格子，A* 先挑谁？', cells: [{ name: '甲', g: 2, h: 6, order: 1 }, { name: '乙', g: 1, h: 8, order: 2 }, { name: '丙', g: 4, h: 2, order: 3 }] },
  { kind: 'h', prompt: '格子在 (1,4)，终点在 (5,1)。h（横差 + 竖差）是多少？', from: { x: 1, y: 4 }, goal: { x: 5, y: 1 }, options: [5, 9, 7] },
  { kind: 'pick', prompt: '甲、乙的 f 一样大。A* 挑谁？', cells: [{ name: '甲', g: 5, h: 3, order: 1 }, { name: '乙', g: 3, h: 5, order: 2 }] },
  { kind: 'pick', prompt: '别只看 g！A* 先挑谁？', cells: [{ name: '甲', g: 1, h: 9, order: 1 }, { name: '乙', g: 3, h: 7, order: 2 }, { name: '丙', g: 6, h: 3, order: 3 }] },
  { kind: 'f', prompt: 'g=0、h=6 的起点，f 是多少？', g: 0, h: 6, options: [12, 0, 6] },
  { kind: 'pick', prompt: 'f 和 h 全都打平了，A* 挑谁？', cells: [{ name: '甲', g: 4, h: 4, order: 3 }, { name: '乙', g: 4, h: 4, order: 1 }, { name: '丙', g: 5, h: 4, order: 2 }] },
  { kind: 'h', prompt: '格子就在终点 (6,2) 上。h 是多少？', from: { x: 6, y: 2 }, goal: { x: 6, y: 2 }, options: [0, 1, 8] },
];

export function quickAnswer(round: QuickRound): number {
  if (round.kind === 'pick') {
    const order = [...round.cells].sort((a, b) => a.g + a.h - (b.g + b.h) || a.h - b.h || a.order - b.order);
    return round.cells.indexOf(order[0]!);
  }
  const value = round.kind === 'h' ? manhattanDistance(round.from, round.goal) : round.g + round.h;
  return round.options.indexOf(value);
}

export const DESIGN_BUDGET = 6;
export const DESIGN_STARS = [14, 22, 30] as const;
export const DESIGN_BASE: SearchInput = map([
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
], { x: 0, y: 3 }, { x: 8, y: 3 });

export function applyWalls(base: SearchInput, walls: readonly Position[]): SearchInput {
  const rows = base.grid.rows.map((row, y) => [...row].map((cell, x) => (walls.some(wall => wall.x === x && wall.y === y) ? '#' : cell)).join(''));
  return { ...base, grid: { ...base.grid, rows } };
}

export type WallEdit = { readonly ok: true; readonly walls: Position[] } | { readonly ok: false; readonly reason: 'endpoint' | 'budget' };

export function toggleWall(base: SearchInput, walls: readonly Position[], node: Position): WallEdit {
  if (sameCell(node, base.start) || sameCell(node, base.goal)) return { ok: false, reason: 'endpoint' };
  if (walls.some(wall => sameCell(wall, node))) return { ok: true, walls: walls.filter(wall => !sameCell(wall, node)) };
  if (walls.length >= DESIGN_BUDGET) return { ok: false, reason: 'budget' };
  return { ok: true, walls: [...walls, node] };
}

export interface DesignResult { readonly status: 'found' | 'unreachable'; readonly expanded: number; readonly pathLength: number | null; readonly stars: 0 | 1 | 2 | 3; readonly expandedCells: Position[]; readonly path: Position[] }

export function scoreDesign(base: SearchInput, walls: readonly Position[]): DesignResult {
  const run = runAstar(applyWalls(base, walls));
  const expanded = run.metrics.expandedCount;
  const expandedCells = run.events.filter(event => event.type === 'node_expanded').map(event => event.payload.node);
  const stars = run.status !== 'found' ? 0 : expanded >= DESIGN_STARS[2] ? 3 : expanded >= DESIGN_STARS[1] ? 2 : expanded >= DESIGN_STARS[0] ? 1 : 0;
  return { status: run.status, expanded, pathLength: run.metrics.pathLength, stars, expandedCells, path: run.path };
}

export const TOWN: SearchInput = map([
  '............',
  '.##.###.###.',
  '.##.###.###.',
  '............',
  '.###.##.##..',
  '.###.##.##.#',
  '......#.....',
  '.####...###.',
], { x: 0, y: 0 }, { x: 11, y: 7 });

export interface WalkResult { readonly path: Position[]; readonly astarCells: Position[]; readonly bfsExpanded: number; readonly astarExpanded: number }

/** Click-to-move: plan from where the character stands to the clicked road cell. */
export function planWalk(town: SearchInput, from: Position, to: Position): WalkResult | null {
  if (!isWalkable(town.grid, to)) return null;
  const input = { grid: town.grid, start: from, goal: to };
  const astar = runAstar(input);
  if (astar.status !== 'found') return null;
  const bfs = runBfs(input);
  const astarCells = astar.events.filter(event => event.type === 'node_expanded').map(event => event.payload.node);
  return { path: astar.path, astarCells, bfsExpanded: bfs.metrics.expandedCount, astarExpanded: astar.metrics.expandedCount };
}
