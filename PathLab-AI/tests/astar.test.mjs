import test from 'node:test';
import assert from 'node:assert/strict';
import { runAstar, manhattanDistance } from '../src/domain/algorithms/astar.ts';
import { runBfs } from '../src/domain/algorithms/bfs.ts';
import { assertAstarTrace } from './helpers/astar-checks.mjs';
import { GridInputError } from '../src/domain/grid.ts';
import { assertValidPath, clone, deepFreeze, referenceDistance } from './helpers/search-checks.mjs';

const inputFor = (rows, start, goal) => ({ grid: { width: rows[0].length, height: rows.length, rows }, start, goal });
test('Manhattan heuristic measures orthogonal distance, not cost already travelled', () => {
  assert.equal(manhattanDistance({ x: 4, y: 1 }, { x: 1, y: 5 }), 7);
  assert.equal(manhattanDistance({ x: 1, y: 5 }, { x: 4, y: 1 }), 7);
  assert.equal(manhattanDistance({ x: 2, y: 2 }, { x: 2, y: 2 }), 0);
});
test('tiny A* trace pins event order, costs, sequence and goal-not-expanded', () => {
  const start = { x: 0, y: 0 }, goal = { x: 1, y: 0 };
  const candidate = (node, g, h, entrySequence) => ({ node, g, h, f: g + h, entrySequence });
  const metrics = { discoveredCount: 2, expandedCount: 1, selectionCount: 2, frontierPeak: 1, pathLength: 1 };
  const expected = [
    ['node_discovered', { ...candidate(start, 0, 1, 0), parent: null }],
    ['frontier_snapshot', { nodes: [candidate(start, 0, 1, 0)] }],
    ['node_selected', candidate(start, 0, 1, 0)],
    ['frontier_snapshot', { nodes: [] }],
    ['path_updated', { nodes: [start], final: false }],
    ['node_expanded', { node: start }],
    ['node_skipped', { node: { x: 0, y: -1 }, reason: 'out_of_bounds' }],
    ['node_discovered', { ...candidate(goal, 1, 0, 1), parent: start }],
    ['node_skipped', { node: { x: 0, y: 1 }, reason: 'out_of_bounds' }],
    ['node_skipped', { node: { x: -1, y: 0 }, reason: 'out_of_bounds' }],
    ['frontier_snapshot', { nodes: [candidate(goal, 1, 0, 1)] }],
    ['node_selected', candidate(goal, 1, 0, 1)],
    ['frontier_snapshot', { nodes: [] }],
    ['path_updated', { nodes: [start, goal], final: true }],
    ['run_finished', { status: 'found', path: [start, goal], metrics }],
  ].map(([type, payload], step) => ({ step, type, payload }));
  assert.deepEqual(runAstar(inputFor(['..'], start, goal)), { status: 'found', path: [start, goal], metrics, events: expected });
});
test('A* uses f/h/sequence and retains first parent for equal g', () => {
  const input = inputFor(['...', '...', '...'], { x: 0, y: 0 }, { x: 2, y: 2 });
  const result = runAstar(input);
  assert.deepEqual(result.path, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }]);
  assert.equal(result.metrics.expandedCount, 4);
  assert.equal(result.events.some(event => event.type === 'node_relaxed'), false);
});
test('all 128 obstacle layouts agree with independent distance relaxation and BFS', () => {
  const cells = Array.from({ length: 9 }, (_, i) => i).filter(i => i !== 0 && i !== 8);
  for (let mask = 0; mask < 128; mask++) {
    const rows = Array.from({ length: 3 }, (_, y) => Array.from({ length: 3 }, (_, x) => {
      const bit = cells.indexOf(y * 3 + x);
      return bit >= 0 && (mask & (1 << bit)) ? '#' : '.';
    }).join(''));
    const input = inputFor(rows, { x: 0, y: 0 }, { x: 2, y: 2 });
    const result = runAstar(input), distance = referenceDistance(input);
    assert.equal(result.metrics.pathLength, distance, 'layout ' + mask);
    assert.equal(result.metrics.pathLength, runBfs(input).metrics.pathLength);
    assert.equal(result.status, distance === null ? 'unreachable' : 'found');
    assertValidPath(input, result.path, distance);
    assertAstarTrace(input, result);
  }
});
test('25 by 25 open grid has shortest 48 steps and goal is selected, never expanded', () => {
  const input = inputFor(Array(25).fill('.'.repeat(25)), { x: 0, y: 0 }, { x: 24, y: 24 });
  const result = runAstar(input);
  assert.equal(result.metrics.pathLength, 48);
  assert.equal(result.metrics.expandedCount, 48);
  assert.equal(result.metrics.selectionCount, 49);
  assertValidPath(input, result.path, 48);
});
test('unreachable, same endpoints and input errors retain the shared runtime boundary', () => {
  const unreachable = runAstar(inputFor(['.#.'], { x: 0, y: 0 }, { x: 2, y: 0 }));
  assert.equal(unreachable.status, 'unreachable'); assert.equal(unreachable.metrics.pathLength, null); assert.deepEqual(unreachable.path, []);
  const same = runAstar(inputFor(['.'], { x: 0, y: 0 }, { x: 0, y: 0 }));
  assert.equal(same.metrics.pathLength, 0); assert.equal(same.metrics.expandedCount, 0); assert.equal(same.metrics.selectionCount, 1);
  for (const input of [null, inputFor(['#'], { x: 0, y: 0 }, { x: 0, y: 0 }), inputFor(['.'], { x: -1, y: 0 }, { x: 0, y: 0 })]) {
    assert.throws(() => runAstar(input), GridInputError);
  }
});
test('frozen input repeats exactly and all outputs are independent copies', () => {
  const input = deepFreeze(inputFor(['....', '.##.', '....'], { x: 0, y: 0 }, { x: 3, y: 2 }));
  const expected = runAstar(input), original = clone(expected);
  for (let i = 0; i < 20; i++) assert.deepEqual(runAstar(input), original);
  expected.path[0].x = 99;
  expected.metrics.pathLength = 99;
  expected.events.find(event => event.type === 'frontier_snapshot').payload.nodes[0].node.x = 99;
  assert.deepEqual(expected.events.at(-1).payload.path, original.path);
  assert.deepEqual(expected.events.at(-1).payload.metrics, original.metrics);
  assert.deepEqual(runAstar(input), original);
});

