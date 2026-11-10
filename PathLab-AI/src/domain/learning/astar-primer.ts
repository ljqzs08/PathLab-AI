import type { Algorithm, Metrics, Position } from '../../../contracts/types.ts';
import { runAstar } from '../algorithms/astar.ts';
export { manhattanDistance as manhattan } from '../algorithms/astar.ts';
import { runBfs } from '../algorithms/bfs.ts';
import { comparePriority } from '../algorithms/priorityQueue.ts';
import type { SearchInput } from '../grid.ts';

export interface PrimerCell { node: Position; g: number; h: number; f: number; parent: Position | null; entrySequence: number }
export type ChoiceReason = 'only' | 'lowest_f' | 'tie_h' | 'tie_sequence';
export interface PrimerStep {
  /** Open list right before this selection, in the order cells joined it. */
  open: PrimerCell[];
  selected: PrimerCell;
  reason: ChoiceReason;
  /** Cells that were still tied with the winner on the deciding rule's earlier keys. */
  rivals: PrimerCell[];
  added: PrimerCell[];
  updated: PrimerCell[];
  blocked: Position[];
  /** Neighbors skipped because they were already handled or already listed with an equal-or-shorter g. */
  known: Position[];
  closedBefore: Position[];
  isGoal: boolean;
}
export interface PrimerTrace {
  input: SearchInput;
  steps: PrimerStep[];
  path: Position[];
  astar: Metrics;
  bfs: Metrics;
  /** BFS selections grouped by distance from start, up to and including the goal. */
  bfsLayers: Position[][];
}
type Ranked = Pick<PrimerCell, 'node' | 'g' | 'h' | 'f' | 'entrySequence'>;

export const PRIMER_INPUT: SearchInput = {
  grid: { width: 7, height: 5, rows: ['.......', '.......', '...#...', '...#...', '.......'] },
  start: { x: 0, y: 2 },
  goal: { x: 6, y: 2 },
};

const key = ({ x, y }: Position) => x + ',' + y;
export const sameNode = (a: Position, b: Position) => a.x === b.x && a.y === b.y;
export const cellName = ({ x, y }: Position) => '(' + x + ',' + y + ')';

/** Which rule decided the winner among candidates, mirroring comparePriority: f, then h, then entry order. */
export function explainChoice<T extends Ranked>(candidates: readonly T[], chosen: Position): { reason: ChoiceReason; rivals: T[] } {
  const ranked = [...candidates].sort(comparePriority);
  const winner = ranked[0];
  if (!winner || !sameNode(winner.node, chosen)) throw new Error('Chosen cell is not the highest-priority candidate.');
  const others = ranked.slice(1);
  if (others.length === 0) return { reason: 'only', rivals: [] };
  const sameF = others.filter(item => item.f === winner.f);
  if (sameF.length === 0) return { reason: 'lowest_f', rivals: [] };
  const sameH = sameF.filter(item => item.h === winner.h);
  if (sameH.length === 0) return { reason: 'tie_h', rivals: sameF };
  return { reason: 'tie_sequence', rivals: sameH };
}

export function buildPrimerTrace(input: SearchInput = PRIMER_INPUT): PrimerTrace {
  const astar = runAstar(input);
  const known = new Map<string, PrimerCell>();
  const steps: PrimerStep[] = [];
  const closed: Position[] = [];
  let open: PrimerCell[] = [];
  let current: PrimerStep | null = null;
  for (const event of astar.events) {
    if (event.type === 'node_discovered' || event.type === 'node_relaxed') {
      const { node, g, h, f, entrySequence, parent } = event.payload;
      const cell: PrimerCell = { node: { ...node }, g, h, f, entrySequence, parent: parent === null ? null : { ...parent } };
      known.set(key(node), cell);
      open = [...open.filter(item => !sameNode(item.node, node)), cell];
      if (current) (event.type === 'node_discovered' ? current.added : current.updated).push(cell);
    } else if (event.type === 'node_selected') {
      const selected = known.get(key(event.payload.node))!;
      const { reason, rivals } = explainChoice(open, selected.node);
      current = { open, selected, reason, rivals, added: [], updated: [], blocked: [], known: [], closedBefore: [...closed], isGoal: sameNode(selected.node, input.goal) };
      steps.push(current);
      open = open.filter(item => !sameNode(item.node, selected.node));
      if (!current.isGoal) closed.push(selected.node);
    } else if (event.type === 'node_skipped' && current && event.payload.reason === 'blocked') {
      current.blocked.push({ ...event.payload.node });
    } else if (event.type === 'node_skipped' && current && event.payload.reason === 'not_better') {
      current.known.push({ ...event.payload.node });
    }
  }
  const bfs = runBfs(input);
  const bfsLayers: Position[][] = [];
  for (const event of bfs.events) {
    if (event.type !== 'node_selected') continue;
    (bfsLayers[event.payload.g] ??= []).push({ ...event.payload.node });
  }
  return { input, steps, path: astar.path, astar: astar.metrics, bfs: bfs.metrics, bfsLayers };
}

