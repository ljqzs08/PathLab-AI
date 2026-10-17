/** Synthetic AI tests: never a record of a human learner. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LearningSession } from '../src/domain/learning/session.ts';
import { runBfs } from '../src/domain/algorithms/bfs.ts';
import { runAstar } from '../src/domain/algorithms/astar.ts';
import { createProgress, restoreProgress, MAX_PROGRESS_BYTES, MAX_PROGRESS_COMMANDS } from '../src/domain/learning/progress.ts';
import { ProgressStore, PROGRESS_KEY } from '../src/domain/learning/progress-store.ts';

const levels=JSON.parse(readFileSync(new URL('../fixtures/levels.json',import.meta.url),'utf8'));
const at='2026-10-17T09:00:00.000Z';
const make=()=>new Map(levels.map(l=>[l.id,new LearningSession(l,l.algorithms[0])]));
const act=(s,a)=>s.dispatch(a,at);
const start=(s,id)=>act(s,{type:'start_valid_run',runId:id,sessionId:'storage-test'});
function answer(s) {
  const v=s.view(), next=(v.algorithm==='bfs'?runBfs:runAstar)(v.input).events.filter(e=>e.type==='node_selected')[v.metrics.selectionCount].payload.node;
  return act(s,{type:'submit_valid_choice',selected:next,elapsedBucket:'under_10s'});
}
function finish(s) { for(let n=0;n<2000;n++) { const v=s.view();if(v.state==='reflection')return v;if(v.state==='prediction')answer(s);else act(s,{type:'step'}); } throw Error('guard'); }
const save=(sessions,id='L01')=>createProgress(levels,sessions,id,at);
const load=text=>restoreProgress(text,levels,at);
function disk(value=null) { return {value,writes:0,getItem(key){assert.equal(key,PROGRESS_KEY);return this.value;},setItem(key,value){assert.equal(key,PROGRESS_KEY);this.value=value;this.writes++;}}; }

test('all six task/algorithm combinations restore unanswered gates and hints without private future answers',()=>{
  for(const l of levels)for(const a of l.algorithms){
    const sessions=make(), s=new LearningSession(l,a);sessions.set(l.id,s);start(s,l.id+'-'+a);act(s,{type:'request_hint'});
    const text=save(sessions,l.id), raw=JSON.parse(text), restored=load(text);
    assert.equal(raw.schemaVersion,1);assert.equal(raw.algorithmVersion,'1.0.0');assert.equal(restored.selectedId,l.id);
    assert.deepEqual(restored.sessions.get(l.id).view(),s.view());
    const checkpoint=raw.sessions.find(x=>x.levelId===l.id);
    assert.ok(checkpoint.commands.length>0);
    assert.doesNotMatch(JSON.stringify(checkpoint),/"(actual|trace|cursor|metrics|firstAttempts|completedRuns|report)"/);
    assert.throws(()=>act(restored.sessions.get(l.id),{type:'step'}));
    assert.equal(s.view().lastPrediction,null);
  }
});

test('running restores paused with a restore-reason event; counterfactual restores reflection',()=>{
  const sessions=make(),s=sessions.get('L01');start(s,'resume');answer(s);assert.equal(s.view().state,'paused');
  act(s,{type:'play',speed:2});const before=s.view(), restored=load(save(sessions)).sessions.get('L01');
  assert.equal(restored.view().state,'paused');assert.deepEqual(restored.view().metrics,before.metrics);assert.equal(restored.view().speed,2);
  assert.deepEqual(restored.view().events.at(-1).payload,{reason:'restore'});
  assert.deepEqual(load(save(new Map([...sessions].map(([id,v])=>[id,id==='L01'?restored:v])))).sessions.get('L01').view(),restored.view());
  finish(restored);act(restored,{type:'experiment'});sessions.set('L01',restored);
  assert.equal(load(save(sessions)).sessions.get('L01').view().state,'reflection');
});

test('reports, changed-map briefing, first attempts and revision/retry identities survive reconstruction and reset',()=>{
  const sessions=make(),s=sessions.get('L01');start(s,'base');finish(s);act(s,{type:'experiment'});act(s,{type:'apply_valid_change',change:levels[0].counterfactual});
  assert.deepEqual(load(save(sessions)).sessions.get('L01').view(),s.view());
  start(s,'changed');const done=finish(s),ids=done.events.filter(e=>['counterfactual_applied','run_finished'].includes(e.type)).map(e=>e.eventId);
  act(s,{type:'complete_reflection',explanation:'合成存档检查：按真实前后指标比较。',evidenceEventIds:ids});
  const restored=load(save(sessions)).sessions.get('L01');assert.deepEqual(restored.view(),s.view());
  act(restored,{type:'reset_task'});assert.equal(restored.view().reports.length,1);const first=restored.view().firstAttempts;
  start(restored,'again');const v=answer(restored);assert.equal(v.lastPrediction.retryCount,1);assert.deepEqual(v.firstAttempts,first);
});

test('checkpoint copies are isolated and rejected actions are not recorded',()=>{
  const s=new LearningSession(levels[0],'bfs');const a=s.checkpoint();a.commands.push({kind:'action',action:{type:'tick'},at});
  assert.deepEqual(s.checkpoint().commands,[]);assert.throws(()=>act(s,{type:'tick'}));assert.deepEqual(s.checkpoint().commands,[]);
});

test('rejects malformed, oversized, unknown-version and incompatible inputs before replacing live sessions',()=>{
  const sessions=make(),valid=save(sessions), source=JSON.parse(valid);
  const invalid=[null,[],{}, {...source,schemaVersion:2},{...source,algorithmVersion:'9'}, {...source,catalogSignature:'changed'}, {...source,selectedId:'L99'}, {...source,sessions:source.sessions.slice(1)}, {...source,sessions:[source.sessions[0],...source.sessions.slice(0,3)]}, {...source,extra:'no'}, {...source,savedAt:'not-time'}];
  for(const raw of invalid)assert.throws(()=>load(JSON.stringify(raw)));
  assert.throws(()=>load('{broken'));assert.throws(()=>load(' '.repeat(MAX_PROGRESS_BYTES+1)));assert.throws(()=>load('中'.repeat(Math.ceil(MAX_PROGRESS_BYTES/3))));
  const many=structuredClone(source);many.sessions[0].commands=Array(MAX_PROGRESS_COMMANDS+1).fill({kind:'action',at,action:{type:'reset_task'}});assert.throws(()=>load(JSON.stringify(many)));
  assert.deepEqual(sessions.get('L01').view().events,[]);
});

test('rejects fabricated outcomes, credentials, invalid timestamps and illegal replay, not just malformed JSON',()=>{
  const sessions=make(),s=sessions.get('L01');start(s,'private');const source=JSON.parse(save(sessions));
  const mutations=[
    r=>r.sessions[0].commands.push({kind:'action',at,action:{type:'step'}}),
    r=>r.sessions[0].commands.push({kind:'action',at,action:{type:'submit_valid_choice',selected:{x:-1,y:1},elapsedBucket:'under_10s'}}),
    r=>r.sessions[0].commands[0].action.actual={x:1,y:1},
    r=>r.sessions[0].commands[0].action.apiKey='not-a-real-key',
    r=>r.sessions[0].commands.push({kind:'configure',algorithm:'astar'}),
    r=>r.sessions[0].commands.push({kind:'action',at,action:{type:'complete_reflection',explanation:'forged',evidenceEventIds:['forged']}}),
    r=>r.sessions[0].commands[0].action.type='finish',
    r=>r.sessions[0].commands[0].at='2026-99-01',
  ];
  for(const change of mutations){const raw=structuredClone(source);change(raw);assert.throws(()=>load(JSON.stringify(raw)));}
  const unknown=JSON.parse(save(sessions));unknown.sessions[0].commands.push(JSON.parse('{"kind":"action","at":"'+at+'","action":{"type":"reset_task","__proto__":{"polluted":true}}}'));
  assert.throws(()=>load(JSON.stringify(unknown)));assert.equal({}.polluted,undefined);
});

test('browser store loads once, autosaves one isolated key and retains a corrupt original without overwriting',()=>{
  const d=disk('{broken'),store=new ProgressStore(levels);store.load(d,at);const initial=store.getSnapshot();
  assert.equal(initial.ready,true);assert.equal(initial.protected,true);store.select('L02',at);assert.equal(d.writes,0);assert.equal(d.value,'{broken');
  store.load(d,at);assert.equal(store.getSnapshot().selectedId,'L02');assert.equal(store.rawBackup(),'{broken');
  const out=store.export(at);assert.equal(load(out).selectedId,'L02');assert.equal(d.writes,0);
});

test('storage unavailable and quota errors keep actions usable in memory and do not report a successful save',()=>{
  const inaccessible=new ProgressStore(levels);inaccessible.load({getItem(){throw Error('denied');},setItem(){throw Error('denied');}},at);
  inaccessible.select('L02',at);assert.equal(inaccessible.getSnapshot().selectedId,'L02');assert.equal(inaccessible.getSnapshot().saveState,'memory');
  const d=disk(),store=new ProgressStore(levels);store.load(d,at);d.setItem=()=>{throw Error('quota');};start(store.getSnapshot().sessions.get('L01'),'quota');store.changed(at);
  assert.equal(store.getSnapshot().saveState,'memory');assert.equal(store.getSnapshot().sessions.get('L01').view().state,'prediction');assert.equal(d.value,null);
});

test('cross-tab changes cannot be silently overwritten; explicit replacement and reload are deliberate',()=>{
  const d=disk(),store=new ProgressStore(levels);store.load(d,at);store.select('L02',at);const own=d.value;
  const other=make();d.value=createProgress(levels,other,'L03',at);const external=d.value;store.select('L04',at);
  assert.equal(d.value,external);assert.equal(store.getSnapshot().protected,true);assert.equal(store.getSnapshot().selectedId,'L04');
  store.reload(at);assert.equal(store.getSnapshot().selectedId,'L03');assert.equal(d.value,external);assert.notEqual(own,external);
  store.select('L02',at);assert.equal(load(d.value).selectedId,'L02');
});

test('validated import is atomic and does not silently replace protected browser data',()=>{
  const d=disk(),store=new ProgressStore(levels);store.load(d,at);const before=store.getSnapshot();assert.throws(()=>store.import('{bad',at));assert.equal(store.getSnapshot(),before);
  const sessions=make();start(sessions.get('L03'),'imported');const valid=createProgress(levels,sessions,'L03',at);store.import(valid,at);assert.equal(store.getSnapshot().selectedId,'L03');assert.equal(load(d.value).sessions.get('L03').view().state,'prediction');
  const broken=disk('{keep'),protectedStore=new ProgressStore(levels);protectedStore.load(broken,at);protectedStore.import(valid,at);assert.equal(broken.value,'{keep');assert.equal(protectedStore.getSnapshot().selectedId,'L03');
  protectedStore.replaceStorage(at);assert.equal(load(broken.value).selectedId,'L03');
});
