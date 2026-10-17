import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import { validateLevelRelations, validateFeedbackRelations } from '../scripts/contract-checks.mjs';
const read = path => JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
const levelSchema=ajv.compile(read('contracts/level.schema.json'));
const eventSchema=ajv.compile(read('contracts/event.schema.json'));
const feedbackSchema=ajv.compile(read('contracts/feedback.schema.json'));
const requestSchema=ajv.compile(read('contracts/feedback-request.schema.json'));
const levels=read('fixtures/levels.json'); const machine=read('fixtures/state-machine.json');
const example=read('fixtures/feedback-example.json');
const copy=value=>structuredClone(value);
const expanded={schemaVersion:1,eventId:'fixture:0',sessionId:'fixture',runId:'fixture-run',levelId:'L01',gridRevision:0,algorithm:'bfs',algorithmVersion:'1.0.0',step:0,type:'node_expanded',payload:{node:{x:0,y:2}},createdAt:'2026-10-17T00:00:00.000Z'};
test('exactly four unique fixed missions validate structurally and relationally',()=>{assert.equal(levels.length,4);assert.equal(new Set(levels.map(l=>l.id)).size,4); for(const l of levels){assert(levelSchema(l),ajv.errorsText(levelSchema.errors));validateLevelRelations(l);}});
test('reject unknown level fields',()=>assert.equal(levelSchema({...levels[0],unknownField:'fixture'}),false));
test('reject malformed map widths',()=>{const l=copy(levels[0]);l.grid.rows[0]='..';assert.throws(()=>validateLevelRelations(l));});
test('reject blocked or out-of-bounds endpoints',()=>{for(const p of [{x:2,y:1},{x:99,y:0}]){const l=copy(levels[0]);l.start=p;assert.throws(()=>validateLevelRelations(l));}});
test('reject blocking start and unchanged goal',()=>{const l=copy(levels[0]);l.counterfactual={type:'block_cell',cell:l.start};assert.throws(()=>validateLevelRelations(l));l.counterfactual={type:'move_goal',cell:l.goal};assert.throws(()=>validateLevelRelations(l));});
test('checkpoints have stable increasing ordinals',()=>{const l=copy(levels[0]);l.checkpoints[1].beforeSelectionOrdinal=2;assert.throws(()=>validateLevelRelations(l));});
test('state table has known states and unique state/action pairs',()=>{const seen=new Set();for(const t of machine.transitions){assert(machine.states.includes(t.from));assert(machine.states.includes(t.to));const key=t.from+':'+t.action;assert(!seen.has(key));seen.add(key);}assert.equal(machine.initial,'idle');});
test('prediction submission cannot bypass directly to reflection/report',()=>{const t=machine.transitions.filter(t=>t.from==='prediction');assert(t.every(t=>t.to==='paused'));assert(t.some(t=>t.action==='submit_valid_choice'));});
test('running has no map editing transition and restore pauses playback',()=>{assert(!machine.transitions.some(t=>t.from==='running'&&['editing','counterfactual'].includes(t.to)));assert.equal(machine.restore.running,'paused');assert(machine.reset.preserve.includes('aggregatedLearningStats'));});
test('valid event and signed out-of-bounds skip payload validate',()=>{assert(eventSchema(expanded),ajv.errorsText(eventSchema.errors));assert(eventSchema({...expanded,type:'node_skipped',payload:{node:{x:-1,y:0},reason:'out_of_bounds'}}));});
test('wrong event payload and unknown event type are rejected',()=>{assert.equal(eventSchema({...expanded,type:'node_selected'}),false);assert.equal(eventSchema({...expanded,type:'made_up_event'}),false);});
test('prediction requested cannot include the hidden actual answer',()=>{const e={...expanded,type:'prediction_requested',payload:{checkpointId:'fixture-checkpoint',candidates:[{node:{x:0,y:1},entrySequence:1,distanceFromStart:1,g:1,h:7,f:8}],actual:{x:0,y:1}}};assert.equal(eventSchema(e),false);delete e.payload.actual;assert(eventSchema(e));});
test('synthetic feedback request/response validate and evidence resolves',()=>{assert(requestSchema(example.request),ajv.errorsText(requestSchema.errors));assert(feedbackSchema(example.response),ajv.errorsText(feedbackSchema.errors));validateFeedbackRelations(example.request,example.response);});
test('unknown output fields or fabricated error labels fail schema validation',()=>{assert.equal(feedbackSchema({...example.response,path:[]}),false);assert.equal(feedbackSchema({...example.response,primaryErrorType:'low_intelligence'}),false);});
test('nonexistent or mismatched evidence is rejected',()=>{for(const evidence of [{eventId:'nonexistent',factPath:'/facts/events/0/description'},{eventId:'fixture-run:12',factPath:'/facts/events/99/description'},{eventId:'fixture-run:12',factPath:'/facts/correctCount'}]){const r=copy(example.response);r.evidence=[evidence];assert.throws(()=>validateFeedbackRelations(example.request,r));}});
test('remote feedback before prediction reveal is rejected',()=>{const q=copy(example.request);q.answerRevealed=false;assert.throws(()=>validateFeedbackRelations(q,example.response));});
test('insufficient evidence may not assign an error',()=>{const r={...example.response,insufficientEvidence:true};assert.throws(()=>validateFeedbackRelations(example.request,r));r.primaryErrorType=null;r.evidence=[];validateFeedbackRelations(example.request,r);});
test('reject unrequested hint escalation and unsupported error inference',()=>{assert.throws(()=>validateFeedbackRelations(example.request,{...example.response,hintLevel:4}));assert.throws(()=>validateFeedbackRelations(example.request,{...example.response,primaryErrorType:'ignore_path_cost'}));});


