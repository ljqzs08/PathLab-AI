/** Package-targeted AI smoke and formal screenshots, not a claim to full historical regression. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'..'),TMP=path.join(ROOT,'.cache/submission-latest-20261115');
process.env.TEMP=process.env.TMP=TMP;
const {chromium}=require(path.join(ROOT,'PathLab-AI/node_modules/playwright-core'));
const OUT=path.join(ROOT,'docs/assets/submission-20261115');fs.mkdirSync(OUT,{recursive:true});
const file=path.join(ROOT,'delivery/PathLab-AI-参赛文件-最新版-20261115/04-完整材料解压版/03-离线体验/PathLab_AI_v4_optimized_final.html');
const checks=[],shots=[];function check(name,actual,expected){assert.deepEqual(actual,expected,name);checks.push({name,passed:true});}
async function shot(page,name){await page.screenshot({path:path.join(OUT,name+'.png')});shots.push(name+'.png');}
async function station(page,id){await page.evaluate(v=>{location.hash=v},id);await page.locator('#view-'+id).waitFor({state:'visible'});await page.evaluate(()=>scrollTo(0,0));}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,downloadsPath:TMP});const version=browser.version();
try{for(const width of [1440,768,390,320]){
const ctx=await browser.newContext({viewport:{width,height:1000},offline:true,locale:'zh-CN',reducedMotion:'reduce'});
const page=await ctx.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
await page.goto(pathToFileURL(file).href);await page.locator('#pl-open-coach').waitFor();
if(await page.locator('#welcome-overlay').evaluate(el=>el.open))await page.keyboard.press('Escape');
check(width+' eight station cards',await page.locator('.route-card').count(),8);
if(width===1440)await shot(page,'01-home');
for(const id of ['intro','life','pictures','video','primer','game','lab','playground']){
 await station(page,id);check(width+' '+id+' station visible',await page.locator('#view-'+id).isVisible(),true);
 check(width+' '+id+' no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 if(width===1440&&['intro','pictures','primer','lab','playground'].includes(id))await shot(page,'02-'+id);
}
await page.locator('#pl-open-coach').click();check(width+' coach modal',await page.locator('#pl-coach-dialog').evaluate(el=>el.open),true);
for(let i=0;i<5;i++){await page.locator('[data-pl-stage="'+i+'"]').click();check(width+' coach stage '+i,await page.locator('[data-pl-stage="'+i+'"]').getAttribute('aria-current'),'step');}
await page.locator('[data-pl-stage="3"]').click();await page.locator('#pl-timeline').fill('15');check(width+' real engine replay metrics',await page.locator('.pl-compare').isVisible(),true);
if(width===1440)await shot(page,'03-coach-replay');await page.keyboard.press('Escape');
await page.locator('#pl-open-review').click();check(width+' review modal',await page.locator('#pl-review-dialog').evaluate(el=>el.open),true);
check(width+' learning template available',(await page.locator('#pl-review-preview').inputValue()).length>40,true);
if(width===1440)await shot(page,'04-review-learning');if(width===390)await shot(page,'07-mobile-review');
await page.keyboard.press('Escape');await station(page,'lab');await page.getByTestId('mission-L01').click();await page.getByLabel('本关算法').selectOption('bfs');await page.getByRole('button',{name:'开始预测',exact:true}).click();
let reached=false;for(let i=0;i<110;i++){const s=await page.getByTestId('learning-workbench').getAttribute('data-state');if(s==='reflection'){reached=true;break}if(s==='prediction'){await page.locator('[data-testid^="candidate-"]').first().click();await page.getByTestId('submit-prediction').click()}else{assert.equal(s,'paused');await page.getByTestId('step').click()}}
check(width+' L01 reaches reflection',reached,true);check(width+' original preview uses real facts',(await page.getByTestId('web-review-preview').inputValue()).includes('[F1]'),true);
if(width===1440){await page.getByTestId('web-review').scrollIntoViewIfNeeded();await shot(page,'05-original-reflection')}
await page.locator('#pl-open-review').click();check(width+' learning mode not silently switched',(await page.locator('#pl-review-preview').inputValue()).length>40,true);await page.keyboard.press('Escape');
await station(page,'home');if(width===390)await shot(page,'06-mobile-home');
check(width+' no JavaScript errors',errors,[]);check(width+' no automatic external requests',requests,[]);await ctx.close();
}
const evidence={date:'2026-11-15',executor:'AI automated browser operation',browser:'Windows Edge '+version,mode:'headless file:// offline, four simulated viewports; not human or physical-device acceptance',target:file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),passed:checks.length,checks,screenshots:shots,scope:'Targeted packaged-copy smoke, station navigation, five-step coach, replay, learning helper and BFS L01; not rerun of all historical test suites'};
fs.writeFileSync(path.join(ROOT,'docs/evidence/latest-submission-browser-20261115.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({passed:checks.length,screenshots:shots.length,browser:version}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
