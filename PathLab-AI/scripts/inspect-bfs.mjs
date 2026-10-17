/** Developer evidence only. This is NOT the learning gate or a student-facing API. */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBfs } from '../src/domain/algorithms/bfs.ts';

export function inspectCheckpoints(events, checkpoints) {
  let frontier = [], snapshotStep = null, ordinal = 0, pending = 0;
  const analysis = [];
  for (const event of events) {
    if (event.type === 'frontier_snapshot') {
      frontier = event.payload.nodes;
      snapshotStep = event.step;
    } else if (event.type === 'node_selected') {
      ordinal++;
      const checkpoint = checkpoints[pending];
      if (checkpoint && ordinal >= checkpoint.beforeSelectionOrdinal && frontier.length >= checkpoint.minCandidates) {
        analysis.push({
          checkpointId: checkpoint.id, status: 'available_in_trace',
          requestedOrdinal: checkpoint.beforeSelectionOrdinal, selectionOrdinal: ordinal,
          snapshotStep, selectionStep: event.step,
          candidates: structuredClone(frontier), nextNode: { ...event.payload.node },
        });
        pending++; // At most one checkpoint per effective selection.
      }
    }
  }
  for (const checkpoint of checkpoints.slice(pending)) {
    analysis.push({ checkpointId: checkpoint.id, status: 'skipped_insufficient_candidates', requestedOrdinal: checkpoint.beforeSelectionOrdinal });
  }
  return analysis;
}

function summarize(input, checkpoints) {
  const result = runBfs(input);
  return {
    status: result.status, path: result.path, metrics: result.metrics,
    eventCount: result.events.length,
    traceSha256: createHash('sha256').update(JSON.stringify(result.events), 'utf8').digest('hex'),
    checkpoints: inspectCheckpoints(result.events, checkpoints),
  };
}
export function inspectBfsMissions(levels) {
  return {
    schemaVersion: 1, algorithm: 'bfs', algorithmVersion: '1.0.0',
    purpose: 'developer_verification_only_not_learning_history',
    missions: levels.map(level => {
      const input = { grid: structuredClone(level.grid), start: { ...level.start }, goal: { ...level.goal } };
      const changed = structuredClone(input);
      const { type, cell } = level.counterfactual;
      if (type === 'move_goal') changed.goal = { ...cell };
      else if (type === 'block_cell') {
        const row = changed.grid.rows[cell.y];
        changed.grid.rows[cell.y] = row.slice(0, cell.x) + '#' + row.slice(cell.x + 1);
      } else throw new Error('Unsupported fixture change: ' + type);
      const baseline = summarize(input, level.checkpoints);
      const counterfactual = summarize(changed, level.checkpoints);
      return {
        levelId: level.id, fixtureAlgorithms: level.algorithms,
        bfsRole: level.algorithms.includes('bfs') ? 'planned_learning_algorithm' : 'verification_oracle_only',
        change: structuredClone(level.counterfactual), baseline, counterfactual,
        blockOnBaselinePath: type === 'block_cell' ? baseline.path.some(node => node.x === cell.x && node.y === cell.y) : null,
        pathChanged: JSON.stringify(baseline.path) !== JSON.stringify(counterfactual.path),
        pathLengthDelta: baseline.metrics.pathLength === null || counterfactual.metrics.pathLength === null
          ? null : counterfactual.metrics.pathLength - baseline.metrics.pathLength,
      };
    }),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const levels = JSON.parse(readFileSync(new URL('../fixtures/levels.json', import.meta.url), 'utf8'));
  console.log(JSON.stringify(inspectBfsMissions(levels), null, 2));
}
