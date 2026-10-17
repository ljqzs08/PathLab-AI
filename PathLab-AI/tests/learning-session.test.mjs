import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020.js';
import { LearningSession, SessionError } from '../src/domain/learning/session.ts';
import { runBfs } from '../src/domain/algorithms/bfs.ts';
import { runAstar } from '../src/domain/algorithms/astar.ts';

const levels = JSON.parse(readFileSync(new URL('../fixtures/levels.json', import.meta.url), 'utf8'));
const schema = JSON.parse(readFileSync(new URL('../contracts/event.schema.json', import.meta.url), 'utf8'));
const validEvent = new Ajv({ allErrors: true, strict: true }).compile(schema);
const at = '2026-10-17T08:00:00.000Z'; // Explicitly synthetic controller-test context, not learner history.
const start = (session, runId = 'test-run') => session.dispatch({ type: 'start_valid_run', runId, sessionId: 'test-session' }, at);
const search = (view) => (view.algorithm === 'bfs' ? runBfs : runAstar)(view.input);
const engineTypes = new Set(['node_discovered', 'node_relaxed', 'node_selected', 'node_expanded', 'node_skipped', 'frontier_snapshot', 'path_updated', 'run_finished']);
const engineEvents = (view) => view.events.filter(e => engineTypes.has(e.type)).map(({ step, type, payload }) => ({ step, type, payload }));
const nextActual = (view, trace) => trace.slice(engineEvents(view).length).find(e => e.type === 'node_selected')?.payload.node;
const submit = (session, selected) => session.dispatch({ type: 'submit_valid_choice', selected, elapsedBucket: 'under_10s' }, at);
function finish(session, firstWrong = false) {
  let view = session.view(), n = 0;
  while (view.state !== 'reflection') {
    assert.ok(n++ < 1000, 'controller must terminate');
    if (view.state === 'prediction') {
      const actual = nextActual(view, search(view).events);
      const choice = firstWrong ? view.checkpoint.candidates.find(c => JSON.stringify(c.node) !== JSON.stringify(actual)).node : actual;
      firstWrong = false;
      view = submit(session, choice);
    } else if (view.state === 'paused') view = session.dispatch({ type: 'play', speed: 4 }, at);
    else view = session.dispatch({ type: 'tick' }, at);
  }
  return view;
}

test('briefing exposes no precomputed result; input and projections are independent copies', () => {
  const level = structuredClone(levels[0]);
  const session = new LearningSession(level, 'bfs');
  let view = session.view();
  assert.equal(view.state, 'briefing'); assert.deepEqual(view.events, []);
  assert.deepEqual(view.path, []); assert.equal(view.outcome, null); assert.equal(view.metrics.pathLength, null);
  level.grid.rows[0] = 'invalid'; view.input.grid.rows[0] = 'invalid';
  view = start(session);
  assert.equal(view.state, 'prediction'); assert.equal(view.metrics.selectionCount, 1);
  view.frontier.length = 0; view.events[0].payload.gridRevision = 999;
  assert.notEqual(session.view().events[0].payload.gridRevision, 999);
  assert.ok(session.view().frontier.length >= 2);
});

test('every planned mission gates a genuine prefix, candidates are coordinate-ordered and no actual is exposed', () => {
  for (const level of levels) for (const algorithm of level.algorithms) {
    const session = new LearningSession(level, algorithm);
    let view = start(session), trace = search(view).events, guard = 0;
    while (view.state !== 'reflection') {
      assert.ok(guard++ < 200);
      const revealed = engineEvents(view);
      assert.deepEqual(revealed, trace.slice(0, revealed.length));
      assert.equal(view.outcome, null); assert.equal(view.metrics.pathLength, null);
      assert.equal(view.events.some(e => e.type === 'run_finished'), false);
      if (view.state === 'prediction') {
        assert.ok(view.checkpoint.candidates.length >= 2 && view.checkpoint.candidates.length <= 4);
        assert.equal('actual' in view.checkpoint, false);
        const candidates = view.checkpoint.candidates;
        assert.deepEqual(candidates, [...candidates].sort((a,b) => a.node.y-b.node.y || a.node.x-b.node.x));
        assert.ok(candidates.some(c => JSON.stringify(c.node) === JSON.stringify(nextActual(view, trace))));
        const before = view.metrics.selectionCount;
        view = submit(session, nextActual(view, trace));
        assert.equal(view.metrics.selectionCount, before + 1);
      } else if (view.state === 'paused') view = session.dispatch({ type: 'step' }, at);
      else assert.fail('single-step flow should not be running');
    }
    assert.deepEqual(engineEvents(view), trace);
    assert.deepEqual(view.metrics, search(view).metrics);
    assert.deepEqual(view.path, search(view).path);
    assert.equal(view.predictions.length, 2);
    assert.equal(view.completedRuns.length, 1);
    for (const [i, event] of view.events.entries()) {
      assert.equal(validEvent(event), true, JSON.stringify(validEvent.errors));
      assert.equal(event.eventId, 'test-run:' + i);
      assert.equal(event.createdAt, at);
    }
  }
});

test('invalid actions, invisible choices, repeated submits and invalid metadata cannot mutate a session', () => {
  const session = new LearningSession(levels[0], 'bfs');
  assert.throws(() => session.dispatch({ type: 'step' }, at), SessionError);
  assert.throws(() => session.dispatch({ type: 'start_valid_run', runId: '', sessionId: 'x' }, at), SessionError);
  assert.throws(() => session.dispatch({ type: 'start_valid_run', runId: 'x', sessionId: 'x' }, 'bad-date'), SessionError);
  const view = start(session);
  for (const action of [{type:'step'}, {type:'play',speed:1}, {type:'finish'}, {type:'submit_valid_choice',selected:{x:99,y:99},elapsedBucket:'under_10s'}]) {
    assert.throws(() => session.dispatch(action, at), SessionError);
    assert.deepEqual(session.view(), view);
  }
  submit(session, view.checkpoint.candidates[0].node);
  const after = session.view();
  assert.throws(() => submit(session, view.checkpoint.candidates[0].node), SessionError);
  assert.deepEqual(session.view(), after);
});

