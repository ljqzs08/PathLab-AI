import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LearningSession } from '../src/domain/learning/session.ts';
import { runBfs } from '../src/domain/algorithms/bfs.ts';
import { runAstar } from '../src/domain/algorithms/astar.ts';
import { buildWebReviewPrompt, webReviewChoices } from '../src/domain/learning/web-review.ts';
const levels = JSON.parse(readFileSync(new URL('../fixtures/levels.json', import.meta.url), 'utf8'));
const at = '2026-10-17T10:00:00.000Z'; // Synthetic AI evidence only.
const act = (s, a) => s.dispatch(a, at);
function finish(s, id) {
  act(s, { type: 'start_valid_run', runId: id, sessionId: 'synthetic-web-review' });
  for (let n = 0; n < 2000; n++) {
    const v = s.view();
    if (v.state === 'reflection') return v;
    if (v.state === 'prediction') {
      const result = (v.algorithm === 'bfs' ? runBfs : runAstar)(v.input);
      const selected = result.events.filter(e => e.type === 'node_selected')[v.metrics.selectionCount].payload.node;
      act(s, { type: 'submit_valid_choice', selected, elapsedBucket: 'under_10s' });
    } else act(s, { type: 'step' });
  }
  throw new Error('Synthetic run did not terminate');
}
for (const level of levels) for (const algorithm of level.algorithms) {
  test(`web review deterministic revealed facts: ${level.id}/${algorithm}`, () => {
    const s = new LearningSession(level, algorithm), v = finish(s, 'private-base-id');
    const request = v.diagnosis.request, before = structuredClone(request);
    for (const focus of webReviewChoices.map(c => c.id)) for (const detail of ['brief', 'guided']) {
      const text = buildWebReviewPrompt(request, { focus, detail });
      assert.equal(text, buildWebReviewPrompt(request, { focus, detail }));
      assert.ok(text.includes(`已提交预测 ${request.facts.predictionCount} 次`));
      assert.ok(text.includes(algorithm === 'bfs' ? 'FIFO' : 'f = g + h'));
      assert.ok(text.includes('缺少完整的前后对照'));
      assert.ok(text.includes('不是耗时'));
      assert.ok(text.includes('[F1]'));
      assert.ok(!text.includes('private-base-id'));
      assert.ok(text.length < 12000);
    }
    assert.deepEqual(request, before);
    act(s, { type: 'experiment' }); act(s, { type: 'apply_valid_change', change: level.counterfactual });
    const changed = finish(s, 'private-change-id');
    const prompt = buildWebReviewPrompt(changed.diagnosis.request, { focus: 'experiment', detail: 'guided' }, changed.comparison);
    assert.ok(prompt.includes('[C1]'));
    assert.ok(prompt.includes(`扩展节点 ${changed.metrics.expandedCount}`));
    assert.ok(!prompt.includes('private-base-id')); assert.ok(!prompt.includes('private-change-id'));
    const stale = buildWebReviewPrompt(request, { focus: 'experiment', detail: 'brief' }, changed.comparison);
    assert.ok(!stale.includes('[C1]'));
    assert.ok(stale.includes('缺少完整的前后对照'));
  });
}
test('web review excludes unselected free text and arbitrary metadata; does not mutate reports', () => {
  const v = finish(new LearningSession(levels[0], 'bfs'), 'base');
  const request = { ...v.diagnosis.request, explanation: 'PRIVATE_EXPLANATION', apiKey: 'PRIVATE_KEY', account: 'PRIVATE_ACCOUNT' };
  const text = buildWebReviewPrompt(request, { focus: 'prediction', detail: 'brief' });
  assert.ok(!text.includes('PRIVATE_')); assert.ok(!text.includes('candidateErrorTypes'));
  assert.throws(() => buildWebReviewPrompt({ ...request, answerRevealed: false }, { focus: 'prediction', detail: 'brief' }));
  assert.throws(() => buildWebReviewPrompt({ ...request, facts: { ...request.facts, events: [] } }, { focus: 'prediction', detail: 'brief' }));
});
test('web review accurately handles zero predictions and missing path length without inventing a percentage', () => {
  const v = finish(new LearningSession(levels[0], 'bfs'), 'base');
  const request = structuredClone(v.diagnosis.request);
  request.facts.predictionCount = 0; request.facts.correctCount = 0;
  request.facts.events = [{ eventId: 'end', type: 'run_finished', description: '本次搜索不可达，步数为空；扩展节点 1。步数和扩展数不是耗时。' }];
  const text = buildWebReviewPrompt(request, { focus: 'algorithm', detail: 'brief' });
  assert.ok(text.includes('已提交预测 0 次')); assert.ok(text.includes('不可达')); assert.ok(!text.includes('NaN'));
});
