/** AI-executed Edge checks, never a claim about human learners or physical devices. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {pathToFileURL} = require('node:url');
const ROOT = path.resolve(__dirname,'..');
const TEMP = path.join(ROOT,'.cache/ui-beginner-20261115');
fs.mkdirSync(TEMP,{recursive:true}); process.env.TEMP = process.env.TMP = TEMP;
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(ROOT,'.cache/playwright');
const {chromium} = require(path.join(ROOT,'PathLab-AI/node_modules/playwright-core'));
const AxeBuilder = require(path.join(ROOT,'PathLab-AI/node_modules/@axe-core/playwright')).default;
const target = path.join(ROOT,'PathLab_AI_v4_optimized_final.html');
const URL = pathToFileURL(target).href;
const results=[], checks=[];
const check=(name,actual,expected)=>{assert.deepEqual(actual,expected,name);checks.push({name,passed:true});};
const tags=['wcag2a','wcag2aa','wcag21aa','wcag22aa'];
async function axe(page,selector,name) {
 const result=await new AxeBuilder({page}).include(selector).withTags(tags).analyze();
 const violations=result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
 check(name,violations,[]);
}
async function stage(page,n){await page.locator('[data-pl-stage="'+n+'"]').click();}
async function count(page){return Number(await page.locator('#pl-progress-count').innerText());}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,downloadsPath:TEMP});
 try {
  for(const width of [1440,768,390,320]){
   const start=checks.length;
   const ctx=await browser.newContext({viewport:{width,height:1000},locale:'zh-CN',reducedMotion:'reduce',offline:true,acceptDownloads:true});
   try{
    const page=await ctx.newPage(),errors=[],network=[];
    page.on('pageerror',e=>errors.push(e.message)); page.on('request',r=>{if(/^https?:/i.test(r.url()))network.push(r.url());});
    await page.goto(URL); await page.locator('#pl-welcome-start').waitFor();
    check(width+' welcome opens',await page.locator('#welcome-overlay').evaluate(el=>el.open),true);
    await axe(page,'#welcome-overlay',width+' welcome axe');
    await page.keyboard.press('Escape');
    check(width+' welcome Escape closes',await page.locator('#welcome-overlay').evaluate(el=>el.open),false);
    check(width+' original stations retained',await page.locator('.route-card').count(),8);
    const oldStore=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>!['pathlab-visited','pathlab-theme','pathlab-coach-e037'].includes(k)).map(k=>[k,localStorage.getItem(k)])));
    check(width+' visits are not exercise completion',await count(page),0);
    await stage(page,4);await stage(page,3);await stage(page,2);await stage(page,1);await stage(page,0);
    check(width+' freely switching does not mark complete',await count(page),0);
    await page.locator('[data-pl-cell="3,2"]').click();check(width+' wall rejected',await page.locator('#pl-feedback').getAttribute('data-kind'),'wrong');
    await page.locator('[data-pl-cell="1,1"]').click();check(width+' diagonal rejected',await count(page),0);
    await page.locator('[data-pl-cell="1,2"]').click();check(width+' valid neighbor accepted',await count(page),1);
    await stage(page,1);await page.locator('#pl-f-input').fill('4');await page.locator('#pl-f-form button').click();check(width+' wrong sum rejected',await count(page),1);
    await page.locator('#pl-f-input').fill('6');await page.locator('#pl-f-form button').click();check(width+' correct sum accepted',await count(page),2);check(width+' formula updates visually',await page.locator('#pl-f-total').innerText(),'6');
    await stage(page,2);await page.locator('[data-pl-candidate="0"]').click();check(width+' wrong prediction explained',await page.locator('#pl-feedback').getAttribute('data-kind'),'wrong');check(width+' wrong prediction not passed',await count(page),2);
    await page.locator('[data-pl-candidate="1"]').click();check(width+' correct prediction accepted',await count(page),3);
    await stage(page,3);check(width+' final metrics not revealed before replay',await page.locator('.pl-compare').isHidden(),true);
    check(width+' replay question hidden before final',await page.locator('[data-pl-action="replay-check"][data-pl-answer="10"]').isHidden(),true);check(width+' replay cannot complete before final',await count(page),3);
    await page.locator('#pl-timeline').fill('15');check(width+' last frame selected',await page.locator('#pl-timeline-out').innerText(),'16/16');check(width+' original-engine final metrics shown',await page.locator('.pl-compare').isVisible(),true);
    await page.locator('[data-pl-action="replay-check"][data-pl-answer="15"]').click();check(width+' expansion count not mistaken for route length',await count(page),3);
    await page.locator('[data-pl-action="replay-check"][data-pl-answer="10"]').click();check(width+' correct replay distinction accepted',await count(page),4);
    await stage(page,4);for(let i=0;i<4;i++)await page.locator('input[name="pl-q-'+i+'"][value="0"]').check();
    await page.locator('#pl-quiz-form button').click();check(width+' partial quiz does not pass',await count(page),4);check(width+' detailed wrong explanations',await page.locator('.pl-quiz-result.wrong').count(),3);await axe(page,'#pl-coach',width+' wrong-answer report axe');
    for(const [i,v] of [1,0,2,1].entries())await page.locator('input[name="pl-q-'+i+'"][value="'+v+'"]').check();
    await page.locator('#pl-quiz-form button').click();check(width+' all correct quiz passes',await count(page),5);check(width+' first-attempt score retained',await page.locator('.pl-report').innerText().then(t=>t.includes('第一次检查答对 1 题')),true);await axe(page,'#pl-coach',width+' complete report dark axe');
    if(width===1440||width===390){await page.locator('.pl-report').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(TEMP,'verified-report-'+width+'.png')});}
    await page.locator('#pl-theme-toggle').click();await axe(page,'#pl-coach',width+' complete report light axe');await page.locator('#pl-theme-toggle').click();
    const downloadEvent=page.waitForEvent('download');await page.locator('[data-pl-action="export"]').click();const download=await downloadEvent;const downloaded=path.join(TEMP,'record-'+width+'.txt');await download.saveAs(downloaded);const exported=fs.readFileSync(downloaded,'utf8');check(width+' learning record exported on D drive',exported.includes('第一次检查：1/4')&&exported.includes('检查次数：2'),true);fs.unlinkSync(downloaded);
    const afterStore=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>!['pathlab-visited','pathlab-theme','pathlab-coach-e037'].includes(k)).map(k=>[k,localStorage.getItem(k)])));
    check(width+' original save storage unchanged',afterStore,oldStore);
    await page.locator('#pl-remember').check();check(width+' optional namespaced persistence',await page.evaluate(()=>JSON.parse(localStorage.getItem('pathlab-coach-e037')).done),[0,1,2,3]);
    await page.reload();check(width+' progress restored without quiz answers',await count(page),4);check(width+' quiz answers not persisted',await page.locator('#pl-quiz-form input:checked').count(),0);
    await page.locator('#pl-remember').uncheck();check(width+' disabling persistence deletes only own entry',await page.evaluate(()=>localStorage.getItem('pathlab-coach-e037')),null);
    for(const theme of ['dark','light']){
     if(theme==='light')await page.locator('#pl-theme-toggle').click();
     await axe(page,'.pl-toolbar',width+' '+theme+' toolbar axe');
     for(let n=0;n<5;n++){await stage(page,n);await axe(page,'#pl-coach',width+' '+theme+' lesson '+n+' axe');check(width+' '+theme+' lesson '+n+' no page overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);}
     for(const station of ['intro','life','pictures','video','primer','game','lab','playground']){
      await page.locator('[data-testid="nav-'+station+'"]').click();await page.locator('#view-'+station).waitFor();
      await axe(page,'#view-'+station,width+' '+theme+' station '+station+' axe');
      check(width+' '+theme+' station '+station+' no page overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
     }
     await page.locator('[data-testid="nav-home"]').click();
    }
    await page.locator('[data-testid="nav-lab"]').click();await page.locator('#pl-open-coach').click();check(width+' coach opens as dialog from a station',await page.locator('#pl-coach-dialog').evaluate(el=>el.open),true);
    await page.keyboard.press('Escape');check(width+' dialog closes on Escape',await page.locator('#pl-coach-dialog').evaluate(el=>el.open),false);check(width+' dialog restores opener focus',await page.locator('#pl-open-coach').evaluate(el=>el===document.activeElement),true);
    await page.locator('[data-testid="nav-home"]').click();await stage(page,0);await page.locator('#pl-coach').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(TEMP,'verified-light-'+width+'.png')});
    await page.locator('#pl-theme-toggle').click();await page.screenshot({path:path.join(TEMP,'verified-dark-'+width+'.png')});
    check(width+' no JS page errors',errors,[]);check(width+' no external requests',network,[]);
    results.push({width,passed:checks.length-start,pageErrors:errors,externalRequests:network});
   }finally{await ctx.close();}
  }
  // Storage failure is a supported offline browser state.
  const ctx=await browser.newContext({viewport:{width:390,height:844},offline:true});
  try{
   await ctx.addInitScript(()=>{for(const name of ['getItem','setItem','removeItem'])Storage.prototype[name]=()=>{throw new DOMException('blocked','SecurityError');};});
   const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(URL);await p.locator('#pl-welcome-skip').click();await stage(p,1);await p.locator('#pl-f-input').fill('6');await p.locator('#pl-f-form button').click();check('storage blocked: exercise still works',await count(p),1);await p.locator('#pl-theme-toggle').click();check('storage blocked: theme still works',await p.evaluate(()=>document.body.classList.contains('light-theme')),true);check('storage blocked: no JS errors',errors,[]);
  }finally{await ctx.close();}
  // Keyboard-only exercise and finite autoplay are checked separately from pointer tests.
  const keyboardContext=await browser.newContext({viewport:{width:390,height:844},offline:true,reducedMotion:'no-preference'});
  try{
   const p=await keyboardContext.newPage();await p.goto(URL);await p.locator('#pl-welcome-skip').click();
   await p.locator('[data-pl-cell="1,2"]').focus();await p.keyboard.press('Enter');check('keyboard neighbor uses Enter',await count(p),1);
   await stage(p,1);await p.locator('#pl-f-input').fill('6');await p.keyboard.press('Enter');check('keyboard sum submits with Enter',await count(p),2);
   await stage(p,2);await p.locator('[data-pl-candidate="1"]').focus();await p.keyboard.press('Space');check('keyboard candidate uses Space',await count(p),3);
   await stage(p,3);await p.locator('#pl-timeline').focus();await p.keyboard.press('End');check('keyboard timeline reaches final',await p.locator('#pl-timeline-out').innerText(),'16/16');
   await p.locator('[data-pl-action="play"]').click();await p.waitForFunction(()=>document.querySelector('#pl-timeline-out').textContent==='16/16',null,{timeout:22000});
   check('autoplay stops at actual final event',await p.locator('[data-pl-action="play"]').getAttribute('aria-pressed'),'false');check('watching autoplay is not exercise completion',await count(p),3);
   await p.locator('[data-pl-action="replay-start"]').click();await p.locator('[data-pl-action="play"]').click();await stage(p,0);await p.waitForTimeout(1300);await stage(p,3);check('changing stage cancels autoplay',await p.locator('#pl-timeline-out').innerText(),'1/16');
   await p.locator('#pl-timeline').fill('15');await p.screenshot({path:path.join(TEMP,'verified-replay-390.png')});
   await p.locator('[data-testid="nav-lab"]').click();await p.locator('#pl-open-coach').click();
   await axe(p,'#pl-coach-dialog','keyboard dialog axe');for(let i=0;i<8;i++)await p.keyboard.press('Tab');check('dialog Tab focus remains inside',await p.locator('#pl-coach-dialog').evaluate(el=>el.contains(document.activeElement)),true);
   await p.screenshot({path:path.join(TEMP,'verified-dialog-390.png')});await p.keyboard.press('Escape');check('dialog keyboard restores focus',await p.locator('#pl-open-coach').evaluate(el=>el===document.activeElement),true);
  }finally{await keyboardContext.close();}
  const record={date:'2026-11-15',executor:'AI',browser:await browser.version(),offline:true,physicalDevice:false,humanLearningValidation:false,target,sha256:crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'),passed:checks.length,results,checks};
  fs.mkdirSync(path.join(ROOT,'docs/evidence'),{recursive:true});fs.writeFileSync(path.join(ROOT,'docs/evidence/ui-beginner-20261115.json'),JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({passed:checks.length,results,browser:record.browser},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
