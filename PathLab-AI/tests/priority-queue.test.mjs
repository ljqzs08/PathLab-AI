import test from 'node:test';
import assert from 'node:assert/strict';
import { PriorityQueue, comparePriority } from '../src/domain/algorithms/priorityQueue.ts';

const item = (f, h, entrySequence) => Object.freeze({ f, h, entrySequence });
test('binary heap returns undefined while empty and is reusable after draining', () => {
  const queue = new PriorityQueue();
  assert.equal(queue.size, 0);
  assert.equal(queue.pop(), undefined);
  queue.push(item(2, 1, 0));
  assert.equal(queue.size, 1);
  assert.deepEqual(queue.pop(), item(2, 1, 0));
  assert.equal(queue.size, 0);
  queue.push(item(1, 1, 1));
  assert.deepEqual(queue.pop(), item(1, 1, 1));
  assert.equal(queue.pop(), undefined);
});
test('fixed priority uses f first, h second, insertion sequence third', () => {
  const entries = [item(4, 3, 0), item(4, 1, 8), item(3, 3, 9), item(4, 1, 2), item(5, 0, 1)];
  const queue = new PriorityQueue();
  for (const entry of entries) queue.push(entry);
  assert.deepEqual(Array.from({ length: 5 }, () => queue.pop()), [entries[2], entries[3], entries[1], entries[0], entries[4]]);
  assert.equal(comparePriority(item(4, 1, 2), item(4, 1, 2)), 0);
});
test('heap handles 625 immutable entries in reverse and alternating insertion orders', () => {
  const entries = Array.from({ length: 625 }, (_, i) => item(i % 17, i % 11, i));
  const expected = [...entries].sort((a, b) => a.f - b.f || a.h - b.h || a.entrySequence - b.entrySequence);
  for (const order of [[...entries].reverse(), entries.filter((_, i) => i % 2 === 0).concat(entries.filter((_, i) => i % 2 === 1))]) {
    const queue = new PriorityQueue();
    for (const entry of order) queue.push(entry);
    assert.deepEqual(entries.map(() => queue.pop()), expected);
    assert.equal(queue.size, 0);
  }
});
test('interleaved insertions preserve heap ordering', () => {
  const queue = new PriorityQueue();
  queue.push(item(7, 0, 0)); queue.push(item(4, 2, 1));
  assert.deepEqual(queue.pop(), item(4, 2, 1));
  queue.push(item(1, 0, 2)); queue.push(item(4, 1, 3));
  assert.deepEqual(queue.pop(), item(1, 0, 2));
  assert.deepEqual(queue.pop(), item(4, 1, 3));
  assert.deepEqual(queue.pop(), item(7, 0, 0));
});
