import type { DeterministicEvent, EngineEventType, EventPayloadMap, Metrics, Position } from '../../../contracts/types.ts';
import { assertSearchInput, isInBounds, isWalkable, neighborsOf } from '../grid.ts';
import type { SearchInput } from '../grid.ts';
import { comparePriority, PriorityQueue } from './priorityQueue.ts';

type FrontierNode = EventPayloadMap['node_selected'];
type SearchNode = EventPayloadMap['node_discovered'];
type EventInput = { [K in EngineEventType]: { type: K; payload: EventPayloadMap[K] } }[EngineEventType];
export interface AstarResult {
  status: 'found' | 'unreachable';
  path: Position[];
  metrics: Metrics;
  events: DeterministicEvent[];
}
const key = ({ x, y }: Position): string => x + ',' + y;
const copy = ({ x, y }: Position): Position => ({ x, y });
const copyPath = (nodes: Position[]): Position[] => nodes.map(copy);
const candidate = ({ node, g, h, f, entrySequence }: SearchNode): FrontierNode => ({ node: copy(node), g, h, f, entrySequence });
export function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Unit-cost four-neighbor A*. Consistent Manhattan h; no reopening closed nodes. */
export function runAstar(input: SearchInput): AstarResult {
  assertSearchInput(input);
  const { grid, start, goal } = input;
  const events: DeterministicEvent[] = [];
  const heap = new PriorityQueue<SearchNode>();
  const known = new Map<string, SearchNode>();
  const open = new Map<string, SearchNode>();
  const closed = new Set<string>();
  let sequence = 0;
  const emit = (event: EventInput): void => { events.push({ ...event, step: events.length }); };
  const snapshot = (): void => {
    // Sorting is only for explicit evidence snapshots, never for heap selection.
    emit({ type: 'frontier_snapshot', payload: { nodes: [...open.values()].map(candidate).sort(comparePriority) } });
  };
  const enqueue = (node: Position, parent: Position | null, g: number): void => {
    const previous = known.get(key(node));
    const h = manhattanDistance(node, goal);
    const entry: SearchNode = { node: copy(node), parent: parent === null ? null : copy(parent), g, h, f: g + h, entrySequence: sequence++ };
    known.set(key(node), entry);
    open.set(key(node), entry);
    heap.push(entry);
    if (previous === undefined) {
      emit({ type: 'node_discovered', payload: { ...candidate(entry), parent: entry.parent === null ? null : copy(entry.parent) } });
    } else {
      emit({ type: 'node_relaxed', payload: { ...candidate(entry), parent: copy(parent!), previousG: previous.g } });
    }
  };
  const backtrack = (node: Position): Position[] => {
    const nodes: Position[] = [];
    let cursor: Position | null = node;
    while (cursor !== null) { nodes.push(copy(cursor)); cursor = known.get(key(cursor))!.parent; }
    return nodes.reverse();
  };
  const finish = (status: AstarResult['status'], path: Position[]): AstarResult => {
    emit({ type: 'path_updated', payload: { nodes: copyPath(path), final: true } });
    const metrics: Metrics = { discoveredCount: 0, expandedCount: 0, selectionCount: 0, frontierPeak: 0, pathLength: status === 'found' ? path.length - 1 : null };
    for (const event of events) {
      if (event.type === 'node_discovered') metrics.discoveredCount++;
      else if (event.type === 'node_expanded') metrics.expandedCount++;
      else if (event.type === 'node_selected') metrics.selectionCount++;
      else if (event.type === 'frontier_snapshot') metrics.frontierPeak = Math.max(metrics.frontierPeak, event.payload.nodes.length);
    }
    emit({ type: 'run_finished', payload: { status, path: copyPath(path), metrics: { ...metrics } } });
    return { status, path: copyPath(path), metrics, events };
  };

  enqueue(start, null, 0);
  snapshot();
  while (heap.size > 0) {
    const current = heap.pop()!;
    if (open.get(key(current.node)) !== current) {
      emit({ type: 'node_skipped', payload: { node: copy(current.node), reason: 'stale_entry' } });
      continue; // Retired heap entries never enter candidate snapshots or metrics.
    }
    open.delete(key(current.node));
    emit({ type: 'node_selected', payload: candidate(current) });
    snapshot();
    const path = backtrack(current.node);
    if (key(current.node) === key(goal)) return finish('found', path);
    closed.add(key(current.node));
    emit({ type: 'path_updated', payload: { nodes: path, final: false } });
    emit({ type: 'node_expanded', payload: { node: copy(current.node) } });
    for (const node of neighborsOf(current.node)) {
      const previous = known.get(key(node));
      const nextG = current.g + 1;
      let reason: 'out_of_bounds' | 'blocked' | 'not_better' | null = null;
      if (!isInBounds(grid, node)) reason = 'out_of_bounds';
      else if (!isWalkable(grid, node)) reason = 'blocked';
      else if (closed.has(key(node)) || (previous !== undefined && nextG >= previous.g)) reason = 'not_better';
      if (reason !== null) emit({ type: 'node_skipped', payload: { node: copy(node), reason } });
      else enqueue(node, current.node, nextG);
    }
    snapshot();
  }
  return finish('unreachable', []);
}
