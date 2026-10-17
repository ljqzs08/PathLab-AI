import test from 'node:test';
import assert from 'node:assert/strict';
import { runBfs } from '../src/domain/algorithms/bfs.ts';
import { GridInputError } from '../src/domain/grid.ts';
import { assertBfsTrace, clone, deepFreeze } from './helpers/search-checks.mjs';

const inputFor = (rows, start, goal) => ({ grid: { width: rows[0].length, height: rows.length, rows }, start, goal });
const candidate = (node, g, entrySequence) => ({ node, g, h: 0, f: g, entrySequence });
test('pinned tiny BFS trace freezes event order costs sequence and terminal statistics', () => {
  const start = { x: 0, y: 0 }, goal = { x: 1, y: 0 };
  const metrics = { discoveredCount: 2, expandedCount: 1, selectionCount: 2, frontierPeak: 1, pathLength: 1 };
  const expected = [
    ['node_discovered', { ...candidate(start, 0, 0), parent: null }],
    ['frontier_snapshot', { nodes: [candidate(start, 0, 0)] }],
    ['node_selected', candidate(start, 0, 0)],
    ['frontier_snapshot', { nodes: [] }],
    ['path_updated', { nodes: [start], final: false }],
    ['node_expanded', { node: start }],
    ['node_skipped', { node: { x: 0, y: -1 }, reason: 'out_of_bounds' }],
    ['node_discovered', { ...candidate(goal, 1, 1), parent: start }],
    ['node_skipped', { node: { x: 0, y: 1 }, reason: 'out_of_bounds' }],
    ['node_skipped', { node: { x: -1, y: 0 }, reason: 'out_of_bounds' }],
    ['frontier_snapshot', { nodes: [candidate(goal, 1, 1)] }],
    ['node_selected', candidate(goal, 1, 1)],
    ['frontier_snapshot', { nodes: [] }],
    ['path_updated', { nodes: [start, goal], final: true }],
    ['run_finished', { status: 'found', path: [start, goal], metrics }],
  ].map(([type, payload], step) => ({ step, type, payload }));
  const input = inputFor(['..'], start, goal);
  const result = runBfs(input);
  assert.deepEqual(result, { status: 'found', path: [start, goal], metrics, events: expected });
  assertBfsTrace(input, result);
});
test('FIFO wins over goal proximity and finding a goal does not stop on enqueue', () => {
  const input = inputFor(['...', '...', '...'], { x: 1, y: 1 }, { x: 2, y: 1 });
  const result = runBfs(input);
  assert.deepEqual(result.events.filter(e => e.type === 'node_selected').map(e => e.payload.node), [{ x: 1, y: 1 }, { x: 1, y: 0 }, { x: 2, y: 1 }]);
  assert.equal(result.metrics.pathLength, 1);
  assert.equal(result.metrics.selectionCount, 3);
  assert(result.metrics.discoveredCount > result.metrics.selectionCount);
  assertBfsTrace(input, result);
});
test('same-length paths use up right down left with first parent retained', () => {
  const input = inputFor(['...', '...', '...'], { x: 1, y: 1 }, { x: 2, y: 0 });
  const result = runBfs(input);
  assert.deepEqual(result.path, [{ x: 1, y: 1 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
  assertBfsTrace(input, result);
});
test('start equals goal selects once and never expands, with zero path length', () => {
  const input = inputFor(['.'], { x: 0, y: 0 }, { x: 0, y: 0 });
  const result = runBfs(input);
  assert.deepEqual(result.metrics, { discoveredCount: 1, expandedCount: 0, selectionCount: 1, frontierPeak: 1, pathLength: 0 });
  assert.deepEqual(result.events.map(e => e.type), ['node_discovered', 'frontier_snapshot', 'node_selected', 'frontier_snapshot', 'path_updated', 'run_finished']);
  assertBfsTrace(input, result);
});
test('unreachable is a valid run with empty path null length and an empty final frontier', () => {
  const input = inputFor(['.##', '###', '##.'], { x: 0, y: 0 }, { x: 2, y: 2 });
  const result = runBfs(input);
  assert.deepEqual(result.metrics, { discoveredCount: 1, expandedCount: 1, selectionCount: 1, frontierPeak: 1, pathLength: null });
  assert.deepEqual(result.events.filter(e => e.type === 'frontier_snapshot').at(-1).payload.nodes, []);
  assertBfsTrace(input, result);
});
test('cycles never enqueue discover select or expand a node twice', () => {
  const input = inputFor(['....', '.##.', '....', '....'], { x: 0, y: 0 }, { x: 3, y: 3 });
  const result = runBfs(input);
  assert(result.events.some(e => e.type === 'node_skipped' && e.payload.reason === 'already_discovered'));
  assertBfsTrace(input, result);
});
test('BFS rejects invalid input instead of returning unreachable', () => {
  for (const input of [null, inputFor(['#..', '...', '...'], { x: 0, y: 0 }, { x: 2, y: 2 }), inputFor(['...'], { x: -1, y: 0 }, { x: 2, y: 0 })]) {
    assert.throws(() => runBfs(input), GridInputError);
  }
});
test('identical frozen input produces identical paths events and metrics over 20 runs', () => {
  const input = deepFreeze(inputFor(['.....', '.###.', '.....', '.#.#.', '.....'], { x: 0, y: 2 }, { x: 4, y: 2 }));
  const before = clone(input);
  const first = runBfs(input);
  for (let run = 0; run < 20; run++) assert.deepEqual(runBfs(input), first);
  assert.deepEqual(input, before);
  assertBfsTrace(input, first);
});
test('returned paths metrics and snapshots do not alias input or each other', () => {
  const input = inputFor(['...'], { x: 0, y: 0 }, { x: 2, y: 0 });
  const before = clone(input), result = runBfs(input);
  const terminal = clone(result.events.at(-1));
  result.path[0].x = 99;
  result.metrics.discoveredCount = 99;
  result.events.find(e => e.type === 'frontier_snapshot').payload.nodes[0].node.x = 99;
  assert.deepEqual(input, before);
  assert.deepEqual(result.events.at(-1), terminal);
  assert.deepEqual(result.events.find(e => e.type === 'node_selected').payload.node, input.start);
  assert.notDeepEqual(runBfs(input).path, result.path);
});
test('all 128 obstacle layouts on 3x3 with fixed open endpoints agree with independent relaxation', () => {
  const cells = [1, 2, 3, 4, 5, 6, 7];
  for (let mask = 0; mask < 128; mask++) {
    const flat = Array(9).fill('.');
    for (const [bit, cell] of cells.entries()) if (mask & (1 << bit)) flat[cell] = '#';
    const input = inputFor([0, 3, 6].map(offset => flat.slice(offset, offset + 3).join('')), { x: 0, y: 0 }, { x: 2, y: 2 });
    assertBfsTrace(input, runBfs(input));
  }
});
test('maximum supported 25x25 open grid has a 48-step valid deterministic path', () => {
  const input = inputFor(Array(25).fill('.'.repeat(25)), { x: 0, y: 0 }, { x: 24, y: 24 });
  const result = runBfs(input);
  assert.equal(result.metrics.pathLength, 48);
  assert.equal(result.metrics.discoveredCount, 625);
  assert.equal(result.metrics.expandedCount, 624);
  assertBfsTrace(input, result);
  assert.deepEqual(runBfs(input), result);
});