/** Plain-language reason for one A* selection, readable without prior algorithm knowledge. */
export function describeChoice(step: { selected: Ranked; reason: ChoiceReason; rivals: readonly Ranked[] }): string {
  const { selected, reason, rivals } = step;
  const name = cellName(selected.node);
  const single = rivals.length === 1 ? cellName(rivals[0]!.node) : null;
  const tied = single ? name + ' 和 ' + single : rivals.length + 1 + ' 个格子';
  switch (reason) {
    case 'only': return '待选清单里只有 ' + name + '，直接选它。';
    case 'lowest_f': return name + ' 的 f=' + selected.g + '+' + selected.h + '=' + selected.f + '，是清单里最小的，所以选它。';
    case 'tie_h': return '最小的 f 是 ' + selected.f + '，有 ' + tied + ' 平手；再比 h：' + name + ' 的 h=' + selected.h + ' 最小（离终点最近），所以选它。';
    case 'tie_sequence': return tied + ' 的 f、h 完全一样（f=' + selected.f + '，h=' + selected.h + '）；最后比谁先进清单：' + (single ? name + ' 比 ' + single + ' 先加入' : name + ' 在这几个平手格子里最先加入') + '，所以选它。';
  }
}

/** Compares a learner's prediction with the real choice in plain language, for both algorithms. */
export function explainPrediction<T extends Ranked>(algorithm: Algorithm, candidates: readonly T[], selected: Position, actual: Position): string {
  const mine = candidates.find(item => sameNode(item.node, selected));
  const real = candidates.find(item => sameNode(item.node, actual));
  if (!mine || !real) return '';
  const a = cellName(actual), m = cellName(selected);
  if (sameNode(selected, actual)) {
    if (algorithm === 'bfs') return '对：' + a + ' 在队列里排得最靠前（排队号 ' + real.entrySequence + '），先进先出。';
    return '对：' + describeChoice({ selected: real, ...explainChoice(candidates, actual) });
  }
  if (algorithm === 'bfs') return '队列先进先出：' + a + ' 的排队号是 ' + real.entrySequence + '，比你选的 ' + m + '（' + mine.entrySequence + '）更早排进队列，所以先轮到它。BFS 不看离终点多远。';
  if (real.f < mine.f) return '先比 f：' + a + ' 的 f=' + real.g + '+' + real.h + '=' + real.f + '，比你选的 ' + m + ' 的 f=' + mine.g + '+' + mine.h + '=' + mine.f + ' 更小。A* 永远先挑 f 最小的。';
  if (real.h < mine.h) return 'f 平手（都是 ' + real.f + '），再比 h：' + a + ' 的 h=' + real.h + '，比 ' + m + ' 的 h=' + mine.h + ' 更小，离终点更近。';
  return 'f 和 h 都平手，最后比谁先进清单：' + a + ' 的入队序号 ' + real.entrySequence + ' 早于 ' + m + ' 的 ' + mine.entrySequence + '。';
}

export interface PrimerQuestion { id: string; stage: 'rules' | 'final'; prompt: string; options: readonly string[]; answer: number; explanation: string }
export const PRIMER_QUIZ: readonly PrimerQuestion[] = [
  { id: 'q-lowest', stage: 'rules', prompt: '待选清单里有三个格子：A（f=6，h=2）、B（f=6，h=4）、C（f=5，h=5）。A* 下一个选谁？', options: ['A，因为它 h 最小', 'B', 'C，因为它 f 最小', '随便选一个'], answer: 2, explanation: '先只看 f：C 的 f=5 最小，直接选 C。只有 f 平手时才去比 h。' },
  { id: 'q-tie', stage: 'rules', prompt: '如果清单里只剩 A（f=6，h=2）和 B（f=6，h=4），A* 选谁？', options: ['A', 'B', '两个一起选'], answer: 0, explanation: 'f 平手，再比 h：A 的 h=2 更小，说明它离终点更近，所以选 A。' },
  { id: 'q-f', stage: 'final', prompt: '某个格子：从起点走到它已经走了 3 步（g=3），按横竖格数估计离终点还有 4 步（h=4）。它的 f 是多少？', options: ['12', '1', '7', '4'], answer: 2, explanation: 'f = g + h = 3 + 4 = 7，表示“经过这个格子，整趟大约要走 7 步”。' },
  { id: 'q-order', stage: 'final', prompt: 'A* 每一轮做的事，正确的顺序是？', options: ['先走到离终点最近的格子，撞墙了再换方向', '从待选清单挑 f 最小的 → 若是终点就结束 → 否则把它的邻居算好 g/h/f 放进清单', '把所有格子都试一遍，最后挑最短的'], answer: 1, explanation: 'A* 只有一个循环：挑 f 最小 → 是终点就停 → 不是就展开邻居。它不会“撞墙再换方向”，而是清单里谁的 f 最小就去哪。' },
  { id: 'q-tie-final', stage: 'final', prompt: '清单里有 M（g=5，h=3）和 N（g=7，h=1）。A* 下一个选谁？', options: ['M，因为它已走的步数少', 'N，因为 f 都是 8，再比 h，N 的 h=1 更小', '两个都不选'], answer: 1, explanation: '先算 f：M=5+3=8，N=7+1=8，平手；再比 h：N 的 h=1 更小，离终点更近，所以选 N。只看 g 或只看 h 都不对。' },
  { id: 'q-estimate', stage: 'final', prompt: '为什么说 h 只是“估计”？', options: ['它是随机猜的', '它就是已经走过的步数', '它按横竖格数直接数，假装没有墙；真实路线遇到墙会更长'], answer: 2, explanation: 'h = 横向差 + 纵向差，不考虑墙。所以真实剩余步数只会 ≥ h，A* 用它当“乐观的导航预估”。' },
  { id: 'q-compare', stage: 'final', prompt: '同一张地图上，A* 找到的路线和 BFS 相比？', options: ['一样短，但 A* 少试了很多格子', 'A* 的路线更短', 'A* 的路线更长'], answer: 0, explanation: '在这类每步代价都是 1 的网格上，两者都找到最短路线；区别是 A* 借助 h 朝终点方向找，少处理很多无关格子。' },
];