// Synthetic payload representatives cover every schema branch, not production runs.
const c={node:{x:0,y:1},entrySequence:1,distanceFromStart:1,g:1,h:0,f:1};
const entry={node:c.node,entrySequence:c.entrySequence,g:c.g,h:c.h,f:c.f};
const payloads={
  mission_started:{gridRevision:0},
  prediction_requested:{checkpointId:'p1',candidates:[c]},
  prediction_submitted:{checkpointId:'p1',selected:c.node,actual:c.node,candidates:[c],correct:true,hintLevel:0,elapsedBucket:'under_10s',retryCount:0},
  node_discovered:{...entry,parent:{x:0,y:2}},
  node_relaxed:{...entry,parent:{x:0,y:2},previousG:3},
  node_selected:entry,
  node_expanded:{node:c.node},
  node_skipped:{node:c.node,reason:'already_discovered'},
  frontier_snapshot:{nodes:[entry]},
  path_updated:{nodes:[c.node],final:false},
  run_paused:{reason:'user'},
  run_resumed:{speed:1},
  run_finished:{status:'found',path:[c.node],metrics:{discoveredCount:1,expandedCount:0,selectionCount:1,frontierPeak:1,pathLength:0}},
  counterfactual_applied:{previousRunId:'prior',previousGridRevision:0,newGridRevision:1,change:{type:'block_cell',cell:{x:1,y:1}}},
  diagnosis_generated:{feedbackId:'feedback1',mode:'local',evidenceEventIds:[]},
  reflection_completed:{evidenceEventIds:['fixture:0'],explanation:'Synthetic test statement'}
};
test('all sixteen event branches accept their payload and reject missing/unknown fields',()=>{
  assert.deepEqual(Object.keys(payloads).sort(),read('contracts/event.schema.json').properties.type.enum.toSorted());
  for(const [type,payload] of Object.entries(payloads)) {
    assert(eventSchema({...expanded,type,payload}),type+': '+ajv.errorsText(eventSchema.errors));
    assert.equal(eventSchema({...expanded,type,payload:{...payload,unknownField:true}}),false,type);
    const missing={...payload};delete missing[Object.keys(missing)[0]];
    assert.equal(eventSchema({...expanded,type,payload:missing}),false,type);
  }
});
test('schema rejects private identity in feedback request and invalid versions',()=>{
  assert.equal(requestSchema({...example.request,email:'synthetic@example.invalid'}),false);
  assert.equal(requestSchema({...example.request,schemaVersion:99}),false);
  assert.equal(eventSchema({...expanded,algorithmVersion:'unknown'}),false);
});
test('evidence IDs are unique and correct count cannot exceed total',()=>{
  const duplicate=copy(example.request);duplicate.facts.events.push(copy(duplicate.facts.events[0]));
  assert.throws(()=>validateFeedbackRelations(duplicate,example.response));
  const excessive=copy(example.request);excessive.facts.correctCount=99;
  assert.throws(()=>validateFeedbackRelations(excessive,example.response));
});

test('README preserves the executable PowerShell wrapper path',()=>{
  const readme=readFileSync(new URL('../../README.md',import.meta.url),'utf8');
  const wrapper=['.','scripts','Invoke-ProjectNpm.ps1'].join(String.fromCharCode(92));
  assert(readme.includes(wrapper+' ci'),'README must contain the real install command');
  assert(readme.includes(wrapper+' run check'),'README must contain the real check command');
});
