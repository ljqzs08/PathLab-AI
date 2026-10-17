import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayground, editPlayground, comparePlayground } from '../src/domain/playground.ts';

test('playground presets are independent, deterministic, reachable and share shortest lengths', () => {
  for (const preset of ['open', 'detour', 'fork']) {
    const a = createPlayground(preset), b = createPlayground(preset);
    assert.deepEqual(a, b); assert.notEqual(a.grid.rows, b.grid.rows);
    const before = structuredClone(a), result = comparePlayground(a);
    assert.equal(result.bfs.status, 'found');
    assert.equal(result.bfs.metrics.pathLength, result.astar.metrics.pathLength);
    assert.deepEqual(a, before); assert.deepEqual(result, comparePlayground(a));
  }
});
test('wall and eraser edits preserve source and protect endpoints', () => {
  const map = createPlayground('open');
  assert.equal(editPlayground(map, 'wall', map.start), map);
  assert.equal(editPlayground(map, 'wall', map.goal), map);
  const edited = editPlayground(map, 'wall', {x: 2, y: 2});
  assert.equal(edited.grid.rows[2][2], '#'); assert.equal(map.grid.rows[2][2], '.');
  assert.deepEqual(editPlayground(edited, 'erase', {x: 2, y: 2}), map);
});
test('moving endpoints opens a wall but refuses overlapping endpoints', () => {
  const map = editPlayground(createPlayground('open'), 'wall', {x: 2, y: 2});
  const moved = editPlayground(map, 'start', {x: 2, y: 2});
  assert.deepEqual(moved.start, {x: 2, y: 2}); assert.equal(moved.grid.rows[2][2], '.');
  assert.equal(editPlayground(moved, 'goal', moved.start), moved);
  assert.equal(editPlayground(moved, 'start', moved.start), moved);
});
test('out of bounds and fractional edits are rejected without changing the source', () => {
  const map = createPlayground('open');
  for (const node of [{x:-1,y:0},{x:9,y:0},{x:0,y:7},{x:0.5,y:0}]) {
    assert.throws(() => editPlayground(map, 'wall', node));
  }
  assert.deepEqual(map, createPlayground('open'));
});
test('unreachable custom maps compare honestly without fabricated paths', () => {
  let map = createPlayground('open');
  map = editPlayground(map, 'wall', {x:1,y:0});
  map = editPlayground(map, 'wall', {x:0,y:1});
  const result = comparePlayground(map);
  for (const run of [result.bfs,result.astar]) {
    assert.equal(run.status,'unreachable'); assert.equal(run.metrics.pathLength,null); assert.deepEqual(run.path,[]);
  }
  assert.equal(result.fewerExpanded,'tie');
});
test('comparison winner is derived from actual expansion events, not assumed A-star superiority', () => {
  for (const preset of ['open','detour','fork']) {
    const result=comparePlayground(createPlayground(preset));
    const counts = [result.bfs,result.astar].map(run=>run.events.filter(e=>e.type==='node_expanded').length);
    assert.equal(result.fewerExpanded,counts[0]===counts[1]?'tie':counts[0]<counts[1]?'bfs':'astar');
  }
});
