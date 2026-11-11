import test from 'node:test';
import assert from 'node:assert/strict';
import { comparePriority } from '../src/domain/algorithms/priorityQueue.ts';
import { buildPrimerTrace } from '../src/domain/learning/astar-primer.ts';
import { CONCEPTS, POST_TEST, PRE_TEST, answerIndex, buildReport, classifyMistake, decisionStages, explainItem, gradeItem, reportText } from '../src/domain/learning/mastery.ts';

const cell = (label, g, h, entrySequence) => ({ label, g, h, f: g + h, entrySequence });
const trace = buildPrimerTrace();

test('pre-test and post-test are parallel forms: same concepts in the same order, different numbers', () => {
  assert.deepEqual(PRE_TEST.map(item => item.concept), POST_TEST.map(item => item.concept));
  assert.deepEqual(new Set(PRE_TEST.map(item => item.concept)), new Set(Object.keys(CONCEPTS)));
  for (const [index, before] of PRE_TEST.entries()) {
    const after = POST_TEST[index];
    assert.equal(before.kind, after.kind);
    assert.notDeepEqual(before, after);
    if (before.kind === 'pick') assert.notDeepEqual(before.candidates.map(c => [c.g, c.h]), after.candidates.map(c => [c.g, c.h]));
  }
  for (const form of [PRE_TEST, POST_TEST]) assert.ok(new Set(form.map(answerIndex)).size >= 3, 'answers must not cluster in one option position');
});

test('every pick item is answered by the engine priority rule and actually needs its target rule', () => {
  for (const item of [...PRE_TEST, ...POST_TEST].filter(item => item.kind === 'pick')) {
    const winner = [...item.candidates].sort(comparePriority)[0];
    assert.equal(item.candidates[answerIndex(item)], winner);
    for (const c of item.candidates) assert.equal(c.f, c.g + c.h);
    const last = decisionStages(item.candidates).at(-1).rule;
    assert.equal(last, { lowest_f: 'f', tie_h: 'h', tie_sequence: 'sequence' }[item.concept], item.id);
    // Neither "closest to goal" nor "fewest steps so far" gives the right answer: the item really tests f = g + h.
    const minH = Math.min(...item.candidates.map(c => c.h));
    const minG = Math.min(...item.candidates.map(c => c.g));
    if (item.concept === 'lowest_f') assert.ok(winner.h !== minH && winner.g !== minG, item.id);
    assert.match(explainItem(item), new RegExp('所以选 ' + winner.label));
  }
});

test('mistakes are named after the rule the learner skipped', () => {
  const pool = [cell('A', 3, 4, 1), cell('B', 6, 2, 2), cell('C', 2, 7, 3)];
  assert.equal(classifyMistake(pool, pool[0]), null);
  assert.equal(classifyMistake(pool, pool[1]), 'greedy_h');
  assert.equal(classifyMistake(pool, pool[2]), 'only_g');
  const tie = [cell('A', 4, 4, 1), cell('B', 6, 2, 2)];
  assert.equal(classifyMistake(tie, tie[0]), 'tie_h');
  const same = [cell('A', 5, 3, 3), cell('B', 5, 3, 1)];
  assert.equal(classifyMistake(same, same[0]), 'tie_sequence');
  const worse = [cell('A', 1, 1, 1), cell('B', 2, 2, 2)];
  assert.equal(classifyMistake(worse, worse[1]), 'f_compare');
});

test('decision stages replay how the real primer open lists were narrowed down', () => {
  for (const step of trace.steps) {
    const stages = decisionStages(step.open);
    const final = stages.at(-1);
    assert.equal(final.keep.length, 1);
    assert.equal(final.keep[0], step.selected);
    const expected = { only: 'only', lowest_f: 'f', tie_h: 'h', tie_sequence: 'sequence' }[step.reason];
    assert.equal(final.rule, expected);
    const out = stages.flatMap(stage => stage.out);
    assert.equal(out.length + 1, step.open.length, 'every other cell is eliminated exactly once');
  }
  assert.throws(() => decisionStages([]));
});

test('the mastery report compares pre and post per concept and groups misconceptions', () => {
  const answer = (form, wrongIds = []) => form.map(item => gradeItem(item, wrongIds.includes(item.id) ? (answerIndex(item) + 1) % (item.kind === 'pick' ? item.candidates.length : item.options.length) : answerIndex(item)));
  const pre = answer(PRE_TEST, ['pre-lowest', 'pre-tie-h', 'pre-tie-seq']);
  const post = answer(POST_TEST, ['post-tie-seq']);
  const report = buildReport(pre, post, [null, 'tie_h', null, 'tie_h'], 545);
  assert.equal(report.pre, 2);
  assert.equal(report.post, 4);
  assert.deepEqual(report.walk, { correct: 2, total: 4 });
  assert.equal(report.concepts.find(item => item.concept === 'lowest_f').status, 'learned');
  assert.equal(report.concepts.find(item => item.concept === 'score').status, 'kept');
  assert.equal(report.concepts.find(item => item.concept === 'tie_sequence').status, 'review');
  assert.equal(report.misconceptions[0].type, 'tie_h');
  assert.equal(report.misconceptions[0].count, 2);
  assert.ok(post.find(item => item.id === 'post-tie-seq').misconception);
  const text = reportText(report);
  assert.match(text, /学前测 2\/5 → 学后测 4\/5/);
  assert.match(text, /用时 9 分 5 秒/);
  const skipped = buildReport(null, post, [], null);
  assert.equal(skipped.pre, null);
  assert.match(reportText(skipped), /学前测 未做/);
});
