import test from 'node:test';
import assert from 'node:assert/strict';
import { runAstar } from '../src/domain/algorithms/astar.ts';
import { comparePriority } from '../src/domain/algorithms/priorityQueue.ts';
import { PRIMER_INPUT, PRIMER_QUIZ, buildPrimerTrace, describeChoice, explainChoice, explainPrediction } from '../src/domain/learning/astar-primer.ts';

const trace = buildPrimerTrace();
const at = (x, y) => ({ x, y });

test('primer steps replay the real A* selections in order and end on the engine path', () => {
  const engine = runAstar(PRIMER_INPUT);
  const selected = engine.events.filter(event => event.type === 'node_selected').map(event => event.payload.node);
  assert.deepEqual(trace.steps.map(step => step.selected.node), selected);
  assert.deepEqual(trace.path, engine.path);
  assert.equal(trace.steps.length, 9);
  assert.equal(trace.astar.pathLength, 8);
  assert.ok(trace.steps.at(-1).isGoal);
});

test('each step winner is exactly what the priority rule picks from the open list shown to learners', () => {
  for (const step of trace.steps) {
    const ranked = [...step.open].sort(comparePriority);
    assert.deepEqual(ranked[0].node, step.selected.node);
    assert.equal(step.open.some(cell => step.closedBefore.some(node => node.x === cell.node.x && node.y === cell.node.y)), false);
    for (const cell of step.open) assert.equal(cell.f, cell.g + cell.h);
  }
});

test('the small map teaches every tie-break rule, the wall detour and the BFS contrast', () => {
  assert.deepEqual(new Set(trace.steps.map(step => step.reason)), new Set(['only', 'lowest_f', 'tie_h', 'tie_sequence']));
  assert.deepEqual(trace.steps[2].blocked, [at(3, 2)]);
  assert.equal(trace.steps[2].selected.f, 6);
  assert.equal(trace.steps[3].selected.f, 8);
  assert.ok(trace.bfs.expandedCount > trace.astar.expandedCount * 3);
  assert.equal(trace.bfs.pathLength, trace.astar.pathLength);
  const onPath = node => trace.path.some(item => item.x === node.x && item.y === node.y);
  assert.ok(trace.steps.at(-1).closedBefore.every(onPath), 'primer final chapter claims every expanded cell lies on the path');
  assert.equal(trace.bfsLayers.flat().length, trace.bfs.selectionCount);
  assert.deepEqual(trace.bfsLayers.at(-1).at(-1), PRIMER_INPUT.goal);
});

test('plain-language explanations name the deciding rule', () => {
  assert.match(describeChoice(trace.steps[0]), /只有/);
  assert.match(describeChoice(trace.steps[1]), /f=1\+5=6.*最小/);
  assert.match(describeChoice(trace.steps[3]), /\(2,1\) 比 \(2,3\) 先加入/);
  assert.deepEqual(trace.steps[3].known, [at(2, 2), at(1, 1)]);
  assert.match(describeChoice(trace.steps[4]), /h=4 最小/);
  const open = trace.steps[3].open;
  assert.match(explainPrediction('astar', open, at(0, 1), at(2, 1)), /h=5.*h=7/);
  assert.match(explainPrediction('astar', open, at(2, 3), at(2, 1)), /入队序号 7 早于/);
  assert.match(explainPrediction('astar', trace.steps[1].open, at(0, 1), at(1, 2)), /f=1\+5=6.*f=1\+7=8/);
  assert.match(explainPrediction('astar', open, at(2, 1), at(2, 1)), /^对：/);
  assert.match(explainPrediction('bfs', open, at(2, 3), at(0, 1)), /先进先出.*排队号是 1/);
  assert.throws(() => explainChoice(open, at(2, 3)));
});

test('quiz answers agree with the engine priority rule', () => {
  for (const question of PRIMER_QUIZ) assert.ok(question.answer >= 0 && question.answer < question.options.length);
  assert.ok(new Set(PRIMER_QUIZ.filter(item => item.stage === 'final').map(item => item.answer)).size > 1, 'final answers must not all sit in one position');
  const pick = cells => [...cells].sort(comparePriority)[0].name;
  assert.equal(pick([{ name: 'A', f: 6, h: 2, entrySequence: 0 }, { name: 'B', f: 6, h: 4, entrySequence: 1 }, { name: 'C', f: 5, h: 5, entrySequence: 2 }]), 'C');
  assert.equal(pick([{ name: 'A', f: 6, h: 2, entrySequence: 1 }, { name: 'B', f: 6, h: 4, entrySequence: 0 }]), 'A');
  assert.deepEqual(PRIMER_QUIZ.filter(item => item.stage === 'final').map(item => item.id), ['q-f', 'q-order', 'q-tie-final', 'q-estimate', 'q-compare']);
});
