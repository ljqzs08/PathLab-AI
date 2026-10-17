import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSearchInput, GridInputError, isInBounds, isWalkable, neighborsOf } from '../src/domain/grid.ts';
import { deepFreeze } from './helpers/search-checks.mjs';

const valid = () => ({ grid: { width: 3, height: 3, rows: ['...', '.#.', '...'] }, start: { x: 0, y: 0 }, goal: { x: 2, y: 2 } });
const rejects = (input, code) => assert.throws(() => assertSearchInput(input), error => error instanceof GridInputError && error.code === code);

test('grid accepts read-only input without modifying it, including the 1x1 kernel case', () => {
  const input = deepFreeze(valid());
  assert.doesNotThrow(() => assertSearchInput(input));
  assert.doesNotThrow(() => assertSearchInput({ grid: { width: 1, height: 1, rows: ['.'] }, start: { x: 0, y: 0 }, goal: { x: 0, y: 0 } }));
});
test('four-neighbor order is up right down left and retains out-of-bounds coordinates', () => {
  assert.deepEqual(neighborsOf({ x: 0, y: 0 }), [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }]);
});
test('bounds and walls are separate from valid open cells', () => {
  const { grid } = valid();
  assert.equal(isInBounds(grid, { x: 1, y: 1 }), true);
  assert.equal(isWalkable(grid, { x: 1, y: 1 }), false);
  assert.equal(isWalkable(grid, { x: 2, y: 2 }), true);
  for (const node of [{ x: -1, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 3 }, { x: 0.5, y: 0 }, { x: NaN, y: 0 }]) {
    assert.equal(isInBounds(grid, node), false);
    assert.equal(isWalkable(grid, node), false);
  }
});
test('rejects missing or non-object search input and grid', () => {
  for (const input of [undefined, null, [], {}, { ...valid(), grid: null }, { ...valid(), grid: [] }]) rejects(input, 'invalid_grid');
});
test('rejects invalid or oversized dimensions before allocation', () => {
  for (const dimension of [0, -1, 1.5, NaN, Infinity, 26, Number.MAX_SAFE_INTEGER, '3']) {
    for (const field of ['width', 'height']) rejects({ ...valid(), grid: { ...valid().grid, [field]: dimension } }, 'invalid_grid');
  }
});
test('rejects bad row count width characters sparse rows and non-string rows', () => {
  for (const rows of [undefined, '...', ['...'], ['..', '...', '...'], ['...', '.?.', '...'], ['...', ' . ', '...'], ['...', '..\n', '...'], ['...', 123, '...'], Array(3), ['...', '...', '...', '...']]) {
    rejects({ ...valid(), grid: { ...valid().grid, rows } }, 'invalid_grid');
  }
});
test('rejects fractional non-finite or malformed endpoints with a stable code', () => {
  for (const node of [undefined, null, [], {}, { x: 0.5, y: 0 }, { x: 0, y: NaN }, { x: Infinity, y: 0 }, { x: '0', y: 0 }, { x: Number.MAX_SAFE_INTEGER + 1, y: 0 }]) {
    for (const endpoint of ['start', 'goal']) rejects({ ...valid(), [endpoint]: node }, 'invalid_position');
  }
});
test('out-of-bounds endpoints are input errors, not an unreachable search', () => {
  for (const node of [{ x: -1, y: 0 }, { x: 3, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 3 }]) {
    for (const endpoint of ['start', 'goal']) rejects({ ...valid(), [endpoint]: node }, 'out_of_bounds');
  }
});
test('blocked start goal or coincident blocked endpoints are rejected', () => {
  for (const endpoint of ['start', 'goal']) rejects({ ...valid(), [endpoint]: { x: 1, y: 1 } }, 'blocked_endpoint');
  rejects({ ...valid(), start: { x: 1, y: 1 }, goal: { x: 1, y: 1 } }, 'blocked_endpoint');
});
