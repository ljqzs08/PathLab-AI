import type { DeterministicEvent, EngineEventType, EventPayloadMap, Metrics, Position } from '../../../contracts/types.ts';
import { assertSearchInput, isInBounds, isWalkable, neighborsOf } from '../grid.ts';
import type { SearchInput } from '../grid.ts';

type FrontierNode = EventPayloadMap['node_selected'];
type DiscoveredNode = EventPayloadMap['node_discovered'];
type EventInput = { [K in EngineEventType]: { type: K; payload: EventPayloadMap[K] } }[EngineEventType];
export interface BfsResult {
  status: 'found' | 'unreachable';
  path: Position[];
  metrics: Metrics;
  events: DeterministicEvent[];
}
const key = ({ x, y }: Position): string => x + ',' + y;
const copy = ({ x, y }: Position): Position => ({ x, y });
const copyPath = (path: Position[]): Position[] => path.map(copy);
function candidate({ node, g, h, f, entrySequence }: DiscoveredNode): FrontierNode {
  return { node: copy(node), g, h, f, entrySequence };
}

/** Pure, bounded, deterministic BFS. No clock, random value, I/O or UI state. */
export function runBfs(input: SearchInput): BfsResult {
  assertSearchInput(input);
  const { grid, start, goal } = input;
  const events: DeterministicEvent[] = [];
  const queue: DiscoveredNode[] = [];
  const discovered = new Map<string, DiscoveredNode>();
  let head = 0;

  const emit = (event: EventInput): void => {
    events.push({ ...event, step: events.length });
  };
  const snapshot = (): void => {
    emit({ type: 'frontier_snapshot', payload: { nodes: queue.slice(head).map(candidate) } });
  };
  const discover = (node: Position, parent: Position | null, g: number): void => {
    const entry: DiscoveredNode = {
      node: copy(node), parent: parent === null ? null : copy(parent),
      g, h: 0, f: g, entrySequence: discovered.size,
    };
    discovered.set(key(node), entry); // Mark on enqueue, never on selection.
    queue.push(entry);
    emit({ type: 'node_discovered', payload: { ...candidate(entry), parent: entry.parent === null ? null : copy(entry.parent) } });
  };
  const backtrack = (node: Position): Position[] => {
    const path: Position[] = [];
    let cursor: Position | null = node;
    while (cursor !== null) {
      path.push(copy(cursor));
      // Every parent was discovered one layer earlier; cycles are impossible.
      cursor = discovered.get(key(cursor))!.parent;
    }
    return path.reverse();
  };
  const finish = (status: BfsResult['status'], path: Position[]): BfsResult => {
    emit({ type: 'path_updated', payload: { nodes: copyPath(path), final: true } });
    // Metrics are reconciled from the emitted facts, not independently kept by UI.
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

  discover(start, null, 0);
  snapshot();
  while (head < queue.length) {
    const current = queue[head++]!; // Head index avoids shifting/copying the queue.
    emit({ type: 'node_selected', payload: candidate(current) });
    snapshot();
    const path = backtrack(current.node);
    if (key(current.node) === key(goal)) return finish('found', path);
    emit({ type: 'path_updated', payload: { nodes: path, final: false } });
    emit({ type: 'node_expanded', payload: { node: copy(current.node) } });
    for (const node of neighborsOf(current.node)) {
      let reason: 'out_of_bounds' | 'blocked' | 'already_discovered' | null = null;
      if (!isInBounds(grid, node)) reason = 'out_of_bounds';
      else if (!isWalkable(grid, node)) reason = 'blocked';
      else if (discovered.has(key(node))) reason = 'already_discovered';
      if (reason !== null) emit({ type: 'node_skipped', payload: { node, reason } });
      else discover(node, current.node, current.g + 1);
    }
    snapshot();
  }
  return finish('unreachable', []);
}
