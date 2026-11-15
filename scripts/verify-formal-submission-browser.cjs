/** E040 exact ZIP extraction smoke. AI headless offline, not human/device acceptance. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'..'),TMP=path.join(ROOT,'.cache/formal-submission-20261115'),SAMPLE=path.join(TMP,'zip-extracted');
process.env.TEMP=process.env.TMP=TMP;
const {chromium}=require(path.join(ROOT,'PathLab-AI/node_modules/playwright-core'));
const checks=[],metadata=[],html='03-离线体验/PathLab_AI_v4_optimized_final.html';
function check(name,actual,expected){assert.deepEqual(actual,expected,name);checks.push({name,passed:true});}
async function station(page,id){await page.evaluate(v=>{location.hash=v},id);await page.locator('#view-'+id).waitFor({state:'visible'});await page.evaluate(()=>scrollTo(0,0));}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true,downloadsPath:TMP});
try{for(const width of [1440,768,390,320]){
 const ctx=await browser.newContext({viewport:{width,height:1000},locale:'zh-CN',offline:true,reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
 await page.goto(pathToFileURL(path.join(SAMPLE,'00-打开最新参赛材料.html')).href);
 check(width+' portal single current work',await page.getByRole('link',{name:'打开最新离线作品',exact:true}).count(),1);
 check(width+' portal no overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 if(width===1440||width===390)await page.screenshot({path:path.join(TMP,`portal-${width}.png`)});
 await page.getByRole('link',{name:'开发过程证据',exact:true}).click();
 check(width+' evidence navigation heading',await page.locator('h1').innerText(),'开发过程证据导航');
 check(width+' evidence has three core and two supplement guides',await page.locator('.card a').count(),5);
 await page.getByRole('link',{name:'查看七张原始拍屏',exact:true}).click();
 await page.locator('img').evaluateAll(list=>list.forEach(i=>{i.loading='eager'}));
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));
 check(width+' all original gallery photos',await page.locator('img').count(),7);
 check(width+' gallery no overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 await page.goto(pathToFileURL(path.join(SAMPLE,html)).href);await page.locator('#pl-open-coach').waitFor();
 if(await page.locator('#welcome-overlay').evaluate(el=>el.open))await page.keyboard.press('Escape');
 check(width+' eight station cards',await page.locator('.route-card').count(),8);
 check(width+' final HTML no overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 for(const id of ['intro','life','pictures','video','primer','game','lab','playground']){await station(page,id);check(width+' station '+id,await page.locator('#view-'+id).isVisible(),true);}
 await station(page,'lab');await page.locator('#pl-open-coach').click();
 check(width+' coach opened',await page.locator('#pl-coach-dialog').evaluate(e=>e.open),true);
 check(width+' coach five steps',await page.locator('[data-pl-stage]').count(),5);
 await page.locator('[data-pl-stage="3"]').click();await page.locator('#pl-timeline').fill('15');
 check(width+' engine comparison visible',await page.locator('.pl-compare').isVisible(),true);
 await page.keyboard.press('Escape');await page.locator('#pl-open-review').click();
 check(width+' review opened',await page.locator('#pl-review-dialog').evaluate(e=>e.open),true);
 check(width+' local learning prompt exists',(await page.locator('#pl-review-preview').inputValue()).length>40,true);
 await page.keyboard.press('Escape');
 if(width===390)await page.screenshot({path:path.join(TMP,'work-390.png')});
 check(width+' no JavaScript errors',errors,[]);check(width+' no automatic network requests',requests,[]);await ctx.close();
}
 const ctx=await browser.newContext({offline:true,viewport:{width:1440,height:1000}}),page=await ctx.newPage();
 const files=['01-产品演示-H264.mp4','02-历史聊天回看-H264.mp4','03-改版聊天回看-H264.mp4'];
 const harness=path.join(TMP,'video-player.html');fs.writeFileSync(harness,'<!doctype html><meta charset="utf-8">'+files.map((f,i)=>`<video id="v${i}" muted controls preload="metadata" src="${pathToFileURL(path.join(SAMPLE,'07-演示视频',f)).href}"></video>`).join(''));
 await page.goto(pathToFileURL(harness).href);await page.waitForFunction(()=>Array.from(document.querySelectorAll('video')).every(v=>v.readyState>=1),null,{timeout:60000});
 for(let i=0;i<files.length;i++){
  const v=page.locator('#v'+i),m=await v.evaluate(async e=>{e.muted=true;await e.play();return{width:e.videoWidth,height:e.videoHeight,duration:e.duration}});
  await page.waitForFunction(id=>{const e=document.getElementById(id);return e.currentTime>.15&&e.getVideoPlaybackQuality().totalVideoFrames>0},'v'+i,{timeout:30000});
  await v.evaluate(e=>e.pause());check(files[i]+' dimensions',[m.width,m.height],i===0?[960,544]:[1280,720]);
  check(files[i]+' native duration',Math.abs(m.duration-[243.1,36.033,18.933][i])<0.15,true);
  check(files[i]+' brief frames decoded',await v.evaluate(e=>e.getVideoPlaybackQuality().totalVideoFrames>0),true);metadata.push({file:files[i],...m,playedBriefly:true});
 }
 await ctx.close();
 const result={date:'2026-11-15',executor:'AI automated browser',browser:'Windows Edge '+browser.version(),mode:'headless file:// offline at 1440/768/390/320 simulated widths',passed:checks.length,checks,metadata,htmlSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(SAMPLE,html))).digest('hex'),sampledZipSha256:JSON.parse(fs.readFileSync(path.join(ROOT,'docs/evidence/formal-submission-first-package-20261115.json'),'utf8')).zipSha256,scope:'Extracted formal packet portal, core guides navigation, seven-photo loading, eight stations, coach/replay, local review prompt, three H264 metadata+brief frame playback. No full product regression, audio listening, complete video content review, external login/API, human/device or teaching-effect acceptance.'};
 fs.writeFileSync(path.join(ROOT,'docs/evidence/formal-submission-browser-20261115.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:checks.length,browser:browser.version(),metadata}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
