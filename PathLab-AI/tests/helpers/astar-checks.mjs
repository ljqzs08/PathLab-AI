import assert from 'node:assert/strict';
import { assertValidPath, key, referenceDistance } from './search-checks.mjs';

// Independent array-based priority replay: does not call the production heap/comparator.
const order = (a, b) => a.f - b.f || a.h - b.h || a.entrySequence - b.entrySequence;
const candidate = ({ node, g, h, f, entrySequence }) => ({ node, g, h, f, entrySequence });
export function assertAstarTrace(input, result) {
  const known = new Map(), open = new Map(), selected = new Set(), expanded = new Set();
  const pending = [], neighbors = [];
  let current = null, sequence = 0, peak = 0;
  for (const [step, event] of result.events.entries()) {
    assert.equal(event.step, step);
    assert.deepEqual(Object.keys(event).sort(), ['payload', 'step', 'type']);
    const { type, payload } = event;
    if (['node_discovered', 'node_relaxed', 'node_selected'].includes(type)) {
      assert.equal(payload.f, payload.g + payload.h);
      assert.equal(payload.h, Math.abs(payload.node.x - input.goal.x) + Math.abs(payload.node.y - input.goal.y));
      assert.equal(input.grid.rows[payload.node.y]?.[payload.node.x], '.');
    }
    if (type === 'node_discovered' || type === 'node_relaxed') {
      const previous = known.get(key(payload.node));
      assert.equal(payload.entrySequence, sequence++);
      if (previous === undefined) {
        assert.equal(type, 'node_discovered');
        if (known.size === 0) {
          assert.deepEqual(payload.node, input.start); assert.equal(payload.parent, null); assert.equal(payload.g, 0);
        }
      } else {
        assert.equal(type, 'node_relaxed'); assert.equal(payload.previousG, previous.g);
        assert(payload.g < previous.g); assert(!selected.has(key(payload.node)));
      }
      if (payload.parent !== null) {
        assert.deepEqual(payload.parent, current.node);
        assert.equal(payload.g, current.g + 1);
        neighbors.push(payload.node);
      }
      known.set(key(payload.node), payload); open.set(key(payload.node), payload);
      pending.push(payload); peak = Math.max(peak, open.size);
    } else if (type === 'node_selected') {
      pending.sort(order);
      const next = pending.shift();
      assert(next); assert.deepEqual(payload, candidate(next));
      assert.equal(open.get(key(next.node)).entrySequence, next.entrySequence, 'stale entries must be skipped before selection');
      assert(!selected.has(key(payload.node)));
      open.delete(key(payload.node)); selected.add(key(payload.node)); current = payload;
    } else if (type === 'node_expanded') {
      assert.deepEqual(payload.node, current.node); assert.notDeepEqual(payload.node, input.goal);
      assert(!expanded.has(key(payload.node))); expanded.add(key(payload.node));
    } else if (type === 'node_skipped' && payload.reason === 'stale_entry') {
      pending.sort(order);
      const next = pending.shift();
      assert(next); assert.deepEqual(payload.node, next.node);
      assert.notEqual(open.get(key(next.node))?.entrySequence, next.entrySequence);
    } else if (type === 'node_skipped') {
      neighbors.push(payload.node);
      if (payload.reason === 'out_of_bounds') {
        assert(payload.node.x < 0 || payload.node.y < 0 || payload.node.x >= input.grid.width || payload.node.y >= input.grid.height);
      } else if (payload.reason === 'blocked') {
        assert.equal(input.grid.rows[payload.node.y]?.[payload.node.x], '#');
      } else {
        assert.equal(payload.reason, 'not_better');
        assert(current.g + 1 >= known.get(key(payload.node)).g);
      }
    } else if (type === 'frontier_snapshot') {
      assert.deepEqual(payload.nodes, [...open.values()].map(candidate).sort(order));
      assert.equal(new Set(payload.nodes.map(entry => key(entry.node))).size, payload.nodes.length);
    } else if (type === 'path_updated') {
      if (payload.final) assert.deepEqual(payload.nodes, result.path);
      else assertValidPath({ ...input, goal: current.node }, payload.nodes, current.g);
    } else if (type === 'run_finished') {
      assert.equal(step, result.events.length - 1);
      assert.equal(payload.status, result.status); assert.deepEqual(payload.path, result.path); assert.deepEqual(payload.metrics, result.metrics);
    } else assert.fail('Unexpected A* event: ' + type);
  }
  assert.deepEqual(neighbors, [...expanded].flatMap(id => {
    const [x, y] = id.split(',').map(Number);
    return [{ x, y: y - 1 }, { x: x + 1, y }, { x, y: y + 1 }, { x: x - 1, y }];
  }));
  assert.equal(result.events.filter(e => e.type === 'run_finished').length, 1);
  assert.equal(result.events.filter(e => e.type === 'path_updated' && e.payload.final).length, 1);
  assert.equal(result.metrics.discoveredCount, known.size); assert.equal(result.metrics.selectionCount, selected.size);
  assert.equal(result.metrics.expandedCount, expanded.size); assert.equal(result.metrics.frontierPeak, peak);
  const distance = referenceDistance(input);
  assert.equal(result.metrics.pathLength, distance); assert.equal(result.status, distance === null ? 'unreachable' : 'found');
  assertValidPath(input, result.path, distance);
}
