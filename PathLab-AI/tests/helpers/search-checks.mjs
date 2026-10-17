import assert from 'node:assert/strict';

export const key = ({ x, y }) => x + ',' + y;
export const clone = value => structuredClone(value);
export function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

// Independent distance oracle: synchronous relaxation, not the production queue.
export function referenceDistance({ grid, start, goal }) {
  let distances = grid.rows.map(row => Array(row.length).fill(Infinity));
  distances[start.y][start.x] = 0;
  for (let pass = 0; pass < grid.width * grid.height; pass++) {
    const next = distances.map(row => [...row]);
    let changed = false;
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (grid.rows[y][x] === '#') continue;
        // Deliberately use a different traversal order from the production BFS.
        for (const [dx, dy] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
          const distance = distances[y + dy]?.[x + dx];
          if (distance !== undefined && distance + 1 < next[y][x]) {
            next[y][x] = distance + 1;
            changed = true;
          }
        }
      }
    }
    distances = next;
    if (!changed) break;
  }
  const distance = distances[goal.y][goal.x];
  return Number.isFinite(distance) ? distance : null;
}

export function assertValidPath(input, path, distance) {
  if (distance === null) return assert.deepEqual(path, []);
  assert.equal(path.length - 1, distance);
  assert.deepEqual(path[0], input.start);
  assert.deepEqual(path.at(-1), input.goal);
  assert.equal(new Set(path.map(key)).size, path.length);
  for (let i = 0; i < path.length; i++) {
    const node = path[i];
    assert.equal(input.grid.rows[node.y]?.[node.x], '.');
    if (i > 0) assert.equal(Math.abs(node.x - path[i - 1].x) + Math.abs(node.y - path[i - 1].y), 1);
  }
}

export function assertBfsTrace(input, result) {
  const discovered = new Map();
  const selected = new Set();
  const expanded = new Set();
  const queue = [];
  let current = null;
  let peak = 0;
  const allNeighbors = [];
  for (const [step, event] of result.events.entries()) {
    assert.equal(event.step, step);
    assert.deepEqual(Object.keys(event).sort(), ['payload', 'step', 'type']);
    const { type, payload } = event;
    if (['node_discovered', 'node_selected'].includes(type)) {
      assert.equal(payload.h, 0);
      assert.equal(payload.f, payload.g);
      assert.equal(input.grid.rows[payload.node.y]?.[payload.node.x], '.');
    }
    if (type === 'node_discovered') {
      assert(!discovered.has(key(payload.node)), 'discovery must happen once, on enqueue');
      assert.equal(payload.entrySequence, discovered.size);
      if (discovered.size === 0) {
        assert.deepEqual(payload.node, input.start);
        assert.equal(payload.parent, null);
        assert.equal(payload.g, 0);
      } else {
        assert.deepEqual(payload.parent, current);
        assert.equal(payload.g, discovered.get(key(payload.parent)).g + 1);
        allNeighbors.push(payload.node);
      }
      discovered.set(key(payload.node), payload);
      const { parent, ...candidate } = payload;
      assert(parent === null || typeof parent === 'object');
      queue.push(candidate);
      peak = Math.max(peak, queue.length);
    } else if (type === 'node_selected') {
      assert.deepEqual(payload, queue.shift(), 'selection must use FIFO, not goal proximity');
      assert(!selected.has(key(payload.node)));
      selected.add(key(payload.node));
      current = payload.node;
    } else if (type === 'node_expanded') {
      assert.deepEqual(payload.node, current);
      assert.notDeepEqual(payload.node, input.goal, 'goal is selected, never expanded');
      assert(!expanded.has(key(payload.node)));
      expanded.add(key(payload.node));
    } else if (type === 'frontier_snapshot') {
      assert.deepEqual(payload.nodes, queue);
    } else if (type === 'node_skipped') {
      allNeighbors.push(payload.node);
      if (payload.reason === 'out_of_bounds') {
        assert(payload.node.x < 0 || payload.node.y < 0 || payload.node.x >= input.grid.width || payload.node.y >= input.grid.height);
      } else if (payload.reason === 'blocked') {
        assert.equal(input.grid.rows[payload.node.y]?.[payload.node.x], '#');
      } else {
        assert.equal(payload.reason, 'already_discovered');
        assert(discovered.has(key(payload.node)));
      }
    } else if (type === 'path_updated') {
      if (payload.final) assert.deepEqual(payload.nodes, result.path);
      else assertValidPath({ ...input, goal: current }, payload.nodes, discovered.get(key(current)).g);
    } else if (type === 'run_finished') {
      assert.equal(step, result.events.length - 1);
      assert.equal(payload.status, result.status);
      assert.deepEqual(payload.path, result.path);
      assert.deepEqual(payload.metrics, result.metrics);
    } else {
      assert.fail('BFS must not emit relaxation, session, user or AI events: ' + type);
    }
  }
  assert.deepEqual(allNeighbors, [...expanded].flatMap(id => {
    const [x, y] = id.split(',').map(Number);
    return [{ x, y: y - 1 }, { x: x + 1, y }, { x, y: y + 1 }, { x: x - 1, y }];
  }));
  assert.equal(result.events.filter(e => e.type === 'run_finished').length, 1);
  assert.equal(result.events.filter(e => e.type === 'path_updated' && e.payload.final).length, 1);
  assert.equal(result.metrics.discoveredCount, discovered.size);
  assert.equal(result.metrics.selectionCount, selected.size);
  assert.equal(result.metrics.expandedCount, expanded.size);
  assert.equal(result.metrics.frontierPeak, peak);
  const distance = referenceDistance(input);
  assert.equal(result.status, distance === null ? 'unreachable' : 'found');
  assert.equal(result.metrics.pathLength, distance);
  assertValidPath(input, result.path, distance);
}
