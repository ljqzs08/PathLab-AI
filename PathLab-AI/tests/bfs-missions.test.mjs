import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import { runBfs } from '../src/domain/algorithms/bfs.ts';
import { inspectBfsMissions, inspectCheckpoints } from '../scripts/inspect-bfs.mjs';
import { assertBfsTrace, assertValidPath, clone, deepFreeze } from './helpers/search-checks.mjs';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const levels = deepFreeze(read('../fixtures/levels.json'));
const evidence = inspectBfsMissions(levels);
const expectedLengths = [[6, 8], [14, 16], [8, 12], [14, 8]];
function changedInput(level) {
  const input = clone({ grid: level.grid, start: level.start, goal: level.goal });
  const { type, cell } = level.counterfactual;
  if (type === 'move_goal') input.goal = clone(cell);
  else {
    const row = input.grid.rows[cell.y];
    input.grid.rows[cell.y] = row.slice(0, cell.x) + '#' + row.slice(cell.x + 1);
  }
  return input;
}
for (const [index, level] of levels.entries()) {
  test(level.id + ' baseline and fixed counterfactual match pinned shortest distances and independent oracle', () => {
    const before = clone(level);
    for (const [variant, input] of [{ grid: level.grid, start: level.start, goal: level.goal }, changedInput(level)].entries()) {
      const result = runBfs(deepFreeze(input));
      assert.equal(result.metrics.pathLength, expectedLengths[index][variant]);
      assertBfsTrace(input, result);
      assert.deepEqual(runBfs(input), result);
    }
    assert.deepEqual(level, before);
  });
}
test('every generated event in all eight mission runs fits the frozen envelope schema', () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(read('../contracts/event.schema.json'));
  for (const level of levels) {
    for (const input of [level, changedInput(level)]) {
      const result = runBfs(input);
      for (const event of result.events) {
        // Explicitly synthetic envelope for schema testing, not an actual session.
        const envelope = { schemaVersion: 1, eventId: 'schema-fixture:' + event.step, sessionId: 'schema-fixture', runId: 'schema-fixture', levelId: level.id, gridRevision: 0, algorithm: 'bfs', algorithmVersion: '1.0.0', createdAt: '2026-10-17T00:00:00.000Z', ...event };
        assert(validate(envelope), level.id + ' step ' + event.step + ': ' + ajv.errorsText(validate.errors));
      }
    }
  }
});
test('all 16 fixture checkpoint slots have multiple candidates at requested effective selections 2 and 4', () => {
  for (const mission of evidence.missions) {
    for (const run of [mission.baseline, mission.counterfactual]) {
      assert.equal(run.checkpoints.length, 2);
      for (const [index, point] of run.checkpoints.entries()) {
        assert.equal(point.status, 'available_in_trace');
        assert.equal(point.selectionOrdinal, [2, 4][index]);
        assert(point.candidates.length >= 2);
        assert(point.snapshotStep < point.selectionStep);
        assert.deepEqual(point.nextNode, point.candidates[0].node);
      }
    }
  }
});
test('checkpoint evidence defers single-candidate selections and consumes only one pending checkpoint per selection', () => {
  const input = { grid: { width: 5, height: 3, rows: ['##.##', '##.##', '.....'] }, start: { x: 2, y: 0 }, goal: { x: 4, y: 2 } };
  const points = inspectCheckpoints(runBfs(input).events, [{ id: 'test-P1', beforeSelectionOrdinal: 2, minCandidates: 2 }, { id: 'test-P2', beforeSelectionOrdinal: 4, minCandidates: 2 }]);
  assert.deepEqual(points.map(point => point.selectionOrdinal), [4, 5]);
});
test('same-start-goal and unreachable traces do not fabricate checkpoint submissions', () => {
  const cases = [
    { grid: { width: 1, height: 1, rows: ['.'] }, start: { x: 0, y: 0 }, goal: { x: 0, y: 0 } },
    { grid: { width: 3, height: 3, rows: ['.##', '###', '##.'] }, start: { x: 0, y: 0 }, goal: { x: 2, y: 2 } },
  ];
  for (const input of cases) {
    const points = inspectCheckpoints(runBfs(input).events, levels[0].checkpoints);
    assert(points.every(point => point.status === 'skipped_insufficient_candidates'));
    assert(points.every(point => !('nextNode' in point)));
  }
});
test('L03 blockage is on the old route, invalidates it and changes the shortest route from 8 to 12', () => {
  const mission = evidence.missions.find(mission => mission.levelId === 'L03');
  assert.equal(mission.bfsRole, 'verification_oracle_only');
  assert.deepEqual(mission.fixtureAlgorithms, ['astar']);
  assert.equal(mission.blockOnBaselinePath, true);
  assert.equal(mission.pathChanged, true);
  assert.equal(mission.pathLengthDelta, 4);
  assert(!mission.counterfactual.path.some(node => node.x === 4 && node.y === 2));
  const upper = [{ x: 0, y: 2 }, { x: 0, y: 1 }, ...Array.from({ length: 9 }, (_, x) => ({ x, y: 0 })), { x: 8, y: 1 }, { x: 8, y: 2 }];
  const lower = [{ x: 0, y: 2 }, { x: 0, y: 3 }, ...Array.from({ length: 9 }, (_, x) => ({ x, y: 4 })), { x: 8, y: 3 }, { x: 8, y: 2 }];
  assert.deepEqual(mission.counterfactual.path, upper);
  assertValidPath(changedInput(levels[2]), lower, 12);
});
test('evidence generation is deterministic nonmutating and contains no fabricated user history', () => {
  assert.deepEqual(inspectBfsMissions(levels), evidence);
  assert.equal(evidence.purpose, 'developer_verification_only_not_learning_history');
  for (const mission of evidence.missions) {
    for (const run of [mission.baseline, mission.counterfactual]) assert.match(run.traceSha256, /^[a-f0-9]{64}$/);
  }
});
test('checked-in BFS evidence is exactly reproducible from the current code and fixed inputs', () => {
  assert.deepEqual(read('../../docs/evidence/stage-2-bfs.json'), evidence);
});
