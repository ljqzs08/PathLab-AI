/** E037: byte-preservation and generated engine-data checks, AI executed. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {spawnSync,execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
// Optional run label keeps later verification separate from archived E037 evidence.
const RUN = process.env.PATHLAB_VERIFY_RUN;
if (RUN && !/^[a-z0-9-]+$/.test(RUN)) throw Error("Invalid verification run label");
const ROOT=path.resolve(__dirname,'..'),target=path.join(ROOT,'PathLab_AI_v4_optimized_final.html'),backup=path.join(ROOT,'output/backups/PathLab_AI_v4_optimized_final.before-ui-20261115.html');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),checks=[];
function check(name,actual,expected){assert.deepEqual(actual,expected,name);checks.push({name,passed:true});}
(async()=>{
 const originalBytes=fs.readFileSync(backup),targetBytes=fs.readFileSync(target),original=originalBytes.toString('utf8'),enhanced=targetBytes.toString('utf8');
 check('original backup exact bytes SHA256',sha(originalBytes),'79e49cc94e14118aa7228e1fdbd2446921d90c8fc39eb736cc508bf074ade0c4');
 const corrections=[
 ['h 只会“直线估计”','本课的 h 用横向差 + 纵向差估计，暂时忽略墙'],
 ['背后常常都是 A*。','都可以用寻路算法解决。这里用 A* 来认识这种思路。'],
 ['学会了！三句话记住 A*','先记住三句话，再换题检验'],
 ['恭喜你，已经弄懂 A* 最核心的想法了！','你已完成这一轮认识；是否能独立运用，还要换题检验。'],
 ['所以总是朝着终点走，不像笨办法到处乱试。','但不保证每一步都更靠近终点，遇到墙时可能先绕远。'],
 ['所以 A* 找到的一定是最短路线。','本页使用四方向、每步代价为 1 的地图与一致的曼哈顿估计，因此能找到最短路线；不能照搬到任意估计方法。']];
 const runtime=html=>[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)][0][1];
 let correctedRuntime=runtime(original);for(const [from,to]of corrections){check('explicit factual correction present: '+from,correctedRuntime.includes(from),true);correctedRuntime=correctedRuntime.replaceAll(from,to);}
 check('original React runtime untouched except six teaching-copy corrections',runtime(enhanced),correctedRuntime);
 const styles=html=>[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]);
 check('both original CSS blocks unchanged',styles(enhanced).slice(0,2),styles(original));
 const media=html=>runtime(html).split('\n')[0];
 check('all original embedded media byte-identical',media(enhanced),media(original));
 let expected=original;for(const [from,to]of corrections)expected=expected.replaceAll(from,to);
 expected=expected.replace(/<!-- 改进3：欢迎弹窗 -->[\s\S]*?<aside class="standalone-notice"/,'<!-- E037 welcome uses an accessible, optional native dialog. -->\n<aside class="standalone-notice"');
 expected=expected.replace(/<script>\s*\/\/ 改进：恢复用户之前的主题选择[\s\S]*?<\/script>/,'');
 const stripped=enhanced.replace(/\n<!-- E037:STYLE:START -->[\s\S]*?<!-- E037:STYLE:END -->\n/g,'').replace(/\n<!-- E037:SCRIPT:START -->[\s\S]*?<!-- E037:SCRIPT:END -->\n/g,'');
 check('whole HTML only adds scoped blocks and replaces documented welcome/theme/copy',stripped,expected);
 const data=JSON.parse(enhanced.match(/<script id="pl-coach-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 const {runAstar}=await import(pathToFileURL(path.join(ROOT,'PathLab-AI/src/domain/algorithms/astar.ts')).href);
 const {runBfs}=await import(pathToFileURL(path.join(ROOT,'PathLab-AI/src/domain/algorithms/bfs.ts')).href);
 const astar=runAstar(data.input),bfs=runBfs(data.input);
 check('A-star metrics from unchanged engine',data.astar,astar.metrics);check('BFS metrics from unchanged engine',data.bfs,bfs.metrics);check('final route from unchanged engine',data.path,astar.path);
 check('16 actual selections, not invented animation frames',data.frames.map(f=>f.selected),astar.events.filter(e=>e.type==='node_selected').map(e=>e.payload));
 check('replay frontier follows f/h/entrySequence priority',data.frames.every(f=>{const best=[...f.frontier].sort((a,b)=>a.f-b.f||a.h-b.h||a.entrySequence-b.entrySequence)[0];return best&&best.node.x===f.selected.node.x&&best.node.y===f.selected.node.y;}),true);
 check('same shortest length, unequal work in this example only',[data.astar.pathLength,data.bfs.pathLength,data.astar.expandedCount,data.bfs.expandedCount],[10,10,15,31]);
 check('existing Next application tracked files unchanged',execFileSync('git',['diff','--name-only','51d1616','--','PathLab-AI'],{cwd:ROOT,encoding:'utf8'}).trim(),'');
 const built=spawnSync(process.execPath,['--experimental-strip-types',path.join(ROOT,'scripts/enhance-standalone-ui.mjs'),'--check'],{cwd:ROOT,encoding:'utf8'});check('final HTML reproducible and enhancement idempotent',built.status,0);
 const unit=spawnSync(process.execPath,['--experimental-strip-types','--test',...fs.readdirSync(path.join(ROOT,'PathLab-AI/tests')).filter(n=>n.endsWith('.test.mjs')).map(n=>path.join(ROOT,'PathLab-AI/tests',n))],{cwd:path.join(ROOT,'PathLab-AI'),encoding:'utf8',maxBuffer:8*1024*1024});
 check('original 171 Node tests pass',unit.status,0);check('actual original unit-test totals',unit.stdout.includes('tests 171')&&unit.stdout.includes('pass 171')&&unit.stdout.includes('fail 0'),true);
 const record={date:'2026-11-15',executor:'AI',baseline:'51d1616',target,original:{bytes:originalBytes.length,sha256:sha(originalBytes)},enhanced:{bytes:targetBytes.length,sha256:sha(targetBytes)},passed:checks.length,nodeTests:{passed:171,failed:0,summary:unit.stdout.split(/\r?\n/).filter(l=>/tests |suites |pass |fail |cancelled |skipped |todo |duration_ms /.test(l)).slice(-8)},checks};
 fs.writeFileSync(path.join(ROOT, RUN ? 'docs/evidence/' + RUN + '-preservation.json' : 'docs/evidence/ui-preservation-20261115.json'),JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({passed:checks.length,nodeTests:record.nodeTests,sha256:record.enhanced.sha256},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
