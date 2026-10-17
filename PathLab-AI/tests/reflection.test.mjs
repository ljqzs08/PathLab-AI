import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020.js';
import { LearningSession, SessionError } from '../src/domain/learning/session.ts';
import { buildLocalFeedback, assertFeedbackReferences } from '../src/domain/learning/diagnose.ts';
import { runBfs } from '../src/domain/algorithms/bfs.ts';
import { runAstar } from '../src/domain/algorithms/astar.ts';
import { validateFeedbackRelations } from '../scripts/contract-checks.mjs';

const levels = JSON.parse(readFileSync(new URL('../fixtures/levels.json', import.meta.url), 'utf8'));
const schema = name => JSON.parse(readFileSync(new URL('../contracts/' + name + '.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv({allErrors:true,strict:true});
const eventValid = ajv.compile(schema('event')), requestValid = ajv.compile(schema('feedback-request')), feedbackValid = ajv.compile(schema('feedback'));
const at = '2026-10-17T09:00:00.000Z'; // Synthetic AI test data, not human learning evidence.
const act = (s,a) => s.dispatch(a,at);
const start = (s,id) => act(s,{type:'start_valid_run',runId:id,sessionId:'test-session'});
const search = v => (v.algorithm==='bfs'?runBfs:runAstar)(v.input);
function finish(s, wrong=false) {
  let v=s.view(), guard=0;
  while(v.state!=='reflection') {
    assert.ok(guard++<2000);
    if(v.state==='prediction') {
      const actual=search(v).events.filter(e=>e.type==='node_selected')[v.metrics.selectionCount].payload.node;
      const selected=wrong ? v.checkpoint.candidates.find(c=>c.node.x!==actual.x||c.node.y!==actual.y).node : actual;
      v=act(s,{type:'submit_valid_choice',selected,elapsedBucket:'under_10s'});
    } else v=act(s,{type:'step'});
  }
  return v;
}
function run(s,id,wrong=false) { start(s,id);return finish(s,wrong); }
const facts = v => v.events.filter(e=>['run_finished','prediction_submitted','counterfactual_applied'].includes(e.type));
const report = (s,explanation='',evidenceEventIds=[]) => act(s,{type:'complete_reflection',explanation,evidenceEventIds});

test('all six allowed combinations preserve baseline and require a fresh gated condition run with linked evidence',()=>{
  for(const level of levels) for(const algorithm of level.algorithms) {
    const s=new LearningSession(level,algorithm), base=run(s,'baseline');
    act(s,{type:'experiment'});
    const changed=act(s,{type:'apply_valid_change',change:level.counterfactual});
    assert.equal(changed.state,'briefing');assert.notDeepEqual(changed.input,base.input);assert.equal(changed.gridRevision,1);
    assert.deepEqual(changed.completedRuns,base.completedRuns);assert.equal(changed.runId,null);assert.deepEqual(changed.events,[]);
    const before=start(s,'changed');assert.equal(before.state,'prediction');assert.equal(before.metrics.pathLength,null);assert.equal(before.outcome,null);
    const event=before.events.find(e=>e.type==='counterfactual_applied');
    assert.deepEqual(event.payload,{previousRunId:'baseline',previousGridRevision:0,newGridRevision:1,change:level.counterfactual});
    assert.equal(event.runId,'changed');assert.equal(event.gridRevision,1);
    const done=finish(s);assert.deepEqual(done.metrics,search(done).metrics);assert.equal(done.completedRuns.length,2);
    assert.deepEqual(done.completedRuns[0],base.completedRuns[0]);
    for(const e of done.events)assert.equal(eventValid(e),true,JSON.stringify(eventValid.errors));
    const r=report(s,'修改条件后，依据两次运行的实际步数和扩展数进行比较。',facts(done).map(e=>e.eventId));
    assert.equal(r.report.completion.recordComplete,true);
    assert.deepEqual(r.report.comparison.previous.metrics,base.metrics);assert.deepEqual(r.report.comparison.current.metrics,done.metrics);
    assert.equal(r.report.comparison.delta.expandedCount,done.metrics.expandedCount-base.metrics.expandedCount);
    assert.equal(r.report.comparison.delta.pathLength,done.metrics.pathLength-base.metrics.pathLength);
  }
});

test('condition edits are domain-validated atomically; active runs cannot edit and experiment keeps algorithm fixed',()=>{
  const s=new LearningSession(levels[1],'bfs');start(s,'base');
  const active=s.view();assert.throws(()=>act(s,{type:'experiment'}),SessionError);assert.deepEqual(s.view(),active);
  finish(s);act(s,{type:'experiment'});const original=s.view();
  const wallY=levels[1].grid.rows.findIndex(row=>row.includes('#')), wallX=levels[1].grid.rows[wallY].indexOf('#');
  const changes=[{type:'block_cell',cell:levels[1].start},{type:'block_cell',cell:levels[1].goal},{type:'block_cell',cell:{x:99,y:0}},{type:'move_goal',cell:levels[1].goal},{type:'move_goal',cell:{x:wallX,y:wallY}},{type:'unknown',cell:{x:0,y:0}},{type:'block_cell',cell:{x:0.5,y:0}},{type:'block_cell',cell:null},{type:'block_cell',cell:{x:0,y:0,hidden:'unexpected'}},{type:'move_goal',cell:{x:0,y:0},extra:true}];
  for(const change of changes){assert.throws(()=>act(s,{type:'apply_valid_change',change}));assert.deepEqual(s.view(),original);}
  act(s,{type:'apply_valid_change',change:levels[1].counterfactual});const changed=s.view();
  assert.throws(()=>s.configureAlgorithm('astar'),SessionError);assert.deepEqual(s.view(),changed);
});

test('experiment cancellation returns reflection even from report and preserves the report snapshot and history',()=>{
  const s=new LearningSession(levels[0],'bfs');run(s,'base');
  const partial=report(s);assert.equal(partial.state,'report');assert.equal(partial.report.completion.recordComplete,false);
  assert.equal(partial.report.completion.conditionRunCompleted,false);assert.equal(partial.report.completion.evidenceExplanationProvided,false);
  act(s,{type:'experiment'});const cancelled=act(s,{type:'cancel'});
  assert.equal(cancelled.state,'reflection');assert.deepEqual(cancelled.report,partial.report);assert.deepEqual(cancelled.reports,partial.reports);assert.equal(cancelled.completedRuns.length,1);
});

test('reset restores fixture revision identity; repeating identical condition cannot inflate first-attempt accuracy',()=>{
  const s=new LearningSession(levels[0],'bfs');const base=run(s,'base',true);
  act(s,{type:'experiment'});act(s,{type:'apply_valid_change',change:levels[0].counterfactual});const changed=run(s,'changed',true);
  const reset=act(s,{type:'reset_task'});assert.deepEqual(reset.input,base.input);assert.equal(reset.gridRevision,0);assert.deepEqual(reset.firstAttempts,changed.firstAttempts);
  const again=run(s,'base-again');assert.deepEqual(again.firstAttempts,changed.firstAttempts);assert.ok(again.predictions.every(p=>p.retryCount===1));
  act(s,{type:'experiment'});const repeated=act(s,{type:'apply_valid_change',change:levels[0].counterfactual});assert.equal(repeated.gridRevision,1);
  const final=run(s,'changed-again');assert.deepEqual(final.firstAttempts,changed.firstAttempts);assert.ok(final.predictions.every(p=>p.retryCount===1));assert.equal(final.completedRuns.length,4);
});

test('local diagnoses report observable FIFO mismatch only, never infer A-star mental causes or mastery',()=>{
  for(const level of levels)for(const algorithm of level.algorithms)for(const wrong of [false,true]){
    const s=new LearningSession(level,algorithm),done=run(s,'run',wrong);
    const {request,feedback}=buildLocalFeedback(done.completedRuns[0]);
    assert.equal(requestValid(request),true,JSON.stringify(requestValid.errors));assert.equal(feedbackValid(feedback),true,JSON.stringify(feedbackValid.errors));
    validateFeedbackRelations(request,feedback);assertFeedbackReferences(request,feedback);
    assert.equal(feedback.mode,'local');assert.equal(feedback.primaryErrorType,algorithm==='bfs'&&wrong?'misunderstand_queue_order':null);
    assert.equal(feedback.insufficientEvidence,!(algorithm==='bfs'&&wrong));
    assert.match(feedback.summary,/不能|证据不足|不证明|不编造/);
    for(const e of feedback.evidence)assert.ok(request.facts.events.some(f=>f.eventId===e.eventId));
  }
});

test('report requires real current-run references; partial text cannot masquerade as evidence and is never put in fact descriptions',()=>{
  const s=new LearningSession(levels[1],'astar'),base=run(s,'base');act(s,{type:'experiment'});act(s,{type:'apply_valid_change',change:levels[1].counterfactual});const done=run(s,'changed');
  for(const [explanation,ids]of [['证据',['invented']],['证据',[base.events.at(-1).eventId]],['证据',[]],['',[done.events.at(-1).eventId]],['x'.repeat(501),[done.events.at(-1).eventId]],['证据',[done.events.at(-1).eventId,done.events.at(-1).eventId]]]) {
    assert.throws(()=>report(s,explanation,ids),SessionError);assert.deepEqual(s.view(),done);
  }
  const secretText='<script>window.humanOnlyFreeText=true</script>';
  const v=report(s,secretText,facts(done).map(e=>e.eventId));assert.equal(v.report.explanation,secretText);
  assert.equal(JSON.stringify(v.report.request).includes(secretText),false);assert.equal(v.report.completion.recordComplete,true);
  assert.ok(v.events.some(e=>e.type==='reflection_completed'&&e.payload.explanation===secretText));
  for(const e of v.events)assert.equal(eventValid(e),true,JSON.stringify(eventValid.errors));
  const reflected=v.events.find(e=>e.type==='reflection_completed');assert.deepEqual(reflected.payload.evidenceEventIds,facts(done).map(e=>e.eventId));
  const changedView=s.view();changedView.report.request.facts.events[0].description='tampered';assert.notEqual(s.view().report.request.facts.events[0].description,'tampered');
});

test('feedback resolver rejects fabricated paths, IDs, labels and hint escalation',()=>{
  const s=new LearningSession(levels[0],'bfs'),v=run(s,'base',true),{request,feedback}=buildLocalFeedback(v.completedRuns[0]);
  for(const patch of [{evidence:[{eventId:'fake',factPath:'/facts/events/0/description'}]},{evidence:[{eventId:feedback.evidence[0].eventId,factPath:'/facts/events/00/description'}]},{primaryErrorType:'only_goal_distance'},{insufficientEvidence:true},{hintLevel:5}]){
    assert.throws(()=>assertFeedbackReferences(request,{...feedback,...patch}));
  }
});

test('unreachable and equal endpoints can generate honest partial reports without invented predictions',()=>{
  const fixture=structuredClone(levels[0]);fixture.grid={width:3,height:3,rows:['.##','###','##.']};fixture.start={x:0,y:0};fixture.goal={x:2,y:2};
  const s=new LearningSession(fixture,'bfs'),v=run(s,'edge');assert.equal(v.outcome,'unreachable');assert.equal(v.predictions.length,0);
  const r=report(s);assert.equal(r.report.completion.recordComplete,false);assert.equal(r.report.feedback.insufficientEvidence,true);assert.equal(r.report.feedback.primaryErrorType,null);
});

test('run metadata uses schema-compatible bounded IDs before any mutation',()=>{
  const s=new LearningSession(levels[0],'bfs'),v=s.view();
  for(const id of ['bad id','a'.repeat(91),'<script>','',undefined,null,123]){assert.throws(()=>start(s,id),SessionError);assert.deepEqual(s.view(),v);}
});
