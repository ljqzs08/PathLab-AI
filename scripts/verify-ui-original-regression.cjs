/** Reuse the original browser tests against the explicitly selected enhanced HTML. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),APP=path.join(ROOT,'PathLab-AI'),TEMP=path.join(ROOT,'.cache/ui-original-regression-20261115');
fs.mkdirSync(TEMP,{recursive:true});process.env.TEMP=process.env.TMP=TEMP;
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(ROOT,'.cache/playwright');
const made=[];
try{
 for(const folder of ['browser','standalone']){
  const dir=path.join(APP,'tests',folder);
  for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.spec.ts')&&!n.startsWith('e037-')&&!n.includes('.temp.'))){
   const src=path.join(dir,name),out=path.join(dir,'e037-'+name);if(fs.existsSync(out))throw Error('Do not overwrite '+out);
   let text=fs.readFileSync(src,'utf8');
   // Our additive enhancement uses the original runtime + JSON data + new interaction script.
   // This one intentional structural expectation is adapted; no behavioral assertion is weakened.
   if(folder==='standalone'&&name==='offline.spec.ts')text=text.replace("page.locator('script:not([src])').count()).toBe(1)","page.locator('script:not([src])').count()).toBe(3)");
   text=text.replaceAll('await browser.newContext(', 'await e037Context(browser,');
   if(folder==='standalone'&&name==='offline.spec.ts')text=text.replace("const cache = resolve(dirname(html), '..', '.cache');",'const cache = '+JSON.stringify(TEMP)+';');
   text+='\nasync function e037Context(browser, options) { const ctx = await browser.newContext(options); await ctx.addInitScript(() => { const showModal = HTMLDialogElement.prototype.showModal; HTMLDialogElement.prototype.showModal = function() { if (this.id !== "welcome-overlay") return showModal.call(this); }; }); return ctx; }\n';
   text+='\n// E037 harness only: dismiss optional first-visit welcome in existing tests.\ntest.beforeEach(async ({ context }) => { await context.addInitScript(() => { const showModal = HTMLDialogElement.prototype.showModal; HTMLDialogElement.prototype.showModal = function() { if (this.id !== "welcome-overlay") return showModal.call(this); }; }); });\n';
   fs.writeFileSync(out,text);made.push(out);
  }
 }
 const config=path.join(TEMP,'playwright.config.cjs');
 fs.writeFileSync(config,
  'const {defineConfig}=require('+JSON.stringify(path.join(APP,'node_modules/@playwright/test'))+');\n'+
  'const {pathToFileURL}=require("node:url");\n'+
  'process.env.PATHLAB_TEST_URL=pathToFileURL('+JSON.stringify(path.join(ROOT,'PathLab_AI_v4_optimized_final.html'))+').href;\n'+
  'module.exports=defineConfig('+JSON.stringify({testDir:path.join(APP,'tests'),testMatch:'**/e037-*.spec.ts',outputDir:path.join(TEMP,'results'),fullyParallel:false,workers:1,retries:0,reporter:[['line'],['json',{outputFile:path.join(TEMP,'results.json')}]],use:{browserName:'chromium',channel:'msedge',locale:'zh-CN',reducedMotion:'reduce',colorScheme:'dark',offline:true,screenshot:'off',video:'off',trace:'off'},projects:[{name:'desktop-1440',use:{viewport:{width:1440,height:1000}}},{name:'tablet-768',use:{viewport:{width:768,height:1024},hasTouch:true}},{name:'mobile-390',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}},{name:'narrow-320',use:{viewport:{width:320,height:860},isMobile:true,hasTouch:true}}]})+');\n');
 const result=spawnSync(process.execPath,[path.join(APP,'node_modules/@playwright/test/cli.js'),'test','--config',config,...process.argv.slice(2)],{cwd:ROOT,env:process.env,stdio:'inherit'});
 const report = JSON.parse(fs.readFileSync(path.join(TEMP,'results.json'),'utf8'));
 const tests = [];
 function collect(suite) {
  for (const spec of suite.specs||[]) for (const test of spec.tests||[]) tests.push({title:spec.title,project:test.projectName,status:test.status,results:test.results.map(run=>({status:run.status,durationMs:run.duration,errors:(run.errors||[]).map(e=>e.message.replace(/\u001b\[[0-9;]*m/g,''))}))});
  for (const child of suite.suites||[]) collect(child);
 }
 collect(report);
 const evidenceFile=path.join(ROOT,'docs/evidence/ui-original-regression-20261115.json');
 const evidence=fs.existsSync(evidenceFile)?JSON.parse(fs.readFileSync(evidenceFile,'utf8')):{date:'2026-11-15',executor:'AI',offline:true,physicalDevice:false,humanLearningValidation:false,target:path.join(ROOT,'PathLab_AI_v4_optimized_final.html'),browserChannel:'msedge'};
 const run={sha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(ROOT,'PathLab_AI_v4_optimized_final.html'))).digest('hex'),stats:report.stats,tests};
 if(process.argv.length>2){(evidence.targetedRuns??=[]).push(run);}else{evidence.finalRun=run;}
 fs.mkdirSync(path.dirname(evidenceFile),{recursive:true});fs.writeFileSync(evidenceFile,JSON.stringify(evidence,null,2)+'\n');
 process.exitCode=result.status??1;
}finally{
 for(const file of made){if(!path.resolve(file).startsWith(APP+path.sep)||!path.basename(file).startsWith('e037-'))throw Error('Unsafe cleanup');fs.unlinkSync(file);}
}
