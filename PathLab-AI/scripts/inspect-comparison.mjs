/** Reproducible developer verification, not learner interaction history. */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBfs } from '../src/domain/algorithms/bfs.ts';
import { runAstar } from '../src/domain/algorithms/astar.ts';
import { inspectCheckpoints } from './inspect-bfs.mjs';

function summarize(input, checkpoints, algorithm) {
  const result = algorithm === 'bfs' ? runBfs(input) : runAstar(input);
  return {
    status: result.status, path: result.path, metrics: result.metrics,
    eventCount: result.events.length,
    relaxationCount: result.events.filter(e => e.type === 'node_relaxed').length,
    staleEntryCount: result.events.filter(e => e.type === 'node_skipped' && e.payload.reason === 'stale_entry').length,
    traceSha256: createHash('sha256').update(JSON.stringify(result.events), 'utf8').digest('hex'),
    checkpoints: inspectCheckpoints(result.events, checkpoints),
  };
}
function compare(input, checkpoints) {
  const bfs = summarize(input, checkpoints, 'bfs'), astar = summarize(input, checkpoints, 'astar');
  return {
    bfs, astar,
    sameShortestLength: bfs.status === astar.status && bfs.metrics.pathLength === astar.metrics.pathLength,
    samePath: JSON.stringify(bfs.path) === JSON.stringify(astar.path),
    astarMinusBfsExpanded: astar.metrics.expandedCount - bfs.metrics.expandedCount,
  };
}
export function inspectComparisons(levels) {
  return {
    schemaVersion: 1, algorithmVersion: '1.0.0',
    purpose: 'developer_verification_only_not_learning_history',
    comparisonScope: 'same_grid_unit_steps_not_runtime_benchmark',
    missions: levels.map(level => {
      const input = { grid: structuredClone(level.grid), start: { ...level.start }, goal: { ...level.goal } };
      const changed = structuredClone(input);
      const { type, cell } = level.counterfactual;
      if (type === 'move_goal') changed.goal = { ...cell };
      else if (type === 'block_cell') {
        const row = changed.grid.rows[cell.y];
        changed.grid.rows[cell.y] = row.slice(0, cell.x) + '#' + row.slice(cell.x + 1);
      } else throw new Error('Unsupported fixture change: ' + type);
      return {
        levelId: level.id, plannedAlgorithms: [...level.algorithms], change: structuredClone(level.counterfactual),
        algorithmRoles: Object.fromEntries(['bfs', 'astar'].map(algorithm => [algorithm, level.algorithms.includes(algorithm) ? 'planned_learning_algorithm' : 'verification_oracle_only'])),
        baseline: compare(input, level.checkpoints), counterfactual: compare(changed, level.checkpoints),
      };
    }),
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const levels = JSON.parse(readFileSync(new URL('../fixtures/levels.json', import.meta.url), 'utf8'));
  console.log(JSON.stringify(inspectComparisons(levels), null, 2));
}
