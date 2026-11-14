import test from 'node:test';
import assert from 'node:assert/strict';
import { runAstar } from '../src/domain/algorithms/astar.ts';
import { DESIGN_BASE, DESIGN_BUDGET, DRAW_LEVELS, QUICK_ROUNDS, TOWN, editPath, judgePath, planWalk, quickAnswer, scoreDesign, toggleWall } from '../src/domain/game.ts';
import { VIDEO_GRAPH, runGraphAstar } from '../src/domain/learning/weighted-graph.ts';

test('the video worked example reproduces the table shown in the lesson video', () => {
  const run = runGraphAstar(VIDEO_GRAPH);
  assert.deepEqual(run.path, ['S', 'B', 'D', 'T']);
  assert.equal(run.cost, 9);
  assert.deepEqual(run.steps.map(step => step.picked.id), ['S', 'B', 'D', 'T']);
  assert.deepEqual(run.steps.map(step => step.open.map(entry => entry.id + entry.f)), [['S6'], ['B6', 'A11'], ['D7', 'C10', 'A11'], ['T9', 'C10', 'A11']]);
  const rows = Object.fromEntries(run.steps.flatMap(step => step.updates.map(update => [update.entry.id, [update.entry.g, update.entry.h, update.entry.f, update.entry.parent]])));
  assert.deepEqual(rows, { A: [1, 10, 11, 'S'], B: [4, 2, 6, 'S'], C: [5, 5, 10, 'B'], D: [6, 1, 7, 'B'], T: [9, 0, 9, 'D'] });
});

test('every drawing level is solvable and stars compare against the real A* optimum', () => {
  for (const level of DRAW_LEVELS) {
    const optimal = runAstar(level.input);
    assert.equal(optimal.status, 'found', level.id);
    const best = judgePath(level.input, optimal.path);
    assert.equal(best.stars, 3);
    assert.equal(best.steps, optimal.metrics.pathLength);
    assert.ok(best.bfsExpanded >= best.astarExpanded, level.id);
    assert.equal(judgePath(level.input, [level.input.start]).stars, 0);
  }
});

test('path drawing only accepts adjacent open cells and rewinds when an earlier cell is clicked', () => {
  const { input } = DRAW_LEVELS[0];
  assert.deepEqual(editPath(input, [input.start], { x: 2, y: 2 }), { ok: false, reason: 'not_adjacent' });
  const step = editPath(input, [input.start], { x: 1, y: 2 });
  assert.equal(step.ok, true);
  const two = editPath(input, step.path, { x: 2, y: 2 });
  assert.deepEqual(editPath(input, two.path, { x: 3, y: 2 }), { ok: false, reason: 'wall' });
  assert.deepEqual(editPath(input, two.path, input.start), { ok: true, path: [input.start] });
});

test('quick-quiz answers follow f, then h, then entry order, and are not all in the same slot', () => {
  const answers = QUICK_ROUNDS.map(quickAnswer);
  assert.ok(answers.every(index => index >= 0));
  assert.deepEqual(answers, [0, 2, 2, 0, 2, 2, 1, 0]);
  assert.ok(new Set(answers).size >= 3);
});

test('maze designer enforces the wall budget, protects endpoints and refuses to score a blocked map', () => {
  assert.deepEqual(toggleWall(DESIGN_BASE, [], DESIGN_BASE.start), { ok: false, reason: 'endpoint' });
  const full = Array.from({ length: DESIGN_BUDGET }, (_, x) => ({ x: x + 1, y: 0 }));
  assert.deepEqual(toggleWall(DESIGN_BASE, full, { x: 1, y: 6 }), { ok: false, reason: 'budget' });
  assert.equal(toggleWall(DESIGN_BASE, full, { x: 1, y: 0 }).walls.length, DESIGN_BUDGET - 1);
  assert.equal(scoreDesign(DESIGN_BASE, []).stars, 0);
  const sealed = [{ x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 }, { x: 8, y: 2 }, { x: 8, y: 4 }];
  assert.equal(scoreDesign(DESIGN_BASE, sealed).status, 'unreachable');
  assert.equal(scoreDesign(DESIGN_BASE, sealed).stars, 0);
  const pocket = [{ x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 }, { x: 5, y: 2 }, { x: 5, y: 4 }, { x: 7, y: 3 }];
  assert.ok(scoreDesign(DESIGN_BASE, pocket).stars >= 1);
});

test('town click-to-move reaches every road cell and refuses buildings', () => {
  TOWN.grid.rows.forEach((row, y) => [...row].forEach((cell, x) => {
    const plan = planWalk(TOWN, TOWN.start, { x, y });
    assert.equal(plan === null, cell === '#', x + ',' + y);
  }));
});
