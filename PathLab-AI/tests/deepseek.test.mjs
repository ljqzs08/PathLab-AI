import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeepSeekHandler } from '../src/server/deepseek.ts';
import { validateRemoteRequest, validateRemoteFeedback } from '../src/domain/learning/feedback-validation.ts';
// Synthetic protocol data, not a human learning record or a real provider response.
const facts = {schemaVersion:1,levelId:'L01',algorithm:'bfs',runId:'synthetic-run',gridRevision:0,requestedHintLevel:4,answerRevealed:true,facts:{predictionCount:1,correctCount:1,candidateErrorTypes:[],events:[{eventId:'synthetic-finish',type:'run_finished',description:'合成验证：本次运行结束，路径步数 2，扩展节点 3。'}]}};
const feedback = {schemaVersion:1,mode:'remote',summary:'合成反馈，仅引用给定事实。',primaryErrorType:null,evidence:[{eventId:'synthetic-finish',factPath:'/facts/events/0/description'}],hintLevel:4,nextQuestion:'哪条事实支持你的解释？',recommendation:'比较实际结果。',insufficientEvidence:true};
const origin='http://127.0.0.1:3000';
const env={AI_ENABLED:'true',AI_API_KEY:'synthetic-provider-key-not-real',AI_ACCESS_TOKEN:'synthetic-access-token-not-real-123456',AI_ALLOWED_ORIGIN:origin};
const req=(body=facts,headers={},signal)=>new Request(origin+'/api/feedback',{method:'POST',headers:{origin,'content-type':'application/json',authorization:'Bearer '+env.AI_ACCESS_TOKEN,'x-pathlab-consent':'minimal-facts-v1',...headers},body:typeof body==='string'?body:JSON.stringify(body),...(signal?{signal}:{})});
const model=(value=feedback,reason='stop')=>Response.json({choices:[{finish_reason:reason,message:{content:typeof value==='string'?value:JSON.stringify(value)}}]});
const copy=value=>structuredClone(value);
const never=async()=>{assert.fail('must not contact provider');};

test('disabled and incomplete config fail closed without using provider',async()=>{
  for(const config of [{},{...env,AI_ENABLED:'false'},{...env,AI_API_KEY:''},{...env,AI_ACCESS_TOKEN:'short'},{...env,AI_ACCESS_TOKEN:env.AI_API_KEY},{...env,AI_TIMEOUT_MS:'NaN'},{...env,AI_MAX_REQUESTS:'0'},{...env,AI_BASE_URL:'http://127.0.0.1'},{...env,AI_MODEL:'invented-model'},{...env,AI_ALLOWED_ORIGIN:origin+'/path'}]) {
    const r=await createDeepSeekHandler(()=>config,never)(req()); assert.equal(r.status,503); assert.equal(r.headers.get('cache-control'),'no-store');
  }
});
for(const [name,headers,code] of [
  ['missing token',{authorization:''},401],['wrong token',{authorization:'Bearer wrong'},401],
  ['cross origin',{origin:'https://evil.invalid'},403],['opaque origin',{origin:'null'},403],
  ['cross site',{'sec-fetch-site':'cross-site'},403],['no consent',{'x-pathlab-consent':''},400],
  ['not json',{'content-type':'text/plain'},400],
])test('reject '+name,async()=>assert.equal((await createDeepSeekHandler(()=>env,never)(req(facts,headers))).status,code));

test('success uses fixed HTTPS, bounded non-thinking JSON, minimum facts, and trusted provenance',async()=>{
  let calls=0;
  const handler=createDeepSeekHandler(()=>env,async(url,options)=>{
    calls++;assert.equal(url,'https://api.deepseek.com/chat/completions');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');
    assert.equal(options.headers.Authorization,'Bearer '+env.AI_API_KEY);
    const b=JSON.parse(options.body);assert.equal(b.model,'deepseek-flash');assert.equal(b.max_tokens,1600);assert.equal(b.stream,false);assert.equal(b.thinking.type,'disabled');assert.equal(b.response_format.type,'json_object');
    assert.deepEqual(JSON.parse(b.messages[1].content),facts);assert.ok(b.messages[0].content.includes('json'));
    assert.ok(!options.body.includes(env.AI_ACCESS_TOKEN));assert.ok(!options.body.includes(env.AI_API_KEY));
    return model({...feedback,mode:'local'});
  });
  const r=await handler(req());assert.equal(r.status,200);const value=await r.json();assert.equal(value.feedback.mode,'remote');assert.equal(value.runId,facts.runId);assert.equal(value.gridRevision,0);assert.equal(calls,1);
});
for (const [name,mutate] of [
 ['unrevealed',v=>{v.answerRevealed=false;}],['unknown credential',v=>{v.apiKey='secret';}],
 ['free text',v=>{v.facts.explanation='private text';}],['unbounded identifier',v=>{v.runId='x'.repeat(101);}],
 ['invalid counts',v=>{v.facts.correctCount=2;}],['no completed run',v=>{v.facts.events=[];}],
 ['duplicate events',v=>{v.facts.events.push(copy(v.facts.events[0]));}],['reflection text event',v=>{v.facts.events.push({eventId:'reflection',type:'reflection_completed',description:'private'});}],
]) test('request validation: '+name,async()=>{const value=copy(facts);mutate(value);assert.throws(()=>validateRemoteRequest(value));assert.equal((await createDeepSeekHandler(()=>env,never)(req(value))).status,400);});
for(const [name,mutate] of [
 ['invented event',v=>{v.evidence[0].eventId='other';}],['mismatched index',v=>{v.evidence[0].factPath='/facts/events/1/description';}],
 ['arbitrary path',v=>{v.evidence[0].factPath='/facts/correctCount';}],['invented diagnosis',v=>{v.primaryErrorType='only_goal_distance';v.insufficientEvidence=false;}],
 ['missing evidence for claim',v=>{v.insufficientEvidence=false;v.evidence=[];}],['unknown field',v=>{v.extra='x';}],
 ['invalid hint',v=>{v.hintLevel=5;}],['oversized prose',v=>{v.summary='x'.repeat(501);}],
])test('response validation: '+name,async()=>{const value=copy(feedback);mutate(value);assert.throws(()=>validateRemoteFeedback(facts,value));const r=await createDeepSeekHandler(()=>env,async()=>model(value))(req());assert.equal(r.status,502);assert.deepEqual(await r.json(),{status:'invalid_feedback'});});