test('all 16384 four-by-four layouts match an independent shortest-distance oracle', () => {
  const slots = Array.from({ length: 16 }, (_, i) => i).filter(i => i !== 0 && i !== 15);
  for (let mask = 0; mask < 16384; mask++) {
    const rows = Array.from({ length: 4 }, (_, y) => Array.from({ length: 4 }, (_, x) => {
      const bit = slots.indexOf(y * 4 + x);
      return bit >= 0 && (mask & (1 << bit)) ? '#' : '.';
    }).join(''));
    const input = inputFor(rows, { x: 0, y: 0 }, { x: 3, y: 3 }), result = runAstar(input);
    const distance = referenceDistance(input);
    assert.equal(result.metrics.pathLength, distance, 'layout ' + mask);
    assertValidPath(input, result.path, distance);
  }
});
test('better g replaces parent without rediscovery and final route uses the improved parent', () => {
  const input = inputFor(['..#..', '..#..', '..#..', '.#...', '.....'], { x: 0, y: 0 }, { x: 4, y: 4 });
  const result = runAstar(input);
  const changes = result.events.filter(e => e.type === 'node_relaxed');
  assert.equal(changes.length, 1);
  assert.deepEqual(changes[0], { step: 44, type: 'node_relaxed', payload: { node: { x: 0, y: 2 }, g: 2, h: 6, f: 8, entrySequence: 6, parent: { x: 0, y: 1 }, previousG: 4 } });
  assert.deepEqual(result.path.slice(0, 4), [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }]);
  assert.equal(result.metrics.pathLength, 8);
  assertAstarTrace(input, result);
});
test('lazy stale entries produce skip evidence but never inflate unique frontier or selection metrics', () => {
  const input = inputFor(['..#.', '..#.', '..#.', '.#..'], { x: 0, y: 0 }, { x: 3, y: 3 });
  const result = runAstar(input);
  const stale = result.events.filter(e => e.type === 'node_skipped' && e.payload.reason === 'stale_entry');
  assert.deepEqual(stale, [{ step: 65, type: 'node_skipped', payload: { node: { x: 0, y: 2 }, reason: 'stale_entry' } }]);
  assert.deepEqual(result.metrics, { discoveredCount: 7, expandedCount: 7, selectionCount: 7, frontierPeak: 2, pathLength: null });
  assertAstarTrace(input, result);
});
