import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import { runAstar } from '../src/domain/algorithms/astar.ts';
import { runBfs } from '../src/domain/algorithms/bfs.ts';
import { inspectComparisons } from '../scripts/inspect-comparison.mjs';
import { assertAstarTrace } from './helpers/astar-checks.mjs';
import { deepFreeze } from './helpers/search-checks.mjs';

const levels = JSON.parse(readFileSync(new URL('../fixtures/levels.json', import.meta.url), 'utf8'));
const evidence = inspectComparisons(deepFreeze(structuredClone(levels)));
const inputs = levels.flatMap(level => {
  const input = { grid: structuredClone(level.grid), start: { ...level.start }, goal: { ...level.goal } };
  const changed = structuredClone(input), { type, cell } = level.counterfactual;
  if (type === 'move_goal') changed.goal = { ...cell };
  else changed.grid.rows[cell.y] = changed.grid.rows[cell.y].slice(0, cell.x) + '#' + changed.grid.rows[cell.y].slice(cell.x + 1);
  return [{ level, input }, { level, input: changed }];
});
test('all eight A* mission runs pass independent event replay and match BFS shortest steps', () => {
  for (const { input } of inputs) {
    const result = runAstar(input);
    assertAstarTrace(input, result);
    assert.equal(result.metrics.pathLength, runBfs(input).metrics.pathLength);
  }
});
test('four fixed comparisons pin A* baseline and counterfactual expanded/discovered counts', () => {
  const expected = { L01: [[6,15],[8,18]], L02: [[27,40],[32,43]], L03: [[8,11],[16,18]], L04: [[14,19],[8,11]] };
  for (const mission of evidence.missions) {
    for (const [i, label] of ['baseline', 'counterfactual'].entries()) {
      const run = mission[label];
      assert(run.sameShortestLength);
      assert.deepEqual([run.astar.metrics.expandedCount, run.astar.metrics.discoveredCount], expected[mission.levelId][i]);
    }
  }
});
test('all 3651 comparison events satisfy original strict schema using explicitly synthetic envelopes', () => {
  const schema = JSON.parse(readFileSync(new URL('../contracts/event.schema.json', import.meta.url), 'utf8'));
  const ajv = new Ajv2020({ strict: false, allErrors: true }), validate = ajv.compile(schema);
  let count = 0;
  for (const [index, { level, input }] of inputs.entries()) {
    for (const [algorithm, engine] of [['bfs', runBfs], ['astar', runAstar]]) {
      for (const event of engine(input).events) {
        const envelope = { schemaVersion: 1, eventId: 'synthetic-comparison:' + index + ':' + algorithm + ':' + event.step, sessionId: 'synthetic-comparison', runId: 'synthetic-run-' + index + '-' + algorithm, levelId: level.id, gridRevision: index % 2, algorithm, algorithmVersion: '1.0.0', ...event, createdAt: '2026-10-17T00:00:00.000Z' };
        assert(validate(envelope), algorithm + ' ' + level.id + ' ' + event.step + ': ' + ajv.errorsText(validate.errors)); count++;
      }
    }
  }
  assert.equal(count, 3651);
});
test('all 16 A* checkpoint slots have more than one candidate and the first priority is the next selected node', () => {
  for (const mission of evidence.missions) for (const label of ['baseline', 'counterfactual']) {
    for (const [i, point] of mission[label].astar.checkpoints.entries()) {
      assert.equal(point.status, 'available_in_trace'); assert.equal(point.selectionOrdinal, [2,4][i]);
      assert(point.candidates.length >= 2); assert.deepEqual(point.candidates[0].node, point.nextNode);
    }
  }
});
test('comparison evidence is deterministic, nonmutating and labels verification-only algorithms', () => {
  const frozen = deepFreeze(structuredClone(levels)), before = structuredClone(frozen);
  assert.deepEqual(inspectComparisons(frozen), evidence); assert.deepEqual(frozen, before);
  assert.equal(evidence.missions[0].algorithmRoles.astar, 'verification_oracle_only');
  assert.equal(evidence.missions[2].algorithmRoles.bfs, 'verification_oracle_only');
  assert.equal(evidence.purpose, 'developer_verification_only_not_learning_history');
  assert.equal(evidence.comparisonScope, 'same_grid_unit_steps_not_runtime_benchmark');
});
test('checked-in comparison report exactly reproduces from frozen fixtures and both algorithms', () => {
  const saved = JSON.parse(readFileSync(new URL('../../docs/evidence/stage-3-comparison.json', import.meta.url), 'utf8'));
  assert.deepEqual(saved, evidence);
});