test('hint escalation and insufficient-evidence label are rejected',()=>{
 assert.throws(()=>validateRemoteFeedback({...facts,requestedHintLevel:1},feedback));
 assert.throws(()=>validateRemoteFeedback({...facts,facts:{...facts.facts,candidateErrorTypes:['misunderstand_queue_order']}},{...feedback,primaryErrorType:'misunderstand_queue_order'}));
});
for(const [name,make] of [
 ['http error',()=>new Response('SECRET_PROVIDER_ERROR',{status:429})],['bad envelope',()=>new Response('not json')],
 ['empty content',()=>model('')],['malformed content',()=>model('{oops')],['truncated output',()=>model(feedback,'length')],
 ['oversized response',()=>new Response('x'.repeat(32769))],['oversized multibyte response',()=>new Response('中'.repeat(11000))],
])test('provider failure safely falls back: '+name,async()=>{let calls=0;const r=await createDeepSeekHandler(()=>env,async()=>{calls++;return make();})(req());assert.equal(r.status,502);assert.ok(!(await r.text()).includes('SECRET'));assert.equal(calls,1);});

test('limits request bytes even without content-length',async()=>{
 for(const body of ['x'.repeat(32769),'中'.repeat(11000),'{oops'])assert.equal((await createDeepSeekHandler(()=>env,never)(req(body))).status,400);
});
test('single in-flight slot, cooldown, and process budget include failed attempts',async()=>{
 let clock=0,release;const gate=new Promise(r=>{release=r;});let calls=0;
 const handler=createDeepSeekHandler(()=>({...env,AI_MAX_REQUESTS:'2'}),async()=>{calls++;await gate;return new Response('',{status:500});},()=>clock);
 const first=handler(req());assert.equal((await handler(req())).status,429);release();assert.equal((await first).status,502);
 assert.equal((await handler(req())).status,429);clock=10001;assert.equal((await handler(req())).status,502);clock=20002;
 assert.equal((await handler(req())).status,429);assert.equal(calls,2);
});
test('provider timeout aborts without retry or provider details',async()=>{
 let calls=0;const timer=setTimeout(()=>{},2000);
 try {const r=await createDeepSeekHandler(()=>({...env,AI_TIMEOUT_MS:'1000'}),async(_url,options)=>{calls++;await new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('SECRET')), {once:true}));})(req());assert.equal(r.status,502);assert.equal((await r.json()).status,'cancelled_or_timeout');assert.equal(calls,1);}finally{clearTimeout(timer);}
});
test('timeout also bounds a stalled response stream',async()=>{
 let cancelled=false;const timer=setTimeout(()=>{},2000);
 try {const r=await createDeepSeekHandler(()=>({...env,AI_TIMEOUT_MS:'1000'}),async()=>new Response(new ReadableStream({cancel(){cancelled=true;}})))(req());assert.equal((await r.json()).status,'cancelled_or_timeout');assert.equal(cancelled,true);}finally{clearTimeout(timer);}
});
test('caller abort releases slot, and no real network is used',async()=>{
 const control=new AbortController();control.abort();assert.equal((await createDeepSeekHandler(()=>env,never)(req(facts,{},control.signal))).status,400);
});

test('network exception is unavailable, not a validated answer; details stay server-side',async()=>{
 const r=await createDeepSeekHandler(()=>env,async()=>{throw new Error('SECRET_NETWORK_DETAILS');})(req());
 assert.equal(r.status,502);assert.deepEqual(await r.json(),{status:'provider_unavailable'});
});