test('playback stops before the second checkpoint; each tick/step is one effective selection batch', () => {
  const session = new LearningSession(levels[1], 'astar');
  let view = start(session);
  view = submit(session, view.checkpoint.candidates[0].node);
  assert.equal(view.metrics.selectionCount, 2);
  session.dispatch({ type: 'play', speed: 4 }, at);
  view = session.dispatch({ type: 'tick' }, at);
  assert.equal(view.metrics.selectionCount, 3); assert.equal(view.state, 'prediction');
  assert.equal(view.checkpoint.id, 'L02-P2');
  assert.throws(() => session.dispatch({ type: 'tick' }, at), SessionError);
  submit(session, view.checkpoint.candidates[0].node);
  session.dispatch({ type: 'play', speed: 1 }, at);
  view = session.dispatch({ type: 'pause' }, at);
  const count = view.metrics.selectionCount;
  assert.throws(() => session.dispatch({ type: 'tick' }, at), SessionError);
  assert.equal(session.dispatch({ type: 'step' }, at).metrics.selectionCount, count + 1);
});

test('three pre-answer hint levels reveal rules only and submission records actual support used', () => {
  const session = new LearningSession(levels[1], 'astar');
  start(session);
  for (const n of [1,2,3]) {
    const view = session.dispatch({ type: 'request_hint' }, at);
    assert.equal(view.checkpoint.hintLevel, n);
    assert.ok(view.checkpoint.hint.length > 0);
    assert.equal(view.predictions.length, 0);
    assert.equal(view.events.some(e => e.type === 'prediction_submitted'), false);
  }
  assert.throws(() => session.dispatch({ type: 'request_hint' }, at), SessionError);
  const view = session.view();
  const submitted = submit(session, view.checkpoint.candidates[0].node);
  assert.equal(submitted.predictions[0].hintLevel, 3);
  assert.ok(submitted.lastPrediction.actual);
});

test('reset preserves completed summaries and first-attempt accuracy; later attempts cannot overwrite it', () => {
  const session = new LearningSession(levels[0], 'bfs');
  let view = start(session);
  const actual = nextActual(view, search(view).events);
  const wrong = view.checkpoint.candidates.find(c => JSON.stringify(c.node) !== JSON.stringify(actual)).node;
  submit(session, wrong); finish(session);
  const firstStats = session.view().firstAttempts;
  assert.equal(firstStats.correct, 1); assert.equal(firstStats.total, 2);
  view = session.dispatch({ type: 'reset_task' }, at);
  assert.equal(view.state, 'briefing'); assert.deepEqual(view.events, []);
  assert.equal(view.completedRuns.length, 1); assert.deepEqual(view.firstAttempts, firstStats);
  assert.throws(() => start(session), SessionError);
  start(session, 'test-run-2'); view = finish(session);
  assert.deepEqual(view.firstAttempts, firstStats);
  assert.equal(view.predictions[0].retryCount, 1);
  assert.equal(view.completedRuns.length, 2);
  assert.equal(view.completedRuns[0].predictions[0].correct, false);
});

test('unreachable and equal endpoints finish without a fake prediction or bypass control', () => {
  for (const equal of [false,true]) {
    const level = { ...structuredClone(levels[0]), grid: {width:2,height:1,rows:[equal?'..':'.#']}, start:{x:0,y:0}, goal:{x:0,y:0} };
    if (!equal) { level.grid={width:3,height:1,rows:['.#.']}; level.goal={x:2,y:0}; }
    const session = new LearningSession(level, 'bfs');
    const view = start(session);
    assert.equal(view.state, 'reflection'); assert.equal(view.predictions.length, 0);
    assert.equal(view.skippedCheckpoints.length, 2);
    assert.equal(view.outcome, equal ? 'found' : 'unreachable');
    assert.equal(view.metrics.pathLength, equal ? 0 : null);
  }
});

test('algorithm whitelist and active-run freeze are enforced, not just disabled UI buttons', () => {
  assert.throws(() => new LearningSession(levels[0], 'astar'), SessionError);
  const session = new LearningSession(levels[1], 'bfs');
  assert.equal(session.configureAlgorithm('astar').algorithm, 'astar');
  start(session);
  assert.throws(() => session.configureAlgorithm('bfs'), SessionError);
  assert.equal(session.view().algorithm, 'astar');
});

test('same supplied actions and context are reproducible; controller does not require browser or clock', () => {
  const run = () => { const session = new LearningSession(levels[3], 'astar'); start(session); return finish(session); };
  assert.deepEqual(run(), run());
});

test('all 128 tiny fixed-endpoint layouts terminate and expose no future terminal facts at checkpoints', () => {
  for (let mask=0; mask<128; mask++) {
    const cells=Array(9).fill('.'); let bit=0;
    for (let i=1;i<8;i++) cells[i]=(mask & (1<<bit++))?'#':'.';
    const level={...structuredClone(levels[0]),grid:{width:3,height:3,rows:[cells.slice(0,3).join(''),cells.slice(3,6).join(''),cells.slice(6,9).join('')]},start:{x:0,y:0},goal:{x:2,y:2}};
    const session=new LearningSession(level,'bfs'); start(session);
    const view=finish(session);
    assert.deepEqual(engineEvents(view), runBfs(view.input).events);
  }
});
